<script lang="ts">
  import { onMount } from 'svelte';
  import {
    adminGetOrderStats,
    type AdminOrderStats,
    adminGetVisitStats,
    type VisitPoint
  } from '$lib/api.admin';
  import { toastError } from '$lib/ui/toast';

  const clp = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format;

  // estados de carga
  let loading = true;        // botón "Actualizar" (ventas)
  let initialLoading = true; // skeleton sólo primera vez
  let loadingVisits = true;  // gráfico de visitas

  // stats de ventas
  let stats: AdminOrderStats = {
    total_orders: 0,
    total_revenue: 0,
    last_30_revenue: 0,
    last_30_count: 0,
    by_status: [],
    by_category: [],
    top_products: []
  };

  // puntos del gráfico de visitas
  let visitPoints: VisitPoint[] = [];

  onMount(async () => {
    await Promise.all([loadStats(), loadVisits()]);
    initialLoading = false;
  });

  async function loadStats() {
    loading = true;
    try {
      const res = await adminGetOrderStats();
      stats = {
        total_orders: Number(res.total_orders ?? 0),
        total_revenue: Number(res.total_revenue ?? 0),
        last_30_revenue: Number(res.last_30_revenue ?? 0),
        last_30_count: Number(res.last_30_count ?? 0),
        by_status: res.by_status ?? [],
        by_category: res.by_category ?? [],
        top_products: res.top_products ?? []
      };
    } catch (e: any) {
      toastError(String(e?.message ?? e));
    } finally {
      loading = false;
    }
  }

  async function loadVisits() {
    loadingVisits = true;
    try {
      const res = await adminGetVisitStats(14); // últimos 14 días
      visitPoints = res.points ?? [];
    } catch (e: any) {
      toastError(String(e?.message ?? e));
    } finally {
      loadingVisits = false;
    }
  }

  function statusLabel(status: string) {
    if (status === 'paid') return 'Pagada';
    if (status === 'pending') return 'Pendiente';
    if (status === 'in_production') return 'En producción';
    if (status === 'ready') return 'Lista';
    if (status === 'delivered') return 'Entregada';
    if (status === 'cancelled') return 'Cancelada';
    return status;
  }

  function statusColorClass(status: string) {
    if (status === 'paid') return 'bg-emerald-500';
    if (status === 'pending') return 'bg-amber-500';
    if (status === 'in_production') return 'bg-sky-500';
    if (status === 'cancelled') return 'bg-rose-500';
    return 'bg-slate-400';
  }

  // máximos para normalizar barras de ventas
  $: maxCatTotal = stats.by_category.length
    ? Math.max(...stats.by_category.map((c) => Number(c.total || 0)))
    : 1;

  $: maxStatusCount = stats.by_status.length
    ? Math.max(...stats.by_status.map((s) => Number(s.count || 0)))
    : 1;

  $: maxProductQty = stats.top_products.length
    ? Math.max(...stats.top_products.map((p) => Number(p.qty || 0)))
    : 1;

  // datos para gráfico de visitas
  $: maxVisits = visitPoints.length
    ? Math.max(...visitPoints.map((p) => Number(p.visits || 0)))
    : 1;

  $: safeMaxVisits = maxVisits || 1;

  function fmtDayLabel(dateStr: string) {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'short'
      });
    } catch {
      return dateStr;
    }
  }
</script>

<section class="mx-auto max-w-7xl px-4 py-6 space-y-6">
  <!-- Header -->
  <header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div class="space-y-1">
      <h1 class="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
        Estadísticas de ventas y visitas
      </h1>
      <p class="text-slate-600 text-sm sm:text-base">
        Resumen de órdenes, ingresos, desempeño por estado/categoría/producto y visitas al sitio.
      </p>
    </div>

    <div class="flex items-center gap-2">
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-black disabled:opacity-60"
        on:click={() => { loadStats(); loadVisits(); }}
        disabled={loading || loadingVisits}
      >
        {#if loading || loadingVisits}
          <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 0 1 8-8v3a5 5 0 0 0-5 5H4z"
            />
          </svg>
          Actualizando…
        {:else}
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 4v6h6M20 20v-6h-6"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M5 15a7 7 0 0 0 11 3l3-3M19 9a7 7 0 0 0-11-3L5 9"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Actualizar
        {/if}
      </button>
    </div>
  </header>

  <!-- KPIs -->
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p class="text-xs font-medium text-slate-500 mb-1">Órdenes pagadas</p>
      <p class="text-2xl font-semibold text-slate-900">
        {stats.total_orders}
      </p>
      <p class="mt-1 text-xs text-slate-500">
        Total de órdenes con estado <span class="font-semibold">pagada</span>.
      </p>
    </div>

    <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p class="text-xs font-medium text-slate-500 mb-1">Ingresos totales</p>
      <p class="text-2xl font-semibold text-slate-900">
        {clp(stats.total_revenue || 0)}
      </p>
      <p class="mt-1 text-xs text-slate-500">
        Considerando sólo órdenes pagadas.
      </p>
    </div>

    <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p class="text-xs font-medium text-slate-500 mb-1">Últimos 30 días</p>
      <p class="text-2xl font-semibold text-slate-900">
        {clp(stats.last_30_revenue || 0)}
      </p>
      <p class="mt-1 text-xs text-slate-500">
        {stats.last_30_count} orden(es) pagada(s) en los últimos 30 días.
      </p>
    </div>

    <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p class="text-xs font-medium text-slate-500 mb-1">Ticket promedio (30 días)</p>
      <p class="text-2xl font-semibold text-slate-900">
        {stats.last_30_count
          ? clp((stats.last_30_revenue || 0) / stats.last_30_count)
          : '—'}
      </p>
      <p class="mt-1 text-xs text-slate-500">
        Promedio por orden pagada del último mes.
      </p>
    </div>
  </div>

  <!-- Gráficos / paneles  -->
  {#if initialLoading}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <!-- svelte-ignore element_invalid_self_closing_tag -->
      <div class="h-64 rounded-2xl bg-slate-100 animate-pulse" />
      <!-- svelte-ignore element_invalid_self_closing_tag -->
      <div class="h-64 rounded-2xl bg-slate-100 animate-pulse" />
      <!-- svelte-ignore element_invalid_self_closing_tag -->
      <div class="h-64 rounded-2xl bg-slate-100 animate-pulse" />
    </div>
  {:else}
    <div class="grid gap-4 lg:grid-cols-3" class:opacity-60={loading || loadingVisits}>
      <!-- Órdenes por estado -->
      <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col">
        <h2 class="text-sm font-semibold text-slate-900 mb-2">
          Órdenes por estado
        </h2>
        <p class="text-xs text-slate-500 mb-3">
          Cantidad y monto total por estado de la orden.
        </p>

        {#if stats.by_status.length}
          <div class="space-y-3">
            {#each stats.by_status as s}
              <div class="flex items-center gap-3">
                <!-- svelte-ignore element_invalid_self_closing_tag -->
                <span class={`h-2.5 w-2.5 rounded-full ${statusColorClass(s.status)}`} />
                <div class="flex-1 min-w-0">
                  <div class="flex justify-between text-xs text-slate-600 mb-1">
                    <span>{statusLabel(s.status)}</span>
                    <span>{s.count} orden(es)</span>
                  </div>
                  <div class="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <!-- svelte-ignore element_invalid_self_closing_tag -->
                    <div
                      class={`h-full rounded-full ${statusColorClass(s.status)}`}
                      style={`width: ${(Number(s.count || 0) / maxStatusCount) * 100}%;`}
                    />
                  </div>
                  <p class="mt-1 text-xs text-slate-500">
                    {clp(Number(s.total || 0))}
                  </p>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-xs text-slate-500">Aún no hay datos de órdenes.</p>
        {/if}
      </section>

      <!-- Ventas por categoría -->
      <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col">
        <h2 class="text-sm font-semibold text-slate-900 mb-2">
          Ventas por categoría
        </h2>
        <p class="text-xs text-slate-500 mb-3">
          Total vendido por categoría en órdenes pagadas.
        </p>

        {#if stats.by_category.length}
          <div class="space-y-3">
            {#each stats.by_category as c}
              <div class="space-y-1">
                <div class="flex justify-between text-xs text-slate-600">
                  <span class="truncate">{c.name}</span>
                  <span>{clp(Number(c.total || 0))}</span>
                </div>
                <div class="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <!-- svelte-ignore element_invalid_self_closing_tag -->
                  <div
                    class="h-full rounded-full bg-amber-500"
                    style={`width: ${(Number(c.total || 0) / maxCatTotal) * 100}%;`}
                  />
                </div>
                <p class="text-[11px] text-slate-500">
                  {c.qty} unidad(es)
                </p>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-xs text-slate-500">No hay categorías con ventas aún.</p>
        {/if}
      </section>

      <!-- Top productos -->
      <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col">
        <h2 class="text-sm font-semibold text-slate-900 mb-2">
          Top productos
        </h2>
        <p class="text-xs text-slate-500 mb-3">
          Productos más vendidos (sólo órdenes pagadas).
        </p>

        {#if stats.top_products.length}
          <div class="space-y-3">
            {#each stats.top_products as p, i}
              <div class="flex items-center gap-3">
                <div class="h-7 w-7 rounded-full bg-slate-900 text-xs text-white flex items-center justify-center">
                  {i + 1}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-slate-900 truncate">
                    {p.name}
                  </p>
                  <p class="text-[11px] text-slate-500">
                    {p.qty} unidad(es) · {clp(Number(p.total || 0))}
                  </p>
                  <div class="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <!-- svelte-ignore element_invalid_self_closing_tag -->
                    <div
                      class="h-full rounded-full bg-emerald-500"
                      style={`width: ${(Number(p.qty || 0) / maxProductQty) * 100}%;`}
                    />
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-xs text-slate-500">Aún no hay productos vendidos.</p>
        {/if}
      </section>
    </div>

    <!-- 🔹 Gráfico de tendencia de visitas (últimos 14 días) -->
    <section class="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="flex items-center justify-between gap-2 mb-3">
        <div>
          <h2 class="text-sm font-semibold text-slate-900">
            Tendencia de visitas al sitio (14 días)
          </h2>
          <p class="text-xs text-slate-500">
            Número de visitas registradas por día en el sitio web.
          </p>
        </div>

        {#if visitPoints.length}
          <p class="text-xs text-slate-500">
            Máximo diario: <span class="font-semibold">{maxVisits}</span> visita(s)
          </p>
        {/if}
      </div>

      {#if loadingVisits}
        <!-- svelte-ignore element_invalid_self_closing_tag -->
        <div class="h-40 rounded-xl bg-slate-100 animate-pulse" />
      {:else if !visitPoints.length}
        <p class="text-xs text-slate-500">
          Aún no hay visitas registradas. Cuando el layout llame a
          <code class="px-1 rounded bg-slate-100 text-[11px]">trackVisitOncePerDay()</code>,
          aquí verás la tendencia.
        </p>
      {:else}
        <div class="h-56 flex flex-col justify-between">
          <!-- gráfico tipo barras verticales -->
          <div class="flex-1 h-40 flex items-end gap-[4px] border-b border-slate-100 pb-3">
            {#each visitPoints as p}
              <div class="flex-1 min-w-[6px] flex flex-col items-center gap-1 h-full">
                <!-- svelte-ignore element_invalid_self_closing_tag -->
                <div
                  class="w-full rounded-t-full bg-sky-500 hover:bg-sky-600 transition-all"
                  style={`height: ${
                    Math.max(8, (Number(p.visits || 0) / safeMaxVisits) * 100)
                  }%; min-height: 4px;`}
                  title={`${fmtDayLabel(p.date)} · ${p.visits} visita(s)`}
                />
              </div>
            {/each}
          </div>

          <!-- labels de días (cada 3 para no saturar) -->
          <div class="mt-1 flex gap-[4px] text-[10px] text-slate-500">
            {#each visitPoints as p, i}
              <div class="flex-1 min-w-[6px] text-center">
                {#if i % 3 === 0}
                  {fmtDayLabel(p.date)}
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </section>
  {/if}
</section>

