
export const portfolioItems = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    shares: 10,
    price: 175.3,
    change: 1.25,
    value: 1753.0,
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    shares: 5,
    price: 2850.75,
    change: -10.45,
    value: 14253.75,
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    shares: 8,
    price: 910.0,
    change: 22.5,
    value: 7280.0,
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com, Inc.',
    shares: 3,
    price: 3320.0,
    change: -5.1,
    value: 9960.0,
  },
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    shares: 0.5,
    price: 45000.0,
    change: 1500.0,
    value: 22500.0,
  },
];

export const marketTrendsData = [
  { date: 'Jan', SP500: 4700, Nasdaq: 15800 },
  { date: 'Feb', SP500: 4600, Nasdaq: 15500 },
  { date: 'Mar', SP500: 4800, Nasdaq: 16000 },
  { date: 'Apr', SP500: 4750, Nasdaq: 15900 },
  { date: 'May', SP500: 4900, Nasdaq: 16400 },
  { date: 'Jun', SP500: 5050, Nasdaq: 16800 },
];

export const budgets = [
  {
    id: '1',
    name: 'Groceries',
    spent: 350,
    limit: 500,
    category: 'food',
  },
  {
    id: '2',
    name: 'Transportation',
    spent: 120,
    limit: 200,
    category: 'transport',
  },
  {
    id: '3',
    name: 'Entertainment',
    spent: 250,
    limit: 300,
    category: 'fun',
  },
  {
    id: '4',
    name: 'Utilities',
    spent: 180,
    limit: 180,
    category: 'bills',
  },
  {
    id: '5',
    name: 'Shopping',
    spent: 450,
    limit: 400,
    category: 'shopping',
  },
];

export const monthlyExpenses = [
  { name: 'Groceries', value: 400, fill: 'hsl(var(--chart-1))' },
  { name: 'Utilities', value: 150, fill: 'hsl(var(--destructive))' },
  { name: 'Transport', value: 100, fill: 'hsl(var(--chart-1))' },
  { name: 'Entertainment', value: 250, fill: 'hsl(var(--destructive))' },
  { name: 'Other', value: 200, fill: 'hsl(var(--chart-1))' },
];

export const yearlyExpenses = [
    { month: 'Jan', expenses: 2200 },
    { month: 'Feb', expenses: 2100 },
    { month: 'Mar', expenses: 2500 },
    { month: 'Apr', expenses: 2300 },
    { month: 'May', expenses: 2600 },
    { month: 'Jun', expenses: 2700 },
    { month: 'Jul', expenses: 2800 },
    { month: 'Aug', expenses: 2650 },
    { month: 'Sep', expenses: 2900 },
    { month: 'Oct', expenses: 3100 },
    { month: 'Nov', expenses: 3200 },
    { month: 'Dec', expenses: 3500 },
];
