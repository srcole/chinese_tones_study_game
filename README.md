# Tone Garden

A static browser game for practicing simplified Chinese tones with the included `chinese_word_database_20260909.csv`.

## Run locally

From this directory, run:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. Use a web server rather than opening `index.html` directly, because the game fetches the CSV.

## Play

Choose a maximum priority (default: **2**). All eligible words at or below that priority are shuffled without repetition. Enter accented pinyin (`bái sè`), numbered pinyin (`bai2 se4`), or tone numbers (`24`). Spaces and capitalization are ignored; neutral tones accept `0` or `5`, and ü accepts `ü`, `v`, or `u:`.

Press Enter to check and again to advance. Each answer reveals Chinese, pinyin, tone numbers, and English. Reveal answer counts as an incorrect answer. Changing settings starts a fresh session; progress is not saved after reloading. Grading follows the CSV's written pronunciation, including its tone choices, rather than applying spoken tone changes.

Each reveal also includes the example sentence in Chinese, pinyin, and English, plus the CSV's Chinese–English character/word breakdown (`word1` through `word4`). Breakdowns preserve the supplied components, which sometimes contain multiple characters. Missing examples or breakdowns are marked as unavailable.

The CSV is read at startup. Rows missing required fields or with unparseable pinyin are excluded, with a count shown before play.

## GitHub Pages

Publish this folder from a GitHub Pages branch. Keep `index.html`, `style.css`, `engine.js`, `app.js`, and the CSV together. All paths are relative, so repository subpaths work. No build step, account, API key, or external dependencies are required.

## Verify grading (macOS)

```sh
swift -module-cache-path /tmp/tone-garden-swift-cache tests/run.swift
```

Uses the system JavaScriptCore engine to check answer formats, neutral tones, Unicode, CSV quoting, shuffling, and grading against the entire dataset.
