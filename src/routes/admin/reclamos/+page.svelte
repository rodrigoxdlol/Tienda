<script lang="ts">
  import { onMount } from 'svelte';
  import {
    adminListContactMessages,
    adminUpdateContactMessage,
    type AdminContactMessage,
    type ContactStatus
  } from '$lib/api';

  let loading = true;
  let saving = false;
  let error = '';
  let items: AdminContactMessage[] = [];

  // selección
  let selected: AdminContactMessage | null = null;
  let replyText = '';

  // filtros
  let filter: ContactStatus | 'all' = 'pending';
  let search = '';

  // paginación
  const PAGE_SIZE = 10;
  let currentPage = 1;

  async function loadItems() {
    loading = true;
    error = '';
    try {
      const data = await adminListContactMessages();
      // orden más nuevo primero
      items = [...data].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } catch (e) {
      console.error(e);
      error = 'No se pudieron cargar los reclamos.';
    } finally {
      loading = false;
    }
  }

  onMount(loadItems);

  function selectRow(item: AdminContactMessage) {
    selected = item;
    replyText = item.admin_reply ?? '';
  }

  function shortDate(d: string | null) {
    if (!d) return '-';
    return d.replace('T', ' ').slice(0, 16);
  }

  function statusLabel(s: ContactStatus) {
    if (s === 'pending') return 'Pendiente';
    if (s === 'answered') return 'Respondido';
    return 'Cerrado';
  }

  const badgeClasses = (s: ContactStatus) => {
    if (s === 'pending') return 'bg-amber-100 text-amber-800 ring-amber-200';
    if (s === 'answered') return 'bg-green-100 text-green-800 ring-green-200';
    return 'bg-slate-100 text-slate-700 ring-slate-200';
  };

  // === Derivados: contadores, filtro, paginación ===
  $: countPending = items.filter((i) => i.status === 'pending').length;
  $: countAnswered = items.filter((i) => i.status === 'answered').length;
  $: countClosed = items.filter((i) => i.status === 'closed').length;
  $: totalCount = items.length;

  $: filteredItems = items.filter((i) => {
    if (filter !== 'all' && i.status !== filter) return false;

    const q = search.trim().toLowerCase();
    if (!q) return true;

    return (
      i.name.toLowerCase().includes(q) ||
      i.email.toLowerCase().includes(q) ||
      (i.subject || '').toLowerCase().includes(q) ||
      (i.message || '').toLowerCase().includes(q)
    );
  });

  $: totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));

  // reiniciar página cuando cambien filtros o datos
  $: resetKey = `${filter}-${search}-${filteredItems.length}`;
  $: if (resetKey) {
    currentPage = 1;
  }

  $: paginatedItems = filteredItems.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function goToPage(page: number) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
  }

  // === Guardar respuesta ===
async function saveReply() {
  if (!selected) return;
  saving = true;
  error = '';
  try {
    const newStatus: ContactStatus =
      replyText.trim() && selected.status === 'pending'
        ? 'answered'
        : (selected.status as ContactStatus);

    const updated = await adminUpdateContactMessage(selected.id, {
      admin_reply: replyText.trim(),
      status: newStatus
    });

    // actualizar lista
    const idx = items.findIndex((x) => x.id === updated.id);
    if (idx !== -1) {
      items = [
        ...items.slice(0, idx),
        updated,
        ...items.slice(idx + 1)
      ];
    }

    // si ya no calza con el filtro actual, cerramos el panel
    if (filter !== 'all' && updated.status !== filter) {
      selected = null;
      replyText = '';
    } else {
      selected = updated;
    }
  } catch (e) {
    console.error(e);
    error = 'No se pudo guardar la respuesta.';
  } finally {
    saving = false;
  }
}

</script>

<main class="p-4 md:p-6">
  <section class="max-w-6xl mx-auto space-y-4">
    <!-- Encabezado -->
    <header class="space-y-3">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 class="text-xl md:text-2xl font-semibold text-slate-900">
            Reclamos y opiniones
          </h1>
          <p class="text-sm text-slate-500">
            Gestiona los mensajes enviados desde el formulario de contacto y responde a tus clientes.
          </p>
        </div>

        <div class="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div class="flex items-center gap-2">
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="text-xs font-medium text-slate-500">Estado:</label>
            <select
              bind:value={filter}
              class="rounded-full border border-slate-300 text-xs px-3 py-1.5
                     focus:outline-none focus:ring-2 focus:ring-amber-500/70 focus:border-amber-500 bg-white"
            >
              <option value="pending">Pendientes</option>
              <option value="answered">Respondidos</option>
              <option value="closed">Cerrados</option>
              <option value="all">Todos</option>
            </select>
          </div>

          <div class="relative">
            <input
              type="search"
              placeholder="Buscar por nombre, email, asunto o mensaje…"
              bind:value={search}
              class="w-full sm:w-64 rounded-full border border-slate-300 pl-8 pr-3 py-1.5 text-xs
                     focus:outline-none focus:ring-2 focus:ring-amber-500/70 focus:border-amber-500"
            />
            <span class="absolute left-2 top-1.5 text-slate-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="6" stroke="currentColor" stroke-width="2" />
                <path d="m16 16 3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div class="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
          <p class="text-[11px] text-slate-500">Pendientes</p>
          <p class="mt-1 text-lg font-semibold text-slate-900">{countPending}</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
          <p class="text-[11px] text-slate-500">Respondidos</p>
          <p class="mt-1 text-lg font-semibold text-slate-900">{countAnswered}</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
          <p class="text-[11px] text-slate-500">Cerrados</p>
          <p class="mt-1 text-lg font-semibold text-slate-900">{countClosed}</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
          <p class="text-[11px] text-slate-500">Total</p>
          <p class="mt-1 text-lg font-semibold text-slate-900">{totalCount}</p>
        </div>
      </div>
    </header>

    {#if error}
      <div class="rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-3 py-2">
        {error}
      </div>
    {/if}

    <div class="grid lg:grid-cols-5 gap-4 items-start">
      <!-- Tabla -->
      <div class="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col">
        <div class="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-slate-800">Mensajes</h2>
          {#if loading}
            <span class="text-xs text-slate-400">Cargando…</span>
          {:else}
            <span class="text-[11px] text-slate-400">
              Mostrando {paginatedItems.length} de {filteredItems.length}
            </span>
          {/if}
        </div>

        <div class="overflow-x-auto max-h-[520px]">
          <table class="min-w-full text-xs md:text-sm">
            <thead class="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
              <tr class="text-left text-[11px] md:text-xs text-slate-500 uppercase tracking-wide">
                <th class="px-3 py-2">Nombre</th>
                <th class="px-3 py-2">Email</th>
                <th class="px-3 py-2">Asunto</th>
                <th class="px-3 py-2">Fecha</th>
                <th class="px-3 py-2">Estado</th>
                <th class="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {#if loading}
                {#each Array(5) as _, i}
                  <tr class="border-b border-slate-100">
                    <td class="px-3 py-3" colspan="6">
                      <div class="animate-pulse h-3 rounded bg-slate-100 max-w-[80%] mb-2"></div>
                      <div class="animate-pulse h-3 rounded bg-slate-100 max-w-[40%]"></div>
                    </td>
                  </tr>
                {/each}
              {:else if paginatedItems.length === 0}
                <tr>
                  <td colspan="6" class="px-3 py-6 text-center text-xs text-slate-400">
                    No se encontraron mensajes con el filtro actual.
                  </td>
                </tr>
              {:else}
                {#each paginatedItems as item}
                  <tr
                    class="border-b last:border-b-0 border-slate-100 hover:bg-slate-50/70 cursor-pointer"
                    on:click={() => selectRow(item)}
                  >
                    <td class="px-3 py-2 whitespace-nowrap">
                      <div class="font-medium text-slate-800">{item.name}</div>
                      {#if item.phone}
                        <div class="text-[11px] text-slate-400">{item.phone}</div>
                      {/if}
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap text-slate-600">
                      {item.email}
                    </td>
                    <td class="px-3 py-2">
                      <div class="max-w-[180px] truncate">{item.subject || 'Sin asunto'}</div>
                      <div class="text-[11px] text-slate-400 max-w-[220px] truncate">
                        {item.message}
                      </div>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap text-slate-500">
                      {shortDate(item.created_at)}
                    </td>
                    <td class="px-3 py-2">
                      <span
                        class={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ${badgeClasses(
                          item.status
                        )}`}
                      >
                        {statusLabel(item.status)}
                      </span>
                    </td>
                    <td class="px-3 py-2 text-right">
                      <button
                        type="button"
                        class="text-[11px] font-medium text-amber-700 hover:text-amber-900 underline"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>

        <!-- Paginación -->
        {#if !loading && totalPages > 1}
          <div class="border-t border-slate-100 px-4 py-2 flex items-center justify-between text-[11px]">
            <span class="text-slate-400">
              Página {currentPage} de {totalPages}
            </span>
            <div class="flex items-center gap-1">
              <button
                type="button"
                on:click={() => goToPage(currentPage - 1)}
                class="px-2 py-1 rounded-full border border-slate-200 text-slate-600 text-[11px]
                       disabled:opacity-40 disabled:cursor-not-allowed bg-white hover:bg-slate-50"
                disabled={currentPage === 1}
              >
                ←
              </button>

              {#each Array(totalPages) as _, i}
                {#if totalPages <= 6 || i + 1 === 1 || i + 1 === totalPages || Math.abs(i + 1 - currentPage) <= 1}
                  <button
                    type="button"
                    on:click={() => goToPage(i + 1)}
                    class={`px-2 py-1 rounded-full border text-[11px] ${
                      currentPage === i + 1
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                {:else if Math.abs(i + 1 - currentPage) === 2}
                  <span class="px-1 text-slate-400">…</span>
                {/if}
              {/each}

              <button
                type="button"
                on:click={() => goToPage(currentPage + 1)}
                class="px-2 py-1 rounded-full border border-slate-200 text-slate-600 text-[11px]
                       disabled:opacity-40 disabled:cursor-not-allowed bg-white hover:bg-slate-50"
                disabled={currentPage === totalPages}
              >
                →
              </button>
            </div>
          </div>
        {/if}
      </div>

      <!-- Panel de detalle / respuesta -->
      <div class="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5">
        {#if selected}
          <header class="flex items-start justify-between gap-2 mb-3">
            <div>
              <h2 class="text-sm font-semibold text-slate-900">
                {selected.subject || 'Sin asunto'}
              </h2>
              <p class="text-xs text-slate-500">
                {selected.name} · {selected.email}
              </p>
            </div>
            <span
              class={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ${badgeClasses(
                selected.status
              )}`}
            >
              {statusLabel(selected.status)}
            </span>
          </header>

          <div class="mb-4">
            <p class="text-[11px] uppercase font-semibold text-slate-400 mb-1">Mensaje</p>
            <div class="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-sm text-slate-700 whitespace-pre-line">
              {selected.message}
            </div>
            <p class="mt-1 text-[11px] text-slate-400">
              Enviado el {shortDate(selected.created_at)}
            </p>
          </div>

          <div class="space-y-2">
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="text-xs font-medium text-slate-700">
              Respuesta al cliente
            </label>
            <textarea
              rows="6"
              bind:value={replyText}
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-amber-500/70 focus:border-amber-500"
              placeholder="Escribe aquí la respuesta que se enviará al correo del cliente…"
            ></textarea>
            {#if selected.replied_at}
              <p class="text-[11px] text-slate-400">
                Última respuesta enviada el {shortDate(selected.replied_at)}
              </p>
            {/if}
          </div>

          <div class="mt-3 flex items-center justify-between gap-3">
            <button
              type="button"
              on:click={() => { selected = null; replyText = ''; }}
              class="text-xs text-slate-500 hover:text-slate-700"
            >
              ← Volver a la lista
            </button>

            <button
              type="button"
              on:click={saveReply}
              class="inline-flex items-center gap-2 rounded-full bg-amber-600 px-4 py-1.5 text-xs md:text-sm font-medium
                     text-white shadow-sm hover:bg-amber-700 active:bg-amber-800
                     disabled:opacity-60 disabled:cursor-not-allowed
                     transition transform active:scale-[.98]"
              disabled={saving}
            >
              {#if saving}
                <svg class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity=".25" />
                  <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" stroke-width="4" />
                </svg>
                Guardando…
              {:else}
                Guardar respuesta
              {/if}
            </button>
          </div>
        {:else}
          <div class="h-full flex flex-col items-center justify-center text-center text-slate-400 text-sm">
            <p class="mb-1 font-medium text-slate-500">Selecciona un mensaje</p>
            <p class="text-xs max-w-xs">
              Haz clic en un reclamo u opinión de la tabla para ver el detalle y responderle al cliente.
            </p>
          </div>
        {/if}
      </div>
    </div>
  </section>
</main>

