# Leche Leaderboard

OBS overlays and a full scoreboard fed by Google Sheet `1cPl3NuUcOhO2Ifw8xGjm_Vx31CGqE73s8kzWVLoPz7E`. Data refreshes every **15 seconds**.

## Routes

| Route | OBS use |
| --- | --- |
| `/scoreboard` | Full 4-team board with event header + logo |
| `/team/1` … `/team/4` | Mini overlay table: total + rank + team name |

### Team overlay sponsor rotation

Use URL timers to cycle the team card with a sponsor panel. Sponsor images are added under `public/sponsors/` and list filenames in `public/sponsors/manifest.json` (shared across all team overlays).

| Param | Example | Meaning |
| --- | --- | --- |
| `teamSec` | `teamSec=30` | Seconds showing the team overlay |
| `sponsorSec` | `sponsorSec=10` | Seconds showing sponsors |

Example URL:

`http://localhost:4200/team/1?preview=1&teamSec=30&sponsorSec=10`

Example `public/sponsors/manifest.json`:

```json
["acme.png", "widgets.svg"]
```

Drop `acme.png` and `widgets.svg` into `public/sponsors/`. Rotation runs when both timers are set **and** the manifest lists at least one file. Reload the page to pick up manifest changes.

Add `?preview=1` when testing in a normal browser (opaque background).

Optional query params:

- `?event=My%20Event` — title in the scoreboard header
- `?logo=https://example.com/logo.png` — header image (defaults to `public/event-logo.svg`)

## Local

```bash
npm start
```

Examples:

- http://localhost:4200/scoreboard?preview=1
- http://localhost:4200/team/1?preview=1

## Sheet layout

| Cells | Used for |
| --- | --- |
| AD1:AL5 | Scoreboard: rank, team name, team total, 3 players + totals |
| AD9:AF12 | Team mini overlays: rank, team name, team total |

Replace `public/event-logo.svg` with your event artwork (or pass `?logo=`).

Sheet config: `src/app/sheet.ts`

## GitHub Pages

1. **Settings → Pages → Source: GitHub Actions**
2. Push to `main`
3. Use the **exact repo name casing** in the URL (GitHub Pages paths are case-sensitive):

- Scoreboard: `https://mehsire.github.io/LecheLeaderboard/scoreboard`
- Team 1: `https://mehsire.github.io/LecheLeaderboard/team/1`

If you rename the repo, update `baseHref` in `angular.json` (`pages` configuration) to match `/YourRepoName/`.
