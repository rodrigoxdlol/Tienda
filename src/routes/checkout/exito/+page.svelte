<script lang="ts">
  import { page } from '$app/stores';

  $: search = $page.url.searchParams;
  $: status = search.get('status') ?? 'success';
  $: orderNumber = search.get('o') ?? '';

  let title = '';
  let description = '';
  let badgeClass = '';

  $: {
    if (status === 'approved' || status === 'success') {
      title = '¡Pago acreditado!';
      description =
        'Tu compra fue procesada correctamente. Nos pondremos en contacto para coordinar la entrega de tu cocina.';
      badgeClass = 'bg-emerald-100 text-emerald-700 ring-emerald-200';
    } else if (status === 'pending') {
      title = 'Pago pendiente';
      description =
        'Tu pago está siendo procesado por Mercado Pago. Te avisaremos cuando se acredite.';
      badgeClass = 'bg-amber-100 text-amber-800 ring-amber-200';
    } else if (status === 'failure' || status === 'rejected') {
      title = 'Pago rechazado';
      description =
        'El pago no pudo completarse. Puedes intentar nuevamente con otro medio de pago o contactar con nosotros.';
      badgeClass = 'bg-rose-100 text-rose-700 ring-rose-200';
    } else if (status === 'order_not_found') {
      title = 'Orden no encontrada';
      description =
        'No pudimos encontrar la orden asociada a este pago. Si crees que esto es un error, escríbenos.';
      badgeClass = 'bg-rose-100 text-rose-700 ring-rose-200';
    } else {
      title = 'Estado de pago desconocido';
      description =
        'No pudimos determinar el estado del pago. Revisa tu correo o contáctanos para más información.';
      badgeClass = 'bg-slate-100 text-slate-700 ring-slate-200';
    }
  }

  function goHome() {
    window.location.href = '/';
  }

  function goToShop() {
    window.location.href = '/productos';
  }
</script>

<section class="mx-auto max-w-3xl px-4 py-12">
  <div class="rounded-2xl border border-slate-200 bg-white/90 shadow-sm p-6 sm:p-8">
    <div class="flex items-center gap-3">
      <div
        class={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium ring-1 ${badgeClass}`}
      >
        {#if status === 'approved' || status === 'success'}
          Pago aprobado
        {:else if status === 'pending'}
          Pago pendiente
        {:else if status === 'failure' || status === 'rejected'}
          Pago rechazado
        {:else}
          Información
        {/if}
      </div>
    </div>

    <h1 class="mt-4 text-2xl font-semibold text-slate-900">
      {title}
    </h1>

    {#if orderNumber}
      <p class="mt-2 text-sm text-slate-600">
        Número de pedido:
        <span class="font-semibold text-slate-800">#{orderNumber}</span>
      </p>
    {/if}

    <p class="mt-3 text-sm text-slate-700">
      {description}
    </p>

    <div class="mt-6 flex flex-wrap gap-3">
      <button
        type="button"
        class="inline-flex items-center rounded-xl bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-amber-700"
        on:click={goHome}
      >
        Volver al inicio
      </button>

      <button
        type="button"
        class="inline-flex items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        on:click={goToShop}
      >
        Seguir comprando
      </button>
    </div>

    <div class="mt-6 border-t pt-4 text-xs text-slate-500">
      <p>
        Si tienes dudas sobre tu pago o quieres coordinar detalles de la entrega,
        puedes contactarnos a través del formulario de contacto o por WhatsApp.
      </p>
    </div>
  </div>
</section>
