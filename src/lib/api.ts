// src/lib/api.ts

// ==== Helpers base (SIN CAMBIOS) ====
function getCookie(name: string) {
  return document.cookie.split('; ')
    .find(r => r.startsWith(name + '='))?.split('=')[1] ?? '';
}

async function apiGet(path: string) {
  const r = await fetch(`${API}${path}`, { credentials: 'include' });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function apiPost(path: string, data: any, extraHeaders: Record<string,string> = {}) {
  const r = await fetch(`${API}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function ensureCsrf() { return apiGet('/api/csrf/'); }
export async function ping()       { return apiGet('/api/ping/'); }
export async function me()         { return apiGet('/api/auth/me/'); }

export async function login(username: string, password: string) {
  await ensureCsrf();
  const token = getCookie('csrftoken');
  return apiPost('/api/auth/login/', { username, password }, { 'X-CSRFToken': token });
}

export async function logout() {
  const token = getCookie('csrftoken');
  return apiPost('/api/auth/logout/', {}, { 'X-CSRFToken': token });
}

export async function register(payload: {
  username: string; email: string; password: string; password2: string;
}) {
  await ensureCsrf();
  const token = document.cookie.split('; ').find(r => r.startsWith('csrftoken='))?.split('=')[1] ?? '';
  return apiPost('/api/auth/register/', payload, { 'X-CSRFToken': token });
}


// ... lo que ya tienes arriba (ensureCsrf, me, login, logout)

export async function listProducts() {
  return apiGet('/api/products/');
}
export async function getCart() {
  return apiGet('/api/cart/');
}
export async function addToCart(product_id: number, qty = 1) {
  await ensureCsrf();
  const token = document.cookie.split('; ').find(r => r.startsWith('csrftoken='))?.split('=')[1] ?? '';
  return apiPost('/api/cart/items/', { product_id, qty }, { 'X-CSRFToken': token });
}
export async function updateCartItem(item_id: number, qty: number) {
  await ensureCsrf();
  const token = document.cookie.split('; ').find(r => r.startsWith('csrftoken='))?.split('=')[1] ?? '';
  // PATCH:
  return fetch(`${import.meta.env.VITE_API_URL}/api/cart/items/${item_id}/`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': token },
    body: JSON.stringify({ qty })
  }).then(r => { if(!r.ok) throw r.text(); return r.json(); });
}
export async function removeCartItem(item_id: number) {
  await ensureCsrf();
  const token = document.cookie.split('; ').find(r => r.startsWith('csrftoken='))?.split('=')[1] ?? '';
  return fetch(`${import.meta.env.VITE_API_URL}/api/cart/items/${item_id}/delete/`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'X-CSRFToken': token }
  }).then(r => { if(!r.ok) throw r.text(); return r.json(); });
}

export async function checkoutSummary() {
  return apiGet('/api/checkout/summary/');
}

export async function checkoutConfirm(payload: {
  email: string; full_name: string; phone?: string;
  address: string; city: string; region?: string; notes?: string;
}) {
  await ensureCsrf();
  const token = document.cookie.split('; ').find(r => r.startsWith('csrftoken='))?.split('=')[1] ?? '';
  return apiPost('/api/checkout/confirm/', payload, { 'X-CSRFToken': token });
}

export async function listHomeImages() {
  return apiGet('/api/site/home-images/');
}
export async function listGalleryImages() {
  return apiGet('/api/site/gallery-images/');
}


// src/lib/api.ts
export async function sendContact(data:{name:string;email:string;phone?:string;subject?:string;message:string}) {
  await ensureCsrf();
  const csrftoken = document.cookie.split('; ').find(x=>x.startsWith('csrftoken='))?.split('=')[1] ?? '';
  return apiPost('/api/site/contact/', data, { 'X-CSRFToken': csrftoken });
}

// src/lib/api.ts
const API = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || '';

export async function createOrder(payload: {
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  region?: string;
  notes?: string;
  payment_method?: 'transfer' | 'cod' | 'stripe';
}) {
  const res = await fetch(`${API}/api/checkout/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',          // IMPORTANTÍSIMO para enviar la cookie de sesión del carrito
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let msg = 'No se pudo procesar el pago';
    try { const j = await res.json(); msg = j.detail || JSON.stringify(j); } catch {}
    throw new Error(msg);
  }
  return res.json(); // { order: {...} }
}


/* =======================================================
   === NUEVO: endpoints cliente (pedidos y adjuntar carrito)
   ======================================================= */

// Helper interno para JSON fetch consistente (no rompe lo anterior)
async function jfetch(path: string, opts: RequestInit = {}) {
  const r = await fetch(`${API}${path.startsWith('/') ? '' : '/'}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts
  });
  if (!r.ok) {
    let msg = `HTTP ${r.status}`;
    try { const j = await r.json(); msg = (j as any)?.detail || JSON.stringify(j); } catch {}
    throw new Error(msg);
  }
  return r.json();
}

/**
 * Adjunta el carrito de sesión al usuario autenticado
 * (llámalo después de login/registro).
 */
export async function attachCart() {
  await ensureCsrf();
  const token = getCookie('csrftoken');
  return jfetch('/api/cart/attach/', {
    method: 'POST',
    headers: { 'X-CSRFToken': token }
  });
}

/**
 * Lista de pedidos del usuario autenticado.
 * GET /api/my/orders/
 */
export async function listMyOrders() {
  return jfetch('/api/my/orders/');
}

/**
 * Detalle de un pedido del usuario autenticado.
 * GET /api/my/orders/:id/
 */
export async function getMyOrder(id: number) {
  return jfetch(`/api/my/orders/${id}/`);
}

// ====================== MIS PEDIDOS (CLIENTE) ======================

export type MyOrderSummary = {
  id: number;
  number: string;
  status: 'pending' | 'paid' | 'cancelled' | string;
  total: number | string;
  created_at: string;
};

export async function myOrders(): Promise<MyOrderSummary[]> {
  const API = import.meta.env.VITE_API_URL;
  const r = await fetch(`${API}/api/my/orders/`, {
    credentials: 'include'
  });
  if (!r.ok) {
    throw new Error(await r.text());
  }
  return r.json();
}

export async function myOrderDetail(id: number): Promise<any> {
  const API = import.meta.env.VITE_API_URL;
  const r = await fetch(`${API}/api/my/orders/${id}/`, {
    credentials: 'include'
  });
  if (!r.ok) {
    throw new Error(await r.text());
  }
  return r.json();
}

