# Guía de Integración: Registro y Verificación de Clientes (Auth v1)

Esta guía detalla cómo integrar el flujo de registro y verificación desarrollado en el Backend con el Frontend de Panters, respetando la arquitectura de **Proxy Inverso**.

---

## 1. Configuración de Red (Proxy Inverso)

Para cumplir con la directriz de seguridad de Panters, el frontend **no debe exponer la URL directa del backend**. Se deben configurar `rewrites` en `next.config.js`:

```typescript
// next.config.js (Frontend)
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.BACKEND_URL}/api/v1/:path*`, 
      },
    ];
  },
};
```

---

## 2. Flujo de Registro de Cliente

El registro utiliza el endpoint personalizado que orquestra Better Auth y la creación de perfiles/wallets.

- **Endpoint:** `POST /api/v1/auth/register`
- **Cuerpo (JSON):**
  ```json
  {
    "email": "usuario@ejemplo.com",
    "password": "passwordSeguro123",
    "name": "Nombre Completo",
    "username": "usuario123",
    "age": 25,
    "birthDate": "2000-01-01",
    "gender": "masculino"
  }
  ```

### Implementación Recomendada (TanStack Query)
```typescript
const useRegisterClient = () => {
  return useMutation({
    mutationFn: async (data: RegisterClientRequest) => {
      const resp = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      // ... manejo de respuesta
    }
  });
};
```

---

## 3. Flujo de Verificación por Correo

### A. El Enlace de Verificación
El backend enviará un correo con un enlace similar a este:
`https://panters.com/verify-email?token=...`

### B. Página de Destino (`/verify-email`)
En el frontend de Next.js, crea la página para capturar el token y llamar al backend.

- **Endpoint:** `POST /api/v1/auth/verify`
- **Cuerpo (JSON):** `{ "token": "..." }`

```typescript
// app/(auth)/verify-email/page.tsx
'use client';

// Lógica conceptual de captura de token y validación
const { mutate, isPending } = useMutation({
  mutationFn: (token) => fetch('/api/v1/auth/verify', { ... })
});
```

---

## 4. Detalles Técnicos Críticos

1. **Persistencia Automática:** Al llamar a `/register`, el backend ya habrá creado automáticamente el **Perfil (antigravity_profiles)** y la **Billetera (antigravity_wallets)** del usuario mediante hooks de base de datos.
2. **Estado de Sesión:** Tras la verificación exitosa, el usuario **no** tiene sesión iniciada (está verificado pero no logueado). Se debe redirigir al `/login`.
3. **Manejo de Errores:**
   - `400 Bad Request`: Generalmente usuario ya existe o token expirado.
   - `500 Internal Error`: Fallo en la BD o lógica interna.

## 5. Sincronización Global
Recuerda que para el manejo de la sesión persistente, el frontend debe usar el `authClient` de Better Auth apuntando a `/api/auth/`.

---
**Arquitecto de Software - Panters Backend**
