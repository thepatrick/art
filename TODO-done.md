# TODOne?

- infra: add `GET /asset` to list current assets
  - cli: add `task list-assets`
- infra: add `PATCH /asset/${assetId}` to allow setting metadata - primarily add a friendly name, artist, source, notes
  - cli: add this to the existing upload-asset.sh process
  - cli: add `task update-asset-metadata NAME=... ARTIST=... SOURCE=... NOTES=...`
- infra: add `GET /asset/{assetId}` including a signed URL to download the asset
