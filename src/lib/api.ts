// src/lib/api.ts

// ================== BASE ==================

// URL base de la API, sin slashes al final
const API = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || '';

// Helper para leer cookies
function getCookie(name: string) {
  return (
    document.cookie
      .split('; ')
      .find((r) => r.startsWith(name + '='))?.split('=')[1] ?? ''
  );
}

// GET genérico
async function apiGet(path: string) {
  const r = await fetch(`${API}${path}`, { credentials: 'include' });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// POST genérico
async function apiPost(
  path: string,
  data: any,
  extraHeaders: Record<string, string> = {}
) {
  const r = await fetch(`${API}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// ================== AUTH & SESIÓN ==================

export async function ensureCsrf() {
  return apiGet('/api/csrf/');
}

export async function ping() {
  return apiGet('/api/ping/');
}

export async function me() {
  return apiGet('/api/auth/me/');
}

export async function login(username: string, password: string) {
  await ensureCsrf();
  const token = getCookie('csrftoken');
  return apiPost(
    '/api/auth/login/',
    { username, password },
    { 'X-CSRFToken': token }
  );
}

export async function logout() {
  const token = getCookie('csrftoken');
  return apiPost('/api/auth/logout/', {}, { 'X-CSRFToken': token });
}

export async function register(payload: {
  username: string;
  email: string;
  password: string;
  password2: string;
}) {
  await ensureCsrf();
  const token = getCookie('csrftoken');
  return apiPost('/api/auth/register/', payload, { 'X-CSRFToken': token });
}

// ================== PRODUCTOS & CARRITO ==================

export async function listProducts() {
  return apiGet('/api/products/');
}

export async function getCart() {
  return apiGet('/api/cart/');
}

export async function addToCart(product_id: number, qty = 1) {
  await ensureCsrf();
  const token = getCookie('csrftoken');
  return apiPost(
    '/api/cart/items/',
    { product_id, qty },
    { 'X-CSRFToken': token }
  );
}

export async function updateCartItem(item_id: number, qty: number) {
  await ensureCsrf();
  const token = getCookie('csrftoken');

  // PATCH directo (mantengo la lógica que ya tenías)
  const r = await fetch(`${API}/api/cart/items/${item_id}/`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': token,
    },
    body: JSON.stringify({ qty }),
  });

  if (!r.ok) {
    throw new Error(await r.text());
  }
  return r.json();
}

export async function removeCartItem(item_id: number) {
  await ensureCsrf();
  const token = getCookie('csrftoken');

  const r = await fetch(`${API}/api/cart/items/${item_id}/delete/`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'X-CSRFToken': token,
    },
  });

  if (!r.ok) {
    throw new Error(await r.text());
  }

  // Asumimos que el backend devuelve JSON
  try {
    return await r.json();
  } catch {
    return { ok: true };
  }
}

// ================== CHECKOUT / PEDIDOS ==================

export async function checkoutSummary() {
  return apiGet('/api/checkout/summary/');
}

export async function checkoutConfirm(payload: {
  email: string;
  full_name: string;
  phone?: string;
  address: string;
  city: string;
  region?: string;
  notes?: string;
}) {
  await ensureCsrf();
  const token = getCookie('csrftoken');
  return apiPost('/api/checkout/confirm/', payload, { 'X-CSRFToken': token });
}

/**
 * Crear una orden (flujo de checkout “nuevo”).
 * Usa la cookie de sesión del carrito.
 */
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
    credentials: 'include', // IMPORTANTÍSIMO: envía cookie de sesión
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let msg = 'No se pudo procesar el pago';
    try {
      const j = await res.json();
      msg = (j as any).detail || JSON.stringify(j);
    } catch {
      // ignoramos error de parseo
    }
    throw new Error(msg);
  }

  return res.json(); // { order: {...} }
}

// ================== IMÁGENES SITIO ==================

export async function listHomeImages() {
  return apiGet('/api/site/home-images/');
}

export async function listGalleryImages() {
  return apiGet('/api/site/gallery-images/');
}

// ================== CONTACTO ==================

export async function sendContact(data: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}) {
  await ensureCsrf();
  const csrftoken = getCookie('csrftoken');
  return apiPost('/api/site/contact/', data, {
    'X-CSRFToken': csrftoken,
  });
}

// ================== HELPER JSON GENÉRICO (NUEVO) ==================

async function jfetch(path: string, opts: RequestInit = {}) {
  const fullPath = `${API}${path.startsWith('/') ? '' : '/'}${path}`;
  const r = await fetch(fullPath, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
    ...opts,
  });

  if (!r.ok) {
    let msg = `HTTP ${r.status}`;
    try {
      const j = await r.json();
      msg = (j as any)?.detail || JSON.stringify(j);
    } catch {
      // si no hay JSON, dejamos el msg por defecto
    }
    throw new Error(msg);
  }

  // si no hay cuerpo JSON (204), devolvemos null
  try {
    return await r.json();
  } catch {
    return null;
  }
}

// ================== CLIENTE: CARRITO & PEDIDOS ==================

/**
 * Adjunta el carrito de sesión al usuario autenticado
 * (llámalo después de login/registro).
 */
export async function attachCart() {
  await ensureCsrf();
  const token = getCookie('csrftoken');
  return jfetch('/api/cart/attach/', {
    method: 'POST',
    headers: { 'X-CSRFToken': token },
  });
}

/**
 * Lista de pedidos del usuario autenticado.
 * GET /api/my/orders/
 */
export async function listMyOrders() {
  return jfetch('/api/my/orders/', { method: 'GET' });
}

/**
 * Detalle de un pedido del usuario autenticado.
 * GET /api/my/orders/:id/
 */
export async function getMyOrder(id: number) {
  return jfetch(`/api/my/orders/${id}/`, { method: 'GET' });
}

// ================== TIPOS Y WRAPPERS “MIS PEDIDOS” ==================

export type MyOrderSummary = {
  id: number;
  number: string;
  status: 'pending' | 'paid' | 'cancelled' | string;
  total: number | string;
  created_at: string;
};

/**
 * Wrapper compatible con lo que ya usabas.
 * Devuelve el listado de pedidos del usuario.
 */
export async function myOrders(): Promise<MyOrderSummary[]> {
  const data = await listMyOrders();
  return data as MyOrderSummary[];
}

/**
 * Wrapper compatible: detalle de un pedido.
 */
export async function myOrderDetail(id: number): Promise<any> {
  return getMyOrder(id);
}


// Si aún NO tienes apiPatch, agrégalo:
async function apiPatch(path: string, data: any, extraHeaders: Record<string,string> = {}) {
  const csrftoken = getCookie('csrftoken');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-CSRFToken': csrftoken,
    ...extraHeaders,
  };

  const r = await fetch(`${API}${path}`, {
    method: 'PATCH',
    credentials: 'include',
    headers,
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// =========================
//   Reclamos / Opiniones
// =========================

export type ContactStatus = 'pending' | 'answered' | 'closed';

export interface AdminContactMessage {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: ContactStatus;
  admin_reply: string;
  created_at: string;
  replied_at: string | null;
}

export async function adminListContactMessages(): Promise<AdminContactMessage[]> {
  return apiGet('/api/admin/shop/contact-messages/');
}

export async function adminUpdateContactMessage(
  id: number,
  data: Partial<Pick<AdminContactMessage, 'admin_reply' | 'status'>>
): Promise<AdminContactMessage> {
  return apiPatch(`/api/admin/shop/contact-messages/${id}/`, data);
}

export interface MyContactMessage {
  id: number;
  subject: string;
  message: string;
  admin_reply: string | null;
  status: 'pending' | 'answered' | 'closed';
  created_at: string;
  replied_at: string | null;
}

export async function myContactMessages(): Promise<MyContactMessage[]> {
  return apiGet('/api/shop/my/contact-messages/');
}

export interface ContactStats {
  total: number;
  pending: number;
  answered: number;
  closed: number;
}

export async function adminContactStats(): Promise<ContactStats> {
  return apiGet('/api/admin/shop/contact-messages/stats/');
}

