import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { AppStateProvider } from './context/AppStateContext';
import { Home } from './components/Home';
import { DataExplorer } from './components/DataExplorer';
import { SidebarLayout } from './components/SidebarLayout';
import { Glossary } from './components/Glossary';
import { ComparePage } from './components/ComparePage';
import { TeamPage } from './components/TeamPage';
import { PlayerProfilePage } from './components/PlayerProfilePage';

function App() {
  return (
    <AppStateProvider>
      <DataProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<SidebarLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Home />} />
              <Route path="/teams" element={<DataExplorer mode="teams" />} />
              <Route path="/teams/:teamId" element={<TeamPage />} />
              <Route path="/players" element={<DataExplorer mode="players" />} />
              <Route path="/players/:playerId" element={<PlayerProfilePage />} />
              <Route path="/transfers" element={<DataExplorer mode="transfers" />} />
              <Route path="/compare" element={<Navigate to="/compare/players" replace />} />
              <Route path="/compare/players" element={<ComparePage mode="players" />} />
              <Route path="/compare/teams" element={<ComparePage mode="teams" />} />
              <Route path="/glossary" element={<Glossary />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </AppStateProvider>
  );
}

export default App;
