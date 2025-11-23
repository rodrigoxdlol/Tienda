<script lang="ts">
  import { onMount } from 'svelte';
  import { listNewsImages, type NewsImage } from '$lib/api';

  let loading = true;
  let error = '';
  let items: NewsImage[] = [];

  onMount(load);

  async function load() {
    loading = true;
    error = '';
    try {
      items = await listNewsImages();
    } catch (e: any) {
      error = String(e?.message ?? e);
      items = [];
    } finally {
      loading = false;
    }
  }

  function fmtDate(d: string) {
    try {
      return new Date(d).toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '';
    }
  }
</script>

<section class="mx-auto max-w-6xl px-4 py-12 space-y-8">
  <!-- Header -->
  <header class="space-y-3 text-center">
    <p class="text-xs font-semibold tracking-[0.25em] text-amber-600 uppercase">
      Novedades
    </p>
    <h1 class="text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight">
      Noticias y próximas llegadas
    </h1>
    <p class="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
      Imágenes de nuevos productos, rifas y otras novedades de
      <strong> Cocinas Appel</strong>.
    </p>
  </header>

  <!-- Estados de carga / error -->
  {#if loading}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
      {#each Array(6) as _}
        <!-- svelte-ignore element_invalid_self_closing_tag -->
        <div class="h-80 rounded-3xl bg-slate-100 animate-pulse shadow-sm" />
      {/each}
    </div>
  {:else if error}
    <div
      class="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
    >
      Ocurrió un error al cargar las noticias: {error}
    </div>
  {:else if !items.length}
    <p class="mt-6 text-center text-sm text-slate-600">
      Aún no hay noticias publicadas. Vuelve pronto 😊
    </p>
  {:else}
    <!-- Grid de noticias -->
    <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each items as it}
        <article
          class="group relative flex h-full flex-col rounded-3xl bg-white/95 shadow-[0_18px_45px_rgba(15,23,42,0.12)] overflow-hidden border border-slate-100 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(15,23,42,0.18)] transition-transform duration-300"
        >
          <!-- Imagen -->
          <div class="relative aspect-[4/3] overflow-hidden bg-slate-100">
            <img
              src={it.image}
              alt={it.title || 'Noticia Cocinas Appel'}
              class="h-full w-full object-cover group-hover:scale-[1.05] transition-transform duration-500"
              loading="lazy"
            />
            <!-- Pill NOVEDADES -->
            <span
              class="absolute top-4 left-4 inline-flex items-center rounded-full bg-amber-300 px-4 py-1 text-[11px] font-semibold tracking-[0.18em] text-slate-900 uppercase shadow-sm"
            >
              Novedades
            </span>
          </div>

          <!-- Contenido -->
          <div class="flex flex-1 flex-col px-5 pt-4 pb-5 space-y-3 text-slate-800">
            {#if it.title}
              <h2
                class="text-lg sm:text-xl font-semibold leading-snug text-slate-900 line-clamp-2 group-hover:text-amber-700 transition-colors"
              >
                {it.title}
              </h2>
            {/if}

            {#if it.caption}
              <p class="text-sm text-slate-600 line-clamp-3">
                {it.caption}
              </p>
            {/if}

            <div class="mt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span class="inline-flex items-center gap-1">
                <!-- svelte-ignore element_invalid_self_closing_tag -->
                <span class="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Publicado
              </span>
              <span>{fmtDate(it.created_at)}</span>
            </div>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</section>
