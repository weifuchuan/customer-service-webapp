import ByteBuffer from 'bytebuffer';

export class ByteBufferKit {
  static readUB2WithBigEdian(buffer: ByteBuffer): number {
    let ret = (buffer.readByte() & 0xff) << 8;
    ret |= buffer.readByte() & 0xff;
    return ret;
  }

  static readBytes(buffer: ByteBuffer, length: number): Uint8Array {
    return new Uint8Array(buffer.readBytes(length).toArrayBuffer());
  }
}

export function isUndefOrNull(obj: any) {
  return obj === undefined || obj === null;
}

export async function sleep(duration: number) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

export interface IRet {
  state: 'ok' | 'fail';
  [key:string]:any;
}
