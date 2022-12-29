#!/usr/bin/env bash

set -euf -o pipefail

source config.sh

echo "Hello"

BEARER_TOKEN=$(jq -r .access_token < .auth/access-token.json)

curl -H "Authorization: Bearer ${BEARER_TOKEN}" "$@" --silent | jq