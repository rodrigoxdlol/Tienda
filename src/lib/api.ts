// src/lib/api.ts

// ================== BASE ==================

// URL base de la API, sin slashes al final
export const API = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || '';

// Helper para leer cookies
export function getCookie(name: string): string {
  return (
    document.cookie
      .split('; ')
      .find((r) => r.startsWith(name + '='))?.split('=')[1] ?? ''
  );
}

// GET genérico

export async function apiGet(path: string) {
  const r = await fetch(`${API}${path}`, { credentials: 'include' });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

/**
 * POST genérico que:
 * - Envía credenciales (cookie de sesión)
 * - Adjunta JSON
 * - Si no tiene `X-CSRFToken`, llama a /api/csrf/ y agrega el token automáticamente
 */
export async function apiPost(
  path: string,
  data: any,
  extraHeaders: Record<string, string> = {}
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders
  };

  // Si no nos pasaron un X-CSRFToken, lo obtenemos solos
  if (!headers['X-CSRFToken']) {
    try {
      await ensureCsrf();
      const token = getCookie('csrftoken');
      if (token) {
        headers['X-CSRFToken'] = token;
      }
    } catch {
      // si falla, igual intentamos el POST; el backend dirá si falta CSRF
    }
  }

  const r = await fetch(`${API}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify(data)
  });

  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// Si aún NO tienes apiPatch, lo definimos aquí
async function apiPatch(
  path: string,
  data: any,
  extraHeaders: Record<string, string> = {}
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders
  };

  if (!headers['X-CSRFToken']) {
    try {
      await ensureCsrf();
      const token = getCookie('csrftoken');
      if (token) headers['X-CSRFToken'] = token;
    } catch {
      // ignore
    }
  }

  const r = await fetch(`${API}${path}`, {
    method: 'PATCH',
    credentials: 'include',
    headers,
    body: JSON.stringify(data)
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// Helper JSON genérico (GET/POST/etc) ya usado más abajo
async function jfetch(path: string, opts: RequestInit = {}) {
  const fullPath = `${API}${path.startsWith('/') ? '' : '/'}${path}`;
  const r = await fetch(fullPath, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {})
    },
    ...opts
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

  try {
    return await r.json();
  } catch {
    return null;
  }
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
  // forzamos obtener CSRF antes de loguear
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

export async function getProduct(slugOrId: string | number) {
  // Primero intentar obtener el producto individual (puede tener más detalles)
  try {
    const productDetail = await apiGet(`/api/products/${slugOrId}/`);
    console.log('Producto desde endpoint individual:', productDetail);
    return productDetail;
  } catch (e) {
    console.log('Endpoint individual falló, usando listado:', e);
    // Si falla, buscar en el listado general
    const products = await listProducts();
    const found = products.find((p: any) =>
      p.slug === slugOrId || p.id === slugOrId || String(p.id) === String(slugOrId)
    );
    if (!found) {
      throw new Error('Product not found');
    }
    console.log('Producto desde listado:', found);
    return found;
  }
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

  const r = await fetch(`${API}/api/cart/items/${item_id}/`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': token
    },
    body: JSON.stringify({ qty })
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
      'X-CSRFToken': token
    }
  });

  if (!r.ok) {
    throw new Error(await r.text());
  }

  try {
    return await r.json();
  } catch {
    return { ok: true };
  }
}

// ================== CHECKOUT / PEDIDOS (resumen viejo) ==================

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
    credentials: 'include',
    body: JSON.stringify(payload)
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

// =============== WEBPAY ===============

export interface CheckoutPayload {
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  region?: string;
  notes?: string;
}

export interface WebpayInitResponse {
  order_id: number;
  url: string;
  token: string;
}

/**
 * Inicia un pago Webpay Plus:
 * -> crea la orden en Django
 * -> llama a Transbank SDK
 * -> retorna url + token para redirigir al usuario
 *
 * Usa apiPost, que ya se encarga de CSRF.
 */
export async function checkoutWebpay(
  data: CheckoutPayload
): Promise<WebpayInitResponse> {
  return apiPost('/api/checkout/webpay/', data);
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
  // apiPost ya mete CSRF si hace falta
  return apiPost('/api/site/contact/', data);
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
    headers: { 'X-CSRFToken': token }
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

export async function myOrders(): Promise<MyOrderSummary[]> {
  const data = await listMyOrders();
  return data as MyOrderSummary[];
}

export async function myOrderDetail(id: number): Promise<any> {
  return getMyOrder(id);
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
  status: ContactStatus;
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

// ================== MERCADO PAGO ==================

export interface CheckoutPayload {
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  region?: string;
  notes?: string;
}

export interface MpCheckoutResponse {
  order_id: number;
  preference_id: string;
  init_point: string;
}


export interface MercadoPagoCheckoutResponse {
  order_id: number;
  preference_id: string;
  init_point: string;
  sandbox_init_point?: string;
}

/**
 * Inicia el checkout de Mercado Pago:
 * llama a /api/checkout/mercadopago/ y devuelve la URL para redirigir.
 */

export async function checkoutMercadoPago(
  data: CheckoutPayload
): Promise<MpCheckoutResponse> {
  return apiPost('/api/checkout/mercadopago/', data);
}
// ================== ADMIN: IMÁGENES DE NOTICIAS ==================

// $lib/api.ts (además de lo que ya tienes)

// ================== NOTICIAS (NEWS IMAGES) ==================

export type NewsImage = {
  id: number;
  title: string | null;
  caption: string | null;
  image: string;           // URL absoluta desde el backend
  order: number | null;
  is_active: boolean;
  created_at: string;
};

// Para el admin usamos el mismo shape por ahora
export type AdminNewsImage = NewsImage;

/**
 * Listado público de noticias (solo activas, lo filtra el backend).
 * GET /api/site/news-images/
 */
// $lib/api.ts
export async function listNewsImages(): Promise<NewsImage[]> {
  return apiGet('/api/site/news-images/');
}


/**
 * Listado admin de imágenes de noticias.
 * GET /api/admin/news-images/
 */
export async function adminListNewsImages(): Promise<AdminNewsImage[]> {
  const res = await fetch(`${API}/api/admin/news-images/`, {
    credentials: 'include'
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/**
 * Crear una nueva imagen de noticia (admin).
 * POST /api/admin/news-images/
 */
export async function adminCreateNewsImage(payload: {
  title?: string;
  caption?: string;
  image: File;
  is_active?: boolean;
  order?: number;
}): Promise<AdminNewsImage> {
  const form = new FormData();

  if (payload.title) form.append('title', payload.title);
  if (payload.caption) form.append('caption', payload.caption);
  form.append('image', payload.image);

  if (payload.is_active !== undefined) {
    form.append('is_active', String(payload.is_active));
  }
  if (payload.order !== undefined) {
    form.append('order', String(payload.order));
  }

  const res = await fetch(`${API}/api/admin/news-images/`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'X-CSRFToken': getCookie('csrftoken')
    },
    body: form
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/**
 * Eliminar una noticia (admin).
 * DELETE /api/admin/news-images/{id}/
 */
export async function adminDeleteNewsImage(id: number): Promise<void> {
  const res = await fetch(`${API}/api/admin/news-images/${id}/`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'X-CSRFToken': getCookie('csrftoken')
    }
  });
  if (!res.ok) throw new Error(await res.text());
}





// registrar una visita (lo usa trackVisitOncePerDay)
export async function registerVisit() {
  // apiPost es el helper que ya usas en el resto del proyecto
  return apiPost('/api/site/track-visit/', {});
}

// stats de visitas para el admin (14 días por defecto)


export type VisitPoint = {
  date: string;
  visits: number;
};

export type VisitStatsResponse = {
  points: VisitPoint[];
};

export async function adminGetVisitStats(
  days: number = 14
): Promise<VisitStatsResponse> {
  const r = await fetch(`${API}/api/admin/visit-stats/?days=${days}`, {
    credentials: 'include'
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}