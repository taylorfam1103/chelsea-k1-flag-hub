"use client";

import { useEffect, useMemo, useState } from "react";

const TEAM_META = {
  "Barr Cowboys": { short: "Cowboys", abbr: "DAL", color: "#041E42", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/dal.png" },
  "Birdsong Ravens": { short: "Ravens", abbr: "BAL", color: "#241773", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/bal.png" },
  "Davis Chiefs": { short: "Chiefs", abbr: "KC", color: "#E31837", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png" },
  "Gibson Patriots": { short: "Patriots", abbr: "NE", color: "#002244", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ne.png" },
  "Gray Eagles": { short: "Eagles", abbr: "PHI", color: "#004C54", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/phi.png" },
  "Hurston Titans": { short: "Titans", abbr: "TEN", color: "#4B92DB", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ten.png" },
  "Sloan Steelers": { short: "Steelers", abbr: "PIT", color: "#FFB612", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/pit.png" },
  "Taylor Dolphins": { short: "Dolphins", abbr: "MIA", color: "#008E97", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/mia.png" },
};

const DOLPHINS = "Taylor Dolphins";
const PLAYOFF_SPOTS = 4;
const RECDESK_LINK = "https://chelsea.recdesk.com/Community/League/Detail?leagueId=47523&divisionId=57145&mode=standings";
const LAST_FINAL_KEY = "chelsea-k1-last-seen-dolphins-final";
const RANK_SNAPSHOT_KEY = "chelsea-k1-rank-snapshot";
const CONFETTI = [
  ["6%", "0s", "3.8s", "18deg"], ["12%", ".4s", "4.4s", "-8deg"], ["18%", ".8s", "4.2s", "22deg"], ["24%", "1.1s", "4.8s", "-14deg"],
  ["31%", ".1s", "4.6s", "10deg"], ["38%", ".6s", "4.9s", "-26deg"], ["44%", ".2s", "3.9s", "15deg"], ["50%", "1s", "4.3s", "-12deg"],
  ["57%", ".3s", "4.6s", "26deg"], ["63%", ".9s", "4.1s", "-4deg"], ["70%", ".2s", "4.7s", "30deg"], ["76%", "1.2s", "4.4s", "-18deg"],
  ["82%", ".7s", "4s", "9deg"], ["88%", ".5s", "4.8s", "-28deg"], ["94%", ".15s", "3.7s", "13deg"],
].map(([left, delay, dur, rot]) => ({ left, delay, dur, rot }));

function teamMeta(name) {
  return TEAM_META[name] || { short: name, abbr: name.slice(0, 3).toUpperCase(), color: "#5F7182", logo: "" };
}

function parseChelseaGameDate(game) {
  const parts = game.date.match(/^(?:MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)\s+(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/i);
  const timeParts = game.time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!parts || !timeParts) return null;
  const months = { january: 0, february: 1, march: 2, april: 3, may: 4, june: 5, july: 6, august: 7, september: 8, october: 9, november: 10, december: 11 };
  let hour = Number(timeParts[1]);
  const minute = Number(timeParts[2]);
  const ampm = timeParts[3].toUpperCase();
  if (ampm === "PM" && hour !== 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;
  return new Date(Number(parts[3]), months[parts[2].toLowerCase()], Number(parts[1]), hour, minute);
}

function formatGameDate(game, includeYear = false) {
  const date = parseChelseaGameDate(game);
  if (!date) return game.date;
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", ...(includeYear ? { year: "numeric" } : {}) }).format(date);
}

function sameDay(a, b) {
  return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function gameSignature(game) {
  return [game.date, game.time, game.homeTeam, game.awayTeam, game.homeScore, game.awayScore].join("|");
}

function isDolphinsGame(game) {
  return game.homeTeam === DOLPHINS || game.awayTeam === DOLPHINS;
}

function getDolphinsOutcome(game) {
  if (!game || !game.isFinal || !isDolphinsGame(game)) return { result: "none", dolphinsScore: null, opponentScore: null, opponent: null };
  const dolphinsHome = game.homeTeam === DOLPHINS;
  const dolphinsScore = dolphinsHome ? game.homeScore : game.awayScore;
  const opponentScore = dolphinsHome ? game.awayScore : game.homeScore;
  const opponent = dolphinsHome ? game.awayTeam : game.homeTeam;
  let result = "tie";
  if (dolphinsScore > opponentScore) result = "win";
  if (dolphinsScore < opponentScore) result = "loss";
  return { result, dolphinsScore, opponentScore, opponent };
}

function getCountdown(game, now) {
  const gameDate = parseChelseaGameDate(game);
  if (!gameDate) return game.time;
  const diff = gameDate.getTime() - now.getTime();
  if (diff <= 0) return "KICKOFF TIME";
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hours >= 24) return `${Math.floor(hours / 24)}D ${hours % 24}H`;
  if (hours > 0) return `${hours}H ${rem}M`;
  return `${Math.max(1, rem)}M`;
}

function TeamMark({ team, size = "md" }) {
  const meta = teamMeta(team);
  return <div className={`team-mark team-mark-${size}`} style={{ "--team": meta.color }}>
    {meta.logo ? <img src={meta.logo} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextElementSibling.style.display = "grid"; }} /> : null}
    <span className="team-fallback" style={{ display: meta.logo ? "none" : "grid" }}>{meta.abbr}</span>
  </div>;
}

function RefreshDot({ loading, error }) {
  return <span className={`refresh-dot ${loading ? "is-loading" : ""} ${error ? "has-error" : ""}`} aria-hidden="true" />;
}

function LeagueTicker({ games }) {
  const latestFinals = [...games].filter((g) => g.isFinal).slice(-4).reverse();
  const nextGames = games.filter((g) => !g.isFinal).slice(0, 5);
  const items = [...latestFinals, ...nextGames];
  if (!items.length) return null;
  return <div className="ticker-shell"><div className="ticker-bug">LEAGUE DESK</div><div className="ticker-track">{items.map((game, idx) => {
    const home = teamMeta(game.homeTeam); const away = teamMeta(game.awayTeam);
    return <div className={`ticker-item ${isDolphinsGame(game) ? "ticker-dolphins" : ""}`} key={`${game.date}-${game.time}-${idx}`}><span className="ticker-status">{game.isFinal ? "FINAL" : formatGameDate(game)}</span><strong>{home.short}</strong><b>{game.isFinal ? game.homeScore : "vs"}</b><strong>{away.short}</strong><b>{game.isFinal ? game.awayScore : game.time}</b></div>;
  })}</div></div>;
}

function WinCelebrationOverlay({ game, onClose }) {
  const outcome = getDolphinsOutcome(game);
  if (!game || outcome.result !== "win") return null;
  const opponentMeta = teamMeta(outcome.opponent);
  return <div className="celebration-overlay" role="dialog" aria-modal="true" aria-label="Dolphins win celebration">
    <div className="celebration-backdrop" onClick={onClose} /><div className="celebration-flash flash-1" /><div className="celebration-flash flash-2" /><div className="celebration-flash flash-3" />
    {CONFETTI.map((piece, idx) => <span key={idx} className={`confetti-piece ${idx % 2 === 0 ? "aqua" : "orange"}`} style={{ left: piece.left, animationDelay: piece.delay, animationDuration: piece.dur, "--piece-rotate": piece.rot }} />)}
    <div className="celebration-card"><button className="celebration-close" onClick={onClose} aria-label="Close celebration">×</button><div className="celebration-topline"><div className="celebration-pill">FINAL</div><div className="celebration-network-bug">CHELSEA FLAG HQ</div></div><div className="celebration-logo-ring"><TeamMark team={DOLPHINS} size="xl" /></div><div className="celebration-copy"><div className="eyebrow">MAKE WAVES • BIG WIN</div><h2>DOLPHINS WIN!!!</h2><p>{formatGameDate(game)} • {game.time}</p></div><div className="celebration-scoreboard"><div className="celebration-side"><TeamMark team={DOLPHINS} size="md" /><strong>DOLPHINS</strong></div><div className="celebration-score"><span>{outcome.dolphinsScore}</span><small>-</small><span>{outcome.opponentScore}</span></div><div className="celebration-side"><TeamMark team={outcome.opponent} size="md" /><strong>{opponentMeta.short.toUpperCase()}</strong></div></div><p className="celebration-subline">Taylor Dolphins defeated {outcome.opponent}. Share it with the group chat. 🐬🏈</p></div>
  </div>;
}

function MatchupHero({ game, now, onReplayWin, canReplayWin, onShare }) {
  if (!game) return <section className="next-game hero-panel"><div className="eyebrow">DOLPHINS</div><h2>Schedule complete</h2><p>No upcoming Dolphins games are currently listed on RecDesk.</p></section>;
  const opponent = game.homeTeam === DOLPHINS ? game.awayTeam : game.homeTeam;
  const dolphinsHome = game.homeTeam === DOLPHINS;
  const opponentMeta = teamMeta(opponent);
  const gameDay = sameDay(parseChelseaGameDate(game), now);
  const outcome = getDolphinsOutcome(game);

  if (game.isFinal) {
    const isWin = outcome.result === "win";
    return <section className={`result-hero hero-panel ${isWin ? "win" : outcome.result}`}><div className="hero-stripe" /><div className="result-copy"><div className="hero-kicker-row"><div className="hero-bug">FINAL</div><div className="eyebrow">DOLPHINS RESULT</div></div><h2>{isWin ? "DOLPHINS WIN" : outcome.result === "tie" ? "DOLPHINS TIE" : "FINAL SCORE"}</h2><div className="result-score-line"><span>{outcome.dolphinsScore}</span><small>-</small><span>{outcome.opponentScore}</span></div><p>vs {opponentMeta.short} • {formatGameDate(game)}</p><div className="hero-actions"><button className="primary-link-btn" onClick={() => onShare(game)}>Share result</button>{isWin && <button className="secondary-ghost-btn" onClick={onReplayWin}>Replay celebration 🎉</button>}</div></div><div className="matchup-lockup result-lockup"><div className="hero-team"><TeamMark team={DOLPHINS} size="lg" /><b>DOLPHINS</b></div><span className="versus">FINAL</span><div className="hero-team"><TeamMark team={opponent} size="lg" /><b>{opponentMeta.short.toUpperCase()}</b></div></div></section>;
  }

  return <section className={`next-game hero-panel ${gameDay ? "game-day" : ""}`}><div className="hero-panel-glow" /><div className="hero-stripe" /><div className="next-copy"><div className="hero-kicker-row"><div className="hero-bug">{gameDay ? "GAME DAY" : "LEAGUE HQ"}</div><div className="eyebrow">🐬 DOLPHINS NEXT GAME</div></div>{gameDay && <div className="countdown-chip">KICKOFF IN <strong>{getCountdown(game, now)}</strong></div>}<div className="next-date">{formatGameDate(game)} <span>•</span> {game.time}</div><h2>{dolphinsHome ? "Dolphins vs." : "Dolphins at"} {opponentMeta.short}</h2><p>{game.facility}</p><div className="hero-actions"><a href={RECDESK_LINK} target="_blank" rel="noreferrer" className="primary-link-btn">Full league page ↗</a>{canReplayWin && <button className="secondary-ghost-btn" onClick={onReplayWin}>Replay last win 🎉</button>}</div></div><div className="matchup-lockup"><div className="hero-team"><TeamMark team={DOLPHINS} size="lg" /><b>DOLPHINS</b></div><span className="versus">VS</span><div className="hero-team"><TeamMark team={opponent} size="lg" /><b>{opponentMeta.short.toUpperCase()}</b></div></div></section>;
}

function DolphinsSnapshot({ standing, rank, latestFinal }) {
  const outcome = getDolphinsOutcome(latestFinal);
  return <section className="snapshot-shell"><div className="snapshot-shell-head"><div><span className="eyebrow">DOLPHINS CENTRAL</span><h3>TEAM SNAPSHOT</h3></div><p>Everything parents need at a glance.</p></div><div className="snapshot-grid"><article className="snapshot-card strong"><span className="snapshot-kicker">STANDING</span><span className="snapshot-label">Dolphins rank</span><b>#{rank || "–"}</b><small>League position right now</small></article><article className="snapshot-card"><span className="snapshot-kicker">RECORD</span><span className="snapshot-label">Wins / losses / ties</span><b>{standing ? `${standing.wins}-${standing.losses}-${standing.ties}` : "–"}</b><small>Overall record this season</small></article><article className="snapshot-card"><span className="snapshot-kicker">SCORING</span><span className="snapshot-label">Points for / against</span><b>{standing ? `${standing.pointsFor} / ${standing.pointsAgainst}` : "–"}</b><small>PF / PA</small></article><article className="snapshot-card"><span className="snapshot-kicker">LATEST</span><span className="snapshot-label">Most recent result</span><b>{outcome.result === "win" ? `W ${outcome.dolphinsScore}-${outcome.opponentScore}` : outcome.result === "loss" ? `L ${outcome.dolphinsScore}-${outcome.opponentScore}` : outcome.result === "tie" ? `T ${outcome.dolphinsScore}-${outcome.opponentScore}` : "No final yet"}</b><small>{outcome.opponent ? `vs ${teamMeta(outcome.opponent).short}` : "Waiting on first completed game"}</small></article></div></section>;
}

function SeasonStrip({ games, now, onShare }) {
  const dolphinsGames = games.filter(isDolphinsGame);
  const [selected, setSelected] = useState(null);
  const futureGames = dolphinsGames.filter((g) => !g.isFinal && (parseChelseaGameDate(g)?.getTime() ?? Infinity) >= now.getTime());

  useEffect(() => {
    if (!selected && dolphinsGames.length) {
      setSelected(futureGames[0] || [...dolphinsGames].reverse().find((g) => g.isFinal) || dolphinsGames[dolphinsGames.length - 1]);
    }
  }, [dolphinsGames, futureGames, selected]);

  if (!dolphinsGames.length) return null;
  const chosen = selected || dolphinsGames[0];
  const chosenOpponent = chosen.homeTeam === DOLPHINS ? chosen.awayTeam : chosen.homeTeam;
  const chosenOutcome = getDolphinsOutcome(chosen);

  return <section className="season-shell section-block"><div className="section-heading compact-heading"><div><span className="eyebrow">DOLPHINS SEASON</span><h2>Season Strip</h2></div></div><div className="season-strip">{dolphinsGames.map((game, idx) => {
    const opponent = game.homeTeam === DOLPHINS ? game.awayTeam : game.homeTeam;
    const outcome = getDolphinsOutcome(game);
    const gameTime = parseChelseaGameDate(game)?.getTime() ?? Infinity;
    const isFuture = gameTime >= now.getTime();
    const label = game.isFinal ? (outcome.result === "win" ? "W" : outcome.result === "loss" ? "L" : "T") : isFuture ? "UP" : "PEND";
    return <button key={`${game.date}-${game.time}-${idx}`} onClick={() => setSelected(game)} className={`season-pill ${chosen === game ? "active" : ""} ${game.isFinal ? outcome.result : isFuture ? "upcoming" : "pending"}`}><span>{label}</span><b>{teamMeta(opponent).abbr}</b><small>{game.isFinal ? `${outcome.dolphinsScore}-${outcome.opponentScore}` : formatGameDate(game)}</small></button>;
  })}</div><div className="season-detail"><TeamMark team={chosenOpponent} size="sm" /><div><span>{chosen.isFinal ? "FINAL" : "SCHEDULE"}</span><b>{chosen.isFinal ? `${teamMeta(chosenOpponent).short} • ${chosenOutcome.dolphinsScore}-${chosenOutcome.opponentScore}` : `${formatGameDate(chosen)} • ${chosen.time} vs ${teamMeta(chosenOpponent).short}`}</b></div>{chosen.isFinal && <button className="season-share-btn" onClick={() => onShare(chosen)}>Share</button>}</div></section>;
}

function Standings({ rows, movement = {} }) {
  return <div className="standings-shell"><table className="standings-table"><thead><tr><th className="rank">RK</th><th>TEAM</th><th>W</th><th>L</th><th className="optional-col">T</th><th>PCT</th><th>PF</th><th>PA</th><th>+/-</th></tr></thead><tbody>{rows.map((row, index) => {
    const meta = teamMeta(row.team); const isDolphins = row.team === DOLPHINS; const move = movement[row.team];
    return <tr key={row.team} className={isDolphins ? "dolphins-row" : ""}><td className="rank"><span className="rank-pill">{index + 1}</span>{move && <span className={`rank-move ${move.direction}`}>{move.direction === "up" ? "▲" : "▼"}{move.amount}</span>}</td><td><div className="standings-team"><TeamMark team={row.team} size="sm" /><div><b>{meta.short}</b><small>{row.team.replace(meta.short, "").trim()}</small></div>{isDolphins && <span className="our-team">DOLPHINS</span>}</div></td><td className="record-win">{row.wins}</td><td>{row.losses}</td><td className="optional-col">{row.ties}</td><td>{row.percentage.toFixed(0)}%</td><td>{row.pointsFor}</td><td>{row.pointsAgainst}</td><td className={row.pointDiff > 0 ? "positive" : row.pointDiff < 0 ? "negative" : ""}>{row.pointDiff > 0 ? "+" : ""}{row.pointDiff}</td></tr>;
  })}</tbody></table></div>;
}

function PlayoffPicture({ standings, games }) {
  const totalGamesByTeam = Object.fromEntries(standings.map((row) => [row.team, games.filter((g) => g.homeTeam === row.team || g.awayTeam === row.team).length]));
  const outside = standings.slice(PLAYOFF_SPOTS);
  const clinched = new Set();
  standings.slice(0, PLAYOFF_SPOTS).forEach((row) => {
    const allOutsideMax = outside.map((other) => other.wins + Math.max(0, (totalGamesByTeam[other.team] || 0) - (other.wins + other.losses + other.ties)));
    if (allOutsideMax.length && allOutsideMax.every((max) => row.wins > max)) clinched.add(row.team);
  });
  return <section className="section-block playoff-shell"><div className="section-heading"><div><span className="eyebrow">CURRENT TOP 4</span><h2>Playoff Picture</h2><p className="section-sub">Projected from current RecDesk standings. Official playoff format may differ.</p></div></div><div className="playoff-list">{standings.slice(0, Math.min(6, standings.length)).map((row, index) => <div className="playoff-item-wrap" key={row.team}>{index === PLAYOFF_SPOTS && <div className="cut-line playoff-inline-cut"><span>PROJECTED CUT LINE</span></div>}<div className={`playoff-row ${index < PLAYOFF_SPOTS ? "in" : "out"} ${row.team === DOLPHINS ? "dolphins" : ""}`}><div className="playoff-rank">{index + 1}</div><TeamMark team={row.team} size="sm" /><div className="playoff-team"><b>{teamMeta(row.team).short}</b><span>{row.wins}-{row.losses}-{row.ties}</span></div>{clinched.has(row.team) ? <span className="clinch-badge">CLINCHED</span> : index < PLAYOFF_SPOTS ? <span className="projection-badge">IN</span> : <span className="projection-badge out">OUT</span>}</div></div>)}</div></section>;
}

function ScoreCard({ game }) {
  const home = teamMeta(game.homeTeam); const away = teamMeta(game.awayTeam);
  return <article className={`score-card ${game.isFinal ? "is-final" : ""}`}><div className="score-card-top"><span>{formatGameDate(game)}</span><span className={`status ${game.isFinal ? "final" : "scheduled"}`}>{game.isFinal ? "FINAL" : game.time}</span></div><div className="score-team"><div className="score-team-name"><TeamMark team={game.homeTeam} size="sm" /><span><b>{home.short}</b><small>{game.homeTeam.replace(home.short, "").trim()}</small></span></div><strong>{game.isFinal ? game.homeScore : "–"}</strong></div><div className="score-team"><div className="score-team-name"><TeamMark team={game.awayTeam} size="sm" /><span><b>{away.short}</b><small>{game.awayTeam.replace(away.short, "").trim()}</small></span></div><strong>{game.isFinal ? game.awayScore : "–"}</strong></div><div className="score-location">{game.facility}</div></article>;
}

function ScheduleList({ games, onlyDolphins }) {
  const filtered = onlyDolphins ? games.filter(isDolphinsGame) : games;
  const groups = filtered.reduce((acc, game) => { (acc[game.date] ||= []).push(game); return acc; }, {});
  return <div className="schedule-list">{Object.entries(groups).map(([date, dateGames]) => <section className="schedule-day" key={date}><div className="schedule-date">{formatGameDate(dateGames[0], true)}</div><div className="schedule-day-games">{dateGames.map((game, idx) => { const home = teamMeta(game.homeTeam); const away = teamMeta(game.awayTeam); return <div className={`schedule-game ${isDolphinsGame(game) ? "dolphins-game" : ""}`} key={`${date}-${game.time}-${idx}`}><div className="schedule-time"><b>{game.isFinal ? "FINAL" : game.time}</b><small>{game.facility}</small></div><div className="schedule-matchup"><div className="schedule-team"><TeamMark team={game.homeTeam} size="xs" /><span>{home.short}</span><strong>{game.isFinal ? game.homeScore : ""}</strong></div><div className="schedule-team"><TeamMark team={game.awayTeam} size="xs" /><span>{away.short}</span><strong>{game.isFinal ? game.awayScore : ""}</strong></div></div></div>; })}</div></section>)}</div>;
}

export default function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("home");
  const [scheduleFilter, setScheduleFilter] = useState("dolphins");
  const [celebrationGame, setCelebrationGame] = useState(null);
  const [rankMovement, setRankMovement] = useState({});
  const [shareStatus, setShareStatus] = useState("");
  const [now, setNow] = useState(() => new Date());

  async function load(silent = false) {
    if (!silent) setLoading(true);
    try {
      const response = await fetch(`/api/league?t=${Date.now()}`, { cache: "no-store" });
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.error || "Could not load RecDesk data.");
      setData(json); setError("");
    } catch (err) { setError(err.message || "Could not load league data."); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); const dataTimer = setInterval(() => load(true), 30000); const clockTimer = setInterval(() => setNow(new Date()), 60000); return () => { clearInterval(dataTimer); clearInterval(clockTimer); }; }, []);

  const sortedGames = useMemo(() => !data?.games ? [] : [...data.games].sort((a, b) => (parseChelseaGameDate(a)?.getTime() ?? 0) - (parseChelseaGameDate(b)?.getTime() ?? 0)), [data]);
  const finalGames = useMemo(() => sortedGames.filter((g) => g.isFinal).slice(-4).reverse(), [sortedGames]);
  const upcomingGames = useMemo(() => sortedGames.filter((g) => !g.isFinal && (parseChelseaGameDate(g)?.getTime() ?? Infinity) >= now.getTime()), [sortedGames, now]);
  const dolphinsNext = useMemo(() => upcomingGames.find(isDolphinsGame), [upcomingGames]);
  const latestDolphinsFinal = useMemo(() => { const finals = sortedGames.filter((g) => g.isFinal && isDolphinsGame(g)); return finals.length ? finals[finals.length - 1] : null; }, [sortedGames]);
  const todayDolphinsGame = useMemo(() => sortedGames.find((g) => isDolphinsGame(g) && sameDay(parseChelseaGameDate(g), now)), [sortedGames, now]);
  const homeHeroGame = todayDolphinsGame || dolphinsNext || latestDolphinsFinal;
  const dolphinsStanding = useMemo(() => data?.standings?.find((row) => row.team === DOLPHINS) ?? null, [data]);
  const dolphinsRank = useMemo(() => { const index = data?.standings?.findIndex((row) => row.team === DOLPHINS) ?? -1; return index > -1 ? index + 1 : null; }, [data]);
  const canReplayWin = getDolphinsOutcome(latestDolphinsFinal).result === "win";
  const nextLeagueGames = upcomingGames.slice(0, 4);
  const updated = data?.fetchedAt ? new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" }).format(new Date(data.fetchedAt)) : null;

  useEffect(() => {
    if (!data?.standings?.length) return;
    const current = Object.fromEntries(data.standings.map((row, index) => [row.team, index + 1]));
    try {
      const previous = JSON.parse(window.localStorage.getItem(RANK_SNAPSHOT_KEY) || "null");
      if (previous) {
        const movement = {}; let changed = false;
        for (const [team, rank] of Object.entries(current)) {
          const old = previous[team];
          if (old && old !== rank) { changed = true; movement[team] = { direction: rank < old ? "up" : "down", amount: Math.abs(old - rank) }; }
        }
        if (changed) setRankMovement(movement);
      }
      window.localStorage.setItem(RANK_SNAPSHOT_KEY, JSON.stringify(current));
    } catch {}
  }, [data?.standings]);

  useEffect(() => {
    if (!latestDolphinsFinal) return;
    const key = gameSignature(latestDolphinsFinal);
    const seen = window.localStorage.getItem(LAST_FINAL_KEY);
    if (!seen) { window.localStorage.setItem(LAST_FINAL_KEY, key); return; }
    if (seen !== key) { window.localStorage.setItem(LAST_FINAL_KEY, key); if (getDolphinsOutcome(latestDolphinsFinal).result === "win") setCelebrationGame(latestDolphinsFinal); }
  }, [latestDolphinsFinal]);

  useEffect(() => { document.body.style.overflow = celebrationGame ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [celebrationGame]);

  async function shareResult(game) {
    const outcome = getDolphinsOutcome(game);
    if (!game || outcome.result === "none") return;
    const opponent = teamMeta(outcome.opponent).short;
    const headline = outcome.result === "win" ? "DOLPHINS WIN!" : outcome.result === "tie" ? "DOLPHINS TIE" : "DOLPHINS FINAL";
    const text = `${headline} Taylor Dolphins ${outcome.dolphinsScore}-${outcome.opponentScore} vs ${opponent}. Chelsea K/1 Flag Football.`;
    try {
      const canvas = document.createElement("canvas"); canvas.width = 1080; canvas.height = 1350;
      const ctx = canvas.getContext("2d");
      const grad = ctx.createLinearGradient(0, 0, 1080, 1350); grad.addColorStop(0, "#073946"); grad.addColorStop(.55, "#071520"); grad.addColorStop(1, "#5a2618"); ctx.fillStyle = grad; ctx.fillRect(0, 0, 1080, 1350);
      ctx.fillStyle = "#00a6b2"; ctx.fillRect(0, 0, 24, 1350); ctx.fillStyle = "#fc4c02"; ctx.fillRect(24, 0, 12, 1350);
      ctx.textAlign = "center"; ctx.fillStyle = "#ffffff"; ctx.font = "bold 72px Arial"; ctx.fillText("CHELSEA FLAG HQ", 540, 170);
      ctx.fillStyle = "#8ff9ff"; ctx.font = "bold 40px Arial"; ctx.fillText("K/1 • 2026 SEASON", 540, 235);
      ctx.fillStyle = "#ffffff"; ctx.font = "bold 132px Arial"; ctx.fillText(headline, 540, 520);
      ctx.font = "bold 230px Arial"; ctx.fillText(`${outcome.dolphinsScore}-${outcome.opponentScore}`, 540, 800);
      ctx.font = "bold 58px Arial"; ctx.fillText(`DOLPHINS vs ${opponent.toUpperCase()}`, 540, 920);
      ctx.fillStyle = "#bcd1dc"; ctx.font = "36px Arial"; ctx.fillText(formatGameDate(game), 540, 1005);
      ctx.fillStyle = "#8ff9ff"; ctx.font = "bold 48px Arial"; ctx.fillText("MAKE WAVES", 540, 1175);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      const file = blob ? new File([blob], "dolphins-result.png", { type: "image/png" }) : null;
      if (file && navigator.share && navigator.canShare?.({ files: [file] })) await navigator.share({ title: headline, text, files: [file] });
      else if (navigator.share) await navigator.share({ title: headline, text, url: window.location.href });
      else { await navigator.clipboard.writeText(`${text} ${window.location.href}`); setShareStatus("Copied to clipboard"); setTimeout(() => setShareStatus(""), 2200); }
    } catch (err) {
      if (err?.name !== "AbortError") { try { await navigator.clipboard.writeText(`${text} ${window.location.href}`); setShareStatus("Copied to clipboard"); setTimeout(() => setShareStatus(""), 2200); } catch {} }
    }
  }

  return <main>
    {celebrationGame && <WinCelebrationOverlay game={celebrationGame} onClose={() => setCelebrationGame(null)} />}
    {shareStatus && <div className="share-toast">{shareStatus}</div>}

    <header className="site-header"><div className="brand"><div className="brand-ball">🏈</div><div><b>CHELSEA FLAG HQ</b><span>K/1 • 2026 SEASON</span></div></div><div className="live-cluster"><div className="live-chip"><RefreshDot loading={loading} error={error} /><span>{error ? "RETRYING" : "AUTO UPDATING"}</span></div><small>Unofficial parent hub • Official data: RecDesk</small></div></header>
    <nav className="tabs" aria-label="League sections">{[["home", "Home"], ["standings", "Standings"], ["schedule", "Schedule"]].map(([key, label]) => <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{label}</button>)}</nav>
    {data && <LeagueTicker games={sortedGames} />}

    {error && !data && <section className="error-card"><b>Couldn’t reach RecDesk.</b><p>{error}</p><button onClick={() => load()}>Try again</button></section>}
    {loading && !data && <section className="loading-shell"><div className="loading-bar wide" /><div className="loading-grid"><div className="loading-card" /><div className="loading-card" /><div className="loading-card" /></div></section>}

    {data && <>
      {tab === "home" && <div className="page-content">
        <MatchupHero game={homeHeroGame} now={now} canReplayWin={canReplayWin} onReplayWin={() => setCelebrationGame(latestDolphinsFinal)} onShare={shareResult} />
        <DolphinsSnapshot standing={dolphinsStanding} rank={dolphinsRank} latestFinal={latestDolphinsFinal} />
        <SeasonStrip games={sortedGames} now={now} onShare={shareResult} />
        <section className="section-block"><div className="section-heading"><div><span className="eyebrow">LEAGUE TABLE</span><h2>Standings</h2></div><button className="text-button" onClick={() => setTab("standings")}>Full standings →</button></div><Standings rows={data.standings} movement={rankMovement} /></section>
        <PlayoffPicture standings={data.standings} games={sortedGames} />
        <div className="home-grid"><section className="section-block"><div className="section-heading"><div><span className="eyebrow">SCORES</span><h2>Latest Results</h2></div></div>{finalGames.length ? <div className="score-grid compact">{finalGames.map((game, idx) => <ScoreCard game={game} key={`final-${idx}`} />)}</div> : <div className="empty-state"><span>🏈</span><b>No final scores yet</b><p>As Chelsea Rec enters scores, they’ll appear here automatically.</p></div>}</section><section className="section-block"><div className="section-heading"><div><span className="eyebrow">COMING UP</span><h2>Next Games</h2></div><button className="text-button" onClick={() => setTab("schedule")}>Full schedule →</button></div><div className="score-grid compact">{nextLeagueGames.map((game, idx) => <ScoreCard game={game} key={`next-${idx}`} />)}</div></section></div>
      </div>}
      {tab === "standings" && <div className="page-content"><section className="section-block standings-page"><div className="section-heading"><div><span className="eyebrow">2026 K/1 FLAG FOOTBALL</span><h1>League Standings</h1><p className="section-sub">Official records pulled directly from Chelsea RecDesk.</p></div></div><Standings rows={data.standings} movement={rankMovement} /><p className="standings-note">Standings order follows the order published by Chelsea RecDesk. Point differential is calculated from official points for and against.</p><PlayoffPicture standings={data.standings} games={sortedGames} /></section></div>}
      {tab === "schedule" && <div className="page-content"><section className="section-block schedule-page"><div className="section-heading schedule-heading"><div><span className="eyebrow">2026 K/1 FLAG FOOTBALL</span><h1>Schedule & Scores</h1></div><div className="segmented"><button className={scheduleFilter === "dolphins" ? "active" : ""} onClick={() => setScheduleFilter("dolphins")}>🐬 Dolphins</button><button className={scheduleFilter === "all" ? "active" : ""} onClick={() => setScheduleFilter("all")}>All Teams</button></div></div><ScheduleList games={sortedGames} onlyDolphins={scheduleFilter === "dolphins"} /></section></div>}
    </>}

    <footer><div><b>CHELSEA FLAG HQ</b><span>{updated ? `Last checked ${updated}` : "Connecting to RecDesk…"}</span><span>Unofficial parent hub. Chelsea RecDesk remains the official source.</span></div><a href={RECDESK_LINK} target="_blank" rel="noreferrer">Official RecDesk ↗</a></footer>
  </main>;
}
