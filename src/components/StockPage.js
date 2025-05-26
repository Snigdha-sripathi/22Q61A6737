import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Slider, 
  Card, 
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { fetchStockData, AVAILABLE_STOCKS, calculateStatistics } from '../services/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const StockPage = () => {
  const [minutes, setMinutes] = useState(50);
  const [selectedStock, setSelectedStock] = useState('NVDA');
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ mean: 0, stdDev: 0 });
  const loadStockData = useCallback(async () => {
    if (!selectedStock || !minutes) return;
    
    setLoading(true);
    setError(null);
    try {
      console.log(`Loading data for ${selectedStock} over ${minutes} minutes`);
      const data = await fetchStockData(selectedStock, minutes);
      
      if (!data || data.length === 0) {
        throw new Error('No data received from the server');
      }
      
      setStockData(data);
      
      // Calculate statistics
      const prices = data.map(item => item.price);
      const newStats = calculateStatistics(prices);
      console.log(`Calculated statistics for ${selectedStock}:`, newStats);
      setStats(newStats);
    } catch (err) {
      console.error('Error in loadStockData:', err);
      setError(err.message || 'Failed to fetch stock data');
      setStockData([]);
      setStats({ mean: 0, stdDev: 0 });
    } finally {
      setLoading(false);
    }
  }, [selectedStock, minutes]);

  useEffect(() => {
    loadStockData();
  }, [loadStockData]);

  const chartData = {
    labels: stockData.map(item => new Date(item.lastUpdatedAt).toLocaleTimeString()),
    datasets: [
      {
        label: 'Stock Price',
        data: stockData.map(item => item.price),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        pointRadius: 5,
        pointHoverRadius: 8,
      },
      {
        label: 'Average Price',
        data: stockData.map(() => stats.mean),
        borderColor: 'rgb(255, 99, 132)',
        borderDash: [5, 5],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `${Object.keys(AVAILABLE_STOCKS).find(key => AVAILABLE_STOCKS[key] === selectedStock)} Stock Price`,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const datasetLabel = context.dataset.label;
            const value = context.parsed.y;
            if (datasetLabel === 'Stock Price') {
              return [
                `Price: $${value.toFixed(2)}`,
                `Average: $${stats.mean.toFixed(2)}`,
                `Std Dev: $${stats.stdDev.toFixed(2)}`
              ];
            }
            return `${datasetLabel}: $${value.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Price ($)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Time',
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };
  return (
    <Box sx={{ padding: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Card elevation={3} sx={{ padding: 3 }}>
        <Typography variant="h4" gutterBottom>
          Stock Price Dashboard
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Stock</InputLabel>
            <Select
              value={selectedStock}
              label="Stock"
              onChange={(e) => setSelectedStock(e.target.value)}
            >
              {Object.entries(AVAILABLE_STOCKS).map(([name, symbol]) => (
                <MenuItem key={symbol} value={symbol}>
                  {name} ({symbol})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ flexGrow: 1, minWidth: 200 }}>
            <Typography gutterBottom>Time Range (minutes)</Typography>
            <Slider
              value={minutes}
              onChange={(_, newValue) => setMinutes(newValue)}
              min={10}
              max={100}
              valueLabelDisplay="auto"
            />
          </Box>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            Error: {error}
          </Typography>
        )}

        {!loading && !error && stockData.length > 0 && (
          <>
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>Statistics</Typography>
              <Box sx={{ display: 'flex', gap: 4 }}>
                <Typography>
                  Average Price: ${stats.mean.toFixed(2)}
                </Typography>
                <Typography>
                  Standard Deviation: ${stats.stdDev.toFixed(2)}
                </Typography>
                <Typography>
                  Data Points: {stockData.length}
                </Typography>
              </Box>
            </Paper>
            
            <Box sx={{ height: 400 }}>
              <Line data={chartData} options={chartOptions} />
            </Box>
          </>
        )}
      </Card>
    </Box>
  );
};

export default StockPage;
