#!/usr/bin/env bash

set -euf -o pipefail

BEARER_TOKEN=$(jq -r .access_token < .auth/access-token.json)

curl --silent -H "Authorization: Bearer ${BEARER_TOKEN}" "$@" | jq