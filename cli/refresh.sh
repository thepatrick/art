#!/usr/bin/env bash

source config.sh

mkdir -p .auth

REFRESH_TOKEN=$(jq -r .refresh_token < .auth/refresh-token.json)

curl --request POST \
  --url 'https://twopats.au.auth0.com/oauth/token' \
  --header 'content-type: application/x-www-form-urlencoded' \
  --data grant_type=refresh_token \
  --data "client_id=${ART_CLI_CLIENT_ID}" \
  --data "refresh_token=${REFRESH_TOKEN}" \
  --silent | jq > .auth/access-token.json


HAS_ERROR=$(jq 'has("error")' < .auth/access-token.json)

if [[ "$HAS_ERROR" = "true" ]]; then

  DESCRIPTION=$(jq -r .error_description < .auth/access-token.json)

  echo "Oh oh :("
  echo "${DESCRIPTION}"

  exit 1

fi

echo "Seems like you are good to go!"