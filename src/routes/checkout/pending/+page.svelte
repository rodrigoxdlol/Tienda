<script lang="ts">
  import { goto } from '$app/navigation';

  function goHome() {
    goto('/');
  }

  function goOrders() {
    goto('/mi-cuenta/pedidos');
  }
</script>

<section class="mx-auto max-w-2xl px-4 py-16">
  <div class="rounded-2xl border border-amber-200 bg-white/80 shadow-sm p-8 text-center">
    <div
      class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600"
    >
      <!-- reloj / pending icon -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-7 w-7"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15 14" />
      </svg>
    </div>

    <h1 class="text-2xl font-semibold text-amber-700 mb-2">
      Tu pago está pendiente
    </h1>
    <p class="text-sm text-slate-600 mb-4">
      Hemos recibido la información de tu compra, pero el pago aún se encuentra en proceso de
      confirmación por parte de Mercado Pago.
    </p>

    <p class="text-sm text-slate-500 mb-6">
      Apenas se confirme, actualizaremos el estado de tu pedido. Puedes revisar el detalle desde
      la sección <span class="font-medium text-amber-700">“Mis pedidos”</span>.
    </p>

    <div class="flex flex-wrap gap-3 justify-center">
      <button
        class="inline-flex items-center gap-2 rounded-xl bg-amber-600 text-white px-4 py-2 text-sm font-medium shadow hover:bg-amber-700"
        type="button"
        on:click={goHome}
      >
        Volver a la tienda
      </button>

      <button
        class="inline-flex items-center gap-2 rounded-xl border border-slate-300 text-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-50"
        type="button"
        on:click={goOrders}
      >
        Ver mis pedidos
      </button>
    </div>
  </div>
</section>
