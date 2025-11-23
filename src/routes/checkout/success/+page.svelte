<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  // Leer el order_id del querystring ?order_id=123
  let orderId: string | null = null;

  $: orderId = $page.url.searchParams.get('order_id');

  function goHome() {
    goto('/');
  }

  function goOrders() {
    goto('/mi-cuenta/pedidos');
  }
</script>

<section class="mx-auto max-w-2xl px-4 py-16">
  <div class="rounded-2xl border border-emerald-200 bg-white/80 shadow-sm p-8 text-center">
    <div
      class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
    >
      <!-- Check icon -->
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
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </div>

    <h1 class="text-2xl font-semibold text-emerald-700 mb-2">
      ¡Pago realizado con éxito!
    </h1>

    {#if orderId}
      <p class="text-sm text-slate-600 mb-2">
        Tu pedido fue registrado correctamente.
      </p>
      <p class="text-sm text-slate-500 mb-4">
        Número de pedido:
        <span class="font-semibold text-slate-800">#{orderId}</span>
      </p>
    {:else}
      <p class="text-sm text-slate-600 mb-4">
        Tu compra fue procesada. Puedes revisar el detalle en la sección “Mis pedidos”.
      </p>
    {/if}

    <p class="text-xs text-slate-500 mb-6">
      También recibirás un correo con el detalle de tu compra (si configuraste el envío de emails).
    </p>

    <div class="flex flex-wrap gap-3 justify-center">
      <button
        class="inline-flex items-center gap-2 rounded-xl bg-amber-600 text-white px-4 py-2 text-sm font-medium shadow hover:bg-amber-700"
        type="button"
        on:click={goHome}
      >
        Seguir comprando
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
