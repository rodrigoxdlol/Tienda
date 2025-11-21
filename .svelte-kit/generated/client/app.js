export { matchers } from './matchers.js';

export const nodes = [
	() => import('./nodes/0'),
	() => import('./nodes/1'),
	() => import('./nodes/2'),
	() => import('./nodes/3'),
	() => import('./nodes/4'),
	() => import('./nodes/5'),
	() => import('./nodes/6'),
	() => import('./nodes/7'),
	() => import('./nodes/8'),
	() => import('./nodes/9'),
	() => import('./nodes/10'),
	() => import('./nodes/11'),
	() => import('./nodes/12'),
	() => import('./nodes/13'),
	() => import('./nodes/14'),
	() => import('./nodes/15'),
	() => import('./nodes/16'),
	() => import('./nodes/17'),
	() => import('./nodes/18'),
	() => import('./nodes/19'),
	() => import('./nodes/20'),
	() => import('./nodes/21'),
	() => import('./nodes/22'),
	() => import('./nodes/23'),
	() => import('./nodes/24'),
	() => import('./nodes/25'),
	() => import('./nodes/26'),
	() => import('./nodes/27'),
	() => import('./nodes/28')
];

export const server_loads = [0];

export const dictionary = {
		"/": [3],
		"/admin": [4,[2]],
		"/admin/estadisticas": [5,[2]],
		"/admin/gallery-media": [6,[2]],
		"/admin/home-media": [7,[2]],
		"/admin/orders": [8,[2]],
		"/admin/products": [9,[2]],
		"/admin/reclamos": [10,[2]],
		"/admin/users": [11,[2]],
		"/admin/[id]": [12,[2]],
		"/checkout": [13],
		"/checkout/exito": [14],
		"/contacto": [~15],
		"/galeria": [16],
		"/gracias": [17],
		"/hacemos": [18],
		"/login": [~19],
		"/logout": [20],
		"/mi-cuenta/cambiar-contraseña": [21],
		"/mi-cuenta/pedidos": [22],
		"/mi-cuenta/perfil": [23],
		"/mi-cuenta/reclamos": [24],
		"/productos": [25],
		"/recuperar-clave": [26],
		"/recuperar-clave/nueva": [27],
		"/registro": [28]
	};

export const hooks = {
	handleError: (({ error }) => { console.error(error) }),
	
	reroute: (() => {}),
	transport: {}
};

export const decoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.decode]));

export const hash = false;

export const decode = (type, value) => decoders[type](value);

export { default as root } from '../root.js';