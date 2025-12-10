#!/bin/sh
prisma migrate deploy
prisma generate
exec "$@"
