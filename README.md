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
| M | Ton an/aus (Lautstärke für Musik und Sounds im Hauptmenü und Pausemenü) |
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
- Alle 20 Level erscheint in der Mitte der **Gigamaulwurf**: riesig, viel Leben, und bei
  jedem Stampfer wachsen Hügel um ihn herum.
- XP und Level-Ups: Jedes Level gibt automatisch etwas mehr Werte, dazu 3 Garten-Upgrades
  zur Auswahl.
- Regelmäßig neue (teils alberne) Nahkampf-Gartengeräte mit Spezialeffekten: Spaten,
  Heckenschere, Gummihuhn (betäubt, QUIEK!), Laubbesen, Riesen-Zucchini, Mistgabel,
  Gießkanne (PLATSCH!), Gartenkralle, Schlauch-Peitsche (KNALL!), Sense, Vorschlaghammer,
  Spitzhacke, Zwergen-Keule (BONK!), Astschere, Gartenaxt und Kettensäge (BRUMMM!).
  Am Ende der Kette kommen die stärksten Rundumschlag-Waffen: Motorsense, Wäschespinne,
  Kreisregner und das Rasenmäher-Karussell.
- Helfer (Gartenzwerg, Rasensprenger, Bienenstöcke, Igel, Mähroboter, Regenwolke,
  Gewitter-Wetterhahn) gibt es ab Level 3, spätestens jedes dritte Level ist einer im Angebot.
  Jedes Bienen-Upgrade stellt einen neuen Bienenstock in den Garten, jedes weitere
  Wolken-Upgrade macht die Regenwolke größer.
- Bis Level 15 sitzt **Oma** am Terrassentisch. Dann steht sie auf (groß angekündigt) und haut mit
  ihrer Bratpfanne selbst mit.
- Chiptune-Musik, die bei Gefahr und Bossen schneller und intensiver wird.
- **Bestenliste:** Online-Top-100 über Firebase Firestore (man trägt sich mit Namen ein)
  plus eine lokale Top-10 auf dem eigenen Gerät. Mit T wird umgeschaltet.

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

## Online-Bestenliste (Firebase)

Die Konfiguration steht in `src/systems/firebase.js`. Einmalig in der Firebase-Konsole:

1. **Firestore Database → Datenbank erstellen** (Produktionsmodus, z. B. `europe-west3`).
2. Unter **Regeln** den Inhalt von `firestore.rules` einfügen und veröffentlichen.

Angezeigt werden die besten 100 Einträge; online eingetragen wird nur, wer es in die
Top 100 schafft. Ohne Verbindung speichert das Spiel nur lokal.

## Deployment

Jeder Push auf `main` baut das Spiel per GitHub Actions
(`.github/workflows/deploy.yml`) und veröffentlicht es auf GitHub Pages. In
`vite.config.js` ist `base: '/Game/'` gesetzt, damit die Pfade unter
`https://<user>.github.io/Game/` stimmen.
