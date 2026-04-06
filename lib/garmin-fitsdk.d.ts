declare module '@garmin/fitsdk' {
  export class Stream {
    static fromBuffer(buffer: Buffer): Stream
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type FitMessage = Record<string, any>

  export class Decoder {
    constructor(stream: Stream)
    isFIT(): boolean
    checkIntegrity(): boolean
    read(): {
      messages: Record<string, FitMessage[]>
      errors: unknown[]
    }
  }
}
