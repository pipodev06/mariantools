// pdf-lib tipa Uint8Array.save() como Uint8Array<ArrayBufferLike> (incluye
// SharedArrayBuffer), que TS no acepta directo como BlobPart. Copiar a un
// ArrayBuffer nuevo evita el error de tipos sin usar `as unknown as`.
export const bytesToBlob = (bytes: Uint8Array, type: string): Blob => {
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  return new Blob([buffer], { type })
}
