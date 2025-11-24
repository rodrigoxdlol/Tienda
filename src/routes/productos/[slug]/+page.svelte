<script lang="ts">
  import type { PageData } from './$types';
  import { add } from '$lib/cart.store';
  import ChatBot from '$lib/components/ChatBot.svelte';

  export let data: PageData;

  // WhatsApp
  const WHATSAPP = '56942312053';
  const PLACEHOLDER = '/images/hero.webp';

  // Helper para URLs absolutas
  const API = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
  const isAbs = (u?: string | null) => !!u && /^https?:\/\//i.test(u || '');
  function abs(u?: string | null) {
    if (!u) return null;
    if (isAbs(u)) return u;
    if (!API) return null;
    return `${API}${u.startsWith('/') ? '' : '/'}${u}`;
  }

  const product = data.product;

  // Debug: ver qué datos llegan
  console.log('Producto completo:', product);
  console.log('Imágenes del producto:', product?.images);

  // Normalizar producto
  const mainImage = abs(product?.image) || PLACEHOLDER;
  const galleryImages = (product?.images || [])
    .map((img: any) => {
      // Intentar diferentes formatos que puede devolver el backend
      const imageUrl = img?.image || img?.url || img;
      console.log('Procesando imagen:', img, '→', imageUrl);
      return abs(imageUrl);
    })
    .filter(Boolean);

  console.log('Imagen principal:', mainImage);
  console.log('Galería procesada:', galleryImages);

  // Todas las imágenes: principal + galería
  const allImages = [mainImage, ...galleryImages];
  console.log('Todas las imágenes:', allImages);

  // Estado: imagen seleccionada
  let selectedImage = allImages[0];

  function selectImage(imageUrl: string) {
    selectedImage = imageUrl;
  }

  const clp = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format;

  const linkWA = () =>
    `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
      `Hola, me interesa el producto "${product.name}" (ID: ${product.id}). ¿Podrían darme más información?`
    )}`;

  let adding = false;
  async function addToCart() {
    try {
      adding = true;
      await add(Number(product.id), 1);
    } finally {
      adding = false;
    }
  }
</script>

<main class="bg-slate-50 min-h-screen">
  <div class="container mx-auto px-4 py-6 lg:py-8 max-w-6xl">
    <!-- Breadcrumb -->
    <nav class="mb-4 text-xs text-slate-600">
      <a href="/" class="hover:text-amber-600 transition">Inicio</a>
      <span class="mx-2">/</span>
      <a href="/productos" class="hover:text-amber-600 transition">Productos</a>
      <span class="mx-2">/</span>
      <span class="text-slate-900 font-medium">{product.name}</span>
    </nav>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
      <!-- GALERÍA DE IMÁGENES -->
      <div class="space-y-3">
        <!-- Imagen principal -->
        <div
          class="relative aspect-square rounded-xl overflow-hidden bg-white shadow-sm ring-1 ring-slate-200"
        >
          <img
            src={selectedImage}
            alt={product.name}
            class="w-full h-full object-cover"
            on:error={(e) => {
              (e.currentTarget as HTMLImageElement).src = PLACEHOLDER;
            }}
          />
        </div>

        <!-- Miniaturas -->
        {#if allImages.length > 1}
          <div class="flex gap-2 overflow-x-auto pb-2">
            {#each allImages as img, i}
              <button
                type="button"
                on:click={() => selectImage(img)}
                class="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all
                       {selectedImage === img
                  ? 'border-blue-600 ring-2 ring-blue-600/50'
                  : 'border-slate-300 hover:border-slate-400'}"
                aria-label="Ver imagen {i + 1}"
              >
                <img
                  src={img}
                  alt="{product.name} - imagen {i + 1}"
                  class="w-full h-full object-cover"
                  on:error={(e) => {
                    (e.currentTarget as HTMLImageElement).src = PLACEHOLDER;
                  }}
                />
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <!-- INFORMACIÓN DEL PRODUCTO -->
      <div class="space-y-4">
        <!-- Categoría -->
        {#if product.category}
          <span
            class="inline-flex items-center px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full ring-1 ring-blue-200"
          >
            {product.category}
          </span>
        {/if}

        <!-- Nombre -->
        <h1 class="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
          {product.name}
        </h1>

        <!-- Precio -->
        <div class="text-3xl font-bold text-amber-600">
          {clp(Number(product.price))}
        </div>

        <!-- Stock -->
        {#if typeof product.stock === 'number'}
          <div class="flex items-center gap-2 text-sm">
            {#if product.stock === 0}
              <span
                class="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs text-rose-700 font-medium ring-1 ring-rose-200"
              >
                <!-- svelte-ignore element_invalid_self_closing_tag -->
                <span class="h-1.5 w-1.5 rounded-full bg-rose-500" />
                Sin stock
              </span>
            {:else if product.stock <= 5}
              <span
                class="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs text-amber-700 font-medium ring-1 ring-amber-200"
              >
                <!-- svelte-ignore element_invalid_self_closing_tag -->
                <span class="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Stock bajo: {product.stock} unidades
              </span>
            {:else}
              <span class="text-slate-600 text-sm">Stock disponible: {product.stock}</span>
            {/if}
          </div>
        {/if}

        <!-- DESCRIPCIÓN (NUEVO) -->
        {#if product.description}
          <div class="border-t border-slate-200 pt-4">
            <h2 class="text-base font-semibold mb-2 text-slate-900">Descripción</h2>
            <p class="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>
        {/if}

        <!-- Botones de acción -->
        <div class="flex flex-col sm:flex-row gap-2.5 pt-3">
          <button
            type="button"
            on:click={addToCart}
            disabled={adding || product.stock === 0}
            class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-slate-800 active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {#if adding}
              <svg
                class="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                  opacity="0.25"
                />
                <path
                  d="M22 12a10 10 0 0 1-10 10"
                  stroke="currentColor"
                  stroke-width="4"
                />
              </svg>
              Agregando…
            {:else}
              Agregar al carrito
            {/if}
          </button>

          <a
            href={linkWA()}
            target="_blank"
            rel="noopener noreferrer"
            class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border-2 border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300 active:scale-[.98] transition"
          >
            <svg viewBox="0 0 24 24" class="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path
                d="M20.5 3.5A11.9 11.9 0 0 0 12 0C5.4 0 0 5.4 0 12c0 2 .5 3.8 1.4 5.5L0 24l6.7-1.8A12 12 0 0 0 12 24c6.6 0 12-5.4 12-12 0-3.2-1.3-6.2-3.5-8.5zM12 22a10 10 0 0 1-5.1-1.4l-.4-.3-4 .9.9-3.9-.3-.4A9.9 9.9 0 1 1 22 12c0 5.5-4.5 10-10 10zm5-7.6c-.3-.2-1.8-.9-2-.9-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.4.2-.7 0a7.6 7.6 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-1.9c-.2-.3 0-.5.2-.7l.5-.6c.1-.2.2-.3.3-.6 0-.2 0-.4 0-.6 0-.2-.7-1.7-1-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.9 4.2 4 .6.3 1.1.5 1.5.6.6.2 1.1.2 1.6.1.5-.1 1.8-.7 2-1.4.2-.7.2-1.3.1-1.4z"
              />
            </svg>
            Consultar por WhatsApp
          </a>
        </div>

        <!-- Volver a productos -->
        <a
          href="/productos"
          class="inline-flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 transition mt-2"
        >
          <svg
            class="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Volver a productos
        </a>
      </div>
    </div>
  </div>
  <ChatBot />
</main>
