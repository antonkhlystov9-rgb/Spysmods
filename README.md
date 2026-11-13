# The Night Shelver

A cozy first-person library organizing game for PC. Nobody has shelved a book in Emberwick Library
for forty years. Walk the rooms, pick books out of the piles, and put every one back on its shelf.
No timer, no fail state.

## What's in it

- **1,152 books** in 96 series across 24 sections and 4 rooms. Every book has its own slot on a shelf.
- **Three layers of sorting**: find the section's bookcase, find the series' shelf, and the book slides in by volume number. An optional *Exact shelving* mode makes you point at the right gap yourself.
- **4 knacks** (abilities), each with 3 levels: Call the Strays, Tidy Hands, Golden Hour, Wayfinder. They unlock as you finish shelf rows.
- **Gear** to buy: carry more books, walk faster, reach further. Plus four lighting **moods**.
- **42 achievements**, a **Card Catalogue** that tracks every single book, rare **gilded books**, and 20 hidden **bookmarks**.
- Rooms unlock as you go: shelve 60% of one to open the door to the next.
- **Settings**: rebindable keys, mouse sensitivity, invert look, hold-to-repeat; display mode, window size, graphics quality, render scale, frame limit, field of view, interface size, head bob, reduce motion; separate volume sliders for master, music, effects and ambience.
- All art and sound are generated at runtime, so the game has no asset files.

## Get the game

**Easiest:** open this repo's **Actions** tab on GitHub, click the latest "Build desktop app" run, and download
`NightShelver-Windows` (an installer and a portable `.exe`) or `NightShelver-Linux` (an AppImage).
Windows may show a SmartScreen warning because the build is not code-signed — choose "More info → Run anyway".

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
src/js/audio.js       synthesised music, ambience and sound effects
src/js/progress.js    knacks, gear, moods, achievements
src/js/game.js        the 3D library: world, walking, picking up, shelving
src/js/ui.js          menus, HUD, settings screens
src/vendor/           three.js r128 (MIT), the 3D renderer
tools/smoke-test.js   automated play-through that shelves every book (needs Playwright)
tools/make-icon.js    regenerates build/icon.png
```

Progress is saved automatically on your computer. You can reshuffle the library or erase everything in **Settings → Gameplay**.
