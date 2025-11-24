// src/app.d.ts
// Asegúrate que este archivo exista
declare global {
  namespace App {
    interface Locals {
      token: string | null;
    }
  }
}

// 👇 agrega ESTO debajo de lo anterior
declare module 'svelte-apexcharts' {
  import type { SvelteComponentTyped } from 'svelte';

  export default class ApexCharts extends SvelteComponentTyped<{
    options?: any;
    series?: any;
    type?: string;
    height?: number | string;
    width?: number | string;
  }> {}
}
export {};
