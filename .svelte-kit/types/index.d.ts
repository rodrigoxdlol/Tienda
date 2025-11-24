type DynamicRoutes = {
	"/admin/[id]": { id: string };
	"/productos/[slug]": { slug: string }
};

type Layouts = {
	"/": { id?: string; slug?: string };
	"/admin": { id?: string };
	"/admin/estadisticas": undefined;
	"/admin/gallery-media": undefined;
	"/admin/home-media": undefined;
	"/admin/noticias": undefined;
	"/admin/orders": undefined;
	"/admin/products": undefined;
	"/admin/reclamos": undefined;
	"/admin/users": undefined;
	"/admin/[id]": { id: string };
	"/checkout": undefined;
	"/checkout/exito": undefined;
	"/checkout/failure": undefined;
	"/checkout/pending": undefined;
	"/checkout/success": undefined;
	"/contacto": undefined;
	"/galeria": undefined;
	"/gracias": undefined;
	"/hacemos": undefined;
	"/login": undefined;
	"/logout": undefined;
	"/mi-cuenta": undefined;
	"/mi-cuenta/cambiar-contraseña": undefined;
	"/mi-cuenta/pedidos": undefined;
	"/mi-cuenta/perfil": undefined;
	"/mi-cuenta/reclamos": undefined;
	"/noticias": undefined;
	"/privacidad": undefined;
	"/productos": { slug?: string };
	"/productos/[slug]": { slug: string };
	"/recuperar-clave": undefined;
	"/recuperar-clave/nueva": undefined;
	"/registro": undefined;
	"/webpay": undefined;
	"/webpay/final": undefined
};

export type RouteId = "/" | "/admin" | "/admin/estadisticas" | "/admin/gallery-media" | "/admin/home-media" | "/admin/noticias" | "/admin/orders" | "/admin/products" | "/admin/reclamos" | "/admin/users" | "/admin/[id]" | "/checkout" | "/checkout/exito" | "/checkout/failure" | "/checkout/pending" | "/checkout/success" | "/contacto" | "/galeria" | "/gracias" | "/hacemos" | "/login" | "/logout" | "/mi-cuenta" | "/mi-cuenta/cambiar-contraseña" | "/mi-cuenta/pedidos" | "/mi-cuenta/perfil" | "/mi-cuenta/reclamos" | "/noticias" | "/privacidad" | "/productos" | "/productos/[slug]" | "/recuperar-clave" | "/recuperar-clave/nueva" | "/registro" | "/webpay" | "/webpay/final";

export type RouteParams<T extends RouteId> = T extends keyof DynamicRoutes ? DynamicRoutes[T] : Record<string, never>;

export type LayoutParams<T extends RouteId> = Layouts[T] | Record<string, never>;

export type Pathname = "/" | "/admin" | "/admin/estadisticas" | "/admin/gallery-media" | "/admin/home-media" | "/admin/noticias" | "/admin/orders" | "/admin/products" | "/admin/reclamos" | "/admin/users" | `/admin/${string}` & {} | "/checkout" | "/checkout/exito" | "/checkout/failure" | "/checkout/pending" | "/checkout/success" | "/contacto" | "/galeria" | "/gracias" | "/hacemos" | "/login" | "/logout" | "/mi-cuenta" | "/mi-cuenta/cambiar-contraseña" | "/mi-cuenta/pedidos" | "/mi-cuenta/perfil" | "/mi-cuenta/reclamos" | "/noticias" | "/privacidad" | "/productos" | `/productos/${string}` & {} | "/recuperar-clave" | "/recuperar-clave/nueva" | "/registro" | "/webpay" | "/webpay/final";

export type ResolvedPathname = `${"" | `/${string}`}${Pathname}`;

export type Asset = "/images/32147-vector-1-240w (1).png" | "/images/32171-vector-2-240w (1).png" | "/images/32176-vector-3-240w.png" | "/images/32187-vector-4-240w.png" | "/images/Cocina.png" | "/images/hero.webp" | "/images/Hojalateria.png" | "/images/LogoCocinas.png" | "/images/QueHacemos.webp" | "/images/Tienda.png" | "/robots.txt";