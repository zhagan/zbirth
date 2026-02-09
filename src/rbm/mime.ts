const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];
const JPG_MAGIC = [0xff, 0xd8, 0xff];

function startsWith(bytes: Uint8Array, prefix: number[]) {
  if (bytes.length < prefix.length) return false;
  for (let i = 0; i < prefix.length; i += 1) {
    if (bytes[i] !== prefix[i]) return false;
  }
  return true;
}

export function guessMime(name: string, data?: Uint8Array): string | undefined {
  if (data) {
    if (startsWith(data, PNG_MAGIC)) return "image/png";
    if (startsWith(data, JPG_MAGIC)) return "image/jpeg";
  }

  const lower = name.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".aif") || lower.endsWith(".aiff")) return "audio/aiff";
  if (lower.endsWith(".txt")) return "text/plain";
  if (lower.endsWith(".rbs")) return "application/octet-stream";
  return undefined;
}
