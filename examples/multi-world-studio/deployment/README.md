# Multi-world studio deployment runbook

This directory contains deployment-safe configuration examples for the local
Codex Brain control plane. It does not contain credentials or claim that a
platform, model, or media provider is connected.

## 1. Prepare an immutable project

Run from the repository root:

```powershell
npm run worlds:review
npm run worlds:rebuild
npm run worlds:brain-status
npm run worlds:forecast
npm run validate
```

Use a durable, access-controlled path for `.build/multi-world-studio` in a
deployment. The artifact store is immutable; take filesystem snapshots or use
the bundle transfer tools rather than editing JSON in place.

## 2. Start a read-only local service

```powershell
$env:WORLD_OS_HTTP_TOKEN = (Get-Random -Minimum 100000000 -Maximum 999999999).ToString()
npm run worlds:serve
```

The default binding is loopback. Query `/health` or `/healthz` and verify the
advertised route list before allowing a UI or scheduler to call the service.
`POST /v1/brain/runs` is bounded and dry-run by default.

`world-os forecast --worlds W01,W02` or `GET /v1/brain/forecast?worlds=W01,W02`
is the read-only continuation preview. It exposes candidates and projected
successor summaries with `persisted:false`; the HTTP response deliberately omits
the full successor State to keep a UI response bounded. The CLI includes the
unpersisted State preview. Neither form advances either world.

## 3. Enable a reviewed MCP connector

For an HTTP/Streamable-HTTP endpoint, inject the API key under the name chosen
by `WORLD_OS_MCP_HTTP_API_KEY_ENV`, then start the service with an explicit
trusted connector and network flag:

```powershell
$env:WORLD_OS_HTTP_TOKEN = '<deployment-token>'
$env:WORLD_OS_MCP_HTTP_TRUSTED = 'true'
$env:WORLD_OS_MCP_HTTP_ENDPOINT = 'https://platform.example/mcp'
$env:WORLD_OS_MCP_HTTP_API_KEY_ENV = 'WORLD_OS_MCP_API_KEY'
$env:WORLD_OS_MCP_API_KEY = '<secret-from-secret-manager>'
npm run worlds -- serve .build/multi-world-studio --host 127.0.0.1 --port 8787 --token-env WORLD_OS_HTTP_TOKEN --http-endpoint $env:WORLD_OS_MCP_HTTP_ENDPOINT --http-trusted --api-key-env WORLD_OS_MCP_HTTP_API_KEY --allow-network
```

The platform profile, server alias, tool name, audience and release Gate must
match the exact Dispatch. A connector receives only that Dispatch and an abort
signal. It never receives a project path or State/Canon writer.

## 4. Enable a proposal-only LLM shadow

First store exactly one enabled `ProviderPolicy` and one bound
`SimulationRequest` in the immutable project. Then inject the endpoint/model
settings and start with the server-side profile factory:

```powershell
$env:WORLD_OS_LLM_TRUSTED = 'true'
$env:WORLD_OS_LLM_ENDPOINT = 'https://model.example/v1/chat/completions'
$env:WORLD_OS_LLM_MODEL = 'reviewed-model-alias'
npm run worlds -- serve .build/multi-world-studio --token-env WORLD_OS_HTTP_TOKEN --shadow-profiles examples/multi-world-studio/providers/http-shadow-profiles.example.mjs --allow-llm-network
```

The HTTP caller can select a configured profile ID, but cannot send a provider,
prompt, credential, or mutation instruction. The model response is sanitized,
validated as an EventProposal, recorded with bounded usage, and remains
`proposal_only`; Codex and the deterministic adjudicator still decide whether
anything can commit.

## 5. Operational acceptance

Before enabling network effects, check all of the following:

- `/health` reports the expected route list and authentication requirement.
- `world-os brain-status` and `world-os verify` pass on the same project path.
- `world-os outbox` contains only exact, non-authoritative projections for the
  reviewed platform profile.
- A `--dry-run` dispatch creates no platform receipt and a trusted connector
  test returns the same idempotency key.
- A model shadow creates no EventCommit, StateSnapshot successor, CanonFact or
  Canon promotion by itself.
- Production remains `private_workspace` until human QA, ApprovedAsset and
  Release Gate evidence are all present.

Real webhook signature validation, account isolation, rate limits, billing
reconciliation, backups and incident response remain deployment responsibilities.
