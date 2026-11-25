# best-cooking-game-20261125-0137-chapo124574

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Chapo1245/best-cooking-game-20261125-0137-chapo124574/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Chapo1245/best-cooking-game-20261125-0137-chapo124574/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

# Dapur Senja — a fast Indonesian warung cooking game

A complete cooking game that plays offline in a desktop browser from its own files. You are the chef of Dapur Senja, a small sunset warung: take orders from the board, grab ingredients from the bins, chop them on the board, cook them in the wok, assemble the dish on the plating counter, and serve it at the window before the customer's patience runs out.

## How it plays

- **Move** WASD / arrows, or click a station to walk there. **E / Space** uses the nearest station. **M** mutes, **R** restarts after the shift ends.
- **Cook in order:** pick a raw ingredient from a bin → chop it on the talenan (if it needs chopping) → cook it in the wok → place it on the plating counter. A plate with the right cooked combination becomes a dish.
- **Recipes:** Nasi Ayam Lada (rice + chicken), Ayam Geprek Senja (chicken + chili), Tumis Sayur Telur (veg + egg), Nasi Goreng Senja (rice + egg + chili). Serve a plate that matches an order ticket to earn score and coins.
- **Pressure:** each order has a patience timer — serve fast for a bonus, let it expire and you lose score and your combo. After 90 seconds the RUSH HOUR hits and orders arrive faster. A 180-second shift, then your stars are tallied.
- **Feel:** chopping and cooking show live progress bars, serving rings the bell with a chime, combos multiply your score, and synthesized WebAudio sounds (no audio files) season every action.

## Files

- `game/index.html` — opens in desktop Chrome and plays, no network requests.
- `game/src/config.js` — recipes, ingredients, stations, tuning.
- `game/src/random.js` — seeded PRNG for reproducible scenes.
- `game/src/audio.js` — synthesized kitchen sounds (WebAudio, no files).
- `game/src/world.js` — kitchen state and rules: orders, plate, serving, clock.
- `game/src/input.js` — keyboard + click-to-move control.
- `game/src/render.js` — canvas drawing: kitchen, orders, chef, HUD.
- `game/src/shots.js` — staged deterministic screenshot scenes (`?shot=cover|rush|serve|end`).
- `game/src/main.js` — game loop, boot, and a headless self-test (`?selftest=1`).
- `main.ts` — the entry program: copies `game/` and `screenshots/` to the output directory and writes `dossier.json` (Node 22, standard library only).
- `screenshots/` — 4 real renders of the game: the full kitchen, rush hour, a served dish, and the end-of-shift results.

## Run it

```sh
cd game && python3 -m http.server 8080
# open http://localhost:8080 in desktop Chrome
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=wtacm6ft&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
