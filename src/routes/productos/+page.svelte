<script lang="ts">
  import { onMount } from 'svelte';
  import { listProducts } from '$lib/api';
  import { add } from '$lib/cart.store';
  import ChatBot from '$lib/components/ChatBot.svelte';

  // WhatsApp (sin + ni espacios)
  const WHATSAPP = '56977082796';

  // Imagen de respaldo
  const PLACEHOLDER = '/images/hero.webp';

  // Límite para considerar stock bajo
  const LOW_STOCK_LIMIT = 5;

  // Helper para componer URLs absolutas desde el backend
  const API = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
  const isAbs = (u?: string | null) => !!u && /^https?:\/\//i.test(u || '');
  function abs(u?: string | null) {
    if (!u) return null;
    if (isAbs(u)) return u;
    if (!API) return null;
    return `${API}${u.startsWith('/') ? '' : '/'}${u}`;
  }

  let loading = true;
  let error = '';
  let productos: any[] = [];
  let categorias: { id: string; label: string }[] = [{ id: 'todo', label: 'Todos' }];

  // Controles
  let categoria = 'todo';
  let q = '';
  let orden: 'popular' | 'precio-asc' | 'precio-desc' = 'popular';

  const clp = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format;

  const isLowStock = (s: number | null | undefined) =>
    typeof s === 'number' && s > 0 && s <= LOW_STOCK_LIMIT;

  // Normalizador del producto que viene del backend
  function mapProduct(p: any) {
    const mainAbs = abs(p?.image);
    const galAbs = abs(p?.images?.[0]?.image);
    const img = mainAbs || galAbs || PLACEHOLDER;

    return {
      id: p.id,
      nombre: p.name ?? 'Producto',
      precio: Number(p.price ?? 0),
      img,
      categoria: p.category ?? 'otros',
      desc: p.description ?? '',
      slug: p.slug ?? p.id,
      badges: Array.isArray(p.badges) ? p.badges : [],
      stock: typeof p.stock === 'number' ? p.stock : Number(p.stock ?? 0)
    };
  }

  function buildCategorias(list: any[]) {
    const set = new Set<string>();
    list.forEach((p) => set.add(p.categoria));
    const arr = Array.from(set)
      .sort()
      .map((id) => ({ id, label: id.charAt(0).toUpperCase() + id.slice(1) }));
    categorias = [{ id: 'todo', label: 'Todos' }, ...arr];
  }

  onMount(async () => {
    try {
      const data = await listProducts();
      const norm = (Array.isArray(data) ? data : []).map(mapProduct);
      productos = norm;
      buildCategorias(norm);
      console.debug('VITE_API_URL:', API);
      console.debug('Productos mapeados:', productos.map((p) => p.img));
    } catch (e: any) {
      error = e?.message || 'No se pudieron cargar los productos';
      productos = [];
      categorias = [{ id: 'todo', label: 'Todos' }];
    } finally {
      loading = false;
    }
  });

  const linkWA = (p: any) =>
    `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
      `Hola, me interesa el producto "${p.nombre}" (ID: ${p.id}). ¿Podrían darme más información?`
    )}`;

  // Lista filtrada/ordenada
  $: lista = productos
    .filter((p) => (categoria === 'todo' ? true : p.categoria === categoria))
    .filter((p) =>
      q.trim() ? (p.nombre + ' ' + (p.desc ?? '')).toLowerCase().includes(q.toLowerCase()) : true
    )
    .slice()
    .sort((a, b) => {
      if (orden === 'precio-asc') return a.precio - b.precio;
      if (orden === 'precio-desc') return b.precio - a.precio;
      return 0;
    });

  let addingId: number | null = null;
  async function addToCart(p: any) {
    try {
      addingId = p.id;
      await add(Number(p.id), 1);
    } finally {
      addingId = null;
    }
  }
</script>

<section id="productos" class="bg-slate-50/80 py-10 sm:py-12 lg:py-16">
  <div class="mx-auto max-w-7xl px-4">
    <!-- Header -->
    <div class="space-y-2 max-w-2xl mx-auto text-center">
      <div
        class="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-100"
      >
        <!-- svelte-ignore element_invalid_self_closing_tag -->
        <span class="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
        Catálogo de Cocinas Appel
      </div>
      <h2 class="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
        Productos
      </h2>
      <p class="text-slate-600 text-sm sm:text-base mt-1">
        Fabricación propia y accesorios seleccionados para tu proyecto de cocina.
      </p>
    </div>

    <!-- FILTROS COMO BARRA ANCHA ARRIBA -->
    <div class="mt-8 max-w-4xl mx-auto">
      <div
        class="rounded-2xl bg-white/90 shadow-sm ring-1 ring-slate-200 px-4 py-4 sm:px-5 sm:py-5 space-y-4"
      >
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 class="text-sm font-semibold text-slate-900">Filtrar productos</h3>
            <p class="text-[11px] text-slate-500">
              Busca por nombre, categoría u ordena por precio.
            </p>
          </div>
        </div>

        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <!-- Categorías -->
          <div class="flex flex-wrap gap-2 md:max-w-[55%]">
            {#each categorias as c}
              <button
                type="button"
                class={`text-xs sm:text-[13px] px-3 py-1.5 rounded-full ring-1 transition
                  ${
                    categoria === c.id
                      ? 'bg-amber-600 text-white ring-amber-500 shadow-sm'
                      : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50'
                  }`}
                on:click={() => (categoria = c.id)}
                aria-pressed={categoria === c.id}
              >
                {c.label}
              </button>
            {/each}
          </div>

          <!-- Búsqueda + Orden -->
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 md:max-w-[45%] md:justify-end">
            <div class="relative w-full sm:w-48">
              <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <svg class="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none">
                  <path d="M15.5 15.5L20 20" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                  <circle cx="11" cy="11" r="5.5" stroke="currentColor" stroke-width="1.6" />
                </svg>
              </span>
              <input
                type="search"
                placeholder="Buscar…"
                bind:value={q}
                class="w-full rounded-xl border border-slate-300 bg-white/90 px-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 shadow-sm"
              />
            </div>

            <div class="w-full sm:w-44">
              <select
                bind:value={orden}
                class="w-full rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 shadow-sm"
              >
                <option value="popular">Orden: popularidad</option>
                <option value="precio-asc">Precio: menor a mayor</option>
                <option value="precio-desc">Precio: mayor a menor</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- CONTENIDO PRODUCTOS -->
    <div class="mt-8">
      {#if loading}
        <!-- Skeletons -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each Array(6) as _}
            <div class="animate-pulse bg-white rounded-2xl shadow-sm overflow-hidden ring-1 ring-slate-200">
              <!-- svelte-ignore element_invalid_self_closing_tag -->
              <div class="w-full aspect-[4/3] bg-slate-200" />
              <div class="p-4 space-y-3">
                <!-- svelte-ignore element_invalid_self_closing_tag -->
                <!-- svelte-ignore element_invalid_self_closing_tag -->
                <!-- svelte-ignore element_invalid_self_closing_tag -->
                <div class="h-4 bg-slate-200 rounded w-2/3" />
                <!-- svelte-ignore element_invalid_self_closing_tag -->
                <div class="h-3 bg-slate-200 rounded w-1/2" />
                <!-- svelte-ignore element_invalid_self_closing_tag -->
                <div class="flex gap-2 pt-2">
                  <!-- svelte-ignore element_invalid_self_closing_tag -->
                  <div class="h-9 bg-slate-200 rounded w-1/3" />
                  <div class="h-9 bg-slate-200 rounded w-1/3" />
                </div>
              </div>
            </div>
          {/each}
        </div>
      {:else if error}
        <div class="flex justify-center">
          <div
            class="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700 max-w-md text-center"
          >
            {error}
          </div>
        </div>
      {:else}
        <!-- Grid de tarjetas -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each lista as p}
            <article
              class="group bg-white rounded-2xl shadow-sm overflow-hidden ring-1 ring-slate-200
                     hover:shadow-xl hover:ring-slate-300 transition transform hover:-translate-y-0.5"
            >
              <div class="relative">
                <img
                  src={p.img || PLACEHOLDER}
                  alt={p.nombre}
                  class="w-full aspect-[4/3] object-cover bg-slate-100 transition-transform duration-500 group-hover:scale-[1.03]"
                  loading="lazy"
                  on:error={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; }}
                />

                {#if p.badges?.length}
                  <div class="absolute top-3 left-3 flex flex-wrap gap-2">
                    {#each p.badges as b}
                      <span
                        class="rounded-full bg-amber-500/95 px-2.5 py-0.5 text-xs font-semibold text-black/90 shadow-sm ring-1 ring-amber-400/60"
                      >
                        {b}
                      </span>
                    {/each}
                  </div>
                {/if}
              </div>

              <div class="p-4 sm:p-5 flex flex-col gap-3">
                <header class="flex items-start justify-between gap-3">
                  <div class="space-y-1">
                    <h3 class="text-base sm:text-lg font-semibold leading-snug text-slate-900">
                      {p.nombre}
                    </h3>
                    {#if p.categoria}
                      <span
                        class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700"
                      >
                        {p.categoria}
                      </span>
                    {/if}
                  </div>
                  <span
                    class="shrink-0 rounded-lg bg-amber-50 px-2.5 py-1.5 text-sm sm:text-base font-semibold text-amber-700 ring-1 ring-amber-200"
                  >
                    {clp(p.precio)}
                  </span>
                </header>

                {#if p.desc}
                  <p class="text-sm text-slate-600 line-clamp-2">
                    {p.desc}
                  </p>
                {/if}

                <!-- Info de stock -->
                {#if typeof p.stock === 'number'}
                  <div class="flex items-center justify-between text-xs text-slate-500">
                    <span>Stock: {p.stock}</span>

                    {#if p.stock === 0}
                      <span
                        class="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 ring-1 ring-rose-100"
                      >
                        <!-- svelte-ignore element_invalid_self_closing_tag -->
                        <span class="h-1.5 w-1.5 rounded-full bg-rose-500" />
                        Sin stock
                      </span>
                    {:else if isLowStock(p.stock)}
                      <span
                        class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-100"
                      >
                        <!-- svelte-ignore element_invalid_self_closing_tag -->
                        <span class="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Stock bajo: {p.stock}
                      </span>
                    {/if}
                  </div>
                {/if}

                <div class="mt-2 flex flex-wrap items-center gap-2">
                  <a
                    href={linkWA(p)}
                    target="_blank"
                    rel="noopener"
                    class="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs sm:text-sm font-medium text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300 active:scale-[.98] transition"
                  >
                    <svg viewBox="0 0 24 24" class="h-4 w-4" fill="currentColor" aria-hidden="true">
                      <path
                        d="M20.5 3.5A11.9 11.9 0 0 0 12 0C5.4 0 0 5.4 0 12c0 2 .5 3.8 1.4 5.5L0 24l6.7-1.8A12 12 0 0 0 12 24c6.6 0 12-5.4 12-12 0-3.2-1.3-6.2-3.5-8.5zM12 22a10 10 0 0 1-5.1-1.4l-.4-.3-4 .9.9-3.9-.3-.4A9.9 9.9 0 1 1 22 12c0 5.5-4.5 10-10 10zm5-7.6c-.3-.2-1.8-.9-2-.9-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.4.2-.7 0a7.6 7.6 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-1.9c-.2-.3 0-.5.2-.7l.5-.6c.1-.2.2-.3.3-.6 0-.2 0-.4 0-.6 0-.2-.7-1.7-1-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.9 4.2 4 .6.3 1.1.5 1.5.6.6.2 1.1.2 1.6.1.5-.1 1.8-.7 2-1.4.2-.7.2-1.3.1-1.4z"
                      />
                    </svg>
                    Consultar por WhatsApp
                  </a>

                  <a
                    href={`/productos/${p.slug ?? p.id}`}
                    class="inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition"
                  >
                    Más detalles
                  </a>

                  <button
                    class="inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-xs sm:text-sm font-medium text-white bg-slate-900/95 hover:bg-slate-900 active:scale-[.98] disabled:opacity-60"
                    on:click={() => addToCart(p)}
                    disabled={addingId === p.id}
                  >
                    {addingId === p.id ? 'Agregando…' : 'Agregar al carrito'}
                  </button>
                </div>
              </div>
            </article>
          {/each}
        </div>

        {#if !lista.length}
          <div class="mt-8 flex justify-center">
            <p class="text-center text-slate-600 text-sm sm:text-base">
              No encontramos productos con esos filtros. Prueba cambiar la búsqueda o la categoría.
            </p>
          </div>
        {/if}
      {/if}
    </div>
  </div>
  <ChatBot />
</section>





