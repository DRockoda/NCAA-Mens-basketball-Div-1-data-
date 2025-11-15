import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { Header } from './components/Header';
import { Home } from './components/Home';
import { DataExplorer } from './components/DataExplorer';

function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-cream">
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/teams" element={<DataExplorer mode="teams" />} />
            <Route path="/players" element={<DataExplorer mode="players" />} />
            <Route path="/transfers" element={<DataExplorer mode="transfers" />} />
          </Routes>
        </div>
      </BrowserRouter>
    </DataProvider>
  );
}

export default App;
