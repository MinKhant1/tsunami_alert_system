#!/bin/sh
set -e
cd /app
alembic -c alembic.ini upgrade head
exec "$@"
