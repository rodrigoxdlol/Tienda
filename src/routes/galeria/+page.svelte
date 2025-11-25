<script lang="ts">
  import { onMount } from 'svelte';
  import { listGalleryImages } from '$lib/api';
  import ChatBot from '$lib/components/ChatBot.svelte';
  let items: any[] = [];
  let i = 0;

  // autoplay
  let playing = true;
  let hovering = false;
  let timer: ReturnType<typeof setInterval> | null = null;
  const AUTOPLAY_MS = 4500;

  onMount(async () => {
    try {
      const raw = await listGalleryImages();
      items = (raw ?? [])
        .filter((x: any) => x.is_active !== false)
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
    } catch (e) {
      console.error(e);
    }
    start();
    return stop;
  });

  function next() { i = (i + 1) % Math.max(items.length, 1); }
  function prev() { i = (i - 1 + Math.max(items.length, 1)) % Math.max(items.length, 1); }
  function goTo(idx: number) { i = idx; }

  function start() {
    stop();
    if (playing && !hovering && items.length > 1) {
      timer = setInterval(next, AUTOPLAY_MS);
    }
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

  // swipe
  let startX = 0;
  function onPointerDown(e: PointerEvent) {
    startX = e.clientX;
    stop();
  }
  function onPointerUp(e: PointerEvent) {
    const dx = e.clientX - startX;
    if (dx > 40) prev();
    if (dx < -40) next();
    if (playing && !hovering) start();
  }
</script>

<section class="bg-slate-50/80 py-8 sm:py-10 lg:py-14">
  <div class="mx-auto max-w-6xl px-4">
    <!-- Encabezado -->
    <div class="mb-6 sm:mb-8 text-center space-y-2">
      <div class="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-100">
        <span class="inline-block h-1.5 w-1.5 rounded-full bg-amber-500"></span>
        Galería de Cocinas Appel
      </div>
      <h1 class="text-xl sm:text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">
        Proyectos y diseños destacados
      </h1>
      <p class="text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl mx-auto">
        Explora algunas de las cocinas y trabajos realizados. Desliza en el celular o usa las flechas para navegar.
      </p>
    </div>

    {#if !items.length}
      <div class="rounded-3xl border border-dashed border-slate-300 bg-gradient-to-br from-white via-slate-50 to-amber-50/30 py-10 sm:py-12 flex flex-col items-center gap-2 shadow-xl">
        <div class="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
          <svg class="h-8 w-8 text-slate-400" viewBox="0 0 24 24" fill="none">
            <path d="M4 16L8.5 10L13 15L16 11L20 16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
            <circle cx="9" cy="6" r="1.5" stroke="currentColor" stroke-width="1.4" />
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.4" />
          </svg>
        </div>
        <p class="text-slate-900 text-sm font-medium">Aún no hay imágenes en la galería.</p>
        <p class="text-slate-500 text-xs sm:text-sm">Cuando subas fotos desde el panel admin, aparecerán aquí automáticamente.</p>
      </div>
    {:else}
      <div class="relative mx-auto w-full select-none">
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="relative overflow-hidden rounded-3xl ring-1 ring-slate-200/50 bg-gradient-to-br from-white via-slate-50 to-amber-50/30 shadow-2xl backdrop-blur-sm"
          on:pointerdown|passive={onPointerDown}
          on:pointerup|passive={onPointerUp}
          on:mouseenter={() => { hovering = true; stop(); }}
          on:mouseleave={() => { hovering = false; start(); }}
          on:touchstart={() => { hovering = true; stop(); }}
          on:touchend={() => { hovering = false; start(); }}
        >
          <!-- Elementos decorativos de fondo -->
          <div class="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-200/10 via-orange-200/10 to-red-200/10 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-orange-100/20 to-amber-100/20 rounded-full blur-3xl pointer-events-none"></div>

          <!-- Contenedor con altura responsive -->
          <div class="relative bg-gradient-to-br from-slate-50 to-slate-100/50 h-72 xs:h-80 sm:h-[400px] md:h-[500px] lg:h-[600px] max-h-[75vh] overflow-hidden">
            <!-- TRACK con deslizamiento -->
            <div
              class="flex h-full w-full transition-transform duration-700 ease-out will-change-transform"
              style="transform: translateX(-{i * 100}%)"
            >
              {#each items as it (it.id)}
                <div class="relative min-w-full h-full flex-shrink-0">
                  <!-- Fondo difuminado -->
                  <img
                    src={it.image}
                    alt=""
                    class="absolute inset-0 h-full w-full object-cover blur-xl scale-110 opacity-30"
                    draggable="false"
                    loading="lazy"
                    aria-hidden="true"
                  />
                  <!-- Imagen principal centrada -->
                  <div class="absolute inset-0 flex items-center justify-center p-2 sm:p-3 md:p-4">
                    <img
                      src={it.image}
                      alt={it.title ?? 'Imagen de la galería'}
                      class="max-h-full max-w-full object-contain drop-shadow-2xl transform transition-transform duration-700"
                      draggable="false"
                      loading="lazy"
                    />
                  </div>

                  <!-- Overlay decorativo -->
                  <div class="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent pointer-events-none"></div>

                  <!-- Overlay de texto -->
                  {#if it.title || it.caption}
                    <div class="pointer-events-none absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 md:bottom-6 md:left-8 md:right-8">
                      <div class="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl ring-1 ring-slate-200/50 px-4 py-3 sm:px-5 sm:py-4">
                        {#if it.title}
                          <div class="flex items-center gap-2 mb-1">
                            <div class="h-1 w-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"></div>
                            <div class="text-base sm:text-lg font-bold text-slate-900">
                              {it.title}
                            </div>
                          </div>
                        {/if}
                        {#if it.caption}
                          <div class="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-3xl">
                            {it.caption}
                          </div>
                        {/if}
                      </div>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>

            <!-- Contador + estado -->
            <div class="absolute left-4 top-4 sm:left-6 sm:top-6 flex items-center gap-2 z-10">
              <span class="inline-flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-md text-white px-3 py-1.5 text-xs font-semibold shadow-lg ring-1 ring-white/10">
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                {i + 1} / {items.length}
              </span>
              {#if playing}
                <span class="hidden sm:inline-flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-md text-white/90 px-3 py-1.5 text-xs font-medium shadow-lg ring-1 ring-white/10">
                  <span class="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Reproducción automática
                </span>
              {/if}
            </div>

            <!-- Prev -->
            <button
              type="button"
              class="group absolute left-3 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 z-10
                     h-11 w-11 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-full
                     bg-white/90 backdrop-blur-md shadow-xl ring-1 ring-slate-200/50
                     text-slate-900 hover:bg-white hover:scale-110
                     focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
                     transition-all duration-300 transform"
              on:click={prev}
              aria-label="Anterior"
            >
              <svg viewBox="0 0 24 24" class="h-5 w-5 sm:h-6 sm:w-6 mx-auto group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M15 6l-6 6 6 6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>

            <!-- Next -->
            <button
              type="button"
              class="group absolute right-3 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 z-10
                     h-11 w-11 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-full
                     bg-white/90 backdrop-blur-md shadow-xl ring-1 ring-slate-200/50
                     text-slate-900 hover:bg-white hover:scale-110
                     focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
                     transition-all duration-300 transform"
              on:click={next}
              aria-label="Siguiente"
            >
              <svg viewBox="0 0 24 24" class="h-5 w-5 sm:h-6 sm:w-6 mx-auto group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
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

          <!-- Dots rediseñados -->
          <div class="absolute left-0 right-0 -bottom-3 flex items-center justify-center gap-2 sm:gap-3 px-4">
            {#each items as _, idx}
              <button
                type="button"
                class="group relative transition-all duration-300"
                class:scale-110={i === idx}
                on:click={() => goTo(idx)}
                aria-label="Ir a la imagen {idx + 1}"
                aria-current={i === idx}
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
      </div>
    {/if}

    <!-- Sección Recomendaciones -->
    <div class="mt-20 md:mt-24 mb-16">
      <div class="text-center mb-12">
        <h2 class="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight uppercase relative inline-block">
          <span class="relative z-10">Recomendaciones</span>
          <div class="absolute -bottom-2 left-0 right-0 h-3 bg-amber-200/50 -rotate-1 z-0 rounded-full"></div>
        </h2>
        <p class="mt-4 text-slate-600 max-w-2xl mx-auto text-sm md:text-base">
          Consejos importantes para el cuidado, mantenimiento y uso eficiente de tus productos Appel.
        </p>
      </div>

      <div class="grid md:grid-cols-3 gap-8 lg:gap-10">
        <!-- Card 1: Recomendación -->
        <div class="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden ring-1 ring-slate-200/60 flex flex-col">
          <div class="relative h-64 overflow-hidden">
            <div class="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/0 transition-colors duration-500 z-10"></div>
            <img 
              src="/images/recomendacion-canos.jpg" 
              alt="Recomendación uso de caños" 
              class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
            />
            <!-- Badge flotante -->
            <div class="absolute top-4 left-4 z-20">
              <span class="px-3 py-1 rounded-full bg-white/90 backdrop-blur text-xs font-bold text-amber-700 shadow-sm ring-1 ring-amber-200">
                Mantenimiento
              </span>
            </div>
          </div>
          
          <div class="p-6 md:p-8 flex-1 flex flex-col relative">
            <!-- Borde superior decorativo -->
            <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
            
            <h3 class="text-xl font-bold text-red-700 mb-1">Recomendación</h3>
            <h4 class="text-lg font-medium text-slate-900 mb-4 pb-4 border-b border-slate-100">
              Uso de los caños
            </h4>
            
            <p class="text-sm text-slate-600 leading-relaxed flex-1">
              <span class="block font-semibold text-emerald-700 mb-2 uppercase text-xs tracking-wide">
                Limpieza Periódica
              </span>
              Limpiar periódicamente los ductos para el cuidado del hogar. Usar leña seca preferentemente e instalar con instaladores calificados para sus caños.
            </p>
          </div>
        </div>

        <!-- Card 2: Cámaras de Combustión -->
        <div class="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden ring-1 ring-slate-200/60 flex flex-col">
          <div class="relative h-64 overflow-hidden">
            <div class="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/0 transition-colors duration-500 z-10"></div>
             <img 
              src="/images/recomendacion-camaras.jpg" 
              alt="Cámaras de combustión" 
              class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
            />
            <div class="absolute top-4 left-4 z-20">
              <span class="px-3 py-1 rounded-full bg-white/90 backdrop-blur text-xs font-bold text-purple-700 shadow-sm ring-1 ring-purple-200">
                Repuestos
              </span>
            </div>
          </div>
          
          <div class="p-6 md:p-8 flex-1 flex flex-col relative">
            <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>

            <h3 class="text-xl font-bold text-red-700 mb-1">Cámaras de Combustión</h3>
            <h4 class="text-lg font-medium text-slate-900 mb-4 pb-4 border-b border-slate-100">
              Renovación y Fabricación
            </h4>
            
            <p class="text-sm text-slate-600 leading-relaxed flex-1">
              Reemplaza tu cámara de combustión vieja por una nueva. Te la podemos fabricar para que no gastes más leña y tenga una muy buena funcionalidad.
            </p>
          </div>
        </div>

        <!-- Card 3: Uso del Bullon -->
        <div class="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden ring-1 ring-slate-200/60 flex flex-col">
          <div class="relative h-64 overflow-hidden">
            <div class="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/0 transition-colors duration-500 z-10"></div>
             <img 
              src="/images/recomendacion-bullon.jpg" 
              alt="Recomendación Bullon" 
              class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
            />
            <div class="absolute top-4 left-4 z-20">
              <span class="px-3 py-1 rounded-full bg-white/90 backdrop-blur text-xs font-bold text-red-700 shadow-sm ring-1 ring-red-200">
                Instalación
              </span>
            </div>
          </div>
          
          <div class="p-6 md:p-8 flex-1 flex flex-col relative">
            <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>

            <h3 class="text-xl font-bold text-red-700 mb-1">Recomendación</h3>
            <h4 class="text-lg font-medium text-slate-900 mb-4 pb-4 border-b border-slate-100">
              Bullones y Estanques
            </h4>
            
            <p class="text-sm text-slate-600 leading-relaxed flex-1">
              Instalar con personal calificado para la buena funcionalidad de sus bullones, termo a leña y estanques. Siempre recordar revisar el agua de la red.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Sección Logo de Resina -->
    <div class="mt-16 md:mt-20">
      <div class="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-white via-slate-50 to-amber-50/30 ring-1 ring-slate-200/50">
        <!-- Elementos decorativos de fondo -->
        <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-orange-200/20 via-amber-200/20 to-red-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div class="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-amber-100/30 to-orange-100/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>

        <div class="relative grid md:grid-cols-2 gap-8 md:gap-12 items-center p-8 md:p-12 lg:p-16">
          <!-- Lado izquierdo: Texto -->
          <div class="space-y-6 md:space-y-8 relative z-10">
            <!-- Badge superior -->
            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/10 to-amber-500/10 ring-1 ring-orange-300/30 backdrop-blur-sm">
              <span class="relative flex h-3 w-3">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
              </span>
              <span class="text-xs font-bold text-orange-700 tracking-wide uppercase">Novedad</span>
            </div>

            <!-- Título principal -->
            <div class="space-y-3">
              <h2 class="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                <span class="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 bg-clip-text text-transparent">
                  Nuestro nuevo
                </span>
                <br />
                <span class="text-slate-900">logo de resina</span>
              </h2>
              
              <!-- Línea decorativa animada -->
              <div class="flex items-center gap-3">
                <div class="h-1 w-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"></div>
                <div class="h-1 w-8 bg-gradient-to-r from-amber-500 to-orange-400 rounded-full animate-pulse"></div>
              </div>
            </div>

            <!-- Subtítulo -->
            <div class="inline-block">
              <p class="text-xl md:text-2xl font-semibold text-slate-700 bg-white/60 backdrop-blur-sm px-5 py-3 rounded-2xl ring-1 ring-slate-200/50 shadow-sm">
                de <span class="text-orange-600 font-bold">alta temperatura</span>
              </p>
            </div>

            <!-- Descripción adicional -->
            <p class="text-base md:text-lg text-slate-600 leading-relaxed max-w-md">
              Tecnología de punta aplicada en nuestros productos para resistir las condiciones más exigentes.
            </p>

            <!-- Features -->
            <div class="grid grid-cols-2 gap-4 pt-2">
              <div class="flex items-start gap-3 p-3 rounded-xl bg-white/50 backdrop-blur-sm ring-1 ring-slate-200/50">
                <div class="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-sm">
                  <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-semibold text-slate-900">Resistente</p>
                  <p class="text-xs text-slate-600">Alta durabilidad</p>
                </div>
              </div>

              <div class="flex items-start gap-3 p-3 rounded-xl bg-white/50 backdrop-blur-sm ring-1 ring-slate-200/50">
                <div class="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm">
                  <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11.603 7.963a.75.75 0 00-.977.65l-.275 2.474-1.375-1.14a.75.75 0 10-.954 1.152l2.474 2.052a.75.75 0 001.17-.476l.476-4.286a.75.75 0 00-.539-.926z"/>
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-semibold text-slate-900">Calidad</p>
                  <p class="text-xs text-slate-600">Premium</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Lado derecho: Imagen -->
          <div class="relative group">
            <!-- Efecto de resplandor detrás de la imagen -->
            <div class="absolute inset-0 bg-gradient-to-br from-orange-400/30 via-amber-400/30 to-red-400/30 rounded-2xl blur-2xl group-hover:blur-3xl transition-all duration-500 animate-pulse"></div>
            
            <!-- Contenedor de imagen con efecto 3D -->
            <div class="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/50 transform group-hover:scale-[1.02] transition-all duration-500">
              <img 
                src="/images/logo-resina.jpg" 
                alt="Nuevo logo de resina Appel de alta temperatura" 
                class="w-full h-auto object-cover"
                loading="lazy"
              />
              
              <!-- Overlay con gradiente sutil -->
              <div class="absolute inset-0 bg-gradient-to-t from-slate-900/10 via-transparent to-transparent pointer-events-none"></div>
              
              <!-- Badge flotante en la imagen -->
              <div class="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-xl p-3 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <div class="flex items-center gap-3">
                  <div class="shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"/>
                    </svg>
                  </div>
                  <div class="flex-1">
                    <p class="text-xs font-bold text-orange-600 uppercase tracking-wide">Resina Especial</p>
                    <p class="text-sm font-semibold text-slate-900">Alta Temperatura</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <ChatBot />
</section>





