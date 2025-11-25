<script lang="ts">
  import { onMount } from 'svelte';
  import { cart, total, loadCart, update, remove } from '$lib/cart.store';
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

  type PaymentMethod = 'mercadopago' | 'webpay' | 'transfer';

  let form = {
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    region: '',
    notes: '',
    payment_method: 'mercadopago' as PaymentMethod
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
      // === FLUJO MERCADO PAGO ===
      if (form.payment_method === 'mercadopago') {
        const res = await fetch(`${API}/api/checkout/mercadopago/`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken()
          },
          body: JSON.stringify({
            full_name: form.full_name,
            email: form.email,
            phone: form.phone,
            address: form.address,
            city: form.city,
            region: form.region,
            notes: form.notes
          })
        });

        if (!res.ok) {
          const txt = await res.text();
          console.error('MP error:', txt);
          
          // Detectar problemas de stock
          if (txt.toLowerCase().includes('stock') || txt.toLowerCase().includes('insufficient') || txt.toLowerCase().includes('insuficiente')) {
            throw new Error(
              '😔 Lo sentimos, algunos productos en tu carrito ya no tienen stock suficiente. Por favor, revisa las cantidades disponibles.'
            );
          }
          
          // Otros errores
          throw new Error(
            'No pudimos procesar tu pago en este momento. Por favor, intenta nuevamente o contacta con soporte.'
          );
        }

        const data = await res.json();
        const url = data.init_point;

        if (!url) {
          throw new Error('Hubo un problema al conectar con Mercado Pago. Por favor, intenta nuevamente.');
        }

        // Redirigir al checkout de Mercado Pago
        window.location.href = url;
        return;
      }

      // === FLUJO TRANSFERENCIA / PAGO MANUAL (usa tu /api/checkout/) ===
      if (form.payment_method === 'transfer') {
        const res = await fetch(`${API}/api/checkout/`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken()
          },
          body: JSON.stringify({
            full_name: form.full_name,
            email: form.email,
            phone: form.phone,
            address: form.address,
            city: form.city,
            region: form.region,
            notes: form.notes,
            payment_method: 'transfer'
          })
        });

        if (!res.ok) {
          const txt = await res.text();
          console.error('Checkout error:', txt);
          
          // Detectar problemas de stock
          if (txt.toLowerCase().includes('stock') || txt.toLowerCase().includes('insufficient') || txt.toLowerCase().includes('insuficiente')) {
            throw new Error(
              '😔 Lo sentimos, algunos productos en tu carrito ya no tienen stock suficiente. Por favor, revisa las cantidades disponibles.'
            );
          }
          
          throw new Error(
            'No pudimos procesar tu pedido. Por favor, verifica tus datos e intenta nuevamente.'
          );
        }

        const data = await res.json();
        const order = data.order ?? data;
        // número de orden para la página de éxito
        const num = order?.number ?? order?.id;

        await loadCart(); // vacía/actualiza carrito
        goto(`/checkout/exito?o=${encodeURIComponent(num ?? '')}`);
        return;
      }

      // === WEBPAY (por ahora solo mensaje) ===
      if (form.payment_method === 'webpay') {
        error = 'Webpay aún está en configuración. Usa Mercado Pago por ahora.';
        return;
      }
    } catch (e: any) {
      console.error(e);
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
    <!-- Form -->
    <div class="md:col-span-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
      
      <!-- ALERTA DE SOLO RETIRO -->
      <div class="mb-6 rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-3 items-start">
        <svg class="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <div>
          <h3 class="text-sm font-bold text-amber-800">Importante: Solo Retiro en Tienda</h3>
          <p class="text-sm text-amber-700 mt-1">
            Por el momento <strong>no realizamos envíos a domicilio</strong>. 
            Todas las compras deben ser retiradas en nuestro local en 
            <span class="font-semibold">Lautaro 855, Coyhaique</span>.
          </p>
        </div>
      </div>

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
            placeholder="Juan Pérez"
          />
        </label>
        <label class="block">
          <span class="text-xs text-slate-600">Correo</span>
          <input
            type="email"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
            bind:value={form.email}
            placeholder="juan@ejemplo.com"
          />
        </label>

        <label class="block">
          <span class="text-xs text-slate-600">Teléfono</span>
          <input
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
            bind:value={form.phone}
            placeholder="+56 9 1234 5678"
          />
        </label>
        
        <!-- Dirección aclarada -->
        <label class="block sm:col-span-2">
          <span class="text-xs text-slate-600">Dirección (para boleta/factura)</span>
          <input
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
            bind:value={form.address}
            placeholder="Calle, número, comuna..."
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

        <!-- Método de entrega forzado -->
        <div class="sm:col-span-2 mt-2">
          <span class="text-xs text-slate-600 block mb-1">Método de entrega</span>
          <div class="rounded-lg border border-amber-200 bg-amber-50/50 p-3 flex items-center gap-3">
            <div class="h-5 w-5 rounded-full border-[5px] border-amber-600 bg-white"></div>
            <div class="flex-1">
              <p class="text-sm font-semibold text-slate-900">Retiro en Tienda</p>
              <p class="text-xs text-slate-600">Lautaro 855, Coyhaique</p>
            </div>
            <span class="text-xs font-bold text-emerald-600 uppercase tracking-wide">Gratis</span>
          </div>
        </div>

        <label class="block sm:col-span-2 mt-2">
          <span class="text-xs text-slate-600">Notas adicionales</span>
          <textarea
            rows="2"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
            bind:value={form.notes}
            placeholder="¿Quién retira? ¿Algún detalle extra?"
          ></textarea>
        </label>

        <label class="block sm:col-span-2 mt-2">
          <span class="text-xs text-slate-600">Método de Pago</span>
          <select
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
            bind:value={form.payment_method}
          >
            <option value="mercadopago">Mercado Pago (Tarjetas de crédito/débito)</option>
            <option value="webpay">Webpay (Próximamente)</option>
          </select>
        </label>
      </div>

      <div class="mt-5">
        <button
          type="button"
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
            Pagar
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
        <ul class="space-y-4">
          {#each $cart.items as it}
            <li class="flex items-start gap-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
              <img
                src={it.product?.image || '/images/placeholder-product.jpg'}
                alt={it.product?.name}
                class="h-16 w-16 rounded-lg object-cover ring-1 ring-slate-200"
              />
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium truncate mb-1">
                  {it.product?.name}
                </div>
                <div class="text-xs text-slate-500 mb-2">
                  {fmt(it.unit_price)} c/u
                </div>
                
                <!-- Controles de cantidad -->
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    on:click={() => update(it.id, Math.max(0, it.qty - 1))}
                    class="h-7 w-7 rounded-lg border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-50 active:scale-95 transition"
                    disabled={sending}
                  >
                    <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                  </button>
                  
                  <span class="text-sm font-medium text-slate-900 min-w-[2rem] text-center">
                    {it.qty}
                  </span>
                  
                  <button
                    type="button"
                    on:click={() => update(it.id, it.qty + 1)}
                    class="h-7 w-7 rounded-lg border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-50 active:scale-95 transition"
                    disabled={sending}
                  >
                    <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                  </button>

                  <button
                    type="button"
                    on:click={() => remove(it.id)}
                    class="ml-2 text-xs text-rose-600 hover:text-rose-700 hover:underline"
                    disabled={sending}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              
              <div class="text-sm font-semibold text-slate-900 text-right">
                {fmt(it.subtotal)}
              </div>
            </li>
          {/each}
        </ul>

        <div class="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
          <span class="text-slate-600 font-medium">Total</span>
          <b class="text-xl text-slate-900">{fmt($total)}</b>
        </div>
      {:else}
        <p class="text-slate-600 text-sm">Tu carrito está vacío.</p>
      {/if}
    </aside>
  </div>
</section>
