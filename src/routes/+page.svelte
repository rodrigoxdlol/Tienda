<script lang="ts">
  import { onMount } from 'svelte';
  import { listHomeImages } from '$lib/api';
  import { goto } from '$app/navigation';
  import ChatBot from '$lib/components/ChatBot.svelte';

  // Estado del carrito para FAB
  import { count, total } from '$lib/cart.store';

  // Imágenes locales
  const img1 = '/images/Hojalateria.png';
  const img2 = '/images/Tienda.png';
  const img3 = '/images/Cocina.png';
  const HERO = '/images/hero.webp';

  // Slider desde API
  let items: any[] = [];
  let idx = 0;
  let timer: ReturnType<typeof setInterval> | null = null;
  const interval = 6000;

  onMount(async () => {
    try {
      // it.image debe venir como URL absoluta desde tu API
      items = await listHomeImages();
    } catch (e) {
      console.error('listHomeImages error:', e);
    }
    start();
    return () => stop();
  });

  function next() {
    if (items.length) idx = (idx + 1) % items.length;
  }
  function prev() {
    if (items.length) idx = (idx - 1 + items.length) % items.length;
  }
  function go(i: number) {
    if (items.length) idx = (i + items.length) % items.length;
  }

  function start() {
    stop();
    if (!items.length) return;
    timer = setInterval(next, interval);
  }
  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function windowKey(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
  }

  // Navegar a checkout
  function goCheckout() {
    goto('/checkout');
  }

  // Formato CLP para el FAB
  const money = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  });
  const fmt = (n: unknown) => money.format(Number(n ?? 0) || 0);
</script>

<svelte:window on:keydown={windowKey} />

<!-- HERO full-bleed (de borde a borde) -->
<section class="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
  <div class="relative h-[clamp(240px,45vw,420px)] md:h-[420px] overflow-hidden shadow-lg md:rounded-b-[2.5rem]">
    <img
      src={HERO}
      alt="Cocina a leña tradicional"
      class="absolute inset-0 h-full w-full object-cover object-[100%_50%] contrast-110"
      loading="eager"
      fetchpriority="high"
    />
    <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>

    <!-- Texto sobre el hero -->
    <div class="absolute inset-0 flex items-center justify-center px-4">
      <div class="max-w-3xl text-center text-white">
        <p class="text-[11px] md:text-xs font-semibold uppercase tracking-[0.25em] text-white/80">
          Cocinas Appel · Coyhaique
        </p>
        <h1 class="mt-3 text-2xl md:text-4xl lg:text-5xl font-semibold leading-tight drop-shadow-sm">
          Calor del sur, calidad que perdura
        </h1>
        <p class="mt-3 text-sm md:text-base text-white/90">
          Más de 55 años fabricando cocinas a leña y calefactores para hogares de la Patagonia.
        </p>
      </div>
    </div>
  </div>
</section>

<!-- CONTENIDO PRINCIPAL -->
<main class="bg-slate-50">
  <section class="mx-auto max-w-7xl px-4 pb-12 pt-10">

    <!-- Carrusel principal -->
    <div
      class="relative mb-10"
      aria-label="Galería de productos y proyectos"
      aria-roledescription="carrusel"
      aria-live="polite"
    >
      {#if items.length}
        <div
          role="region"
          aria-label="Carrusel de imágenes"
          class="relative overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white shadow-lg"
          on:mouseenter={stop}
          on:mouseleave={start}
        >
          <!-- Viewport -->
          <div class="relative h-52 sm:h-64 md:h-80 lg:h-[420px] bg-slate-100">
            {#each items as it, i (it.id ?? i)}
              <img
                src={it.image}
                alt={it.title}
                class="absolute inset-0 h-full w-full object-contain object-center
                       transition-opacity duration-500 ease-out"
                style:opacity={i === idx ? 1 : 0}
                aria-hidden={i !== idx}
                loading="lazy"
              />
            {/each}

            <!-- Degradés laterales -->
            <div class="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white/80 to-transparent"></div>
            <div class="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white/80 to-transparent"></div>

            <!-- Caption -->
            {#if items[idx]?.caption}
              <div
                class="absolute bottom-3 left-3 right-3 sm:left-4 sm:right-4
                       rounded-xl bg-black/55 backdrop-blur-sm text-white px-3 py-2
                       shadow-sm"
              >
                {#if items[idx]?.title}
                  <div class="text-sm font-semibold leading-tight">{items[idx].title}</div>
                {/if}
                <div class="text-xs sm:text-[13px] leading-snug">
                  {items[idx].caption}
                </div>
              </div>
            {/if}

            <!-- Botón anterior -->
            <button
              type="button"
              class="absolute left-3 top-1/2 -translate-y-1/2 grid place-items-center
                     h-9 w-9 rounded-full bg-slate-900/40 text-white
                     hover:bg-slate-900/70 focus:outline-none focus:ring-2 focus:ring-white/60
                     transition"
              on:click={prev}
              aria-label="Anterior"
            >
              <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>

            <!-- Botón siguiente -->
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 grid place-items-center
                     h-9 w-9 rounded-full bg-slate-900/40 text-white
                     hover:bg-slate-900/70 focus:outline-none focus:ring-2 focus:ring-white/60
                     transition"
              on:click={next}
              aria-label="Siguiente"
            >
              <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>

          <!-- Indicadores -->
          <div class="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
            {#each items as _, i}
              <button
                type="button"
                class="h-1.5 w-4 rounded-full bg-slate-300 transition-all duration-300
                       aria-[current=true]:w-6 aria-[current=true]:bg-amber-500"
                aria-label={`Ir al slide ${i + 1}`}
                aria-current={i === idx}
                on:click={() => go(i)}
              ></button>
            {/each}
          </div>
        </div>
      {:else}
        <!-- Placeholder si no hay imágenes -->
        <div
          class="relative overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white shadow-lg"
        >
          <div class="relative h-52 sm:h-64 md:h-80 lg:h-[420px] bg-slate-100 flex items-center justify-center">
            <div class="text-slate-400 italic">No hay imágenes disponibles</div>
          </div>
        </div>
      {/if}
    </div>

    <!-- SECCIÓN DESTACADA -->
    <section>
      <!-- Título -->
      <h2 class="text-center text-3xl md:text-5xl font-semibold text-amber-800 tracking-tight">
        Cocinas a leña en Coyhaique
      </h2>
      <p class="mt-3 text-center text-sm md:text-base text-slate-600 max-w-2xl mx-auto">
        Fabricamos cocinas y calefactores pensados para el clima extremo del sur de Chile,
        combinando tradición, diseño y eficiencia térmica.
      </p>

      <!-- Franja de iconos -->
      <div
        class="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 overflow-hidden rounded-3xl shadow-lg ring-1 ring-black/5 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-100"
      >
        <!-- 1: Personas -->
        <div class="flex h-44 md:h-56 items-center justify-center">
          <img
            src="/images/32147-vector-1-240w (1).png"
            alt="Clientes satisfechos"
            class="h-24 md:h-28 w-auto object-contain drop-shadow"
            loading="lazy"
          />
        </div>

        <!-- 2: Documento -->
        <div class="flex h-44 md:h-56 items-center justify-center">
          <img
            src="/images/32171-vector-2-240w (1).png"
            alt="Documentos y proyectos"
            class="h-24 md:h-28 w-auto object-contain drop-shadow"
            loading="lazy"
          />
        </div>

        <!-- 3: Carrito -->
        <div class="flex h-44 md:h-56 items-center justify-center">
          <img
            src="/images/32176-vector-3-240w.png"
            alt="Carrito de compras"
            class="h-24 md:h-28 w-auto object-contain drop-shadow"
            loading="lazy"
          />
        </div>

        <!-- 4: Pulgar -->
        <div class="flex h-44 md:h-56 items-center justify-center">
          <img
            src="/images/32187-vector-4-240w.png"
            alt="Calidad garantizada"
            class="h-24 md:h-28 w-auto object-contain drop-shadow"
            loading="lazy"
          />
        </div>
      </div>

      <!-- Cuadros con texto -->
      <div class="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
        <article class="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 px-5 py-6 hover:-translate-y-1 hover:shadow-md transition">
          <h3 class="text-xl font-semibold mb-3 text-slate-900">Quiénes somos</h3>
          <p class="leading-7 text-slate-700 text-sm md:text-[15px]">
            Somos <strong class="font-semibold">Cocinas Appel</strong>, una empresa regional con más de 55 años de experiencia.
            Contamos con lo mejor en <strong class="font-semibold">cocinas a leña y calefactores de combustión lenta</strong>.
          </p>
        </article>
        <article class="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 px-5 py-6 hover:-translate-y-1 hover:shadow-md transition">
          <h3 class="text-xl font-semibold mb-3 text-slate-900">Calidad</h3>
          <p class="leading-7 text-slate-700 text-sm md:text-[15px]">
            Trabajamos con productos de la más alta calidad. En nuestra <strong class="font-semibold">fábrica de estufas</strong>
            contamos con <strong class="font-semibold">cocinas a leña, parrillas</strong> y <strong class="font-semibold">bullones al caño</strong>,
            entre otros. ¡Consúltanos!
          </p>
        </article>
        <article class="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 px-5 py-6 hover:-translate-y-1 hover:shadow-md transition">
          <h3 class="text-xl font-semibold mb-3 text-slate-900">Materiales</h3>
          <p class="leading-7 text-slate-700 text-sm md:text-[15px]">
            Elaboramos nuestros productos con los mejores materiales del mercado. Profesionales calificados te atenderán de la mejor manera.
          </p>
        </article>
        <article class="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 px-5 py-6 hover:-translate-y-1 hover:shadow-md transition">
          <h3 class="text-xl font-semibold mb-3 text-slate-900">Nuestro servicio</h3>
          <p class="leading-7 text-slate-700 text-sm md:text-[15px]">
            Empresas y particulares encontrarán una completa <strong class="font-semibold">atención personalizada</strong>.
            Estamos ubicados en <strong class="font-semibold">Coyhaique</strong>.
          </p>
        </article>
      </div>
    </section>

    <!-- Sección de tarjetas con imágenes locales -->
    <section class="mt-12">
      <h2 class="text-xl md:text-2xl font-semibold mb-4 text-center text-slate-900">
        Somos parte de tu hogar
      </h2>
      <p class="text-center text-sm md:text-base text-slate-600 max-w-xl mx-auto mb-6">
        Desde la fabricación en nuestro taller hasta la instalación en tu casa,
        te acompañamos en todo el proceso.
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <article class="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 overflow-hidden hover:-translate-y-1 hover:shadow-md transition">
          <img src={img1} alt="Hojalatería y accesorios" class="w-full h-56 object-cover" loading="lazy" />
          <div class="p-4 text-sm text-slate-600">
            Hojalatería y accesorios en acero galvanizado para ductos y chimeneas,
            fabricados en nuestro taller.
          </div>
        </article>
        <article class="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 overflow-hidden hover:-translate-y-1 hover:shadow-md transition">
          <img src={img2} alt="Tienda Cocinas Appel" class="w-full h-56 object-cover" loading="lazy" />
          <div class="p-4 text-sm text-slate-600">
            Fachada de nuestra tienda, donde puedes ver las cocinas, retirar pedidos
            y recibir asesoría directa.
          </div>
        </article>
        <article class="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 overflow-hidden hover:-translate-y-1 hover:shadow-md transition">
          <img src={img3} alt="Cocina instalada en hogar" class="w-full h-56 object-cover" loading="lazy" />
          <div class="p-4 text-sm text-slate-600">
            Una de nuestras cocinas a leña instaladas, lista para uso diario en el hogar.
          </div>
        </article>
      </div>
    </section>
  </section>
  <ChatBot />
</main>


