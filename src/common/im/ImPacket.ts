import { Command } from './enums';
import { IPayload } from './payload-model';
import ByteBuffer from 'bytebuffer';

export interface ImPacket<Payload extends IPayload = IPayload> {
  command: Command;
  payload: Payload;
}

export class ImPacketCoder {
  static encode<Payload extends IPayload = IPayload>(
    packet: ImPacket<Payload>
  ): ArrayBuffer {
    // @ts-ignore
    packet.command = Command[packet.command];
    const packetJsonStr = JSON.stringify(packet);
    const buf = ByteBuffer.wrap(packetJsonStr);
    return buf.toArrayBuffer();
  }

  static decode<Payload extends IPayload = IPayload>(
    raw: ArrayBuffer
  ): ImPacket<Payload> {
    const buf = ByteBuffer.wrap(raw);
    return JSON.parse(buf.toString());
  }

  static decodeForTio<Payload extends IPayload = IPayload>(
    raw: ArrayBuffer
  ): ImPacket<Payload> {
    const buf = ByteBuffer.wrap(raw).toString();
    let packet: any;
    try {
      packet = JSON.parse(buf);
    } catch (e) {
      packet = eval(`(${buf})`);
    }
    packet.command = Command[packet.command];
    return packet;
  }

  static encodeToString<Payload extends IPayload = IPayload>(
    packet: ImPacket<Payload>
  ): string {
    // @ts-ignore
    packet.command = Command[packet.command];
    return JSON.stringify(packet);
  }

  static decodeFromString<Payload extends IPayload = IPayload>(
    raw: string
  ): ImPacket<Payload> {
    const packet = JSON.parse(raw);
    packet.command = Command[packet.command];
    return packet;
  }

  static decodeFromStringForTio<Payload extends IPayload = IPayload>(
    raw: string
  ): ImPacket<Payload> {
    let packet: any;
    try {
      packet = JSON.parse(raw);
    } catch (e) {
      packet = eval(`(${raw})`);
    }
    packet.command = Command[packet.command];
    return packet;
  }
}
