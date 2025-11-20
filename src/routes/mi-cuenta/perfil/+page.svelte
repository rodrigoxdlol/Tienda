<script lang="ts">
  import { onMount } from 'svelte';
  import { user } from '$lib/auth.store';
  import { toastError, toastSuccess } from '$lib/ui/toast';

  const API = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') ?? '';

  // Utilidad CSRF (igual que en admin)
  function csrftoken() {
    if (typeof document === 'undefined') return '';
    return (
      document.cookie
        .split('; ')
        .find((x) => x.startsWith('csrftoken='))?.split('=')[1] ?? ''
    );
  }

  type Profile = {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };

  let loading = true;
  let saving = false;
  let error = '';

  // Campos de formulario
  let profile: Profile | null = null;
  let firstName = '';
  let lastName = '';
  let email = '';

  onMount(loadProfile);

  async function loadProfile() {
    if (!API) {
      error = 'No está configurada la URL de la API (VITE_API_URL).';
      loading = false;
      return;
    }

    loading = true;
    error = '';

    try {
      const res = await fetch(`${API}/api/me/profile/`, {
        credentials: 'include'
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Error ${res.status}`);
      }

      const data: Profile = await res.json();
      profile = data;
      firstName = data.first_name ?? '';
      lastName = data.last_name ?? '';
      email = data.email ?? '';
    } catch (e: any) {
      error = e?.message || 'No se pudo cargar el perfil.';
      toastError(error);
    } finally {
      loading = false;
    }
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!profile || !API) return;

    saving = true;
    error = '';

    try {
      const res = await fetch(`${API}/api/me/profile/`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken()
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email
        })
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Error ${res.status}`);
      }

      const data: Profile = await res.json();
      profile = data;
      toastSuccess('Perfil actualizado correctamente.');
    } catch (e: any) {
      error = e?.message || 'No se pudo guardar el perfil.';
      toastError(error);
    } finally {
      saving = false;
    }
  }
</script>

<section class="max-w-3xl mx-auto space-y-6">
  <header class="space-y-1">
    <h1 class="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
      Mi perfil
    </h1>
    <p class="text-slate-600 text-sm sm:text-base">
      Revisa y actualiza tus datos personales de tu cuenta en Cocinas Appel.
    </p>
  </header>

  {#if loading}
    <!-- svelte-ignore element_invalid_self_closing_tag -->
    <div class="space-y-3">
      <!-- svelte-ignore element_invalid_self_closing_tag -->
      <div class="h-4 w-40 rounded bg-slate-200 animate-pulse" />
      <div class="h-10 w-full rounded-xl bg-slate-200 animate-pulse" />
      <!-- svelte-ignore element_invalid_self_closing_tag -->
      <div class="h-10 w-full rounded-xl bg-slate-200 animate-pulse" />
      <!-- svelte-ignore element_invalid_self_closing_tag -->
      <div class="h-10 w-full rounded-xl bg-slate-200 animate-pulse" />
    </div>
  {:else if error}
    <div class="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {error}
    </div>
  {:else if !profile}
    <p class="text-sm text-slate-600">
      No se pudo obtener la información de tu perfil. Intenta recargar la página.
    </p>
  {:else}
    <form
      on:submit|preventDefault={handleSubmit}
      class="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 sm:p-6 space-y-5"
    >
      <!-- Info de cuenta -->
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
            Información de la cuenta
          </p>
          <p class="text-xs text-slate-500">
            Estos datos se usan para identificar tu usuario y contactarte.
          </p>
        </div>

        <div class="space-y-1">
          <label for="username" class="text-xs font-medium text-slate-700">Usuario</label>
          <input
            id="username"
            type="text"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            value={profile.username}
            disabled
          />
          <p class="text-[11px] text-slate-400">
            El nombre de usuario no se puede cambiar.
          </p>
        </div>

        <div class="space-y-1">
          <label for="email" class="text-xs font-medium text-slate-700">Correo electrónico</label>
          <input
            id="email"
            type="email"
            bind:value={email}
            required
            class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/80"
          />
          <p class="text-[11px] text-slate-400">
            A este correo llegarán confirmaciones y comunicaciones.
          </p>
        </div>

        <div class="space-y-1">
          <label for="first_name" class="text-xs font-medium text-slate-700">Nombre</label>
          <input
            id="first_name"
            type="text"
            bind:value={firstName}
            class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/80"
          />
        </div>

        <div class="space-y-1">
          <label for="last_name" class="text-xs font-medium text-slate-700">Apellidos</label>
          <input
            id="last_name"
            type="text"
            bind:value={lastName}
            class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/80"
          />
        </div>
      </div>

      <!-- Acciones -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 mt-2">
        <p class="text-xs text-slate-500 max-w-sm">
          Si necesitas cambiar datos más avanzados de tu cuenta, puedes contactar directamente a
          Cocinas Appel.
        </p>

        <button
          type="submit"
          class="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700 disabled:opacity-60"
          disabled={saving}
        >
          {#if saving}
            Guardando…
          {:else}
            Guardar cambios
          {/if}
        </button>
      </div>
    </form>
  {/if}

  <!-- Link hacia pedidos del cliente -->
  <div class="pt-2">
    <a
      href="/mi-cuenta/pedidos"
      class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
    >
      <svg
        viewBox="0 0 24 24"
        class="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
      >
        <path d="M5 12h14M5 12l4-4M5 12l4 4" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      Volver a mis pedidos
    </a>
  </div>
</section>
