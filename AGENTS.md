<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Data is shared across the whole team: any signed-in user can read/edit all jobs and ECU files (RLS `to authenticated using (true)`). Why: the workshop owner and team work on the same cars.
- ECU files live in the private `ecu-files` storage bucket under `<job_id>/...`, indexed by the `job_files` table. Why: downloads stay behind sign-in.
- App pages live under `src/routes/_authenticated/`; data reads use the browser client with react-query options from `src/lib/jobs.ts`.
- Logs belong to a specific uploaded file (`file_logs.file_id`), stored under `<job_id>/logs/<file_id>/` in `ecu-files`. Why: each log must be read against the map version it was recorded on.
