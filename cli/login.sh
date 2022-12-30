#!/usr/bin/env bash

mkdir -p .auth

curl --request POST \
  --url 'https://twopats.au.auth0.com/oauth/device/code' \
  --header 'content-type: application/x-www-form-urlencoded' \
  --data "client_id=${ART_CLI_CLIENT_ID}" \
  --data "scope=asset:write surface offline_access email" \
  --data "audience=${ART_CLI_AUDIENCE}" \
  --silent > .auth/device-code.json

# jq < .auth/device-code.json -r 

LOGIN_URL=$(jq -r .verification_uri_complete < .auth/device-code.json)


echo "Visit ${LOGIN_URL}, then run ./login-finish.sh to continue"