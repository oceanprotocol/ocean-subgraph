import { HEADER_SIZE } from "~lib/internal/arraybuffer";
/**
 * LZMA Decoder
 * @author Nidin Vinayakan
 */
export class OutWindow {
    public totalPos: i32
    public outStream: Uint8Array

    private buf: Uint8Array
    private pos: i32
    public out_pos: i32
    private size: i32
    private isFull: boolean

    constructor() {
        this.out_pos = 0
    }
    
    public create(
        dictSize: i32,
    ): void {
        this.buf = new Uint8Array(dictSize)
        this.pos = 0
        this.size = dictSize
        this.isFull = false
        this.totalPos = 0
    }
    
    @inline
    public putByte(b: u8): void {
        this.totalPos++
        this.buf.__unchecked_set(this.pos++, b)
        if (this.pos == this.size) {
            this.pos = 0
            this.isFull = true
        }
        if (this.outStream.length === this.out_pos) {
            this.grow()
        }
        this.outStream.__unchecked_set(this.out_pos++, b)
    }
    
    @inline
    private grow(): void {
        let tmp = this.outStream
        this.outStream = new Uint8Array(tmp.length * 2)

        memory.copy(
            changetype<usize>(this.outStream.buffer) + this.outStream.byteOffset + HEADER_SIZE,
            changetype<usize>(tmp.buffer) + tmp.byteOffset + HEADER_SIZE,
            tmp.length
        );

        let tmp_ptr = <usize>tmp;
        let AB_ptr = load<u32>(tmp_ptr, 0);
        __memory_free(AB_ptr);
        __memory_free(tmp_ptr)
    }

    public trim(): Uint8Array {
        var out = this.outStream.subarray(0, this.out_pos)
        return out
    }

    @inline
    public getByte(
        dist: i32,
    ): u8 {
        return this.buf.__unchecked_get(dist <= this.pos ? this.pos - dist : this.size - dist + this.pos)
    }

    @inline
    public copyMatch(
        dist: i32,
        len:i32,
    ): void {
        for (; len > 0; len--) {
            this.putByte(this.getByte(dist))
        }
    }

    @inline
    public checkDistance(dist: i32): boolean {
        return dist <= this.pos || this.isFull
    }

    @inline
    public isEmpty(): boolean {
        return this.pos == 0 && !this.isFull
    }
}