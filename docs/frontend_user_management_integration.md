# Guía de Implementación Frontend: Gestión de Usuarios (Backoffice)

Esta guía detalla lo necesario para integrar los nuevos endpoints de gestión de usuarios en el frontend de Panters, respetando los estándares de **TanStack Query**, **Better Auth** y el **Proxy Inverso de Next.js**.

---

## 1. Definiciones de Tipos (TypeScript)

Ubicar en `src/types/management.types.ts`:

```typescript
export enum UserRoleFlag {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  MODEL = 'model',
  CREATOR = 'creator',
  SUBSCRIBER = 'subscriber',
  PANTER = 'panter'
}

export type ModerationAction = 'archived' | 'blocked';

export interface UserManagementDetails {
  id: string;
  email: string;
  name: string;
  role: UserRoleFlag;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  profile: {
    fullName: string | null;
    avatarUrl: string | null;
    bio: string | null;
  } | null;
  wallet: {
    balance: number;
  } | null;
  creatorStats?: {
    totalEarned: number;
    netBalance: number;
    contentCount: number;
  };
}

export interface AdminCreateUserRequest {
  email: string;
  password: string; // Contraseña temporal
  name: string;
  role: UserRoleFlag;
}
```

---

## 2. Capa de Servicios (API)

Ubicar en `src/services/api/management.service.ts`. 
*Nota: Se usan rutas relativas para pasar por el proxy de `next.config.ts`.*

```typescript
const BASE_URL = '/api/v1/management';

export const managementService = {
  // Listar usuarios paginados y con búsqueda
  listUsers: async (page = 1, limit = 20, search?: string) => {
    const query = new URLSearchParams({ 
      page: page.toString(), 
      limit: limit.toString(),
      ...(search && { search })
    });
    const res = await fetch(`${BASE_URL}/users?${query}`);
    if (!res.ok) throw new Error('Error al listar usuarios');
    return res.json();
  },

  // Crear nuevo usuario (con password temporal)
  createUser: async (data: AdminCreateUserRequest) => {
    const res = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al crear usuario');
    return res.json();
  },

  // Obtener detalles completos
  getUserDetails: async (id: string): Promise<UserManagementDetails> => {
    const res = await fetch(`${BASE_URL}/users/${id}`);
    if (!res.ok) throw new Error('Usuario no encontrado');
    return res.json();
  },

  // Desactivar usuario
  deactivateUser: async (id: string) => {
    const res = await fetch(`${BASE_URL}/users/${id}/deactivate`, {
      method: 'PATCH',
    });
    if (!res.ok) throw new Error('Error al desactivar usuario');
    return res.json();
  },

  // Cambiar rol
  changeRole: async (id: string, role: UserRoleFlag) => {
    const res = await fetch(`${BASE_URL}/users/${id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) throw new Error('Error al cambiar rol');
    return res.json();
  },

  // Moderar contenido
  moderateContent: async (contentId: string, action: ModerationAction) => {
    const res = await fetch(`${BASE_URL}/content/${contentId}/moderate`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) throw new Error('Error en la moderación');
    return res.json();
  }
};
```

---

## 3. Hooks de TanStack Query

Ubicar en `src/hooks/queries/useManagement.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { managementService } from '@/services/api/management.service';

export const useUserDetails = (userId: string) => {
  return useQuery({
    queryKey: ['user-details', userId],
    queryFn: () => managementService.getUserDetails(userId),
    enabled: !!userId,
  });
};

export const useManagementMutations = () => {
  const queryClient = useQueryClient();

  // Mutación para crear
  const createUser = useMutation({
    mutationFn: managementService.createUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users-list'] }),
  });

  // Mutación para desactivar
  const deactivateUser = useMutation({
    mutationFn: (id: string) => managementService.deactivateUser(id),
    onSuccess: (_, id) => queryClient.invalidateQueries({ queryKey: ['user-details', id] }),
  });

  return { createUser, deactivateUser };
};
```

---

## 4. Lógica de Flujo: `mustChangePassword`

Cuando un Administrador crea un usuario:
1. El backend devuelve `mustChangePassword: true`.
2. El usuario recibe sus credenciales temporales.
3. **En el Inicio de Sesión**: 
   - El cliente de `better-auth` realizará el login normalmente.
   - El frontend debe verificar el campo `must_change_password` del perfil (sincronizado vía `useProfile` en Zustand).
   - Si es `true`, debe redirigir inmediatamente a `/auth/reset-password-forced` y bloquear el acceso al dashboard hasta que se complete el cambio.

---

## 5. Control de Acceso (Protección de Rutas)

Dado que estos endpoints están protegidos por `RolesGuard('admin', 'moderator')` en el backend, el frontend debe asegurar que solo estos roles vean la sección de gestión:

```typescript
// En el componente de navegación o layout de administración
const { user } = useProfile(); // Hook que consume Zustand

if (user?.role !== 'admin' && user?.role !== 'moderator') {
  return <RedirectToForbidden />;
}
```
