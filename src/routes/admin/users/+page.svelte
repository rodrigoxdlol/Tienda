<script lang="ts">
  import {
    adminListUsers,
    adminCreateUser,
    adminUpdateUser,
    adminDeleteUser,
    type AdminUser,
    type Paginated
  } from '$lib/api.admin';
  import { onMount } from 'svelte';

  // -------- Estado base --------
  let loading = true;
  let error = '';
  let users: AdminUser[] = [];
  let count = 0;
  let next: string | null = null;
  let previous: string | null = null;

  // Filtros / paginación
  let search = '';
  let page = 1;
  const PAGE_SIZE = 12;

  // Filtros rápidos
  let onlyActive = false;
  let onlyStaff = false;

  // Modal
  let openModal = false;
  let editing: AdminUser | null = null;

  // Form
  let f_username = '';
  let f_email = '';
  let f_is_active = true;
  let f_is_staff = false;
  let f_is_superuser = false;
  let f_password = '';
  let saving = false;

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

  onMount(load);

  async function load() {
    loading = true; error = '';
    try {
      const res = await adminListUsers({
        search: search.trim() || undefined,
        page,
        page_size: PAGE_SIZE,
        only_active: onlyActive || undefined,
        only_staff: onlyStaff || undefined
      });

      // Soportar paginado o arreglo
      if (Array.isArray(res)) {
        users = res;
        count = res.length;
        next = previous = null;
      } else {
        const p = res as Paginated<AdminUser>;
        users = p.results;
        count = p.count;
        next = p.next;
        previous = p.previous;
      }
    } catch (e: any) {
      error = String(e?.message ?? e);
    } finally {
      loading = false;
    }
  }

  function openCreate() {
    editing = null;
    f_username = '';
    f_email = '';
    f_is_active = true;
    f_is_staff = false;
    f_is_superuser = false;
    f_password = '';
    openModal = true;
  }

  function openEdit(u: AdminUser) {
    editing = u;
    f_username = u.username;
    f_email = u.email;
    f_is_active = !!u.is_active;
    f_is_staff = !!u.is_staff;
    f_is_superuser = !!u.is_superuser;
    f_password = '';
    openModal = true;
  }

  function closeModal() {
    if (saving) return;
    openModal = false;
  }

  async function save() {
    saving = true;
    try {
      if (!f_username.trim()) throw new Error('El nombre de usuario es obligatorio');
      if (!f_email.trim()) throw new Error('El email es obligatorio');

      if (editing) {
        const patch: Partial<AdminUser> & { password?: string } = {
          username: f_username.trim(),
          email: f_email.trim(),
          is_active: f_is_active,
          is_staff: f_is_staff,
          is_superuser: f_is_superuser,
        };
        if (f_password.trim()) patch.password = f_password.trim();

        await adminUpdateUser(editing.id, patch);
        toast('Usuario actualizado.');
      } else {
        await adminCreateUser({
          username: f_username.trim(),
          email: f_email.trim(),
          is_active: f_is_active,
          is_staff: f_is_staff,
          is_superuser: f_is_superuser,
          password: f_password.trim() || undefined,
        });
        toast('Usuario creado.');
      }

      openModal = false;
      await load();
    } catch (e: any) {
      toast(String(e?.message ?? e), 'err');
    } finally {
      saving = false;
    }
  }

  async function del(u: AdminUser) {
    if (!confirm(`¿Eliminar usuario "${u.username}"? Esta acción no se puede deshacer.`)) return;
    try {
      await adminDeleteUser(u.id);
      toast('Usuario eliminado.');
      // Si borramos y la pagina queda vacía, retroceder una página si es posible
      if (users.length === 1 && page > 1) {
        page = page - 1;
      }
      await load();
    } catch (e: any) {
      // Aquí también llegará el mensaje "No puedes eliminar el último superusuario..."
      toast(String(e?.message ?? e), 'err');
    }
  }

  function goPrev() {
    if (page > 1) {
      page -= 1;
      load();
    }
  }

  function goNext() {
    // Si hay `next` (en paginado real) o si tenemos potencialmente más
    if (next || (users.length === PAGE_SIZE && count > page * PAGE_SIZE)) {
      page += 1;
      load();
    }
  }

  function onSearchEnter(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      page = 1;
      load();
    }
  }

  // Formatear fechas (date_joined, last_login)
  function fmtDate(d: string | null | undefined): string {
    if (!d) return '—';
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return String(d);
    return date.toLocaleString('es-CL', {
      dateStyle: 'short',
      timeStyle: 'short'
    });
  }
</script>

<div class="min-h-screen bg-slate-50/80">
  <div class="mx-auto max-w-7xl px-4 py-6 lg:py-8">
    <!-- Encabezado -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div class="space-y-2">
        <div class="inline-flex items-center gap-2 rounded-full bg-slate-900 text-slate-50 px-3 py-1 text-xs font-medium shadow-sm">
          <span class="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
          Panel admin · Usuarios
        </div>
        <div>
          <h1 class="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
            Gestión de usuarios
          </h1>
          <p class="text-slate-600 mt-1 text-sm sm:text-base">
            Administra accesos, roles y estado de las cuentas de la plataforma.
          </p>
        </div>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center w-full sm:w-auto">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center w-full">
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <div class="relative flex-1 sm:w-64">
              <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <svg class="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none">
                  <path d="M15.5 15.5L20 20" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                  <circle cx="11" cy="11" r="5.5" stroke="currentColor" stroke-width="1.6" />
                </svg>
              </span>
              <input
                class="w-full rounded-xl border border-slate-300 bg-white/80 px-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70 focus:border-amber-400 shadow-sm"
                placeholder="Buscar por usuario o email…"
                bind:value={search}
                on:keydown={onSearchEnter}
              />
            </div>
            <button
              class="rounded-xl px-3 py-2 text-sm ring-1 ring-slate-300 hover:bg-slate-100 bg-white/80 shadow-sm whitespace-nowrap"
              on:click={() => { page = 1; load(); }}
            >
              Buscar
            </button>
          </div>

          <!-- Filtros rápidos -->
          <div class="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-700">
            <label class="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
              <input
                type="checkbox"
                class="rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                bind:checked={onlyActive}
                on:change={() => { page = 1; load(); }}
              />
              <span>Solo activos</span>
            </label>
            <label class="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
              <input
                type="checkbox"
                class="rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                bind:checked={onlyStaff}
                on:change={() => { page = 1; load(); }}
              />
              <span>Solo staff</span>
            </label>
          </div>
        </div>

        <button
          class="w-full sm:w-auto rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-medium shadow-md hover:bg-black transition-colors"
          on:click={openCreate}
        >
          + Nuevo usuario
        </button>
      </div>
    </div>

    <!-- Contenido -->
    <div class="mt-6 rounded-2xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur-sm">
      {#if loading}
        <div class="p-6 flex items-center gap-3 text-slate-600">
          <!-- svelte-ignore element_invalid_self_closing_tag -->
          <span class="inline-block h-4 w-4 animate-spin rounded-full border-[2px] border-slate-300 border-t-slate-500" />
          <span>Cargando usuarios…</span>
        </div>
      {:else if error}
        <div class="p-6">
          <div class="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        </div>
      {:else if users.length === 0}
        <div class="p-8 flex flex-col items-center justify-center text-center gap-2">
          <div class="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
            <svg class="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none">
              <path d="M12 7V13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
              <circle cx="12" cy="16" r="0.8" fill="currentColor" />
              <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.6" />
            </svg>
          </div>
          <p class="text-slate-900 font-medium">No hay usuarios con los criterios actuales.</p>
          <p class="text-slate-500 text-sm">Prueba cambiando filtros o creando un nuevo usuario.</p>
        </div>
      {:else}
        <!-- Vista mobile: tarjetas -->
        <div class="block md:hidden divide-y divide-slate-100">
          {#each users as u (u.id)}
            <div class="p-4 flex flex-col gap-3">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="font-semibold text-slate-900 text-sm">
                    {u.username}
                  </p>
                  <p class="text-xs text-slate-500 break-all">
                    {u.email}
                  </p>
                </div>
                <div class="flex flex-col items-end text-[11px] text-slate-700 gap-1">
                  <span class="px-2 py-0.5 rounded-full font-medium
                               {u.is_active ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'}">
                    {u.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                  {#if u.is_staff}
                    <span class="px-2 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
                      Staff
                    </span>
                  {/if}
                  {#if u.is_superuser}
                    <span class="px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                      Superuser
                    </span>
                  {/if}
                </div>
              </div>

              <div class="grid grid-cols-1 gap-1.5 text-[11px] text-slate-600 mt-1">
                <div>
                  <span class="font-medium text-slate-700">Creado:</span>
                  <span> {fmtDate(u.date_joined)}</span>
                </div>
                <div>
                  <span class="font-medium text-slate-700">Último login:</span>
                  <span> {fmtDate(u.last_login)}</span>
                </div>
              </div>

              <div class="mt-3 flex items-center gap-2">
                <button
                  class="flex-1 rounded-lg px-3 py-1.5 ring-1 ring-slate-300 text-xs font-medium hover:bg-slate-50 transition-colors"
                  on:click={() => openEdit(u)}
                >
                  Editar
                </button>
                <button
                  class="flex-1 rounded-lg px-3 py-1.5 bg-rose-600 text-white text-xs font-medium hover:bg-rose-700 transition-colors"
                  on:click={() => del(u)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          {/each}
        </div>

        <!-- Vista desktop: tabla -->
        <div class="hidden md:block overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-slate-50/80 border-b border-slate-200">
              <tr class="text-left text-slate-600">
                <th class="px-4 py-3 font-semibold text-xs uppercase tracking-wide">Usuario</th>
                <th class="px-4 py-3 font-semibold text-xs uppercase tracking-wide">Email</th>
                <th class="px-4 py-3 font-semibold text-xs uppercase tracking-wide">Activo</th>
                <th class="px-4 py-3 font-semibold text-xs uppercase tracking-wide">Staff</th>
                <th class="px-4 py-3 font-semibold text-xs uppercase tracking-wide">Superuser</th>
                <th class="px-4 py-3 font-semibold text-xs uppercase tracking-wide">Creado</th>
                <th class="px-4 py-3 font-semibold text-xs uppercase tracking-wide">Último login</th>
                <th class="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              {#each users as u (u.id)}
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="px-4 py-3 font-medium text-slate-900">{u.username}</td>
                  <td class="px-4 py-3 text-slate-700">{u.email}</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
                                 {u.is_active ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'}">
                      {u.is_active ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    {#if u.is_staff}
                      <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
                        Sí
                      </span>
                    {:else}
                      <span class="text-xs text-slate-500">No</span>
                    {/if}
                  </td>
                  <td class="px-4 py-3">
                    {#if u.is_superuser}
                      <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                        Sí
                      </span>
                    {:else}
                      <span class="text-xs text-slate-500">No</span>
                    {/if}
                  </td>
                  <td class="px-4 py-3 text-slate-700">{fmtDate(u.date_joined)}</td>
                  <td class="px-4 py-3 text-slate-700">{fmtDate(u.last_login)}</td>
                  <td class="px-4 py-3">
                    <div class="flex items-center justify-end gap-2">
                      <button
                        class="rounded-lg px-3 py-1.5 text-xs font-medium ring-1 ring-slate-300 hover:bg-slate-50 transition-colors"
                        on:click={() => openEdit(u)}
                      >
                        Editar
                      </button>
                      <button
                        class="rounded-lg px-3 py-1.5 text-xs font-medium bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                        on:click={() => del(u)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <!-- Footer de la tabla / lista -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-4 border-t border-slate-200 text-sm bg-slate-50/60">
          <div class="text-slate-600">
            {#if count}
              Mostrando página <span class="font-medium">{page}</span> · Total <span class="font-medium">{count}</span>
            {:else}
              {users.length} usuario(s)
            {/if}
          </div>
          <div class="flex items-center gap-2">
            <button
              class="rounded-lg px-3 py-1.5 ring-1 ring-slate-300 bg-white/80 hover:bg-slate-50 disabled:opacity-50 text-sm"
              on:click={goPrev}
              disabled={page <= 1 || (!previous && !count)}
            >
              ← Anterior
            </button>
            <button
              class="rounded-lg px-3 py-1.5 ring-1 ring-slate-300 bg-white/80 hover:bg-slate-50 disabled:opacity-50 text-sm"
              on:click={goNext}
              disabled={!(next || (users.length === PAGE_SIZE && count > page * PAGE_SIZE))}
            >
              Siguiente →
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Modal Crear/Editar -->
{#if openModal}
  <div class="fixed inset-0 z-50 grid place-items-center p-4">
    <div
      class="absolute inset-0 bg-black/40 backdrop-blur-sm"
      role="button"
      tabindex="0"
      aria-label="Cerrar modal"
      on:click={closeModal}
      on:keydown={(e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          closeModal();
        }
      }}
    ></div>
 
    <div class="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 p-5 sm:p-6">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold text-slate-900">
            {editing ? 'Editar usuario' : 'Nuevo usuario'}
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">
            {editing ? 'Actualiza la información y roles del usuario.' : 'Crea una nueva cuenta para la plataforma.'}
          </p>
        </div>
        <button class="rounded-full p-1.5 hover:bg-slate-100" on:click={closeModal} aria-label="Cerrar">
          <svg class="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none">
            <path stroke="currentColor" stroke-linecap="round" stroke-width="1.5" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <label class="block">
          <span class="block text-xs text-slate-600 mb-1">Usuario</span>
          <input
            class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70 focus:border-amber-400"
            bind:value={f_username}
            placeholder="username"
          />
        </label>

        <label class="block">
          <span class="block text-xs text-slate-600 mb-1">Email</span>
          <input
            type="email"
            class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70 focus:border-amber-400"
            bind:value={f_email}
            placeholder="correo@dominio.com"
          />
        </label>

        <label class="block md:col-span-2">
          <span class="block text-xs text-slate-600 mb-1">
            Password {editing ? '(dejar vacío para no cambiar)' : ''}
          </span>
          <input
            type="password"
            class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70 focus:border-amber-400"
            bind:value={f_password}
            placeholder={editing ? '••••••' : 'Mínimo 8 caracteres'}
          />
        </label>

        <div class="flex flex-wrap items-center gap-4 md:col-span-2">
          <label class="inline-flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" class="rounded border-slate-300 text-slate-900 focus:ring-slate-500" bind:checked={f_is_active} />
            <span>Activo</span>
          </label>
          <label class="inline-flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" class="rounded border-slate-300 text-slate-900 focus:ring-slate-500" bind:checked={f_is_staff} />
            <span>Staff (acceso a admin SPA)</span>
          </label>
          <label class="inline-flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" class="rounded border-slate-300 text-slate-900 focus:ring-slate-500" bind:checked={f_is_superuser} />
            <span>Superuser</span>
          </label>
        </div>
      </div>

      <div class="mt-5 flex items-center justify-end gap-2">
        <button
          class="rounded-lg px-3 py-2 ring-1 ring-slate-300 hover:bg-slate-50 text-sm"
          on:click={closeModal}
          disabled={saving}
        >
          Cancelar
        </button>
        <button
          class="rounded-lg px-4 py-2 bg-slate-900 text-white hover:bg-black disabled:opacity-60 text-sm font-medium shadow-sm"
          on:click={save}
          disabled={saving}
        >
          {saving ? 'Guardando…' : (editing ? 'Guardar cambios' : 'Crear usuario')}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Toast -->
{#if toastMsg}
  <div class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
    <div class="rounded-xl px-4 py-2 text-sm shadow-lg
                {toastType === 'ok' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}">
      {toastMsg}
    </div>
  </div>
{/if}





