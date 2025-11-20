<script lang="ts">
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

  let email = '';
  let loading = false;
  let errors: string[] = [];
  let sent = false;

  async function handleSubmit(e: Event) {
    e.preventDefault();
    errors = [];

    if (!email.trim()) {
      errors = ['Ingresa tu correo electrónico.'];
      return;
    }

    loading = true;

    try {
      const res = await fetch(`${API}/api/auth/password-reset/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken()
        },
        body: JSON.stringify({ email: email.trim() })
      });

      if (!res.ok) {
        try {
          const data = await res.json();
          if (Array.isArray(data.detail)) {
            errors = data.detail.map((d: any) => String(d));
          } else if (data.detail) {
            errors = [String(data.detail)];
          } else {
            errors = ['No se pudo enviar el correo de recuperación.'];
          }
        } catch {
          const text = await res.text();
          errors = [text || 'No se pudo enviar el correo de recuperación.'];
        }
        toastError(errors[0] || 'Error al enviar el correo.');
        return;
      }

      sent = true;
      toastSuccess(
        'Si el correo está registrado, se ha enviado un enlace para restablecer la contraseña.'
      );
    } catch (err: any) {
      const msg = String(err?.message ?? err) || 'Error al conectar con el servidor.';
      errors = [msg];
      toastError(msg);
    } finally {
      loading = false;
    }
  }
</script>

<section class="max-w-lg mx-auto mt-6">
  <header class="mb-6 text-center">
    <h1 class="text-2xl font-semibold text-slate-900 tracking-tight">
      Recuperar contraseña
    </h1>
    <p class="mt-1 text-sm text-slate-600">
      Ingresa el correo con el que creaste tu cuenta y te enviaremos un enlace para
      restablecer tu contraseña.
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
      <label for="email" class="block text-sm font-medium text-slate-700">
        Correo electrónico
      </label>
      <input
        id="email"
        type="email"
        bind:value={email}
        autocomplete="email"
        required
        class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        placeholder="tucorreo@ejemplo.com"
      />
    </div>

    {#if sent}
      <p class="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
        Si el correo está registrado, se ha enviado un enlace de recuperación. Revisa tu
        bandeja de entrada (y spam).
      </p>
    {/if}

    <div class="pt-2 flex justify-between items-center">
      <a
        href="/login"
        class="text-xs text-slate-500 hover:text-slate-700 underline-offset-2 hover:underline"
      >
        Volver a iniciar sesión
      </a>

      <button
        type="submit"
        class="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60"
        disabled={loading}
      >
        {loading ? 'Enviando…' : 'Enviar enlace'}
      </button>
    </div>
  </form>
</section>
