<script lang="ts">
  import { onMount } from 'svelte';
  import { myContactMessages, type MyContactMessage } from '$lib/api';

  let loading = true;
  let error = '';
  let items: MyContactMessage[] = [];

  function shortDate(d: string | null) {
    if (!d) return '-';
    return d.replace('T', ' ').slice(0, 16);
  }

  function statusLabel(s: MyContactMessage['status']) {
    if (s === 'pending') return 'Pendiente';
    if (s === 'answered') return 'Respondido';
    return 'Cerrado';
  }

  const badgeClasses = (s: MyContactMessage['status']) => {
    if (s === 'pending') return 'bg-amber-100 text-amber-800 ring-amber-200';
    if (s === 'answered') return 'bg-green-100 text-green-800 ring-green-200';
    return 'bg-slate-100 text-slate-700 ring-slate-200';
  };

  onMount(async () => {
    loading = true;
    error = '';
    try {
      items = await myContactMessages();
    } catch (e) {
      console.error(e);
      error = 'No se pudieron cargar tus reclamos. Inicia sesión nuevamente.';
    } finally {
      loading = false;
    }
  });
</script>

<main class="max-w-4xl mx-auto px-4 py-8">
  <header class="mb-6">
    <h1 class="text-xl md:text-2xl font-semibold text-slate-900">
      Mis reclamos y mensajes
    </h1>
    <p class="text-sm text-slate-500">
      Aquí puedes ver el estado de los mensajes que has enviado mediante el formulario de contacto.
    </p>
  </header>

  {#if error}
    <div class="rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-3 py-2 mb-4">
      {error}
    </div>
  {/if}

  <section class="bg-white rounded-2xl shadow-sm border border-slate-100">
    <div class="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
      <h2 class="text-sm font-semibold text-slate-800">Historial</h2>
      {#if loading}
        <span class="text-xs text-slate-400">Cargando…</span>
      {/if}
    </div>

    {#if loading}
      <div class="p-4 space-y-3">
        {#each Array(3) as _}
          <div class="animate-pulse h-12 rounded-lg bg-slate-100"></div>
        {/each}
      </div>
    {:else if items.length === 0}
      <div class="p-6 text-center text-sm text-slate-400">
        Aún no has enviado reclamos ni mensajes desde el formulario de contacto.
      </div>
    {:else}
      <ul class="divide-y divide-slate-100">
        {#each items as item}
          <li class="px-4 py-3 space-y-2">
            <div class="flex items-center justify-between gap-2">
              <div>
                <p class="text-sm font-semibold text-slate-900">
                  {item.subject || 'Sin asunto'}
                </p>
                <p class="text-[11px] text-slate-400">
                  Enviado el {shortDate(item.created_at)}
                </p>
              </div>
              <span
                class={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ${badgeClasses(
                  item.status
                )}`}
              >
                {statusLabel(item.status)}
              </span>
            </div>

            <div class="mt-1 text-xs text-slate-600">
              <p class="font-medium text-slate-700 mb-0.5">Tu mensaje:</p>
              <p class="whitespace-pre-line">{item.message}</p>
            </div>

            {#if item.admin_reply}
              <div class="mt-2 text-xs text-slate-700 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                <p class="font-medium text-slate-800 mb-0.5">Respuesta de la tienda:</p>
                <p class="whitespace-pre-line">{item.admin_reply}</p>
                {#if item.replied_at}
                  <p class="mt-1 text-[11px] text-slate-400">
                    Respondido el {shortDate(item.replied_at)}
                  </p>
                {/if}
              </div>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</main>
