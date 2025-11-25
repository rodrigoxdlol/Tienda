<script lang="ts">
  import { onMount } from 'svelte';
  import {
    adminListProducts,
    adminCreateProduct,
    adminPatchProduct,
    adminUploadMainImage,
    adminUploadGallery,
    adminDeleteGallery,
    adminDeleteProduct,
    adminListCategories,
  } from '$lib/api.admin';
  import { toastError, toastSuccess } from '$lib/ui/toast';

  // ---------- Estado ----------
  let items: any[] = [];
  let creating = false;

  // busy por acción
  let busyToggle = new Set<number>();
  let busyMain = new Set<number>();
  let busyGal = new Set<number>();
  let busyDelImg = new Set<string>(); // `${productId}:${imageId}`
  let busyDelProd = new Set<number>();
  let busyStock = new Set<number>();  // para cambios de stock
  let busyPrice = new Set<number>();  // para cambios de precio

  // Límite para considerar "stock bajo" (solo para las badges visuales)
  const LOW_STOCK_LIMIT = 5;

  // categorías
  let categories: any[] = [];

  // formulario creación
  let form = {
    name: '',
    slug: '',
    description: '',
    price: 0,
    stock: 0,
    is_active: true,
    category_id: '' as string,
  };
  let createMainImage: File | null = null;
  let createPreview: string | null = null;

  const money = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' });
  const fmt = (n: unknown) => money.format(Number(n ?? 0) || 0);

  // ---------- Filtros / sort / paginación ----------
  let q = '';
  let status: 'all' | 'active' | 'inactive' = 'all';
  let minPrice: number | null = null;
  let maxPrice: number | null = null;
  let sort: 'name' | 'price-asc' | 'price-desc' | 'stock-desc' = 'name';

  let page = 1;
  let perPage = 10;

  // derivados
  let filtered: any[] = [];
  let paged: any[] = [];
  let total = 0;
  let totalPages = 1;

  onMount(async () => {
    await Promise.all([load(), loadCategories()]);
  });

  async function load() {
    try {
      const data = await adminListProducts();
      items = (data || []).map((p: any) => ({ ...p, images: p.images ?? [] }));
    } catch (e: any) {
      toastError(String(e?.message ?? e));
    }
  }

  async function loadCategories() {
    try {
      categories = await adminListCategories();
    } catch (e: any) {
      toastError('No se pudieron cargar las categorías');
    }
  }

  // Recalcular vista cada vez que cambie algo relacionado
  $: {
    const needle = q.trim().toLowerCase();
    filtered = items
      .filter((p) => {
        if (status === 'active' && !p.is_active) return false;
        if (status === 'inactive' && p.is_active) return false;
        if (minPrice != null && Number(p.price) < minPrice) return false;
        if (maxPrice != null && Number(p.price) > maxPrice) return false;
        if (needle) {
          const hay = `${p.name ?? ''} ${p.slug ?? ''}`.toLowerCase();
          if (!hay.includes(needle)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sort === 'name') return String(a.name).localeCompare(String(b.name));
        if (sort === 'price-asc') return Number(a.price) - Number(b.price);
        if (sort === 'price-desc') return Number(b.price) - Number(a.price);
        if (sort === 'stock-desc') return Number(b.stock) - Number(a.stock);
        return 0;
      });

    total = filtered.length;
    totalPages = Math.max(1, Math.ceil(total / perPage));
    if (page > totalPages) page = totalPages;
    const start = (page - 1) * perPage;
    paged = filtered.slice(start, start + perPage);
  }

  function resetFilters() {
    q = '';
    status = 'all';
    minPrice = null;
    maxPrice = null;
    sort = 'name';
    page = 1;
  }

  // utils busy (Svelte requiere reasignación)
  const addBusy = (set: Set<any>, key: any) => new Set(set).add(key);
  function delBusy(set: Set<any>, key: any) {
    const s = new Set(set);
    s.delete(key);
    return s;
  }

  // crear
  function onPickCreateMain(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    createMainImage = file;
    if (createPreview) URL.revokeObjectURL(createPreview);
    createPreview = URL.createObjectURL(file);
    input.value = '';
  }
  function clearCreateMain() {
    createMainImage = null;
    if (createPreview) URL.revokeObjectURL(createPreview);
    createPreview = null;
  }

  async function create() {
    if (!form.name?.trim() || !form.slug?.trim()) {
      toastError('Completa Nombre y Slug');
      return;
    }
    creating = true;
    try {
      const catId = form.category_id ? Number(form.category_id) : null;

      const payload: any = {
        name: form.name,
        slug: form.slug,
        description: form.description || '',
        price: form.price,
        stock: form.stock,
        is_active: form.is_active,
        category_id: catId,
      };

      const product = await adminCreateProduct(payload);
      const id = product.id;

      if (createMainImage) {
        busyMain = addBusy(busyMain, id) as Set<number>;
        await adminUploadMainImage(id, createMainImage);
      }
      toastSuccess('Producto creado');
      form = {
        name: '',
        slug: '',
        description: '',
        price: 0,
        stock: 0,
        is_active: true,
        category_id: '',
      };
      clearCreateMain();
      await load();
    } catch (e: any) {
      toastError(String(e?.message ?? e));
    } finally {
      creating = false;
      busyMain = new Set();
    }
  }

  // acciones por producto
  async function toggleActive(p: any) {
    const id = p.id;
    const prev = p.is_active;
    updateItem(id, (it) => ({ ...it, is_active: !prev }));
    busyToggle = addBusy(busyToggle, id) as Set<number>;
    try {
      await adminPatchProduct(id, { is_active: !prev });
      toastSuccess(`Producto ${prev ? 'desactivado' : 'activado'}`);
    } catch (e: any) {
      updateItem(id, (it) => ({ ...it, is_active: prev }));
      toastError(String(e?.message ?? e));
    } finally {
      busyToggle = delBusy(busyToggle, id);
    }
  }

  async function uploadMain(p: any, file?: File, ev?: Event) {
    if (!file) return;
    const id = p.id;
    busyMain = addBusy(busyMain, id) as Set<number>;
    try {
      await adminUploadMainImage(id, file);
      toastSuccess('Imagen principal actualizada');
      await load();
    } catch (e: any) {
      toastError(String(e?.message ?? e));
    } finally {
      busyMain = delBusy(busyMain, id);
      if (ev) (ev.target as HTMLInputElement).value = '';
    }
  }

  async function addGallery(p: any, files?: FileList | File[], ev?: Event) {
    if (!files || !files[0]) return;
    const id = p.id;
    busyGal = addBusy(busyGal, id) as Set<number>;
    try {
      const list = Array.from(files as any);
      const optimistic = list.map((f) => ({ id: `tmp-${Math.random()}`, image: URL.createObjectURL(f) }));
      const prevImages = p.images ?? [];
      updateItem(id, (it) => ({ ...it, images: [...prevImages, ...optimistic] }));
      for (const f of list) await adminUploadGallery(id, f);
      optimistic.forEach((o) => URL.revokeObjectURL(o.image));
      await load();
      toastSuccess('Galería actualizada');
    } catch (e: any) {
      toastError(String(e?.message ?? e));
    } finally {
      busyGal = delBusy(busyGal, id);
      if (ev) (ev.target as HTMLInputElement).value = '';
    }
  }

  async function delGallery(p: any, img: any) {
    const pid = p.id;
    const key = `${pid}:${img.id}`;
    const prev = p.images ?? [];
    updateItem(pid, (it) => ({ ...it, images: prev.filter((g: any) => g.id !== img.id) }));
    busyDelImg = addBusy(busyDelImg, key) as Set<string>;
    try {
      await adminDeleteGallery(img.id);
      toastSuccess('Imagen eliminada');
    } catch (e: any) {
      updateItem(pid, (it) => ({ ...it, images: prev }));
      toastError(`No se pudo eliminar: ${String(e?.message ?? e)}`);
    } finally {
      busyDelImg = delBusy(busyDelImg, key);
    }
  }

  async function delProduct(p: any) {
    if (!confirm(`¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`)) return;
    const id = p.id;
    busyDelProd = addBusy(busyDelProd, id) as Set<number>;
    try {
      await adminDeleteProduct(id);
      items = items.filter((x) => x.id !== id);
      toastSuccess('Producto eliminado');
    } catch (e: any) {
      console.error('Error eliminando producto:', e);
      const errorMsg = String(e?.message || e);
      if (errorMsg.includes('foreign key') || errorMsg.includes('referenced') || errorMsg.includes('constraint')) {
        toastError('No se puede eliminar: este producto está en pedidos existentes. Puedes desactivarlo en su lugar.');
      } else {
        toastError(`Error al eliminar: ${errorMsg.substring(0, 100)}`);
      }
    } finally {
      busyDelProd = delBusy(busyDelProd, id);
    }
  }

  function updateItem(id: number, updater: (it: any) => any) {
    items = items.map((it) => (it.id === id ? updater(it) : it));
  }

  async function changeCategory(p: any, categoryId: string) {
    const id = p.id;
    const prev = p.category?.id ?? null;
    const newId = categoryId ? Number(categoryId) : null;

    // optimista
    updateItem(id, (it) => ({
      ...it,
      category: categories.find((c) => c.id === newId) || null,
    }));

    try {
      await adminPatchProduct(id, { category_id: newId });
      toastSuccess('Categoría actualizada');
    } catch (e: any) {
      // revertir
      updateItem(id, (it) => ({
        ...it,
        category: categories.find((c) => c.id === prev) || null,
      }));
      toastError(String(e?.message ?? e));
    }
  }

  // 🔸 Cambiar stock desde la tarjeta
  async function changeStock(p: any, event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    let value = Number(input.value);

    if (!Number.isFinite(value) || value < 0) {
      toastError('El stock debe ser un número mayor o igual a 0');
      input.value = String(p.stock ?? 0);
      return;
    }

    const id = p.id;
    const prev = p.stock;

    // optimista
    updateItem(id, (it) => ({ ...it, stock: value }));
    busyStock = addBusy(busyStock, id) as Set<number>;

    try {
      await adminPatchProduct(id, { stock: value });
      toastSuccess('Stock actualizado');
    } catch (e: any) {
      // rollback
      updateItem(id, (it) => ({ ...it, stock: prev }));
      input.value = String(prev);
      toastError(String(e?.message ?? e));
    } finally {
      busyStock = delBusy(busyStock, id);
    }
  }

  // 🔸 Cambiar precio desde la tarjeta
  async function changePrice(p: any, event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    let value = Number(input.value);

    if (!Number.isFinite(value) || value < 0) {
      toastError('El precio debe ser un número mayor o igual a 0');
      input.value = String(p.price ?? 0);
      return;
    }

    const id = p.id;
    const prev = p.price;

    // optimista
    updateItem(id, (it) => ({ ...it, price: value }));
    busyPrice = addBusy(busyPrice, id) as Set<number>;

    try {
      await adminPatchProduct(id, { price: value });
      toastSuccess('Precio actualizado');
    } catch (e: any) {
      // rollback
      updateItem(id, (it) => ({ ...it, price: prev }));
      input.value = String(prev);
      toastError(String(e?.message ?? e));
    } finally {
      busyPrice = delBusy(busyPrice, id);
    }
  }

  function slugify(s: string) {
    return s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
</script>

<section class="mx-auto max-w-7xl px-4 py-6 space-y-6">
  <!-- HEADER -->
  <header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div class="space-y-1">
      <div
        class="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-700 ring-1 ring-amber-100"
      >
        <span class="inline-block h-1.5 w-1.5 rounded-full bg-amber-500"></span>
        Panel de gestión · Productos
      </div>
      <h1 class="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">Productos</h1>
      <p class="text-sm text-slate-600">
        Administra el catálogo, imágenes, stock y categorías de Cocinas Appel.
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-500">
      <span class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
        <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
        {total} producto{total !== 1 ? 's' : ''} filtrados
      </span>
    </div>
  </header>

  <!-- BARRA DE FILTROS -->
  <div class="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
    <div class="grid gap-3 md:grid-cols-5 md:items-end">
      <label class="md:col-span-2">
        <span class="block text-xs text-slate-600 mb-1">Buscar (nombre o slug)</span>
        <input
          class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
          placeholder="Ej: lenga, parrilla…"
          bind:value={q}
          on:input={() => (page = 1)}
        />
      </label>

      <label>
        <span class="block text-xs text-slate-600 mb-1">Estado</span>
        <select
          class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
          bind:value={status}
          on:change={() => (page = 1)}
        >
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
      </label>

      <label>
        <span class="block text-xs text-slate-600 mb-1">Precio mín.</span>
        <input
          class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
          type="number"
          min="0"
          bind:value={minPrice}
          on:input={() => (page = 1)}
        />
      </label>

      <label>
        <span class="block text-xs text-slate-600 mb-1">Precio máx.</span>
        <input
          class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
          type="number"
          min="0"
          bind:value={maxPrice}
          on:input={() => (page = 1)}
        />
      </label>
    </div>

    <div class="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <label class="inline-flex items-center gap-2">
        <span class="block text-xs text-slate-600">Ordenar por</span>
        <select
          class="rounded-xl border border-slate-300 px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
          bind:value={sort}
        >
          <option value="name">Nombre (A–Z)</option>
          <option value="price-asc">Precio ↑</option>
          <option value="price-desc">Precio ↓</option>
          <option value="stock-desc">Stock ↓</option>
        </select>
      </label>

      <div class="flex items-center gap-2 self-end sm:self-auto">
        <span class="text-[11px] text-slate-500 hidden sm:inline">{total} resultados actuales</span>
        <button
          type="button"
          class="rounded-xl ring-1 ring-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 active:scale-[.98] transition"
          on:click={resetFilters}
        >
          Limpiar filtros
        </button>
      </div>
    </div>
  </div>

  <!-- CREAR PRODUCTO -->
  <div class="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h2 class="text-sm font-semibold text-slate-800">Nuevo producto</h2>
        <p class="text-[11px] text-slate-500 mt-0.5">
          Completa los campos básicos y sube la imagen principal.
        </p>
      </div>
      <span class="text-xs text-slate-500">Campos básicos</span>
    </div>

    <div class="mt-4 grid gap-3 sm:grid-cols-6">
      <label class="sm:col-span-2">
        <span class="block text-xs text-slate-600 mb-1">Nombre</span>
        <input
          class="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
          placeholder="Ej: Cocina Lenga 90cm"
          bind:value={form.name}
          on:blur={() => {
            if (!form.slug.trim() && form.name) form.slug = slugify(form.name);
          }}
        />
      </label>

      <label class="sm:col-span-2">
        <span class="block text-xs text-slate-600 mb-1">Slug</span>
        <div class="flex gap-2">
          <input
            class="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
            placeholder="cocina-lenga-90"
            bind:value={form.slug}
          />
        </div>
      </label>

      <label class="sm:col-span-6">
        <span class="block text-xs text-slate-600 mb-1">Descripción</span>
        <textarea
          class="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
          placeholder="Descripción detallada del producto (opcional)"
          rows="3"
          bind:value={form.description}
        ></textarea>
      </label>

      <label class="sm:col-span-2">
        <span class="block text-xs text-slate-600 mb-1">Categoría</span>
        <select
          class="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
          bind:value={form.category_id}
        >
          <option value="">Sin categoría</option>
          {#each categories as c}
            <option value={c.id}>{c.name}</option>
          {/each}
        </select>
      </label>

      <label>
        <span class="block text-xs text-slate-600 mb-1">Precio</span>
        <input
          class="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
          type="number"
          min="0"
          placeholder="0"
          bind:value={form.price}
        />
      </label>

      <label>
        <span class="block text-xs text-slate-600 mb-1">Stock</span>
        <input
          class="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70"
          type="number"
          min="0"
          placeholder="0"
          bind:value={form.stock}
        />
      </label>
    </div>

    <div class="mt-4 flex flex-wrap items-center gap-3">
      <!-- Switch activo -->
      <label class="inline-flex items-center gap-2 select-none text-sm text-slate-700 cursor-pointer">
        <input type="checkbox" bind:checked={form.is_active} class="peer sr-only" />
        <span
          class="relative inline-flex h-6 w-11 items-center rounded-full ring-1 ring-slate-300
                 bg-slate-300 peer-checked:bg-amber-600 peer-checked:ring-amber-500/40
                 transition-colors duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        >
          <span
            class="absolute left-1 h-4 w-4 rounded-full bg-white shadow-sm transform-gpu
                   transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                   peer-checked:translate-x-5 peer-active:scale-95"
          ></span>
        </span>
        <span class="ml-1">{form.is_active ? 'Activo' : 'Inactivo'}</span>
      </label>

      <!-- Imagen principal al crear -->
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-sm text-slate-700">Imagen principal</span>
        <label class="relative inline-flex cursor-pointer">
          <input type="file" accept="image/*" class="sr-only" on:change={onPickCreateMain} />
          <span class="rounded-xl ring-1 ring-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 active:scale-[.98]">
            Seleccionar
          </span>
        </label>
        {#if createPreview}
          <div class="flex items-center gap-2">
            <img src={createPreview} alt="preview" class="h-10 w-10 object-cover rounded-lg ring-1 ring-slate-200" />
            <button
              type="button"
              class="text-xs text-rose-600 hover:underline"
              on:click={clearCreateMain}
            >
              Quitar
            </button>
          </div>
        {/if}
      </div>

      <div class="ml-auto">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl bg-amber-600 text-white px-4 py-2 text-sm font-medium shadow hover:bg-amber-700 active:scale-[.99] disabled:opacity-60 disabled:cursor-not-allowed"
          on:click={create}
          disabled={creating}
        >
          {#if creating}
            <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v3a5 5 0 0 0-5 5H4z" />
            </svg>
            Creando…
          {:else}
            Crear
          {/if}
        </button>
      </div>
    </div>
  </div>

  <!-- GRID DE PRODUCTOS -->
  <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
    {#each paged as p (p.id)}
      <article
        class="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      >
        <!-- Imagen principal -->
        <div class="relative h-40 bg-slate-100">
          {#if p.image}
            <img src={p.image} alt={p.name} class="h-full w-full object-cover" />
          {:else}
            <div class="grid h-full place-items-center text-slate-400 text-sm">Sin imagen</div>
          {/if}

          <!-- Badges -->
          <div class="absolute top-2 left-2 flex gap-2">
            {#if !p.is_active}
              <span class="rounded-full bg-slate-900/80 text-white text-[11px] px-2 py-0.5">Inactivo</span>
            {/if}
            <span class="rounded-full bg-white/90 ring-1 ring-slate-200 text-[11px] px-2 py-0.5">
              {p.images?.length || 0} img
            </span>
          </div>

          <!-- Eliminar -->
          <button
            type="button"
            class="absolute top-2 right-2 inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[12px]
                   ring-1 ring-rose-200 text-rose-700 bg-rose-50/70 backdrop-blur
                   hover:bg-rose-50 hover:ring-rose-300 active:bg-rose-100
                   disabled:opacity-60 disabled:cursor-not-allowed transition"
            on:click={() => delProduct(p)}
            disabled={busyDelProd.has(p.id)}
            aria-label="Eliminar producto"
            title="Eliminar producto"
          >
            {#if busyDelProd.has(p.id)}
              <svg class="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity=".25" stroke-width="3" />
                <path d="M21 12a9 9 0 0 1-9 9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
              </svg>
              Eliminando…
            {:else}
              <svg viewBox="0 0 24 24" class="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path
                  d="M9 3h6a1 1 0 0 1 1 1v1h4v2H4V5h4V4a1 1 0 0 1 1-1Zm1 6h2v9h-2V9Zm5 0h2v9h-2V9ZM7 9h2v9H7V9Z"
                />
              </svg>
              Eliminar
            {/if}
          </button>
        </div>

        <!-- Info -->
        <div class="p-4 space-y-3">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="truncate font-medium text-slate-900">{p.name}</p>
              <p class="text-xs text-slate-500">/{p.slug}</p>
            </div>

            <!-- Switch activo -->
            <label class="inline-flex items-center gap-2 select-none text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={p.is_active}
                on:change={() => toggleActive(p)}
                class="peer sr-only"
                disabled={busyToggle.has(p.id)}
              />
              <span
                class="relative inline-flex h-5 w-9 items-center rounded-full ring-1 ring-slate-300
                       bg-slate-300 peer-checked:bg-amber-600 peer-checked:ring-amber-500/40
                       transition-colors duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                       disabled:opacity-60"
              >
                <span
                  class="absolute left-1 h-3.5 w-3.5 rounded-full bg-white shadow-sm transform-gpu
                         transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                         peer-checked:translate-x-4 peer-active:scale-95"
                ></span>
              </span>
              {#if busyToggle.has(p.id)}
                <svg class="h-3.5 w-3.5 animate-spin text-slate-500" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity=".25" stroke-width="3" />
                  <path d="M21 12a9 9 0 0 1-9 9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
                </svg>
              {:else}
                {p.is_active ? 'activo' : 'inactivo'}
              {/if}
            </label>
          </div>

          <!-- Precio + Stock editable -->
          <div class="space-y-2">
            <!-- Precio editable -->
            <div class="flex items-center gap-2 text-sm">
              <span class="text-slate-600">Precio:</span>
              <input
                class="w-28 rounded-lg border border-slate-300 px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
                type="number"
                min="0"
                step="100"
                value={p.price}
                on:change={(e) => changePrice(p, e)}
              />
              {#if busyPrice.has(p.id)}
                <svg
                  class="h-3.5 w-3.5 animate-spin text-slate-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    stroke-opacity=".25"
                    stroke-width="3"
                  />
                  <path
                    d="M21 12a9 9 0 0 1-9 9"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                  />
                </svg>
              {:else}
                <span class="text-xs font-semibold text-slate-900">{fmt(p.price)}</span>
              {/if}
            </div>

            <!-- Stock editable -->
            <div class="flex items-center gap-2 text-xs">
              <span class="text-slate-600">Stock:</span>
              <input
                class="w-16 rounded-lg border border-slate-300 px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
                type="number"
                min="0"
                value={p.stock}
                on:change={(e) => changeStock(p, e)}
              />
              {#if busyStock.has(p.id)}
                <svg
                  class="h-3.5 w-3.5 animate-spin text-slate-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    stroke-opacity=".25"
                    stroke-width="3"
                  />
                  <path
                    d="M21 12a9 9 0 0 1-9 9"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                  />
                </svg>
              {/if}

              {#if Number(p.stock) <= 0}
                <span class="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] text-rose-700 ring-1 ring-rose-100">
                  Sin stock
                </span>
              {:else if Number(p.stock) <= LOW_STOCK_LIMIT}
                <span class="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-800 ring-1 ring-amber-100">
                  Stock bajo
                </span>
              {/if}
            </div>
          </div>

          <!-- Categoría del producto -->
          <div class="mt-2">
            <span class="block text-[11px] text-slate-600 mb-1">Categoría</span>
            <select
              class="w-full rounded-xl border border-slate-300 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/70"
              on:change={(e) => changeCategory(p, (e.currentTarget as HTMLSelectElement).value)}
              value={p.category?.id ?? ''}
            >
              <option value=''>Sin categoría</option>
              {#each categories as c}
                <option value={c.id}>{c.name}</option>
              {/each}
            </select>
          </div>

          <!-- Subir imagen principal -->
          <div class="pt-1">
            <div class="block text-xs text-slate-600 mb-1">Imagen principal</div>
            <label class="relative inline-flex cursor-pointer">
              <input
                type="file"
                accept="image/*"
                class="sr-only"
                on:change={(e: any) => uploadMain(p, e.target.files?.[0], e)}
                disabled={busyMain.has(p.id)}
              />
              <span class="rounded-xl ring-1 ring-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-60">
                {busyMain.has(p.id) ? 'Subiendo…' : 'Seleccionar'}
              </span>
            </label>
          </div>

          <!-- Galería -->
          <div class="pt-1">
            <div class="block text-xs text-slate-600 mb-1">Galería</div>

            <div class="flex flex-wrap items-center gap-2">
              <label class="relative inline-flex cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  class="sr-only"
                  on:change={(e: any) => addGallery(p, e.target.files, e)}
                  disabled={busyGal.has(p.id)}
                />
                <span class="rounded-xl ring-1 ring-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-60">
                  {busyGal.has(p.id) ? 'Subiendo…' : 'Agregar imágenes'}
                </span>
              </label>
              <span class="text-xs text-slate-500">({p.images?.length || 0})</span>
            </div>

            <div class="grid grid-cols-4 gap-2 pt-2">
              {#each p.images ?? [] as img (img.id)}
                {#key img.id}
                  <div class="relative group">
                    <img
                      src={img.image}
                      alt="miniatura"
                      class="h-16 w-full object-cover rounded-lg ring-1 ring-slate-200"
                    />
                    <button
                      type="button"
                      class="absolute top-1 right-1 rounded bg-rose-600/90 text-white text-[11px] px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition
                             disabled:opacity-60"
                      on:click|stopPropagation|preventDefault={() => delGallery(p, img)}
                      aria-label="Eliminar imagen"
                      disabled={busyDelImg.has(`${p.id}:${img.id}`)}
                    >
                      {busyDelImg.has(`${p.id}:${img.id}`) ? '...' : 'Eliminar'}
                    </button>
                  </div>
                {/key}
              {/each}
            </div>
          </div>
        </div>
      </article>
    {/each}
  </div>

  <!-- PAGINACIÓN -->
  {#if totalPages > 1}
    <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
      <button
        class="rounded-lg ring-1 ring-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50 active:scale-[.98]"
        on:click={() => (page = Math.max(1, page - 1))}
        disabled={page === 1}
      >
        Anterior
      </button>
      <span class="text-sm text-slate-600">
        Página <span class="font-medium">{page}</span> de <span class="font-medium">{totalPages}</span>
      </span>
      <button
        class="rounded-lg ring-1 ring-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50 active:scale-[.98]"
        on:click={() => (page = Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
      >
        Siguiente
      </button>

      <div class="flex items-center gap-2">
        <span class="text-xs text-slate-500">por página</span>
        <select
          class="rounded-lg ring-1 ring-slate-300 px-2 py-1.5 text-sm"
          bind:value={perPage}
        >
          <option value="6">6</option>
          <option value="10">10</option>
          <option value="18">18</option>
          <option value="30">30</option>
        </select>
      </div>
    </div>
  {/if}
</section>








