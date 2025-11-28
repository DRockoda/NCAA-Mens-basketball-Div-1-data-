import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Filters } from '../utils/filters';

interface TableState {
  searchTags: string[];
  filters: Filters;
  visibleColumns: Set<string>;
  columnOrder: string[];
  currentPage: number;
  pageSize: number;
  hasInitializedColumns?: boolean;
}

interface CompareState {
  selectedEntities: Array<{ id: string; name: string; subtitle: string }>;
  selectedStat: string;
  seasonView: string;
}

interface AppState {
  playersTableState: TableState | null;
  teamsTableState: TableState | null;
  transferTableState: TableState | null;
  comparePlayersState: CompareState | null;
  compareTeamsState: CompareState | null;
  dashboardSeason: string | null;
}

const STORAGE_KEY = 'ncaa-app-state';

function loadFromStorage(): AppState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convert Set objects back from arrays
      if (parsed.playersTableState?.visibleColumns) {
        parsed.playersTableState.visibleColumns = new Set(parsed.playersTableState.visibleColumns);
        parsed.playersTableState.hasInitializedColumns = parsed.playersTableState.hasInitializedColumns ?? false;
      }
      if (parsed.teamsTableState?.visibleColumns) {
        parsed.teamsTableState.visibleColumns = new Set(parsed.teamsTableState.visibleColumns);
        parsed.teamsTableState.hasInitializedColumns = parsed.teamsTableState.hasInitializedColumns ?? false;
      }
      if (parsed.transferTableState?.visibleColumns) {
        parsed.transferTableState.visibleColumns = new Set(parsed.transferTableState.visibleColumns);
        parsed.transferTableState.hasInitializedColumns = parsed.transferTableState.hasInitializedColumns ?? false;
      }
      // Ensure transferTableState exists (for backward compatibility with old localStorage)
      if (!parsed.transferTableState) {
        parsed.transferTableState = null;
      }
      return parsed;
    }
  } catch (err) {
    console.error('Failed to load state from localStorage:', err);
  }
  return {
    playersTableState: null,
    teamsTableState: null,
    transferTableState: null,
    comparePlayersState: null,
    compareTeamsState: null,
    dashboardSeason: null,
  };
}

function saveToStorage(state: AppState): void {
  try {
    const toStore = {
      ...state,
      playersTableState: state.playersTableState
        ? {
            ...state.playersTableState,
            visibleColumns: Array.from(state.playersTableState.visibleColumns),
            hasInitializedColumns: state.playersTableState.hasInitializedColumns ?? false,
          }
        : null,
      teamsTableState: state.teamsTableState
        ? {
            ...state.teamsTableState,
            visibleColumns: Array.from(state.teamsTableState.visibleColumns),
            hasInitializedColumns: state.teamsTableState.hasInitializedColumns ?? false,
          }
        : null,
      transferTableState: state.transferTableState
        ? {
            ...state.transferTableState,
            visibleColumns: Array.from(state.transferTableState.visibleColumns),
            hasInitializedColumns: state.transferTableState.hasInitializedColumns ?? false,
          }
        : null,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);
  }
}

interface AppStateContextType {
  state: AppState;
  updatePlayersTableState: (updates: Partial<TableState>) => void;
  updateTeamsTableState: (updates: Partial<TableState>) => void;
  updateTransferTableState: (updates: Partial<TableState>) => void;
  updateComparePlayersState: (updates: Partial<CompareState>) => void;
  updateCompareTeamsState: (updates: Partial<CompareState>) => void;
  updateDashboardSeason: (season: string) => void;
  clearState: () => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadFromStorage());

  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  const updatePlayersTableState = useCallback((updates: Partial<TableState>) => {
    setState((prev) => ({
      ...prev,
      playersTableState: {
        ...(prev.playersTableState || {
          searchTags: [],
          filters: {},
          visibleColumns: new Set(),
          columnOrder: [],
          currentPage: 1,
          pageSize: 50,
          hasInitializedColumns: false,
        }),
        ...updates,
      },
    }));
  }, []);

  const updateTeamsTableState = useCallback((updates: Partial<TableState>) => {
    setState((prev) => ({
      ...prev,
      teamsTableState: {
        ...(prev.teamsTableState || {
          searchTags: [],
          filters: {},
          visibleColumns: new Set(),
          columnOrder: [],
          currentPage: 1,
          pageSize: 50,
          hasInitializedColumns: false,
        }),
        ...updates,
      },
    }));
  }, []);

  const updateTransferTableState = useCallback((updates: Partial<TableState>) => {
    setState((prev) => ({
      ...prev,
      transferTableState: {
        ...(prev.transferTableState || {
          searchTags: [],
          filters: {},
          visibleColumns: new Set(),
          columnOrder: [],
          currentPage: 1,
          pageSize: 50,
          hasInitializedColumns: false,
        }),
        ...updates,
      },
    }));
  }, []);

  const updateComparePlayersState = useCallback((updates: Partial<CompareState>) => {
    setState((prev) => ({
      ...prev,
      comparePlayersState: {
        ...(prev.comparePlayersState || {
          selectedEntities: [],
          selectedStat: '',
          seasonView: 'ALL',
        }),
        ...updates,
      },
    }));
  }, []);

  const updateCompareTeamsState = useCallback((updates: Partial<CompareState>) => {
    setState((prev) => ({
      ...prev,
      compareTeamsState: {
        ...(prev.compareTeamsState || {
          selectedEntities: [],
          selectedStat: '',
          seasonView: 'ALL',
        }),
        ...updates,
      },
    }));
  }, []);

  const updateDashboardSeason = useCallback((season: string) => {
    setState((prev) => ({
      ...prev,
      dashboardSeason: season,
    }));
  }, []);

  const clearState = useCallback(() => {
    setState({
      playersTableState: null,
      teamsTableState: null,
      transferTableState: null,
      comparePlayersState: null,
      compareTeamsState: null,
      dashboardSeason: null,
    });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AppStateContext.Provider
      value={{
        state,
        updatePlayersTableState,
        updateTeamsTableState,
        updateTransferTableState,
        updateComparePlayersState,
        updateCompareTeamsState,
        updateDashboardSeason,
        clearState,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}

