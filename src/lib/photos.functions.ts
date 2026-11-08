import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { validateProcessedWebp } from './photos';

export const saveVehiclePhoto = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ carId: z.string().uuid(), base64: z.string().max(2800000).nullable() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: car, error } = await context.supabase.from('cars').select('id,owner_id,photo_path').eq('id',data.carId).maybeSingle();
    if(error || !car) throw new Error('Vehicle unavailable');
    const { data: admin } = await context.supabase.rpc('has_role',{ _user_id:context.userId, _role:'admin' });
    if(car.owner_id!==context.userId && !admin) throw new Error('Not allowed');
    let bytes: Uint8Array | null=null;
    if(data.base64!==null) { try { bytes=Uint8Array.from(atob(data.base64),c=>c.charCodeAt(0)); } catch { throw new Error('Invalid image'); } validateProcessedWebp(bytes); }
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const path=bytes ? `${car.id}/${crypto.randomUUID()}.webp` : null;
    if(bytes && path) { const { error: up }=await supabaseAdmin.storage.from('vehicle-photos').upload(path,bytes,{ contentType:'image/webp',upsert:false }); if(up) throw new Error('Could not upload photo'); }
    const { error: save }=await context.supabase.from('cars').update({photo_path:path}).eq('id',car.id).select('id').single();
    if(save) { if(path) await supabaseAdmin.storage.from('vehicle-photos').remove([path]); throw new Error('Could not save photo'); }
    if(car.photo_path) await supabaseAdmin.storage.from('vehicle-photos').remove([car.photo_path]);
    return { path };
  });