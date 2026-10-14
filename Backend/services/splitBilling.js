/**
 * Luxe Dine - Split-Billing Engine with 5% GST
 * Specification:
 * - Total 5% GST computed over aggregate subtotal to prevent rounding discrepancies.
 * - Modes: Equal Split, Itemized Split, Single Payer.
 */

export const GST_RATE_PERCENT = 5.0; // Fixed 5% GST statutory rate

/**
 * Calculates master bill amounts with GST
 * @param {Array} lineItems - Array of { unit_price, quantity }
 * @param {number} discountAmt - Optional discount
 */
export const calculateAggregateBill = (lineItems = [], discountAmt = 0) => {
  const subtotal = lineItems.reduce((acc, item) => {
    const price = parseFloat(item.unit_price || item.price || 0);
    const qty = parseInt(item.quantity || 1, 10);
    return acc + price * qty;
  }, 0);

  const discount = Math.min(subtotal, Math.max(0, parseFloat(discountAmt || 0)));
  const taxableAmount = Math.max(0, subtotal - discount);

  // Compute 5% GST over aggregate subtotal to prevent rounding errors
  const taxAmount = Math.round((taxableAmount * (GST_RATE_PERCENT / 100)) * 100) / 100;
  const totalBill = Math.round((taxableAmount + taxAmount) * 100) / 100;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    gstRate: GST_RATE_PERCENT,
    taxAmount,
    totalBill
  };
};

/**
 * Equal Split: Total / N guests with exact penny apportionment
 * @param {number} totalBill 
 * @param {number} guestCount 
 */
export const calculateEqualSplit = (totalBill, guestCount = 2) => {
  const count = Math.max(1, parseInt(guestCount, 10));
  const baseShare = Math.floor((totalBill / count) * 100) / 100;
  const remainder = Math.round((totalBill - baseShare * count) * 100) / 100;

  const shares = [];
  for (let i = 0; i < count; i++) {
    // Distribute remainder pennies to the first guest(s)
    const extraPenny = i === 0 ? remainder : 0;
    shares.push({
      guestNumber: i + 1,
      shareAmount: Math.round((baseShare + extraPenny) * 100) / 100,
      status: 'Pending'
    });
  }

  return {
    mode: 'EQUAL',
    totalBill,
    guestCount: count,
    shares
  };
};

/**
 * Itemized Split: Guests select specific items; GST is apportioned pro-rata
 * @param {Array} guestSelections - [{ guestName, itemIds: [ { itemId, quantity, unitPrice } ] }]
 * @param {number} discountTotal
 */
export const calculateItemizedSplit = (guestSelections = [], discountTotal = 0) => {
  // Aggregate items across all guests
  let grandSubtotal = 0;
  const parsedSelections = guestSelections.map((guest, idx) => {
    const items = guest.items || [];
    const guestSubtotal = items.reduce((sum, itm) => sum + (parseFloat(itm.unit_price) * parseInt(itm.quantity || 1, 10)), 0);
    grandSubtotal += guestSubtotal;
    return {
      guestName: guest.guestName || `Guest ${idx + 1}`,
      items,
      guestSubtotal
    };
  });

  const aggregate = calculateAggregateBill(
    guestSelections.flatMap((g) => g.items || []),
    discountTotal
  );

  const guestShares = parsedSelections.map((g) => {
    const ratio = grandSubtotal > 0 ? g.guestSubtotal / grandSubtotal : 1 / guestSelections.length;
    const guestDiscount = Math.round((aggregate.discount * ratio) * 100) / 100;
    const guestTax = Math.round((aggregate.taxAmount * ratio) * 100) / 100;
    const guestTotal = Math.round((g.guestSubtotal - guestDiscount + guestTax) * 100) / 100;

    return {
      guestName: g.guestName,
      items: g.items,
      subtotal: Math.round(g.guestSubtotal * 100) / 100,
      discount: guestDiscount,
      tax: guestTax,
      totalToPay: guestTotal,
      status: 'Pending'
    };
  });

  return {
    mode: 'ITEMIZED',
    aggregate,
    guestShares
  };
};
