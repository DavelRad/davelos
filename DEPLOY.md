# Deploying davelOS to GCP

The whole site — the desktop UI **and** the "Ask Davel" bot — is **one Cloud Run
service** (`davelos`). The container builds the React SPA, then a FastAPI process
serves the static site plus `/api/*`. One service, one origin, no Firebase, no CORS.

- **Project:** `davel-portfolio`
- **Region:** `us-central1`
- **Service:** `davelos`
- **Live URL:** https://davelos-630783796094.us-central1.run.app

> **Never put your Anthropic API key in a file, the repo, or chat.** It lives only
> in **GCP Secret Manager**; Cloud Run reads it at runtime.

```bash
export PROJECT_ID=davel-portfolio
export REGION=us-central1
```

---

## What's already done

The project, billing, APIs, and first deploy are live (see commands below for
reference / reproducing in a fresh project):

```bash
gcloud auth login
gcloud projects create "$PROJECT_ID" --name="Davel Portfolio"
gcloud config set project "$PROJECT_ID"
gcloud billing projects link "$PROJECT_ID" --billing-account=0171B8-386221-6A71D4
gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
  artifactregistry.googleapis.com secretmanager.googleapis.com

# build (Cloud Build runs the root Dockerfile) + deploy:
gcloud run deploy davelos --source . --region "$REGION" \
  --allow-unauthenticated --max-instances 1 --memory 512Mi
```

`--max-instances 1` keeps the in-memory rate limiter globally accurate and the
cost near zero. Re-run the `gcloud run deploy` line any time to ship new code; it
preserves existing env/secret bindings.

---

## 1. Turn the bot on (Anthropic key)

The bot runs in **offline mode** (canned answers) until the key exists. To enable
real answers, in **your own terminal**:

```bash
printf "%s" "sk-ant-XXXXXXXX" | gcloud secrets create anthropic-api-key --data-file=-

# let Cloud Run's runtime service account read it
gcloud secrets add-iam-policy-binding anthropic-api-key \
  --member="serviceAccount:630783796094-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# bind it to the service (creates a new revision)
gcloud run services update davelos --region us-central1 \
  --update-secrets ANTHROPIC_API_KEY=anthropic-api-key:latest
```

Verify: `curl https://davelos-630783796094.us-central1.run.app/api/health`
should now show `"ask_enabled":true`.

> Spotify is optional — add `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`,
> `SPOTIFY_REFRESH_TOKEN` the same way (`node scripts/spotify-auth.mjs` mints the
> refresh token). Until then the Spotify app shows tasteful mock data.

## 2. Point davelradindra.com at it

Cloud Run custom domains need the domain **verified** once, then DNS records:

```bash
# verify ownership (opens Webmaster Central; add the TXT record it gives you)
gcloud domains verify davelradindra.com

# map the domain to the service
gcloud beta run domain-mappings create \
  --service davelos --domain davelradindra.com --region "$REGION"
```

The map command prints the **A/AAAA (or CNAME) records** to set at your registrar.
Add them; the managed SSL cert provisions in minutes–hours. **Your current old
site goes down once DNS cuts over**, so do this when you're happy with the new one.

(Alternatively, front it with Firebase Hosting or a Global External Load Balancer
for a full CDN — not required for a portfolio's traffic.)

---

## Optional: CI/CD (auto-deploy on push to main)

`.github/workflows/deploy.yml` redeploys on every push to `main`. It needs a
deploy service account + two GitHub secrets:

```bash
gcloud iam service-accounts create gh-deployer --display-name="GitHub deployer"
SA="gh-deployer@${PROJECT_ID}.iam.gserviceaccount.com"
for ROLE in run.admin iam.serviceAccountUser cloudbuild.builds.editor \
            artifactregistry.writer storage.admin serviceusage.serviceUsageConsumer; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SA" --role="roles/$ROLE"
done
gcloud iam service-accounts keys create key.json --iam-account="$SA"
```

Then in **GitHub → repo → Settings → Secrets and variables → Actions** add
`GCP_PROJECT_ID` = `davel-portfolio` and `GCP_SA_KEY` = the contents of
`key.json`, then **`rm key.json`**. For a hardened setup, replace the JSON key
with **Workload Identity Federation**.
