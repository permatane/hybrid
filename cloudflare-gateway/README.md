# RIVIS Cloud Gateway — Cloudflare Pages

This project is staged alongside Netlify without switching existing users.

## Deploy via GitHub integration

- GitHub repository: `permatane/hybrid`
- Project root directory: `cloudflare-gateway`
- Framework preset: None
- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`
- Compatibility date: `2026-11-20`
- Compatibility flag: `nodejs_compat` (from wrangler.toml)

The build generates Pages Functions from the current Netlify functions. All business logic stays sourced from `../netlify/functions`, and HTML/CSS/JS from `../public/rivis-cloud`. The generated browser gateway uses `/api/`, while Netlify retains `/.netlify/functions/`. These are independent deployments.

## Environment variables (Cloudflare Pages > Settings > Variables and Secrets)

Required:
- `GOOGLE_CLIENT_ID` — Google OAuth public client ID
- `GOOGLE_CLIENT_SECRET` — secret, NEVER commit
- `RIVIS_SESSION_SECRET` — 32 random bytes encoded as base64, secret, NEVER commit
- `RIVIS_DRIVE_FOLDER_ID` — existing Google Drive folder ID

Set `RIVIS_BASE_URL` to the exact Cloudflare project URL, e.g. `https://rivis-cloud.pages.dev`.
Additional optional legacy storage env vars (if enabled in Netlify) should be copied from Netlify settings, not from source files.

## Google OAuth

Add the authorized redirect URI:
`https://<actual-cloudflare-project>.pages.dev/rivis-cloud/callback`

Ensure OAuth consent screen and authorized origins match your Google project. Users need to reconnect once on the new domain.


## RIVIS Motion Studio · Google Veo 3.1

Motion Studio uses the Cloudflare Pages API routes `/api/motion-generate` and `/api/motion-status`. Google credentials stay in Cloudflare Secrets; they are never sent to the Canvas/browser.

Required Cloudflare variables/secrets:
- `RIVIS_VEO_SERVICE_ACCOUNT_JSON` — Secret containing the full Google Cloud service-account JSON (including `client_email`, `private_key`, and `project_id`). Never commit this value or paste it into the Canvas source.
- `RIVIS_VEO_GCS_BUCKET` — name of the Google Cloud Storage bucket used for generated MP4 files (bucket name only, without `gs://`).

Optional variables:
- `GOOGLE_CLOUD_PROJECT` — overrides the service-account `project_id`.
- `RIVIS_VEO_LOCATION` — defaults to `us-central1`.
- `RIVIS_VEO_GCS_PREFIX` — defaults to `rivis-motion`.

Google Cloud preparation:
1. Enable the Vertex AI API (`aiplatform.googleapis.com`) and Cloud Storage for the project; attach an active billing account.
2. Create a dedicated service account for RIVIS Motion Studio.
3. Grant Vertex AI User (`roles/aiplatform.user`) and Storage Object Admin (`roles/storage.objectAdmin`) on the output bucket to that service account.
4. Add the service-account JSON and bucket name to Cloudflare Pages > Settings > Variables and Secrets. Keep the JSON as a Secret.
5. Redeploy the Pages project after adding the variables.

The MVP uses Veo 3.1 image-to-video, 4/6/8-second clips, 24 fps, 720p/1080p, 1–4 variations, and silent MP4 output. Each operation is polled separately; completed video objects remain in the configured GCS bucket and the browser receives short-lived signed preview/download URLs. Google Cloud usage and video-generation charges apply.

## Pre-cutover checks

1. Load `/rivis-cloud/`, verify `/api/gateway-config`.
2. Complete Google sign-in, verify `/api/session` has `connected: true`.
3. Verify JSON library list, save and load one test card.
4. Verify metadata-only update, thumbnail, 4K chunked upload, download ZIP and deletion.
5. Check errors and CPU consumption in Cloudflare logs.

**Do not switch the Canvas Gateway URL before all checks pass.**
Existing Netlify project stays intact as fallback.

## Key limitations

Cloudflare Workers Free has limited CPU per request. This compatibility adapter minimizes code divergence but requires runtime testing, especially for large JSON catalog updates and concurrent uploads. The build does not create a Cloudflare account or register Google OAuth on your behalf.
