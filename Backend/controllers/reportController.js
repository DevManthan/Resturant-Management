import { query, mockStore } from '../config/db.js';
import { runEodAggregation } from '../services/eodPipeline.js';

export const getDailyReports = async (req, res) => {
  try {
    const dbRes = await query('SELECT * FROM daily_reports ORDER BY report_date DESC LIMIT 30');
    if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
      return res.json({ success: true, count: dbRes.rows.length, data: dbRes.rows });
    }
  } catch (e) {}
  return res.json({ success: true, count: mockStore.daily_reports.length, data: mockStore.daily_reports });
};

export const getExecutiveAnalytics = async (req, res) => {
  const { range = 'Week' } = req.query;
  const normalizedRange = (range || 'Week').toLowerCase();

  try {
    // 0. Time-scoped Date Filters: Day (today only), Week (last 7 days), Month (last 30 days)
    let orderWhere = "WHERE o.order_status != 'cancelled'";
    let orderBaseWhere = "WHERE order_status != 'cancelled'";
    let bookingWhere = "";
    let billWhere = "";

    if (normalizedRange === 'day' || normalizedRange === 'daily') {
      orderWhere += " AND o.created_at::date = CURRENT_DATE";
      orderBaseWhere += " AND created_at::date = CURRENT_DATE";
      bookingWhere = "WHERE booking_date = CURRENT_DATE";
      billWhere = "WHERE bill_time::date = CURRENT_DATE";
    } else if (normalizedRange === 'week' || normalizedRange === 'weekly') {
      orderWhere += " AND o.created_at >= (NOW() - INTERVAL '7 days')";
      orderBaseWhere += " AND created_at >= (NOW() - INTERVAL '7 days')";
      bookingWhere = "WHERE booking_date >= (CURRENT_DATE - INTERVAL '7 days')";
      billWhere = "WHERE bill_time >= (NOW() - INTERVAL '7 days')";
    } else if (normalizedRange === 'month' || normalizedRange === 'monthly') {
      orderWhere += " AND o.created_at >= (NOW() - INTERVAL '30 days')";
      orderBaseWhere += " AND created_at >= (NOW() - INTERVAL '30 days')";
      bookingWhere = "WHERE booking_date >= (CURRENT_DATE - INTERVAL '30 days')";
      billWhere = "WHERE bill_time >= (NOW() - INTERVAL '30 days')";
    }

    // 1. Net Revenue, Order Count, and Average Ticket from PostgreSQL (scoped to selected range)
    let netRevenue = 0;
    let totalOrders = 0;
    let totalCovers = 0;
    let avgTicketSize = 0;
    const avgTableTurn = 38; // standard dining turn in minutes

    const orderStats = await query(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_rev,
        COUNT(*) as total_orders
      FROM orders
      ${orderBaseWhere}
    `);

    if (orderStats && orderStats.rows && orderStats.rows.length > 0) {
      netRevenue = parseFloat(orderStats.rows[0].total_rev) || 0;
      totalOrders = parseInt(orderStats.rows[0].total_orders, 10) || 0;
      avgTicketSize = totalOrders > 0 ? Math.round(netRevenue / totalOrders) : 0;
    }

    // 2. Total Guests / Covers from bookings & orders (scoped to selected range)
    const coverStats = await query(`
      SELECT COALESCE(SUM(guest_count), 0) as total_guests 
      FROM booking
      ${bookingWhere}
    `);
    const bGuests = coverStats?.rows?.[0]?.total_guests ? parseInt(coverStats.rows[0].total_guests, 10) : 0;
    if (totalOrders === 0) {
      totalCovers = 0;
    } else {
      totalCovers = Math.max(bGuests, totalOrders * 2);
    }

    // 3. Top Performer Dish from order_details (scoped to selected range)
    let topDish = {
      name: 'No orders yet',
      count: 0,
      revenue: 0
    };

    const topDishRes = await query(`
      SELECT m.item_name, SUM(od.quantity) as total_qty, SUM(od.total_price) as total_rev
      FROM order_details od
      JOIN menu_items m ON od.item_id = m.menu_id
      JOIN orders o ON od.order_id = o.order_id
      ${orderWhere}
      GROUP BY m.item_name
      ORDER BY total_qty DESC, total_rev DESC
      LIMIT 1
    `);

    if (topDishRes && topDishRes.rows && topDishRes.rows.length > 0 && parseInt(topDishRes.rows[0].total_qty, 10) > 0) {
      topDish = {
        name: topDishRes.rows[0].item_name,
        count: parseInt(topDishRes.rows[0].total_qty, 10) || 0,
        revenue: parseFloat(topDishRes.rows[0].total_rev) || 0
      };
    }

    // 4. Sales by Category (Real distribution from order_details scoped to selected range)
    const catRes = await query(`
      SELECT 
        CASE 
          WHEN LOWER(m.category) LIKE '%main%' THEN 'Mains'
          WHEN LOWER(m.category) LIKE '%start%' THEN 'Starters'
          WHEN LOWER(m.category) LIKE '%bev%' OR LOWER(m.category) LIKE '%drink%' THEN 'Drinks'
          WHEN LOWER(m.category) LIKE '%dessert%' THEN 'Desserts'
          ELSE m.category
        END as category_name,
        SUM(od.quantity) as qty,
        SUM(od.total_price) as rev
      FROM order_details od
      JOIN menu_items m ON od.item_id = m.menu_id
      JOIN orders o ON od.order_id = o.order_id
      ${orderWhere}
      GROUP BY 1
      ORDER BY qty DESC
    `);

    let categoryBreakdown = [];
    const colorMap = {
      Mains: '#0F172A',
      Starters: '#334155',
      Drinks: '#64748B',
      Desserts: '#94A3B8'
    };

    if (catRes && catRes.rows && catRes.rows.length > 0) {
      const totalItemsSold = catRes.rows.reduce((sum, r) => sum + parseInt(r.qty, 10), 0);
      categoryBreakdown = catRes.rows.map((r) => {
        const qty = parseInt(r.qty, 10);
        const pct = totalItemsSold > 0 ? Math.round((qty / totalItemsSold) * 100) : 0;
        return {
          name: r.category_name,
          value: pct,
          quantity: qty,
          revenue: parseFloat(r.rev) || 0,
          color: colorMap[r.category_name] || '#CBD5E1'
        };
      });
    } else {
      // True zero state for period with no orders
      categoryBreakdown = [
        { name: 'Mains', value: 0, quantity: 0, revenue: 0, color: '#0F172A' },
        { name: 'Drinks', value: 0, quantity: 0, revenue: 0, color: '#64748B' },
        { name: 'Starters', value: 0, quantity: 0, revenue: 0, color: '#334155' },
        { name: 'Desserts', value: 0, quantity: 0, revenue: 0, color: '#94A3B8' }
      ];
    }

    // 5. Interactive Revenue Trend (Day, Week, Month) from real orders
    // Day trend: ONLY orders from CURRENT_DATE (starts at 0 on a new day)
    const hourlyOrders = await query(`
      SELECT 
        EXTRACT(HOUR FROM created_at) as hr,
        SUM(total_amount) as rev
      FROM orders
      WHERE order_status != 'cancelled' AND created_at::date = CURRENT_DATE
      GROUP BY 1
      ORDER BY 1
    `);

    const standardHours = [
      { day: '12 PM', hour: 12 },
      { day: '2 PM', hour: 14 },
      { day: '4 PM', hour: 16 },
      { day: '6 PM', hour: 18 },
      { day: '8 PM', hour: 20 },
      { day: '10 PM', hour: 22 }
    ];

    const dayTrend = standardHours.map((slot) => {
      const match = (hourlyOrders?.rows || []).find((h) => Math.abs(parseInt(h.hr, 10) - slot.hour) <= 1);
      return {
        day: slot.day,
        revenue: match ? Math.round(parseFloat(match.rev)) : 0
      };
    });

    // Week trend: Real daily revenue over the last 7 days
    const dowOrders = await query(`
      SELECT 
        TO_CHAR(created_at, 'Dy') as day_label,
        SUM(total_amount) as rev
      FROM orders
      WHERE order_status != 'cancelled' AND created_at >= (CURRENT_DATE - INTERVAL '6 days')
      GROUP BY 1
    `);

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weekTrend = daysOfWeek.map((d) => {
      const match = (dowOrders?.rows || []).find((w) => w.day_label === d);
      return {
        day: d,
        revenue: match ? Math.round(parseFloat(match.rev)) : 0
      };
    });

    // Month trend: Real 4-week bucketing over the last 28 days
    const monthRes = await query(`
      SELECT 
        CASE 
          WHEN created_at >= (CURRENT_DATE - INTERVAL '7 days') THEN 'Week 4'
          WHEN created_at >= (CURRENT_DATE - INTERVAL '14 days') THEN 'Week 3'
          WHEN created_at >= (CURRENT_DATE - INTERVAL '21 days') THEN 'Week 2'
          ELSE 'Week 1'
        END as week_bucket,
        SUM(total_amount) as rev
      FROM orders
      WHERE order_status != 'cancelled' AND created_at >= (CURRENT_DATE - INTERVAL '28 days')
      GROUP BY 1
    `);

    const monthBuckets = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const monthTrend = monthBuckets.map((w) => {
      const match = (monthRes?.rows || []).find((m) => m.week_bucket === w);
      return {
        day: w,
        revenue: match ? Math.round(parseFloat(match.rev)) : 0
      };
    });

    const barDataByRange = {
      Day: dayTrend,
      Week: weekTrend,
      Month: monthTrend
    };

    // 6. Payment Modes breakdown from bill table (scoped to selected range)
    const payRes = await query(`
      SELECT payment_mode, SUM(total_bill) as total, COUNT(*) as count
      FROM bill
      ${billWhere}
      GROUP BY payment_mode
    `);
    const paymentBreakdown = {
      UPI: 0,
      Card: 0,
      Cash: 0
    };
    if (payRes && payRes.rows) {
      payRes.rows.forEach((r) => {
        const mode = (r.payment_mode || 'UPI').toUpperCase();
        if (mode.includes('UPI')) paymentBreakdown.UPI += parseFloat(r.total);
        else if (mode.includes('CARD')) paymentBreakdown.Card += parseFloat(r.total);
        else if (mode.includes('CASH')) paymentBreakdown.Cash += parseFloat(r.total);
        else paymentBreakdown.UPI += parseFloat(r.total);
      });
    }

    // 7. Detailed Dish Sales by Time Setting (Daily, Weekly, Monthly)
    const fetchDishBreakdown = async (intervalFilter) => {
      let where = "WHERE o.order_status != 'cancelled'";
      if (intervalFilter === 'daily') {
        where += " AND o.created_at::date = CURRENT_DATE";
      } else if (intervalFilter === 'weekly') {
        where += " AND o.created_at >= (NOW() - INTERVAL '7 days')";
      } else if (intervalFilter === 'monthly') {
        where += " AND o.created_at >= (NOW() - INTERVAL '30 days')";
      }

      const sql = `
        SELECT 
          m.menu_id,
          m.item_name as dish_name,
          m.category,
          m.price,
          m.image_url,
          COALESCE(SUM(od.quantity), 0) as quantity_sold,
          COALESCE(SUM(od.total_price), 0) as total_revenue
        FROM menu_items m
        JOIN order_details od ON m.menu_id = od.item_id
        JOIN orders o ON od.order_id = o.order_id
        ${where}
        GROUP BY m.menu_id, m.item_name, m.category, m.price, m.image_url
        ORDER BY quantity_sold DESC, total_revenue DESC
      `;
      const res = await query(sql);
      return (res?.rows || []).map((r) => ({
        menu_id: r.menu_id,
        dish_name: r.dish_name,
        category: r.category,
        price: parseFloat(r.price) || 0,
        quantity_sold: parseInt(r.quantity_sold, 10) || 0,
        total_revenue: parseFloat(r.total_revenue) || 0,
        image_url: r.image_url
      }));
    };

    const dishSalesByRange = {
      Daily: await fetchDishBreakdown('daily'),
      Weekly: await fetchDishBreakdown('weekly'),
      Monthly: await fetchDishBreakdown('monthly')
    };

    // 8. Recent Transactions from orders (scoped to selected range)
    const recentRes = await query(`
      SELECT o.order_id, o.table_id, o.order_status, o.total_amount, o.created_at,
             COUNT(od.order_item_id) as items_count
      FROM orders o
      LEFT JOIN order_details od ON o.order_id = od.order_id
      ${orderWhere}
      GROUP BY o.order_id
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

    const recentOrders = (recentRes?.rows || []).map((r) => ({
      order_id: r.order_id,
      table_id: r.table_id,
      status: r.order_status,
      total_amount: parseFloat(r.total_amount),
      items_count: parseInt(r.items_count, 10) || 1,
      time: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    return res.json({
      success: true,
      source: 'postgresql',
      range: normalizedRange,
      data: {
        kpis: {
          netRevenue: Math.round(netRevenue),
          totalOrders,
          totalCovers,
          avgTicketSize,
          avgTableTurn,
          topDish
        },
        barDataByRange,
        categoryBreakdown,
        paymentBreakdown,
        dishSalesByRange,
        recentOrders
      }
    });
  } catch (err) {
    console.warn('[ExecutiveAnalytics] PostgreSQL query fallback:', err.message);
    const isDaily = normalizedRange === 'day' || normalizedRange === 'daily';
    const totalRev = isDaily ? 0 : mockStore.orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const totalOrders = isDaily ? 0 : mockStore.orders.length;
    return res.json({
      success: true,
      source: 'mock_fallback',
      data: {
        kpis: {
          netRevenue: totalRev,
          totalOrders,
          totalCovers: totalOrders * 2,
          avgTicketSize: totalOrders > 0 ? Math.round(totalRev / totalOrders) : 0,
          avgTableTurn: 38,
          topDish: isDaily ? { name: 'No orders yet', count: 0, revenue: 0 } : { name: 'Alphonso Mango Saffron Lassi', count: 9, revenue: 1980 }
        },
        barDataByRange: {
          Day: [{ day: '12 PM', revenue: 0 }, { day: '2 PM', revenue: 0 }, { day: '4 PM', revenue: 0 }, { day: '6 PM', revenue: 0 }, { day: '8 PM', revenue: 0 }, { day: '10 PM', revenue: 0 }],
          Week: [{ day: 'Mon', revenue: 0 }, { day: 'Tue', revenue: 0 }, { day: 'Wed', revenue: 0 }, { day: 'Thu', revenue: 0 }, { day: 'Fri', revenue: 0 }, { day: 'Sat', revenue: 0 }, { day: 'Sun', revenue: 0 }],
          Month: [{ day: 'Week 1', revenue: 0 }, { day: 'Week 2', revenue: 0 }, { day: 'Week 3', revenue: 0 }, { day: 'Week 4', revenue: 0 }]
        },
        categoryBreakdown: [
          { name: 'Mains', value: 0, quantity: 0, revenue: 0, color: '#0F172A' },
          { name: 'Drinks', value: 0, quantity: 0, revenue: 0, color: '#64748B' },
          { name: 'Starters', value: 0, quantity: 0, revenue: 0, color: '#334155' },
          { name: 'Desserts', value: 0, quantity: 0, revenue: 0, color: '#94A3B8' }
        ],
        paymentBreakdown: { UPI: 0, Card: 0, Cash: 0 },
        dishSalesByRange: {
          Daily: [],
          Weekly: [],
          Monthly: []
        },
        recentOrders: []
      }
    });
  }
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
