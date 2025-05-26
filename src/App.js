import './App.css';
import { useState } from 'react';
import StockPage from './components/StockPage';
import HeatmapPage from './components/HeatmapPage';
import Navigation from './components/Navigation';

function App() {
  const [currentPage, setCurrentPage] = useState('stock');

  return (
    <div className="App">
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
      {currentPage === 'stock' ? <StockPage /> : <HeatmapPage />}
    </div>
  );
}

export default App;
