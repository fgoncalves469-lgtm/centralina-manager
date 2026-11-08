export const PHOTO_ORIGINAL_LIMIT = 2 * 1024 * 1024;
export const PHOTO_WIDTH = 640;
export const PHOTO_HEIGHT = 480;
export const PHOTO_QUALITY = 0.68;
export function validatePhotoOriginal(size: number, type: string) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) throw new Error('Choose a JPEG, PNG or WebP image');
  if (size <= 0 || size > PHOTO_ORIGINAL_LIMIT) throw new Error('The original photo must be 2 MB or smaller');
}
export function photoDimensions(width: number, height: number) {
  if (width <= 0 || height <= 0) throw new Error('Invalid image dimensions');
  const ratio = Math.min(1, PHOTO_WIDTH / width, PHOTO_HEIGHT / height);
  return { width: Math.max(1, Math.round(width * ratio)), height: Math.max(1, Math.round(height * ratio)) };
}
export async function processPhoto(file: File): Promise<Blob> {
  validatePhotoOriginal(file.size, file.type);
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const { width, height } = photoDimensions(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Image processing unavailable');
    ctx.drawImage(bitmap, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b?.type === 'image/webp' ? resolve(b) : reject(new Error('WebP conversion unavailable')), 'image/webp', PHOTO_QUALITY));
  } finally { bitmap.close(); }
}
/** Validate the actual WebP container, dimensions and absence of metadata on both sides. */
export function validateProcessedWebp(bytes: Uint8Array) {
  const text = (at: number, n: number) => String.fromCharCode(...bytes.slice(at, at + n));
  if (bytes.length < 30 || bytes.length > PHOTO_ORIGINAL_LIMIT || text(0,4) !== 'RIFF' || text(8,4) !== 'WEBP') throw new Error('Invalid WebP image');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(4,true)+8 !== bytes.length) throw new Error('Invalid WebP length');
  let width=0, height=0, image=false;
  for (let p=12; p+8<=bytes.length;) {
    const kind=text(p,4), length=view.getUint32(p+4,true), start=p+8;
    if (start+length>bytes.length || ['EXIF','XMP ','ANIM','ANMF'].includes(kind)) throw new Error('Invalid image or metadata');
    if(kind==='VP8 ' && length>=10) { if(text(start+3,3)!=='\x9d\x01\x2a') throw new Error('Invalid WebP frame'); width=view.getUint16(start+6,true)&16383; height=view.getUint16(start+8,true)&16383; image=true; }
    if(kind==='VP8L' && length>=5) { if(bytes[start]!==47) throw new Error('Invalid WebP frame'); const bits=view.getUint32(start+1,true); width=(bits&16383)+1; height=((bits>>>14)&16383)+1; image=true; }
    p=start+length+(length%2);
  }
  if (!image || !width || !height || width>PHOTO_WIDTH || height>PHOTO_HEIGHT) throw new Error('Photo must be at most 640 × 480');
  return { width, height };
}