# gbline-data

Public data for the GBLiNE TV app — no app code here.

- `.github/workflows/epg.yml` — every 12 hours downloads TV guides with the
  [iptv-org/epg](https://github.com/iptv-org/epg) grabber for channels that
  have a live stream in [iptv-org](https://github.com/iptv-org/iptv), and
  publishes one compact JSON per country on the `data` branch:
  `https://raw.githubusercontent.com/Adam-CZPG/gbline-data/data/epg/<CC>.json`
- Countries: `COUNTRIES` in `scripts/make-channels.mjs`, or the Run workflow input.

Programme listings belong to the broadcasters and guide sites they come from.
