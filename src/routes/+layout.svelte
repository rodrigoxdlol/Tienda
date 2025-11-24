<script lang="ts">
  import { page } from '$app/stores';
  import '../app.css';
  import { onMount } from 'svelte';
  import { initSession, user, doLogout } from '$lib/auth.store';
  import CartMini from '$lib/components/CartMini.svelte';
  import ToastHost from '$lib/ui/ToastHost.svelte';
  import { contactStatsStore, refreshContactStats } from '$lib/stores/contactStats.store';
  import type { ContactStats } from '$lib/api';
  import { trackVisitOncePerDay } from '$lib/analytics'; // 👈 registra visita 1 vez por día

  const LOGO = '/images/LogoCocinas.png';

  let contactStats: ContactStats | null = null;

  let mobileOpen = false;
  const toggle = () => (mobileOpen = !mobileOpen);
  const close = () => (mobileOpen = false);

  // dropdown del cliente
  let clientOpen = false;

  onMount(() => {
    // sesión + reclamos pendientes
    initSession();
    refreshContactStats();
    trackVisitOncePerDay();
    // registrar visita 1 vez por día por navegador
    

    // suscripción al store para el badge de reclamos
    const unsubscribe = contactStatsStore.subscribe((value) => {
      contactStats = value;
    });

    // cleanup al desmontar
    return unsubscribe;
  });

  async function handleLogout(e: Event) {
    e.preventDefault();
    await doLogout();
    window.location.href = '/'; // o usa goto('/') si prefieres SPA
  }

  $: current = $page.url.pathname;

  const linkBase = 'px-3 py-1.5 rounded-lg text-sm font-medium transition';
  function navClass(href: string) {
    const active = current === href;
    return `${linkBase} ${
      active ? 'bg-slate-100 text-slate-900' : 'text-slate-800 hover:bg-slate-100'
    }`;
  }

  const btn =
    'inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium transition';
  const btnGhost = `${btn} ring-1 ring-slate-300 hover:bg-slate-100 text-slate-900`;
  const btnPrimary = `${btn} bg-amber-600 text-white hover:bg-amber-700 shadow`;
</script>

<ToastHost />

<div class="min-h-screen flex flex-col bg-slate-50 text-slate-900">
  <!-- NAV AMARILLO SUAVE -->
  <nav class="sticky top-0 z-40 bg-amber-100/80 backdrop-blur border-b border-amber-200">
    <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
      <!-- Logo -->
      <a href="/" class="inline-flex items-center" aria-label="Ir al inicio">
        <img
          src={LOGO}
          alt="Cocinas Appel"
          class="h-10 sm:h-12 w-auto select-none"
          draggable="false"
        />
      </a>

      <!-- Links desktop -->
      <div class="hidden md:flex gap-1.5 items-center">
        <a href="/" class={navClass('/')}>Inicio</a>
        <a href="/hacemos" class={navClass('/hacemos')}>Hacemos</a>
        <a href="/productos" class={navClass('/productos')}>Productos</a>
        <a href="/contacto" class={navClass('/contacto')}>Contacto</a>
        <a href="/galeria" class={navClass('/galeria')}>Galería</a>
        <a href="/noticias" class={navClass('/noticias')}>Noticias</a>
      </div>

      <!-- Acciones desktop -->
      <div class="hidden md:flex items-center gap-2">
        {#if $user?.authenticated}
          <span class="text-sm text-slate-700 hidden lg:inline">
            Hola, <b>{$user.username}</b>
          </span>

          {#if $user?.is_staff}
            <!-- ADMIN: Panel admin con badge de reclamos pendientes -->
            <a href="/admin" class={btnGhost}>
              <span>Panel admin</span>
              {#if contactStats?.pending}
                <span
                  class="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center
                         rounded-full bg-red-500 text-[11px] font-semibold text-white px-1.5"
                >
                  {contactStats.pending}
                </span>
              {/if}
            </a>
          {:else}
            <!-- CLIENTE: dropdown con Mis pedidos / Mi perfil -->
            <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
            <div
              class="relative"
              role="group"
              on:keydown={(e) => e.key === 'Escape' && (clientOpen = false)}
              on:focusout={(e) => {
                const target = e.currentTarget as HTMLElement;
                const next = e.relatedTarget as Node | null;
                if (!next || !target.contains(next)) clientOpen = false;
              }}
            >
              <button
                type="button"
                class={`${btnGhost} inline-flex items-center gap-1`}
                aria-haspopup="menu"
                aria-expanded={clientOpen}
                on:click={() => (clientOpen = !clientOpen)}
              >
                Mi cuenta
                <svg
                  viewBox="0 0 24 24"
                  class="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  aria-hidden="true"
                >
                  <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>

              {#if clientOpen}
                <div
                  class="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-lg py-1 z-50"
                  role="menu"
                >
                  <a
                    href="/mi-cuenta/pedidos"
                    class="block px-3 py-2 text-sm hover:bg-slate-50"
                    role="menuitem"
                    on:click={() => (clientOpen = false)}
                  >
                    Mis pedidos
                  </a>
                  <a
                    href="/mi-cuenta/perfil"
                    class="block px-3 py-2 text-sm hover:bg-slate-50"
                    role="menuitem"
                    on:click={() => (clientOpen = false)}
                  >
                    Mi perfil
                  </a>
                  <a
                    href="/mi-cuenta/cambiar-contraseña"
                    class="block px-3 py-2 text-sm hover:bg-slate-50"
                    role="menuitem"
                    on:click={() => (clientOpen = false)}
                  >
                    Cambiar contraseña
                  </a>
                  <a
                    href="/mi-cuenta/reclamos"
                    class="block px-3 py-2 text-sm hover:bg-slate-50"
                    role="menuitem"
                    on:click={() => (clientOpen = false)}
                  >
                    Mis reclamos
                  </a>
                </div>
              {/if}
            </div>
          {/if}

          <!-- Botón cerrar sesión -->
          <a href="/logout" on:click|preventDefault={handleLogout} class={btnGhost}>
            <svg
              viewBox="0 0 24 24"
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <path
                d="M9 12h10m0 0-3-3m3 3-3 3"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M13 6V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2v-1"
                stroke-linecap="round"
              />
            </svg>
            Cerrar
          </a>
        {:else}
          <a href="/login" class={btnGhost}>
            <svg
              viewBox="0 0 24 24"
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <path
                d="M15 12H5m0 0 3-3M5 12l3 3"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M10 6V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2v-1"
                stroke-linecap="round"
              />
            </svg>
            Iniciar sesión
          </a>
          <a href="/registro" class={btnPrimary}>Crear cuenta</a>
        {/if}

        <!-- Carrito mini (desktop) -->
        <CartMini />
      </div>

      <!-- Botón menú móvil -->
      <button
        class="md:hidden inline-flex items-center justify-center rounded-lg p-2 ring-1 ring-slate-300 hover:bg-slate-100"
        on:click={toggle}
        aria-expanded={mobileOpen}
        aria-controls="mobile-menu"
        aria-label="Abrir menú"
      >
        {#if mobileOpen}
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
          </svg>
        {:else}
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 7h16M4 12h16M4 17h16" stroke-linecap="round" />
          </svg>
        {/if}
      </button>
    </div>

    <!-- Menú móvil -->
    {#if mobileOpen}
      <div id="mobile-menu" class="md:hidden border-t border-amber-200 bg-amber-100">
        <div class="max-w-6xl mx-auto px-4 py-3 space-y-2">
          <!-- Navegación pública -->
          <div class="grid grid-cols-2 gap-2">
            <a href="/" class={navClass('/')} on:click={close}>Inicio</a>
            <a href="/hacemos" class={navClass('/hacemos')} on:click={close}>Qué hacemos</a>
            <a href="/productos" class={navClass('/productos')} on:click={close}>Productos</a>
            <a href="/contacto" class={navClass('/contacto')} on:click={close}>Contacto</a>
            <a href="/galeria" class={navClass('/galeria')} on:click={close}>Galería</a>
            <a href="/noticias" class={navClass('/noticias')} on:click={close}>Noticias</a>
          </div>

          <div class="pt-2 border-t border-amber-200 flex flex-wrap items-center gap-2">
            {#if $user?.authenticated}
              {#if $user?.is_staff}
                <!-- ADMIN en móvil: Panel admin con badge -->
                <a href="/admin" class={btnPrimary} on:click={close}>
                  <span>Panel admin</span>
                  {#if contactStats?.pending}
                    <span
                      class="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center
                             rounded-full bg-red-500 text-[11px] font-semibold text-white px-1.5"
                    >
                      {contactStats.pending}
                    </span>
                  {/if}
                </a>
              {:else}
                <!-- CLIENTE en móvil: accesos directos -->
                <a href="/mi-cuenta/pedidos" class={btnGhost} on:click={close}>
                  Mis pedidos
                </a>
                <a href="/mi-cuenta/perfil" class={btnGhost} on:click={close}>
                  Mi perfil
                </a>
              {/if}

              <a
                href="/logout"
                on:click|preventDefault={(e) => {
                  handleLogout(e);
                  close();
                }}
                class={btnGhost}
              >
                Cerrar sesión
              </a>
            {:else}
              <a href="/login" class={btnGhost} on:click={close}>Iniciar sesión</a>
              <a href="/registro" class={btnPrimary} on:click={close}>Crear cuenta</a>
            {/if}

            <div class="ml-auto">
              <CartMini />
            </div>
          </div>
        </div>
      </div>

      <!-- Cierra al tocar fuera -->
      <button
        type="button"
        aria-label="Cerrar menú"
        class="fixed inset-0 -z-10 md:hidden"
        on:click={close}
      ></button>
    {/if}
  </nav>

  <!-- Contenido -->
  <main class="flex-1 max-w-6xl mx-auto px-4 py-8">
    <slot />
  </main>

  <!-- Barra de redes -->
  <div class="flex justify-center gap-6 py-8">
    <!-- Facebook -->
    <a
      href="https://www.facebook.com/cocinasappel/?locale=es_LA"
      target="_blank"
      rel="noopener"
      aria-label="Facebook"
      class="grid h-12 w-12 place-items-center rounded-full bg-[#1877F2] text-white shadow hover:shadow-lg hover:scale-105 transition"
    >
      <svg viewBox="0 0 24 24" class="h-6 w-6" fill="currentColor" aria-hidden="true">
        <path
          d="M22 12a10 10 0 1 0-11.6 9.9v-7h-2.6V12h2.6V9.7c0-2.6 1.5-4 3.9-4 1.1 0 2.3.2 2.3.2v2.5h-1.3c-1.3 0-1.8.8-1.8 1.7V12h3l-.5 2.9h-2.5v7A10 10 0 0 0 22 12z"
        />
      </svg>
    </a>

    <!-- WhatsApp -->
    <a
      href="https://wa.me/56977082796?text=Hola%20quiero%20información"
      target="_blank"
      rel="noopener"
      aria-label="WhatsApp"
      class="grid h-12 w-12 place-items-center rounded-full bg-[#25D366] text-white shadow hover:shadow-lg hover:scale-105 transition"
    >
      <svg viewBox="0 0 24 24" class="h-6 w-6" fill="currentColor" aria-hidden="true">
        <path
          d="M20.5 3.5A11.9 11.9 0 0 0 12 0C5.4 0 0 5.4 0 12c0 2 .5 3.8 1.4 5.5L0 24l6.7-1.8A12 12 0 0 0 12 24c6.6 0 12-5.4 12-12 0-3.2-1.3-6.2-3.5-8.5zM12 22a10 10 0 0 1-5.1-1.4l-.4-.3-4 .9.9-3.9-.3-.4A9.9 9.9 0 1 1 22 12c0 5.5-4.5 10-10 10zm5-7.6c-.3-.2-1.8-.9-2-.9-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.4.2-.7 0a7.6 7.6 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-1.9c-.2-.3 0-.5.2-.7l.5-.6c.1-.2.2-.3.3-.6 0-.2 0-.4 0-.6 0-.2-.7-1.7-1-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.9 4.2 4 .6.3 1.1.5 1.5.6.6.2 1.1.2 1.6.1.5-.1 1.8-.7 2-1.4.2-.7.2-1.3.1-1.4z"
        />
      </svg>
    </a>

    <!-- Email -->
    <a
      href="mailto:appelpatagonia@gmail.com?subject=Consulta&body=Hola%2C%20quisiera%20informaci%C3%B3n..."
      aria-label="Email"
      class="grid h-12 w-12 place-items-center rounded-full bg-slate-500 text-white shadow hover:shadow-lg hover:scale-105 transition"
    >
      <svg viewBox="0 0 24 24" class="h-6 w-6" fill="currentColor" aria-hidden="true">
        <path
          d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5L4 8V6l8 5 8-5v2Z"
        />
      </svg>
    </a>
  </div>

  <!-- FOOTER NEGRO (CÁLIDO) CON MÁS INFO -->
  <footer class="bg-stone-950 border-t border-stone-800 text-stone-200">
    <div class="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div class="flex flex-col gap-6 md:flex-row md:justify-between md:items-start">
        <!-- Columna marca -->
        <div class="md:w-1/2 space-y-2">
          <h2 class="text-base font-semibold tracking-wide text-stone-100">
            Cocinas Appel · Coyhaique
          </h2>
          <p class="text-sm text-stone-400 leading-relaxed">
            Fábrica y venta de cocinas a leña, calefactores de combustión lenta y soluciones
            de hojalatería para el sur de Chile. Más de 55 años de experiencia al servicio de la región.
          </p>
        </div>

        <!-- Columnas de enlaces -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 md:w-1/2 text-sm">
          <div>
            <h3 class="text-xs font-semibold tracking-[0.18em] uppercase text-stone-300">
              Contacto
            </h3>
            <ul class="mt-3 space-y-1.5 text-stone-300">
              <li>Coyhaique, Región de Aysén, Chile</li>
              <li>+56 9 77082796</li>
              <li>appelpatagonia@gmail.com</li>
              <li class="text-stone-500 text-xs">
                Horario de atención referencial: Lun a Vie, 10:00 a 18:00 hrs.
              </li>
            </ul>
          </div>

          <div>
            <h3 class="text-xs font-semibold tracking-[0.18em] uppercase text-stone-300">
              Información
            </h3>
            <ul class="mt-3 space-y-1.5 text-stone-300">
              <li><a href="/productos" class="hover:text-amber-300 transition">Catálogo de productos</a></li>
              <li><a href="/contacto" class="hover:text-amber-300 transition">Solicitar cotización</a></li>
              <li><a href="/galeria" class="hover:text-amber-300 transition">Galería</a></li>
              <li>
                <a href="/privacidad" class="hover:text-amber-300 transition">
                  Política de privacidad
                </a>
              </li>

              <li class="text-stone-500 text-xs mt-2">
                Sitio web de demostración para fines académicos.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Barra inferior -->
      <div class="border-t border-stone-800 pt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs text-stone-500">
        <p>
          © {new Date().getFullYear()} Cocinas Appel. Todos los derechos reservados.
        </p>
        <p>
          Desarrollado como proyecto académico de transformación digital. Proyecto propio.
        </p>
      </div>
    </div>
  </footer>
</div>














