import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useData } from '../context/DataContext';
import { getTeamNameFromRow, matchesTeam, normalizeTeamName } from '../utils/teamUtils';
import { downloadCSV, downloadXLSX } from '../utils/download';
import type { ColumnConfig } from '../config/columns';

const TEAM_STATS_COLUMNS: Array<{
  key: string;
  label: string;
  formatter?: (value: number | string | null) => string;
}> = [
  { key: 'Season', label: 'Season', formatter: (value) => String(value ?? '—') },
  { key: 'Team_Win%', label: 'Team_Win%', formatter: formatPercent },
  { key: 'Team_Q1_Wins', label: 'Team_Q1_Wins', formatter: (value) => formatNumber(value, 0) },
  { key: 'Team_Conf_Wins%', label: 'Team_Conf_Wins%', formatter: formatPercent },
  { key: 'Team_Conf_Rank', label: 'Team_Conf_Rank', formatter: (value) => formatNumber(value, 0) },
  { key: 'NCAA_Seed', label: 'NCAA_Seed', formatter: (value) => formatNumber(value, 0) },
  { key: 'Team_GP', label: 'Team_GP', formatter: (value) => formatNumber(value, 0) },
  { key: 'Team_PTS', label: 'Team_PTS', formatter: (value) => formatNumber(value, 1) },
  { key: 'Team_Reb', label: 'Team_Reb', formatter: (value) => formatNumber(value, 1) },
  { key: 'Team_Off_Reb', label: 'Team_Off_Reb', formatter: (value) => formatNumber(value, 1) },
  { key: 'Team_Def_Reb', label: 'Team_Def_Reb', formatter: (value) => formatNumber(value, 1) },
  { key: 'Team_BLK', label: 'Team_BLK', formatter: (value) => formatNumber(value, 1) },
  { key: 'Team_STL', label: 'Team_STL', formatter: (value) => formatNumber(value, 1) },
  { key: 'Team_TO', label: 'Team_TO', formatter: (value) => formatNumber(value, 1) },
  { key: 'Team_FG%', label: 'Team_FG%', formatter: formatPercent },
  { key: 'Team_3P%', label: 'Team_3P%', formatter: formatPercent },
  { key: 'Team_FT%', label: 'Team_FT%', formatter: formatPercent },
  { key: 'Team_Adj_Off_Eff', label: 'Team_Adj_Off_Eff', formatter: (value) => formatNumber(value, 1) },
  { key: 'Team_Adj_Def_Eff', label: 'Team_Adj_Def_Eff', formatter: (value) => formatNumber(value, 1) },
  { key: 'Team_OBPR', label: 'Team_OBPR', formatter: (value) => formatNumber(value, 2) },
  { key: 'Team_DBPR', label: 'Team_DBPR', formatter: (value) => formatNumber(value, 2) },
  { key: 'Team_BPR', label: 'Team_BPR', formatter: (value) => formatNumber(value, 2) },
  { key: 'Team_Adj_Tempo', label: 'Team_Adj_Tempo', formatter: (value) => formatNumber(value, 1) },
  { key: 'Team_BARTHAG', label: 'Team_BARTHAG', formatter: (value) => formatNumber(value, 3) },
];

const TEAM_STAT_COLUMN_IDS = TEAM_STATS_COLUMNS.map((column) => column.key);
const TEAM_STAT_COLUMN_CONFIGS: ColumnConfig[] = TEAM_STATS_COLUMNS.map((column) => ({
  id: column.key,
  label: column.label,
  type: 'string',
}));

const BEST_SEASON_CARDS = [
  { key: 'Team_PTS', title: 'Most Points per Game', formatter: (value: number | string | null) => formatNumber(value, 1) },
  { key: 'Team_Win%', title: 'Highest Win %', formatter: formatPercent },
  { key: 'Team_Reb', title: 'Most Rebounds per Game', formatter: (value: number | string | null) => formatNumber(value, 1) },
  { key: 'Team_Adj_Off_Eff', title: 'Best Offensive Efficiency', formatter: (value: number | string | null) => formatNumber(value, 1) },
  { key: 'Team_BARTHAG', title: 'Best BARTHAG', formatter: (value: number | string | null) => formatNumber(value, 3) },
] as const;

const TEAM_STAT_OPTIONS = [
  { value: 'Team_Win%', label: 'Win %' },
  { value: 'Team_Q1_Wins', label: 'Q1 Wins' },
  { value: 'Team_Conf_Wins%', label: 'Conference Win %' },
  { value: 'Team_GP', label: 'Games Played' },
  { value: 'Team_PTS', label: 'Points per Game' },
  { value: 'Team_Reb', label: 'Rebounds per Game' },
  { value: 'Team_Off_Reb', label: 'Offensive Rebounds' },
  { value: 'Team_Def_Reb', label: 'Defensive Rebounds' },
  { value: 'Team_BLK', label: 'Blocks' },
  { value: 'Team_STL', label: 'Steals' },
  { value: 'Team_TO', label: 'Turnovers' },
  { value: 'Team_FG%', label: 'Field Goal %' },
  { value: 'Team_3P%', label: '3PT %' },
  { value: 'Team_FT%', label: 'Free Throw %' },
  { value: 'Team_Adj_Off_Eff', label: 'Adj Offensive Eff' },
  { value: 'Team_Adj_Def_Eff', label: 'Adj Defensive Eff' },
  { value: 'Team_OBPR', label: 'OBPR' },
  { value: 'Team_DBPR', label: 'DBPR' },
  { value: 'Team_BPR', label: 'BPR' },
  { value: 'Team_Adj_Tempo', label: 'Adj Tempo' },
  { value: 'Team_BARTHAG', label: 'BARTHAG' },
] as const;

export function TeamPage() {
  const { teamId = '' } = useParams();
  const navigate = useNavigate();
  const { datasets, loading, error } = useData();
  const [selectedSeason, setSelectedSeason] = useState('ALL');
  const [selectedChartStat, setSelectedChartStat] = useState<string>(TEAM_STAT_OPTIONS[0].value);

  const teams = datasets?.teams ?? [];
  const players = datasets?.players ?? [];

  const teamRows = useMemo(
    () => teams.filter((row) => matchesTeam(row, teamId)),
    [teams, teamId],
  );

  const teamRowsAsc = useMemo(
    () =>
      [...teamRows].sort(
        (a, b) => seasonNumber(a['Season']) - seasonNumber(b['Season']),
      ),
    [teamRows],
  );
  const teamRowsDesc = useMemo(() => [...teamRowsAsc].reverse(), [teamRowsAsc]);

  useEffect(() => {
    setSelectedSeason('ALL');
    setSelectedChartStat(TEAM_STAT_OPTIONS[0].value);
  }, [teamId]);

  const latestRow = teamRowsDesc[0];
  const displayName = latestRow ? getTeamNameFromRow(latestRow) : '';

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/teams');
    }
  };

  const seasons = useMemo(() => {
    const unique = Array.from(
      new Set(teamRowsAsc.map((row) => String(row['Season'] ?? 'Unknown'))),
    );
    return unique.sort((a, b) => seasonNumber(b) - seasonNumber(a));
  }, [teamRowsAsc]);

  const bestSeasonCards = useMemo(() => {
    return BEST_SEASON_CARDS.map(({ key, title, formatter }) => {
      let bestRow: Record<string, any> | null = null;
      let bestValue = -Infinity;
      teamRowsAsc.forEach((row) => {
        const value = toNumber(row[key]);
        if (Number.isFinite(value) && value >= bestValue) {
          bestValue = value;
          bestRow = row;
        }
      });
      return {
        title,
        value: bestRow ? formatter(bestRow[key]) : '—',
        season: bestRow ? String(bestRow['Season'] ?? '—') : '—',
      };
    });
  }, [teamRowsAsc]);

  const statsFileBase = displayName
    ? displayName.replace(/\s+/g, '_').toLowerCase()
    : 'team';

  const handleDownloadStats = (format: 'csv' | 'xlsx') => {
    if (!teamRowsAsc.length) {
      alert('No team stats available to download.');
      return;
    }
    if (format === 'csv') {
      downloadCSV(teamRowsAsc, `${statsFileBase}_season_stats`, TEAM_STAT_COLUMN_IDS, TEAM_STAT_COLUMN_CONFIGS);
    } else {
      downloadXLSX(teamRowsAsc, `${statsFileBase}_season_stats`, TEAM_STAT_COLUMN_IDS, TEAM_STAT_COLUMN_CONFIGS);
    }
  };

  const rosterRows = useMemo(() => {
    if (selectedSeason === 'ALL') return [];
    if (!displayName) return [];
    const normalizedTeam = normalizeTeamName(displayName).toLowerCase();
    return players
      .filter((player) => {
        const teamName = normalizeTeamName(
          player['Team'] ?? player['Team_Name'] ?? player['School'],
        ).toLowerCase();
        const season = String(player['Season'] ?? '');
        return teamName === normalizedTeam && season === selectedSeason;
      })
      .sort((a, b) => String(a['Name'] ?? '').localeCompare(String(b['Name'] ?? '')));
  }, [players, displayName, selectedSeason]);

  const chartData = useMemo(() => {
    if (!selectedChartStat) return [];
    return [...teamRowsAsc]
      .map((row) => ({
        season: row['Season'] ?? 'N/A',
        value: toNumber(row[selectedChartStat]),
      }))
      .filter((point) => Number.isFinite(point.value))
      .sort((a, b) => seasonNumber(a.season) - seasonNumber(b.season));
  }, [teamRowsAsc, selectedChartStat]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center text-gray-600">
        Loading team data…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center text-red-600">
        {error}
      </div>
    );
  }

  if (!latestRow) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center text-gray-600">
        Team not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
        >
          <span className="text-lg">←</span>
          Back
        </button>
        <header className="bg-white rounded-2xl shadow border border-cream/70 p-6">
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-sm font-semibold text-primary uppercase tracking-wide">Team Profile</p>
              <h1 className="text-3xl font-bold text-text-main">{displayName}</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Conference', value: latestRow['Conference'] },
                { label: 'Division', value: latestRow['Division'] },
                { label: 'Location', value: latestRow['City'] ?? latestRow['State'] },
              ]
                .filter((item) => item.value)
                .map((item) => (
                  <span
                    key={item.label}
                    className="px-3 py-1 rounded-full bg-cream text-sm font-semibold text-primary"
                  >
                    {item.label}: {item.value}
                  </span>
                ))}
            </div>
          </div>
        </header>

        <section className="bg-white rounded-2xl shadow border border-cream/70 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            {bestSeasonCards.map((card) => (
              <div key={card.title} className="rounded-2xl border border-cream/70 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-text-main mt-2">{card.value}</p>
                <p className="text-xs text-gray-500 mt-1">Season: {card.season}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow border border-cream/70 p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-text-main">Team stats by season</h2>
              <p className="text-sm text-gray-500">
                Performance metrics across every recorded season.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadStats('csv')}
                className="px-3 py-2 rounded-xl border border-cream/70 text-sm font-semibold text-primary hover:bg-cream/40 transition"
              >
                Download CSV
              </button>
              <button
                type="button"
                onClick={() => handleDownloadStats('xlsx')}
                className="px-3 py-2 rounded-xl border border-primary text-sm font-semibold text-white bg-primary hover:bg-primary/90 transition"
              >
                Download Excel
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-cream/40 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                <tr>
                  {TEAM_STATS_COLUMNS.map((column) => (
                    <th key={column.key} className="px-4 py-3 whitespace-nowrap">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {teamRowsAsc.map((row, index) => {
                  const season = String(row['Season'] ?? 'Unknown');
                  const isLatest = latestRow ? season === String(latestRow['Season'] ?? '') : false;
                  return (
                    <tr
                      key={`${displayName}-${season}-${index}`}
                      className={`transition-colors ${isLatest ? 'bg-primary/5' : ''}`}
                    >
                      {TEAM_STATS_COLUMNS.map((column) => (
                        <td key={column.key} className="px-4 py-3 whitespace-nowrap">
                          {column.formatter
                            ? column.formatter(column.key === 'Season' ? season : row[column.key])
                            : row[column.key] ?? '—'}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow border border-cream/70 p-6 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-text-main">
                {getStatLabel(selectedChartStat)} Over Seasons
              </h2>
              <p className="text-sm text-gray-500">
                Tracking {getStatLabel(selectedChartStat).toLowerCase()} across all seasons for this team.
              </p>
            </div>
            <div className="w-full sm:w-64">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Stat to compare</label>
              <select
                value={selectedChartStat}
                onChange={(e) => setSelectedChartStat(e.target.value)}
                className="w-full px-4 pr-10 py-2 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                {TEAM_STAT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {chartData.length === 0 ? (
            <div className="text-center text-gray-500 py-8">Not enough data to plot this stat.</div>
          ) : (
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="season" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#990000" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl shadow border border-cream/70 p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-text-main">Roster</h2>
              <p className="text-sm text-gray-500">
                {selectedSeason === 'ALL'
                  ? 'Select a season to view the roster.'
                  : `Players for the ${selectedSeason} season.`}
              </p>
            </div>
            <div className="w-full sm:w-60">
              <select
                aria-label="Roster season"
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="w-full px-4 pr-10 py-2 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="ALL">All seasons</option>
                {seasons.map((season) => (
                  <option key={season} value={season}>
                    {season}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {selectedSeason === 'ALL' ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-6 text-sm text-gray-500">
              Select a specific season to see roster details.
            </div>
          ) : rosterRows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-6 text-sm text-gray-500">
              No roster data available for {selectedSeason}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-cream/40 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  <tr>
                    <th className="px-4 py-3">Player Name</th>
                    <th className="px-4 py-3">Position</th>
                    <th className="px-4 py-3">Hometown</th>
                    <th className="px-4 py-3">Height</th>
                    <th className="px-4 py-3">Class</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rosterRows.map((player) => (
                    <tr key={`${player['Name']}-${player['Season']}`}>
                      <td className="px-4 py-3 font-semibold text-text-main">{player['Name']}</td>
                      <td className="px-4 py-3">{player['Position'] ?? '—'}</td>
                      <td className="px-4 py-3">{player['Hometown'] ?? '—'}</td>
                      <td className="px-4 py-3">{player['Height'] ?? '—'}</td>
                      <td className="px-4 py-3">{player['Class'] ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function toNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : NaN;
}

function formatNumber(value: number | string | null, digits = 1): string {
  const num = typeof value === 'string' ? Number(value) : value;
  if (num === null || num === undefined || Number.isNaN(num)) return '—';
  return Number(num).toFixed(digits);
}

function formatPercent(value: number | string | null): string {
  const parsed = typeof value === 'string' ? Number(value) : value;
  if (parsed === null || parsed === undefined || Number.isNaN(parsed)) return '—';
  return `${Number(parsed).toFixed(1)}%`;
}

function seasonNumber(value: unknown): number {
  if (value == null) return 0;
  const str = String(value);
  const match = str.match(/\d{4}/);
  if (match) return Number(match[0]);
  return Number(str) || 0;
}

function getStatLabel(value: string): string {
  return TEAM_STAT_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

