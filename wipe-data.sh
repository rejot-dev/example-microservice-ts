#!/bin/bash
set -ex

docker compose down

docker compose config --format json | jq -r '.volumes[] .name' | xargs docker volume rm
