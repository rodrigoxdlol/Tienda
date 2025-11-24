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
	() => import('./nodes/28'),
	() => import('./nodes/29'),
	() => import('./nodes/30'),
	() => import('./nodes/31'),
	() => import('./nodes/32'),
	() => import('./nodes/33'),
	() => import('./nodes/34'),
	() => import('./nodes/35'),
	() => import('./nodes/36')
];

export const server_loads = [0];

export const dictionary = {
		"/": [3],
		"/admin": [4,[2]],
		"/admin/estadisticas": [5,[2]],
		"/admin/gallery-media": [6,[2]],
		"/admin/home-media": [7,[2]],
		"/admin/noticias": [8,[2]],
		"/admin/orders": [9,[2]],
		"/admin/products": [10,[2]],
		"/admin/reclamos": [11,[2]],
		"/admin/users": [12,[2]],
		"/admin/[id]": [13,[2]],
		"/checkout": [14],
		"/checkout/exito": [15],
		"/checkout/failure": [16],
		"/checkout/pending": [17],
		"/checkout/success": [18],
		"/contacto": [~19],
		"/galeria": [20],
		"/gracias": [21],
		"/hacemos": [22],
		"/login": [~23],
		"/logout": [24],
		"/mi-cuenta/cambiar-contraseña": [25],
		"/mi-cuenta/pedidos": [26],
		"/mi-cuenta/perfil": [27],
		"/mi-cuenta/reclamos": [28],
		"/noticias": [29],
		"/privacidad": [30],
		"/productos": [31],
		"/productos/[slug]": [32],
		"/recuperar-clave": [33],
		"/recuperar-clave/nueva": [34],
		"/registro": [35],
		"/webpay/final": [36]
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