#!/usr/bin/env bash
#
# Push the local Postman collection to the Postman cloud workspace.
#
# Usage:
#   POSTMAN_API_KEY=PMAK-xxxx POSTMAN_COLLECTION_UID=<uid> ./scripts/sync-postman.sh
#
# Both values are also picked up from .env (gitignored). NEVER hardcode the API
# key here — pass it via the environment. Create the collection once in Postman
# (import postman/level-up-backend.postman_collection.json), then set its UID.

set -euo pipefail

COLLECTION_FILE="${COLLECTION_FILE:-postman/level-up-backend.postman_collection.json}"

# repo root, so the script works regardless of cwd
cd "$(dirname "$0")/.."

# load .env if present (gitignored) so POSTMAN_API_KEY / UID are picked up
if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

if [[ -z "${POSTMAN_API_KEY:-}" ]]; then
  echo "error: POSTMAN_API_KEY is not set (export it or add it to .env)" >&2
  exit 1
fi

if [[ -z "${POSTMAN_COLLECTION_UID:-}" ]]; then
  echo "error: POSTMAN_COLLECTION_UID is not set" >&2
  echo "  import $COLLECTION_FILE into Postman once, then set its UID" >&2
  exit 1
fi

if [[ ! -f "$COLLECTION_FILE" ]]; then
  echo "error: collection file not found: $COLLECTION_FILE" >&2
  exit 1
fi

# validate JSON before sending
if ! python3 -m json.tool "$COLLECTION_FILE" >/dev/null 2>&1; then
  echo "error: $COLLECTION_FILE is not valid JSON" >&2
  exit 1
fi

echo "Syncing $COLLECTION_FILE -> Postman collection $POSTMAN_COLLECTION_UID ..."

# Postman API expects { "collection": <collection object> }
payload="$(python3 -c 'import json,sys; print(json.dumps({"collection": json.load(open(sys.argv[1]))}))' "$COLLECTION_FILE")"

http_code="$(curl -sS -o /tmp/postman_sync_resp.json -w '%{http_code}' \
  -X PUT "https://api.getpostman.com/collections/${POSTMAN_COLLECTION_UID}" \
  -H "X-Api-Key: ${POSTMAN_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$payload")"

if [[ "$http_code" == "200" ]]; then
  echo "✓ collection synced"
else
  echo "✗ sync failed (HTTP $http_code):" >&2
  cat /tmp/postman_sync_resp.json >&2
  echo >&2
  exit 1
fi
