import { LzmaDecoder } from './lzma-decoder'
import { RangeDecoder } from './range-decoder'
;('use strict')
/**
 * LZMA Decoder
 * @author Nidin Vinayakan
 */

export class DecodeResult {
  constructor(
    public success: u32,
    public errorCode: u32,
    public unpackSize: i32,
    public data: Uint8Array
  ) {}
}

export class LZMA {
  static readonly LZMA_DIC_MIN: u32 = 1 << 12
  static readonly LZMA_RES_ERROR: u32 = 0x1
  static readonly LZMA_RES_FINISHED_WITH_MARKER: u32 = 0x2
  static readonly LZMA_RES_FINISHED_WITHOUT_MARKER: u32 = 0x3
  static readonly kNumBitModelTotalBits: u16 = 11
  static readonly kNumMoveBits: u8 = 5
  static readonly PROB_INIT_VAL: u16 = (1 << LZMA.kNumBitModelTotalBits) / 2 //1024
  static readonly kNumPosBitsMax: u8 = 4

  static readonly kNumStates: u32 = 12
  static readonly kNumLenToPosStates: u32 = 4
  static readonly kNumAlignBits: u32 = 4
  static readonly kStartPosModelIndex: u32 = 4
  static readonly kEndPosModelIndex: u32 = 14
  static readonly kNumFullDistances: u32 = 1 << (LZMA.kEndPosModelIndex >>> 1)
  static readonly kMatchMinLen: u32 = 2

  public decoder: LzmaDecoder
  public data: Uint8Array

  @inline
  static INIT_PROBS(p: Uint16Array): void {
    p.fill(LZMA.PROB_INIT_VAL)
  }

  static BitTreeReverseDecode(
    probs: Uint16Array,
    numBits: i32,
    rc: RangeDecoder,
    offset: i32 = 0
  ): i32 {
    var m: u32 = 1
    var symbol: u32 = 0
    for (var i: i32 = 0; i < numBits; i++) {
      var bit: u32 = rc.decodeBit(probs, offset + m)
      m <<= 1
      m += bit
      symbol |= bit << i
    }
    return symbol
  }

  constructor() {
    this.decoder = new LzmaDecoder()
  }

  public unpackSize(data: Uint8Array): u32 {
    var header: Uint8Array = new Uint8Array(13)
    var i: i32
    for (i = 0; i < 13; i++) {
      header[i] = data[i]
    }

    var unpackSize: u32 = 0
    var unpackSizeDefined: boolean = false
    for (i = 0; i < 8; i++) {
      var b: u32 = header[5 + i]
      if (b != 0xff) {
        unpackSizeDefined = true
      }
      unpackSize |= b << (8 * i)
    }
    return unpackSize
  }

  public decode(data: Uint8Array): DecodeResult {
    this.data = data
    var header: Uint8Array = new Uint8Array(13)
    var i: i32
    for (i = 0; i < 13; i++) {
      header[i] = data[i]
    }
    this.decoder.decodeProperties(header)
    var unpackSize: u32 = 0
    var unpackSizeDefined: boolean = false
    for (i = 0; i < 8; i++) {
      var b: u32 = header[5 + i]
      if (b != 0xff) {
        unpackSizeDefined = true
      }
      unpackSize |= b << (8 * i)
    }

    this.decoder.markerIsMandatory = !unpackSizeDefined
    this.decoder.rangeDec.inStream = data
    this.decoder.create()
    // we support the streams that have uncompressed size and marker.
    var res: i32 = this.decoder.decode(unpackSizeDefined, unpackSize)

    if (res == LZMA.LZMA_RES_ERROR) {
      return new DecodeResult(false, LZMA.LZMA_RES_ERROR, null, null)
      //throw 'LZMA decoding error'
    } else if (res == LZMA.LZMA_RES_FINISHED_WITHOUT_MARKER) {
      //console.log("Finished without end marker");
    } else if (res == LZMA.LZMA_RES_FINISHED_WITH_MARKER) {
      if (unpackSizeDefined) {
        if (this.decoder.outWindow.out_pos != unpackSize) {
          return new DecodeResult(false, LZMA.LZMA_RES_ERROR, null, null)
          //throw 'Finished with end marker before than specified size'
        }
      }
    } else {
      return new DecodeResult(false, LZMA.LZMA_RES_ERROR, null, null)
      //throw 'Internal Error'
    }

    if (this.decoder.rangeDec.corrupted) {
      // console.log('Warning: LZMA stream is corrupted')
    }
    return new DecodeResult(
      true,
      null,
      this.decoder.outWindow.out_pos,
      this.decoder.outWindow.outStream
    )
  }
}
