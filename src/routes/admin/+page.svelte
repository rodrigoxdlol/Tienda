<script lang="ts">
  import { user } from '$lib/auth.store';

  const tab =
    'px-3 py-1.5 rounded-xl ring-1 ring-slate-200 bg-white hover:bg-slate-50 text-sm';
  const tile =
    'group rounded-2xl bg-white ring-1 ring-slate-200 p-5 hover:shadow-md transition-shadow';
</script>

<h1 class="text-2xl font-semibold">Panel</h1>

{#if $user?.authenticated && $user?.is_staff}
  <!-- Accesos rápidos
  <nav class="mt-4 flex flex-wrap gap-2">
    <a href="/admin/products"      class={tab}>Productos</a>
    <a href="/admin/orders"        class={tab}>Órdenes</a>
     NUEVOS 
    <a href="/admin/home-media"    class={tab}>Inicio</a>
    <a href="/admin/gallery-media" class={tab}>Galería</a>
  </nav> -->

  <!-- Tarjetas -->
  <div class="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
    <a href="/admin/products" class={tile}>
      <div class="text-slate-800 font-semibold">Productos</div>
      <p class="text-sm text-slate-600 mt-1">Gestiona catálogo, precios e imágenes.</p>
    </a>

    <a href="/admin/orders" class={tile}>
      <div class="text-slate-800 font-semibold">Órdenes</div>
      <p class="text-sm text-slate-600 mt-1">Revisa pedidos y su estado.</p>
    </a>

    <!-- NUEVAS tarjetas -->
    <a href="/admin/home-media" class={tile}>
      <div class="text-slate-800 font-semibold">Inicio</div>
      <p class="text-sm text-slate-600 mt-1">Imágenes del slider de la portada.</p>
    </a>

    <a href="/admin/gallery-media" class={tile}>
      <div class="text-slate-800 font-semibold">Galería</div>
      <p class="text-sm text-slate-600 mt-1">Gestiona la galería pública.</p>
    </a>
    <a href="/admin/users" class={tile}>
      <div class="text-slate-800 font-semibold">Usuarios</div>
      <p class="text-sm text-slate-600 mt-1">Gestiona cuentas de usuario.</p>
    </a>
    <a href="/admin/estadisticas" class={tile}>
      <div class="text-slate-800 font-semibold">Estadisticas</div>
      <p class="text-sm text-slate-600 mt-1">Visión para analisis de productos y categorias.</p>
    </a>
    <a href="/admin/reclamos" class={tile}>
      <div class="text-slate-800 font-semibold">Reclamos</div>
      <p class="text-sm text-slate-600 mt-1">Gestiona reclamos de clientes.</p>
    </a>
    <a href="/admin/noticias" class={tile}>
      <div class="text-slate-800 font-semibold">Noticias</div>
      <p class="text-sm text-slate-600 mt-1">Gestión de noticias.</p>
    </a>

  </div>
{:else}
  <!-- Mensaje si no es staff o no está logueado -->
  <p class="mt-4 text-slate-600">Inicia sesión con una cuenta de staff para ver el panel.</p>
{/if}

