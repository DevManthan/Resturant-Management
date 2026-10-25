const getApiBase = () => {
  if (typeof window !== 'undefined' && window.location && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `http://${window.location.hostname}:5000/api`;
  }
  return 'http://localhost:5000/api';
};

const API_BASE = getApiBase();

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const res = await fetch(url, config);
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error || `HTTP ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`[API Request Failed] ${options.method || 'GET'} ${endpoint}:`, err.message);
    throw err;
  }
}

// 1. Menu Items API (Dishes, stock toggling, editing, deletion)
export const menuApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/menu${query ? `?${query}` : ''}`);
  },
  add: (dish) => request('/menu', {
    method: 'POST',
    body: JSON.stringify(dish)
  }),
  update: (id, dish) => request(`/menu/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dish)
  }),
  toggleStock: (id, in_stock) => request(`/menu/${id}/stock`, {
    method: 'PATCH',
    body: JSON.stringify({ in_stock })
  }),
  delete: (id) => request(`/menu/${id}`, {
    method: 'DELETE'
  })
};

// 2. Owner & Restaurant Configuration API
export const ownerApi = {
  get: () => request('/owner'),
  update: (ownerData) => request('/owner', {
    method: 'PUT',
    body: JSON.stringify(ownerData)
  })
};

// 3. Orders & Kitchen Display System (KDS) API
export const ordersApi = {
  getAll: (params = {}) => {
    const normalized = typeof params === 'string' ? { table_id: params } : params;
    const query = new URLSearchParams(normalized).toString();
    return request(`/orders${query ? `?${query}` : ''}`);
  },
  getKds: () => request('/orders/kds'),
  create: (order) => request('/orders', {
    method: 'POST',
    body: JSON.stringify(order)
  }),
  updateStatus: (id, status) => request(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),
  callWaiter: (data) => request('/orders/call-waiter', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getCart: (tableId) => {
    const clean = String(tableId).replace(/[^0-9a-zA-Z-]/g, '');
    return request(`/orders/cart/${clean}`);
  },
  updateCart: (tableId, payload) => {
    const clean = String(tableId).replace(/[^0-9a-zA-Z-]/g, '');
    return request(`/orders/cart/${clean}`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};

// 4. Bookings & Table Floorplan API
export const bookingApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/bookings${query ? `?${query}` : ''}`);
  },
  create: (booking) => request('/bookings', {
    method: 'POST',
    body: JSON.stringify(booking)
  }),
  updateStatus: (id, status) => request(`/bookings/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  })
};

// 5. Billing & Split-Billing API
export const billsApi = {
  getAll: () => request('/bills'),
  calculate: (items, discount = 0) => request('/bills/calculate', {
    method: 'POST',
    body: JSON.stringify({ items, discount })
  }),
  split: (payload) => request('/bills/split', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  settle: (billData) => request('/bills/settle', {
    method: 'POST',
    body: JSON.stringify(billData)
  })
};

// 6. Reports & Executive Analytics API
export const reportsApi = {
  getAnalytics: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/reports/analytics${query ? `?${query}` : ''}`);
  },
  getDaily: () => request('/reports/daily'),
  triggerEod: (date) => request('/reports/eod', {
    method: 'POST',
    body: JSON.stringify({ date })
  })
};

// 7. Customer Reviews & Guest Feedback API
export const reviewsApi = {
  getAll: () => request('/reviews'),
  create: (reviewData) => request('/reviews', {
    method: 'POST',
    body: JSON.stringify(reviewData)
  })
};

