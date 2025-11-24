<script lang="ts">
  import { onMount } from 'svelte';
  import { user } from '$lib/auth.store';
  import { toastError, toastSuccess } from '$lib/ui/toast';

  const API = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

  type OrderItem = {
    id: number;
    product_name?: string;
    qty: number;
    unit_price: number | string;
    subtotal?: number | string;
  };

  type Order = {
    id: number;
    number: string;
    created_at: string;
    status: 'pending' | 'paid' | 'cancelled' | string;
    total: number | string;
    items?: OrderItem[];
  };

  // CLP formatter
  const clp = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format;

  // leer csrftoken desde cookie
  function csrftoken(): string {
    if (typeof document === 'undefined') return '';
    return (
      document.cookie
        .split('; ')
        .find((x) => x.startsWith('csrftoken='))?.split('=')[1] ?? ''
    );
  }

  let loading = true;
  let error = '';
  let orders: Order[] = [];
  let payingId: number | null = null;

  onMount(loadOrders);

  async function loadOrders() {
    if (!$user?.authenticated) {
      loading = false;
      orders = [];
      return;
    }

    loading = true;
    error = '';
    try {
      const res = await fetch(`${API}/api/my/orders/`, {
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      orders = Array.isArray(data) ? data : data.results ?? [];
    } catch (e: any) {
      error = String(e?.message ?? e) || 'No se pudieron cargar tus pedidos.';
      toastError(error);
      orders = [];
    } finally {
      loading = false;
    }
  }

  function statusLabel(status: string) {
    if (status === 'paid') return 'Pagada';
    if (status === 'pending') return 'Pendiente';
    if (status === 'cancelled') return 'Cancelada';
    return status;
  }

  function statusBadgeClass(status: string) {
    if (status === 'paid') return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
    if (status === 'pending') return 'bg-amber-50 text-amber-700 ring-amber-200';
    if (status === 'cancelled') return 'bg-rose-50 text-rose-700 ring-rose-200';
    return 'bg-slate-50 text-slate-600 ring-slate-200';
  }

  async function payMock(order: Order) {
    if (order.status === 'paid' || order.status === 'cancelled') return;

    payingId = order.id;
    try {
      const res = await fetch(`${API}/api/my/orders/${order.id}/pay-mock/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken()
        },
        body: JSON.stringify({})
      });

      if (!res.ok) {
        let msg = 'No se pudo simular el pago.';
        try {
          const data = await res.json();
          msg = data.detail || JSON.stringify(data) || msg;
        } catch {
          msg = await res.text() || msg;
        }
        toastError(msg);
        return;
      }

      const updated: Order = await res.json();

      // actualizar lista local
      orders = orders.map((o) => (o.id === updated.id ? updated : o));
      toastSuccess('Pago de prueba realizado. La orden quedó como pagada.');
    } catch (e: any) {
      toastError(String(e?.message ?? e) || 'Error al conectar con el servidor.');
    } finally {
      payingId = null;
    }
  }
</script>

{#if !$user?.authenticated}
  <!-- Si no está logueado -->
  <section
    class="max-w-lg mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mt-4"
  >
    <h1 class="text-xl font-semibold text-slate-900 mb-2">
      Inicia sesión para ver tus pedidos
    </h1>
    <p class="text-sm text-slate-600 mb-4">
      Aquí podrás revisar el estado de tus compras y simular el pago de prueba.
    </p>
    <a
      href="/login"
      class="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium bg-amber-600 text-white hover:bg-amber-700"
    >
      Ir a iniciar sesión
    </a>
  </section>
{:else}
  <section class="max-w-5xl mx-auto mt-4 space-y-6">
    {#if loading}
      <div class="space-y-3">
        {#each Array(3) as _}
          <div class="h-24 rounded-2xl bg-slate-100 animate-pulse"></div>
        {/each}
      </div>
    {:else if error}
      <div
        class="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700"
      >
        {error}
      </div>
    {:else if !orders.length}
      <div
        class="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-600"
      >
        <p class="font-medium text-slate-800 mb-1">Todavía no tienes pedidos.</p>
        <p class="mb-4">
          Cuando realices una compra, podrás ver aquí el estado y el historial.
        </p>
        <a
          href="/productos"
          class="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium bg-amber-600 text-white hover:bg-amber-700"
        >
          Ver productos
        </a>
      </div>
    {:else}
      <div class="space-y-4">
        {#each orders as o (o.id)}
          <article
            class="rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:px-6 sm:py-5 shadow-sm"
          >
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p class="text-xs text-slate-500">
                  Pedido
                  <span class="font-mono text-slate-800">#{o.number}</span>
                </p>
                <p class="text-xs text-slate-500">
                  Realizado el{' '}
                  {new Date(o.created_at).toLocaleString('es-CL', {
                    dateStyle: 'short',
                    timeStyle: 'short'
                  })}
                </p>

                {#if o.items?.length}
                  <div class="mt-3 space-y-1">
                    {#each o.items as it}
                      <p class="text-xs text-slate-700">
                        {it.qty}× {it.product_name || `Producto #${it.id}`}
                        <span class="text-slate-500">
                          {' '}
                          · {clp(Number(it.unit_price || 0))}
                        </span>
                      </p>
                    {/each}
                  </div>
                {/if}
              </div>

              <div class="flex flex-col items-end gap-2">
                <div class="flex items-center gap-2">
                  <span
                    class={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${statusBadgeClass(
                      o.status
                    )}`}
                  >
                    <span class="h-1.5 w-1.5 rounded-full bg-current/80"></span>
                    {statusLabel(o.status)}
                  </span>
                  <span class="text-sm font-semibold text-slate-900">
                    {clp(Number(o.total || 0))}
                  </span>
                </div>

                <!-- Botón de pago de prueba -->
                {#if o.status === 'pending'}
                  <button
                    type="button"
                    class="inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-xs sm:text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                    on:click={() => payMock(o)}
                    disabled={payingId === o.id}
                  >
                    {payingId === o.id ? 'Procesando…' : 'Pagar (prueba)'}
                  </button>
                {:else if o.status === 'paid'}
                  <p class="text-[11px] text-emerald-700">
                    Esta orden ya está pagada.
                  </p>
                {:else if o.status === 'cancelled'}
                  <p class="text-[11px] text-rose-700">
                    Esta orden fue cancelada.
                  </p>
                {/if}
              </div>
            </div>
          </article>
        {/each}
      </div>
    {/if}
  </section>
{/if}

