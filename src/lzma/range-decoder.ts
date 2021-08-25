import { LZMA } from "./lzma";

/**
 * LZMA Decoder
 * @author Nidin Vinayakan
 */
export class RangeDecoder {
    static kTopValue: u32 = 1 << 24

    public inStream: Uint8Array
    public corrupted: boolean

    public in_pos: i32
    private range: u32 = 0 
    private code: u32 = 0 

    constructor() {
        this.in_pos = 13
    }

    @inline
    public isFinishedOK(): boolean {
        return this.code == 0
    }

    @inline
    public init(): void {
        this.corrupted = false

        if (this.inStream[this.in_pos++] != 0) {
            this.corrupted = true
        }

        this.range = 0xffffffff
        this.code = 0

        for (var i: i32 = 0; i < 4; i++) {
            this.code = (this.code << 8) | this.inStream[this.in_pos++]
        }

        if (this.code == this.range) {
            this.corrupted = true
        }
    }

    @inline
    public normalize():void {
        if (this.range < RangeDecoder.kTopValue) {
            this.range <<= 8
            this.code = (this.code << 8) | this.inStream[this.in_pos++]
        }
    }

    @inline
    public decodeDirectBits(numBits: i32): i32 {
        var res:u32 = 0 
        do {
            this.range >>>= 1
            this.code -= this.range
            let t:u32 = 0 - (this.code >>> 31)
            this.code += this.range & t

            if (this.code == this.range) {
                this.corrupted = true
            }

            this.normalize()
            res <<= 1
            res += t + 1
        } while (--numBits)
        return res
    }

    @inline
    decodeBit(prob: Uint16Array, index: i32):u16 {
        var v:u16 = prob.__unchecked_get(index);
        var bound:u32 = (this.range >> LZMA.kNumBitModelTotalBits) * v;
        var symbol:u16 = 0;
        if (this.code < bound)
        {
          v += ((1 << LZMA.kNumBitModelTotalBits) - v) >> LZMA.kNumMoveBits;
          this.range = bound;
          symbol = 0;
        }
        else
        {
          v -= v >> LZMA.kNumMoveBits;
          this.code -= bound;
          this.range -= bound;
          symbol = 1;
        }
        prob.__unchecked_set(index, v)
        this.normalize();
        return symbol;
    }
}