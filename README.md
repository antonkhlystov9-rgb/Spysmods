# The Night Shelver

A cozy first-person library organizing game for PC. Nobody has shelved a book in Emberwick Library
for forty years. Walk the rooms, pick books out of the piles, and put every one back on its shelf.
No timer, no fail state.

## What's in it

- **1,152 books** in 96 series across 24 sections and 4 rooms. Every book has its own slot on a shelf.
- **Three layers of sorting**: find the section's bookcase, find the series' shelf, and the book slides in by volume number. An optional *Exact shelving* mode makes you point at the right gap yourself.
- **Every book can be opened and read.** Each of the 96 series is one story, almanac or collection told across its 12 volumes, one page per book: about 167,000 words in all. Point at a book and press `R`.
- **4 knacks** (abilities), each with 3 levels: Call the Strays, Tidy Hands, Golden Hour, Wayfinder. They unlock as you finish shelf rows.
- **Gear** to buy: carry more books, walk faster, reach further. Plus four lighting **moods**.
- **47 achievements**, a **Card Catalogue** that tracks every single book, rare **gilded books**, and 20 hidden **bookmarks**.
- **Four rooms, each built differently**: a panelled reading room with a lit hearth, a tall skylit gallery with one long wall of bookcases, a stone hall with free-standing stacks, and a vault with a painted night ceiling, turning gears and a clock that tells the real time.
- Rooms unlock as you go: shelve 60% of one to open the door to the next.
- Wood grain with relief on shelves and furniture, plaster and stone texture on walls, printed spines and covers on every book.
- **Settings**: rebindable keys, mouse sensitivity, invert look, hold-to-repeat; display mode, window size, graphics quality, render scale, frame limit, field of view, interface size, head bob, reduce motion; separate volume sliders for master, music, effects and ambience.
- All art and sound are generated at runtime, so the game has no asset files.

## Get the game

**Easiest:** open this repo's **Actions** tab on GitHub, click the latest "Build desktop app" run, and download
`NightShelver-Windows` (an installer and a portable `.exe`) or `NightShelver-Linux` (an AppImage).
The Windows download contains two things: a **zip** (unzip it anywhere and run `The Night Shelver.exe`, nothing is installed) and a **Setup** installer.

### If Windows or your antivirus blocks it

The game is not malware, but it is **not code-signed**, and Windows, browsers, chat apps and antivirus tools treat every unsigned program from an unknown publisher as suspect. Installers and single-file self-extracting programs are flagged most often, which is why the zip is offered first.

- **Easiest way to share with a friend: send them the game as a web page instead of a program.** It runs in any desktop browser with no download and nothing for antivirus to object to (see "Play in a browser" below).
- SmartScreen ("Windows protected your PC"): choose **More info → Run anyway**.
- Antivirus quarantine: restore the file and add the game's folder as an exception, or report it to the vendor as a false positive.
- The real fix is a code-signing certificate, which costs money and is issued to a named person or company. Once you have one, `electron-builder` can sign the build automatically.

### Play in a browser

Everything under `src/` is a static website, and this repo publishes it automatically with GitHub Pages (`.github/workflows/pages.yml`).

One-time setup: in the repository on GitHub, open **Settings → Pages** and set **Source** to **GitHub Actions**. After the next push (or a manual run of the "Publish web version" workflow) the game is live at `https://<your-username>.github.io/<repo-name>/`. Progress is saved in each player's own browser.

**Install it from the browser (no download, nothing for antivirus to flag):** in Chrome or Edge, open the link and click **Install as an app** on the title screen, or the install icon at the right end of the address bar. The game then has its own window, a desktop and Start-menu icon, and works offline. The web version stores its files with a service worker (`src/sw.js`) and describes itself with `src/manifest.webmanifest`.

**From source** (needs [Node.js](https://nodejs.org) 20+):

```
npm install
npm start          # run the game
npm run dist       # build an installer for the OS you are on (output in dist/)
```

## Controls

| Action | Default |
| --- | --- |
| Look | Mouse |
| Walk | `W` `A` `S` `D`, hold `Shift` to run |
| Pick up a book / shelve a book | Left mouse button or `E` |
| Take every book of that section from a pile | Right mouse button or `F` |
| Read the book you are pointing at or carrying | `R` |
| Knacks | `1` `2` `3` `4` |
| Pause | `P` (and `Esc`, which also frees the mouse) |
| Fullscreen | `F11` |
| Mute | `M` |

Every key except `Esc` can be changed in **Settings → Controls**.

## Project layout

```
main.js, preload.js   Electron window and the bridge used by the video settings
src/index.html        the page
src/css/style.css     interface styling
src/js/core.js        helpers, settings, save data
src/js/data.js        rooms, sections, series and the 1,152 books
src/js/stories.js     the text of every book (generated; do not edit)
content/stories/      the book text, one JSON file per section (edit these)
content/BRIEF.md      the writing brief the book text follows
src/js/audio.js       synthesised music, ambience and sound effects
src/js/progress.js    knacks, gear, moods, achievements
src/js/game.js        the 3D library: world, walking, picking up, shelving
src/js/ui.js          menus, HUD, settings screens
src/vendor/           three.js r128 (MIT), the 3D renderer
tools/smoke-test.js   automated play-through that shelves every book (needs Playwright)
tools/check-stories.js validates the book text (counts, lengths, format)
tools/build-stories.js compiles content/stories into src/js/stories.js
tools/make-icon.js    regenerates the app icons
```

Progress is saved automatically on your computer. You can reshuffle the library or erase everything in **Settings → Gameplay**.
