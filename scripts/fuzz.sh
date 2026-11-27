#!/usr/bin/env bash
# Bundles the core logic with Vite (the sources use extensionless imports), then runs the randomized checks on every core.
set -e
DIR="$(mktemp -d)"
npx vite build --config scripts/fuzz.vite.config.mjs --outDir "$DIR" --emptyOutDir >/dev/null
FUZZ_LIB="$DIR/lib.mjs" node scripts/fuzz.mjs "$@"
