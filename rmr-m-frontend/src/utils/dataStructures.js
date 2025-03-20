// Données simulées pour le développement UI
export const initialDefiStrategyData = {
    owner: '0x1234...5678',
    totalDeployed: 250000,
    totalEarned: 12500,
    currentAllocation: {
      pancakeSwapPercentage: 3000,
      venusPercentage: 3000,
      alpacaPercentage: 3000,
      liquidityReservePercentage: 1000
    },
    currentYields: {
      pancakeSwapYield: 1500,
      venusYield: 800,
      alpacaYield: 1200
    },
    lastRebalanceTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  };
  
  export const initialLpFarmingData = {
    owner: '0x1234...5678',
    totalDeployed: 320000,
    liquidityReserve: 32000,
    investmentPeriods: [30, 90, 180],
    periodToAPR: {
      30: 800,
      90: 1200,
      180: 1500
    },
    totalUsers: 124,
    activeInvestments: 156,
    totalInvested: 352000,
    contractBalance: 64000
  };
  
  export const initialPerformanceHistory = [
    { month: 'Jan', apy: 10.2, tvl: 125000 },
    { month: 'Feb', apy: 11.5, tvl: 185000 },
    { month: 'Mar', apy: 12.3, tvl: 250000 },
    { month: 'Apr', apy: 10.8, tvl: 280000 },
    { month: 'May', apy: 11.2, tvl: 320000 },
    { month: 'Jun', apy: 13.5, tvl: 375000 },
  ];
  
  export const initialUserInvestments = [
    { id: 1, user: '0xabcd...1234', amount: 5000, period: 30, startTime: '2024-02-15', endTime: '2024-03-15', active: false },
    { id: 2, user: '0xefgh...5678', amount: 10000, period: 90, startTime: '2024-01-10', endTime: '2024-04-10', active: true },
    { id: 3, user: '0xijkl...9012', amount: 15000, period: 180, startTime: '2023-12-01', endTime: '2024-05-30', active: true },
    { id: 4, user: '0xmnop...3456', amount: 8000, period: 30, startTime: '2024-02-20', endTime: '2024-03-20', active: false },
    { id: 5, user: '0xqrst...7890', amount: 12000, period: 90, startTime: '2024-01-15', endTime: '2024-04-15', active: true }
  ];