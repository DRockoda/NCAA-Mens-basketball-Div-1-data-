import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { loadAllDatasets, type Datasets } from '../utils/loadData';

interface DataContextType {
  datasets: Datasets | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [datasets, setDatasets] = useState<Datasets | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await loadAllDatasets();
      setDatasets(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      console.error('Error loading data:', err);
      // Don't block the app - set empty datasets so UI can still render
      setDatasets({ teams: [], players: [], transfers: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <DataContext.Provider value={{ datasets, loading, error, refresh: loadData }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

