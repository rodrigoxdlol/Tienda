// src/lib/stores/contactStats.store.ts
import { writable } from 'svelte/store';
import type { ContactStats, AdminContactMessage } from '$lib/api';
import { adminContactStats } from '$lib/api';

export const contactStatsStore = writable<ContactStats | null>(null);

/**
 * Carga las stats desde el backend (para usar al entrar al sitio/admin).
 */
export async function refreshContactStats() {
  try {
    const data = await adminContactStats();
    contactStatsStore.set(data);
  } catch (e) {
    console.error('Error cargando stats de reclamos:', e);
  }
}

/**
 * Reconstruye las stats a partir de la lista de mensajes que ya tiene
 * /admin/reclamos (se usa después de guardar respuesta, etc.).
 */
export function rebuildContactStatsFromMessages(messages: AdminContactMessage[]) {
  const stats: ContactStats = {
    total: messages.length,
    pending: messages.filter((m) => m.status === 'pending').length,
    answered: messages.filter((m) => m.status === 'answered').length,
    closed: messages.filter((m) => m.status === 'closed').length
  };
  contactStatsStore.set(stats);
}

