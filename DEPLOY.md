# Deploying davelOS to GCP

The site is two pieces, both on **your** GCP:

| Piece | Hosts | Service |
| --- | --- | --- |
| **Frontend** (static SPA) | the desktop UI | **Firebase Hosting** (global CDN) |
| **Backend** (`server/`) | the "Ask Davel" bot + Spotify | **Cloud Run** service `ask-davel` |

Firebase Hosting rewrites `/api/**` → the Cloud Run service, so to the browser
it's all one origin (`davelradindra.com`). No CORS, no second domain.

> **Never put your Anthropic API key in a file or in chat.** It lives only in
> **GCP Secret Manager**; Cloud Run reads it at runtime. The repo and this doc
> only ever reference the secret *name* (`anthropic-api-key`).

Pick a globally-unique project id and reuse it everywhere below:

```bash
export PROJECT_ID=davel-portfolio       # change if taken; must be globally unique
export REGION=us-central1
```

If you change `PROJECT_ID`, update `.firebaserc` (`projects.default`). If you
change `REGION`, update both `firebase.json` (the `run` rewrite) and the deploy
commands.

---

## 0. One-time auth (interactive — run these yourself)

```bash
gcloud auth login
firebase login
```

## 1. Create the dedicated project + link billing

```bash
gcloud projects create "$PROJECT_ID" --name="Davel Portfolio"
gcloud config set project "$PROJECT_ID"

gcloud billing accounts list                       # copy your ACCOUNT_ID
gcloud billing projects link "$PROJECT_ID" --billing-account=ACCOUNT_ID
```

## 2. Enable the APIs

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  firebasehosting.googleapis.com \
  firebase.googleapis.com
```

## 3. Store the Anthropic key in Secret Manager

Paste your key into **your** terminal (not into chat / the repo):

```bash
printf "%s" "sk-ant-XXXXXXXX" | gcloud secrets create anthropic-api-key --data-file=-
```

Let Cloud Run's runtime service account read it:

```bash
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
gcloud secrets add-iam-policy-binding anthropic-api-key \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## 4. Deploy the backend (Cloud Run)

Builds from source via Cloud Build (no local Docker needed):

```bash
gcloud run deploy ask-davel \
  --source server \
  --region "$REGION" \
  --allow-unauthenticated \
  --max-instances 1 \
  --memory 512Mi \
  --set-secrets ANTHROPIC_API_KEY=anthropic-api-key:latest
```

`--max-instances 1` keeps the in-memory rate limiter globally accurate and the
cost near zero. Note the printed **Service URL**; sanity-check it:

```bash
curl https://ask-davel-XXXX-uc.a.run.app/api/health
# {"status":"ok","model":"claude-haiku-4-5","ask_enabled":true}
```

> Spotify is optional — add `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`,
> `SPOTIFY_REFRESH_TOKEN` the same way (Secret Manager + `--set-secrets`) once
> you've minted a refresh token (`node scripts/spotify-auth.mjs`). Until then the
> Spotify app shows tasteful mock data.

## 5. Deploy the frontend (Firebase Hosting)

```bash
firebase use "$PROJECT_ID"
npm install && npm run build
firebase deploy --only hosting
```

This prints a live `https://<PROJECT_ID>.web.app` URL. Open it — the bot,
Spotify, everything should work end to end.

## 6. Point davelradindra.com at it

```bash
firebase hosting:sites:list           # confirm the site
# Then: Firebase console → Hosting → Add custom domain → davelradindra.com
```

Firebase shows the **A / TXT records** to set at your domain registrar. Add
them, wait for the SSL cert to provision (minutes–hours). **Your current old
site goes down once DNS cuts over**, so do this when you're happy with the new one.

---

## Optional: CI/CD (auto-deploy on push to main)

`.github/workflows/deploy.yml` deploys both pieces on every push to `main`.
It needs a deploy service account + two GitHub secrets:

```bash
gcloud iam service-accounts create gh-deployer --display-name="GitHub deployer"
SA="gh-deployer@${PROJECT_ID}.iam.gserviceaccount.com"
for ROLE in run.admin iam.serviceAccountUser firebasehosting.admin \
            cloudbuild.builds.editor artifactregistry.writer \
            secretmanager.secretAccessor serviceusage.serviceUsageConsumer; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SA" --role="roles/$ROLE"
done
gcloud iam service-accounts keys create key.json --iam-account="$SA"
```

Then in **GitHub → repo → Settings → Secrets and variables → Actions**:

- `GCP_PROJECT_ID` = your `$PROJECT_ID`
- `GCP_SA_KEY` = the full contents of `key.json`

…and **delete `key.json` locally** afterward (`rm key.json`). For a hardened
setup, replace the JSON key with **Workload Identity Federation**
(`google-github-actions/auth` supports it with no long-lived key).
