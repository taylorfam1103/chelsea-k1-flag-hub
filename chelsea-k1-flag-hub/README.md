# Chelsea K/1 Flag Football Hub

A parent-friendly, auto-updating league hub for the 2026 Chelsea K/1 Flag Football division.

## What it does

- Pulls the public Chelsea RecDesk league page server-side
- Parses official standings
- Parses completed game scores
- Parses upcoming games
- Refreshes the browser every 30 seconds
- Highlights the Taylor Dolphins
- Includes Home, Standings, and Schedule views
- Mobile-first and responsive for phones, tablets, and desktop
- Links back to the official RecDesk page

## Data source

https://chelsea.recdesk.com/Community/League/Detail?leagueId=47523&divisionId=57145&mode=standings

The RecDesk page remains the source of truth. This site is simply a friendlier display.

## Deploy to Vercel

1. Put this folder in a GitHub repository.
2. In Vercel, choose **Add New → Project**.
3. Import the repository.
4. Vercel should detect Next.js automatically.
5. Click **Deploy**.
6. Share the Vercel URL with parents.

No environment variables or API keys are required.

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Important

The parser intentionally avoids relying on RecDesk CSS class names. It reads the table and schedule text structure instead, which is more resilient to minor RecDesk design changes.

If RecDesk makes a large markup change in the future, `/api/league` will return a clear error instead of silently inventing data.
