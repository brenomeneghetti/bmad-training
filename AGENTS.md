# Repository instructions

## Local verification

Before package/test commands, create `.cache/{home,tmp,browsers,config,data,runtime,npm,pnpm}`
inside this checkout. Set `HOME`, `TMPDIR`, `TMP`, `TEMP`, `XDG_CACHE_HOME`,
`XDG_CONFIG_HOME`, `XDG_DATA_HOME`, `XDG_RUNTIME_DIR`, `npm_config_cache`, `PNPM_HOME` and
`PLAYWRIGHT_BROWSERS_PATH` to those repository-local paths when using the
repository's evidence runner.

`pnpm run evidence:run` sets these paths for its children. Browser installation
is test-only: `pnpm run test:e2e:install` with the same local environment.
The user removed the working-folder-only restriction on 2026-10-07. Necessary
external runtime/tool access and test-only browser prerequisites are permitted.
Prefer repository-local artifacts and caches; install missing prerequisites
through supported tooling without weakening evidence checks or changing
unrelated system configuration. Report permission or compatibility blockers
explicitly rather than claiming passing verification.

Evidence inventory and coverage are reviewed contracts, not output refreshed by
the evidence runner. Update exact identities deliberately when tests change;
do not accept counts, source references, or prior manifests as execution proof.

The user approved Chromium-only MVP browser validation on 2026-10-07.
Additional-browser verification belongs to Epic 4. A Chromium passing manifest
does not establish Firefox, WebKit, released-browser OS/mobile or manual coverage.
