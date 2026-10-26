# gbline-data

Public data for the GBLiNE TV app — no app code here.

- `.github/workflows/epg.yml` — every 12 hours downloads TV guides with the
  [iptv-org/epg](https://github.com/iptv-org/epg) grabber for every channel
  that has a live stream in [iptv-org](https://github.com/iptv-org/iptv), in
  all countries (each channel from its best guide site plus a backup site,
  split into parallel jobs), and publishes one compact JSON per country on the
  `data` branch:
  `https://raw.githubusercontent.com/Adam-CZPG/gbline-data/data/epg/<CC>.json`
- All countries by default; the Run workflow input can limit it to a few (comma-separated ISO codes).

Programme listings belong to the broadcasters and guide sites they come from.
