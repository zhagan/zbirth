import { guessMime } from "./mime";
import type { RbmBundle, RbmFileEntry } from "./rbmTypes";

const textDecoder = new TextDecoder("utf-8");

function readId(view: DataView, offset: number): string {
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3)
  );
}

function readUint32(view: DataView, offset: number): number {
  return view.getUint32(offset, false);
}

function parseChunks(
  view: DataView,
  start: number,
  end: number,
  entries: Map<string, RbmFileEntry>
) {
  let offset = start;
  while (offset + 8 <= end) {
    const id = readId(view, offset);
    const size = readUint32(view, offset + 4);
    const payloadStart = offset + 8;
    const payloadEnd = payloadStart + size;

    if (payloadEnd > view.byteLength || payloadEnd > end) {
      throw new Error(`RBM chunk ${id} overruns buffer`);
    }

    if (id === "CAT " || id === "FORM") {
      if (size < 4) {
        throw new Error(`RBM container ${id} is too short`);
      }
      const childStart = payloadStart + 4;
      parseChunks(view, childStart, payloadEnd, entries);
    } else if (id === "EMBF") {
      const payload = new Uint8Array(view.buffer, payloadStart, size);
      const terminatorIndex = payload.indexOf(0);
      if (terminatorIndex >= 0) {
        const name = textDecoder.decode(payload.subarray(0, terminatorIndex));
        const data = new Uint8Array(payload.subarray(terminatorIndex + 1));
        entries.set(name, {
          name,
          data,
          mime: guessMime(name, data),
        });
      }
    }

    offset = payloadEnd;
    if (size % 2 === 1) {
      offset += 1;
    }
  }
}

export function parseRbm(arrayBuffer: ArrayBuffer): RbmBundle {
  const view = new DataView(arrayBuffer);
  const entries = new Map<string, RbmFileEntry>();
  parseChunks(view, 0, view.byteLength, entries);
  return { entries };
}
