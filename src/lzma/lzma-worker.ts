import { LZMA } from './lzma'

export class LZMAWorker {
  static ENCODE: number = 1
  static DECODE: number = 2
  private decoder: LZMA
  private command: Object = null
  private time: number

  constructor() {
    var _this = this
    this.decoder = new LZMA()

    addEventListener(
      'message',
      (e: any) => {
        if (_this.command == null) {
          _this.command = e.data
        } else if (_this.command['job'] == 1) {
          _this.command = null
        } else if (_this.command['job'] == 2) {
          _this.decode(e.data)
        }
      },
      false
    )
  }
  private decode(data): void {
    this.time = Date.now()
    var result = this.decoder.decode(new Uint8Array(data))
    this.command['time'] = Date.now() - this.time
    ;(<any>postMessage)(this.command)
    ;(<any>postMessage)(result.buffer, [result.buffer])
  }
}
new LZMAWorker()
