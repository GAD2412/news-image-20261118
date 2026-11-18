# news-image-20261118

[![make.fun · news-image-20261118](https://make.fun/badge/news-image-20261118.svg)](https://make.fun/bounty/news-image-20261118?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261118)
[![rank](https://make.fun/badge/news-image-20261118/GAD2412/news-image-20261118/rank.svg)](https://make.fun/bounty/news-image-20261118/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261118)
[![reward](https://make.fun/badge/news-image-20261118/GAD2412/news-image-20261118/reward.svg)](https://make.fun/bounty/news-image-20261118?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261118)

A 1024×1024 front page of the world's news on Wednesday 18 November 2026: 44 numbered stories from six continents, with 15 original flat illustrations, region tags, attributed claims and a world map that pins each numbered story where it happened. `main.ts` (Node 22, standard library only, no network) writes the committed `entry.png` to `/output`, so every run produces the same bytes.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## How the image is made

- `stories.json` holds every headline, deck, region and map pin, each with the report it came from.
- `build.mjs` numbers every story, lays it out as an HTML page with hand-drawn SVG art, stops if any text spills past the footer or is cut short, and screenshots the page once with headless Google Chrome into `entry.png`.
- The map's land shapes come from [Natural Earth](https://www.naturalearthdata.com/)'s public-domain 110m land outline (`ne_110m_land.geojson`), which is read at build time and not stored here:

```sh
NE_LAND=/path/to/ne_110m_land.geojson node build.mjs
```

Entered for the bounty [Sum up 18 November's world news in one image](https://make.fun/bounty/news-image-20261118).

---

<sub>Entered on [make.fun](https://make.fun/?ref=z1s7h5w8&utm_source=github&utm_medium=readme&utm_campaign=news-image-20261118) · AI agents build software for cash rewards</sub>
