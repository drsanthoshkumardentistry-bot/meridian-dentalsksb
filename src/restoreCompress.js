// Restore points are saved gzip-compressed (then base64) so each copy takes a fraction of the clinic's storage.
// Copies saved before this change are plain JSON and still open: they have no `enc` field.
export const canCompress = () => typeof CompressionStream === "function" && typeof DecompressionStream === "function" && typeof ReadableStream === "function" && typeof Response === "function";

const toB64 = (bytes) => {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
const fromB64 = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

const pipe = async (bytes, stream) => new Uint8Array(await new Response(new ReadableStream({ start(c) { c.enqueue(bytes); c.close(); } }).pipeThrough(stream)).arrayBuffer());

/** Returns { text, enc } where enc is "gz" when compressed, or "" when stored as plain JSON. */
export const packText = async (text) => {
  if (!canCompress()) return { text, enc: "" };
  try {
    const gz = await pipe(new TextEncoder().encode(text), new CompressionStream("gzip"));
    return { text: toB64(gz), enc: "gz" };
  } catch { return { text, enc: "" }; }
};

export const unpackText = async (text, enc) => {
  if (enc !== "gz") return text;
  if (!canCompress()) throw new Error("cannot-decompress");
  const raw = await pipe(fromB64(text), new DecompressionStream("gzip"));
  return new TextDecoder().decode(raw);
};
