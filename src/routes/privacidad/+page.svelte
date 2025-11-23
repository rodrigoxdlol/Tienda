<script lang="ts">
  const EMAIL = 'appelpatagonia@gmail.com';
</script>

<div class="min-h-screen bg-slate-50">
  <main class="max-w-4xl mx-auto px-4 py-10 space-y-6">
    <header class="space-y-2">
      <h1 class="text-3xl font-semibold text-slate-900">
        Política de privacidad y tratamiento de datos
      </h1>
      <p class="text-sm text-slate-600">
        Esta página explica qué datos personales recopilamos en Cocinas Appel,
        para qué los usamos y qué derechos tienes sobre ellos.
      </p>
    </header>

    <section class="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
      <h2 class="text-lg font-semibold text-slate-900">1. Responsable del tratamiento</h2>
      <p class="text-sm text-slate-700">
        El responsable del tratamiento de tus datos personales es
        <strong> Cocinas Appel (sitio de demostración académico) </strong>,
        ubicado en Coyhaique, Región de Aysén, Chile.
      </p>
      <p class="text-sm text-slate-700">
        Puedes contactarnos en
        <a href={`mailto:${EMAIL}`} class="text-amber-700 hover:text-amber-900">
          {EMAIL}
        </a>.
      </p>
    </section>

    <section class="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
      <h2 class="text-lg font-semibold text-slate-900">2. Datos que recopilamos</h2>
      <ul class="list-disc pl-5 space-y-1 text-sm text-slate-700">
        <li>
          <strong>Datos de cuenta:</strong> nombre de usuario y contraseña
          (en el servidor se almacena en forma cifrada).
        </li>
        <li>
          <strong>Datos de contacto:</strong> correo electrónico y, opcionalmente, teléfono.
        </li>
        <li>
          <strong>Datos de envío:</strong> dirección, ciudad y región cuando haces una compra.
        </li>
        <li>
          <strong>Datos de compras:</strong> productos adquiridos, montos pagados, fechas y
          estados de las órdenes.
        </li>
        <li>
          <strong>Datos técnicos básicos:</strong> como dirección IP y logs necesarios
          para la seguridad del sitio.
        </li>
      </ul>
    </section>

    <section class="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
      <h2 class="text-lg font-semibold text-slate-900">3. Para qué usamos tus datos</h2>
      <ul class="list-disc pl-5 space-y-1 text-sm text-slate-700">
        <li>Crear y administrar tu cuenta de cliente.</li>
        <li>Procesar tus pedidos y gestionar pagos y envíos.</li>
        <li>Contactarte respecto al estado de tus compras o reclamos.</li>
        <li>Cumplir obligaciones legales y contables.</li>
        <li>Mejorar el funcionamiento y la seguridad de la plataforma.</li>
      </ul>
      <p class="text-sm text-slate-700">
        <strong>No vendemos tus datos a terceros</strong> ni los usamos para fines comerciales
        ajenos a la tienda.
      </p>
    </section>

    <section class="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
      <h2 class="text-lg font-semibold text-slate-900">4. Tus derechos</h2>
      <p class="text-sm text-slate-700">
        Puedes pedirnos en cualquier momento:
      </p>
      <ul class="list-disc pl-5 space-y-1 text-sm text-slate-700">
        <li>Acceso a los datos personales que tenemos sobre ti.</li>
        <li>Rectificación de datos incorrectos o incompletos.</li>
        <li>Eliminación de tu cuenta y datos asociados, cuando sea legalmente posible.</li>
      </ul>
      <p class="text-sm text-slate-700">
        Para ejercer tus derechos, escríbenos a
        <a href={`mailto:${EMAIL}`} class="text-amber-700 hover:text-amber-900">
          {EMAIL}
        </a>.
      </p>
    </section>

    <section class="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
      <h2 class="text-lg font-semibold text-slate-900">5. Plazo de conservación</h2>
      <p class="text-sm text-slate-700">
        Conservamos tus datos mientras mantengas una cuenta activa o mientras sea
        necesario para cumplir obligaciones legales relacionadas con las compras.
      </p>
    </section>

    <p class="text-xs text-slate-500">
      Esta política es parte de un proyecto académico y puede adaptarse a los
      requisitos legales específicos de tu cliente.
    </p>
  </main>
</div>
