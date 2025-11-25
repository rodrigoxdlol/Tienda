<script lang="ts">
  import ChatBot from '$lib/components/ChatBot.svelte';
  import { user } from '$lib/auth.store';        // 👈 store de sesión

  const API = 'http://127.0.0.1:8000'; // backend Django

  type FormErrors = Record<string, string>;

  let sending = false;

  // valores del formulario
  let name = '';
  let email = '';
  let phone = '';
  let subject = '';
  let message = '';
  let company = ''; // honeypot

  // estado de respuesta
  let success = false;
  let errors: FormErrors = {};
  let serverMsg = '';

  // reCAPTCHA
  let recaptchaToken = '';
  
  // Global callback for reCAPTCHA
  // Se necesita declarar en window para que el script de Google lo encuentre si usas data-callback
  // O simplemente asignarlo cuando el usuario interactúa.
  // En este caso, usaremos una función que asignaremos al objeto window.
  
  import { onMount, onDestroy } from 'svelte';

  onMount(() => {
    (window as any).onCaptchaSuccess = (token: string) => {
      recaptchaToken = token;
      if (errors.recaptcha) {
         delete errors.recaptcha;
         errors = errors; // trigger reactivity
      }
    };
    
    (window as any).onCaptchaExpired = () => {
      recaptchaToken = '';
    };
  });

  onDestroy(() => {
    // Limpieza si es necesaria
    delete (window as any).onCaptchaSuccess;
    delete (window as any).onCaptchaExpired;
  });

  // 👇 para no sobreescribir lo que el usuario ya editó a mano
  let autofilled = false;

  // 🔥 Autocompletar cuando el usuario esté logeado
  $: if ($user && !autofilled) {
    // nombre: first_name + last_name o username
    const u = $user as any;
    name =
      ((u.first_name ?? '') + ' ' + (u.last_name ?? '')).trim() ||
      (u.username ?? '');

    // email desde el usuario
    email = u.email ?? '';

    // teléfono: ajusta según cómo lo tengas en el backend
    phone =
      (u.phone as string | undefined) ??
      (u.profile?.phone as string | undefined) ??
      '';

    autofilled = true;
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    sending = true;
    success = false;
    serverMsg = '';
    errors = {};

    // validaciones básicas
    if (!name.trim()) errors.name = 'Ingresa tu nombre';
    if (!email.trim()) errors.email = 'Ingresa tu correo';
    if (!message.trim()) errors.message = 'Ingresa tu mensaje';
    if (!recaptchaToken) errors.recaptcha = 'Por favor, completa el captcha';

    // honeypot (bots)
    if (company.trim()) {
      sending = false;
      success = true;
      return;
    }

    if (Object.keys(errors).length) {
      sending = false;
      return;
    }

    try {
      const res = await fetch(`${API}/api/shop/site/contact/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // 👈 importante para asociar al usuario
        body: JSON.stringify({
          name,
          email,
          phone,
          subject,
          message,
          recaptcha_token: recaptchaToken
        })
      });

      if (!res.ok) {
        console.error('Error contacto', res.status, await res.text());
        serverMsg =
          'Hubo un problema al enviar tu mensaje. Inténtalo de nuevo.';
      } else {
        success = true;
        serverMsg = '';
        // limpiar SOLO asunto y mensaje, dejamos nombre/email/teléfono autocompletados
        subject = '';
        message = '';
        // Reset reCAPTCHA
        recaptchaToken = '';
        if ((window as any).grecaptcha) {
          (window as any).grecaptcha.reset();
        }
      }
    } catch (e) {
      console.error(e);
      serverMsg = 'No se pudo contactar con el servidor.';
    } finally {
      sending = false;
    }
  }
</script>

<svelte:head>
  <script src="https://www.google.com/recaptcha/api.js" async defer></script>
</svelte:head>

<main class="bg-slate-50">
  <section class="max-w-5xl mx-auto px-4 py-10 md:py-14">
    <!-- Encabezado -->
    <header class="mb-8 text-center">
      <div
        class="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 ring-1 ring-amber-200"
      >
        <span class="h-1.5 w-1.5 rounded-full bg-amber-500 mr-2"></span>
        <span class="text-xs font-semibold tracking-[0.18em] text-amber-700">
          Contacto
        </span>
      </div>
      <h1
        class="mt-4 text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight"
      >
        ¿Hablamos sobre tu proyecto?
      </h1>
      <p
        class="mt-2 text-sm md:text-base text-slate-600 max-w-xl mx-auto"
      >
        Envíanos un mensaje y te responderemos a la brevedad para ayudarte con
        cocinas, calefactores o proyectos especiales.
      </p>
    </header>

    <div class="grid gap-6 md:grid-cols-5 items-stretch">
      <!-- Lado informativo -->
      <aside
        class="md:col-span-2 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950
               text-white p-6 md:p-7 relative overflow-hidden shadow-lg"
      >
        <div
          class="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 blur-2xl"
        ></div>
        <div
          class="absolute -bottom-12 -left-10 w-40 h-40 rounded-full bg-amber-500/15 blur-2xl"
        ></div>

        <div class="relative">
          <h2 class="text-xl md:text-2xl font-semibold">¿Hablamos?</h2>
          <p class="mt-2 text-slate-200 text-sm md:text-[15px]">
            Cuéntanos tu idea, proyecto o necesidad y buscamos la mejor solución
            para tu hogar o negocio.
          </p>

          <ul class="mt-6 space-y-3 text-sm md:text-[15px] text-slate-100/90">
            <li class="flex items-center gap-3">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  d="M20 4H4a2 2 0 0 0-2 2v1.2l10 6.25 10-6.25V6a2 2 0 0 0-2-2Zm2 6.05-9.34 5.83a2 2 0 0 1-2.32 0L1 10.05V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-7.95Z"
                />
              </svg>
              <span>appelpatagonia@gmail.com</span>
            </li>
            <li class="flex items-center gap-3">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24 11.36 11.36 0 0 0 3.56.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.3 21 3 13.7 3 4a1 1 0 0 1 1-1h2.49a1 1 0 0 1 1 1 11.36 11.36 0 0 0 .57 3.56 1 1 0 0 1-.24 1.02l-2.2 2.2Z"
                />
              </svg>
              <span>+67 223 3255</span>
              <span>+56 9 77082796</span>
            </li>
            <li class="flex items-center gap-3">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"
                />
              </svg>
              <span>Coyhaique, Chile</span>
            </li>
          </ul>

          <!-- mini mapa -->
          <div
            class="mt-6 rounded-xl overflow-hidden ring-1 ring-white/10 shadow-sm"
          >
            <!-- svelte-ignore a11y_missing_attribute -->
            <iframe
              class="w-full h-40 border-0"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2792.636582946514!2d-72.06736028826666!3d-45.577746316175755!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xbdf2c5e1e9c3d929%3A0xb79dd3a3375c87f6!2sF%C3%A1brica%20de%20Cocinas%20Appel!5e0!3m2!1ses!2scl!4v1754943316144!5m2!1ses!2scl"
            ></iframe>
          </div>

          <p class="mt-4 text-[11px] text-slate-400">
            Ubicación referencial de nuestra fábrica en Coyhaique.
          </p>
        </div>
      </aside>

      <!-- Formulario -->
      <form
        on:submit|preventDefault={handleSubmit}
        novalidate
        class="md:col-span-3 bg-white rounded-2xl shadow-md ring-1 ring-slate-100 p-6 md:p-8 space-y-5"
      >
        <h2 class="text-lg md:text-xl font-semibold text-slate-900">
          Envíanos un mensaje
        </h2>
        <p class="text-xs md:text-sm text-slate-500">
          Completa el formulario y te contactaremos por correo o teléfono.
        </p>

        {#if success}
          <div
            class="rounded-lg bg-green-50 text-green-900 border border-green-200 p-3 text-sm flex items-start gap-2"
          >
            <span class="mt-0.5">✅</span>
            <span>¡Gracias! Tu mensaje fue enviado correctamente.</span>
          </div>
        {/if}
        {#if serverMsg}
          <div
            class="rounded-lg bg-red-50 text-red-900 border border-red-200 p-3 text-sm"
          >
            {serverMsg}
          </div>
        {/if}

        <!-- honeypot (anti-spam) -->
        <div class="hidden">
          <label>
            No llenar este campo:
            <input
              bind:value={company}
              name="company"
              type="text"
              tabindex="-1"
              autocomplete="off"
            />
          </label>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              for="name"
              class="block text-sm font-medium mb-1 text-slate-700"
              >Nombre *</label
            >
            <input
              id="name"
              name="name"
              type="text"
              required
              bind:value={name}
              class="w-full rounded-lg border px-3 py-2 text-sm md:text-[15px]
                     focus:outline-none focus:ring-2 focus:ring-amber-500/70 focus:border-amber-500
                     border-slate-300 {errors.name ? 'border-red-500 focus:ring-red-400' : ''}"
              aria-invalid={!!errors.name}
            />
            {#if errors.name}
              <p class="mt-1 text-xs text-red-600">{errors.name}</p>
            {/if}
          </div>

          <div>
            <label
              for="email"
              class="block text-sm font-medium mb-1 text-slate-700"
              >Email *</label
            >
            <input
              id="email"
              name="email"
              type="email"
              required
              bind:value={email}
              class="w-full rounded-lg border px-3 py-2 text-sm md:text-[15px]
                     focus:outline-none focus:ring-2 focus:ring-amber-500/70 focus:border-amber-500
                     border-slate-300 {errors.email ? 'border-red-500 focus:ring-red-400' : ''}"
              aria-invalid={!!errors.email}
            />
            {#if errors.email}
              <p class="mt-1 text-xs text-red-600">{errors.email}</p>
            {/if}
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              for="phone"
              class="block text-sm font-medium mb-1 text-slate-700"
              >Teléfono</label
            >
            <input
              id="phone"
              name="phone"
              type="tel"
              bind:value={phone}
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm md:text-[15px]
                     focus:outline-none focus:ring-2 focus:ring-amber-500/70 focus:border-amber-500"
            />
          </div>

          <div>
            <label
              for="subject"
              class="block text-sm font-medium mb-1 text-slate-700"
              >Asunto</label
            >
            <input
              id="subject"
              name="subject"
              type="text"
              bind:value={subject}
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm md:text-[15px]
                     focus:outline-none focus:ring-2 focus:ring-amber-500/70 focus:border-amber-500"
            />
          </div>
        </div>

        <div>
          <label
            for="message"
            class="block text-sm font-medium mb-1 text-slate-700"
            >Mensaje *</label
          >
          <textarea
            id="message"
            name="message"
            required
            rows={6}
            bind:value={message}
            class="w-full rounded-lg border px-3 py-2 text-sm md:text-[15px]
                   focus:outline-none focus:ring-2 focus:ring-amber-500/70 focus:border-amber-500
                   border-slate-300 {errors.message ? 'border-red-500 focus:ring-red-400' : ''}"
            aria-invalid={!!errors.message}
          ></textarea>
          {#if errors.message}
            <p class="mt-1 text-xs text-red-600">{errors.message}</p>
          {/if}
        </div>

        <!-- reCAPTCHA Widget -->
        <div class="flex flex-col gap-1">
           <div 
             class="g-recaptcha" 
             data-sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
             data-callback="onCaptchaSuccess"
             data-expired-callback="onCaptchaExpired"
           ></div>
           {#if errors.recaptcha}
             <p class="text-xs text-red-600">{errors.recaptcha}</p>
           {/if}
        </div>

        <div class="flex items-center justify-between gap-4 pt-2">
          <p class="text-xs text-slate-500">* Campos obligatorios</p>
          <button
            type="submit"
            class="inline-flex items-center gap-2 rounded-full bg-amber-600 px-5 py-2.5 text-sm font-medium
                   text-white shadow-sm hover:bg-amber-700 active:bg-amber-800
                   disabled:opacity-60 disabled:cursor-not-allowed
                   transition transform active:scale-[.98]"
            disabled={sending}
          >
            {#if sending}
              <svg
                class="animate-spin"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                  opacity=".25"
                />
                <path
                  d="M22 12a10 10 0 0 1-10 10"
                  stroke="currentColor"
                  stroke-width="4"
                />
              </svg>
              Enviando…
            {:else}
              Enviar mensaje
            {/if}
          </button>
        </div>
      </form>
    </div>

    <!-- Banner de Maestranza Appel -->
    <div class="mt-10 md:mt-14">
      <div class="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-200/50 group hover:shadow-3xl transition-all duration-500">
        <!-- Efecto de brillo animado -->
        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        
        <!-- Banner con efecto parallax suave -->
        <div class="relative overflow-hidden bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 p-1">
          <img 
            src="/images/banner-appel.jpg" 
            alt="Maestranza Appel - Artículos de Menaje y Ferretería" 
            class="w-full h-auto transform group-hover:scale-[1.02] transition-transform duration-700 ease-out"
            loading="lazy"
          />
        </div>

        <!-- Overlay decorativo con gradiente sutil -->
        <div class="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent pointer-events-none"></div>
        
        <!-- Badge flotante -->
        <div class="absolute top-4 right-4 bg-amber-500/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg ring-1 ring-amber-400/60 transform group-hover:scale-110 transition-transform duration-300">
          <span class="text-xs font-bold text-slate-900 tracking-wide">✨ Productos de Calidad</span>
        </div>
      </div>

      <!-- Texto descriptivo elegante -->
      <div class="mt-6 text-center">
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 ring-1 ring-amber-200/50 shadow-sm">
          <span class="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
          <p class="text-sm font-medium text-slate-700">
            Especialistas en cocinas, calefactores y hojalatería
          </p>
          <span class="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
        </div>
      </div>
    </div>
  </section>
  <ChatBot />
</main>
