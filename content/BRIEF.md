# Writing brief: the books of Emberwick Library

You are writing the readable contents of books for **The Night Shelver**, a cozy first-person
library-organizing game. The player can open any book and read one page.

The library has 24 sections. Each section has 4 series. Each series has 12 volumes (I to XII).
You are assigned some sections. For each one, write one JSON file.

## What each series must be

- The 12 volumes of a series form **one coherent work, in order**: a beginning in Volume I,
  development through the middle, and a real ending in Volume XII.
- The content must **match the series title and its section**. Someone who reads the title and
  then the page should think "yes, that is what this book would be".
- Each volume is **one page that makes sense on its own**. A player may open Volume VII first.
  Re-ground the reader briefly (who, where) instead of writing "as we saw last time".
- Keep facts consistent inside a series: names, places, the clues of a mystery, the order of a
  journey. Decide the whole arc before you write Volume I.

Suggested shape per section (use judgment; the series title wins):

| Section | Shape |
| --- | --- |
| Fables | animal fables with a gentle point, same cast through the series |
| Cookery | a cook's notebook: a small story thread plus a real, plausible, safe recipe sketch per volume |
| Gardens | a gardener's year or project; twelve volumes map well to twelve months |
| Sea Voyages | logs, letters and charts of one voyage or one keeper's year |
| Mysteries | a cozy whodunnit: crime off the page, fair clues, culprit revealed in XII |
| Poetry | each volume is one short original poem (12 to 20 lines), optionally with a one-line note |
| Botany, Beasts, Weather, Stars, Minerals, Insects | a naturalist's field book with a narrator and a journey or a year |
| History | chronicles of the fictional town and region |
| Maps | a surveyor's or traveller's account |
| Mathematics | friendly puzzles and ideas with a teacher-and-pupil thread; **the maths must be correct** |
| Medicine | a country doctor's casebook: quaint and kind, no doses, nothing a reader could act on harmfully |
| Law | small-town court cases, gently comic |
| Philosophy | quiet dialogues or essays with a recurring pair of speakers |
| Clockwork | a clockmaker's workshop notes with one thread running through |
| Music | a musician's year; describe tunes, never quote real lyrics |
| Theatre | one small company's season, or the plays themselves |
| Alchemy | a hopeful, mostly unsuccessful alchemist's notes; whimsical, never a usable procedure |
| Folklore | collected tales with the collector as a thread |
| Dreams | a dream journal or almanac that still resolves by XII |

## The world

Everything is fictional. The library is in the small town of **Emberwick**. Nearby: the Grey
Coast, the Northern Fells, the Lowlands, the marsh, the river Ember. You may use these lightly
and invent more. Do not use real people, real brands, real place names, or characters, plots,
lyrics or quotations from existing works. Everything must be original.

## Tone

Warm, gentle, a little wry. Cozy. Suitable for all ages: no gore, no cruelty, no romance beyond
a held hand. Concrete details over vague ones. Plain, clear English. Vary sentence length.

Avoid: "little did they know", "a testament to", "tapestry", "whispered secrets", rhetorical
questions as endings, morals stated twice, and every volume ending on the same beat.

## Format (strict)

One file per section at `/home/user/Spysmods/content/stories/NN-slug.json`, where NN and slug
are given in your assignment. Exactly this shape:

```json
{
  "section": "Fables",
  "series": [
    {
      "name": "The Fox & the Lantern",
      "volumes": [
        { "title": "A Light in the Hedge", "text": "First paragraph.\n\nSecond paragraph." }
      ]
    }
  ]
}
```

- `series`: exactly 4, in the order given, with `name` copied exactly from your assignment.
- `volumes`: exactly 12 per series, in order I to XII.
- `title`: a chapter title of 2 to 6 words. No "Volume", no numbering.
- `text`: **110 to 150 words** (poems: 60 to 130 words). Two or three paragraphs separated by a
  blank line (`\n\n` in JSON). For poems, put each line on its own line (`\n`) and separate
  stanzas with a blank line.
- Plain text only: no markdown, no asterisks, no headings, no emoji. Curly or straight quotes
  are both fine. Must be valid JSON (escape quotes and newlines properly).

## Before you finish

Run this check on each file you wrote and fix anything it reports:

```
node /home/user/Spysmods/tools/check-stories.js /home/user/Spysmods/content/stories/NN-slug.json
```

Then reread three volumes of each series (I, one from the middle, XII) and confirm they agree
with each other and with the title.

Only create your assigned JSON files. Do not edit any other file, do not run git, do not
commit. Reply with a three-line report: files written, check result, and anything you were
unsure about.
