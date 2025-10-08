# ERNIan Adventure — Phaser + TypeScript seed

Everything we discussed, fresh baseline:
- Phaser 3 + Vite + TS
- i18n (English/Spanish) for UI + cutscenes
- Paper‑doll full‑body avatar used across all mini‑games
- Story mode with cutscenes (lore.json) and chapter routing
- Level Select (replay anything), Leaderboard (local bests)
- Chapters:
  1) DoodleJump • 2) Flappy • 3) Fighting • 4) Cables Puzzle
  5) Coffee Catcher • 6) Insult Duel • 7) Runner/Race • 8) Stealth

## Run
```bash
npm install
npm run dev
```

## Notes
- Change language on Main Menu (EN/ES). Setting persists to save.
- Avatar Creator is part of the **intro** flow.
- Replace paper‑doll shapes with per‑slot PNGs later if you like.
