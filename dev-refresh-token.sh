#!/usr/bin/env bash

curl --request POST \
  --url 'https://twopats.au.auth0.com/oauth/token' \
  --header 'content-type: application/x-www-form-urlencoded' \
  --data grant_type=refresh_token \
  --data "client_id=${ART_CLIENT_ID}" \
  --data "refresh_token=${ART_REFRESH_TOKEN}" \
  --silent | jq > .auth/bearer-token.json