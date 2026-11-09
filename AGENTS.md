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
- Permissions: only the admin role grants technical access; viewer and legacy contributor are clients. Technical jobs/files/logs/catalog and administrative lists are protected in RLS; clients read job_progress via owner-scoped car_public_progress and released job_reports. Why: RLS cannot hide private columns in a customer-readable technical row.
- First account to sign up becomes admin; later sign-ups start as viewer. Why: the owner promotes people from the Users page.
- ECU files live in the private `ecu-files` storage bucket under `<job_id>/...`, indexed by the `job_files` table. Why: downloads stay behind sign-in.
- App pages live under `src/routes/_authenticated/`; data reads use the browser client with react-query options from `src/lib/jobs.ts`.
- Logs belong to a specific uploaded file (`file_logs.file_id`), stored under `<job_id>/logs/<file_id>/` in `ecu-files`. Why: each log must be read against the map version it was recorded on.
- Vehicle/ECU reference list lives in the flat `vehicles` table; only admins read/edit it, while client car forms allow free typing. Why: preserve the reference catalog without exposing technical data to clients.

- My Garage uses cars.owner_id for visibility and ownership: owners create/edit, only admin deletes or transfers ownership; cars.notes is user-facing, private observations belong in job_history. Why: customer data must stay separate from technical notes.
- Top tabs come from `NAV_TABS` in `src/lib/jobs.ts` with per-role visibility. Why: easy to add new sections.
- Photo upload uses an authenticated server function that authorizes car ownership, validates the processed WebP container/dimensions/metadata, then writes the private vehicle-photos bucket; direct browser writes are denied. Why: browser processing reduces traffic but is not a security boundary.
- job_files remains the calibration version entity; unique immutable paths, size/hash metadata and original-delete protection are enforced by triggers; test_sessions/file_history attach to file_id and jobs.validated_file_id must reference a modified file of that job. Why: preserve old versions and existing data without duplicate version tables.
- Public progress and report drafts live separately; job_history stores private audit events. Why: unreleased reports and internal observations must never be returned to clients.
