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
- Permissions: everyone signed in can read all jobs; writes are gated in RLS by `user_roles` (admin/contributor/viewer) via `can_edit_job()` — admin edits all, contributor edits jobs they created or are assigned to (`job_assignees`), viewer is read-only. The UI mirrors this with `canEditJob()` in `src/lib/jobs.ts`. Why: owner controls who may change each job.
- First account to sign up becomes admin; later sign-ups start as viewer. Why: the owner promotes people from the Users page.
- ECU files live in the private `ecu-files` storage bucket under `<job_id>/...`, indexed by the `job_files` table. Why: downloads stay behind sign-in.
- App pages live under `src/routes/_authenticated/`; data reads use the browser client with react-query options from `src/lib/jobs.ts`.
- Logs belong to a specific uploaded file (`file_logs.file_id`), stored under `<job_id>/logs/<file_id>/` in `ecu-files`. Why: each log must be read against the map version it was recorded on.
