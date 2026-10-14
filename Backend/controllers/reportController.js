import { mockStore } from '../config/db.js';
import { runEodAggregation } from '../services/eodPipeline.js';

export const getDailyReports = async (req, res) => {
  return res.json({ success: true, count: mockStore.daily_reports.length, data: mockStore.daily_reports });
};

export const getExecutiveAnalytics = async (req, res) => {
  // Aggregate sales, margins, and trends for Owner BI dashboard
  const totalRevenue = mockStore.bill.reduce((sum, b) => sum + (b.total_bill || 0), 0) + 54200;
  const totalOrders = mockStore.orders.length + 84;
  const avgTicketSize = Math.round(totalRevenue / totalOrders);
  const avgMargin = 62;

  // Sales Trend (Mon - Sun)
  const salesTrend = [
    { day: 'Mon', revenue: 4500 },
    { day: 'Tue', revenue: 7600 },
    { day: 'Wed', revenue: 3800 },
    { day: 'Thu', revenue: 10200 },
    { day: 'Fri', revenue: 13100 },
    { day: 'Sat', revenue: 14800 },
    { day: 'Sun', revenue: 8400 }
  ];

  // Sales by Category
  const categoryBreakdown = [
    { name: 'Mains', value: 45, color: '#334155' },
    { name: 'Starters', value: 30, color: '#94A3B8' },
    { name: 'Drinks', value: 15, color: '#CBD5E1' },
    { name: 'Desserts', value: 10, color: '#E2E8F0' }
  ];

  // Payment Breakdown
  const paymentBreakdown = {
    cash: 8500,
    card: 29400,
    upi: 24550
  };

  return res.json({
    success: true,
    data: {
      kpis: {
        totalRevenue,
        totalOrders,
        avgTicketSize,
        avgMargin,
        openTables: 6,
        occupiedTables: 2
      },
      salesTrend,
      categoryBreakdown,
      paymentBreakdown
    }
  });
};

export const triggerEodPipeline = async (req, res) => {
  const { date } = req.body;
  try {
    const report = await runEodAggregation(date);
    return res.status(201).json({
      success: true,
      data: report,
      message: `EOD aggregation pipeline completed for date ${report.report_date}`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
