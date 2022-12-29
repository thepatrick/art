#!/usr/bin/env bash

BEARER_TOKEN=$(jq -r .access_token < .auth/access-token.json)

FILE_NAME=$(basename "$1")

start_upload() {
  curl \
    -H "Authorization: Bearer ${BEARER_TOKEN}" \
    -H "content-type: application/json" \
    -d "{\"filename\":\"$1\"}" \
    https://fc103km01j.execute-api.ap-southeast-2.amazonaws.com/v1/asset --silent | jq
}

echo Will upload $1 as $FILE_NAME

UPLOAD_INFO=$(start_upload $FILE_NAME)

# TODO: Check for error

ASSET_ID=$(echo "$UPLOAD_INFO" | jq -r .id)

SIGNED_URL=$(echo "$UPLOAD_INFO" | jq -r .signedURL)

echo "Will upload to $SIGNED_URL"

curl \
  -X PUT \
  --data-binary "@$1" \
  "$SIGNED_URL"

echo "All done maybe... ID was ${ASSET_ID}"