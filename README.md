# PokéBingo – Indigo League episode companion

A phone-first web app you can save to your home screen. Pick an episode, get a random
bingo card of the Pokémon in it, and tap squares as they show up. A second **Moves** board
has attacks those Pokémon use. Progress saves on the phone (localStorage) and works offline
after the first visit.

## Run it on your computer
```
npm install
npm run dev        # open the URL it prints; add --host to open it from your phone on the same Wi-Fi
npm run build      # production files land in dist/
```

## Put it online (free) with GitHub Pages
1. Create an empty repository on github.com (for example `pokebingo`).
2. Push this folder to it:
   ```
   git init && git add . && git commit -m "PokéBingo"
   git branch -M main
   git remote add origin https://github.com/<you>/pokebingo.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. The included workflow (`.github/workflows/pages.yml`) builds and publishes on every push.
   Your app will be at `https://<you>.github.io/pokebingo/`.

No-git option: drag the `dist/` folder onto https://app.netlify.com/drop.

## Save it to your phone
- **iPhone (Safari):** Share → *Add to Home Screen*.
- **Android (Chrome):** ⋮ menu → *Add to Home screen* / *Install app*.

## Editing the episodes
All content is in `src/data/indigo-league.json`:
- `episodes[].pokemon` – name + National Dex number (the number picks the sprite).
- `episodes[].moves` – moves for the Moves board (24+ gives a 5×5 card with a FREE centre).
- `events` – "moments" (Team Rocket blasts off, Nurse Joy…) that fill the Pokémon board when an
  episode has fewer than 16 Pokémon.

To add season 2, copy the JSON shape into a new file and import it in `src/App.jsx`.

When you change the app, bump `CACHE` in `public/sw.js` (e.g. `pokebingo-v2`) so phones pick up the new version.

Sprites load from the PokeAPI sprite repository. Fan-made, non-commercial; Pokémon © Nintendo / Game Freak / The Pokémon Company.
