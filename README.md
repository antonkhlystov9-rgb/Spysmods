# Tidy Hollow

A cozy organizing game for PC. You've inherited a cottage where nothing was ever put away.
Go room by room, drag the clutter into the right crates, and watch the mess disappear.
No timer, no fail state.

## What's in it

- **480 named items** across 10 rooms (pantry, reading nook, craft corner, potting shed, wardrobe, kitchen, toy chest, apothecary, workshop, holiday trunk), every one drawn by code.
- **44 levels** with three ways of sorting: by what it is, by colour, and (in the attic) by which room it belongs to. Plus an **Endless Mode**.
- **4 abilities**, each with 3 upgrade levels: Magnet Mitt, Broom Breeze, Golden Hour, Guiding Lantern.
- **52 achievements**, a **Catalog** to fill in, rare **golden items**, and **dust bunnies** hiding in the pile.
- A **shop** with ability upgrades, room themes and companions.
- **Settings**: rebindable keys, pick-up style and drop assist; display mode, window size, graphics quality, render scale, frame limit, interface size, reduce motion; separate volume sliders for master, music, effects and ambience; colour-blind symbols.
- All art and sound are generated at runtime, so the game has no asset files.

## Get the game

**Easiest:** open this repo's **Actions** tab on GitHub, click the latest "Build desktop app" run, and download
`TidyHollow-Windows` (an installer and a portable `.exe`) or `TidyHollow-Linux` (an AppImage).
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
| Pick up / drop an item | Left mouse button |
| Shoo a dust bunny | Click it |
| Abilities | `1` `2` `3` `4` |
| Shuffle the pile | `R` |
| Pause / back | `Esc` |
| Fullscreen | `F11` |
| Mute | `M` |

Every key can be changed in **Settings → Controls**.

## Project layout

```
main.js, preload.js   Electron window and the bridge used by the video settings
src/index.html        the page
src/css/style.css     interface styling
src/js/core.js        helpers, settings, save data
src/js/data.js        the 480 items, rooms and levels
src/js/draw.js        item art
src/js/audio.js       synthesised music, ambience and sound effects
src/js/progress.js    abilities, shop, achievements, level results
src/js/game.js        the play scene
src/js/ui.js          menus, HUD, settings screens
tools/smoke-test.js   automated play-through of every level (needs Playwright)
tools/make-icon.js    regenerates build/icon.png
```

Progress is saved automatically on your computer. You can erase it in **Settings → Gameplay**.
