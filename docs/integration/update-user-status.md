# Guía de Integración: Actualización de Estado de Usuario

Este documento detalla cómo integrar el endpoint de habilitación/inhabilitación de usuarios desde el frontend.

## Detalles del Endpoint

- **URL:** `PATCH /api/v1/management/users/:id/status`
- **Método:** `PATCH`
- **Autenticación:** Requerida (Bearer Token)
- **Roles permitidos:** `admin`, `moderator`

## Contrato de Petición (Payload)

El cuerpo de la petición debe ser un objeto JSON con la propiedad `isActive`.

```json
{
  "isActive": boolean
}
```

## Ejemplo de Integración (JavaScript/React)

A continuación se muestra un ejemplo de cómo implementar la función de cambio de estado:

```javascript
const toggleUserStatus = async (userId, newStatus, token) => {
  try {
    const response = await fetch(`${process.env.API_URL}/api/v1/management/users/${userId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ isActive: newStatus })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al actualizar el estado');
    }

    const data = await response.json();
    return data; // { success: true, isActive: boolean }
  } catch (error) {
    console.error('Error en toggleUserStatus:', error);
    throw error;
  }
};
```

## Implementación con un Switch Component

Al usar un componente de tipo Switch, se recomienda aplicar un patrón de **UI Optimista** o manejar el estado de carga (`loading`) para evitar clics múltiples mientras la petición está en curso.

1.  El usuario acciona el Switch.
2.  Se bloquea el componente (loading: true).
3.  Se envía la petición al backend.
4.  Si la respuesta es exitosa, se actualiza el estado local y se libera el componente.
5.  Si falla, se revierte la posición del Switch y se muestra una notificación de error (Toast/Alert).

## Respuestas Comunes

- **200 OK:** La actualización fue exitosa.
- **401 Unauthorized:** El token no es válido o ha expirado.
- **403 Forbidden:** El usuario no tiene los permisos necesarios (Admin/Moderator).
- **404 Not Found:** El ID del usuario proporcionado no existe en el sistema.
- **400 Bad Request:** El cuerpo de la petición no tiene el formato correcto (ej: `isActive` no es booleano).
