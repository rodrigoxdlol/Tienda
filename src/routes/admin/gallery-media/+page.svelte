<script lang="ts">
  import { onMount } from 'svelte';
  import {
    adminListGalleryImages,
    adminCreateGalleryImage,
    adminPatchGalleryImage,
    adminDeleteGalleryImage,
    adminReorderGalleryImages
  } from '$lib/api.admin';
  import { toastSuccess, toastError } from '$lib/ui/toast';

  // ---------- Estado ----------
  let items: any[] = [];
  let loading = true;

  // formulario creación
  let file: File | null = null;
  let preview: string | null = null;
  let title = '';
  let caption = '';
  let order = 0;
  let creating = false;

  // busy por acción
  let busyToggle = new Set<number>();
  let busyPatch = new Set<number>();
  let busyDelete = new Set<number>();
  let busyOrder = false;

  const MAX_MB = 10;

  onMount(load);

  async function load() {
    loading = true;
    try {
      const data = await adminListGalleryImages();
      items = (data || []).map((it: any) => ({
        ...it,
        title: it.title ?? '',
        caption: it.caption ?? '',
        order: Number.isFinite(it.order) ? it.order : 0
      }));
    } catch (e: any) {
      toastError(String(e?.message ?? e));
    } finally {
      loading = false;
    }
  }

  // ---------- Crear ----------
  function pickFile(f: File) {
    if (!/^image\//.test(f.type)) {
      toastError('El archivo debe ser una imagen');
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      toastError(`Máximo ${MAX_MB} MB`);
      return;
    }
    file = f;
    if (preview) URL.revokeObjectURL(preview);
    preview = URL.createObjectURL(f);
  }

  function onPick(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;
    pickFile(f);
    input.value = '';
  }

  function clearPick() {
    file = null;
    if (preview) URL.revokeObjectURL(preview);
    preview = null;
  }

  async function upload() {
    if (!file) {
      toastError('Selecciona una imagen');
      return;
    }
    creating = true;
    try {
      await adminCreateGalleryImage({ file, title, caption, order });
      toastSuccess('Imagen subida');
      clearPick();
      title = '';
      caption = '';
      order = 0;
      await load();
    } catch (e: any) {
      toastError(String(e?.message ?? e));
    } finally {
      creating = false;
    }
  }

  // ---------- Toggle activo ----------
  async function toggleActive(it: any) {
    const id = it.id;
    const prev = it.is_active;
    updateLocal(id, { is_active: !prev });
    busyToggle = new Set(busyToggle).add(id);
    try {
      await adminPatchGalleryImage(id, { is_active: !prev });
    } catch (e: any) {
      updateLocal(id, { is_active: prev });
      toastError(String(e?.message ?? e));
    } finally {
      busyToggle.delete(id);
      busyToggle = new Set(busyToggle);
    }
  }

  // ---------- Patch con debounce ----------
  function debounce<T extends (...a: any[]) => any>(fn: T, ms = 600) {
    let t: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<T>) => {
      if (t) clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  const saveFieldDebounced = debounce(async (id: number, patch: any) => {
    busyPatch = new Set(busyPatch).add(id);
    try {
      await adminPatchGalleryImage(id, patch);
    } catch (e: any) {
      toastError(String(e?.message ?? e));
      await load();
    } finally {
      busyPatch.delete(id);
      busyPatch = new Set(busyPatch);
    }
  }, 500);

  function onEdit(id: number, field: 'title' | 'caption', value: string) {
    updateLocal(id, { [field]: value });
    saveFieldDebounced(id, { [field]: value });
  }

  // ---------- Eliminar ----------
  async function remove(it: any) {
    const id = it.id;
    if (!confirm('¿Eliminar esta imagen de la galería?')) return;
    busyDelete = new Set(busyDelete).add(id);
    try {
      await adminDeleteGalleryImage(id);
      items = items.filter((x) => x.id !== id);
      toastSuccess('Imagen eliminada');
    } catch (e: any) {
      toastError(String(e?.message ?? e));
    } finally {
      busyDelete.delete(id);
      busyDelete = new Set(busyDelete);
    }
  }

  // ---------- Guardar orden ----------
  async function saveOrders() {
    if (!items.length) return;
    busyOrder = true;
    try {
      const payload = items.map((x: any, i: number) => ({
        id: x.id,
        order: Number.isFinite(x.order) ? Number(x.order) : i
      }));
      await adminReorderGalleryImages(payload);
      toastSuccess('Orden guardado');
      await load();
    } catch (e: any) {
      toastError(String(e?.message ?? e));
    } finally {
      busyOrder = false;
    }
  }

  function updateLocal(id: number, patch: any) {
    items = items.map((x) => (x.id === id ? { ...x, ...patch } : x));
  }

  // derivados para header
  $: totalImages = items.length;
  $: activeImages = items.filter((x) => x.is_active).length;
</script>

<section class="mx-auto max-w-7xl px-4 py-6 space-y-6">
  <!-- Header -->
  <header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div class="space-y-1">
      <h1 class="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
        Imágenes de galería
      </h1>
      <p class="text-slate-600 text-sm sm:text-base">
        Gestiona las imágenes de la sección de galería: títulos, descripciones, orden y estado.
      </p>
    </div>

    <div class="flex flex-col items-start sm:items-end gap-1 text-xs text-slate-500">
      <span class="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
        <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
        <span>{activeImages} activas de {totalImages} imágenes</span>
      </span>
      <button
        type="button"
        on:click={load}
        class="mt-1 inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-3 py-1.5 text-xs font-medium shadow hover:bg-black disabled:opacity-60"
        disabled={loading}
      >
        {#if loading}
          <svg class="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity=".25" stroke-width="3" />
            <path d="M21 12a9 9 0 0 1-9 9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
          </svg>
          Cargando…
        {:else}
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12a7 7 0 0 1 11.95-4.95L19 4m-1 5v-4"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M19 12a7 7 0 0 1-11.95 4.95L5 20m1-5v4"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Actualizar
        {/if}
      </button>
    </div>
  </header>

  <!-- Formulario -->
  <div class="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
    <h2 class="text-sm font-semibold text-slate-900 mb-1">
      Nueva imagen para la galería
    </h2>
    <p class="text-[11px] text-slate-500 mb-4">
      Sube una imagen y define el texto que se mostrará junto a ella.
    </p>

    <div class="grid sm:grid-cols-5 gap-3 items-start">
      <!-- Imagen -->
      <div class="sm:col-span-2">
        <span class="block text-xs text-slate-600 mb-1">Imagen</span>

        <label class="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-700 cursor-pointer hover:bg-slate-100">
          <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white">
            <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5v14m0-14L8 9m4-4 4 4"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
          <span>Seleccionar archivo</span>
          <input
            type="file"
            accept="image/*"
            class="sr-only"
            on:change={onPick}
          />
        </label>

        <p class="mt-1 text-[11px] text-slate-400">
          Formatos recomendados: JPG o PNG. Peso máximo ~{MAX_MB} MB.
        </p>

        {#if preview}
          <div class="mt-3 flex items-center gap-3">
            <img
              src={preview}
              alt="preview"
              class="h-14 w-14 rounded-lg object-cover ring-1 ring-slate-200"
            />
            <button
              type="button"
              class="text-[11px] text-rose-600 hover:underline"
              on:click={clearPick}
            >
              Quitar imagen
            </button>
          </div>
        {/if}
      </div>

      <!-- Título -->
      <label>
        <span class="block text-xs text-slate-600 mb-1">Título</span>
        <input
          class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
          placeholder="Ej: Foto del taller"
          bind:value={title}
        />
      </label>

      <!-- Descripción -->
      <label>
        <span class="block text-xs text-slate-600 mb-1">Descripción</span>
        <input
          class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
          placeholder="Texto breve bajo el título"
          bind:value={caption}
        />
      </label>

      <!-- Orden -->
      <label>
        <span class="block text-xs text-slate-600 mb-1">Orden</span>
        <input
          class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
          type="number"
          min="0"
          bind:value={order}
        />
        <p class="mt-1 text-[11px] text-slate-400">
          Menor número → aparece primero.
        </p>
      </label>
    </div>

    <div class="mt-4 flex justify-end">
      <button
        type="button"
        on:click={upload}
        disabled={creating}
        class="inline-flex items-center gap-2 rounded-xl bg-amber-600 text-white px-4 py-2 text-sm font-medium shadow hover:bg-amber-700 disabled:opacity-60"
      >
        {#if creating}
          <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v3a5 5 0 0 0-5 5H4z" />
          </svg>
          Subiendo…
        {:else}
          Guardar imagen
        {/if}
      </button>
    </div>
  </div>

  <!-- Grid de imágenes -->
  <div class="space-y-4">
    {#if loading}
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {#each Array(3) as _}
          <div class="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
            <div class="h-40 rounded-xl bg-slate-100 animate-pulse"></div>
            <div class="h-3 rounded bg-slate-100 animate-pulse"></div>
            <div class="h-3 rounded bg-slate-100 animate-pulse w-2/3"></div>
          </div>
        {/each}
      </div>
    {:else if !items.length}
      <div
        class="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-10 text-center text-sm text-slate-500"
      >
        Aún no has agregado imágenes a la galería. Sube una imagen con el formulario superior para comenzar.
      </div>
    {:else}
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {#each items as it (it.id)}
          <div class="group rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition">
            <div class="relative h-44 bg-slate-100">
              <img
                src={it.image}
                alt={it.title}
                class="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <div class="absolute top-2 left-2 flex flex-col gap-1">
                <span
                  class="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200"
                >
                  <span class="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                  <span>Orden {it.order}</span>
                </span>
                {#if !it.is_active}
                  <span
                    class="inline-flex items-center gap-1 rounded-full bg-slate-900/85 px-2 py-0.5 text-[11px] text-white"
                  >
                    Inactiva
                  </span>
                {/if}
              </div>
            </div>

            <div class="p-4 space-y-3">
              <label class="block">
                <span class="block text-xs text-slate-600 mb-1">Título</span>
                <input
                  class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
                  bind:value={it.title}
                  on:input={(e: any) => onEdit(it.id, 'title', e.target.value)}
                  placeholder="Título"
                />
              </label>

              <label class="block">
                <span class="block text-xs text-slate-600 mb-1">Descripción</span>
                <input
                  class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
                  bind:value={it.caption}
                  on:input={(e: any) => onEdit(it.id, 'caption', e.target.value)}
                  placeholder="Descripción"
                />
              </label>

              <div class="flex items-center justify-between gap-3">
                <!-- Switch activo -->
                <label class="inline-flex items-center gap-2 select-none text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={it.is_active}
                    on:change={() => toggleActive(it)}
                    class="peer sr-only"
                    disabled={busyToggle.has(it.id)}
                  />
                  <span
                    class="relative inline-flex h-5 w-9 items-center rounded-full ring-1 ring-slate-300
                           bg-slate-300 peer-checked:bg-emerald-600 peer-checked:ring-emerald-500/40
                           transition-colors duration-300 disabled:opacity-60"
                  >
                    <span
                      class="absolute left-1 h-3.5 w-3.5 rounded-full bg-white shadow-sm transform-gpu
                             transition-transform duration-300 peer-checked:translate-x-4"
                    ></span>
                  </span>
                  {#if busyToggle.has(it.id)}
                    <svg class="h-3.5 w-3.5 animate-spin text-slate-500" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity=".25" stroke-width="3" />
                      <path d="M21 12a9 9 0 0 1-9 9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
                    </svg>
                  {:else}
                    {it.is_active ? 'activo' : 'inactivo'}
                  {/if}
                </label>

                <div class="flex items-center gap-2">
                  <input
                    class="w-20 rounded-xl border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
                    type="number"
                    bind:value={it.order}
                    title="Orden"
                  />
                  <button
                    type="button"
                    class="rounded-lg bg-rose-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-rose-700 disabled:opacity-60"
                    on:click={() => remove(it)}
                    disabled={busyDelete.has(it.id)}
                  >
                    {busyDelete.has(it.id) ? 'Borrando…' : 'Eliminar'}
                  </button>
                </div>
              </div>

              {#if busyPatch.has(it.id)}
                <p class="text-[11px] text-slate-500">Guardando cambios…</p>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Guardar orden -->
  {#if items.length}
    <div class="mt-6 flex justify-end">
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-medium shadow hover:bg-slate-800 disabled:opacity-60"
        on:click={saveOrders}
        disabled={busyOrder}
      >
        {#if busyOrder}
          <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v3a5 5 0 0 0-5 5H4z" />
          </svg>
          Guardando…
        {:else}
          Guardar orden
        {/if}
      </button>
    </div>
  {/if}
</section>



