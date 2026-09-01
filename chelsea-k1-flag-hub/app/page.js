"use client";

import { useEffect, useMemo, useState } from "react";

const TEAM_META = {
  "Barr Cowboys": {
    short: "Cowboys",
    abbr: "DAL",
    color: "#041E42",
    logo: "https://a.espncdn.com/i/teamlogos/nfl/500/dal.png",
  },
  "Birdsong Ravens": {
    short: "Ravens",
    abbr: "BAL",
    color: "#241773",
    logo: "https://a.espncdn.com/i/teamlogos/nfl/500/bal.png",
  },
  "Davis Chiefs": {
    short: "Chiefs",
    abbr: "KC",
    color: "#E31837",
    logo: "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png",
  },
  "Gibson Patriots": {
    short: "Patriots",
    abbr: "NE",
    color: "#002244",
    logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ne.png",
  },
  "Gray Eagles": {
    short: "Eagles",
    abbr: "PHI",
    color: "#004C54",
    logo: "https://a.espncdn.com/i/teamlogos/nfl/500/phi.png",
  },
  "Hurston Titans": {
    short: "Titans",
    abbr: "TEN",
    color: "#4B92DB",
    logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ten.png",
  },
  "Sloan Steelers": {
    short: "Steelers",
    abbr: "PIT",
    color: "#FFB612",
    logo: "https://a.espncdn.com/i/teamlogos/nfl/500/pit.png",
  },
  "Taylor Dolphins": {
    short: "Dolphins",
    abbr: "MIA",
    color: "#008E97",
    logo: "https://a.espncdn.com/i/teamlogos/nfl/500/mia.png",
  },
};

const DOLPHINS = "Taylor Dolphins";
const RECDESK_LINK =
  "https://chelsea.recdesk.com/Community/League/Detail?leagueId=47523&divisionId=57145&mode=standings";
const STORAGE_KEY = "chelsea-k1-last-seen-dolphins-final";
const CONFETTI = [
  { left: "6%", delay: "0s", dur: "3.8s", rot: "18deg" },
  { left: "12%", delay: ".4s", dur: "4.4s", rot: "-8deg" },
  { left: "18%", delay: ".8s", dur: "4.2s", rot: "22deg" },
  { left: "24%", delay: "1.1s", dur: "4.8s", rot: "-14deg" },
  { left: "31%", delay: ".1s", dur: "4.6s", rot: "10deg" },
  { left: "38%", delay: ".6s", dur: "4.9s", rot: "-26deg" },
  { left: "44%", delay: ".2s", dur: "3.9s", rot: "15deg" },
  { left: "50%", delay: "1s", dur: "4.3s", rot: "-12deg" },
  { left: "57%", delay: ".3s", dur: "4.6s", rot: "26deg" },
  { left: "63%", delay: ".9s", dur: "4.1s", rot: "-4deg" },
  { left: "70%", delay: ".2s", dur: "4.7s", rot: "30deg" },
  { left: "76%", delay: "1.2s", dur: "4.4s", rot: "-18deg" },
  { left: "82%", delay: ".7s", dur: "4.0s", rot: "9deg" },
  { left: "88%", delay: ".5s", dur: "4.8s", rot: "-28deg" },
  { left: "94%", delay: ".15s", dur: "3.7s", rot: "13deg" },
];

function teamMeta(name) {
  return (
    TEAM_META[name] || {
      short: name,
      abbr: name.slice(0, 3).toUpperCase(),
      color: "#5F7182",
      logo: "",
    }
  );
}

function parseChelseaGameDate(game) {
  const parts = game.date.match(
    /^(?:MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)\s+(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/i
  );
  const timeParts = game.time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!parts || !timeParts) return null;

  const months = {
    january: 0,
    february: 1,
    march: 2,
    april: 3,
    may: 4,
    june: 5,
    july: 6,
    august: 7,
    september: 8,
    october: 9,
    november: 10,
    december: 11,
  };

  let hour = Number(timeParts[1]);
  const minute = Number(timeParts[2]);
  const ampm = timeParts[3].toUpperCase();
  if (ampm === "PM" && hour !== 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;

  return new Date(
    Number(parts[3]),
    months[parts[2].toLowerCase()],
    Number(parts[1]),
    hour,
    minute
  );
}

function formatGameDate(game, includeYear = false) {
  const date = parseChelseaGameDate(game);
  if (!date) return game.date;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
  }).format(date);
}

function gameSignature(game) {
  return [
    game.date,
    game.time,
    game.homeTeam,
    game.awayTeam,
    game.homeScore,
    game.awayScore,
  ].join("|");
}

function isDolphinsGame(game) {
  return game.homeTeam === DOLPHINS || game.awayTeam === DOLPHINS;
}

function getDolphinsOutcome(game) {
  if (!game || !game.isFinal || !isDolphinsGame(game)) {
    return { result: "none", dolphinsScore: null, opponentScore: null, opponent: null };
  }

  const dolphinsHome = game.homeTeam === DOLPHINS;
  const dolphinsScore = dolphinsHome ? game.homeScore : game.awayScore;
  const opponentScore = dolphinsHome ? game.awayScore : game.homeScore;
  const opponent = dolphinsHome ? game.awayTeam : game.homeTeam;

  let result = "tie";
  if (dolphinsScore > opponentScore) result = "win";
  if (dolphinsScore < opponentScore) result = "loss";

  return { result, dolphinsScore, opponentScore, opponent };
}

function TeamMark({ team, size = "md" }) {
  const meta = teamMeta(team);
  return (
    <div className={`team-mark team-mark-${size}`} style={{ "--team": meta.color }}>
      {meta.logo ? (
        <img
          src={meta.logo}
          alt=""
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.nextElementSibling.style.display = "grid";
          }}
        />
      ) : null}
      <span className="team-fallback" style={{ display: meta.logo ? "none" : "grid" }}>
        {meta.abbr}
      </span>
    </div>
  );
}

function RefreshDot({ loading, error }) {
  return (
    <span
      className={`refresh-dot ${loading ? "is-loading" : ""} ${error ? "has-error" : ""}`}
      aria-hidden="true"
    />
  );
}

function WinCelebrationOverlay({ game, onClose }) {
  const outcome = getDolphinsOutcome(game);
  if (!game || outcome.result !== "win") return null;

  const opponentMeta = teamMeta(outcome.opponent);

  return (
    <div className="celebration-overlay" role="dialog" aria-modal="true" aria-label="Dolphins win celebration">
      <div className="celebration-backdrop" onClick={onClose} />
      <div className="celebration-flash flash-1" />
      <div className="celebration-flash flash-2" />
      <div className="celebration-flash flash-3" />
      {CONFETTI.map((piece, idx) => (
        <span
          key={idx}
          className={`confetti-piece ${idx % 2 === 0 ? "aqua" : "orange"}`}
          style={{
            left: piece.left,
            animationDelay: piece.delay,
            animationDuration: piece.dur,
            "--piece-rotate": piece.rot,
          }}
        />
      ))}
      <div className="celebration-card">
        <button className="celebration-close" onClick={onClose} aria-label="Close celebration">
          ×
        </button>
        <div className="celebration-topline">
          <div className="celebration-pill">FINAL</div>
          <div className="celebration-network-bug">DOLPHINS HQ</div>
        </div>

        <div className="celebration-logo-ring">
          <TeamMark team={DOLPHINS} size="xl" />
        </div>

        <div className="celebration-copy">
          <div className="eyebrow">MAKE WAVES • BIG WIN</div>
          <h2>DOLPHINS WIN!!!</h2>
          <p>
            {formatGameDate(game)} • {game.time}
          </p>
        </div>

        <div className="celebration-scoreboard">
          <div className="celebration-side left">
            <TeamMark team={DOLPHINS} size="md" />
            <strong>DOLPHINS</strong>
          </div>
          <div className="celebration-score">
            <span>{outcome.dolphinsScore}</span>
            <small>-</small>
            <span>{outcome.opponentScore}</span>
          </div>
          <div className="celebration-side right">
            <TeamMark team={outcome.opponent} size="md" />
            <strong>{opponentMeta.short.toUpperCase()}</strong>
          </div>
        </div>

        <p className="celebration-subline">
          Taylor Dolphins defeated {outcome.opponent}. Share it with the group chat. 🐬🏈
        </p>
      </div>
    </div>
  );
}

function ScoreCard({ game }) {
  const home = teamMeta(game.homeTeam);
  const away = teamMeta(game.awayTeam);

  return (
    <article className={`score-card ${game.isFinal ? "is-final" : ""}`}>
      <div className="score-card-top">
        <span>{formatGameDate(game)}</span>
        <span className={`status ${game.isFinal ? "final" : "scheduled"}`}>
          {game.isFinal ? "FINAL" : game.time}
        </span>
      </div>

      <div className="score-team">
        <div className="score-team-name">
          <TeamMark team={game.homeTeam} size="sm" />
          <span>
            <b>{home.short}</b>
            <small>{game.homeTeam.replace(home.short, "").trim()}</small>
          </span>
        </div>
        <strong>{game.isFinal ? game.homeScore : "–"}</strong>
      </div>

      <div className="score-team">
        <div className="score-team-name">
          <TeamMark team={game.awayTeam} size="sm" />
          <span>
            <b>{away.short}</b>
            <small>{game.awayTeam.replace(away.short, "").trim()}</small>
          </span>
        </div>
        <strong>{game.isFinal ? game.awayScore : "–"}</strong>
      </div>

      <div className="score-location">{game.facility}</div>
    </article>
  );
}

function NextGameHero({ game, onReplayWin, canReplayWin }) {
  if (!game) {
    return (
      <section className="next-game hero-panel">
        <div className="eyebrow">DOLPHINS</div>
        <h2>Schedule complete</h2>
        <p>No upcoming Dolphins games are currently listed on RecDesk.</p>
      </section>
    );
  }

  const opponent = game.homeTeam === DOLPHINS ? game.awayTeam : game.homeTeam;
  const dolphinsHome = game.homeTeam === DOLPHINS;
  const opponentMeta = teamMeta(opponent);

  return (
    <section className="next-game hero-panel">
      <div className="hero-panel-glow" />
      <div className="hero-stripe" />
      <div className="next-copy">
        <div className="hero-kicker-row">
          <div className="hero-bug">LEAGUE HQ</div>
          <div className="eyebrow">🐬 DOLPHINS NEXT GAME</div>
        </div>
        <div className="next-date">
          {formatGameDate(game)} <span>•</span> {game.time}
        </div>
        <h2>{dolphinsHome ? "Dolphins vs." : "Dolphins at"} {opponentMeta.short}</h2>
        <p>{game.facility}</p>
        <div className="hero-actions">
          <a href={RECDESK_LINK} target="_blank" rel="noreferrer" className="primary-link-btn">
            Full league page ↗
          </a>
          {canReplayWin && (
            <button className="secondary-ghost-btn" onClick={onReplayWin}>
              Replay Dolphins win 🎉
            </button>
          )}
        </div>
      </div>

      <div className="matchup-lockup">
        <div className="hero-team">
          <TeamMark team={DOLPHINS} size="lg" />
          <b>DOLPHINS</b>
        </div>
        <span className="versus">VS</span>
        <div className="hero-team">
          <TeamMark team={opponent} size="lg" />
          <b>{opponentMeta.short.toUpperCase()}</b>
        </div>
      </div>
    </section>
  );
}

function DolphinsSnapshot({ standing, rank, latestFinal }) {
  const outcome = getDolphinsOutcome(latestFinal);

  return (
    <section className="snapshot-grid">
      <article className="snapshot-card strong">
        <span className="snapshot-label">Dolphins rank</span>
        <b>#{rank || "–"}</b>
        <small>League position right now</small>
      </article>
      <article className="snapshot-card">
        <span className="snapshot-label">Record</span>
        <b>
          {standing ? `${standing.wins}-${standing.losses}-${standing.ties}` : "–"}
        </b>
        <small>Wins • losses • ties</small>
      </article>
      <article className="snapshot-card">
        <span className="snapshot-label">Points</span>
        <b>
          {standing ? `${standing.pointsFor} / ${standing.pointsAgainst}` : "–"}
        </b>
        <small>PF / PA</small>
      </article>
      <article className="snapshot-card">
        <span className="snapshot-label">Latest result</span>
        <b>
          {outcome.result === "win"
            ? `W ${outcome.dolphinsScore}-${outcome.opponentScore}`
            : outcome.result === "loss"
              ? `L ${outcome.dolphinsScore}-${outcome.opponentScore}`
              : outcome.result === "tie"
                ? `T ${outcome.dolphinsScore}-${outcome.opponentScore}`
                : "No final yet"}
        </b>
        <small>
          {outcome.opponent ? `vs ${teamMeta(outcome.opponent).short}` : "Waiting on first completed game"}
        </small>
      </article>
    </section>
  );
}

function Standings({ rows }) {
  return (
    <div className="standings-shell">
      <table className="standings-table">
        <thead>
          <tr>
            <th className="rank">RK</th>
            <th>TEAM</th>
            <th>W</th>
            <th>L</th>
            <th className="optional-col">T</th>
            <th>PCT</th>
            <th>PF</th>
            <th>PA</th>
            <th>+/-</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const meta = teamMeta(row.team);
            const isDolphins = row.team === DOLPHINS;
            return (
              <tr key={row.team} className={isDolphins ? "dolphins-row" : ""}>
                <td className="rank">
                  <span className="rank-pill">{index + 1}</span>
                </td>
                <td>
                  <div className="standings-team">
                    <TeamMark team={row.team} size="sm" />
                    <div>
                      <b>{meta.short}</b>
                      <small>{row.team.replace(meta.short, "").trim()}</small>
                    </div>
                    {isDolphins && <span className="our-team">DOLPHINS</span>}
                  </div>
                </td>
                <td className="record-win">{row.wins}</td>
                <td>{row.losses}</td>
                <td className="optional-col">{row.ties}</td>
                <td>{row.percentage.toFixed(0)}%</td>
                <td>{row.pointsFor}</td>
                <td>{row.pointsAgainst}</td>
                <td className={row.pointDiff > 0 ? "positive" : row.pointDiff < 0 ? "negative" : ""}>
                  {row.pointDiff > 0 ? "+" : ""}
                  {row.pointDiff}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ScheduleList({ games, onlyDolphins }) {
  const filtered = onlyDolphins
    ? games.filter((g) => g.homeTeam === DOLPHINS || g.awayTeam === DOLPHINS)
    : games;

  const groups = filtered.reduce((acc, game) => {
    (acc[game.date] ||= []).push(game);
    return acc;
  }, {});

  return (
    <div className="schedule-list">
      {Object.entries(groups).map(([date, dateGames]) => (
        <section className="schedule-day" key={date}>
          <div className="schedule-date">{formatGameDate(dateGames[0], true)}</div>
          <div className="schedule-day-games">
            {dateGames.map((game, idx) => {
              const home = teamMeta(game.homeTeam);
              const away = teamMeta(game.awayTeam);
              const dolphinsGame = isDolphinsGame(game);

              return (
                <div className={`schedule-game ${dolphinsGame ? "dolphins-game" : ""}`} key={`${date}-${game.time}-${idx}`}>
                  <div className="schedule-time">
                    <b>{game.isFinal ? "FINAL" : game.time}</b>
                    <small>{game.facility}</small>
                  </div>
                  <div className="schedule-matchup">
                    <div className="schedule-team">
                      <TeamMark team={game.homeTeam} size="xs" />
                      <span>{home.short}</span>
                      <strong>{game.isFinal ? game.homeScore : ""}</strong>
                    </div>
                    <div className="schedule-team">
                      <TeamMark team={game.awayTeam} size="xs" />
                      <span>{away.short}</span>
                      <strong>{game.isFinal ? game.awayScore : ""}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("home");
  const [scheduleFilter, setScheduleFilter] = useState("dolphins");
  const [celebrationGame, setCelebrationGame] = useState(null);

  async function load(silent = false) {
    if (!silent) setLoading(true);
    try {
      const response = await fetch(`/api/league?t=${Date.now()}`, {
        cache: "no-store",
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json.error || "Could not load RecDesk data.");
      }
      setData(json);
      setError("");
    } catch (err) {
      setError(err.message || "Could not load league data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const timer = setInterval(() => load(true), 30000);
    return () => clearInterval(timer);
  }, []);

  const sortedGames = useMemo(() => {
    if (!data?.games) return [];
    return [...data.games].sort((a, b) => {
      const ad = parseChelseaGameDate(a)?.getTime() ?? 0;
      const bd = parseChelseaGameDate(b)?.getTime() ?? 0;
      return ad - bd;
    });
  }, [data]);

  const finalGames = useMemo(() => sortedGames.filter((g) => g.isFinal).slice(-4).reverse(), [sortedGames]);

  const upcomingGames = useMemo(() => {
    const now = Date.now();
    return sortedGames.filter(
      (g) => !g.isFinal && (parseChelseaGameDate(g)?.getTime() ?? Infinity) >= now
    );
  }, [sortedGames]);

  const dolphinsNext = useMemo(
    () => upcomingGames.find((g) => isDolphinsGame(g)),
    [upcomingGames]
  );

  const latestDolphinsFinal = useMemo(() => {
    const finals = sortedGames.filter((g) => g.isFinal && isDolphinsGame(g));
    return finals.length ? finals[finals.length - 1] : null;
  }, [sortedGames]);

  const dolphinsStanding = useMemo(
    () => data?.standings?.find((row) => row.team === DOLPHINS) ?? null,
    [data]
  );

  const dolphinsRank = useMemo(() => {
    if (!data?.standings) return null;
    const index = data.standings.findIndex((row) => row.team === DOLPHINS);
    return index > -1 ? index + 1 : null;
  }, [data]);

  const dolphinsLatestOutcome = getDolphinsOutcome(latestDolphinsFinal);
  const canReplayWin = dolphinsLatestOutcome.result === "win";
  const nextLeagueGames = upcomingGames.slice(0, 4);

  const updated = data?.fetchedAt
    ? new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date(data.fetchedAt))
    : null;

  useEffect(() => {
    if (!latestDolphinsFinal) return;

    const key = gameSignature(latestDolphinsFinal);
    const seen = window.localStorage.getItem(STORAGE_KEY);

    if (!seen) {
      window.localStorage.setItem(STORAGE_KEY, key);
      return;
    }

    if (seen !== key) {
      window.localStorage.setItem(STORAGE_KEY, key);
      if (getDolphinsOutcome(latestDolphinsFinal).result === "win") {
        setCelebrationGame(latestDolphinsFinal);
      }
    }
  }, [latestDolphinsFinal]);

  useEffect(() => {
    document.body.style.overflow = celebrationGame ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [celebrationGame]);

  return (
    <main>
      {celebrationGame && (
        <WinCelebrationOverlay game={celebrationGame} onClose={() => setCelebrationGame(null)} />
      )}

      <header className="site-header">
        <div className="brand">
          <div className="brand-ball">🏈</div>
          <div>
            <b>CHELSEA FLAG FOOTBALL</b>
            <span>K/1 • 2026 SEASON</span>
          </div>
        </div>

        <div className="live-cluster">
          <div className="live-chip">
            <RefreshDot loading={loading} error={error} />
            <span>{error ? "RETRYING" : "AUTO UPDATING"}</span>
          </div>
          <small>Official source: Chelsea RecDesk</small>
        </div>
      </header>

      <nav className="tabs" aria-label="League sections">
        {[
          ["home", "Home"],
          ["standings", "Standings"],
          ["schedule", "Schedule"],
        ].map(([key, label]) => (
          <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </nav>

      {error && !data && (
        <section className="error-card">
          <b>Couldn’t reach RecDesk.</b>
          <p>{error}</p>
          <button onClick={() => load()}>Try again</button>
        </section>
      )}

      {loading && !data && (
        <section className="loading-shell">
          <div className="loading-bar wide" />
          <div className="loading-grid">
            <div className="loading-card" />
            <div className="loading-card" />
            <div className="loading-card" />
          </div>
        </section>
      )}

      {data && (
        <>
          {tab === "home" && (
            <div className="page-content">
              <NextGameHero
                game={dolphinsNext}
                canReplayWin={canReplayWin}
                onReplayWin={() => setCelebrationGame(latestDolphinsFinal)}
              />

              <DolphinsSnapshot
                standing={dolphinsStanding}
                rank={dolphinsRank}
                latestFinal={latestDolphinsFinal}
              />

              <section className="section-block">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">LEAGUE TABLE</span>
                    <h2>Standings</h2>
                  </div>
                  <button className="text-button" onClick={() => setTab("standings")}>
                    Full standings →
                  </button>
                </div>
                <Standings rows={data.standings} />
              </section>

              <div className="home-grid">
                <section className="section-block">
                  <div className="section-heading">
                    <div>
                      <span className="eyebrow">SCORES</span>
                      <h2>Latest Results</h2>
                    </div>
                  </div>
                  {finalGames.length ? (
                    <div className="score-grid compact">
                      {finalGames.map((game, idx) => (
                        <ScoreCard game={game} key={`final-${idx}`} />
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <span>🏈</span>
                      <b>No final scores yet</b>
                      <p>As Chelsea Rec enters scores, they’ll appear here automatically.</p>
                    </div>
                  )}
                </section>

                <section className="section-block">
                  <div className="section-heading">
                    <div>
                      <span className="eyebrow">COMING UP</span>
                      <h2>Next Games</h2>
                    </div>
                    <button className="text-button" onClick={() => setTab("schedule")}>
                      Full schedule →
                    </button>
                  </div>
                  <div className="score-grid compact">
                    {nextLeagueGames.map((game, idx) => (
                      <ScoreCard game={game} key={`next-${idx}`} />
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}

          {tab === "standings" && (
            <div className="page-content">
              <section className="section-block standings-page">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">2026 K/1 FLAG FOOTBALL</span>
                    <h1>League Standings</h1>
                    <p className="section-sub">
                      Official records pulled directly from Chelsea RecDesk.
                    </p>
                  </div>
                </div>
                <Standings rows={data.standings} />
                <p className="standings-note">
                  Standings order follows the order published by Chelsea RecDesk. Point differential is
                  calculated from official points for and against.
                </p>
              </section>
            </div>
          )}

          {tab === "schedule" && (
            <div className="page-content">
              <section className="section-block schedule-page">
                <div className="section-heading schedule-heading">
                  <div>
                    <span className="eyebrow">2026 K/1 FLAG FOOTBALL</span>
                    <h1>Schedule & Scores</h1>
                  </div>

                  <div className="segmented">
                    <button
                      className={scheduleFilter === "dolphins" ? "active" : ""}
                      onClick={() => setScheduleFilter("dolphins")}
                    >
                      🐬 Dolphins
                    </button>
                    <button
                      className={scheduleFilter === "all" ? "active" : ""}
                      onClick={() => setScheduleFilter("all")}
                    >
                      All Teams
                    </button>
                  </div>
                </div>

                <ScheduleList games={sortedGames} onlyDolphins={scheduleFilter === "dolphins"} />
              </section>
            </div>
          )}
        </>
      )}

      <footer>
        <div>
          <b>Chelsea K/1 Flag Football</b>
          <span>{updated ? `Last checked ${updated}` : "Connecting to RecDesk…"}</span>
        </div>
        <a href={RECDESK_LINK} target="_blank" rel="noreferrer">
          Official RecDesk ↗
        </a>
      </footer>
    </main>
  );
}
