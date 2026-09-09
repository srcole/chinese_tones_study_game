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

## Character review

Choose **Review characters** on the home page, then select a pinyin syllable such as `she`, `bai`, or `ba`. The review lists individual characters by tones 1–4 and neutral tone (5/0), using a maximum priority of **5** by default. Its independent priority selector filters both characters and their source words; increasing it adds more vocabulary. It also extracts characters from multi-character words by aligning each Han character with its parsed pinyin syllable. Mixed-script or unaligned entries are excluded from this index.

Characters are deduplicated within each pronunciation. Context-dependent readings are preserved across tone groups; expand **Source words** to see the supporting Chinese, pinyin, and English. These are readings found in the CSV, not a complete dictionary of all possible pronunciations.

## Pronunciation audio

In character review, click a character or an individual source word to hear it. **Listen to all words** plays that character's source words in sequence. New playback replaces the previous audio; changing syllables, returning home, or disabling sound stops the list. An isolated character may use the browser voice's default reading rather than the displayed tone, so source-word playback provides useful context.

Pronunciation plays automatically after checking or revealing an answer using an available Mandarin browser voice. Use **Replay pronunciation** to hear it again. The sound checkbox remembers your preference; turning it off stops playback. Moving to another word or leaving practice also stops audio. If speech or a Mandarin voice is unavailable, the game displays a message and practice still works. Voice quality and pronunciation depend on the device; browser speech may choose a different reading from the CSV for ambiguous words.

## GitHub Pages

Publish this folder from a GitHub Pages branch. Keep `index.html`, `style.css`, `engine.js`, `speech.js`, `app.js`, and the CSV together. All paths are relative, so repository subpaths work. No build step, account, API key, or external dependencies are required.

## Verify grading (macOS)

```sh
swift -module-cache-path /tmp/tone-garden-swift-cache tests/run.swift
```

Uses the system JavaScriptCore engine to check answer formats, neutral tones, Unicode, CSV quoting, shuffling, and grading against the entire dataset.
