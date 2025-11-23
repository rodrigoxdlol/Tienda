<script lang="ts">
  import { onMount } from 'svelte';
  import {
    adminListNewsImages,
    adminCreateNewsImage,
    adminDeleteNewsImage,
    adminPatchNewsImage,
    type AdminNewsImage
  } from '$lib/api.admin';
  import { toastError, toastSuccess } from '$lib/ui/toast';

  let loading = true;
  let saving = false;
  let items: AdminNewsImage[] = [];

  let title = '';
  let caption = '';
  let order: string = ''; // string en el form
  let is_active = true;
  let file: File | null = null;
  let previewUrl = '';

  let deletingIds = new Set<number>();
  let togglingIds = new Set<number>(); // ids que se están activando/ocultando

  onMount(load);

  async function load() {
    loading = true;
    try {
      items = await adminListNewsImages();
    } catch (e: any) {
      toastError(String(e?.message ?? e));
      items = [];
    } finally {
      loading = false;
    }
  }

  function handleFileChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const f = input.files?.[0] ?? null;
    file = f;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = f ? URL.createObjectURL(f) : '';
  }

  async function onSubmit() {
    if (!file) {
      toastError('Selecciona una imagen para la noticia.');
      return;
    }
    if (saving) return;

    saving = true;
    try {
      const created = await adminCreateNewsImage({
        title: title.trim() || undefined,
        caption: caption.trim() || undefined,
        file,
        is_active,
        order: order === '' ? undefined : Number(order)
      });

      items = [created, ...items];
      toastSuccess('Noticia agregada');

      // reset form
      title = '';
      caption = '';
      order = '';
      is_active = true;
      file = null;
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        previewUrl = '';
      }
    } catch (e: any) {
      toastError(String(e?.message ?? e));
    } finally {
      saving = false;
    }
  }

  async function remove(item: AdminNewsImage) {
    if (!confirm(`¿Eliminar esta noticia (#${item.id})?`)) return;
    const next = new Set(deletingIds);
    next.add(item.id);
    deletingIds = next;
    try {
      await adminDeleteNewsImage(item.id);
      items = items.filter((x) => x.id !== item.id);
      toastSuccess('Noticia eliminada');
    } catch (e: any) {
      toastError(String(e?.message ?? e));
    } finally {
      const n2 = new Set(deletingIds);
      n2.delete(item.id);
      deletingIds = n2;
    }
  }

  async function toggleActive(item: AdminNewsImage) {
    const target = !item.is_active;
    const set = new Set(togglingIds);
    set.add(item.id);
    togglingIds = set;

    try {
      const updated = await adminPatchNewsImage(item.id, { is_active: target });
      items = items.map((x) => (x.id === item.id ? updated : x));
      toastSuccess(target ? 'Noticia activada' : 'Noticia ocultada');
    } catch (e: any) {
      toastError(String(e?.message ?? e));
    } finally {
      const set2 = new Set(togglingIds);
      set2.delete(item.id);
      togglingIds = set2;
    }
  }

  function fmtDate(d: string) {
    try {
      return new Date(d).toLocaleString('es-CL', {
        dateStyle: 'short',
        timeStyle: 'short'
      });
    } catch {
      return d;
    }
  }
</script>

<section class="mx-auto max-w-6xl px-4 py-6 space-y-6">
  <!-- Header -->
  <header class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 class="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
        Noticias (imágenes)
      </h1>
      <p class="text-sm text-slate-600">
        Sube imágenes de novedades, rifas y nuevos productos que se mostrarán en la sección
        <strong>/noticias</strong> del sitio público.
      </p>
    </div>
    <div class="text-xs text-slate-500">
      {items.length} noticia{items.length === 1 ? '' : 's'} en total
    </div>
  </header>

  <!-- Formulario de alta -->
  <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
    <h2 class="text-sm font-semibold text-slate-800">
      Agregar nueva noticia
    </h2>

    <form class="grid gap-4 md:grid-cols-2" on:submit|preventDefault={onSubmit}>
      <div class="space-y-3">
        <div>
          <!-- svelte-ignore a11y_label_has_associated_control -->
          <label class="block text-xs font-medium text-slate-700 mb-1">
            Título (opcional)
          </label>
          <input
            class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
            placeholder="Ej: Rifa cocina a leña invierno"
            bind:value={title}
          />
        </div>

        <div>
          <!-- svelte-ignore a11y_label_has_associated_control -->
          <label class="block text-xs font-medium text-slate-700 mb-1">
            Descripción breve (opcional)
          </label>
          <textarea
            class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70 resize-none"
            rows="3"
            placeholder="Ej: Participa en la rifa de una cocina a leña comprando desde el 1 al 30 de agosto…"
            bind:value={caption}
          ></textarea>
        </div>

        <div class="flex gap-4 items-end">
          <div class="flex-1">
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="block text-xs font-medium text-slate-700 mb-1">
              Orden (opcional)
            </label>
            <input
              type="number"
              min="0"
              class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
              bind:value={order}
            />
            <p class="mt-1 text-[11px] text-slate-500">
              Números más bajos se muestran primero.
            </p>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <div>
          <!-- svelte-ignore a11y_label_has_associated_control -->
          <label class="block text-xs font-medium text-slate-700 mb-1">
            Imagen de la noticia
          </label>
          <input
            type="file"
            accept="image/*"
            on:change={handleFileChange}
            class="block w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
          />
          <p class="mt-1 text-[11px] text-slate-500">
            Formatos recomendados: JPG o PNG. Ideal 1200x900 px aprox.
          </p>
        </div>

        {#if previewUrl}
          <div class="mt-2 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
            <img src={previewUrl} alt="Vista previa" class="w-full h-48 object-cover" />
          </div>
        {/if}

        <div class="mt-2">
          <button
            type="submit"
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 text-white px-4 py-2 text-sm font-medium shadow hover:bg-amber-700 active:bg-amber-800 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={saving}
          >
            {#if saving}
              <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v3a5 5 0 0 0-5 5H4z" />
              </svg>
              Guardando…
            {:else}
              Guardar noticia
            {/if}
          </button>
        </div>
      </div>
    </form>
  </div>

  <!-- Listado de noticias -->
  <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <h2 class="text-sm font-semibold text-slate-800 mb-3">
      Noticias existentes
    </h2>

    {#if loading}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each Array(6) as _}
          <!-- svelte-ignore element_invalid_self_closing_tag -->
          <div class="h-48 rounded-2xl bg-slate-100 animate-pulse" />
        {/each}
      </div>
    {:else if !items.length}
      <p class="text-sm text-slate-600">
        Aún no hay noticias. Agrega la primera usando el formulario de arriba.
      </p>
    {:else}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each items as it}
          <article class="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
            <div class="aspect-[4/3] bg-slate-100">
              <img
                src={it.image}
                alt={it.title || 'Noticia'}
                class="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div class="p-3 space-y-1 text-xs text-slate-700">
              {#if it.title}
                <h3 class="text-sm font-semibold text-slate-900 truncate">
                  {it.title}
                </h3>
              {/if}
              {#if it.caption}
                <p class="line-clamp-2">
                  {it.caption}
                </p>
              {/if}
              <p class="text-[11px] text-slate-500">
                #{it.id} · {fmtDate(it.created_at)}
              </p>

              <div class="mt-1 flex items-center justify-between text-[11px]">
                <div>
                  Estado:
                  {#if it.is_active}
                    <span class="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
                      Activa
                    </span>
                  {:else}
                    <span class="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                      Oculta
                    </span>
                  {/if}
                </div>

                <button
                  type="button"
                  class={`inline-flex items-center rounded-full px-3 py-0.5 font-medium border text-[11px] transition ${
                    it.is_active
                      ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                      : 'border-emerald-500 text-emerald-700 hover:bg-emerald-50'
                  }`}
                  on:click={() => toggleActive(it)}
                  disabled={togglingIds.has(it.id) || deletingIds.has(it.id)}
                >
                  {#if togglingIds.has(it.id)}
                    ...
                  {:else}
                    {it.is_active ? 'Ocultar' : 'Activar'}
                  {/if}
                </button>
              </div>
            </div>

            <button
              type="button"
              class="absolute top-2 right-2 rounded-full bg-black/60 text-white p-1.5 text-[11px] hover:bg-black/80"
              on:click={() => remove(it)}
              disabled={deletingIds.has(it.id)}
            >
              {#if deletingIds.has(it.id)}
                …
              {:else}
                ✕
              {/if}
            </button>
          </article>
        {/each}
      </div>
    {/if}
  </div>
</section>


