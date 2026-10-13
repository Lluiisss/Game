# Maulwurf-Alarm! – Opa verteidigt seinen Rasen

Ein Pixelart-Browserspiel (Vite + Phaser 3, reines JavaScript). Opa mit grauen Locken
läuft über seinen Rasen und haut mit dem Gartenrechen Maulwürfe und ihre Hügel weg.
Es gibt kein Ziel – nur überleben, so lange es geht.

**Spielen:** https://lluiisss.github.io/Game/ (nach dem ersten Deployment)

## Steuerung

| Taste | Aktion |
| --- | --- |
| Pfeiltasten / WASD | laufen |
| Leertaste (gedrückt halten) | zuhauen |
| P / ESC | Pause (Q im Pausemenü = aufgeben) |
| M | Ton an/aus |
| ← → + Leertaste/Enter, 1/2/3 oder Maus | Upgrade beim Level-Up wählen |

## Spielmechanik

- Maulwürfe tauchen mit einem **Hügel** aus dem Boden auf, chillen eine Weile und tauchen
  wieder ab. Den Hügel lassen sie liegen – auch wenn man sie erwischt.
- Maulwürfe (rote Lebensleiste) **und** Hügel (orange Lebensleiste) haben Leben und
  müssen mit dem Gartengerät weggehauen werden. Solange ein Maulwurf auf seinem Hügel
  sitzt, schützt er den Hügel.
- Die Anzeige **„Rasen verhügelt“** zeigt, wie zerwühlt der Rasen ist. Bei 100 % ist
  Game Over.
- Maulwurf-Sorten: normal, **Flitzer** (rotes Stirnband, kurz oben), **Chiller**
  (Sonnenbrille, lange oben) und **Boss-Maulwürfe** (Bergarbeiterhelm, viel Leben,
  großer Hügel, der dreifach zählt).
- Mit der Zeit kommen mehr Maulwürfe mit mehr Leben, und sie bleiben kürzer oben.
- Erledigte Maulwürfe und Hügel geben **XP**. Bei jedem Level-Up gibt es 3 Upgrades zur
  Auswahl: Schaden, Laufgeschwindigkeit, Reichweite, Angriffstempo, Schwungbreite,
  Hügelschaden, Krit-Chance, XP-Bonus, Vogelscheuche, Rasensamen, Gartenzwerg-Wache,
  Rasensprenger, Schubkarre …
- Mit jedem Level steigen Schaden, Angriffstempo, Reichweite und Laufgeschwindigkeit
  automatisch ein wenig.
- Regelmäßig werden **neue Gartengeräte** angeboten, jedes krasser als das letzte:
  Spaten, Heckenschere, Vorschlaghammer, Wasserschlauch, Motorsense,
  Kastanien-Schleuder, Kürbis-Kanone, Unkrautbrenner und zum Schluss der
  **Raketenwerfer**. Schusswaffen zielen automatisch.
- Helfer-Items: Gartenzwerg, Rasensprenger, Bienenstock, Igel-Kumpel, Mähroboter,
  Regenwolke und Gewitter-Wetterhahn.
- Ab **Level 15** kommt **Oma** dazu, läuft selbstständig herum und haut mit ihrer
  Handtasche zu. Sie levelt mit.
- Treibende Chiptune-Musik, die bei Gefahr und Boss-Maulwürfen schneller und
  intensiver wird.
- Die **Bestenliste** (Top 10) wird lokal im Browser gespeichert (localStorage).

## Entwicklung

```bash
npm install
npm run dev      # Entwicklungsserver
npm run build    # Produktions-Build nach dist/
npm run preview  # Build lokal ansehen
```

Alle Grafiken werden im Code als Pixelart erzeugt (`src/gfx/textures.js`), Soundeffekte
werden mit der WebAudio-API synthetisiert (`src/audio/sfx.js`). Das Balancing steckt in
`src/difficulty.js`, Waffen und Upgrades in `src/data/`.

## Deployment

Jeder Push auf `main` baut das Spiel per GitHub Actions
(`.github/workflows/deploy.yml`) und veröffentlicht es auf GitHub Pages. In
`vite.config.js` ist `base: '/Game/'` gesetzt, damit die Pfade unter
`https://<user>.github.io/Game/` stimmen.
