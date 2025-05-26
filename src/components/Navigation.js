import React from 'react';
import { Box, Tabs, Tab } from '@mui/material';

const Navigation = ({ currentPage, onPageChange }) => {
  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      <Tabs 
        value={currentPage} 
        onChange={(_, newValue) => onPageChange(newValue)}
        centered
      >
        <Tab label="Stock Price" value="stock" />
        <Tab label="Correlation Heatmap" value="heatmap" />
      </Tabs>
    </Box>
  );
};

export default Navigation;
