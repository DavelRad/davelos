# Single Cloud Run service: build the React SPA, then serve the static site AND
# the FastAPI "Ask Davel" API from one uvicorn process — so the whole site is
# one Cloud Run service on one origin (no Firebase, no CORS, no /api rewrite).

# ---- stage 1: build the frontend ----
FROM node:20-slim AS web
WORKDIR /web
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build          # -> /web/dist

# ---- stage 2: python server (serves ./static + /api) ----
FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1
WORKDIR /app
COPY server/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY server/ ./
COPY --from=web /web/dist ./static
ENV PORT=8080
EXPOSE 8080
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT}
