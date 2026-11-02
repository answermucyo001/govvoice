#!/bin/sh
set -e

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[entrypoint] running database migrations..."
  node server/src/db/migrate.js
fi

if [ "${RUN_SEED:-false}" = "true" ]; then
  echo "[entrypoint] seeding Rwanda locations, categories and super admin..."
  node server/src/db/seed.js
fi

exec "$@"
