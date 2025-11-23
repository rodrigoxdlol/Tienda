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
      <div class="rounded-2xl border border-dashed border-slate-300 bg-white/80 py-10 sm:py-12 flex flex-col items-center gap-2">
        <div class="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
          <svg class="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none">
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
          class="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-md shadow-slate-200 backdrop-blur-sm"
          on:pointerdown|passive={onPointerDown}
          on:pointerup|passive={onPointerUp}
          on:mouseenter={() => { hovering = true; stop(); }}
          on:mouseleave={() => { hovering = false; start(); }}
          on:touchstart={() => { hovering = true; stop(); }}
          on:touchend={() => { hovering = false; start(); }}
        >
          <!-- Contenedor con altura responsive -->
          <div
            class="relative bg-slate-100 h-56 xs:h-64 sm:h-72 md:h-[420px] lg:h-[520px] max-h-[75vh] aspect-[16/9]"
          >
            <!-- TRACK -->
            <div
              class="flex h-full w-full transition-transform duration-500 ease-out will-change-transform"
              style={`transform: translateX(-${i * 100}%);`}
            >
              {#each items as it (it.id)}
                <div class="relative min-w-full h-full">
                  <!-- Fondo difuminado -->
                  <img
                    src={it.image}
                    alt=""
                    class="absolute inset-0 h-full w-full object-cover blur-sm scale-110 opacity-40"
                    draggable="false"
                    loading="lazy"
                    aria-hidden="true"
                  />
                  <!-- Imagen principal centrada -->
                  <img
                    src={it.image}
                    alt={it.title ?? 'Imagen de la galería'}
                    class="absolute inset-0 h-full w-full object-contain p-3 sm:p-4 md:p-6"
                    draggable="false"
                    loading="lazy"
                  />

                  <!-- Overlay de texto -->
                  {#if it.title || it.caption}
                    <div class="pointer-events-none absolute inset-x-0 bottom-0">
                      <div class="bg-gradient-to-t from-black/70 via-black/35 to-transparent px-3 py-3 sm:px-4 sm:py-4">
                        {#if it.title}
                          <div class="text-white text-sm sm:text-base font-semibold drop-shadow">
                            {it.title}
                          </div>
                        {/if}
                        {#if it.caption}
                          <div class="text-white/90 text-xs sm:text-sm leading-snug max-w-3xl drop-shadow mt-0.5">
                            {it.caption}
                          </div>
                        {/if}
                      </div>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>

            <!-- Esquina superior: contador + estado -->
            <div class="absolute left-3 top-3 flex items-center gap-2 text-[11px] sm:text-xs">
              <span class="inline-flex items-center rounded-full bg-black/55 text-white px-2 py-0.5 backdrop-blur">
                {i + 1} / {items.length}
              </span>
              {#if playing}
                <!-- svelte-ignore element_invalid_self_closing_tag -->
                <span class="hidden sm:inline-flex items-center gap-1 rounded-full bg-black/45 text-white/90 px-2 py-0.5 backdrop-blur">
                  <span class="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Reproducción automática
                </span>
              {/if}
            </div>

            <!-- Prev -->
            <button
              type="button"
              class="group absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 grid place-items-center
                     h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-black/45 text-white shadow-md
                     hover:bg-black/65 focus:outline-none focus:ring-2 focus:ring-white/70"
              on:click={prev}
              aria-label="Anterior"
            >
              <svg viewBox="0 0 24 24" class="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 6l-6 6 6 6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>

            <!-- Next -->
            <button
              type="button"
              class="group absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 grid place-items-center
                     h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-black/45 text-white shadow-md
                     hover:bg-black/65 focus:outline-none focus:ring-2 focus:ring-white/70"
              on:click={next}
              aria-label="Siguiente"
            >
              <svg viewBox="0 0 24 24" class="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>

            <!-- Dots -->
            <div class="absolute left-0 right-0 bottom-3 flex items-center justify-center gap-2">
              {#each items as _, idx}
                <button
                  type="button"
                  class={`h-1.5 sm:h-2 rounded-full transition-all duration-300
                          ${i === idx ? 'w-5 sm:w-7 bg-white shadow-sm' : 'w-1.5 sm:w-2.5 bg-white/60 hover:bg-white/90'}`}
                  on:click={() => goTo(idx)}
                  aria-label={`Ir a la imagen ${idx + 1}`}
                  aria-current={i === idx}
                />
              {/each}
            </div>

            <!-- Play / Pause -->
            <div class="absolute right-2 sm:right-3 bottom-3">
              <button
                type="button"
                class="rounded-full bg-black/45 text-white h-8 w-8 sm:h-9 sm:w-9 grid place-items-center hover:bg-black/65 focus:outline-none focus:ring-2 focus:ring-white/70"
                on:click={togglePlay}
                aria-label={playing ? 'Pausar' : 'Reproducir'}
              >
                {#if playing}
                  <svg viewBox="0 0 24 24" class="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor">
                    <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
                  </svg>
                {:else}
                  <svg viewBox="0 0 24 24" class="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                {/if}
              </button>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
  <ChatBot />
</section>





