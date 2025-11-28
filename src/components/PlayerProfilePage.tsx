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
import { getPlayerNameFromRow, matchesPlayer } from '../utils/playerUtils';
import { TeamLink } from './TeamLink';
import { normalizeTeamName } from '../utils/teamUtils';
import { downloadCSV, downloadXLSX } from '../utils/download';

type PlayerStatOption = {
  value: string;
  label: string;
  accessor: (row: Record<string, any>) => number;
  columnKey: string;
};

type HighlightCard = {
  id: string;
  title: string;
  accessor: (row: Record<string, any>) => number;
  formatter: (value: number) => string;
};

type TableColumn = {
  key: string;
  label: string;
  getter: (row: Record<string, any>) => string;
  align?: 'left' | 'right';
  highlightKey?: string;
};

const PLAYER_HIGHLIGHT_CARDS: HighlightCard[] = [
  {
    id: 'maxPts',
    title: 'Most Points per Game',
    accessor: (row) => toNumber(row['PTS']),
    formatter: (value) => formatNumber(value, 1),
  },
  {
    id: 'totalPts',
    title: 'Most Total Points',
    accessor: totalPoints,
    formatter: (value) => formatNumber(value, 0),
  },
  {
    id: 'maxAst',
    title: 'Most Assists per Game',
    accessor: (row) => toNumber(row['AST']),
    formatter: (value) => formatNumber(value, 1),
  },
  {
    id: 'maxReb',
    title: 'Most Rebounds per Game',
    accessor: (row) => toNumber(row['REB']),
    formatter: (value) => formatNumber(value, 1),
  },
  {
    id: 'bestFg',
    title: 'Best Field Goal %',
    accessor: (row) => toNumber(row['FG%']),
    formatter: (value) => formatPercent(value),
  },
];

const PLAYER_STAT_FIELDS: Array<{
  key: string;
  label: string;
  digits?: number;
  percent?: boolean;
}> = [
  { key: 'GP', label: 'Games Played', digits: 0 },
  { key: 'MIN', label: 'Minutes', digits: 1 },
  { key: 'PTS', label: 'Points', digits: 1 },
  { key: 'AST', label: 'Assists', digits: 1 },
  { key: 'REB', label: 'Rebounds', digits: 1 },
  { key: 'Off_Reb', label: 'Offensive Rebounds', digits: 1 },
  { key: 'Def_Reb', label: 'Defensive Rebounds', digits: 1 },
  { key: 'BLK', label: 'Blocks', digits: 1 },
  { key: 'STL', label: 'Steals', digits: 1 },
  { key: 'TO', label: 'Turnovers', digits: 1 },
  { key: 'FG%', label: 'Field Goal %', percent: true },
  { key: '3P%', label: '3-Point %', percent: true },
  { key: 'FT%', label: 'Free Throw %', percent: true },
  { key: 'TS%', label: 'True Shooting %', percent: true },
  { key: 'OBPR', label: 'Offensive BPR', digits: 2 },
  { key: 'DBPR', label: 'Defensive BPR', digits: 2 },
  { key: 'BPR', label: 'Total BPR', digits: 2 },
  { key: 'POSS', label: 'Possessions', digits: 0 },
  { key: 'USG%', label: 'Usage %', digits: 1 },
  { key: 'Box_OBPR', label: 'Box OBPR', digits: 2 },
  { key: 'Box_DBPR', label: 'Box DBPR', digits: 2 },
  { key: 'Box_BPR', label: 'Box BPR', digits: 2 },
  { key: 'Team_PRPG', label: 'Team PRPG', digits: 2 },
  { key: 'Adj_team_Off_Eff', label: 'Adj Team Off Eff', digits: 2 },
  { key: 'Adj_team_Deff_Eff', label: 'Adj Team Def Eff', digits: 2 },
  { key: 'Adj_team_Eff_Margn', label: 'Adj Team Eff Margin', digits: 2 },
  { key: 'Team_Net_Score', label: 'Team Net Score', digits: 2 },
];

const PLAYER_STAT_OPTIONS: PlayerStatOption[] = PLAYER_STAT_FIELDS.map((field) => ({
  value: field.key,
  label: field.label,
  accessor: (row) => toNumber(row[field.key]),
  columnKey: field.key,
}));

const DEFAULT_STAT_KEY = 'PTS';
const DEFAULT_STAT_OPTION =
  PLAYER_STAT_OPTIONS.find((option) => option.value === DEFAULT_STAT_KEY) ?? PLAYER_STAT_OPTIONS[0];

const TABLE_COLUMNS: TableColumn[] = [
  { key: 'Season', label: 'Season', getter: (row) => String(row['Season'] ?? '—') },
  { key: 'Class', label: 'Class', getter: (row) => String(row['Class'] ?? '—') },
  { key: 'Team', label: 'Team', getter: (row) => String(row['Team'] ?? row['Team_Name'] ?? row['School'] ?? '—') },
  ...PLAYER_STAT_FIELDS.map((field) => ({
    key: field.key,
    label: field.label,
    getter: (row: Record<string, any>) => formatStatField(row[field.key], field),
    align: 'right' as const,
  })),
];

export function PlayerProfilePage() {
  const { playerId = '' } = useParams();
  const navigate = useNavigate();
  const { datasets, loading, error } = useData();
  const [selectedStat, setSelectedStat] = useState<string>(DEFAULT_STAT_OPTION.value);

  useEffect(() => {
    setSelectedStat(DEFAULT_STAT_OPTION.value);
  }, [playerId]);

  const players = datasets?.players ?? [];
  const transfers = datasets?.transfers ?? [];

  const playerRows = useMemo(
    () => players.filter((row) => matchesPlayer(row, playerId)),
    [players, playerId],
  );

  const validPlayerRows = useMemo(
    () => playerRows.filter(isValidPlayerSeasonRow),
    [playerRows],
  );

  const playerRowsAsc = useMemo(
    () =>
      [...validPlayerRows].sort(
        (a, b) => seasonNumber(a['Season']) - seasonNumber(b['Season']),
      ),
    [validPlayerRows],
  );
  const playerRowsDesc = useMemo(() => [...playerRowsAsc].reverse(), [playerRowsAsc]);
  const profileRow = playerRowsDesc[0] ?? (playerRows.length > 0 ? playerRows[playerRows.length - 1] : undefined);

  const playerName = profileRow ? getPlayerNameFromRow(profileRow) : '';
  const primaryTeam = profileRow
    ? profileRow['Team'] ?? profileRow['Team_Name'] ?? profileRow['School'] ?? ''
    : '';
  const position = profileRow?.['Position'] ?? '';
  const height = profileRow?.['Height'] ?? '';
  const playerClass = profileRow?.['Class'] ?? '';
  const hometown = profileRow?.['Hometown'] ?? profileRow?.['City'] ?? '';

  const selectedStatOption =
    PLAYER_STAT_OPTIONS.find((option) => option.value === selectedStat) ??
    DEFAULT_STAT_OPTION;

  const highlightCards = useMemo(() => {
    return PLAYER_HIGHLIGHT_CARDS.map((card) => {
      let bestRow: Record<string, any> | null = null;
      let bestValue = -Infinity;
      playerRowsAsc.forEach((row) => {
        const value = card.accessor(row);
        if (Number.isFinite(value) && value >= bestValue) {
          bestValue = value;
          bestRow = row;
        }
      });
      return {
        id: card.id,
        title: card.title,
        value: Number.isFinite(bestValue) ? card.formatter(bestValue) : '—',
        season: bestRow ? String(bestRow['Season'] ?? '—') : '—',
      };
    });
  }, [playerRowsAsc]);

  const chartData = useMemo(() => {
    return playerRowsAsc
      .map((row) => ({
        season: row['Season'] ?? 'N/A',
        value: selectedStatOption.accessor(row),
        sortKey: seasonNumber(row['Season']),
      }))
      .filter((point) => Number.isFinite(point.value))
      .sort((a, b) => a.sortKey - b.sortKey);
  }, [playerRowsAsc, selectedStatOption]);

  const transferEvents = useMemo(() => {
    return transfers
      .filter((row) => matchesPlayer(row, playerId))
      .map((row) => ({
        season: row['Season'] ? String(row['Season']) : 'N/A',
        from: row['Team'] ?? row['From_Team'] ?? 'Previous Team',
        to: row['New_Team'] ?? row['To_Team'] ?? 'Next Team',
      }))
      .sort((a, b) => seasonNumber(a.season) - seasonNumber(b.season));
  }, [transfers, playerId]);

  // Transfer Impact Analysis
  const transferImpactData = useMemo(() => {
    if (transferEvents.length === 0 || validPlayerRows.length === 0) {
      return null;
    }

    const impactAnalyses: Array<{
      transferSeason: string;
      fromTeam: string;
      toTeam: string;
      beforeRow: Record<string, any> | null;
      afterRow: Record<string, any> | null;
      stats: Array<{
        key: string;
        label: string;
        before: number;
        after: number;
        delta: number;
        percentChange: number | null;
      }>;
    }> = [];

    // Key stats to compare
    const statsToCompare = [
      { key: 'MIN', label: 'Minutes per Game' },
      { key: 'PTS', label: 'Points per Game' },
      { key: 'AST', label: 'Assists per Game' },
      { key: 'REB', label: 'Rebounds per Game' },
      { key: 'FG%', label: 'Field Goal %' },
      { key: '3P%', label: '3-Point %' },
      { key: 'FT%', label: 'Free Throw %' },
      { key: 'TS%', label: 'True Shooting %' },
      { key: 'BPR', label: 'Total BPR' },
      { key: 'OBPR', label: 'Offensive BPR' },
      { key: 'DBPR', label: 'Defensive BPR' },
    ];

    for (const transfer of transferEvents) {
      const transferSeason = transfer.season;
      const fromTeam = normalizeTeamName(transfer.from);
      const toTeam = normalizeTeamName(transfer.to);

      // Find before stats: last season with fromTeam <= transferSeason
      const beforeCandidates = validPlayerRows
        .filter((row) => {
          const rowTeam = normalizeTeamName(row['Team'] ?? row['Team_Name'] ?? row['School'] ?? '');
          const rowSeason = String(row['Season'] ?? '');
          return (
            normalizeTeamName(rowTeam).toLowerCase() === fromTeam.toLowerCase() &&
            seasonNumber(rowSeason) <= seasonNumber(transferSeason)
          );
        })
        .sort((a, b) => seasonNumber(b['Season']) - seasonNumber(a['Season']));
      const beforeRow = beforeCandidates.length > 0 ? beforeCandidates[0] : null;

      // Find after stats: first season with toTeam >= transferSeason
      const afterCandidates = validPlayerRows
        .filter((row) => {
          const rowTeam = normalizeTeamName(row['Team'] ?? row['Team_Name'] ?? row['School'] ?? '');
          const rowSeason = String(row['Season'] ?? '');
          return (
            normalizeTeamName(rowTeam).toLowerCase() === toTeam.toLowerCase() &&
            seasonNumber(rowSeason) >= seasonNumber(transferSeason)
          );
        })
        .sort((a, b) => seasonNumber(a['Season']) - seasonNumber(b['Season']));
      const afterRow = afterCandidates.length > 0 ? afterCandidates[0] : null;

      if (!beforeRow || !afterRow) {
        continue; // Skip if we don't have both before and after
      }

      // Calculate stats
      const stats = statsToCompare
        .map(({ key, label }) => {
          const before = toNumber(beforeRow[key]);
          const after = toNumber(afterRow[key]);
          const delta = after - before;
          const percentChange =
            before > 0 && (key.includes('%') || key.includes('BPR')) ? (delta / before) * 100 : null;

          return {
            key,
            label,
            before,
            after,
            delta,
            percentChange,
          };
        })
        .filter((stat) => stat.before !== 0 || stat.after !== 0); // Filter out all-zero stats

      if (stats.length > 0) {
        impactAnalyses.push({
          transferSeason,
          fromTeam,
          toTeam,
          beforeRow,
          afterRow,
          stats,
        });
      }
    }

    if (impactAnalyses.length === 0) {
      return null;
    }

    return impactAnalyses;
  }, [transferEvents, validPlayerRows]);

  const statsFileBase = playerName
    ? playerName.replace(/\s+/g, '_').toLowerCase()
    : 'player';

  const handleDownload = (format: 'csv' | 'xlsx') => {
    if (!playerRowsAsc.length) {
      alert('No player stats available to download.');
      return;
    }
    if (format === 'csv') {
      downloadCSV(playerRowsAsc, `${statsFileBase}_season_stats`);
    } else {
      downloadXLSX(playerRowsAsc, `${statsFileBase}_season_stats`);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/players');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center text-gray-600">
        Loading player data…
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

  if (!profileRow) {
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
          <div className="bg-white rounded-2xl shadow border border-cream/70 p-8 text-center">
            <h1 className="text-2xl font-bold text-text-main mb-2">Player not found</h1>
            <p className="text-gray-600">No data is currently available for this player.</p>
          </div>
        </div>
      </div>
    );
  }

  // Check if there's any meaningful data (not just empty rows)
  const hasData = validPlayerRows.length > 0 && validPlayerRows.some(row => {
    // Check if row has at least one meaningful stat
    const stats = ['GP', 'PTS', 'AST', 'REB', 'MIN'];
    return stats.some(stat => {
      const value = row[stat];
      return value !== null && value !== undefined && value !== '' && Number(value) !== 0;
    });
  });

  if (!hasData) {
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
          <header className="bg-white rounded-2xl shadow border border-cream/70 p-6 space-y-4">
            <div>
              <p className="text-sm font-semibold text-primary uppercase tracking-wide">Player Profile</p>
              <h1 className="text-3xl font-bold text-text-main">{playerName}</h1>
            </div>
          </header>
          <div className="bg-white rounded-2xl shadow border border-cream/70 p-8 text-center">
            <p className="text-gray-600">No data is currently available for this player.</p>
          </div>
        </div>
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

        <header className="bg-white rounded-2xl shadow border border-cream/70 p-6 space-y-4">
          <div>
            <p className="text-sm font-semibold text-primary uppercase tracking-wide">Player Profile</p>
            <h1 className="text-3xl font-bold text-text-main">{playerName}</h1>
            {primaryTeam && (
              <p className="text-gray-600 text-sm mt-1">
                {primaryTeam}
                {position ? ` · ${position}` : ''}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Position', value: position },
              { label: 'Height', value: height },
              { label: 'Class', value: playerClass },
              { label: 'Hometown', value: hometown },
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
        </header>

        <section className="bg-white rounded-2xl shadow border border-cream/70 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            {highlightCards.map((card) => (
              <div key={card.id} className="rounded-2xl border border-cream/70 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">{card.title}</p>
                <p className="text-2xl font-bold text-text-main mt-2">{card.value}</p>
                <p className="text-xs text-gray-500 mt-1">Season: {card.season}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow border border-cream/70 p-6 space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-text-main">Season-wise performance</h2>
              <p className="text-sm text-gray-500">Track how this player’s key stats evolve across seasons.</p>
            </div>
            <div className="w-full sm:w-64">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Stat to view</label>
              <select
                value={selectedStat}
                onChange={(e) => setSelectedStat(e.target.value)}
                className="w-full px-4 pr-10 py-2 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                {PLAYER_STAT_OPTIONS.map((option) => (
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

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-text-main">Season stats table</h3>
              <p className="text-sm text-gray-500">Detailed per-season numbers filtered to this player.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownload('csv')}
                className="px-3 py-2 rounded-xl border border-cream/70 text-sm font-semibold text-primary hover:bg-cream/40 transition"
              >
                Download CSV
              </button>
              <button
                type="button"
                onClick={() => handleDownload('xlsx')}
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
                  {TABLE_COLUMNS.map((column) => (
                    <th key={column.key} className="px-4 py-3 whitespace-nowrap">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {playerRowsAsc.map((row, index) => (
                  <tr key={`${playerName}-${row['Season']}-${index}`}>
                    {TABLE_COLUMNS.map((column) => {
                      const isHighlight = column.key === selectedStatOption.columnKey;
                      const cellClasses = [
                        'px-4',
                        'py-3',
                        'whitespace-nowrap',
                        column.align === 'right' ? 'text-right' : '',
                        isHighlight ? 'bg-primary/5 font-semibold text-text-main' : '',
                      ]
                        .filter(Boolean)
                        .join(' ');
                      const value = column.getter(row);
                      return (
                        <td key={column.key} className={cellClasses}>
                          {column.key === 'Team' ? <TeamLink name={value} /> : value}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow border border-cream/70 p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-text-main">Transfer History</h2>
            <p className="text-sm text-gray-500">Career moves recorded in the transfers dataset.</p>
          </div>
          {transferEvents.length === 0 ? (
            <div className="text-sm text-gray-500">No transfers recorded for this player.</div>
          ) : (
            <div className="relative pl-6">
              <div className="absolute left-2 top-1 bottom-1 w-px bg-cream/80" />
              <div className="space-y-6">
                {transferEvents.map((event, index) => (
                  <div key={`${event.season}-${index}`} className="relative pl-6">
                    <div className="absolute left-0 top-2 w-4 h-4 rounded-full bg-primary border-2 border-white shadow" />
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {event.season}
                      </span>
                      <div className="flex-1 bg-cream/30 border border-cream/70 rounded-xl p-3 text-sm text-gray-700">
                        <p className="font-semibold text-text-main">
                          {event.from} <span className="text-gray-500">→</span> {event.to}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Documented transfer</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Transfer Impact Section */}
        {transferEvents.length > 0 && (
          transferImpactData && transferImpactData.length > 0 ? (
            <TransferImpactSection
              transferImpactData={transferImpactData}
            />
          ) : (
            <section className="bg-white rounded-2xl shadow border border-cream/70 p-6 space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-text-main">Transfer Impact</h2>
                <p className="text-sm text-gray-500">How transfers affected this player's on-court performance.</p>
              </div>
              <div className="text-sm text-gray-500">
                This player has recorded transfers, but there isn't enough stat data before and after the transfer to analyze performance impact.
              </div>
            </section>
          )
        )}
      </div>
    </div>
  );
}

// Transfer Impact Section Component
function TransferImpactSection({
  transferImpactData,
}: {
  transferImpactData: Array<{
    transferSeason: string;
    fromTeam: string;
    toTeam: string;
    beforeRow: Record<string, any> | null;
    afterRow: Record<string, any> | null;
    stats: Array<{
      key: string;
      label: string;
      before: number;
      after: number;
      delta: number;
      percentChange: number | null;
    }>;
  }>;
}) {
  const [selectedTransferIndex, setSelectedTransferIndex] = useState(0);
  const latestTransfer = transferImpactData[transferImpactData.length - 1];
  const selectedTransfer = transferImpactData[selectedTransferIndex];

  // Generate summary sentence for latest transfer
  const summarySentence = useMemo(() => {
    if (!latestTransfer || latestTransfer.stats.length === 0) return null;

    const significantStats = latestTransfer.stats
      .filter((s) => Math.abs(s.delta) > 0.1) // Filter out tiny changes
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 3);

    if (significantStats.length === 0) return null;

    const parts: string[] = [];
    significantStats.forEach((stat, idx) => {
      const isLast = idx === significantStats.length - 1;
      const isSecond = idx === significantStats.length - 2;
      const deltaStr =
        stat.key.includes('%') || stat.key.includes('BPR')
          ? formatNumber(stat.delta, stat.key.includes('BPR') ? 2 : 1)
          : formatNumber(stat.delta, 1);
      const sign = stat.delta >= 0 ? '+' : '';
      const verb = stat.delta >= 0 ? 'increased' : 'decreased';
      const stayed = Math.abs(stat.delta) < 0.5 ? 'stayed roughly the same' : `${verb} by ${sign}${deltaStr}`;

      if (idx === 0) {
        parts.push(`${stat.label} ${stayed}`);
      } else if (isSecond && !isLast) {
        parts.push(`${stat.label} ${stayed}`);
      } else if (isLast) {
        parts.push(`and ${stat.label} ${stayed}`);
      }
    });

    return `After transferring to ${latestTransfer.toTeam}, ${parts.join(', ')}.`;
  }, [latestTransfer]);

  // Find biggest improvement and decline
  const biggestImprovement = useMemo(() => {
    if (!selectedTransfer) return null;
    const improvements = selectedTransfer.stats
      .filter((s) => s.delta > 0)
      .sort((a, b) => b.delta - a.delta);
    return improvements.length > 0 ? improvements[0] : null;
  }, [selectedTransfer]);

  const biggestDecline = useMemo(() => {
    if (!selectedTransfer) return null;
    const declines = selectedTransfer.stats
      .filter((s) => s.delta < 0)
      .sort((a, b) => a.delta - b.delta);
    return declines.length > 0 ? declines[0] : null;
  }, [selectedTransfer]);

  // Calculate overall impact
  const overallImpact = useMemo(() => {
    if (!selectedTransfer) return { label: 'No data', improved: 0, declined: 0 };
    const keyStats = selectedTransfer.stats.filter((s) =>
      ['MIN', 'PTS', 'AST', 'REB', 'FG%', '3P%', 'FT%'].includes(s.key)
    );
    const improved = keyStats.filter((s) => s.delta > 0.1).length;
    const declined = keyStats.filter((s) => s.delta < -0.1).length;
    const neutral = keyStats.length - improved - declined;

    let label = 'Mixed';
    if (improved > declined + neutral) {
      label = 'Mostly Positive';
    } else if (declined > improved + neutral) {
      label = 'Mostly Negative';
    }

    return { label, improved, declined, neutral };
  }, [selectedTransfer]);

  return (
    <section className="bg-white rounded-2xl shadow border border-cream/70 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-text-main">Transfer Impact</h2>
        <p className="text-sm text-gray-500">How transfers affected this player's on-court performance.</p>
      </div>

      {summarySentence && (
        <div className="bg-cream/30 border border-cream/70 rounded-xl p-4 text-sm text-gray-700">
          <p>{summarySentence}</p>
        </div>
      )}

      {/* Transfer selector if multiple transfers */}
      {transferImpactData.length > 1 && (
        <div className="w-full sm:w-64">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Select Transfer</label>
          <select
            value={selectedTransferIndex}
            onChange={(e) => setSelectedTransferIndex(Number(e.target.value))}
            className="w-full px-4 pr-10 py-2 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            {transferImpactData.map((transfer, idx) => (
              <option key={idx} value={idx}>
                {transfer.transferSeason} transfer ({transfer.fromTeam} → {transfer.toTeam})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Biggest Improvement */}
        <div className="rounded-2xl border border-cream/70 p-4 bg-green-50/50">
          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Biggest Improvement</p>
          {biggestImprovement ? (
            <>
              <p className="text-lg font-bold text-text-main mt-2">
                {biggestImprovement.label} {biggestImprovement.delta >= 0 ? '+' : ''}
                {formatStatField(
                  biggestImprovement.delta,
                  biggestImprovement.key.includes('%') || biggestImprovement.key.includes('BPR')
                    ? { percent: biggestImprovement.key.includes('%'), digits: biggestImprovement.key.includes('BPR') ? 2 : 1 }
                    : { digits: 1 }
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                From {formatStatField(biggestImprovement.before, biggestImprovement.key.includes('%') || biggestImprovement.key.includes('BPR') ? { percent: biggestImprovement.key.includes('%'), digits: biggestImprovement.key.includes('BPR') ? 2 : 1 } : { digits: 1 })} ({selectedTransfer.beforeRow?.['Season'] ?? 'N/A'}, {selectedTransfer.fromTeam}) → {formatStatField(biggestImprovement.after, biggestImprovement.key.includes('%') || biggestImprovement.key.includes('BPR') ? { percent: biggestImprovement.key.includes('%'), digits: biggestImprovement.key.includes('BPR') ? 2 : 1 } : { digits: 1 })} ({selectedTransfer.afterRow?.['Season'] ?? 'N/A'}, {selectedTransfer.toTeam})
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500 mt-2">No significant improvements detected.</p>
          )}
        </div>

        {/* Biggest Decline */}
        <div className="rounded-2xl border border-cream/70 p-4 bg-red-50/50">
          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Biggest Decline</p>
          {biggestDecline ? (
            <>
              <p className="text-lg font-bold text-text-main mt-2">
                {biggestDecline.label} {formatStatField(
                  biggestDecline.delta,
                  biggestDecline.key.includes('%') || biggestDecline.key.includes('BPR')
                    ? { percent: biggestDecline.key.includes('%'), digits: biggestDecline.key.includes('BPR') ? 2 : 1 }
                    : { digits: 1 }
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                From {formatStatField(biggestDecline.before, biggestDecline.key.includes('%') || biggestDecline.key.includes('BPR') ? { percent: biggestDecline.key.includes('%'), digits: biggestDecline.key.includes('BPR') ? 2 : 1 } : { digits: 1 })} ({selectedTransfer.beforeRow?.['Season'] ?? 'N/A'}, {selectedTransfer.fromTeam}) → {formatStatField(biggestDecline.after, biggestDecline.key.includes('%') || biggestDecline.key.includes('BPR') ? { percent: biggestDecline.key.includes('%'), digits: biggestDecline.key.includes('BPR') ? 2 : 1 } : { digits: 1 })} ({selectedTransfer.afterRow?.['Season'] ?? 'N/A'}, {selectedTransfer.toTeam})
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500 mt-2">No significant declines detected.</p>
          )}
        </div>

        {/* Overall Impact */}
        <div className="rounded-2xl border border-cream/70 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Overall Impact Score</p>
          <p className="text-lg font-bold text-text-main mt-2">Overall impact: {overallImpact.label}</p>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            {overallImpact.improved > 0 && <p>• Improved in {overallImpact.improved} key stat{overallImpact.improved > 1 ? 's' : ''}</p>}
            {overallImpact.declined > 0 && <p>• Declined in {overallImpact.declined} stat{overallImpact.declined > 1 ? 's' : ''}</p>}
            {overallImpact.improved === 0 && overallImpact.declined === 0 && <p>• Minimal changes detected</p>}
          </div>
        </div>
      </div>

      {/* Before/After Comparison Table */}
      <div>
        <h3 className="text-lg font-semibold text-text-main mb-4">
          Before/After Comparison ({selectedTransfer.transferSeason} transfer)
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-cream/40 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Stat</th>
                <th className="px-4 py-3 whitespace-nowrap">
                  Before transfer ({selectedTransfer.beforeRow?.['Season'] ?? 'N/A'}, {selectedTransfer.fromTeam})
                </th>
                <th className="px-4 py-3 whitespace-nowrap">
                  After transfer ({selectedTransfer.afterRow?.['Season'] ?? 'N/A'}, {selectedTransfer.toTeam})
                </th>
                <th className="px-4 py-3 whitespace-nowrap text-right">Δ (Delta)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {selectedTransfer.stats.map((stat) => {
                const isPercent = stat.key.includes('%');
                const isBPR = stat.key.includes('BPR');
                return (
                  <tr key={stat.key} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{stat.label}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                      {formatStatField(stat.before, { percent: isPercent, digits: isBPR ? 2 : isPercent ? 1 : 1 })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                      {formatStatField(stat.after, { percent: isPercent, digits: isBPR ? 2 : isPercent ? 1 : 1 })}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap text-right font-semibold ${stat.delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.delta >= 0 ? '+' : ''}
                      {formatStatField(stat.delta, { percent: isPercent, digits: isBPR ? 2 : isPercent ? 1 : 1 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function toNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function totalPoints(row: Record<string, any>): number {
  const pts = toNumber(row['PTS']);
  const games = Math.max(toNumber(row['GP']), 1);
  return pts * games;
}

function formatNumber(value: unknown, digits: number): string {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return '—';
  return num.toFixed(digits);
}

function formatPercent(value: unknown): string {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return '—';
  return `${num.toFixed(1)}%`;
}

function seasonNumber(value: unknown): number {
  if (value == null) return 0;
  const str = String(value);
  const match = str.match(/\d{4}/);
  if (match) return Number(match[0]);
  return Number(str) || 0;
}

function formatStatField(value: unknown, field: { digits?: number; percent?: boolean }): string {
  if (field.percent) {
    return formatPercent(value);
  }
  return formatNumber(value, field.digits ?? 1);
}

function isValidPlayerSeasonRow(row: Record<string, any>): boolean {
  const season = row['Season'];
  if (!hasValidSeasonValue(season)) {
    return false;
  }
  return hasMeaningfulStats(row);
}

function hasValidSeasonValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  return String(value).trim().length > 0;
}

function hasMeaningfulStats(row: Record<string, any>): boolean {
  const keyStats = ['GP', 'PTS', 'AST', 'REB', 'MIN'];
  return keyStats.some((key) => toNumber(row[key]) > 0);
}


