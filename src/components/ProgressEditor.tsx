import { useState } from 'react';
import { useQuery,useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { PUBLIC_STEPS, progressQuery,reportQuery,historyQuery } from '@/lib/progress';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Select,SelectTrigger,SelectContent,SelectItem,SelectValue } from './ui/select';
export function ProgressEditor({jobId,linked}: {jobId:string;linked:boolean}) {
  const {data:progress,isLoading}=useQuery(progressQuery(jobId)); const {data:report,isLoading:rl}=useQuery(reportQuery(jobId));
  if(isLoading || rl)return null;
  return <ProgressForm key={`${progress?.updated_at}:${report?.updated_at}`} jobId={jobId} linked={linked} initial={progress} report={report}/>;
}
function ProgressForm({jobId,linked,initial,report}: {jobId:string;linked:boolean;initial?:{public_status:string;completed_steps:string[];message:string|null;information_request:string|null}|null;report?:{content:string;released:boolean}|null}) {
  const qc=useQueryClient(); const {data:history=[]}=useQuery(historyQuery(jobId));
  const [status,setStatus]=useState(initial?.public_status??'received'),[steps,setSteps]=useState(initial?.completed_steps??[]),[message,setMessage]=useState(initial?.message??''),[request,setRequest]=useState(initial?.information_request??''),[content,setContent]=useState(report?.content??''),[released,setReleased]=useState(report?.released??false),[privateNote,setPrivateNote]=useState(''),[busy,setBusy]=useState(false);
  async function save(){setBusy(true);try{const {error}=await supabase.from('job_progress').upsert({job_id:jobId,public_status:status,completed_steps:steps,message:message||null,information_request:request||null});if(error)throw error;const {error:re}=await supabase.from('job_reports').upsert({job_id:jobId,content,released,updated_at:new Date().toISOString()});if(re)throw re;toast.success('Client update saved');qc.invalidateQueries({queryKey:['progress',jobId]});qc.invalidateQueries({queryKey:['report',jobId]});qc.invalidateQueries({queryKey:['history',jobId]});qc.invalidateQueries({queryKey:['cars']});}catch{toast.error('Could not save client update');}finally{setBusy(false);}}
  async function addNote(){const {error}=await supabase.from('job_history').insert({job_id:jobId,event:'private_observation',details:{note:privateNote}});if(error)return void toast.error('Could not save observation');setPrivateNote('');qc.invalidateQueries({queryKey:['history',jobId]});}
  return <section className="mb-8 space-y-4 border-y py-6">
    <h2 className="text-2xl">Client progress</h2>{!linked && <p className="text-sm text-muted-foreground">Link a vehicle to make updates visible to its owner.</p>}
    <Label>Public status</Label><Select value={status} onValueChange={setStatus}><SelectTrigger aria-label="Public status"><SelectValue/></SelectTrigger><SelectContent>{Object.entries(PUBLIC_STEPS).map(([key,label])=><SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select>
    <div className="grid gap-3 sm:grid-cols-2">{Object.entries(PUBLIC_STEPS).map(([key,label])=><label key={key} className="flex items-center gap-2 text-sm"><Checkbox checked={steps.includes(key)} onCheckedChange={checked=>setSteps(checked?[...steps,key]:steps.filter(x=>x!==key))}/>{label}</label>)}</div>
    <div><Label htmlFor="public-message">Message for client</Label><Textarea id="public-message" value={message} onChange={e=>setMessage(e.target.value)}/></div>
    <div><Label htmlFor="information-request">Information request</Label><Textarea id="information-request" value={request} onChange={e=>setRequest(e.target.value)}/></div>
    <div><Label htmlFor="final-report">Final report</Label><Textarea id="final-report" rows={5} value={content} onChange={e=>setContent(e.target.value)}/></div>
    <label className="flex items-center gap-2"><Checkbox checked={released} onCheckedChange={c=>setReleased(c===true)}/>Release final report to client</label>
    <Button disabled={busy} onClick={save}>Save client update</Button>
    <div className="border-t pt-4"><Label htmlFor="private-observation">Private observation</Label><Textarea id="private-observation" value={privateNote} onChange={e=>setPrivateNote(e.target.value)}/><Button variant="outline" className="mt-2" disabled={!privateNote.trim()} onClick={addNote}>Add private observation</Button></div>
    <details><summary className="cursor-pointer text-sm font-semibold">Private history ({history.length})</summary><ul className="mt-3 space-y-3">{history.map(h=><li key={h.id} className="border-l pl-3 text-xs"><div>{new Date(h.created_at).toLocaleString('en-GB')} · {h.event}</div><pre className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">{JSON.stringify(h.details,null,2)}</pre></li>)}</ul></details>
  </section>;
}