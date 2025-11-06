# SvelteKit on AWS: CloudFront + S3 (Static) and API Gateway → Lambda

Svelte 5 + SvelteKit application deployed with a serverless architecture on AWS. The static site is built with the SvelteKit static adapter and served from S3 via CloudFront; dynamic API endpoints under `/api/*` are routed through API Gateway (HTTP API) to a Node.js 20 Lambda function. Infrastructure is defined with AWS CDK. Development uses Bun.

Badges (if configured): build status, coverage, and deploy environment can be added via your CI system.

## 1) Project Overview

- SvelteKit application (Svelte 5) built with the static adapter for a fast, cache-friendly static site.
- Serverless API: CloudFront routes `/api/*` to API Gateway HTTP API which invokes a Node.js 20 Lambda.
- AWS CDK (Typescript) provisions S3, CloudFront with Origin Access Control (OAC), API Gateway, and Lambda.
- Key decisions:
  - Bun for package management and scripts.
  - Static site for predictable performance and low cost; API via Lambda for elasticity.
  - CloudFront SPA deep-link fallback (403/404 → `/index.html`).
  - Lambda logs retained for one day (adjustable), minimal memory for cost.

## 2) Setup Instructions

Prerequisites:
- `bun` ≥ 1.x installed
- Node.js ≥ 20.x (runtime matches Lambda)
- AWS account with permissions to deploy CDK stacks
- AWS CLI configured (`aws configure`) or environment variables set
- Optional: CDK CLI (used via Bunx)

Install dependencies:

```sh
# in the project root
bun install

# for the CDK app (infra)
cd infra
bun install
```

AWS credentials and configuration:
- Use one of the following approaches before deploying:
  - Environment variables: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`
  - Or set `AWS_PROFILE` to an existing profile from `~/.aws/credentials`
- The CDK app reads `CDK_DEFAULT_ACCOUNT` and `CDK_DEFAULT_REGION` (defaults provided in `infra/bin/app.ts`). You can set them explicitly:

```sh
# example environment
set CDK_DEFAULT_ACCOUNT=123456789012
set CDK_DEFAULT_REGION=ca-central-1
```

CDK bootstrap (first-time per account/region):

```sh
# replace with your account and region
bunx cdk bootstrap aws://123456789012/ca-central-1
```

Environment variables used by the app:
- None are strictly required for local development. The demo API client calls relative paths (`/api/ping`, `/api/echo`) that CloudFront routes to API Gateway in production.
- Lambda relies on standard AWS-provided env vars like `AWS_REGION` and `AWS_LAMBDA_FUNCTION_NAME`.

## 3) Development Commands

Local development (SvelteKit + Vite):

```sh
bun run dev
```

- Default dev server is `http://localhost:5173/`. For quick health checks, also ensure `http://127.0.0.1:8081/` is not already being used, and avoid running a build while an existing dev server is active on 5173/5174.

Production build:

```sh
bun run build
```

Static output is generated via `@sveltejs/adapter-static` into `build/`.

Tests:

```sh
# placeholder — tests are not yet configured in package.json
# recommended checks for now:
bun run check     # svelte-kit sync + svelte-check
bun run lint      # prettier + eslint
```

Deploy infrastructure (CDK) and site assets:

```sh
# 1) Deploy infra (creates S3 bucket, CloudFront, API Gateway, Lambda)
cd infra
bunx cdk deploy

# 2) Build static site
cd ..
bun run build

# 3) Upload to the provisioned S3 bucket (replace with the BucketName output)
aws s3 sync ./build s3://<BucketName> --delete

# 4) Invalidate CloudFront (replace with DistributionId output)
aws cloudfront create-invalidation --distribution-id <DistributionId> --paths "/*"

# 5) Visit the CloudFront domain output (DistributionDomain)
```

## 4) Deployment Architecture

High-level flow:

```
Browser → CloudFront
  ├── Default behavior → S3 bucket (private via OAC)
  └── /api/* → API Gateway (HTTP API) → Lambda (Node 20)
```

Lambda function configuration:
- Runtime: `nodejs20.x`
- Handler: `index.handler` (inline code in CDK)
- Memory: 128 MB (tunable)
- Timeout: 5 seconds (tunable)
- Log retention: 1 day (CloudWatch)

API Gateway (HTTP API):
- Route: `ANY /api/{proxy+}` → Lambda integration
- CORS: permissive for demo (`*` origins, methods, headers)

CloudFront:
- Default behavior: static content from S3 with HTTPS redirect and optimized caching
- Additional behavior: `api/*` forwarded to API Gateway with caching disabled
- SPA fallback: 403/404 responses rewritten to `/index.html`
- Security headers enabled

S3:
- Private bucket with Block Public Access and OAC linking from CloudFront
- Server-side encryption enabled

## 5) Project Structure

Key directories:
- `src/` — SvelteKit app (Svelte 5)
  - `routes/` — pages and demos
    - `+page.svelte` — landing page linking to API/SSR demos
    - `demo/api/` — GET `/api/ping` demo
    - `demo/post/` — POST `/api/echo` demo
    - `demo/ssr/` — example of server-side load (prerendered with static adapter)
  - `lib/api.ts` — minimal runtime client for `/api/*`
- `infra/` — AWS CDK app
  - `bin/app.ts` — CDK entrypoint and environment
  - `lib/web-stack.ts` — defines S3, CloudFront, API Gateway, and Lambda

Lambda handler location:
- The demo Lambda is defined inline in `infra/lib/web-stack.ts` using `lambda.Code.fromInline(...)` with `handler: 'index.handler'`.
- For larger apps, consider packaging your Lambda from source with `Code.fromAsset(...)` and a dedicated handler file.

SvelteKit-specific files:
- `svelte.config.js` — uses `@sveltejs/adapter-static` and enables full prerender
- `src/routes/+layout.ts` — `export const prerender = true`
- `vite.config.ts` — SvelteKit vite plugin configuration

## 6) CI/CD Pipeline

Automated deployment is not configured in this repo. A typical GitHub Actions pipeline could:
- Install Bun, run `bun install`, build the static site.
- Configure AWS credentials via OIDC or an access key.
- Deploy CDK stack (`bunx cdk deploy`).
- Sync `build/` to the S3 bucket and invalidate CloudFront.
- Run checks (`bun run check`, `bun run lint`) before deploying.

Example workflow snippet:

```yaml
name: deploy
on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run build
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::<ACCOUNT_ID>:role/<ROLE_NAME>
          aws-region: ca-central-1
      - run: |
          cd infra
          bun install
          bunx cdk deploy --require-approval never
      - run: |
          aws s3 sync ./build s3://<BucketName> --delete
          aws cloudfront create-invalidation --distribution-id <DistributionId> --paths "/*"
```

## 7) Troubleshooting

Common issues:
- 403 from CloudFront on static assets → ensure you uploaded to the correct bucket and that the distribution uses OAC; verify `defaultRootObject: index.html`.
- Deep-linking returns 404/403 → the distribution defines SPA fallback to `/index.html`; make sure your client-side routes exist.
- CORS errors on `/api/*` → verify CORS settings on the HTTP API (demo allows `*` but you can restrict in production).
- CDK errors about bootstrap → run `bunx cdk bootstrap` for the target account/region.
- Missing outputs (BucketName, DistributionId, DistributionDomain) → re-run `bunx cdk deploy` and check the terminal outputs.

Debugging Lambda locally:
- This demo uses inline code in CDK; for deeper local debugging, move the handler to source and use `Code.fromAsset(...)`, then run with tools like SAM or `node` locally.
- Ad-hoc remote invocation:

```sh
# call the GET endpoint via API Gateway base URL
curl -s "https://<api-id>.execute-api.<region>.amazonaws.com/api/ping"

# invoke directly (replace function name)
aws lambda invoke --function-name <FunctionName> --payload '{"rawPath":"/api/ping","requestContext":{"http":{"method":"GET"}}}' out.json && cat out.json
```

Viewing CloudWatch logs:

```sh
# tail function logs (replace with actual name)
aws logs tail /aws/lambda/<FunctionName> --follow --since 1h
```

## Notes

- Styling in the demo uses utility classes that match Tailwind conventions; integrate TailwindCSS if you plan to extend styles broadly.
- To switch from static prerender to SSR on Lambda, replace `@sveltejs/adapter-static` with an AWS Lambda-compatible SSR adapter and remove `prerender` entries.
- Svelte 5 runes/new syntax is used in the app; avoid mixing legacy event handler syntaxes.
