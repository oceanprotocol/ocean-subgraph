import { RangeDecoder } from './range-decoder';
import { OutWindow } from './out-window';
import { BitTreeDecoder } from './bit-tree-decoder';
import { LenDecoder } from './len-decoder';
import { LZMA } from './lzma';

/**
 * LZMA Decoder
 * @author Nidin Vinayakan
 */
export class LzmaDecoder {
    //Public
    public markerIsMandatory: boolean
    public rangeDec: RangeDecoder //RangeDecoder
    public outWindow: OutWindow //OutWindow
    public lc: i32
    public pb: i32
    public lp: u8 
    public dictSize: u32 
    public dictSizeInProperties: u32 

    //Private
    private litProbs: Uint16Array

    private posSlotDecoder: Array<BitTreeDecoder>
    private alignDecoder: BitTreeDecoder
    private posDecoders: Uint16Array

    private isMatch: Uint16Array
    private isRep: Uint16Array
    private isRepG0: Uint16Array
    private isRepG1: Uint16Array
    private isRepG2: Uint16Array
    private isRep0Long: Uint16Array

    private lenDecoder: LenDecoder
    private repLenDecoder: LenDecoder

    constructor() {
        this.posSlotDecoder = BitTreeDecoder.constructArray(6, LZMA.kNumLenToPosStates) //6
        this.alignDecoder = new BitTreeDecoder(LZMA.kNumAlignBits)
        this.posDecoders = new Uint16Array(1 + LZMA.kNumFullDistances - LZMA.kEndPosModelIndex)

        this.isMatch = new Uint16Array(LZMA.kNumStates << LZMA.kNumPosBitsMax)
        this.isRep = new Uint16Array(LZMA.kNumStates)
        this.isRepG0 = new Uint16Array(LZMA.kNumStates)
        this.isRepG1 = new Uint16Array(LZMA.kNumStates)
        this.isRepG2 = new Uint16Array(LZMA.kNumStates)
        this.isRep0Long = new Uint16Array(LZMA.kNumStates << LZMA.kNumPosBitsMax)

        this.lenDecoder = new LenDecoder()
        this.repLenDecoder = new LenDecoder()
        this.rangeDec = new RangeDecoder()
        this.outWindow = new OutWindow()
    }

    public init(): void {
        this.initLiterals()
        this.initDist()

        LZMA.INIT_PROBS(this.isMatch)
        LZMA.INIT_PROBS(this.isRep)
        LZMA.INIT_PROBS(this.isRepG0)
        LZMA.INIT_PROBS(this.isRepG1)
        LZMA.INIT_PROBS(this.isRepG2)
        LZMA.INIT_PROBS(this.isRep0Long)

        this.lenDecoder.init()
        this.repLenDecoder.init()
    }

    public create(): void {
        this.outWindow.create(this.dictSize)
        this.createLiterals()
    }
    
    @inline
    private createLiterals(): void {
        this.litProbs = new Uint16Array(0x300 << (this.lc + this.lp))
    }

    @inline
    private initLiterals(): void {
        var num: i32 = 0x300 << (this.lc + this.lp) 
        for (var i: i32 = 0; i < num; i++) {
            this.litProbs.__unchecked_set(i, LZMA.PROB_INIT_VAL)
        }
    }

    @inline
    private decodeLiteral(state:u16, rep0:u32): void {
        var prevByte:u32 = 0
        if (!this.outWindow.isEmpty()) prevByte = this.outWindow.getByte(1)

        var symbol:u16 = 1
        var litState:u32 =
            ((this.outWindow.totalPos & ((1 << this.lp) - 1)) << this.lc) +
            (prevByte >>> (8 - this.lc))
        var probsOffset: i32 = (0x300 * litState) | 0

        if (state >= 7) {
            let matchByte = this.outWindow.getByte(rep0 + 1)
            do {
                let matchBit = (matchByte >>> 7) & 1
                matchByte <<= 1
                let bit = this.rangeDec.decodeBit(
                    this.litProbs,
                    probsOffset + ((1 + matchBit) << 8) + symbol,
                )
                symbol = (symbol << 1) | bit
                if (matchBit != bit) break
            } while (symbol < 0x100)
        }
        while (symbol < 0x100) {
            symbol =
                (symbol << 1) |
                this.rangeDec.decodeBit(this.litProbs, probsOffset + symbol)
        }
        this.outWindow.putByte(<u8>(symbol - 0x100))
    }

    private decodeDistance(len: i32): u32 {
        var lenState: u32 = <u32>len 
        if (lenState > LZMA.kNumLenToPosStates - 1) lenState = LZMA.kNumLenToPosStates - 1

        var posSlot:u32 = this.posSlotDecoder[lenState].decode(this.rangeDec) 
        if (posSlot < 4) return posSlot

        var numDirectBits:u32 = (posSlot >>> 1) - 1 
        var dist:u32 = (2 | (posSlot & 1)) << numDirectBits 
        if (posSlot < LZMA.kEndPosModelIndex) {
            dist += LZMA.BitTreeReverseDecode(
                this.posDecoders,
                numDirectBits,
                this.rangeDec,
                dist - posSlot,
            )
        } else {
            dist +=
                this.rangeDec.decodeDirectBits(numDirectBits - LZMA.kNumAlignBits) << LZMA.kNumAlignBits
            dist += this.alignDecoder.reverseDecode(this.rangeDec)
        }
        return dist
    }

    @inline
    private initDist(): void {
        for (var i:u32 = 0; i < LZMA.kNumLenToPosStates; i++) {
            this.posSlotDecoder[i].init()
        }
        this.alignDecoder.init()
        LZMA.INIT_PROBS(this.posDecoders)
    }

    @inline
    public decodeProperties(properties: Uint8Array): void {
        var prop = new Uint8Array(4)
        var p0 = properties.__unchecked_get(0)
        prop.__unchecked_set(0, p0)
        if (p0 >= 9 * 5 * 5) {
            throw 1
            // throw 'Incorrect LZMA properties'
        }
        var p1 = p0 % 9
        prop.__unchecked_set(1, p1)
        p0 /= 9
        prop.__unchecked_set(0, p0)
        var p2 = p0 / 5
        var p3 = p0 % 5
        
        prop.__unchecked_set(2, p2)
        prop.__unchecked_set(3, p3)

        this.lc = p1
        this.pb = p2
        this.lp = p3

        this.dictSizeInProperties = 0
        for (var i: u32 = 0; i < 4; i++) {
            this.dictSizeInProperties |= <u32>properties.__unchecked_get(i + 1) << (8 * i)
        }
        this.dictSize = this.dictSizeInProperties

        if (this.dictSize < LZMA.LZMA_DIC_MIN) {
            this.dictSize = LZMA.LZMA_DIC_MIN
        }
    }

    @inline
    private updateState_Literal(state: u8): u8 {
        if (state < 4) return 0
        else if (state < 10) return state - 3
        else return state - 6
    }

    @inline
    private updateState_ShortRep(state: u8): u8 {
        return state < 7 ? 9 : 11
    }

    @inline
    private updateState_Rep(state: u8): u8 {
        return state < 7 ? 8 : 11
    }

    @inline
    private updateState_Match(state: u8): u8 {
        return state < 7 ? 7 : 10
    }

    public decode(unpackSizeDefined: boolean, unpackSize: i32): i32 {
        this.init()
        this.rangeDec.init()

        if (unpackSizeDefined) {
            this.outWindow.outStream = new Uint8Array(unpackSize)
        } else {
            this.outWindow.outStream = new Uint8Array(4)
        }

        var rep0:u32 = 0,
            rep1:u32 = 0,
            rep2:u32 = 0,
            rep3:u32 = 0 
        var state:u8 = 0 

        for (;;) {
            if (unpackSizeDefined && unpackSize == 0 && !this.markerIsMandatory) {
                if (this.rangeDec.isFinishedOK()) {
                    return LZMA.LZMA_RES_FINISHED_WITHOUT_MARKER
                }
            }

            var posState = this.outWindow.totalPos & ((1 << this.pb) - 1)

            if (this.rangeDec.decodeBit(this.isMatch, (state << LZMA.kNumPosBitsMax) + posState) == 0) {
                if (unpackSizeDefined && unpackSize == 0) {
                    return LZMA.LZMA_RES_ERROR
                }
                this.decodeLiteral(state, rep0)
                state = this.updateState_Literal(state)
                unpackSize--
                continue
            }

            var len: i32

            if (this.rangeDec.decodeBit(this.isRep, state) != 0) {
                if (unpackSizeDefined && unpackSize == 0) {
                    return LZMA.LZMA_RES_ERROR
                }
                if (this.outWindow.isEmpty()) {
                    return LZMA.LZMA_RES_ERROR
                }
                if (this.rangeDec.decodeBit(this.isRepG0, state) == 0) {
                    if (this.rangeDec.decodeBit(this.isRep0Long, (state << LZMA.kNumPosBitsMax) + posState) == 0) {
                        state = this.updateState_ShortRep(state)
                        this.outWindow.putByte(this.outWindow.getByte(rep0 + 1))
                        unpackSize--
                        continue
                    }
                } else {
                    var dist: i32
                    if (this.rangeDec.decodeBit(this.isRepG1, state) == 0) {
                        dist = rep1
                    } else {
                        if (this.rangeDec.decodeBit(this.isRepG2, state) == 0) {
                            dist = rep2
                        } else {
                            dist = rep3
                            rep3 = rep2
                        }
                        rep2 = rep1
                    }
                    rep1 = rep0
                    rep0 = dist
                }
                len = this.repLenDecoder.decode(this.rangeDec, posState)
                state = this.updateState_Rep(state)
            } else {
                rep3 = rep2
                rep2 = rep1
                rep1 = rep0
                len = this.lenDecoder.decode(this.rangeDec, posState)
                state = this.updateState_Match(state)
                rep0 = this.decodeDistance(len)
                if (rep0 == 0xffffffff) {
                    return this.rangeDec.isFinishedOK() ? LZMA.LZMA_RES_FINISHED_WITH_MARKER : LZMA.LZMA_RES_ERROR
                }

                if (unpackSizeDefined && unpackSize == 0) {
                    return LZMA.LZMA_RES_ERROR
                }
                if (rep0 >= this.dictSize || !this.outWindow.checkDistance(rep0)) {
                    return LZMA.LZMA_RES_ERROR
                }
            }
            len += LZMA.kMatchMinLen
            var isError: boolean = false
            if (unpackSizeDefined && unpackSize < len) {
                len = unpackSize
                isError = true
            }
            this.outWindow.copyMatch(rep0 + 1, len)
            unpackSize -= len
            if (isError) {
                return LZMA.LZMA_RES_ERROR
            }
        }
        return LZMA.LZMA_RES_ERROR
    }
}