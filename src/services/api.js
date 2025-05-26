// Using mock data for development until the API is fixed
const generateMockPrice = (base, variance) => {
  return base + (Math.random() - 0.5) * variance;
};

const generateMockData = (minutes, basePrice) => {
  const now = new Date();
  const data = [];
  for (let i = 0; i < minutes; i++) {
    data.push({
      price: generateMockPrice(basePrice, basePrice * 0.1),
      lastUpdatedAt: new Date(now - i * 60000).toISOString()
    });
  }
  return data;
};

const MOCK_BASE_PRICES = {
  'META': 300,
  'MSFT': 350,
  'NVDA': 600,
  'PYPL': 70,
  '2330TW': 100,
  'TSLA': 200,
  'V': 250
};

export const AVAILABLE_STOCKS = {
  "Meta Platforms, Inc.": "META",
  "Microsoft Corporation": "MSFT",
  "Nvidia Corporation": "NVDA",
  "PayPal Holdings, Inc.": "PYPL",
  "TSMC": "2330TW",
  "Tesla, Inc.": "TSLA",
  "Visa Inc.": "V"
};

export async function fetchStockData(ticker, minutes) {
  try {
    console.log(`Generating mock data for ${ticker}, minutes: ${minutes}`);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!MOCK_BASE_PRICES[ticker]) {
      throw new Error(`Invalid stock ticker: ${ticker}`);
    }

    const mockData = generateMockData(minutes, MOCK_BASE_PRICES[ticker]);
    return mockData;
  } catch (error) {
    console.error(`Error generating mock data for ${ticker}:`, error);
    throw error;
  }
}

export function calculateStatistics(prices) {
  if (!prices || prices.length === 0) return { mean: 0, stdDev: 0 };

  const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  
  const variance = prices.reduce((sum, price) => {
    const diff = price - mean;
    return sum + diff * diff;
  }, 0) / (prices.length - 1);

  return {
    mean,
    stdDev: Math.sqrt(variance)
  };
}

export function calculateCorrelation(prices1, prices2) {
  if (prices1.length !== prices2.length || prices1.length < 2) return 0;

  const stats1 = calculateStatistics(prices1);
  const stats2 = calculateStatistics(prices2);

  const covariance = prices1.reduce((sum, price1, i) => {
    return sum + (price1 - stats1.mean) * (prices2[i] - stats2.mean);
  }, 0) / (prices1.length - 1);

  return covariance / (stats1.stdDev * stats2.stdDev);
}
