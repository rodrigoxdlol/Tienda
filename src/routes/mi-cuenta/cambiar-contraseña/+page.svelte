<script lang="ts">
  import { user, doLogout } from '$lib/auth.store';
  import { toastError, toastSuccess } from '$lib/ui/toast';

  const API = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

  // Leer csrftoken de la cookie
  function csrftoken(): string {
    if (typeof document === 'undefined') return '';
    return (
      document.cookie
        .split('; ')
        .find((x) => x.startsWith('csrftoken='))?.split('=')[1] ?? ''
    );
  }

  let oldPassword = '';
  let newPassword1 = '';
  let newPassword2 = '';

  let loading = false;
  let errors: string[] = [];

  async function handleSubmit(e: Event) {
    e.preventDefault();
    errors = [];

    if (!oldPassword || !newPassword1 || !newPassword2) {
      errors = ['Completa todos los campos.'];
      return;
    }

    if (newPassword1 !== newPassword2) {
      errors = ['Las contraseñas nuevas no coinciden.'];
      return;
    }

    loading = true;

    try {
      const res = await fetch(`${API}/api/auth/change-password/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken()
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password1: newPassword1,
          new_password2: newPassword2
        })
      });

      if (!res.ok) {
        // Intentamos leer detalle de error
        try {
          const data = await res.json();

          if (Array.isArray(data.detail)) {
            errors = data.detail.map((d: any) => String(d));
          } else if (data.detail) {
            errors = [String(data.detail)];
          } else {
            errors = ['No se pudo cambiar la contraseña.'];
          }
        } catch {
          const text = await res.text();
          errors = [text || 'No se pudo cambiar la contraseña.'];
        }
        return;
      }

      // Éxito
      toastSuccess('Contraseña actualizada correctamente. Vuelve a iniciar sesión.');
      oldPassword = '';
      newPassword1 = '';
      newPassword2 = '';
      errors = [];

      // 🔹 cerrar sesión y mandar a login
      await doLogout();
      window.location.href = '/login';
    } catch (err: any) {
      errors = [String(err?.message ?? err) || 'Error al conectar con el servidor.'];
      toastError(errors[0]);
    } finally {
      loading = false;
    }
  }
</script>

{#if !$user?.authenticated}
  <section class="max-w-lg mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mt-4">
    <h1 class="text-xl font-semibold text-slate-900 mb-2">
      Inicia sesión para cambiar tu contraseña
    </h1>
    <p class="text-sm text-slate-600 mb-4">
      Esta sección está disponible solo para clientes registrados.
    </p>
    <a
      href="/login"
      class="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium bg-amber-600 text-white hover:bg-amber-700"
    >
      Ir a iniciar sesión
    </a>
  </section>
{:else}
  <section class="max-w-xl mx-auto mt-4">
    <header class="mb-6">
      <h1 class="text-2xl font-semibold text-slate-900 tracking-tight">
        Cambiar contraseña
      </h1>
      <p class="mt-1 text-sm text-slate-600">
        Actualiza la contraseña de tu cuenta para mantener tu información segura.
      </p>
    </header>

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
        <label for="old" class="block text-sm font-medium text-slate-700">
          Contraseña actual
        </label>
        <input
          id="old"
          type="password"
          bind:value={oldPassword}
          autocomplete="current-password"
          class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          required
        />
      </div>

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
          <li>Combina letras mayúsculas, minúsculas, números y símbolos.</li>
          <li>No reutilices contraseñas de otros sitios.</li>
        </ul>
      </div>

      <div class="pt-2 flex justify-end gap-2">
        <a
          href="/mi-cuenta/perfil"
          class="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium ring-1 ring-slate-300 text-slate-700 hover:bg-slate-50"
        >
          Volver a mi perfil
        </a>
        <button
          type="submit"
          class="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Guardando…' : 'Guardar contraseña'}
        </button>
      </div>
    </form>
  </section>
{/if}

