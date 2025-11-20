<script lang="ts">
  import { onMount } from 'svelte';
  import {
    adminGetUser,
    adminUpdateUser,
    adminDeleteUser,
    adminListOrders,
    type AdminUser,
    type AdminOrder,
    type Paginated
  } from '$lib/api.admin';

  export let params: { id: string };

  // ------- Estado -------
  let loading = true;
  let error = '';

  let user: AdminUser | null = null;

  // Form edición rápida
  let f_username = '';
  let f_email = '';
  let f_is_active = true;
  let f_is_staff = false;
  let f_is_superuser = false;
  let saving = false;

  // Reset password
  let newPassword = '';
  let resetting = false;

  // Pedidos del usuario
  let loadingOrders = true;
  let orders: AdminOrder[] = [];
  let count = 0;
  let next: string | null = null;
  let previous: string | null = null;
  let page = 1;
  const PAGE_SIZE = 12;

  // Toast simple
  let toastMsg = '';
  let toastType: 'ok' | 'err' = 'ok';
  let toastTimer: any = null;
  function toast(msg: string, type: 'ok' | 'err' = 'ok') {
    toastMsg = msg;
    toastType = type;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastMsg = ''), 3000);
  }

  onMount(async () => {
    await loadUser();
    await loadOrders();
  });

  async function loadUser() {
    loading = true; error = '';
    try {
      const u = await adminGetUser(Number(params.id));
      user = u;
      // hidratar formulario
      f_username = u.username;
      f_email = u.email;
      f_is_active = !!u.is_active;
      f_is_staff = !!u.is_staff;
      f_is_superuser = !!u.is_superuser;
    } catch (e: any) {
      error = String(e?.message ?? e);
    } finally {
      loading = false;
    }
  }

  async function saveUser() {
    if (!user) return;
    saving = true;
    try {
      await adminUpdateUser(user.id, {
        username: f_username.trim(),
        email: f_email.trim(),
        is_active: f_is_active,
        is_staff: f_is_staff,
        is_superuser: f_is_superuser
      });
      toast('Usuario actualizado.');
      await loadUser();
    } catch (e: any) {
      toast(String(e?.message ?? e), 'err');
    } finally {
      saving = false;
    }
  }

  async function doResetPassword() {
    if (!user) return;
    const pw = newPassword.trim();
    if (!pw) { toast('Escribe una nueva contraseña', 'err'); return; }
    resetting = true;
    try {
      await adminUpdateUser(user.id, { password: pw });
      newPassword = '';
      toast('Contraseña actualizada.');
    } catch (e: any) {
      toast(String(e?.message ?? e), 'err');
    } finally {
      resetting = false;
    }
  }

  async function removeUser() {
    if (!user) return;
    if (!confirm(`¿Eliminar usuario "${user.username}"?`)) return;
    try {
      await adminDeleteUser(user.id);
      toast('Usuario eliminado.');
      // Redirige a la lista
      window.location.href = '/admin/users';
    } catch (e: any) {
      toast(String(e?.message ?? e), 'err');
    }
  }

  async function loadOrders() {
    loadingOrders = true;
    try {
      const res = await adminListOrders({ user_id: Number(params.id), page, page_size: PAGE_SIZE });
      if (Array.isArray(res)) {
        orders = res;
        count = res.length;
        next = previous = null;
      } else {
        const p = res as Paginated<AdminOrder>;
        orders = p.results;
        count = p.count ?? orders.length;
        next = p.next ?? null;
        previous = p.previous ?? null;
      }
    } catch (e: any) {
      toast(String(e?.message ?? e), 'err');
      orders = [];
      count = 0;
      next = previous = null;
    } finally {
      loadingOrders = false;
    }
  }

  function goPrev() {
    if (page > 1) { page -= 1; loadOrders(); }
  }
  function goNext() {
    if (next || (orders.length === PAGE_SIZE && count > page * PAGE_SIZE)) {
      page += 1; loadOrders();
    }
  }

  const money = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
  function fmt(n: unknown) {
    const num = typeof n === 'number' ? n : parseFloat(String(n ?? 0));
    return isNaN(num) ? '—' : money.format(num);
  }
</script>

<div class="mx-auto max-w-7xl px-4 py-6 space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl md:text-3xl font-semibold text-slate-900">Usuario</h1>
      <p class="text-slate-600 mt-1">Detalle y pedidos del cliente.</p>
    </div>
    <div class="flex items-center gap-2">
      <a href="/admin/users" class="rounded-xl px-3 py-2 ring-1 ring-slate-300 hover:bg-slate-50 text-sm">← Volver</a>
      <button class="rounded-xl bg-rose-600 text-white px-3 py-2 text-sm hover:bg-rose-700" on:click={removeUser}>
        Eliminar
      </button>
    </div>
  </div>

  <!-- Tarjeta de edición -->
  <div class="rounded-2xl border border-slate-200 bg-white p-5">
    {#if loading}
      <p class="text-slate-600">Cargando…</p>
    {:else if error}
      <p class="text-rose-600">{error}</p>
    {:else if user}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label class="block">
          <span class="block text-xs text-slate-600 mb-1">Usuario</span>
          <input class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
                 bind:value={f_username} />
        </label>
        <label class="block">
          <span class="block text-xs text-slate-600 mb-1">Email</span>
          <input type="email" class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
                 bind:value={f_email} />
        </label>

        <div class="flex items-center gap-5 md:col-span-2">
          <label class="inline-flex items-center gap-2">
            <input type="checkbox" bind:checked={f_is_active} />
            <span class="text-sm text-slate-700">Activo</span>
          </label>
          <label class="inline-flex items-center gap-2">
            <input type="checkbox" bind:checked={f_is_staff} />
            <span class="text-sm text-slate-700">Staff</span>
          </label>
          <label class="inline-flex items-center gap-2">
            <input type="checkbox" bind:checked={f_is_superuser} />
            <span class="text-sm text-slate-700">Superuser</span>
          </label>
        </div>

        <div class="md:col-span-2 flex items-center justify-end gap-2">
          <button class="rounded-lg px-3 py-2 ring-1 ring-slate-300 hover:bg-slate-50" on:click={loadUser} disabled={saving}>
            Deshacer cambios
          </button>
          <button class="rounded-lg px-4 py-2 bg-slate-900 text-white hover:bg-black disabled:opacity-60" on:click={saveUser} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      <!-- Reset password -->
      <div class="mt-6 rounded-xl border border-slate-200 p-4">
        <h3 class="font-semibold text-slate-900">Cambiar contraseña</h3>
        <div class="mt-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <input type="password" class="w-full sm:w-80 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
                 placeholder="Nueva contraseña" bind:value={newPassword} />
          <button class="rounded-lg px-4 py-2 bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60"
                  on:click={doResetPassword} disabled={resetting}>
            {resetting ? 'Actualizando…' : 'Actualizar contraseña'}
          </button>
        </div>
      </div>
    {/if}
  </div>

  <!-- Pedidos -->
  <div class="rounded-2xl border border-slate-200 bg-white">
    <div class="flex items-center justify-between px-5 py-4 border-b border-slate-200">
      <h2 class="text-lg font-semibold text-slate-900">Pedidos de este usuario</h2>
      <div class="text-sm text-slate-600">
        {#if count}Total: {count}{/if}
      </div>
    </div>

    <div class="p-5">
      {#if loadingOrders}
        <p class="text-slate-600">Cargando pedidos…</p>
      {:else if orders.length === 0}
        <p class="text-slate-600">Sin pedidos registrados.</p>
      {:else}
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-slate-50">
              <tr class="text-left text-slate-600">
                <th class="px-3 py-2 font-semibold">#</th>
                <th class="px-3 py-2 font-semibold">Fecha</th>
                <th class="px-3 py-2 font-semibold">Estado</th>
                <th class="px-3 py-2 font-semibold">Total</th>
                <th class="px-3 py-2 font-semibold">Email</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              {#each orders as o (o.id)}
                <tr>
                  <td class="px-3 py-2 font-medium text-slate-900">{o.number ?? o.id}</td>
                  <td class="px-3 py-2">{new Date(o.created_at).toLocaleString()}</td>
                  <td class="px-3 py-2">{o.status}</td>
                  <td class="px-3 py-2">{fmt(o.total)}</td>
                  <td class="px-3 py-2">{o.email}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <div class="mt-4 flex items-center justify-end gap-2">
          <button class="rounded-lg px-3 py-1.5 ring-1 ring-slate-300 disabled:opacity-50" on:click={goPrev} disabled={page <= 1}>
            ← Anterior
          </button>
          <button class="rounded-lg px-3 py-1.5 ring-1 ring-slate-300 disabled:opacity-50" on:click={goNext}
                  disabled={!(next || (orders.length === PAGE_SIZE && count > page * PAGE_SIZE))}>
            Siguiente →
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>

{#if toastMsg}
  <div class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
    <div class="rounded-xl px-4 py-2 text-sm shadow
                {toastType === 'ok' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}">
      {toastMsg}
    </div>
  </div>
{/if}



