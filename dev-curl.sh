#!/usr/bin/env bash

BEARER_TOKEN=$(jq -r .access_token < .auth/bearer-token.json)

curl -H "Authorization: Bearer ${BEARER_TOKEN}" "$@" --silent | jq