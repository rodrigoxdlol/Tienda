<script lang="ts">
  import { onMount } from 'svelte';
  import { cart, total, loadCart } from '$lib/cart.store';
  import { get } from 'svelte/store';
  import { goto } from '$app/navigation';

  // URL base de la API
  const API = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

  // Leer csrftoken de la cookie
  function csrftoken(): string {
    if (typeof document === 'undefined') return '';
    return (
      document.cookie
        .split('; ')
        .find((x) => x.startsWith('csrftoken='))?.split('=')[1] ?? ''
    );
  }

  let form = {
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    region: '',
    notes: '',
    payment_method: 'stripe' as 'transfer' | 'cod' | 'stripe' // Tarjeta demo
  };

  let sending = false;
  let error = '';

  onMount(loadCart);

  function fmt(n: number) {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(n);
  }

  async function submit() {
    error = '';
    const c = get(cart);

    if (!c || !c.items?.length) {
      error = 'Tu carrito está vacío.';
      return;
    }
    if (!form.full_name?.trim() || !form.email?.trim()) {
      error = 'Ingresa tu nombre y correo.';
      return;
    }

    sending = true;
    try {
      const res = await fetch(`${API}/api/checkout/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken()
        },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        // 👇 aquí ya NO leemos res.text() ni res.json() para evitar "body stream already read"
        error = `No se pudo procesar la compra (HTTP ${res.status}).`;
        return;
      }

      const data = await res.json();
      const order = data.order ?? data;

      await loadCart();

      const num = order?.number ?? order?.id;
      goto(`/checkout/exito?o=${encodeURIComponent(num ?? '')}`);
    } catch (e: any) {
      error = String(e?.message ?? e) || 'Error al conectar con el servidor.';
    } finally {
      sending = false;
    }
  }
</script>

<section class="mx-auto max-w-5xl px-4 py-10">
  <h1 class="text-2xl md:text-3xl font-semibold text-amber-800">Checkout</h1>

  <div class="mt-6 grid gap-6 md:grid-cols-5">
    <!-- Form -->
    <div class="md:col-span-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
      <h2 class="text-lg font-medium mb-4">Tus datos</h2>

      {#if error}
        <p
          class="mb-3 rounded-lg bg-rose-50 text-rose-700 px-3 py-2 text-sm ring-1 ring-rose-200"
        >
          {error}
        </p>
      {/if}

      <div class="grid sm:grid-cols-2 gap-3">
        <label class="block">
          <span class="text-xs text-slate-600">Nombre completo</span>
          <input
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
            bind:value={form.full_name}
          />
        </label>
        <label class="block">
          <span class="text-xs text-slate-600">Correo</span>
          <input
            type="email"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
            bind:value={form.email}
          />
        </label>

        <label class="block">
          <span class="text-xs text-slate-600">Teléfono</span>
          <input
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
            bind:value={form.phone}
          />
        </label>
        <label class="block sm:col-span-2">
          <span class="text-xs text-slate-600">Dirección</span>
          <input
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
            bind:value={form.address}
          />
        </label>
        <label class="block">
          <span class="text-xs text-slate-600">Ciudad</span>
          <input
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
            bind:value={form.city}
          />
        </label>
        <label class="block">
          <span class="text-xs text-slate-600">Región</span>
          <input
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
            bind:value={form.region}
          />
        </label>

        <label class="block sm:col-span-2">
          <span class="text-xs text-slate-600">Notas</span>
          <textarea
            rows="3"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
            bind:value={form.notes}
          ></textarea>
        </label>
        <label class="block">
          <span class="text-xs text-slate-600">Pago</span>
          <select
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
            bind:value={form.payment_method}
          >
            <option value="stripe">Tarjeta (demo)</option>
          </select>
        </label>
      </div>

      <div class="mt-5">
        <button
          on:click={submit}
          class="inline-flex items-center gap-2 rounded-xl bg-amber-600 text-white px-4 py-2 text-sm font-medium shadow hover:bg-amber-700 disabled:opacity-60"
          disabled={sending}
        >
          {#if sending}
            <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-opacity=".25"
                stroke-width="3"
              />
              <path
                d="M4 12a8 8 0 0 1 8-8v3a5 5 0 0 0-5 5H4z"
                fill="currentColor"
              />
            </svg>
            Procesando…
          {:else}
            Confirmar compra
          {/if}
        </button>
      </div>
    </div>

    <!-- Resumen -->
    <aside
      class="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 h-fit"
    >
      <h2 class="text-lg font-medium mb-4">Tu pedido</h2>

      {#if $cart?.items?.length}
        <ul class="space-y-3">
          {#each $cart.items as it}
            <li class="flex items-center gap-3">
              <img
                src={it.product?.image || '/images/placeholder-product.jpg'}
                alt={it.product?.name}
                class="h-14 w-14 rounded-lg object-cover ring-1 ring-slate-200"
              />
              <div class="min-w-0">
                <div class="text-sm font-medium truncate">
                  {it.product?.name}
                </div>
                <div class="text-xs text-slate-600">
                  {it.qty} × {fmt(it.unit_price)}
                </div>
              </div>
              <div class="ml-auto text-sm font-semibold">
                {fmt(it.subtotal)}
              </div>
            </li>
          {/each}
        </ul>

        <div class="mt-4 border-t pt-3 flex items-center justify-between">
          <span class="text-slate-600">Total</span>
          <b class="text-lg">{fmt($total)}</b>
        </div>
      {:else}
        <p class="text-slate-600 text-sm">Tu carrito está vacío.</p>
      {/if}
    </aside>
  </div>
</section>


