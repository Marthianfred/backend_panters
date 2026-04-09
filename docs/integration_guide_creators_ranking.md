# Guía de Integración: Ranking de Creadoras (Rating🐾)

Esta guía detalla cómo consumir los endpoints de popularidad y ranking de las creadoras (chicas) desde el Frontend de Panters.

---

## 1. Concepto de Rating en Panters

En la fase actual del proyecto, el **Rating** de una creadora es un indicador de popularidad calculado de forma exacta basándose en el **total de reacciones sociales** (likes/panteras) acumuladas en todos sus posts de contenido.

---

## 2. Endpoint: Top Creadoras (Ranking)

Este endpoint devuelve el listado de las creadoras con mayor interacción social, ordenadas de forma descendente.

- **URL:** `GET /api/v1/creators/top-rated`
- **Query Params:**
  - `limit` (Opcional, default: 10): Cantidad de creadoras a retornar.

### Estructura de Respuesta (JSON)
```json
[
  {
    "userId": "uuid-v4-string",
    "username": "handle_usuario",
    "fullName": "Nombre Apellido",
    "avatarUrl": "https://s3.amazonaws.com/bucket/avatar.jpg",
    "totalReactions": 1250,
    "rating": 1250
  }
]
```

### Campos Detallados:
- `totalReactions`: Suma bruta de todas las reacciones en sus posts.
- `rating`: Valor numérico de popularidad (actualmente idéntico a `totalReactions` para máxima precisión). 

---

## 3. Implementación Sugerida en Frontend

### Definición del Tipo (TypeScript)
```typescript
interface CreatorRanking {
  userId: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  totalReactions: number;
  rating: number;
}
```

### Uso con TanStack Query (React Query)
```typescript
const useTopCreators = (limit: number = 5) => {
  return useQuery<CreatorRanking[]>({
    queryKey: ['creators', 'top-rated', limit],
    queryFn: async () => {
      const resp = await fetch(`/api/v1/creators/top-rated?limit=${limit}`);
      if (!resp.ok) throw new Error('Error al cargar el ranking');
      return resp.json();
    }
  });
};
```

---

## 4. Consideraciones de UI/UX

1.  **Manejo de Avatares:** El campo `avatarUrl` es opcional. El frontend debe proveer un *placeholder* o usar el sistema de iniciales si la creadora no tiene imagen.
2.  **Display de Popularidad:** Se recomienda mostrar el valor de `totalReactions` con un ícono de fuego (🔥) o una pantera para indicar el nivel de influencia.
3.  **Proxy Inverso:** Al igual que con el resto del sistema, este endpoint debe consumirse a través del proxy de Next.js (`/api/v1/...`) para evitar bloqueos de CORS y ocultar la infraestructura.

---
**Arquitecto de Software - Panters Backend**
