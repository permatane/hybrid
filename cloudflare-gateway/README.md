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


## RIVIS Motion Studio

Motion Studio does not call Vertex AI or require Google Cloud service-account credentials. RIVIS prepares the source image and prompt for the supported Gemini/Veo user interface; the user generates the clip in Gemini and imports the resulting MP4 into RIVIS. Batch mode exports a ZIP of source images and prompts. The Cloud Gateway remains dedicated to Drive JSON Gallery storage.

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
