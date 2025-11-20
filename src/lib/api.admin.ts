// src/lib/api.admin.ts
const API = import.meta.env.VITE_API_URL;

/* ======================= CSRF ======================= */
function csrftoken() {
  if (typeof document === 'undefined') return '';
  return (
    document.cookie
      .split('; ')
      .find((x) => x.startsWith('csrftoken='))?.split('=')[1] ?? ''
  );
}

/* ======================= TIPOS NUEVOS (opcionales) ======================= */
export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
  last_login: string | null;
}

export type AdminOrder = {
  id: number;
  number: string;
  status:
    | 'pending'
    | 'paid'
    | 'in_production'
    | 'ready'
    | 'delivered'
    | 'cancelled'
    | string;
  total: number | string;
  email: string;
  created_at: string;
};

/* ======================= Productos ======================= */
export async function adminListProducts() {
  const r = await fetch(`${API}/api/admin/products/`, { credentials: 'include' });
  if (!r.ok) throw await r.text();
  return r.json();
}

export async function adminCreateProduct(p: {
  name: string;
  slug: string;
  price: number;
  stock: number;
  is_active: boolean;
  category_id?: number | null;
}) {
  const r = await fetch(`${API}/api/admin/products/`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrftoken()
    },
    body: JSON.stringify(p)
  });
  if (!r.ok) throw await r.text();
  return r.json();
}

export async function adminPatchProduct(id: number, patch: any) {
  const r = await fetch(`${API}/api/admin/products/${id}/`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrftoken()
    },
    body: JSON.stringify(patch)
  });
  if (!r.ok) throw await r.text();
  return r.json();
}

export async function adminUploadMainImage(id: number, file: File) {
  const fd = new FormData();
  fd.append('image', file);

  const r = await fetch(`${API}/api/admin/products/${id}/upload-main/`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'X-CSRFToken': csrftoken() }, // NO poner Content-Type a mano
    body: fd
  });
  if (!r.ok) throw await r.text();
  return r.json();
}

export async function adminUploadGallery(id: number, file: File) {
  const fd = new FormData();
  fd.append('image', file);

  const r = await fetch(`${API}/api/admin/products/${id}/gallery/`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'X-CSRFToken': csrftoken() },
    body: fd
  });
  if (!r.ok) throw await r.text();
  return r.json();
}

export async function adminDeleteGallery(imgId: number) {
  const r = await fetch(`${API}/api/admin/products/gallery/${imgId}/delete/`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'X-CSRFToken': csrftoken() }
  });
  if (!r.ok) throw await r.text();
  return true; // muchos endpoints devuelven 204
}

export async function adminDeleteProduct(id: number) {
  const r = await fetch(`${API}/api/admin/products/${id}/`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'X-CSRFToken': csrftoken() }
  });
  if (!r.ok) throw await r.text();
  return true;
}

/* ======================= Categorías ======================= */
export interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  order: number;
}

export async function adminListCategories(): Promise<AdminCategory[]> {
  const r = await fetch(`${API}/api/admin/categories/`, { credentials: 'include' });
  if (!r.ok) throw await r.text();
  return r.json();
}

export async function adminCreateCategory(data: {
  name: string;
  slug: string;
  is_active?: boolean;
  order?: number;
}): Promise<AdminCategory> {
  const r = await fetch(`${API}/api/admin/categories/`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrftoken()
    },
    body: JSON.stringify(data)
  });
  if (!r.ok) throw await r.text();
  return r.json();
}

export async function adminUpdateCategory(
  id: number,
  data: Partial<{ name: string; slug: string; is_active: boolean; order: number }>
): Promise<AdminCategory> {
  const r = await fetch(`${API}/api/admin/categories/${id}/`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrftoken()
    },
    body: JSON.stringify(data)
  });
  if (!r.ok) throw await r.text();
  return r.json();
}

export async function adminDeleteCategory(id: number): Promise<boolean> {
  const r = await fetch(`${API}/api/admin/categories/${id}/`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'X-CSRFToken': csrftoken() }
  });
  if (!r.ok) throw await r.text();
  return true;
}

/* ======================= Orders (lista + detalle + stats) ======================= */

export interface AdminOrderListParams {
  user_id?: number;
  page?: number;
  page_size?: number;
  status?:
    | 'pending'
    | 'paid'
    | 'in_production'
    | 'ready'
    | 'delivered'
    | 'cancelled'
    | 'all'
    | string;
  email?: string;
  date_from?: string; // 'YYYY-MM-DD'
  date_to?: string;   // 'YYYY-MM-DD'
}

export async function adminListOrders(params: AdminOrderListParams = {}) {
  let url = `${API}/api/admin/orders/`;
  const qs = new URLSearchParams();

  if (params.user_id) qs.set('user_id', String(params.user_id));
  if (params.page) qs.set('page', String(params.page));
  if (params.page_size) qs.set('page_size', String(params.page_size));
  if (params.status && params.status !== 'all') qs.set('status', params.status);
  if (params.email) qs.set('email', params.email);
  if (params.date_from) qs.set('date_from', params.date_from);
  if (params.date_to) qs.set('date_to', params.date_to);

  const qstr = qs.toString();
  if (qstr) url += `?${qstr}`;

  const r = await fetch(url, { credentials: 'include' });
  if (!r.ok) throw await r.text();
  return r.json(); // puede ser array o paginado
}

export async function adminGetOrder(id: number) {
  const r = await fetch(`${API}/api/admin/orders/${id}/`, {
    credentials: 'include'
  });
  if (!r.ok) throw await r.text();
  return r.json();
}

export type AdminOrderStats = {
  total_orders: number;
  total_revenue: number;
  last_30_revenue: number;
  last_30_count: number;
  by_status: { status: string; count: number; total: number }[];
  by_category: { id: number | null; name: string; total: number; qty: number }[];
  top_products: { id: number; name: string; total: number; qty: number }[];
};

export async function adminGetOrderStats(params?: AdminOrderListParams) {
  const sp = new URLSearchParams();

  if (params?.status && params.status !== 'all') sp.set('status', params.status);
  if (params?.email) sp.set('email', params.email);
  if (params?.date_from) sp.set('date_from', params.date_from);
  if (params?.date_to) sp.set('date_to', params.date_to);

  const qs = sp.toString();
  const url = qs
    ? `${API}/api/admin/orders-stats/?${qs}`
    : `${API}/api/admin/orders-stats/`;

  const r = await fetch(url, { credentials: 'include' });
  if (!r.ok) throw await r.text();
  return r.json();
}

export async function adminUpdateOrderStatus(
  id: number,
  status:
    | 'pending'
    | 'paid'
    | 'in_production'
    | 'ready'
    | 'delivered'
    | 'cancelled'
) {
  const r = await fetch(`${API}/api/admin/orders/${id}/status/`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrftoken()
    },
    body: JSON.stringify({ status })
  });
  if (!r.ok) throw await r.text();
  return r.json();
}

/* ======================= Home Images ======================= */

export async function adminListHomeImages() {
  const r = await fetch(`${API}/api/admin/home-images/`, { credentials: 'include' });
  if (!r.ok) throw await r.text();
  return r.json();
}

export async function adminCreateHomeImage(data: {
  title?: string;
  caption?: string;
  order?: number;
  file: File;
  is_active?: boolean;
}) {
  const fd = new FormData();
  if (data.title) fd.append('title', data.title);
  if (data.caption) fd.append('caption', data.caption);
  if (data.order !== undefined) fd.append('order', String(data.order));
  fd.append('image', data.file); // campo debe llamarse "image"
  if (data.is_active !== undefined)
    fd.append('is_active', data.is_active ? 'true' : 'false');

  const r = await fetch(`${API}/api/admin/home-images/`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'X-CSRFToken': csrftoken() },
    body: fd
  });
  if (!r.ok) throw await r.text();
  return r.json();
}

export async function adminPatchHomeImage(id: number, patch: any) {
  const r = await fetch(`${API}/api/admin/home-images/${id}/`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrftoken()
    },
    body: JSON.stringify(patch)
  });
  if (!r.ok) throw await r.text();
  return r.json();
}

export async function adminDeleteHomeImage(id: number) {
  const r = await fetch(`${API}/api/admin/home-images/${id}/`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'X-CSRFToken': csrftoken() }
  });
  if (!r.ok) throw await r.text();
  return true;
}

export async function adminReorderHomeImages(list: { id: number; order: number }[]) {
  const r = await fetch(`${API}/api/admin/home-images/reorder/`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrftoken()
    },
    body: JSON.stringify(list)
  });
  if (!r.ok) throw await r.text();
  return r.json();
}

/* ======================= Gallery Images ======================= */

export async function adminListGalleryImages() {
  const r = await fetch(`${API}/api/admin/gallery-images/`, { credentials: 'include' });
  if (!r.ok) throw await r.text();
  return r.json();
}

export async function adminCreateGalleryImage(data: {
  title?: string;
  caption?: string;
  order?: number;
  file: File;
  is_active?: boolean;
}) {
  const fd = new FormData();
  if (data.title) fd.append('title', data.title);
  if (data.caption) fd.append('caption', data.caption);
  if (data.order !== undefined) fd.append('order', String(data.order));
  fd.append('image', data.file);
  if (data.is_active !== undefined)
    fd.append('is_active', data.is_active ? 'true' : 'false');

  const r = await fetch(`${API}/api/admin/gallery-images/`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'X-CSRFToken': csrftoken() },
    body: fd
  });
  if (!r.ok) throw await r.text();
  return r.json();
}

export async function adminPatchGalleryImage(id: number, patch: any) {
  const r = await fetch(`${API}/api/admin/gallery-images/${id}/`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrftoken()
    },
    body: JSON.stringify(patch)
  });
  if (!r.ok) throw await r.text();
  return r.json();
}

export async function adminDeleteGalleryImage(id: number) {
  const r = await fetch(`${API}/api/admin/gallery-images/${id}/`, {
    method: 'DELETE',
    credentials: { 'X-CSRFToken': csrftoken() } as any
  } as RequestInit); // pequeña trampa para no romper nada de TS / runtime

  // ^ si tu versión anterior funcionaba bien, deja esto como estaba:
  // const r = await fetch(`${API}/api/admin/gallery-images/${id}/`, {
  //   method: 'DELETE',
  //   credentials: 'include',
  //   headers: { 'X-CSRFToken': csrftoken() }
  // });

  if (!r.ok) throw await r.text();
  return true;
}

export async function adminReorderGalleryImages(list: { id: number; order: number }[]) {
  const r = await fetch(`${API}/api/admin/gallery-images/reorder/`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrftoken()
    },
    body: JSON.stringify(list)
  });
  if (!r.ok) throw await r.text();
  return r.json();
}

/* ======================= USERS ======================= */

export interface AdminUserListParams {
  search?: string;
  page?: number;
  page_size?: number;
  only_active?: boolean;
  only_staff?: boolean;
}

export async function adminListUsers(
  params: AdminUserListParams = {}
): Promise<Paginated<AdminUser> | AdminUser[]> {
  const sp = new URLSearchParams();

  if (params.search) sp.set('search', params.search);
  if (params.page) sp.set('page', String(params.page));
  if (params.page_size) sp.set('page_size', String(params.page_size));
  if (params.only_active) sp.set('only_active', '1');
  if (params.only_staff) sp.set('only_staff', '1');

  const qs = sp.toString();
  const url = qs ? `${API}/api/admin/users/?${qs}` : `${API}/api/admin/users/`;

  const r = await fetch(url, { credentials: 'include' });
  if (!r.ok) {
    let msg = r.statusText || `Error ${r.status}`;
    try {
      const data = await r.json();
      msg = (data as any).detail || JSON.stringify(data);
    } catch {
      // ignorar
    }
    throw new Error(msg);
  }
  return r.json();
}

export async function adminGetUser(id: number) {
  const r = await fetch(`${API}/api/admin/users/${id}/`, { credentials: 'include' });
  if (!r.ok) throw await r.text();
  return r.json() as Promise<AdminUser>;
}

export async function adminCreateUser(
  payload: Partial<AdminUser> & { password?: string }
) {
  const r = await fetch(`${API}/api/admin/users/`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrftoken()
    },
    body: JSON.stringify(payload)
  });
  if (!r.ok) throw await r.text();
  return r.json() as Promise<AdminUser>;
}

export async function adminUpdateUser(
  id: number,
  patch: Partial<AdminUser> & { password?: string }
) {
  const r = await fetch(`${API}/api/admin/users/${id}/`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrftoken()
    },
    body: JSON.stringify(patch)
  });
  if (!r.ok) throw await r.text();
  return r.json() as Promise<AdminUser>;
}

export async function adminDeleteUser(id: number) {
  const r = await fetch(`${API}/api/admin/users/${id}/`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'X-CSRFToken': csrftoken() }
  });
  if (!r.ok) throw await r.text();
  return true;
}

/* ======================= STATS (AdminStats + low stock + CSV) ======================= */

export type AdminStats = {
  days: number;
  orders_count: number;
  revenue_total: number | string;
  top_products: {
    product_id: number | null;
    name: string;
    units: number;
    revenue: number | string;
  }[];
  by_category: {
    category_id: number | null;
    name: string;
    units: number;
    revenue: number | string;
  }[];
};

export async function adminGetStats(days = 30): Promise<AdminStats> {
  const sp = new URLSearchParams();
  if (days) sp.set('days', String(days));

  const url = `${API}/api/admin/stats/${sp.toString() ? `?${sp.toString()}` : ''}`;

  const r = await fetch(url, { credentials: 'include' });
  if (!r.ok) {
    let msg = r.statusText || `Error ${r.status}`;
    try {
      const data = await r.json();
      msg = (data as any).detail || JSON.stringify(data);
    } catch {
      // ignorar
    }
    throw new Error(msg);
  }
  return r.json();
}

// 🔸 LISTAR PRODUCTOS CON STOCK BAJO
export async function adminListLowStock(limit = 5) {
  const qs = new URLSearchParams({ limit: String(limit) });
  const r = await fetch(`${API}/api/admin/products/low-stock/?${qs.toString()}`, {
    credentials: 'include'
  });
  if (!r.ok) throw new Error(await r.text());

  const data = await r.json();
  // backend devuelve { low_stock: [...] }
  return Array.isArray(data.low_stock) ? data.low_stock : [];
}

// 🔸 EXPORTAR ÓRDENES A CSV
export async function adminExportOrdersCSV(params?: AdminOrderListParams) {
  const qs = new URLSearchParams();

  if (params) {
    if (params.status && params.status !== 'all') qs.set('status', params.status);
    if (params.email) qs.set('email', params.email);
    if (params.date_from) qs.set('date_from', params.date_from);
    if (params.date_to) qs.set('date_to', params.date_to);
  }

  let url = `${API}/api/admin/orders/export-csv/`;
  const qsStr = qs.toString();
  if (qsStr) url += `?${qsStr}`;

  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(await res.text());

  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = blobUrl;

  const now = new Date();
  const stamp = now.toISOString().slice(0, 19).replace(/[:T]/g, '-');
  a.download = `ordenes-${stamp}.csv`;

  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(blobUrl);
}

