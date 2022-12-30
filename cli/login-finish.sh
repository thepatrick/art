#!/usr/bin/env bash

mkdir -p .auth

DEVICE_CODE=$(jq -r .device_code < .auth/device-code.json)

curl --request POST \
  --url "${ART_CLI_AUTH}/oauth/token" \
  --header 'content-type: application/x-www-form-urlencoded' \
  --data grant_type=urn:ietf:params:oauth:grant-type:device_code \
  --data "device_code=${DEVICE_CODE}" \
  --data "client_id=${ART_CLI_CLIENT_ID}" \
  --silent > .auth/refresh-token.json

HAS_ERROR=$(jq 'has("error")' < .auth/refresh-token.json)

if [[ "$HAS_ERROR" = "true" ]]; then

  DESCRIPTION=$(jq -r .error_description < .auth/refresh-token.json)

  echo "Oh oh :("
  echo "${DESCRIPTION}"

  exit 1

fi

echo "Seems like you are good to go!"

jq 'del(.refresh_token)' < .auth/refresh-token.json > .auth/access-token.json
