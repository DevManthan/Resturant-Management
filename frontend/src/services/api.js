const API_BASE = 'http://localhost:5000/api';

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
    const query = new URLSearchParams(params).toString();
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
  })
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
  getAnalytics: () => request('/reports/analytics'),
  getDaily: () => request('/reports/daily'),
  triggerEod: (date) => request('/reports/eod', {
    method: 'POST',
    body: JSON.stringify({ date })
  })
};
