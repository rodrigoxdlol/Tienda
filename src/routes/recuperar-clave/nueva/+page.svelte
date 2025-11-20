<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { toastError, toastSuccess } from '$lib/ui/toast';

  const API = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

  function csrftoken(): string {
    if (typeof document === 'undefined') return '';
    return (
      document.cookie
        .split('; ')
        .find((x) => x.startsWith('csrftoken='))?.split('=')[1] ?? ''
    );
  }

  let newPassword1 = '';
  let newPassword2 = '';
  let loading = false;
  let errors: string[] = [];

  // Leemos uid y token desde los query params
  $: uid = $page.url.searchParams.get('uid') ?? '';
  $: token = $page.url.searchParams.get('token') ?? '';

  const linkInvalido = () => !uid || !token;

  async function handleSubmit(e: Event) {
    e.preventDefault();
    errors = [];

    if (linkInvalido()) {
      errors = ['El enlace no es válido o está incompleto.'];
      return;
    }

    if (!newPassword1 || !newPassword2) {
      errors = ['Completa ambos campos de contraseña.'];
      return;
    }

    if (newPassword1 !== newPassword2) {
      errors = ['Las contraseñas no coinciden.'];
      return;
    }

    loading = true;

    try {
      const res = await fetch(`${API}/api/auth/password-reset/confirm/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken()
        },
        body: JSON.stringify({
          uid,
          token,
          new_password1: newPassword1,
          new_password2: newPassword2
        })
      });

      if (!res.ok) {
        try {
          const data = await res.json();
          if (Array.isArray(data.detail)) {
            errors = data.detail.map((d: any) => String(d));
          } else if (data.detail) {
            errors = [String(data.detail)];
          } else {
            errors = ['No se pudo establecer la nueva contraseña.'];
          }
        } catch {
          const text = await res.text();
          errors = [text || 'No se pudo establecer la nueva contraseña.'];
        }
        toastError(errors[0] || 'Error al restablecer la contraseña.');
        return;
      }

      toastSuccess('Contraseña restablecida. Ahora puedes iniciar sesión.');
      // Redirigimos al login después de un momento
      setTimeout(() => goto('/login'), 1200);
    } catch (err: any) {
      const msg = String(err?.message ?? err) || 'Error al conectar con el servidor.';
      errors = [msg];
      toastError(msg);
    } finally {
      loading = false;
    }
  }
</script>

<section class="max-w-xl mx-auto mt-6">
  <header class="mb-6 text-center">
    <h1 class="text-2xl font-semibold text-slate-900 tracking-tight">
      Definir nueva contraseña
    </h1>
    <p class="mt-1 text-sm text-slate-600">
      Elige una nueva contraseña para tu cuenta.
    </p>
  </header>

  {#if linkInvalido()}
    <div class="bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl px-4 py-3 text-sm">
      El enlace para restablecer la contraseña no es válido o le faltan datos.
      <br />
      Vuelve a solicitar uno desde la página de
      <a href="/recuperar-clave" class="underline hover:text-rose-800">
        recuperación de contraseña
      </a>.
    </div>
  {:else}
    <form
      class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4"
      on:submit|preventDefault={handleSubmit}
    >
      {#if errors.length}
        <div class="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700 space-y-1">
          {#each errors as err}
            <p>{err}</p>
          {/each}
        </div>
      {/if}

      <div class="space-y-1">
        <label for="new1" class="block text-sm font-medium text-slate-700">
          Nueva contraseña
        </label>
        <input
          id="new1"
          type="password"
          bind:value={newPassword1}
          autocomplete="new-password"
          class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          required
        />
      </div>

      <div class="space-y-1">
        <label for="new2" class="block text-sm font-medium text-slate-700">
          Repetir nueva contraseña
        </label>
        <input
          id="new2"
          type="password"
          bind:value={newPassword2}
          autocomplete="new-password"
          class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          required
        />
      </div>

      <div class="flex flex-col gap-2 text-xs text-slate-500">
        <p class="font-medium text-slate-600">Recomendaciones:</p>
        <ul class="list-disc list-inside space-y-0.5">
          <li>Usa al menos 8 caracteres.</li>
          <li>Combina letras, números y símbolos.</li>
          <li>No reutilices contraseñas de otros sitios.</li>
        </ul>
      </div>

      <div class="pt-2 flex justify-between items-center">
        <a
          href="/login"
          class="text-xs text-slate-500 hover:text-slate-700 underline-offset-2 hover:underline"
        >
          Volver al inicio de sesión
        </a>
        <button
          type="submit"
          class="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Guardando…' : 'Guardar nueva contraseña'}
        </button>
      </div>
    </form>
  {/if}
</section>
