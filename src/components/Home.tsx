import { useMemo, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import { useData } from '../context/DataContext';
import { useAppState } from '../context/AppStateContext';
import { TeamLink } from './TeamLink';
import { PlayerLink } from './PlayerLink';
import { playerSlugFromRow } from '../utils/playerUtils';

type PlayerSectionConfig = {
  id: string;
  title: string;
  metricLabel: string;
  valueGetter: (player: Record<string, any>) => number;
  valueFormatter?: (value: number) => string;
};

const ALL_SEASONS_OPTION = 'All Seasons';
const ALL_CONFERENCES_OPTION = 'All Conferences';

const PLAYER_SECTIONS: PlayerSectionConfig[] = [
  {
    id: 'totalPoints',
    title: 'Top 10 Players by Total Points',
    metricLabel: 'Total Points',
    valueGetter: (player) => {
      const ptsPerGame = toNumber(player['PTS']);
      const games = Math.max(toNumber(player['GP']), 1);
      return ptsPerGame * games;
    },
    valueFormatter: (value) => Math.round(value).toLocaleString(),
  },
  {
    id: 'pointsPerGame',
    title: 'Top 10 Players by Points Per Game',
    metricLabel: 'PPG',
    valueGetter: (player) => toNumber(player['PTS']),
    valueFormatter: (value) => value.toFixed(1),
  },
  {
    id: 'assists',
    title: 'Top 10 Players by Assists',
    metricLabel: 'AST',
    valueGetter: (player) => toNumber(player['AST']),
    valueFormatter: (value) => value.toFixed(1),
  },
  {
    id: 'rebounds',
    title: 'Top 10 Players by Rebounds',
    metricLabel: 'REB',
    valueGetter: (player) => toNumber(player['REB']),
    valueFormatter: (value) => value.toFixed(1),
  },
];

const TEAM_METRIC = {
  key: 'Team_Win%',
  label: 'Win %',
  format: (value: number) => `${value.toFixed(1)}%`,
};

type TeamSectionConfig = {
  id: string;
  title: string;
  metricLabel: string;
  valueGetter: (team: Record<string, any>) => number;
  valueFormatter?: (value: number) => string;
};

const TEAM_SECTIONS: TeamSectionConfig[] = [
  {
    id: 'winPct',
    title: 'Top 10 Teams by Win %',
    metricLabel: 'Win %',
    valueGetter: (team) => toNumber(team['Team_Win%']),
    valueFormatter: (value) => `${value.toFixed(1)}%`,
  },
  {
    id: 'offEff',
    title: 'Top 10 Teams by Offensive Efficiency',
    metricLabel: 'Adj Off Eff',
    valueGetter: (team) => toNumber(team['Team_Adj_Off_Eff']),
    valueFormatter: (value) => value.toFixed(2),
  },
  {
    id: 'ptsPerGame',
    title: 'Top 10 Teams by Points Per Game',
    metricLabel: 'PTS',
    valueGetter: (team) => toNumber(team['Team_PTS']),
    valueFormatter: (value) => value.toFixed(1),
  },
  {
    id: 'rebounds',
    title: 'Top 10 Teams by Rebounds',
    metricLabel: 'REB',
    valueGetter: (team) => toNumber(team['Team_Reb']),
    valueFormatter: (value) => value.toFixed(1),
  },
];

type PlayerLeaderboardRow = {
  rank: number;
  name: string;
  slug: string;
  team: string;
  season: string;
  numericValue: number;
  displayValue: string;
};

type TeamLeaderboardRow = {
  rank: number;
  team: string;
  season: string;
  numericValue: number;
  displayValue: string;
};

function toNumber(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function normalizeSeason(value: unknown) {
  if (value === null || value === undefined || value === '') return 'Unknown';
  return String(value);
}

function getDefaultSeason(seasonList: string[]): string {
  if (seasonList.length === 0) return ALL_SEASONS_OPTION;
  if (seasonList.includes('2025')) return '2025';
  return seasonList[0]; // Latest season (already sorted descending)
}

export function Home() {
  const { datasets, loading, error } = useData();
  const { state, updateDashboardSeason } = useAppState();
  const [activeTab, setActiveTab] = useState<'players' | 'teams'>('players');

  const seasonList = useMemo(() => {
    if (!datasets) return [] as string[];
    const seasons = new Set<string>();
    ['players', 'teams', 'transfers'].forEach((key) => {
      datasets[key as keyof typeof datasets]?.forEach((row: Record<string, any>) => {
        const season = normalizeSeason(row['Season']);
        if (season !== 'Unknown') {
          seasons.add(season);
        }
      });
    });
    return Array.from(seasons).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  }, [datasets]);

  const defaultSeason = useMemo(() => getDefaultSeason(seasonList), [seasonList]);
  const [selectedSeason, setSelectedSeason] = useState<string>(
    state.dashboardSeason ?? defaultSeason
  );
  const [selectedConference, setSelectedConference] = useState<string>(ALL_CONFERENCES_OPTION);

  useEffect(() => {
    if (!state.dashboardSeason && seasonList.length > 0) {
      const initialSeason = getDefaultSeason(seasonList);
      setSelectedSeason(initialSeason);
      updateDashboardSeason(initialSeason);
    }
  }, [seasonList, state.dashboardSeason, updateDashboardSeason]);

  const conferenceList = useMemo(() => {
    if (!datasets) return [] as string[];
    const conferences = new Set<string>();
    ['players', 'teams'].forEach((key) => {
      datasets[key as keyof typeof datasets]?.forEach((row: Record<string, any>) => {
        const conference = String(row['Conference'] || '').trim();
        if (conference) {
          conferences.add(conference);
        }
      });
    });
    return Array.from(conferences).sort();
  }, [datasets]);

  const filteredData = useMemo(() => {
    if (!datasets) return null;
    const filterRows = (rows: Record<string, any>[]) => {
      let filtered = rows;
      
      // Filter by season
      if (selectedSeason !== ALL_SEASONS_OPTION) {
        filtered = filtered.filter((row) => normalizeSeason(row['Season']) === selectedSeason);
      }
      
      // Filter by conference
      if (selectedConference !== ALL_CONFERENCES_OPTION) {
        filtered = filtered.filter((row) => {
          const conference = String(row['Conference'] || '').trim();
          return conference === selectedConference;
        });
      }
      
      return filtered;
    };
    return {
      players: filterRows(datasets.players),
      teams: filterRows(datasets.teams),
      transfers: filterRows(datasets.transfers),
    };
  }, [datasets, selectedSeason, selectedConference]);

  const summary = useMemo(() => {
    if (!filteredData) {
      return {
        players: 0,
        teams: 0,
        transfers: 0,
        seasons: 0,
      };
    }
    return {
      players: filteredData.players.length,
      teams: filteredData.teams.length,
      transfers: filteredData.transfers.length,
      seasons:
        selectedSeason === ALL_SEASONS_OPTION ? seasonList.length : seasonList.includes(selectedSeason) ? 1 : 0,
    };
  }, [filteredData, selectedSeason, seasonList]);

  const playerSections = useMemo(() => {
    if (!filteredData?.players?.length) {
      return {};
    }

    const players = filteredData.players;
    const result: Record<string, { rows: PlayerLeaderboardRow[]; maxValue: number }> = {};

    for (const config of PLAYER_SECTIONS) {
      const processed = [...players]
        .map((player) => ({
          player,
          value: config.valueGetter(player),
        }))
        .filter((entry) => entry.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
        .map((entry, index) => ({
          rank: index + 1,
          name: entry.player['Name'] || entry.player['Player'] || 'Unknown',
          slug: playerSlugFromRow(entry.player),
          team: entry.player['Team'] || entry.player['Current_Team'] || '—',
          season: normalizeSeason(entry.player['Season']),
          numericValue: entry.value,
          displayValue: config.valueFormatter
            ? config.valueFormatter(entry.value)
            : entry.value.toLocaleString(),
        }));

      result[config.id] = {
        rows: processed,
        maxValue: processed[0]?.numericValue ?? 0,
      };
    }

    return result;
  }, [filteredData]);

  const teamSections = useMemo(() => {
    if (!filteredData?.teams?.length) return {};
    const teams = filteredData.teams;
    const result: Record<string, { rows: TeamLeaderboardRow[]; maxValue: number }> = {};

    for (const config of TEAM_SECTIONS) {
      const processed = [...teams]
        .map((team) => ({
          team,
          value: config.valueGetter(team),
        }))
        .filter((entry) => entry.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
        .map((entry, index) => ({
          rank: index + 1,
          team: entry.team['Team_Name'] || entry.team['Team'] || 'Unknown',
          season: normalizeSeason(entry.team['Season']),
          numericValue: entry.value,
          displayValue: config.valueFormatter ? config.valueFormatter(entry.value) : entry.value.toLocaleString(),
        }));

      result[config.id] = {
        rows: processed,
        maxValue: processed[0]?.numericValue ?? 0,
      };
    }

    return result;
  }, [filteredData]);

  const bestTeamsBySeason = useMemo(() => {
    if (!filteredData?.teams?.length) {
      return [];
    }

    const map = new Map<
      string,
      { season: string; team: string; value: number }
    >();

    for (const row of filteredData.teams) {
      const season = normalizeSeason(row['Season']);
      const value = toNumber(row[TEAM_METRIC.key]);
      if (!map.has(season) || value > (map.get(season)?.value ?? -Infinity)) {
        map.set(season, {
          season,
          team: row['Team_Name'] || row['Team'] || 'Unknown',
          value,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      a.season.localeCompare(b.season),
    );
  }, [filteredData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-2xl font-semibold text-text-main">Loading dashboard...</div>
          <p className="text-gray-600">Fetching the latest NCAA datasets</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-xl text-center">
          <h2 className="text-2xl font-semibold text-red-600 mb-2">Unable to load dashboard</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            Please verify the Excel file in <code className="bg-gray-100 px-2 py-1 rounded">public/data</code> then refresh the page.
          </p>
        </div>
      </div>
    );
  }

  if (!datasets || !filteredData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <header className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-wide text-primary mb-2">Dashboard</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-text-main mb-3">
            NCAA Men's Basketball Data Explorer
          </h1>
          <p className="text-gray-600 text-base sm:text-lg max-w-3xl">
            High-level trends across player, team, and transfer datasets powered by the latest Indiana University data extracts.
          </p>
        </header>

        {/* Tab selector, Conference filter, and Season filter */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="inline-flex rounded-full bg-white border border-cream/60 p-1 shadow-sm">
                {(['players', 'teams'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-2 text-sm font-semibold rounded-full transition-colors ${
                      activeTab === tab ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:text-primary'
                    }`}
                  >
                    {tab === 'players' ? 'Players' : 'Teams'}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm font-medium text-gray-700" htmlFor="conference-filter">
                  Conference
                </label>
                <select
                  id="conference-filter"
                  className="px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={selectedConference}
                  onChange={(e) => {
                    setSelectedConference(e.target.value);
                  }}
                >
                  <option value={ALL_CONFERENCES_OPTION}>{ALL_CONFERENCES_OPTION}</option>
                  {conferenceList.map((conference) => (
                    <option key={conference} value={conference}>
                      {conference}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm font-medium text-gray-700" htmlFor="season-filter">
                Season
              </label>
              <select
                id="season-filter"
                className="px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={selectedSeason}
                onChange={(e) => {
                  setSelectedSeason(e.target.value);
                  updateDashboardSeason(e.target.value);
                }}
              >
                <option value={ALL_SEASONS_OPTION}>{ALL_SEASONS_OPTION}</option>
                {seasonList.map((season) => (
                  <option key={season} value={season}>
                    {season}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Summary Cards */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <SummaryCard title="Total Players" value={summary.players} />
            <SummaryCard title="Total Teams" value={summary.teams} />
            <SummaryCard title="Total Transfers" value={summary.transfers} />
            <SummaryCard title="Number of Seasons" value={summary.seasons} />
          </div>
        </section>

        {/* Leaderboard sections */}
        {activeTab === 'players' ? (
        <section className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {PLAYER_SECTIONS.map((config) => (
              <PlayerStatBlock
                key={config.id}
                title={config.title}
                metricLabel={config.metricLabel}
                    rows={playerSections[config.id]?.rows || []}
              />
              ))}
            </div>
          </section>
        ) : (
          <section className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {TEAM_SECTIONS.map((config) => (
                  <TeamStatBlock
                    key={config.id}
                    title={config.title}
                    metricLabel={config.metricLabel}
                    rows={teamSections[config.id]?.rows || []}
                  />
              ))}
          </div>
        </section>
        )}

        {/* Bottom summary table (teams view only) */}
        {activeTab === 'teams' && (
        <section className="bg-white rounded-2xl shadow-md border border-cream/70">
          <div className="px-6 py-5 border-b border-cream/60">
            <h2 className="text-xl font-semibold text-text-main">Best Team by Season</h2>
            <p className="text-sm text-gray-600">
              Top-performing team each season based on {TEAM_METRIC.label}.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-cream/50">
                <tr>
                  <Th>Season</Th>
                  <Th>Team</Th>
                  <Th>{TEAM_METRIC.label}</Th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {bestTeamsBySeason.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-6 text-center text-gray-500">
                      No team data available.
                    </td>
                  </tr>
                ) : (
                  bestTeamsBySeason.map((row) => (
                    <tr key={`${row.season}-${row.team}`} className="hover:bg-cream/20 transition-colors">
                      <Td>{row.season}</Td>
                      <Td>
                        <TeamLink name={row.team} />
                      </Td>
                      <Td>{TEAM_METRIC.format(row.value)}</Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-cream/70 p-5">
      <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</p>
      <p className="mt-3 text-3xl font-bold text-text-main">{value.toLocaleString()}</p>
    </div>
  );
}

function PlayerStatBlock({
  title,
  metricLabel,
  rows,
}: {
  title: string;
  metricLabel: string;
  rows: PlayerLeaderboardRow[];
}) {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-cream/70 flex flex-col">
      <div className="px-6 py-5 border-b border-cream/60 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-main">{title}</h3>
        <span className="text-xs font-semibold text-gray-500 uppercase">{metricLabel}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-cream/40 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
            <tr>
              <Th>Rank</Th>
              <Th>Player</Th>
              <Th>Team</Th>
              <Th>{metricLabel}</Th>
              <Th>Season</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-5 text-center text-gray-500">
                  No data available.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={`${title}-${row.rank}-${row.name}`} className="hover:bg-cream/20 transition-colors">
                  <Td>{row.rank}</Td>
                  <Td>
                    <PlayerLink name={row.name} slug={row.slug} />
                  </Td>
                  <Td>
                    <TeamLink name={row.team} />
                  </Td>
                  <Td>{row.displayValue}</Td>
                  <Td>
                    <SeasonChip value={row.season} />
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TeamStatBlock({
  title,
  metricLabel,
  rows,
}: {
  title: string;
  metricLabel: string;
  rows: TeamLeaderboardRow[];
}) {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-cream/70 flex flex-col">
      <div className="px-6 py-5 border-b border-cream/60 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-main">{title}</h3>
        <span className="text-xs font-semibold text-gray-500 uppercase">{metricLabel}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-cream/40 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
            <tr>
              <Th>Rank</Th>
              <Th>Team</Th>
              <Th>{metricLabel}</Th>
              <Th>Season</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-5 text-center text-gray-500">
                  No data available.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={`${title}-${row.rank}-${row.team}`} className="hover:bg-cream/20 transition-colors">
                  <Td>{row.rank}</Td>
                  <Td>
                    <TeamLink name={row.team} />
                  </Td>
                  <Td>{row.displayValue}</Td>
                  <Td>
                    <SeasonChip value={row.season} />
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlayerVisualBlock({
  title,
  metricLabel,
  rows,
}: {
  title: string;
  metricLabel: string;
  rows: PlayerLeaderboardRow[];
}) {
  const chartData = rows.map((row) => ({
    name: row.name,
    value: row.numericValue,
    displayValue: row.displayValue,
    team: row.team,
    season: row.season,
  }));
  const chartHeight = Math.max(240, rows.length * 32);
  return (
    <div className="bg-white rounded-2xl shadow-md border border-cream/70 p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-main">{title}</h3>
        <span className="text-xs font-semibold text-gray-500 uppercase">{metricLabel}</span>
      </div>
      {chartData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">No data available.</div>
      ) : (
        <div style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 32, left: 0, bottom: 0 }}
            >
              <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <YAxis
                dataKey="name"
                type="category"
                width={140}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<PlayerBarTooltip />} />
              <Bar dataKey="value" fill="#990000" barSize={18} radius={[0, 8, 8, 0]}>
                <LabelList dataKey="displayValue" position="right" fill="#1c1c1c" fontSize={12} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function TeamVisualBlock({
  title,
  metricLabel,
  rows,
}: {
  title: string;
  metricLabel: string;
  rows: TeamLeaderboardRow[];
}) {
  const chartData = rows.map((row) => ({
    name: row.team,
    value: row.numericValue,
    displayValue: row.displayValue,
    season: row.season,
  }));
  const chartHeight = Math.max(240, rows.length * 32);
  return (
    <div className="bg-white rounded-2xl shadow-md border border-cream/70 p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-main">{title}</h3>
        <span className="text-xs font-semibold text-gray-500 uppercase">{metricLabel}</span>
      </div>
      {chartData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">No data available.</div>
      ) : (
        <div style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 32, left: 0, bottom: 0 }}>
              <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <YAxis
                dataKey="name"
                type="category"
                width={150}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<TeamBarTooltip />} />
              <Bar dataKey="value" fill="#990000" barSize={18} radius={[0, 8, 8, 0]}>
                <LabelList dataKey="displayValue" position="right" fill="#1c1c1c" fontSize={12} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function PlayerBarTooltip({ active, payload }: TooltipProps<number, string> | any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload as {
    name: string;
    team: string;
    displayValue: string;
    season: string;
  };
  return (
    <div className="bg-white rounded-xl shadow-lg px-4 py-3 border border-cream/70 text-sm">
      <p className="font-semibold text-text-main">{data.name}</p>
      <p className="text-gray-600 text-xs mb-1">{data.team}</p>
      <p className="text-xs text-gray-500 mb-1">Season {data.season}</p>
      <p className="text-primary font-semibold">{data.displayValue}</p>
    </div>
  );
}

function TeamBarTooltip({ active, payload }: TooltipProps<number, string> | any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload as {
    name: string;
    displayValue: string;
    season: string;
  };
  return (
    <div className="bg-white rounded-xl shadow-lg px-4 py-3 border border-cream/70 text-sm">
      <p className="font-semibold text-text-main">{data.name}</p>
      <p className="text-xs text-gray-500 mb-1">Season {data.season}</p>
      <p className="text-primary font-semibold">{data.displayValue}</p>
    </div>
  );
}

function SeasonChip({ value }: { value: string }) {
  return (
    <span className="inline-flex px-2.5 py-1 rounded-full bg-cream/70 text-xs font-semibold text-text-main">
      {value}
    </span>
  );
}

function Th({ children }: { children: ReactNode }) {
  return <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">{children}</th>;
}

function Td({ children }: { children: ReactNode }) {
  return <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{children}</td>;
}

