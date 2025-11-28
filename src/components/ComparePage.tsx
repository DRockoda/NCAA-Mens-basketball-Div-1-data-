import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  LabelList,
} from 'recharts';
import { useData } from '../context/DataContext';
import { useAppState } from '../context/AppStateContext';
import { TeamLink } from './TeamLink';
import { PlayerLink } from './PlayerLink';
import { getPlayerNameFromRow, playerSlugFromRow } from '../utils/playerUtils';

type CompareMode = 'players' | 'teams';

interface ComparePageProps {
  mode: CompareMode;
}

interface Suggestion {
  id: string;
  name: string;
  subtitle: string;
}

interface SelectedEntity extends Suggestion {}

interface StatOption {
  value: string;
  label: string;
  getter: (row: Record<string, any>) => number;
  format?: (value: number) => string;
}

interface TableStat {
  key: string;
  label: string;
  getter: (row: Record<string, any>) => number;
  format?: (value: number) => string;
}

interface CompareConfig {
  title: string;
  subtitle: string;
  datasetKey: 'players' | 'teams';
  searchPlaceholder: string;
  getEntityId: (row: Record<string, any>) => string | undefined;
  buildSuggestion: (row: Record<string, any>) => Suggestion | null;
  statOptions: StatOption[];
  tableStats: TableStat[];
  extraHighlightStats: { label: string; statKey: string }[];
}

const NUMBER_FORMAT = new Intl.NumberFormat();
const ONE_DECIMAL_FORMAT = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });

const COLOR_PALETTE = ['#990000', '#C85179', '#F07900', '#4C6FFF', '#2D9CDB'];

const CONFIG: Record<CompareMode, CompareConfig> = {
  players: {
    title: 'Compare Players',
    subtitle: 'Search and select 1–5 players to compare.',
    datasetKey: 'players',
    searchPlaceholder: 'Search players…',
    getEntityId: (row) => {
      const slug = playerSlugFromRow(row);
      return slug || getPlayerNameFromRow(row) || undefined;
    },
    buildSuggestion: (row) => {
      const id = playerSlugFromRow(row);
      const name = getPlayerNameFromRow(row);
      if (!id || !name) return null;
      const team = row?.['Team'] || row?.['Current_Team'] || '—';
      const season = row?.['Season'] || 'N/A';
      return {
        id,
        name,
        subtitle: `${team} · ${season}`,
      };
    },
    statOptions: [
      { value: 'PTS', label: 'Points per Game', getter: (row) => toNumber(row['PTS']) },
      { value: 'TOTAL_POINTS', label: 'Total Points', getter: (row) => toNumber(row['PTS']) * toNumber(row['GP']) },
      { value: 'AST', label: 'Assists per Game', getter: (row) => toNumber(row['AST']) },
      { value: 'REB', label: 'Rebounds per Game', getter: (row) => toNumber(row['REB']) },
      { value: 'FG%', label: 'Field Goal %', getter: (row) => toNumber(row['FG%']) },
      { value: 'GP', label: 'Games Played (GP)', getter: (row) => toNumber(row['GP']) },
      { value: 'MIN', label: 'Minutes (MIN)', getter: (row) => toNumber(row['MIN']) },
      { value: 'Off_Reb', label: 'Offensive Rebounds (Off_Reb)', getter: (row) => toNumber(row['Off_Reb']) },
      { value: 'Def_Reb', label: 'Defensive Rebounds (Def_Reb)', getter: (row) => toNumber(row['Def_Reb']) },
      { value: 'BLK', label: 'Blocks (BLK)', getter: (row) => toNumber(row['BLK']) },
      { value: 'STL', label: 'Steals (STL)', getter: (row) => toNumber(row['STL']) },
      { value: 'TO', label: 'Turnovers (TO)', getter: (row) => toNumber(row['TO']) },
      { value: '3P%', label: '3P%', getter: (row) => toNumber(row['3P%']) },
      { value: 'FT%', label: 'Free Throw % (FT%)', getter: (row) => toNumber(row['FT%']) },
      { value: 'TS%', label: 'True Shooting % (TS%)', getter: (row) => toNumber(row['TS%']) },
      { value: 'OBPR', label: 'Offensive BPR (OBPR)', getter: (row) => toNumber(row['OBPR']) },
      { value: 'DBPR', label: 'Defensive BPR (DBPR)', getter: (row) => toNumber(row['DBPR']) },
      { value: 'BPR', label: 'Total BPR (BPR)', getter: (row) => toNumber(row['BPR']) },
      { value: 'POSS', label: 'Possessions (POSS)', getter: (row) => toNumber(row['POSS']) },
      { value: 'USG%', label: 'Usage % (USG%)', getter: (row) => toNumber(row['USG%']) },
      { value: 'Box_OBPR', label: 'Box OBPR', getter: (row) => toNumber(row['Box_OBPR']) },
      { value: 'Box_DBPR', label: 'Box DBPR', getter: (row) => toNumber(row['Box_DBPR']) },
      { value: 'Box_BPR', label: 'Box BPR', getter: (row) => toNumber(row['Box_BPR']) },
      { value: 'Team_PRPG', label: 'Team PRPG', getter: (row) => toNumber(row['Team_PRPG']) },
      { value: 'Adj_team_Off_Eff', label: 'Adj team Off Eff', getter: (row) => toNumber(row['Adj_team_Off_Eff']) },
      { value: 'Adj_team_Deff_Eff', label: 'Adj team Def Eff', getter: (row) => toNumber(row['Adj_team_Deff_Eff']) },
      { value: 'Adj_team_Eff_Margn', label: 'Adj team Eff Margin', getter: (row) => toNumber(row['Adj_team_Eff_Margn']) },
      { value: 'Team_Net_Score', label: 'Team Net Score', getter: (row) => toNumber(row['Team_Net_Score']) },
    ],
    tableStats: [
      { key: 'GP', label: 'Games', getter: (row) => toNumber(row['GP']) },
      { key: 'MIN', label: 'Minutes', getter: (row) => toNumber(row['MIN']) },
      { key: 'PTS', label: 'Points per Game', getter: (row) => toNumber(row['PTS']) },
      { key: 'AST', label: 'Assists per Game', getter: (row) => toNumber(row['AST']) },
      { key: 'REB', label: 'Rebounds per Game', getter: (row) => toNumber(row['REB']) },
      { key: 'FG%', label: 'Field Goal %', getter: (row) => toNumber(row['FG%']) },
    ],
    extraHighlightStats: [
      { label: 'Highest Points per Game', statKey: 'PTS' },
      { label: 'Highest Assists per Game', statKey: 'AST' },
      { label: 'Highest Rebounds per Game', statKey: 'REB' },
    ],
  },
  teams: {
    title: 'Compare Teams',
    subtitle: 'Search and select 1–5 teams to compare.',
    datasetKey: 'teams',
    searchPlaceholder: 'Search teams…',
    getEntityId: (row) => row?.['Team_Name']?.toString().trim(),
    buildSuggestion: (row) => {
      const id = row?.['Team_Name']?.toString().trim();
      if (!id) return null;
      const conference = row?.['Conference'] || '—';
      const season = row?.['Season'] || 'N/A';
      return {
        id,
        name: id,
        subtitle: `${conference} · ${season}`,
      };
    },
    statOptions: [
      { value: 'Team_Win%', label: 'Win %', getter: (row) => toNumber(row['Team_Win%']) },
      { value: 'Team_Q1_Wins', label: 'Q1 Wins', getter: (row) => toNumber(row['Team_Q1_Wins']) },
      { value: 'Team_Conf_Wins%', label: 'Conference Win %', getter: (row) => toNumber(row['Team_Conf_Wins%']) },
      { value: 'Team_GP', label: 'Games Played', getter: (row) => toNumber(row['Team_GP']) },
      { value: 'Team_PTS', label: 'Points per Game', getter: (row) => toNumber(row['Team_PTS']) },
      { value: 'Team_Reb', label: 'Rebounds per Game', getter: (row) => toNumber(row['Team_Reb']) },
      { value: 'Team_Off_Reb', label: 'Offensive Rebounds', getter: (row) => toNumber(row['Team_Off_Reb']) },
      { value: 'Team_Def_Reb', label: 'Defensive Rebounds', getter: (row) => toNumber(row['Team_Def_Reb']) },
      { value: 'Team_BLK', label: 'Blocks', getter: (row) => toNumber(row['Team_BLK']) },
      { value: 'Team_STL', label: 'Steals', getter: (row) => toNumber(row['Team_STL']) },
      { value: 'Team_TO', label: 'Turnovers', getter: (row) => toNumber(row['Team_TO']) },
      { value: 'Team_FG%', label: 'Field Goal %', getter: (row) => toNumber(row['Team_FG%']) },
      { value: 'Team_3P%', label: '3P %', getter: (row) => toNumber(row['Team_3P%']) },
      { value: 'Team_FT%', label: 'Free Throw %', getter: (row) => toNumber(row['Team_FT%']) },
      { value: 'Team_Adj_Off_Eff', label: 'Offensive Efficiency', getter: (row) => toNumber(row['Team_Adj_Off_Eff']) },
      { value: 'Team_Adj_Def_Eff', label: 'Defensive Efficiency', getter: (row) => toNumber(row['Team_Adj_Def_Eff']) },
      { value: 'Team_OBPR', label: 'OBPR', getter: (row) => toNumber(row['Team_OBPR']) },
      { value: 'Team_DBPR', label: 'DBPR', getter: (row) => toNumber(row['Team_DBPR']) },
      { value: 'Team_BPR', label: 'BPR', getter: (row) => toNumber(row['Team_BPR']) },
      { value: 'Team_Adj_Tempo', label: 'Adjusted Tempo', getter: (row) => toNumber(row['Team_Adj_Tempo']) },
      { value: 'Team_BARTHAG', label: 'BARTHAG', getter: (row) => toNumber(row['Team_BARTHAG']) },
    ],
    tableStats: [
      { key: 'Team_GP', label: 'Games Played', getter: (row) => toNumber(row['Team_GP']) },
      { key: 'Team_Win%', label: 'Win %', getter: (row) => toNumber(row['Team_Win%']) },
      { key: 'Team_PTS', label: 'Points per Game', getter: (row) => toNumber(row['Team_PTS']) },
      { key: 'Team_Reb', label: 'Rebounds per Game', getter: (row) => toNumber(row['Team_Reb']) },
      { key: 'Team_Adj_Off_Eff', label: 'Offensive Efficiency', getter: (row) => toNumber(row['Team_Adj_Off_Eff']) },
      { key: 'Team_Adj_Def_Eff', label: 'Defensive Efficiency', getter: (row) => toNumber(row['Team_Adj_Def_Eff']) },
    ],
    extraHighlightStats: [
      { label: 'Highest Win %', statKey: 'Team_Win%' },
      { label: 'Highest Points per Game', statKey: 'Team_PTS' },
      { label: 'Best Offensive Efficiency', statKey: 'Team_Adj_Off_Eff' },
      { label: 'Best Rebounds per Game', statKey: 'Team_Reb' },
    ],
  },
};

function average(values: number[]) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) return NaN;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

export function ComparePage({ mode }: ComparePageProps) {
  const navigate = useNavigate();
  const { datasets } = useData();
  const { state, updateComparePlayersState, updateCompareTeamsState } = useAppState();
  const config = CONFIG[mode];
  const data = datasets ? datasets[config.datasetKey] : [];
  const transfers = datasets?.transfers ?? [];

  const persistedState = mode === 'players' ? state.comparePlayersState : state.compareTeamsState;
  const updateState = mode === 'players' ? updateComparePlayersState : updateCompareTeamsState;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntities, setSelectedEntities] = useState<SelectedEntity[]>(
    persistedState?.selectedEntities ?? []
  );
  const [selectedStat, setSelectedStat] = useState(
    persistedState?.selectedStat ?? config.statOptions[0].value
  );
  const [seasonView, setSeasonView] = useState(persistedState?.seasonView ?? 'ALL');
  const [error, setError] = useState<string | null>(null);

  // Load persisted state on mount
  useEffect(() => {
    if (persistedState) {
      setSelectedEntities(persistedState.selectedEntities);
      setSelectedStat(persistedState.selectedStat || config.statOptions[0].value);
      setSeasonView(persistedState.seasonView || 'ALL');
    } else {
      setSelectedEntities([]);
      setSelectedStat(config.statOptions[0].value);
      setSeasonView('ALL');
    }
  }, [mode, persistedState, config.statOptions]);

  const availableSeasons = useMemo(() => {
    if (!data) return [];
    if (mode !== 'players' && mode !== 'teams') return [];
    const seasons = Array.from(
      new Set(
        data
          .map((row) => row?.['Season'])
          .filter(
            (season): season is string | number =>
              season !== undefined && season !== null && season !== '',
          ),
      ),
    )
      .map((season) => season.toString())
      .sort((a, b) => seasonNumber(a) - seasonNumber(b));
    return seasons;
  }, [mode, data]);

  const suggestions = useMemo(() => {
    const unique = new Map<string, Suggestion>();
    data?.forEach((row) => {
      const suggestion = config.buildSuggestion(row);
      if (suggestion && !unique.has(suggestion.id)) {
        unique.set(suggestion.id, suggestion);
      }
    });
    return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [data, config]);

  const filteredSuggestions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return suggestions.slice(0, 8);
    return suggestions
      .filter(
        (suggestion) =>
          suggestion.name.toLowerCase().includes(term) ||
          suggestion.subtitle.toLowerCase().includes(term),
      )
      .slice(0, 8);
  }, [suggestions, searchTerm]);

  const statOptionMap = useMemo(() => {
    const map = new Map(config.statOptions.map((stat) => [stat.value, stat]));
    return map;
  }, [config.statOptions]);

  const derivedEntities = useMemo(() => {
    if (!data) return [];
    const statOption = statOptionMap.get(selectedStat);
    return selectedEntities.map((entity, index) => {
      const rows = data.filter((row) => config.getEntityId(row) === entity.id);
      const filteredRows =
        seasonView === 'ALL'
          ? rows
          : rows.filter((row) => String(row['Season']) === seasonView);
      const representativeRow = filteredRows[0];
      const statValues: Record<string, number> = {};
      config.statOptions.forEach((stat) => {
        const value =
          seasonView === 'ALL'
            ? average(rows.map((row) => stat.getter(row)))
            : representativeRow
            ? stat.getter(representativeRow)
            : NaN;
        statValues[stat.value] = value;
      });
      const tableValues = config.tableStats.map((stat) => ({
        key: stat.key,
        label: stat.label,
        value:
          seasonView === 'ALL'
            ? average(rows.map((row) => stat.getter(row)))
            : representativeRow
            ? stat.getter(representativeRow)
            : NaN,
      }));
      const series =
        rows
          .map((row) => ({
            season: row['Season'] ?? 'N/A',
            seasonNum: seasonNumber(row['Season']),
            value: statOption ? Number(statOption.getter(row).toFixed(2)) : 0,
          }))
          .sort((a, b) => a.seasonNum - b.seasonNum) ?? [];
      return {
        entity,
        rows,
        statValues,
        tableValues,
        series,
        color: COLOR_PALETTE[index % COLOR_PALETTE.length],
      };
    });
  }, [selectedEntities, data, config, statOptionMap, selectedStat, seasonView]);

  const chartData = useMemo(() => {
    if (derivedEntities.length < 1) return [];
    const seasons = Array.from(
      new Set(
        derivedEntities.flatMap((item) => item.series.map((point) => point.season)),
      ),
    ).sort((a, b) => seasonNumber(a) - seasonNumber(b));

    return seasons.map((season) => {
      const entry: Record<string, any> = { season };
      derivedEntities.forEach((item) => {
        const point = item.series.find((p) => p.season === season);
        entry[item.entity.id] = point?.value ?? null;
      });
      return entry;
    });
  }, [derivedEntities]);
  
  const averageStatsForChart = useMemo(() => {
    if (derivedEntities.length === 0) return [];
    return derivedEntities.map((entity) => {
      const values = entity.series
        .map((point) => point.value)
        .filter((val) => Number.isFinite(val));
      const avg = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
      return {
        id: entity.entity.id,
        label: entity.entity.name,
        value: Number(avg.toFixed(2)),
        color: entity.color,
      };
    });
  }, [derivedEntities]);

  const highlightCards = useMemo(() => {
    if (derivedEntities.length < 1) return [];
    const fixedHighlights =
      mode === 'players'
        ? [
            { label: 'Highest Total Points', statKey: 'TOTAL_POINTS', source: 'stat' as const },
            { label: 'Highest Points per Game', statKey: 'PTS', source: 'stat' as const },
            { label: 'Highest Assists per Game', statKey: 'AST', source: 'stat' as const },
            { label: 'Highest Rebounds per Game', statKey: 'REB', source: 'stat' as const },
          ]
        : [
            { label: 'Highest Win %', statKey: 'Team_Win%', source: 'table' as const },
            { label: 'Highest Points per Game', statKey: 'Team_PTS', source: 'table' as const },
            { label: 'Best Offensive Efficiency', statKey: 'Team_Adj_Off_Eff', source: 'table' as const },
            { label: 'Highest Rebounds per Game', statKey: 'Team_Reb', source: 'table' as const },
          ];

    return fixedHighlights.map((highlight) => {
      const leader = findLeader(derivedEntities, highlight.statKey);
      const statOption =
        statOptionMap.get(highlight.statKey) ||
        config.tableStats.find((stat) => stat.key === highlight.statKey);
      if (!leader || !statOption) {
        return { title: highlight.label };
      }
      return {
        title: highlight.label,
        leader: leader.leader.entity.name,
        leaderValue: formatStatValue(
          leader.leader.statValues[highlight.statKey] ??
            leader.leader.tableValues.find((v) => v.key === highlight.statKey)?.value ??
            NaN,
          statOption,
        ),
        runnerUp:
          leader.runnerUp &&
          `${leader.runnerUp.entity.name} (${formatStatValue(
            leader.runnerUp.statValues[highlight.statKey] ??
              leader.runnerUp.tableValues.find((v) => v.key === highlight.statKey)?.value ??
              NaN,
            statOption,
          )})`,
      };
    });
  }, [derivedEntities, mode, config.extraHighlightStats, statOptionMap]);

  const tableRows = useMemo(() => {
    if (derivedEntities.length < 1) return [];
    return config.tableStats.map((stat) => {
      const values = derivedEntities.map((entity) => {
        const rawValue =
          entity.tableValues.find((val) => val.key === stat.key)?.value ??
          entity.statValues[stat.key] ??
          NaN;
        return {
          entityId: entity.entity.id,
          entityName: entity.entity.name,
          value: rawValue,
        };
      });
      const bestValue = Math.max(
        ...values.map((val) => (Number.isNaN(val.value) ? -Infinity : val.value)),
      );
      return {
        stat,
        values,
        bestValue,
      };
    });
  }, [derivedEntities, config.tableStats]);

  const canCompare = derivedEntities.length >= 1;

  const playerTransferEvents = useMemo(() => {
    if (mode !== 'players' || selectedEntities.length === 0) return [];
    const grouped = new Map<
      string,
      { events: Array<{ season: string; from: string; to: string }> }
    >();
    transfers.forEach((row) => {
      const slug = playerSlugFromRow(row);
      const name = getPlayerNameFromRow(row);
      if (!slug || !name) return;
      const fromTeam = row['Team'] || row['From_Team'] || 'Previous Team';
      const toTeam = row['New_Team'] || row['To_Team'] || 'Next Team';
      const season = row['Season'] ? row['Season'].toString() : 'N/A';
      if (!grouped.has(slug)) {
        grouped.set(slug, { events: [] });
      }
      grouped.get(slug)!.events.push({
        season,
        from: fromTeam,
        to: toTeam,
      });
    });
    grouped.forEach((entry) =>
      entry.events.sort((a, b) => seasonNumber(a.season) - seasonNumber(b.season)),
    );
    return selectedEntities.map((entity) => ({
      entity,
      events: grouped.get(entity.id)?.events ?? [],
    }));
  }, [mode, selectedEntities, transfers]);

  const handleAddEntity = (suggestion: Suggestion) => {
    if (selectedEntities.find((entity) => entity.id === suggestion.id)) {
      setError('Already added to comparison.');
      return;
    }
    if (selectedEntities.length >= 5) {
      setError('You can compare up to 5 entities.');
      return;
    }
    const newEntities = [...selectedEntities, suggestion];
    setSelectedEntities(newEntities);
    setSearchTerm('');
    setError(null);
    if (updateState) {
      updateState({ selectedEntities: newEntities });
    }
  };

  const handleRemoveEntity = (id: string) => {
    const newEntities = selectedEntities.filter((entity) => entity.id !== id);
    setSelectedEntities(newEntities);
    if (updateState) {
      updateState({ selectedEntities: newEntities });
    }
  };

  const currentStatOption = statOptionMap.get(selectedStat) ?? config.statOptions[0];

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <header className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-primary">Compare</p>
              <h1 className="text-3xl font-bold text-text-main">{config.title}</h1>
              <p className="text-gray-600 text-sm">{config.subtitle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-4 justify-end">
              <div className="inline-flex rounded-full bg-white border border-cream/60 p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => navigate('/compare/players')}
                  className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                    mode === 'players' ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:text-primary'
                  }`}
                >
                  Players
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/compare/teams')}
                  className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                    mode === 'teams' ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:text-primary'
                  }`}
                >
                  Teams
                </button>
              </div>
              {availableSeasons.length > 0 && (
                <select
                  aria-label="Season view"
                  value={seasonView}
                  onChange={(e) => {
                    setSeasonView(e.target.value);
                    if (updateState) {
                      updateState({ seasonView: e.target.value });
                    }
                  }}
                  className="px-4 pr-8 py-2 rounded-full border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="ALL">All Season AVG</option>
                  {availableSeasons.map((season) => (
                    <option key={season} value={season}>
                      {season}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </header>

        <section>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={config.searchPlaceholder}
            className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-white"
          />
          {searchTerm && (
            <div className="mt-2 bg-white border border-gray-200 rounded-xl shadow max-h-60 overflow-y-auto">
              {filteredSuggestions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500">No matches found.</div>
              ) : (
                filteredSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    onClick={() => handleAddEntity(suggestion)}
                    className="w-full text-left px-4 py-2 hover:bg-cream/40 text-sm"
                  >
                    <div className="font-semibold text-text-main">{suggestion.name}</div>
                    <div className="text-xs text-gray-500">{suggestion.subtitle}</div>
                  </button>
                ))
              )}
            </div>
          )}
        </section>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <section className="flex flex-wrap gap-2">
          {selectedEntities.length === 0 && (
            <p className="text-sm text-gray-600">Select 1–5 entries to start comparing.</p>
          )}
          {selectedEntities.map((entity) => (
            <div
              key={entity.id}
              className="flex items-center gap-2 bg-white border border-cream/70 rounded-full px-4 py-2 text-sm shadow-sm"
            >
              <span className="font-semibold text-text-main">{entity.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveEntity(entity.id)}
                className="text-gray-500 hover:text-primary"
              >
                ×
              </button>
            </div>
          ))}
        </section>

        {canCompare && highlightCards.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {highlightCards.map((card, index) => (
              <div key={`${card.title}-${index}`} className="bg-white rounded-2xl shadow border border-cream/60 p-4">
                <p className="text-xs uppercase font-semibold text-gray-500">{card.title}</p>
                <p className="text-lg font-bold text-text-main mt-2">{card.leader}</p>
                <p className="text-sm text-primary font-semibold">{card.leaderValue}</p>
                {card.runnerUp && <p className="text-xs text-gray-500 mt-1">{card.runnerUp}</p>}
              </div>
            ))}
          </section>
        )}

        {!canCompare && (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
            Select at least one {mode === 'players' ? 'player' : 'team'} to compare.
          </div>
        )}

        {canCompare && (
          <>
            <section className="bg-white rounded-2xl shadow border border-cream/60 p-4">
              <div className="w-full overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Stat
                      </th>
                      {derivedEntities.map((entity) => (
                        <th key={entity.entity.id} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                          {mode === 'teams' ? (
                            <TeamLink name={entity.entity.name} className="text-xs font-semibold uppercase tracking-wide" />
                          ) : (
                            <PlayerLink name={entity.entity.name} slug={entity.entity.id} className="text-xs font-semibold uppercase tracking-wide" />
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row) => (
                      <tr key={row.stat.key} className="border-t border-gray-100">
                        <td className="px-4 py-3 font-semibold text-text-main">{row.stat.label}</td>
                        {row.values.map((value) => (
                          <td
                            key={`${row.stat.key}-${value.entityId}`}
                          className={`px-4 py-3 ${
                            !Number.isNaN(value.value) && value.value === row.bestValue
                              ? 'bg-primary/5 font-semibold text-text-main'
                              : 'text-gray-700'
                          }`}
                          >
                            {formatStatValue(value.value, row.stat)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow border border-cream/60 p-4 space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-text-main">{currentStatOption.label} Over Seasons</h2>
                  <p className="text-sm text-gray-500">
                    Tracking {currentStatOption.label.toLowerCase()} across all seasons for selected{' '}
                    {mode === 'players' ? 'players' : 'teams'}.
                  </p>
                </div>
                <div className="w-full sm:w-64">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Stat to compare</label>
                  <select
                    value={selectedStat}
                    onChange={(e) => {
                      setSelectedStat(e.target.value);
                      if (updateState) {
                        updateState({ selectedStat: e.target.value });
                      }
                    }}
                    className="w-full px-4 pr-10 py-2 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    {config.statOptions.map((stat) => (
                      <option key={stat.value} value={stat.value}>
                        {stat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {chartData.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  Not enough data to plot this stat across seasons.
                </div>
              ) : (
                <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="season" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {derivedEntities.map((entity) => (
                        <Line
                          key={entity.entity.id}
                          type="monotone"
                          dataKey={entity.entity.id}
                          name={entity.entity.name}
                          stroke={entity.color}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 4 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {averageStatsForChart.length > 0 && (
                <div className="w-full pt-4 border-t border-cream/60">
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-text-main">
                      Average {currentStatOption.label}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Overall average across all seasons for each{' '}
                      {mode === 'players' ? 'player' : 'team'}.
                    </p>
                  </div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={averageStatsForChart}
                        layout="vertical"
                        margin={{ top: 5, right: 24, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid horizontal stroke="#f0eaea" />
                        <XAxis
                          type="number"
                          domain={[0, 'auto']}
                          stroke="#666"
                          tick={{ fontSize: 12, fill: '#666' }}
                        />
                        <YAxis
                          type="category"
                          dataKey="label"
                          width={180}
                          stroke="#666"
                          tick={{ fontSize: 12, fill: '#444' }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{ borderRadius: 12, borderColor: '#f1e5e5' }}
                          formatter={(value) => value?.toString()}
                        />
                        <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={18}>
                          {averageStatsForChart.map((entry) => (
                            <Cell key={entry.id} fill={entry.color} stroke="none" />
                          ))}
                          <LabelList dataKey="value" position="right" fill="#333" fontSize={11} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </section>
          </>
        )}

        {mode === 'players' && selectedEntities.length > 0 && (
            <section className="bg-white rounded-2xl shadow border border-cream/60 p-4 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-text-main">Transfer Timeline</h2>
              <p className="text-sm text-gray-500">Seasons when selected players transferred between teams.</p>
            </div>
            <div className="space-y-4">
              {selectedEntities.map((entity) => {
                const events = playerTransferEvents.find((event) => event.entity.id === entity.id)?.events ?? [];
                return (
                  <div key={entity.id} className="border border-cream/60 rounded-2xl p-4">
                    <p className="font-semibold text-text-main">{entity.name}</p>
                    {events.length === 0 ? (
                      <p className="text-sm text-gray-500 mt-2">No transfers recorded.</p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {events.map((event, index) => (
                          <div key={`${event.season}-${event.from}-${index}`} className="flex items-center gap-3 text-sm text-gray-700">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-primary">{event.season}</span>
                              <div className="h-px w-6 bg-gray-300" />
                            </div>
                            <p>
                              {event.from} → {event.to}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function toNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function seasonNumber(value: unknown): number {
  if (value == null) return 0;
  const str = String(value);
  const match = str.match(/\d{4}/);
  if (match) return Number(match[0]);
  return Number(str) || 0;
}

function formatStatValue(value: number, stat: { format?: (value: number) => string }): string {
  if (Number.isNaN(value)) return '–';
  if (stat.format) return stat.format(value);
  if (Math.abs(value) >= 1000) {
    return NUMBER_FORMAT.format(Math.round(value));
  }
  return ONE_DECIMAL_FORMAT.format(value);
}

function findLeader(
  entities: Array<{
    entity: SelectedEntity;
    statValues: Record<string, number>;
    tableValues: Array<{ key: string; value: number }>;
  }>,
  statKey: string,
) {
  const getValue = (entry: typeof entities[number]) => {
    const statValue = entry.statValues[statKey];
    if (!Number.isNaN(statValue)) return statValue;
    const tableValue = entry.tableValues.find((val) => val.key === statKey)?.value;
    return Number.isNaN(tableValue) ? -Infinity : tableValue ?? -Infinity;
  };

  const sorted = [...entities].sort((a, b) => getValue(b) - getValue(a));
  if (!sorted.length) return null;
  if (getValue(sorted[0]) === -Infinity) return null;
  return {
    leader: sorted[0],
    runnerUp: sorted[1],
  };
}

