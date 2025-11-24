// @ts-nocheck
// src/routes/productos/[slug]/+page.ts
import type { PageLoad } from './$types';
import { getProduct } from '$lib/api';
import { error } from '@sveltejs/kit';

export const load = async ({ params }: Parameters<PageLoad>[0]) => {
    try {
        const product = await getProduct(params.slug);
        return { product };
    } catch (e) {
        throw error(404, 'Producto no encontrado');
    }
};
