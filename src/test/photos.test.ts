import {describe,it,expect} from 'vitest';
import {PHOTO_QUALITY,photoDimensions,validatePhotoOriginal,validateProcessedWebp} from '@/lib/photos';
describe('vehicle photo rules',()=>{
 it('accepts a 2 MB original and rejects one byte over',()=>{expect(()=>validatePhotoOriginal(2*1024*1024,'image/jpeg')).not.toThrow();expect(()=>validatePhotoOriginal(2*1024*1024+1,'image/jpeg')).toThrow();});
 it('only accepts JPEG PNG WebP originals',()=>{for(const type of ['image/jpeg','image/png','image/webp'])expect(()=>validatePhotoOriginal(100,type)).not.toThrow();expect(()=>validatePhotoOriginal(100,'image/svg+xml')).toThrow();});
 it('fits landscape within 640 by 480 without upscaling',()=>{expect(photoDimensions(1920,1080)).toEqual({width:640,height:360});expect(photoDimensions(320,240)).toEqual({width:320,height:240});});
 it('fits portrait within 640 by 480',()=>expect(photoDimensions(1200,1800)).toEqual({width:320,height:480}));
 it('uses quality between 65 and 70 percent',()=>{expect(PHOTO_QUALITY).toBeGreaterThanOrEqual(.65);expect(PHOTO_QUALITY).toBeLessThanOrEqual(.7);});
 it('rejects content that is not a WebP container',()=>expect(()=>validateProcessedWebp(new Uint8Array(100))).toThrow());
});