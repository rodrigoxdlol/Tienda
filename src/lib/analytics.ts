import { apiPost } from '$lib/api';

const STORAGE_KEY = 'ca_visit_registered_v1';

export async function trackVisitOncePerDay() {
  if (typeof window === 'undefined') return;

  const today = new Date().toISOString().slice(0, 10);
  const last = window.localStorage.getItem(STORAGE_KEY);

  if (last === today) return;

  try {
    await apiPost('/api/site/track-visit/', {});
    window.localStorage.setItem(STORAGE_KEY, today);
  } catch (err) {
    console.error('trackVisitOncePerDay error:', err);
  }
}
