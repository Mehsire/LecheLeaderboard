# Leche Leaderboard

OBS Browser Source overlay that reads **Spending Tracker** cells **I4:J8** from the Google Sheet, then shows either the full ranking or one person’s value.

## Local

```bash
npm start
```

- Full board: [http://localhost:4200/?preview=1](http://localhost:4200/?preview=1)
- One person: `http://localhost:4200/?name=Alex&preview=1` — `name` must match a cell in **I4:I8**

The sheet must stay shared so anyone with the link can view it. Names live in **I4:I8** and scores in **J4:J8** — change them in the spreadsheet; the overlay picks up new names on the next refresh. `?name=` must match the sheet spelling (case-insensitive).

## URL params (OBS)

| Param | Example | What it does |
| --- | --- | --- |
| `name` | `?name=Alex` | Only that person’s score (must match a name currently in I4:I8) |
| *(none)* | `/` | Full leaderboard from those five rows |
| `refresh` | `?refresh=15` | Re-fetch interval in seconds (default `30`, `0` disables) |
| `title` | `?title=Spend` | Override the overlay title |
| `theme` | `theme=dark` or `theme=light` | Panel colors |
| `accent` | `?accent=%23ffb4d6` | Accent color |
| `help` | `?help=1` | Param cheat sheet |
| `preview` | `?preview=1` | Opaque background for browser testing |

OBS examples after GitHub Pages is live:

- `https://mehsire.github.io/lecheleaderboard/?name=Alex`
- `https://mehsire.github.io/lecheleaderboard/`

Width ~280 for a single name, ~360 for the full list. Leave **Shutdown source when not visible** off if you rely on `refresh`.

The page background is transparent so the overlay sits on the stream.

Sheet range and ID live in `src/app/sheet.ts`.

## GitHub Pages

1. **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Push to `main` (or run **Deploy GitHub Pages**).
3. Overlay URL: `https://<user>.github.io/lecheleaderboard/?name=Alex`

If you rename the repo, change `baseHref` in `angular.json` (`pages` configuration) to `/your-repo-name/`.
