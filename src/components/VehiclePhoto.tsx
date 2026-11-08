import { useQuery } from '@tanstack/react-query';
import { CarFront } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
export function VehiclePhoto({ path, name, compact=false }: { path?: string|null; name:string; compact?:boolean }) {
  const { data:url }=useQuery({queryKey:['photo',path],enabled:!!path,staleTime:240000,queryFn:async()=>{if(!path)return null;const {data,error}=await supabase.storage.from('vehicle-photos').createSignedUrl(path,300);if(error)throw error;return data.signedUrl;}});
  return <div className={compact?'flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded bg-muted':'mb-6 flex aspect-[4/3] max-h-80 w-full items-center justify-center overflow-hidden rounded bg-muted'}>{url?<img src={url} alt={name} className="h-full w-full object-contain"/>:<CarFront className="size-12 text-muted-foreground" aria-label="No vehicle photo"/>}</div>;
}