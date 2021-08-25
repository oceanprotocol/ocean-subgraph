import { BitTreeDecoder } from './bit-tree-decoder'
import { LZMA } from './lzma'
import { RangeDecoder } from './range-decoder'

/**
 * LZMA Decoder
 * @author Nidin Vinayakan
 */

export class LenDecoder {
    private choice: Uint16Array
    private lowCoder: Array<BitTreeDecoder>
    private midCoder: Array<BitTreeDecoder>
    private highCoder: BitTreeDecoder

    constructor() {
        this.lowCoder = BitTreeDecoder.constructArray(3, 1 << LZMA.kNumPosBitsMax)
        this.midCoder = BitTreeDecoder.constructArray(3, 1 << LZMA.kNumPosBitsMax)
        this.highCoder = new BitTreeDecoder(8)
    }

    public init(): void {
        this.choice = new Uint16Array(2)
        this.choice.__unchecked_set(0, LZMA.PROB_INIT_VAL)
        this.choice.__unchecked_set(1, LZMA.PROB_INIT_VAL)
        this.highCoder.init()
        for (var i: i32 = 0; i < 1 << LZMA.kNumPosBitsMax; i++) {
            this.lowCoder[i].init()
            this.midCoder[i].init()
        }
    }
    
    public decode(rc: RangeDecoder, posState: i32): i32 {
        if (rc.decodeBit(this.choice, 0) == 0) {
            return this.lowCoder[posState].decode(rc)
        }
        if (rc.decodeBit(this.choice, 1) == 0) {
            return 8 + this.midCoder[posState].decode(rc)
        }
        return 16 + this.highCoder.decode(rc)
    }
}