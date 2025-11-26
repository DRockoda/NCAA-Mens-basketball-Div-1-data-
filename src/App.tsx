import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { Home } from './components/Home';
import { DataExplorer } from './components/DataExplorer';
import { SidebarLayout } from './components/SidebarLayout';
import { Glossary } from './components/Glossary';

function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<SidebarLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Home />} />
            <Route path="/teams" element={<DataExplorer mode="teams" />} />
            <Route path="/players" element={<DataExplorer mode="players" />} />
            <Route path="/transfers" element={<DataExplorer mode="transfers" />} />
            <Route path="/glossary" element={<Glossary />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}

export default App;
