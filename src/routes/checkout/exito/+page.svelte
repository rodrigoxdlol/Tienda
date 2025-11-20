<script lang="ts">
  import { page } from '$app/stores';
  const o = $page.url.searchParams.get('o');
</script>

<section class="mx-auto max-w-3xl px-4 py-16 text-center">
  <h1 class="text-3xl font-semibold text-amber-800">¡Gracias por tu compra!</h1>
  <p class="mt-4 text-slate-700">
    Hemos recibido tu pedido {#if o}<b>#{o}</b>{/if}. Te enviaremos la confirmación por correo.
  </p>
  <a href="/productos" class="mt-8 inline-flex rounded-xl bg-slate-900 text-white px-4 py-2 text-sm hover:bg-black">
    Seguir comprando
  </a>
</section>
