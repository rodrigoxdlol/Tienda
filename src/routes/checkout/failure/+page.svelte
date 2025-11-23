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
  <div class="rounded-2xl border border-rose-200 bg-white/80 shadow-sm p-8 text-center">
    <div
      class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600"
    >
      <!-- X icon -->
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
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </div>

    <h1 class="text-2xl font-semibold text-rose-700 mb-2">
      Pago rechazado o cancelado
    </h1>
    <p class="text-sm text-slate-600 mb-4">
      Tu pago no pudo completarse. Puede haber sido rechazado por el emisor de la tarjeta
      o cancelado durante el proceso.
    </p>

    <p class="text-sm text-slate-500 mb-6">
      Si crees que es un error, revisa los datos de tu tarjeta o intenta con otro medio de pago.
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
