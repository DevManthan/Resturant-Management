/**
 * Luxe Dine - Kitchen Scheduling Engine (KDS Prioritization)
 * Core Algorithms specified in Handoff Document:
 * 1. Base Sequencing: First-In, First-Out (FIFO) by submission timestamp.
 * 2. Dynamic Prep-Time Synchronization: Items within ticket prioritized by longest PREP_TIME.
 * 3. Course Prioritization: Drinks/Starters dispatched first, Mains staggered.
 * 4. SLA Delay Escalation: Tickets exceeding 80% of expected prep time trigger alert & jump queue.
 */

export const COURSE_ORDER = {
  Beverages: 1,
  Drinks: 1,
  Starters: 2,
  'Main Course': 3,
  Mains: 3,
  Desserts: 4
};

/**
 * Calculates preparation progress and SLA escalation flag for an order
 * @param {Object} order 
 * @param {Array} items 
 */
export const calculateTicketSla = (order, items = []) => {
  const createdAt = new Date(order.created_at || order.createdAt || Date.now()).getTime();
  const now = Date.now();
  const elapsedMinutes = Math.max(0, (now - createdAt) / (1000 * 60));

  // Find the longest item prep time in the ticket for ticket-level SLA
  const maxPrepTime = items.length > 0
    ? Math.max(...items.map((i) => i.prep_time || i.PREP_TIME || 15))
    : 15;

  const slaThresholdMinutes = maxPrepTime * 0.8; // 80% threshold
  const isSlaBreached = elapsedMinutes >= slaThresholdMinutes && order.order_status !== 'ready' && order.order_status !== 'completed';
  const isCritical = elapsedMinutes >= maxPrepTime && order.order_status !== 'ready' && order.order_status !== 'completed';

  const progressPercent = Math.min(100, Math.round((elapsedMinutes / maxPrepTime) * 100));

  return {
    elapsedMinutes: Math.round(elapsedMinutes * 10) / 10,
    maxPrepTime,
    slaThresholdMinutes,
    isSlaBreached,
    isCritical,
    progressPercent
  };
};

/**
 * Sorts KDS tickets dynamically:
 * - SLA breached/escalated tickets jump to the top
 * - Then sorted by course urgency and FIFO submission timestamp
 * - Items inside each ticket synchronized by longest prep time
 */
export const prioritizeKdsQueue = (orders = [], orderDetails = [], menuCatalog = []) => {
  // Map items to orders
  const catalogMap = new Map(menuCatalog.map((m) => [m.menu_id, m]));

  const enrichedOrders = orders.map((order) => {
    const rawItems = orderDetails.filter((d) => d.order_id === order.order_id);
    const items = rawItems.map((item) => {
      const menuItem = catalogMap.get(item.item_id) || {};
      return {
        ...item,
        item_name: item.item_name || menuItem.item_name || 'Special Item',
        category: item.category || menuItem.category || 'Mains',
        prep_time: item.prep_time || menuItem.prep_time || 15,
        course_rank: COURSE_ORDER[menuItem.category || item.category] || 3
      };
    });

    // Dynamic prep-time synchronization:
    // Sort items within ticket so longest cooking items start first
    const synchronizedItems = [...items].sort((a, b) => {
      if (a.course_rank !== b.course_rank) {
        return a.course_rank - b.course_rank; // Course sequence first
      }
      return b.prep_time - a.prep_time; // Longest prep time first within course
    });

    const sla = calculateTicketSla(order, items);

    return {
      ...order,
      items: synchronizedItems,
      sla
    };
  });

  // Base Queue Sorting:
  // 1. Critical tickets first (>100% time)
  // 2. SLA escalated tickets (>80% time)
  // 3. FIFO submission timestamp
  return enrichedOrders.sort((a, b) => {
    if (a.sla.isCritical && !b.sla.isCritical) return -1;
    if (!a.sla.isCritical && b.sla.isCritical) return 1;

    if (a.sla.isSlaBreached && !b.sla.isSlaBreached) return -1;
    if (!a.sla.isSlaBreached && b.sla.isSlaBreached) return 1;

    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    return timeA - timeB; // FIFO
  });
};
