import { RangeDecoder } from './range-decoder';
import { LZMA } from './lzma';

/**
 * LZMA Decoder
 * @author Nidin Vinayakan
 */
export class BitTreeDecoder {
    public probs: Uint16Array
    private numBits: u32

    constructor(numBits:u32) {
        this.numBits = numBits
        this.probs = new Uint16Array(1 << this.numBits)
    }
    
    @inline
    public init(): void {
        LZMA.INIT_PROBS(this.probs)
    }

    @inline
    public decode(rc: RangeDecoder): u32 {
        var m: u32 = 1
        for (var i: u32 = 0; i < this.numBits; i++) m = (m << 1) + rc.decodeBit(this.probs, m)
        return m - (1 << this.numBits)
    }
    
    @inline
    public reverseDecode(rc: RangeDecoder): i32 {
        return LZMA.BitTreeReverseDecode(this.probs, this.numBits, rc)
    }

    @inline
    static constructArray(numBits: i32, len: i32): Array<BitTreeDecoder> {
        var vec: BitTreeDecoder[] = new Array<BitTreeDecoder>(len)
        for (var i: i32 = 0; i < len; i++) {
            vec.__unchecked_set(i, new BitTreeDecoder(numBits))
        }
        return vec
    }
}