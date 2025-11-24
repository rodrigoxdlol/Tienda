<script lang="ts">
  import { onMount } from 'svelte';

  type Message = {
    from: 'user' | 'bot';
    text: string;
  };

  let open = false;

  let messages: Message[] = [
    {
      from: 'bot',
      text: '¡Hola! Soy el asistente de la tienda de cocinas 🧑‍🍳. ¿En qué te puedo ayudar?'
    }
  ];

  let inputText = '';
  let sending = false;

  // URL del backend Django
  const API_BASE = 'http://127.0.0.1:8000';

  // Preguntas predefinidas que el usuario puede apretar
  const suggestedQuestions = [
    '¿Cuál es el horario de atención?',
    '¿Instalan las cocinas?',
    '¿Qué métodos de pago aceptan?',
    '¿Tienen garantía?',
    '¿Tienen tienda física?',
    '¿Cómo puedo contactar con ustedes?'
  ];

  async function sendMessage(customText?: string) {
    const text = (customText ?? inputText).trim();
    if (!text || sending) return;

    messages = [...messages, { from: 'user', text }];
    if (!customText) inputText = '';
    sending = true;

    try {
      const res = await fetch(`${API_BASE}/api/chatbot/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
        credentials: 'include'
      });

      // 🔹 Manejo especial para 429 (rate limit)
      if (!res.ok) {
        let data: any = null;
        try {
          data = await res.json();
        } catch {
          // ignore json parse error
        }

        if (res.status === 429) {
          const msg =
            data?.detail ||
            'Has enviado muchas preguntas seguidas 🤯. Espera un momento y vuelve a intentarlo.';
          messages = [...messages, { from: 'bot', text: msg }];
          return;
        }

        const generic =
          data?.detail || 'Lo siento, hubo un problema al responder (error en la API).';
        throw new Error(generic);
      }

      const data = await res.json();
      const answer = data.answer ?? 'Lo siento, hubo un problema al responder.';

      messages = [...messages, { from: 'bot', text: answer }];
      scrollToBottom();
    } catch (err) {
      console.error(err);
      messages = [
        ...messages,
        {
          from: 'bot',
          text:
            err instanceof Error
              ? err.message
              : 'Ups, hubo un error al conectar con el servidor 😢. Intenta de nuevo en un momento.'
        }
      ];
    } finally {
      sending = false;
      scrollToBottom();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  function askSuggested(q: string) {
    // Manda una pregunta predefinida
    void sendMessage(q);
  }

  let messagesContainer: HTMLDivElement;

  function scrollToBottom() {
    if (messagesContainer) {
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 0);
    }
  }

  $: if (open) scrollToBottom();
</script>

<!-- Botón flotante -->
<button
  class="fixed bottom-4 right-4 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-amber-500 shadow-lg hover:bg-amber-400 transition active:scale-95 text-white"
  on:click={() => (open = !open)}
  aria-label="Abrir chat de ayuda"
>
  {#if open}
    ✕
  {:else}
    💬
  {/if}
</button>

<!-- Ventana de chat -->
{#if open}
  <div
    class="fixed bottom-20 right-4 z-40 w-80 max-h-[70vh] flex flex-col bg-white shadow-2xl rounded-2xl border border-amber-100 overflow-hidden text-sm"
  >
    <!-- Header -->
    <div class="bg-amber-500 text-white px-3 py-2 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-lg">🧑‍🍳</span>
        <div class="flex flex-col leading-tight">
          <span class="font-semibold text-sm">Asistente Cocinas</span>
          <span class="text-xs opacity-90">Responde dudas rápidas</span>
        </div>
      </div>
      <span class="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
        Bot gratuito
      </span>
    </div>

    <!-- Mensajes -->
    <div
      class="flex-1 overflow-y-auto p-3 space-y-2 bg-gradient-to-b from-gray-50 to-white"
      bind:this={messagesContainer}
    >
      {#each messages as msg}
        <div class="flex {msg.from === 'user' ? 'justify-end' : 'justify-start'}">
          <div
            class={`px-3 py-2 rounded-2xl max-w-[80%] whitespace-pre-wrap text-xs sm:text-sm ${
              msg.from === 'user'
                ? 'bg-amber-500 text-white rounded-br-sm'
                : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
            }`}
          >
            {msg.text}
          </div>
        </div>
      {/each}
    </div>

    <!-- Preguntas rápidas -->
    <div class="px-2 pb-1 bg-white border-t border-gray-100">
      <div class="flex flex-wrap gap-1">
        {#each suggestedQuestions as q}
          <button
            class="text-[10px] px-2 py-1 rounded-full border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 transition"
            on:click={() => askSuggested(q)}
          >
            {q}
          </button>
        {/each}
      </div>
    </div>

    <!-- Input -->
    <div class="border-t border-gray-200 bg-white p-2 flex items-center gap-2">
      <textarea
        class="flex-1 resize-none border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
        rows="1"
        bind:value={inputText}
        on:keydown={handleKeydown}
        placeholder="Escribe tu pregunta..."
      ></textarea>
      <button
        class="px-3 py-1 rounded-lg bg-amber-500 text-white text-xs font-semibold disabled:opacity-50"
        on:click={() => sendMessage()}
        disabled={sending || !inputText.trim()}
      >
        {sending ? '...' : 'Enviar'}
      </button>
    </div>
  </div>
{/if}
