<script lang="ts">
  import { onMount } from 'svelte';
  import {
    adminListOrders,
    adminUpdateOrderStatus,
    adminGetOrder,
    adminGetOrderStats,
    type AdminOrder,
    type AdminOrderListParams
  } from '$lib/api.admin';
  import { API } from '$lib/api';
  import { toastError, toastSuccess } from '$lib/ui/toast';

  const clp = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format;

  // URL base para exportar CSV
  const CSV_URL = `${API}/api/admin/orders/export-csv/`;

  // ------- Tipos de stats locales (adaptamos lo que viene del backend) -------
  type StatusStat = { status: string; count: number; total: number | string };
  type CategoryStat = { category: string | null; total: number | string };
  type ProductStat = { product: string | null; qty: number; total: number | string };

  // ------- Tipo de estado de orden -------
  type Status =
    | 'pending'
    | 'paid'
    | 'in_production'
    | 'ready'
    | 'delivered'
    | 'cancelled';

  // ------- Estado principal -------
  let loading = true;
  let error = '';

  let orders: AdminOrder[] = [];
  let count = 0;
  let page = 1;
  const PAGE_SIZE = 15;

  // filtros
  let statusFilter: 'all' | Status = 'all';
  let emailFilter = '';
  let dateFrom = '';
  let dateTo = '';

  // modal detalle
  let openModal = false;
  let detail: any = null;
  let loadingDetail = false;

  // cambios de estado
  let changing = new Set<number>();

  // ------- Estado de estadísticas -------
  let loadingStats = false;
  let stats: {
    by_status: StatusStat[];
    by_category: CategoryStat[];
    top_products: ProductStat[];
  } = {
    by_status: [],
    by_category: [],
    top_products: []
  };

  onMount(() => {
    load();
    loadStats();
  });

  // ------- helper para URL de CSV (respeta filtros) -------
  function buildCsvUrl(): string {
    const params = new URLSearchParams();

    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (emailFilter.trim()) params.set('email', emailFilter.trim());
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);

    const qs = params.toString();
    return qs ? `${CSV_URL}?${qs}` : CSV_URL;
  }

  // ------- Cargar órdenes -------  
  async function load() {
    loading = true;
    error = '';
    try {
      const params: AdminOrderListParams = {
        page,
        page_size: PAGE_SIZE,
        status: statusFilter
      };

      if (emailFilter.trim()) params.email = emailFilter.trim();
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const res = await adminListOrders(params);

      if (Array.isArray(res)) {
        orders = res;
        count = res.length;
      } else {
        orders = res.results ?? [];
        count = res.count ?? orders.length;
      }
    } catch (e: any) {
      error = String(e?.message ?? e);
      orders = [];
      count = 0;
      toastError(error);
    } finally {
      loading = false;
    }
  }

  // ------- Cargar estadísticas -------  
  async function loadStats() {
    loadingStats = true;
    try {
      const params: AdminOrderListParams = {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        email: emailFilter.trim() || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined
      };

      const res: any = await adminGetOrderStats(params);

      // Adaptamos el shape del backend al shape local usado en el template
      stats = {
        by_status: (res.by_status ?? []).map((s: any) => ({
          status: s.status,
          count: s.count ?? 0,
          total: s.total ?? 0
        })),
        by_category: (res.by_category ?? []).map((c: any) => ({
          category: c.name ?? 'Sin categoría',
          total: c.total ?? 0
        })),
        top_products: (res.top_products ?? []).map((p: any) => ({
          product: p.name ?? 'Producto',
          qty: p.qty ?? 0,
          total: p.total ?? 0
        }))
      };
    } catch (e: any) {
      toastError(String(e?.message ?? e));
      stats = { by_status: [], by_category: [], top_products: [] };
    } finally {
      loadingStats = false;
    }
  }

  function applyFilters() {
    page = 1;
    load();
    loadStats();
  }

  function resetFilters() {
    statusFilter = 'all';
    emailFilter = '';
    dateFrom = '';
    dateTo = '';
    page = 1;
    load();
    loadStats();
  }

  $: totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  // ------- Detalle y cambio de estado -------  
  async function openDetail(order: AdminOrder) {
    openModal = true;
    loadingDetail = true;
    detail = null;
    try {
      detail = await adminGetOrder(order.id);
    } catch (e: any) {
      toastError(String(e?.message ?? e));
    } finally {
      loadingDetail = false;
    }
  }

  function closeModal() {
    if (loadingDetail) return;
    openModal = false;
    detail = null;
  }

  async function changeStatus(order: AdminOrder, newStatus: Status) {
    if (order.status === newStatus) return;

    let confirmMsg = `¿Cambiar la orden ${order.number} a estado "${statusLabel(
      newStatus
    )}"?`;

    if (newStatus === 'paid') {
      confirmMsg = `¿Marcar la orden ${order.number} como PAGADA?`;
    } else if (newStatus === 'cancelled') {
      confirmMsg = `¿Cancelar la orden ${order.number}?`;
    }

    if (!confirm(confirmMsg)) return;

    const setCopy = new Set(changing);
    setCopy.add(order.id);
    changing = setCopy;

    const prevStatus = order.status;

    // optimista
    orders = orders.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o));
    if (detail && detail.id === order.id) {
      detail = { ...detail, status: newStatus };
    }

    try {
      await adminUpdateOrderStatus(order.id, newStatus);
      toastSuccess('Estado actualizado');
      // refrescar stats porque cambió el estado
      loadStats();
    } catch (e: any) {
      // revertir
      orders = orders.map((o) => (o.id === order.id ? { ...o, status: prevStatus } : o));
      if (detail && detail.id === order.id) {
        detail = { ...detail, status: prevStatus };
      }
      toastError(String(e?.message ?? e));
    } finally {
      const copy2 = new Set(changing);
      copy2.delete(order.id);
      changing = copy2;
    }
  }

  function statusBadgeClass(status: string) {
    if (status === 'paid') return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
    if (status === 'pending') return 'bg-amber-50 text-amber-700 ring-amber-200';
    if (status === 'in_production')
      return 'bg-sky-50 text-sky-700 ring-sky-200';
    if (status === 'ready') return 'bg-indigo-50 text-indigo-700 ring-indigo-200';
    if (status === 'delivered')
      return 'bg-slate-900/90 text-white ring-slate-300';
    if (status === 'cancelled') return 'bg-rose-50 text-rose-700 ring-rose-200';
    return 'bg-slate-50 text-slate-600 ring-slate-200';
  }

  function statusLabel(status: string) {
    if (status === 'paid') return 'Pagada';
    if (status === 'pending') return 'Pendiente';
    if (status === 'in_production') return 'En producción';
    if (status === 'ready') return 'Lista para retiro';
    if (status === 'delivered') return 'Entregada';
    if (status === 'cancelled') return 'Cancelada';
    return status;
  }

  function parseNotes(notes: string) {
    if (!notes) return { user: [], system: [] };
    const lines = notes.split('\n').filter((l) => l.trim());
    const user = lines.filter((l) => !l.startsWith('[MP'));
    const system = lines.filter((l) => l.startsWith('[MP'));
    return { user, system };
  }
</script>

<section class="mx-auto max-w-7xl px-4 py-6 space-y-6">
  <!-- Header -->
  <header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div class="space-y-1">
      <h1 class="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
        Órdenes
      </h1>
      <p class="text-slate-600 text-sm sm:text-base">
        Revisa pedidos, cambia estados y ve el detalle de cada compra.
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-3 text-xs text-slate-500">
      <div class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
        <span class="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <span class="font-medium text-slate-800">{orders.length}</span>
        <span>mostradas</span>
      </div>
      <div>
        de <span class="font-semibold text-slate-800">{count}</span> órdenes
      </div>
    </div>
  </header>

  <!-- Filtros -->
  <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
    <div class="flex flex-wrap gap-3 items-end">
      <label class="flex-1 min-w-[200px]">
        <span class="block text-xs text-slate-600 mb-1">Buscar por email</span>
        <input
          type="search"
          placeholder="cliente@correo.com"
          bind:value={emailFilter}
          class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
        />
      </label>

      <label>
        <span class="block text-xs text-slate-600 mb-1">Estado</span>
        <select
          bind:value={statusFilter}
          class="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
        >
          <option value="all">Todos</option>
          <option value="pending">Pendiente</option>
          <option value="paid">Pagada</option>
          <option value="in_production">En producción</option>
          <option value="ready">Lista para retiro</option>
          <option value="delivered">Entregada</option>
          <option value="cancelled">Cancelada</option>
        </select>
      </label>

      <label>
        <span class="block text-xs text-slate-600 mb-1">Desde</span>
        <input
          type="date"
          bind:value={dateFrom}
          class="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
        />
      </label>

      <label>
        <span class="block text-xs text-slate-600 mb-1">Hasta</span>
        <input
          type="date"
          bind:value={dateTo}
          class="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
        />
      </label>

      <div class="ml-auto flex items-center gap-2">
        <!-- Botón exportar CSV -->
        <a
          href={buildCsvUrl()}
          class="rounded-xl px-3 py-2 text-sm bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1"
        >
          ⬇️ Exportar CSV
        </a>

        <button
          type="button"
          class="rounded-xl px-3 py-2 text-sm ring-1 ring-slate-300 hover:bg-slate-50"
          on:click={resetFilters}
        >
          Limpiar
        </button>
        <button
          type="button"
          class="rounded-xl px-4 py-2 text-sm bg-slate-900 text-white hover:bg-black"
          on:click={applyFilters}
        >
          Aplicar
        </button>
      </div>
    </div>

    <!-- Resumen rápido de stats -->
    <div class="border-t border-slate-100 pt-3">
      <header class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-500">
          <span class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
            <span class="h-1.5 w-1.5 rounded-full bg-amber-500" />
            {count} orden{count === 1 ? '' : 'es'} totales
          </span>
          <span class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
            <span class="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {orders.filter((o) => o.status === 'paid').length} pagadas en esta página
          </span>
        </div>

        {#if loadingStats}
          <p class="text-xs text-slate-400">Calculando estadísticas…</p>
        {:else}
          <div class="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span class="inline-flex items-center gap-1">
              <span class="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {stats.by_status.length} estados
            </span>
            <span class="inline-flex items-center gap-1">
              <span class="h-1.5 w-1.5 rounded-full bg-sky-500" />
              {stats.by_category.length} categorías
            </span>
            <span class="inline-flex items-center gap-1">
              <span class="h-1.5 w-1.5 rounded-full bg-violet-500" />
              {stats.top_products.length} productos destacados
            </span>
          </div>
        {/if}
      </header>
    </div>
  </div>

  <!-- Mini dashboard de estadísticas -->
  <div class="grid gap-4 lg:grid-cols-3">
    <!-- Estados -->
    <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 class="text-sm font-semibold text-slate-800 mb-2">Ventas por estado</h3>

      {#if stats.by_status && stats.by_status.length}
        <table class="w-full text-xs">
          <tbody>
            {#each stats.by_status as s}
              <tr class="border-b last:border-0 border-slate-100">
                <td class="py-1.5 pr-2">
                  <span
                    class={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ring-1 ${statusBadgeClass(
                      s.status
                    )}`}
                  >
                    <span class="h-1.5 w-1.5 rounded-full bg-current/80" />
                    {statusLabel(s.status)}
                  </span>
                </td>
                <td class="py-1.5 text-right text-slate-700">
                  {s.count}
                </td>
                <td class="py-1.5 text-right text-slate-700">
                  {clp(Number(s.total || 0))}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {:else}
        <p class="text-xs text-slate-500">
          Aún no hay datos de estados.
        </p>
      {/if}
    </div>

    <!-- Ventas por categoría -->
    <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 class="text-sm font-semibold text-slate-800 mb-2">
        Ventas por categoría
      </h3>

      {#if stats.by_category && stats.by_category.length}
        <div class="space-y-2">
          {#each stats.by_category as c}
            <div class="flex items-center justify-between gap-2 text-xs">
              <div class="flex-1 min-w-0">
                <p class="truncate text-slate-700">
                  {c.category || 'Sin categoría'}
                </p>
              </div>
              <div class="text-right text-slate-700">
                {clp(Number(c.total || 0))}
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-xs text-slate-500">
          No hay ventas agrupadas por categoría todavía.
        </p>
      {/if}
    </div>

    <!-- Productos más vendidos -->
    <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 class="text-sm font-semibold text-slate-800 mb-2">
        Productos más vendidos
      </h3>

      {#if stats.top_products && stats.top_products.length}
        <div class="space-y-2 text-xs">
          {#each stats.top_products as p, idx}
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2 min-w-0">
                <span
                  class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[11px] font-medium text-slate-700"
                >
                  {idx + 1}
                </span>
                <div class="min-w-0">
                  <p class="truncate text-slate-700">
                    {p.product || 'Producto'}
                  </p>
                  <p class="text-[11px] text-slate-500">
                    {p.qty} unidad(es)
                  </p>
                </div>
              </div>
              <div class="text-right text-slate-700">
                {clp(Number(p.total || 0))}
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-xs text-slate-500">
          Aún no hay productos con ventas suficientes.
        </p>
      {/if}
    </div>
  </div>

  <!-- Tabla principal -->
  <div class="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
    {#if loading}
      <div class="p-6 space-y-3">
        {#each Array(6) as _}
          <div class="h-9 rounded bg-slate-100 animate-pulse" />
        {/each}
      </div>
    {:else if error}
      <div class="p-6">
        <p class="text-rose-600 text-sm">{error}</p>
      </div>
    {:else if !orders.length}
      <div class="p-6">
        <p class="text-slate-600 text-sm">
          No se encontraron órdenes con esos filtros.
        </p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th class="px-4 py-3 text-left">N°</th>
              <th class="px-4 py-3 text-left">Fecha</th>
              <th class="px-4 py-3 text-left">Cliente</th>
              <th class="px-4 py-3 text-right">Total</th>
              <th class="px-4 py-3 text-left">Estado</th>
              <th class="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            {#each orders as o (o.id)}
              <tr class="hover:bg-slate-50/80">
                <td class="px-4 py-3 font-mono text-xs text-slate-700">
                  #{o.number}
                </td>
                <td class="px-4 py-3 text-slate-700 whitespace-nowrap">
                  {new Date(o.created_at).toLocaleString('es-CL', {
                    dateStyle: 'short',
                    timeStyle: 'short'
                  })}
                </td>
                <td class="px-4 py-3 text-slate-700 max-w-[220px]">
                  <div class="truncate">{o.email}</div>
                </td>
                <td class="px-4 py-3 text-right font-medium text-slate-900">
                  {clp(Number(o.total || 0))}
                </td>
                <td class="px-4 py-3">
                  <span
                    class={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${statusBadgeClass(
                      o.status
                    )}`}
                  >
                    <span class="h-1.5 w-1.5 rounded-full bg-current/80" />
                    {statusLabel(o.status)}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex justify-end items-center gap-2">
                    <button
                      type="button"
                      class="rounded-lg px-2.5 py-1.5 text-xs ring-1 ring-slate-300 text-slate-700 hover:bg-slate-50"
                      on:click={() => openDetail(o)}
                    >
                      Ver detalle
                    </button>

                    <select
                      class="rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/70 bg-white"
                      value={o.status}
                      on:change={(e) =>
                        changeStatus(
                          o,
                          (e.currentTarget as HTMLSelectElement).value as Status
                        )}
                      disabled={changing.has(o.id)}
                    >
                      <option value="pending">Pendiente</option>
                      <option value="paid">Pagada</option>
                      <option value="in_production">En producción</option>
                      <option value="ready">Lista para retiro</option>
                      <option value="delivered">Entregada</option>
                      <option value="cancelled">Cancelada</option>
                    </select>

                    {#if changing.has(o.id)}
                      <span class="text-[11px] text-slate-400">Guardando…</span>
                    {/if}
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      <div class="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 text-sm">
        <div class="text-slate-600">
          Página {page} de {totalPages}
        </div>
        <div class="flex items-center gap-2">
          <button
            class="rounded-lg px-3 py-1.5 ring-1 ring-slate-300 disabled:opacity-50 hover:bg-slate-50"
            on:click={() => {
              if (page > 1) {
                page -= 1;
                load();
              }
            }}
            disabled={page <= 1}
          >
            ← Anterior
          </button>
          <button
            class="rounded-lg px-3 py-1.5 ring-1 ring-slate-300 disabled:opacity-50 hover:bg-slate-50"
            on:click={() => {
              if (page < totalPages) {
                page += 1;
                load();
              }
            }}
            disabled={page >= totalPages}
          >
            Siguiente →
          </button>
        </div>
      </div>
    {/if}
  </div>

  <!-- Modal detalle -->
  {#if openModal}
    <div class="fixed inset-0 z-40 grid place-items-center p-4">
      <div class="absolute inset-0 bg-black/40" on:click={closeModal}></div>

      <div
        class="relative w-full max-w-2xl rounded-2xl bg-white shadow-xl ring-1 ring-black/5 p-5 max-h-[90vh] overflow-auto"
      >
        <div class="flex items-start justify-between gap-3 mb-3">
          <div>
            <h2 class="text-lg font-semibold text-slate-900">
              Detalle de orden
            </h2>
            {#if detail}
              <p class="text-xs text-slate-500 mt-0.5">
                N° {detail.number} · {detail.email}
              </p>
            {/if}
          </div>
          <button
            class="rounded p-1 hover:bg-slate-100"
            on:click={closeModal}
            aria-label="Cerrar"
          >
            <svg class="h-5 w-5 text-slate-500" viewBox="0 0 24 24" fill="none">
              <path stroke="currentColor" stroke-linecap="round" stroke-width="1.5" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {#if loadingDetail}
          <div class="space-y-3">
            <div class="h-4 rounded bg-slate-100 animate-pulse" />
            <div class="h-4 rounded bg-slate-100 animate-pulse" />
            <div class="h-24 rounded bg-slate-100 animate-pulse" />
          </div>
        {:else if !detail}
          <p class="text-sm text-rose-600">
            No se pudo cargar el detalle.
          </p>
        {:else}
          <div class="space-y-4 text-sm">
            <div class="flex flex-wrap gap-4 justify-between">
              <div>
                <p class="text-xs text-slate-500">Cliente</p>
                <p class="text-slate-800">{detail.full_name || '-'}</p>
                <p class="text-xs text-slate-500">{detail.email}</p>
                {#if detail.phone}
                  <p class="text-xs text-slate-500 mt-0.5">Tel: {detail.phone}</p>
                {/if}
              </div>
              <div class="text-right">
                <p class="text-xs text-slate-500">Fecha</p>
                <p class="text-slate-800">
                  {new Date(detail.created_at).toLocaleString('es-CL', {
                    dateStyle: 'short',
                    timeStyle: 'short'
                  })}
                </p>
                <p class="mt-1 text-xs text-slate-500">
                  Estado:
                  <span
                    class={`ml-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ring-1 ${statusBadgeClass(
                      detail.status
                    )}`}
                  >
                    {statusLabel(detail.status)}
                  </span>
                </p>
              </div>
            </div>

            {#if detail.address || detail.city || detail.region}
              <div class="border border-slate-200 rounded-xl p-3 bg-slate-50/60">
                <p class="text-xs font-semibold text-slate-600 mb-1">Dirección</p>
                <p class="text-slate-700">
                  {detail.address || '—'}
                </p>
                <p class="text-xs text-slate-500">
                  {detail.city || ''} {detail.region ? `· ${detail.region}` : ''}
                </p>
              </div>
            {/if}

            <div>
              <p class="text-xs font-semibold text-slate-600 mb-2">
                Ítems ({detail.items?.length || 0})
              </p>
              <div class="border border-slate-200 rounded-xl divide-y divide-slate-200">
                {#if detail.items?.length}
                  {#each detail.items as it}
                    <div class="flex items-center justify-between px-3 py-2">
                      <div class="min-w-0">
                        <p class="text-sm text-slate-800 truncate">
                          {it.product_name || `Producto #${it.product}`}
                        </p>
                        <p class="text-xs text-slate-500">
                          {it.qty} x {clp(Number(it.unit_price || 0))}
                        </p>
                      </div>
                      <div class="text-sm font-medium text-slate-900">
                        {clp(Number(it.subtotal || 0))}
                      </div>
                    </div>
                  {/each}
                {:else}
                  <p class="px-3 py-3 text-xs text-slate-500">
                    No hay ítems en esta orden.
                  </p>
                {/if}
              </div>
            </div>

            <div class="flex flex-col items-end gap-1 text-sm">
              <div class="flex justify-between gap-4 w-full sm:w-1/2">
                <span class="text-slate-600">Subtotal</span>
                <span class="font-medium text-slate-800">
                  {clp(Number(detail.subtotal || 0))}
                </span>
              </div>
              <div class="flex justify-between gap-4 w-full sm:w-1/2">
                <span class="text-slate-600">Envío</span>
                <span class="font-medium text-slate-800">
                  {clp(Number(detail.shipping || 0))}
                </span>
              </div>
              <div class="flex justify-between gap-4 w-full sm:w-1/2 pt-1 border-t border-slate-200 mt-1">
                <span class="font-semibold text-slate-900">Total</span>
                <span class="font-semibold text-slate-900">
                  {clp(Number(detail.total || 0))}
                </span>
              </div>
            </div>

            {#if detail.notes}
              {@const { user, system } = parseNotes(detail.notes)}
              
              <div class="mt-6 space-y-4">
                <!-- Notas del Usuario -->
                {#if user.length > 0}
                  <div class="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
                    <div class="flex items-center gap-2.5 mb-3">
                      <div class="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <h3 class="text-sm font-bold text-slate-900">Datos de quien retira</h3>
                        <p class="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Información del cliente</p>
                      </div>
                    </div>
                    <div class="bg-white rounded-xl border border-amber-100 p-3 shadow-sm">
                      {#each user as line}
                        <p class="text-sm text-slate-700 leading-relaxed">{line}</p>
                      {/each}
                    </div>
                  </div>
                {/if}

                <!-- Logs del Sistema (Pagos) -->
                {#if system.length > 0}
                  <div class="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                    <div class="flex items-center gap-2.5 mb-3">
                      <div class="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 class="text-sm font-bold text-slate-900">Registro de Pagos</h3>
                        <p class="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Información del sistema</p>
                      </div>
                    </div>
                    <div class="space-y-2">
                      {#each system as line}
                        <div class="flex items-start gap-2 bg-white border border-slate-200 rounded-lg p-2 shadow-sm">
                          <div class="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0"></div>
                          <code class="text-xs font-mono text-slate-600 break-all">{line}</code>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</section>
