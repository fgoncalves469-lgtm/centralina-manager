import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Circle, MessageSquare } from 'lucide-react';
import { PUBLIC_STEPS, reportQuery } from '@/lib/progress';
type Progress={job_id:string;public_status:string;completed_steps:string[];message:string|null;information_request:string|null;updated_at:string};
export function ClientProgress({progress}: {progress:Progress}) {
  const {data:report}=useQuery(reportQuery(progress.job_id));
  return <section className="border-b py-5">
    <h3 className="text-lg font-semibold">{PUBLIC_STEPS[progress.public_status as keyof typeof PUBLIC_STEPS]??'Awaiting update'}</h3>
    <p className="mb-4 text-xs text-muted-foreground">Updated {new Date(progress.updated_at).toLocaleString('en-GB')}</p>
    <ol className="grid gap-3 sm:grid-cols-2">{Object.entries(PUBLIC_STEPS).map(([key,label])=><li key={key} className="flex items-center gap-2 text-sm">{progress.completed_steps.includes(key)?<CheckCircle2 className="size-4 text-success"/>:<Circle className="size-4 text-muted-foreground"/>}{label}</li>)}</ol>
    {progress.message && <p className="mt-4 whitespace-pre-wrap"><MessageSquare className="mr-2 inline size-4 text-primary"/>{progress.message}</p>}
    {progress.information_request && <div className="mt-4 border-l-2 border-primary pl-4"><h4 className="font-semibold">Information requested</h4><p className="whitespace-pre-wrap">{progress.information_request}</p></div>}
    {report?.released && <div className="mt-5 border-t pt-4"><h4 className="font-semibold">Final report</h4><p className="whitespace-pre-wrap text-sm">{report.content}</p></div>}
  </section>;
}