<!-- src/routes/que-hacemos/+page.svelte -->
<script lang="ts">
  const STOVE = "/images/QueHacemos.webp"; 
  import ChatBot from '$lib/components/ChatBot.svelte';// cambia por tu archivo en /static/images
</script>

<main class="bg-slate-50">
  <section class="mx-auto max-w-7xl px-4 py-10 md:py-14">
    <!-- Encabezado -->
    <header class="text-center max-w-3xl mx-auto">
      <div class="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 ring-1 ring-amber-200">
        <span class="h-1.5 w-1.5 rounded-full bg-amber-500 mr-2"></span>
        <span class="text-xs font-semibold tracking-[0.18em] text-amber-700">
          Qué hacemos
        </span>
      </div>

      <h1 class="mt-4 text-3xl md:text-5xl font-semibold text-amber-800 tracking-tight">
        Calefactores de combustión lenta en Coyhaique
      </h1>
      <p class="mt-3 text-sm md:text-base text-slate-600">
        Diseñamos y fabricamos soluciones de calefacción y cocina a leña pensadas
        para el clima extremo del sur de Chile.
      </p>
    </header>

    <div class="mt-10 grid gap-10 lg:grid-cols-3 items-start">
      <!-- Columna de texto -->
      <div class="lg:col-span-2 space-y-8">
        <!-- Qué hacemos -->
        <section class="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-6 md:p-7">
          <h2 class="text-lg font-semibold text-amber-800 mb-3">
            Qué hacemos
          </h2>

          <p class="text-base md:text-lg text-slate-800">
            En <strong>Cocinas Appel</strong> estamos especializados en la
            fabricación y venta de:
          </p>

          <ul class="mt-4 list-disc pl-6 text-base md:text-lg leading-8 space-y-1 text-slate-700">
            <li>Cocinas a leña tradicionales y de combustión lenta.</li>
            <li>Calefactores de combustión lenta.</li>
            <li>Hojalatería.</li>
            <li>Bullones al caño.</li>
            <li>Termo a leña.</li>
            <li>Estanque para serpentin.</li>
            <li>Discos, parrillas enlozadas y en acero inoxidable.</li>
          </ul>
        </section>

        <!-- Nuestra Maestranza -->
        <section class="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-6 md:p-7">
          <h3 class="text-lg md:text-xl font-semibold text-slate-900">
            Nuestra maestranza
          </h3>
          <p class="mt-2 text-sm md:text-base text-slate-600">
            Contamos con un taller equipado y personal calificado para trabajar el acero con precisión.
          </p>

          <ul class="mt-4 space-y-3 text-base md:text-lg text-slate-800">
            <li class="flex items-start gap-2">
              <svg
                class="mt-1 h-4 w-4 text-amber-600"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M10 1.5 12.7 7l6 .5-4.6 3.9 1.4 5.9L10 14.9 4.5 17.3l1.4-5.9L1.3 7.5 7.3 7 10 1.5z" />
              </svg>
              <span>Fabricamos cilindrado.</span>
            </li>
            <li class="flex items-start gap-2">
              <svg
                class="mt-1 h-4 w-4 text-amber-600"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M10 1.5 12.7 7l6 .5-4.6 3.9 1.4 5.9L10 14.9 4.5 17.3l1.4-5.9L1.3 7.5 7.3 7 10 1.5z" />
              </svg>
              <span>Corte de plancha de distintas dimensiones.</span>
            </li>
            <li class="flex items-start gap-2">
              <svg
                class="mt-1 h-4 w-4 text-amber-600"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M10 1.5 12.7 7l6 .5-4.6 3.9 1.4 5.9L10 14.9 4.5 17.3l1.4-5.9L1.3 7.5 7.3 7 10 1.5z" />
              </svg>
              <span>Confeccionamos bandejas de panadería enlozadas.</span>
            </li>
          </ul>
        </section>

        <!-- Cierre comercial -->
        <section class="bg-gradient-to-r from-amber-50 via-amber-100/70 to-yellow-50 rounded-2xl border border-amber-100 px-6 py-5">
          <p class="text-base md:text-lg text-slate-900">
            Además, brindamos <strong>cocinas a leña industriales a pedido</strong>,
            precios cómodos y facilidades de pago. Realizamos distribución desde otros
            locales de la región. Conozca nuestra <strong>maestranza</strong>.
          </p>

          <p class="mt-3 text-base md:text-lg text-slate-800">
            Nos damos a conocer mediante recomendación de los clientes, tarjetas de
            presentación, calendarios y flyers.
          </p>
        </section>
      </div>

      <!-- Imagen derecha -->
      <aside class="lg:col-span-1">
          <figure
          class="relative rounded-3xl overflow-hidden ring-1 ring-black/10 bg-white shadow-lg lg:sticky lg:top-28"
        >
            <img
              src={STOVE}
              alt="Cocina a leña Appel"
              class="w-full h-auto object-cover"
              loading="lazy"
            />
            <figcaption class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent px-4 pb-4 pt-10 text-sm text-white/90">
              Cocina a leña Appel instalada en un hogar de la región de Aysén.
            </figcaption>
        </figure>
      </aside>
    </div>
  </section>
  <ChatBot />
</main>
