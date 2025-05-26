import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CircularProgress,
  Slider,
  Paper,
  Tooltip
} from '@mui/material';
import { fetchStockData, AVAILABLE_STOCKS, calculateCorrelation, calculateStatistics } from '../services/api';

const HEATMAP_COLORS = {
  high: '#ff0000',   // Strong positive correlation (red)
  mid: '#ffffff',    // No correlation (white)
  low: '#0000ff',    // Strong negative correlation (blue)
};

const interpolateColor = (color1, color2, factor) => {
  const r1 = parseInt(color1.substring(1, 3), 16);
  const g1 = parseInt(color1.substring(3, 5), 16);
  const b1 = parseInt(color1.substring(5, 7), 16);
  
  const r2 = parseInt(color2.substring(1, 3), 16);
  const g2 = parseInt(color2.substring(3, 5), 16);
  const b2 = parseInt(color2.substring(5, 7), 16);
  
  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

const getCorrelationColor = (correlation) => {
  if (correlation >= 0) {
    return interpolateColor(HEATMAP_COLORS.mid, HEATMAP_COLORS.high, correlation);
  }
  return interpolateColor(HEATMAP_COLORS.mid, HEATMAP_COLORS.low, -correlation);
};

const HeatmapPage = () => {
  const [minutes, setMinutes] = useState(50);
  const [stocksData, setStocksData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [correlationMatrix, setCorrelationMatrix] = useState([]);
  const [stockStats, setStockStats] = useState({});

  const fetchAllStocksData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const newStocksData = {};
    const errors = [];

    try {
      await Promise.all(
        Object.values(AVAILABLE_STOCKS).map(async (symbol) => {
          try {
            const data = await fetchStockData(symbol, minutes);
            newStocksData[symbol] = data;
          } catch (err) {
            errors.push(`${symbol}: ${err.message}`);
          }
        })
      );

      if (errors.length > 0) {
        setError(`Some stocks failed to load: ${errors.join(', ')}`);
      }

      setStocksData(newStocksData);

      // Calculate statistics for each stock
      const stats = {};
      Object.entries(newStocksData).forEach(([symbol, data]) => {
        const prices = data.map(item => item.price);
        stats[symbol] = calculateStatistics(prices);
      });
      setStockStats(stats);

      // Calculate correlation matrix
      const symbols = Object.values(AVAILABLE_STOCKS);
      const matrix = symbols.map(symbol1 => 
        symbols.map(symbol2 => {
          const prices1 = newStocksData[symbol1].map(d => d.price);
          const prices2 = newStocksData[symbol2].map(d => d.price);
          return calculateCorrelation(prices1, prices2);
        })
      );
      setCorrelationMatrix(matrix);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [minutes]);

  useEffect(() => {
    fetchAllStocksData();
  }, [fetchAllStocksData]);

  const renderHeatmapCell = (rowIndex, colIndex, value) => {
    const symbol1 = Object.values(AVAILABLE_STOCKS)[rowIndex];
    const symbol2 = Object.values(AVAILABLE_STOCKS)[colIndex];
    const stats1 = stockStats[symbol1];
    const stats2 = stockStats[symbol2];

    return (
      <Tooltip
        key={`${rowIndex}-${colIndex}`}
        title={
          <Box>
            <Typography variant="body2" gutterBottom>
              Correlation: {value.toFixed(3)}
            </Typography>
            <Typography variant="body2">
              {symbol1}:<br />
              Avg: ${stats1?.mean.toFixed(2)}<br />
              StdDev: ${stats1?.stdDev.toFixed(2)}
            </Typography>
            <Typography variant="body2">
              {symbol2}:<br />
              Avg: ${stats2?.mean.toFixed(2)}<br />
              StdDev: ${stats2?.stdDev.toFixed(2)}
            </Typography>
          </Box>
        }
      >
        <Box
          sx={{
            width: 60,
            height: 60,
            backgroundColor: getCorrelationColor(value),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(0,0,0,0.1)',
            cursor: 'pointer',
            '&:hover': {
              opacity: 0.8,
            },
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: Math.abs(value) > 0.5 ? '#fff' : '#000',
              fontWeight: 'bold',
            }}
          >
            {value.toFixed(2)}
          </Typography>
        </Box>
      </Tooltip>
    );
  };

  return (
    <Box sx={{ padding: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Card elevation={3} sx={{ padding: 3 }}>
        <Typography variant="h4" gutterBottom>
          Stock Correlation Heatmap
        </Typography>

        <Box sx={{ mb: 4 }}>
          <Typography gutterBottom>Time Range (minutes)</Typography>
          <Slider
            value={minutes}
            onChange={(_, newValue) => setMinutes(newValue)}
            min={10}
            max={100}
            valueLabelDisplay="auto"
          />
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

        {!loading && !error && correlationMatrix.length > 0 && (
          <>
            <Paper elevation={2} sx={{ p: 2, mb: 3, overflowX: 'auto' }}>
              <Box sx={{ display: 'flex' }}>
                {/* Empty corner cell */}
                <Box sx={{ width: 100 }} />
                
                {/* Column headers */}
                {Object.entries(AVAILABLE_STOCKS).map(([name, symbol]) => (
                  <Box
                    key={symbol}
                    sx={{
                      width: 60,
                      textAlign: 'center',
                      transform: 'rotate(-45deg)',
                      transformOrigin: 'left bottom',
                      marginRight: 4,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Tooltip title={name}>
                      <Typography variant="body2">{symbol}</Typography>
                    </Tooltip>
                  </Box>
                ))}
              </Box>

              {/* Heatmap rows */}
              {correlationMatrix.map((row, rowIndex) => (
                <Box key={rowIndex} sx={{ display: 'flex', alignItems: 'center' }}>
                  {/* Row header */}
                  <Box sx={{ width: 100, marginRight: 1 }}>
                    <Tooltip title={Object.keys(AVAILABLE_STOCKS)[rowIndex]}>
                      <Typography variant="body2">
                        {Object.values(AVAILABLE_STOCKS)[rowIndex]}
                      </Typography>
                    </Tooltip>
                  </Box>
                  
                  {/* Row cells */}
                  {row.map((value, colIndex) => renderHeatmapCell(rowIndex, colIndex, value))}
                </Box>
              ))}
            </Paper>

            {/* Color legend */}
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Legend</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: '100%',
                    height: 20,
                    background: `linear-gradient(to right, ${HEATMAP_COLORS.low}, ${HEATMAP_COLORS.mid}, ${HEATMAP_COLORS.high})`,
                  }}
                />
                <Typography sx={{ minWidth: 50 }}>-1</Typography>
                <Typography sx={{ minWidth: 50 }}>0</Typography>
                <Typography sx={{ minWidth: 50 }}>+1</Typography>
              </Box>
            </Paper>
          </>
        )}
      </Card>
    </Box>
  );
};

export default HeatmapPage;
