const RECDESK_URL =
  "https://chelsea.recdesk.com/Community/League/Detail?leagueId=47523&divisionId=57145&mode=standings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAYS = "(?:MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)";
const DATE_RE = new RegExp(`^${DAYS}\\s+\\d{1,2}\\s+[A-Za-z]+\\s+\\d{4}$`, "i");
const TIME_RE = /^(?:1[0-2]|[1-9]):[0-5]\d\s*(?:AM|PM)$/i;
const SCORE_RE = /^(?:(\d{1,3})\s*vs\s*(\d{1,3})|-?vs-?)$/i;

function decodeEntities(input) {
  const named = {
    "&nbsp;": " ",
    "&amp;": "&",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
    "&lt;": "<",
    "&gt;": ">",
  };

  return input
    .replace(/&(nbsp|amp|quot|#39|apos|lt|gt);/gi, (m) => named[m.toLowerCase()] ?? m)
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function htmlToTokens(html) {
  const cleaned = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(?:td|th|tr|p|div|li|h[1-6]|section|article|header|footer|a|span)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  return decodeEntities(cleaned)
    .split(/\n+/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function numberValue(value) {
  const cleaned = String(value).replace(/[,%]/g, "").trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function parseStandings(tokens) {
  const headerIndex = tokens.findIndex((t) => /^League Standings$/i.test(t));
  if (headerIndex < 0) return [];

  const teamsListIndex = tokens.findIndex(
    (t, i) => i > headerIndex && /^Teams List$/i.test(t)
  );
  const end = teamsListIndex > -1 ? teamsListIndex : tokens.length;
  const section = tokens.slice(headerIndex, end);

  const percentageIndex = section.findIndex((t) => /^Percentage$/i.test(t));
  if (percentageIndex < 0) return [];

  const data = section.slice(percentageIndex + 1);
  const rows = [];

  for (let i = 0; i + 6 < data.length; ) {
    const team = data[i];
    const w = data[i + 1];
    const l = data[i + 2];
    const ties = data[i + 3];
    const pf = data[i + 4];
    const pa = data[i + 5];
    const pct = data[i + 6];

    const looksNumeric =
      /^\d+$/.test(w) &&
      /^\d+$/.test(l) &&
      /^\d+$/.test(ties) &&
      /^\d+$/.test(pf) &&
      /^\d+$/.test(pa) &&
      /%/.test(pct);

    if (!looksNumeric) {
      i += 1;
      continue;
    }

    rows.push({
      team,
      wins: numberValue(w),
      losses: numberValue(l),
      ties: numberValue(ties),
      pointsFor: numberValue(pf),
      pointsAgainst: numberValue(pa),
      percentage: numberValue(pct),
      pointDiff: numberValue(pf) - numberValue(pa),
    });

    i += 7;
  }

  return rows;
}

function normalizeTeamToken(token, teams) {
  const exact = teams.find((t) => t === token);
  if (exact) return exact;

  return teams.find((t) => {
    const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`^${escaped}(?:\\s*\\([^)]*\\))?$`, "i").test(token);
  });
}

function parseSchedule(tokens, standings) {
  const teams = standings.map((s) => s.team);
  if (!teams.length) return [];

  const teamsListIndex = tokens.findIndex((t) => /^Teams List$/i.test(t));
  if (teamsListIndex < 0) return [];

  const scheduleTokens = tokens.slice(teamsListIndex + 1);
  const games = [];
  let currentDate = null;

  for (let i = 0; i < scheduleTokens.length; i++) {
    const token = scheduleTokens[i];

    if (DATE_RE.test(token)) {
      currentDate = token;
      continue;
    }

    if (!currentDate || !TIME_RE.test(token)) continue;

    const time = token;
    const block = [];
    let j = i + 1;

    while (j < scheduleTokens.length) {
      const next = scheduleTokens[j];
      if (DATE_RE.test(next) || TIME_RE.test(next)) break;
      block.push(next);
      j += 1;
    }

    const teamPositions = [];
    for (let k = 0; k < block.length; k++) {
      const normalized = normalizeTeamToken(block[k], teams);
      if (normalized) teamPositions.push({ index: k, team: normalized, raw: block[k] });
    }

    if (teamPositions.length >= 2) {
      const first = teamPositions[0];
      const second = teamPositions[1];
      const between = block.slice(first.index + 1, second.index);
      const scoreToken = between.find((x) => SCORE_RE.test(x)) || "-vs-";
      const scoreMatch = scoreToken.match(SCORE_RE);
      const facilityParts = block.slice(0, first.index).filter(
        (x) =>
          !/^Select$/i.test(x) &&
          !/^\*+$/.test(x) &&
          !/^Facility Hours$/i.test(x)
      );

      let homeScore = null;
      let awayScore = null;
      let isFinal = false;

      if (scoreMatch && scoreMatch[1] != null && scoreMatch[2] != null) {
        homeScore = Number(scoreMatch[1]);
        awayScore = Number(scoreMatch[2]);
        isFinal = true;
      }

      games.push({
        date: currentDate,
        time,
        facility: facilityParts.join(" • ") || "Hwy 39 Chelsea Recreational Park",
        homeTeam: first.team,
        awayTeam: second.team,
        homeScore,
        awayScore,
        isFinal,
      });
    }

    i = j - 1;
  }

  return games;
}

function getLeagueMeta(tokens) {
  const findAfter = (label) => {
    const idx = tokens.findIndex((t) => t === label);
    return idx > -1 ? tokens[idx + 1] ?? null : null;
  };

  return {
    name: tokens.find((t) => /K\/1 Flag Football/i.test(t))?.replace(/\s*-\s*Default$/i, "") ||
      "2026 K/1 Flag Football",
    season: findAfter("Season"),
    category: findAfter("Category"),
    startDate: findAfter("Start Date"),
    endDate: findAfter("End Date"),
  };
}

export async function GET() {
  try {
    const response = await fetch(RECDESK_URL, {
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ChelseaK1FlagHub/1.0; +https://vercel.app)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      throw new Error(`RecDesk returned ${response.status}`);
    }

    const html = await response.text();
    const tokens = htmlToTokens(html);
    const standings = parseStandings(tokens);

    if (!standings.length) {
      throw new Error("Could not find the RecDesk standings table.");
    }

    const games = parseSchedule(tokens, standings);
    const meta = getLeagueMeta(tokens);

    return Response.json(
      {
        ok: true,
        source: RECDESK_URL,
        fetchedAt: new Date().toISOString(),
        meta,
        standings,
        games,
      },
      {
        headers: {
          "Cache-Control": "s-maxage=30, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
        source: RECDESK_URL,
      },
      { status: 502 }
    );
  }
}
