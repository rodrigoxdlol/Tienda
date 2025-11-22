<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  
  // Variables para el estado
  let status: string | null = null;
  let orderId: string | null = null;
  let loading = true;

  onMount(() => {
    // Leer parámetros de la URL (?status=success&order_id=...)
    const params = $page.url.searchParams;
    status = params.get('status');
    orderId = params.get('order_id');
    loading = false;

    // Si el pago fue exitoso, podrías limpiar el carrito local aquí
    if (status === 'success') {
        // Ejemplo: cart.set({ items: [] });
        // o localStorage.removeItem('cart');
    }
  });
</script>

<div class="min-h-[60vh] flex flex-col items-center justify-center p-6">
  {#if loading}
    <div class="animate-pulse text-lg text-gray-600">Verificando pago...</div>
  {:else}
    
    {#if status === 'success'}
      <div class="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md border border-green-100">
        <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-gray-800 mb-2">¡Pago Exitoso!</h1>
        <p class="text-gray-600 mb-6">
          Tu orden <span class="font-mono font-bold text-gray-800">#{orderId}</span> ha sido procesada correctamente.
        </p>
        <div class="flex gap-3 justify-center">
          <a href="/" class="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
            Volver al inicio
          </a>
          <a href="/my/orders" class="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition">
            Ver mis pedidos
          </a>
        </div>
      </div>

    {:else if status === 'rejected'}
      <div class="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md border border-red-100">
        <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Pago Rechazado</h1>
        <p class="text-gray-600 mb-6">
          La transacción fue rechazada por el banco o anulada.
        </p>
        <a href="/checkout" class="inline-block px-8 py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition shadow-md shadow-amber-600/20">
          Intentar nuevamente
        </a>
      </div>

    {:else if status === 'aborted'}
      <div class="text-center">
        <h1 class="text-2xl font-bold text-gray-800 mb-2">Operación Cancelada</h1>
        <p class="text-gray-600 mb-6">Has cancelado el proceso de pago en Webpay.</p>
        <a href="/checkout" class="text-amber-600 hover:underline">Volver al checkout</a>
      </div>

    {:else}
      <div class="text-center">
        <h1 class="text-2xl font-bold text-gray-800 mb-2">Hubo un error</h1>
        <p class="text-gray-600 mb-6">No pudimos verificar el estado de tu pago.</p>
        <a href="/" class="text-amber-600 hover:underline">Ir al inicio</a>
      </div>
    {/if}

  {/if}
</div>