# TODO

## Make it usable

- [x] infra: add a `GET /playlist` to list existing playlists
  - [x] cli: add a `task list-playlists`
- [ ] infra: add a `GET /playlist/{playlistId}` (this should support caching using an etag based on LastUpdated)
  - cli: add a `task get-playlist PLAYLIST_ID=...`
- [ ] infra: add a `DELETE /playlist/{playlistId}`
  - cli: add a `task delete-playlist PLAYLIST_ID=...`
- [ ] infra: add a `PATCH /playlist/{playlistId}` to modify playlists (_must_ modify LastUpdated)
  - cli: add a `task add-to-playlist PLAYLIST_ID=... ASSETS=ASSET_ID,... DURATION=...`
  - cli: add a `task remove-from-playlist PLAYLIST_ID=... SCENE=`
- [ ] infra: add a `PATCH /surface/{surfaceId}` to set Rotation (default = 0, 90, 180, 270)
  - cli: add a task set-surface-rotation SURFACE_ID=... ROTATION=...
  - infra: update `GET /surface/{surfaceId}/hello` to include Rotation
  - Projector: read Rotation from `GET /surface/{surfaceId}/hello` and update UI.
- [ ] infra: add a `PATCH /surface/{surfaceId}` to set PlaylistId
  - cli: add a task set-surface-playlist SURFACE_ID=... PLAYLIST_ID=...
- [ ] infra: add PlaylistId to `GET /surface/{surfaceId}/hello`
- [ ] Projector: fix login
- [ ] Projector: update hello process to fetch playlistId and fetch the playlist
  - UI should show a "No playlists" if PlaylistId is null/undefined
  - UI should show a "Loading playlist..." while loading the playlist ()
- [ ] Projector: download assets for current playlist
- [ ] Projector: show assets from playlist (v0 only show first asset in each scene)
  - show first scene
  - advance after duration
  - when reach end of playlist go to scene 0
- [ ] Projector: add a timer to query `/surface/{surfaceId}/hello` for PlaylistId changes
  - while not backgrounded
  - if PlayListId is different, start from scene 0
  - if not different do a `GET /playlist/{playlistId}` with an etag or something with LastUpdated
  - if LastUpdated has changed treat as if a new playlist (restart from scene 0)

## Make it usable without restarting the app

- [ ] infra: add info to /surface/{surfaceId}/hello to allow connecting to ably
- [ ] Porjector: connect to ably
- [ ] infra: when a playlist is modified, look up surfaces that use that playlist and notify the ably channel for that surface
- [ ] infra: when a surface is modified, notify ably
- [ ] decision: provide a way to know whats on a projector (maybe there's a way to do this with ably rather than keeping state)
- [ ] decision: provide a way to advance to a different scene in the current playlist
- [ ] infra: `DELETE /asset/{assetId}`
  - delete from S3
  - delete from dynamodb
  - remove from any playlists
  - notify surfaces that their playlist changed
- [ ] infra: make `PATCH /asset/{assetId}` with an invalid assetId error better than "something went wrong"

## Later

- [ ] Projector: show multiple assets per scene
- [ ] Projector: handle files on disk appropriately - understand tvOS limits
  - remove any cached assets if not present in any scene in the current playlist
- [ ] figure out RBAC or something to prevent random people signing up for this
- [ ] a webapp instead of the CLI
- [ ] infra: `GET /asset` should use scope `asset` (it's read only after all)
- [ ] infra: `POST /playlist` should probably have a `playlist:write` scope?
- [ ] cloudwatch log retention
