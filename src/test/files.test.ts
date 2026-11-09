import {describe,it,expect} from 'vitest';
import {validateTechnicalSize} from '@/lib/files';
describe('technical file limits',()=>{it('accepts 50 MB and rejects an empty file or one byte over',()=>{expect(()=>validateTechnicalSize(50*1024*1024)).not.toThrow();expect(()=>validateTechnicalSize(50*1024*1024+1)).toThrow();expect(()=>validateTechnicalSize(0)).toThrow();});});