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
  let playing = true;
  let hovering = false;

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
    if (!items.length || !playing || hovering) return;
    timer = setInterval(next, interval);
  }
  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
  function togglePlay() {
    playing = !playing;
    playing ? start() : stop();
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
          class="relative overflow-hidden rounded-3xl ring-1 ring-slate-200/50 bg-gradient-to-br from-white via-slate-50 to-amber-50/30 shadow-2xl backdrop-blur-sm"
          on:mouseenter={() => { hovering = true; stop(); }}
          on:mouseleave={() => { hovering = false; start(); }}
        >
          <!-- Elementos decorativos de fondo -->
          <div class="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-200/10 via-orange-200/10 to-red-200/10 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-orange-100/20 to-amber-100/20 rounded-full blur-3xl pointer-events-none"></div>

          <!-- Viewport con efecto de deslizamiento -->
          <div class="relative h-72 sm:h-80 md:h-[450px] lg:h-[550px] bg-gradient-to-br from-slate-50 to-slate-100/50 overflow-hidden">
            
            <!-- Track con transición de deslizamiento -->
            <div 
              class="flex h-full w-full transition-transform duration-700 ease-out will-change-transform"
              style="transform: translateX(-{idx * 100}%)"
            >
              {#each items as it, i (it.id ?? i)}
                <div class="relative min-w-full h-full flex-shrink-0">
                  <!-- Fondo difuminado con parallax -->
                  <img
                    src={it.image}
                    alt=""
                    class="absolute inset-0 h-full w-full object-cover blur-xl scale-110 opacity-30"
                    draggable="false"
                    loading="lazy"
                    aria-hidden="true"
                  />
                  
                  <!-- Imagen principal con efecto de escala -->
                  <div class="absolute inset-0 flex items-center justify-center p-2 sm:p-3 md:p-4">
                    <img
                      src={it.image}
                      alt={it.title ?? 'Imagen de la galería'}
                      class="max-h-full max-w-full object-contain drop-shadow-2xl transform transition-transform duration-700"
                      class:scale-105={i === idx}
                      draggable="false"
                      loading="lazy"
                    />
                  </div>

                  <!-- Overlay con gradiente moderno -->
                  <div class="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent pointer-events-none"></div>
                </div>
              {/each}
            </div>

            <!-- Caption mejorado -->
            {#if items[idx]?.caption || items[idx]?.title}
              <div class="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 md:bottom-6 md:left-8 md:right-8">
                <div class="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl ring-1 ring-slate-200/50 px-4 py-3 sm:px-5 sm:py-4 transform transition-all duration-500">
                  {#if items[idx]?.title}
                    <div class="flex items-center gap-2 mb-1">
                      <div class="h-1 w-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"></div>
                      <h3 class="text-base sm:text-lg font-bold text-slate-900">{items[idx].title}</h3>
                    </div>
                  {/if}
                  {#if items[idx]?.caption}
                    <p class="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      {items[idx].caption}
                    </p>
                  {/if}
                </div>
              </div>
            {/if}

            <!-- Contador e indicador de estado -->
            <div class="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 z-10">
              <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold shadow-lg ring-1 ring-white/10">
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                {idx + 1} / {items.length}
              </div>
              {#if playing}
                <span class="hidden sm:inline-flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-md text-white/90 px-3 py-1.5 text-xs font-medium shadow-lg ring-1 ring-white/10">
                  <span class="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Reproducción automática
                </span>
              {/if}
            </div>

            <!-- Botón anterior mejorado -->
            <button
              type="button"
              class="absolute left-3 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 z-10 group
                     h-11 w-11 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-full
                     bg-white/90 backdrop-blur-md shadow-xl ring-1 ring-slate-200/50
                     text-slate-900 hover:bg-white hover:scale-110
                     focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
                     transition-all duration-300 transform"
              on:click={prev}
              aria-label="Anterior"
            >
              <svg viewBox="0 0 24 24" class="h-5 w-5 sm:h-6 sm:w-6 mx-auto group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M15 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>

            <!-- Botón siguiente mejorado -->
            <button
              type="button"
              class="absolute right-3 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 z-10 group
                     h-11 w-11 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-full
                     bg-white/90 backdrop-blur-md shadow-xl ring-1 ring-slate-200/50
                     text-slate-900 hover:bg-white hover:scale-110
                     focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
                     transition-all duration-300 transform"
              on:click={next}
              aria-label="Siguiente"
            >
              <svg viewBox="0 0 24 24" class="h-5 w-5 sm:h-6 sm:w-6 mx-auto group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>

            <!-- Play / Pause -->
            <div class="absolute right-3 sm:right-4 md:right-6 bottom-4 sm:bottom-6 z-10">
              <button
                type="button"
                class="rounded-full bg-white/90 backdrop-blur-md text-slate-900 h-10 w-10 sm:h-11 sm:w-11 
                       grid place-items-center hover:bg-white hover:scale-110 
                       focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
                       shadow-xl ring-1 ring-slate-200/50 transition-all duration-300 transform"
                on:click={togglePlay}
                aria-label={playing ? 'Pausar' : 'Reproducir'}
              >
                {#if playing}
                  <svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor">
                    <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
                  </svg>
                {:else}
                  <svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                {/if}
              </button>
            </div>
          </div>

          <!-- Indicadores rediseñados -->
          <div class="absolute inset-x-0 -bottom-3 flex justify-center gap-2 sm:gap-3 px-4">
            {#each items as _, i}
              <button
                type="button"
                class="group relative transition-all duration-300"
                class:scale-110={i === idx}
                aria-label="Ir al slide {i + 1}"
                aria-current={i === idx}
                on:click={() => go(i)}
              >
                <div 
                  class="h-2.5 rounded-full transition-all duration-300 shadow-md"
                  class:w-10={i === idx}
                  class:w-2.5={i !== idx}
                  class:bg-gradient-to-r={i === idx}
                  class:from-amber-500={i === idx}
                  class:to-orange-500={i === idx}
                  class:bg-slate-300={i !== idx}
                  class:group-hover:bg-slate-400={i !== idx}
                >
                </div>
                {#if i === idx}
                  <div class="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full blur-sm opacity-50"></div>
                {/if}
              </button>
            {/each}
          </div>
        </div>
      {:else}
        <!-- Placeholder mejorado -->
        <div class="relative overflow-hidden rounded-3xl ring-1 ring-slate-200/50 bg-gradient-to-br from-white via-slate-50 to-amber-50/30 shadow-2xl">
          <div class="relative h-64 sm:h-72 md:h-96 lg:h-[480px] bg-gradient-to-br from-slate-50 to-slate-100/50 flex flex-col items-center justify-center gap-4">
            <div class="h-16 w-16 rounded-full bg-slate-200 flex items-center justify-center">
              <svg class="h-8 w-8 text-slate-400" viewBox="0 0 24 24" fill="none">
                <path d="M4 16L8.5 10L13 15L16 11L20 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <circle cx="9" cy="6" r="2" stroke="currentColor" stroke-width="2" />
                <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="2" />
              </svg>
            </div>
            <div class="text-center">
              <p class="text-slate-600 font-medium">No hay imágenes disponibles</p>
              <p class="text-slate-400 text-sm mt-1">Las imágenes aparecerán aquí cuando se agreguen desde el panel admin</p>
            </div>
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
    <section class="mt-20 md:mt-24">
      <div class="text-center mb-12">
        <h2 class="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight relative inline-block">
          <span class="relative z-10">Somos parte de tu hogar</span>
          <div class="absolute -bottom-2 left-0 right-0 h-3 bg-amber-200/50 -rotate-1 z-0 rounded-full"></div>
        </h2>
        <p class="mt-4 text-slate-600 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
          Desde la fabricación artesanal en nuestro taller hasta la instalación final,
          cuidamos cada detalle para llevar el calor del sur a tu familia.
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
        <!-- Card 1: Taller -->
        <div class="group relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden ring-1 ring-slate-200/60 flex flex-col">
          <div class="relative h-64 overflow-hidden">
            <div class="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/0 transition-colors duration-500 z-10"></div>
            <img 
              src={img1} 
              alt="Hojalatería y accesorios" 
              class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" 
              loading="lazy" 
            />
            <div class="absolute top-4 left-4 z-20">
              <span class="px-3 py-1 rounded-full bg-white/90 backdrop-blur text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-200">
                Nuestro Taller
              </span>
            </div>
          </div>
          <div class="p-6 md:p-8 flex-1 flex flex-col relative">
            <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-400 to-slate-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
            <p class="text-slate-600 leading-relaxed">
              <strong class="block text-slate-900 font-semibold mb-2 text-lg">Fabricación Propia</strong>
              Hojalatería y accesorios en acero galvanizado para ductos y chimeneas, fabricados con precisión en nuestro taller.
            </p>
          </div>
        </div>

        <!-- Card 2: Tienda -->
        <div class="group relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden ring-1 ring-slate-200/60 flex flex-col">
          <div class="relative h-64 overflow-hidden">
            <div class="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/0 transition-colors duration-500 z-10"></div>
            <img 
              src={img2} 
              alt="Tienda Cocinas Appel" 
              class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" 
              loading="lazy" 
            />
            <div class="absolute top-4 left-4 z-20">
              <span class="px-3 py-1 rounded-full bg-white/90 backdrop-blur text-xs font-bold text-amber-700 shadow-sm ring-1 ring-amber-200">
                Visítanos
              </span>
            </div>
          </div>
          <div class="p-6 md:p-8 flex-1 flex flex-col relative">
            <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
            <p class="text-slate-600 leading-relaxed">
              <strong class="block text-slate-900 font-semibold mb-2 text-lg">Atención Personalizada</strong>
              Fachada de nuestra tienda, donde puedes ver las cocinas, retirar pedidos y recibir asesoría directa de expertos.
            </p>
          </div>
        </div>

        <!-- Card 3: Hogar -->
        <div class="group relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden ring-1 ring-slate-200/60 flex flex-col">
          <div class="relative h-64 overflow-hidden">
            <div class="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/0 transition-colors duration-500 z-10"></div>
            <img 
              src={img3} 
              alt="Cocina instalada en hogar" 
              class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" 
              loading="lazy" 
            />
            <div class="absolute top-4 left-4 z-20">
              <span class="px-3 py-1 rounded-full bg-white/90 backdrop-blur text-xs font-bold text-emerald-700 shadow-sm ring-1 ring-emerald-200">
                Resultado Final
              </span>
            </div>
          </div>
          <div class="p-6 md:p-8 flex-1 flex flex-col relative">
            <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
            <p class="text-slate-600 leading-relaxed">
              <strong class="block text-slate-900 font-semibold mb-2 text-lg">Calidez en tu Hogar</strong>
              Una de nuestras cocinas a leña instaladas y funcionando, lista para brindar calor y confort en el uso diario.
            </p>
          </div>
        </div>
      </div>
    </section>
  </section>
  <ChatBot />
</main>


