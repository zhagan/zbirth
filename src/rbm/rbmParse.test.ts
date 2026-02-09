import { describe, expect, it } from "vitest";
import { parseRbm } from "./rbmParse";

const textEncoder = new TextEncoder();

function createChunk(id: string, payload: Uint8Array): Uint8Array {
  const buffer = new Uint8Array(8 + payload.length + (payload.length % 2));
  const view = new DataView(buffer.buffer);
  buffer.set(textEncoder.encode(id.padEnd(4, " ")).subarray(0, 4), 0);
  view.setUint32(4, payload.length, false);
  buffer.set(payload, 8);
  if (payload.length % 2 === 1) {
    buffer[8 + payload.length] = 0;
  }
  return buffer;
}

describe("parseRbm", () => {
  it("extracts EMBF entries", () => {
    const name = "test.jpg";
    const nameBytes = textEncoder.encode(`${name}\0`);
    const payloadBytes = new Uint8Array([11, 22, 33, 44]);
    const embfPayload = new Uint8Array(nameBytes.length + payloadBytes.length);
    embfPayload.set(nameBytes, 0);
    embfPayload.set(payloadBytes, nameBytes.length);

    const embfChunk = createChunk("EMBF", embfPayload);
    const onlyChunk = createChunk("CAT ", new Uint8Array(["P".charCodeAt(0), "R".charCodeAt(0), "B".charCodeAt(0), "M".charCodeAt(0), ...embfChunk]));

    const bundle = parseRbm(onlyChunk.buffer);
    const entry = bundle.entries.get(name);
    expect(entry).toBeDefined();
    expect(entry?.data).toEqual(payloadBytes);
  });
});
