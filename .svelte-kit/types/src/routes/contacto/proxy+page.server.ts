// @ts-nocheck
// src/routes/contacto/+page.server.ts
import type { Actions } from './$types';

const API = 'http://127.0.0.1:8000'; // o donde tengas el backend

export const actions = {
  default: async ({ request, fetch }: import('./$types').RequestEvent) => {
    const data = await request.formData();

    const values = {
      name: (data.get('name') ?? '').toString().trim(),
      email: (data.get('email') ?? '').toString().trim(),
      phone: (data.get('phone') ?? '').toString().trim(),
      subject: (data.get('subject') ?? '').toString().trim(),
      message: (data.get('message') ?? '').toString().trim(),
      company: (data.get('company') ?? '').toString().trim(), // honeypot
    };

    if (values.company) {
      return { success: true };
    }

    const errors: Record<string, string> = {};
    if (!values.name) errors.name = 'Ingresa tu nombre';
    if (!values.email) errors.email = 'Ingresa tu correo';
    if (!values.message) errors.message = 'Ingresa tu mensaje';

    if (Object.keys(errors).length) {
      return { success: false, errors, values };
    }

    try {
      const res = await fetch(`${API}/api/shop/site/contact/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          phone: values.phone,
          subject: values.subject,
          message: values.message
        }),
      });

      if (!res.ok) {
        return {
          success: false,
          server: 'Hubo un problema al enviar tu mensaje. Inténtalo de nuevo.',
          values
        };
      }

      return { success: true };
    } catch (e) {
      return {
        success: false,
        server: 'No se pudo contactar con el servidor.',
        values
      };
    }
  }
};

;null as any as Actions;