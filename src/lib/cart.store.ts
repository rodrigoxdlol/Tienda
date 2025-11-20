import { writable, derived } from 'svelte/store';
import { getCart, addToCart, updateCartItem, removeCartItem } from '$lib/api';

// ---------- Utiles de normalización ----------
const PLACEHOLDER = '/images/placeholder-product.jpg';
const API = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

const abs = (u?: string | null) => {
  if (!u) return null;
  return /^https?:\/\//i.test(u) ? u : `${API}${u.startsWith('/') ? '' : '/'}${u}`;
};

// ---------- Tipos ----------
type ProductLite = {
  id: number;
  name: string;
  price: number;
  slug?: string | number;
  image: string;                     // <- SIEMPRE presente tras normalizar
};

type CartItem = {
  id: number;
  product: ProductLite;
  qty: number;
  unit_price: number;
  subtotal: number;
};

type Cart = { id: number; items: CartItem[]; total: number };

// ---------- Stores ----------
export const cart = writable<Cart | null>(null);
export const count = derived(cart, (c) => (c ? c.items.reduce((n, i) => n + i.qty, 0) : 0));
export const total = derived(cart, (c) => c?.total ?? 0);

// ---------- Normalizadores ----------
function normalizeItem(raw: any): CartItem {
  const p = raw?.product ?? {};
  const main = abs(p.image);
  const gal = abs(p?.images?.[0]?.image); // si tu API incluye 'images' en el item
  const image = main || gal || PLACEHOLDER;

  const unit = Number(raw.unit_price ?? p.price ?? 0);
  const qty = Number(raw.qty ?? 0);
  const subtotal = Number(raw.subtotal ?? unit * qty);

  const product: ProductLite = {
    id: p.id,
    name: p.name ?? 'Producto',
    price: Number(p.price ?? unit ?? 0),
    slug: p.slug ?? p.id,
    image,
  };

  return {
    id: raw.id,
    product,
    qty,
    unit_price: unit,
    subtotal,
  };
}

function normalizeCart(raw: any): Cart {
  return {
    id: raw.id,
    items: (raw.items ?? []).map(normalizeItem),
    total: Number(raw.total ?? 0),
  };
}

// ---------- Acciones ----------
export async function loadCart() {
  const data = await getCart();
  cart.set(normalizeCart(data));
}

export async function add(product_id: number, qty = 1) {
  const r = await addToCart(product_id, qty);
  // asumiendo { cart: {...} } como respuesta
  cart.set(normalizeCart(r.cart ?? r));
}

export async function update(item_id: number, qty: number) {
  const r = await updateCartItem(item_id, qty);
  cart.set(normalizeCart(r.cart ?? r));
}

export async function remove(item_id: number) {
  const r = await removeCartItem(item_id);
  cart.set(normalizeCart(r.cart ?? r));
}
