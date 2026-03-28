# 🎨 Guía de Integración Frontend: Videos Loop Home

Esta guía detalla cómo consumir los endpoints del nuevo CMS de videos para el loop del home en Panters.

## Base URL y Autenticación
Todos los endpoints están bajo el prefijo `/api/v1/panters/home-videos`. Se asume el uso de las cookies de sesión de `Better Auth` para los endpoints protegidos (si aplica).

---

## 🚀 Endpoints Disponibles

### 1. Riel de Videos (Loop)
Este endpoint está optimizado para el **Hero Background** del home. Entrega un array plano de URLs para iterar directamente.

- **Método**: `GET`
- **URL**: `/api/v1/panters/home-videos/loop`
- **Respuesta**: `Array<string>`
- **Ejemplo**: `["https://s3.com/v1.webm", "https://s3.com/v2.webm"]`

```typescript
// Hook de React sugerido
export const useHomeLoop = () => {
  const [urls, setUrls] = useState<string[]>([]);
  
  useEffect(() => {
    fetch('/api/v1/panters/home-videos/loop')
      .then(r => r.json())
      .then(setUrls);
  }, []);

  return urls;
};
```

### 2. Listado para el CMS (Manager)
Devuelve los objetos completos con metadatos para la tabla de administración.

- **Método**: `GET`
- **URL**: `/api/v1/panters/home-videos/manager`
- **Respuesta**: `Array<HomeVideo>`
- **Campos clave**:
    - `id`: UUID (necesario para eliminar).
    - `originalName`: Nombre del archivo original subido.
    - `createdAt`: Fecha de carga.
    - `url`: Link directo al video.

### 3. Carga de Video (Upload)
Solo se permite el formato **WebM** y un tamaño máximo de **100 MB**.

- **Método**: `POST`
- **URL**: `/api/v1/panters/home-videos/upload`
- **Content-Type**: `multipart/form-data`
- **Body**: `{ "video": File }`

```typescript
const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file || file.size > 100 * 1024 * 1024) {
      alert("El archivo excede el límite de 100MB");
      return;
  }

  const formData = new FormData();
  formData.append('video', file);

  const response = await fetch('/api/v1/panters/home-videos/upload', {
    method: 'POST',
    body: formData
  });

  if (response.status === 413) {
      alert("Payload Too Large: El archivo es demasiado pesado.");
  }
};
```

### 4. Eliminación (Delete)
Elimina el registro en Postgres y el archivo físico en S3.

- **Método**: `DELETE`
- **URL**: `/api/v1/panters/home-videos/:id`
- **Respuesta**: `{ "success": true, "message": "..." }`

---

## 🛠️ Estados de Error Comunes

| Código | Mensaje Sugerido | Causa |
| :--- | :--- | :--- |
| **415** | "Formato no soportado: usa .webm" | Se envió un archivo MP4, MOV, etc. |
| **413** | "El video excede los 100MB" | Payload Too Large: El archivo es muy pesado. |
| **400** | "No se recibió ningún archivo" | El campo `video` en el FormData está vacío. |
| **404** | "Video no encontrado" | El ID proporcionado en el DELETE no existe. |
| **500** | "Error del servidor" | Problema interno (S3 inalcanzable, fallo en DB). |

---

## 💡 Recomendaciones de UI

1.  **Reproductor en Bucle**: Usa el atributo `muted` y `playsInline` para asegurar el auto-play en móviles y navegadores modernos.
2.  **Precarga**: Se recomienda usar `preload="auto"` en la etiqueta video del home para evitar saltos negros entre transiciones.
3.  **Gestor**: En la tabla del CMS, muestra un pequeño "Badge" con el formato (siempre WebM) y una columna de acciones con el botón de "Eliminar" (trash icon).
