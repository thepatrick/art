# TODOne?

- infra: add `GET /asset` to list current assets
  - cli: add `task list-assets`
- infra: add `PATCH /asset/${assetId}` to allow setting metadata - primarily add a friendly name, artist, source, notes
  - cli: add this to the existing upload-asset.sh process
  - cli: add `task update-asset-metadata NAME=... ARTIST=... SOURCE=... NOTES=...`
- infra: add `GET /asset/{assetId}` including a signed URL to download the asset
- infra: add a Playlist model - Owner, PlaylistId, Name, Scenes: List(Assets: List(AssetId), Duration)
- infra: add a `PUT /playlist` to create a playlist
  - cli: add a `task create-playlist NAME="some name"`
