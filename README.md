# Maulwurf-Alarm! – Opa verteidigt seinen Rasen

Ein Pixelart-Browserspiel (Vite + Phaser 3, reines JavaScript). Opa mit grauen Locken
läuft über seinen Rasen und haut mit dem Gartenrechen Maulwürfe und ihre Hügel weg.
Es gibt kein Ziel – nur überleben, so lange es geht.

**Spielen:** https://lluiisss.github.io/Game/ (nach dem ersten Deployment)

## Steuerung

| Taste | Aktion |
| --- | --- |
| Pfeiltasten / WASD | laufen (Opa haut automatisch in Laufrichtung zu) |
| P / ESC | Pause (Q im Pausemenü = aufgeben) |
| M | Ton an/aus |
| ← → + Leertaste/Enter, 1/2/3 oder Maus | Upgrade beim Level-Up wählen |

## Spielmechanik

- Maulwürfe tauchen mit einem **Hügel** aus dem Boden auf, chillen eine Weile und tauchen
  wieder ab. Den Hügel lassen sie liegen – auch wenn man sie erwischt.
- Maulwürfe (rote Lebensleiste) **und** Hügel (orange Lebensleiste) müssen weggehauen
  werden. Bei 100 % „Rasen verhügelt“ ist Game Over.
- Maulwurfarten, die nach und nach dazukommen (jede wird beim ersten Auftauchen angekündigt):
  Flitzer, Chiller, Angsthase (taucht bei Treffern ab), Buddler (buddelt Extra-Hügel),
  Panzer-Maulwurf (halber Schaden), Doktor-Maulwurf (heilt Nachbarn), Mama-Maulwurf
  (Babys beim Tod) und Boss-Maulwürfe.
- XP und Level-Ups: Jedes Level gibt automatisch etwas mehr Werte, dazu 3 Garten-Upgrades
  zur Auswahl.
- Neue Nahkampf-Gartengeräte kommen selten und nach und nach: Spaten, Heckenschere,
  Mistgabel, Vorschlaghammer, Sense, Motorsense, Kettensäge.
- Helfer (Gartenzwerg, Rasensprenger, Bienen, Igel, Mähroboter, Regenwolke,
  Gewitter-Wetterhahn) gibt es erst später und seltener – zuerst kämpft Opa selbst.
- Ab **Level 15** kommt **Oma** (groß angekündigt) durch das Gartentor und hilft mit.
- Chiptune-Musik, die bei Gefahr und Bossen schneller und intensiver wird.
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
