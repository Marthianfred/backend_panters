# Guía de Integración Frontend: Reportes Financieros

Esta guía detalla los patrones y componentes recomendados para integrar los endpoints de reportes financieros (`api/v1/reports/platform-revenue` y `api/v1/reports/platform-summary`) en el frontend de Panters, utilizando el stack tecnológico oficial: **Next.js, TanStack Query, Zustand y NextUI**.

## 1. Consumo de Datos (TanStack Query)

Se debe seguir el patrón de hooks personalizados para desacoplar la lógica de fetching de los componentes UI.

### Estructura sugerida:
- **Archivos**: 
    - `src/hooks/reports/usePlatformRevenue.ts`
    - `src/hooks/reports/usePlatformSummary.ts`
- **Lógica**: 
    - Definir una interfaz para los filtros (`startDate`, `endDate`).
    - Utilizar `queryKey` dinámico que incluya los filtros: `['platform-revenue', filters]` o `['platform-summary', filters]`.
    - Implementar `keepPreviousData: true` para evitar parpadeos durante el cambio de fechas.

## 2. Interfaz de Usuario (NextUI)

Para una visualización premium y coherente con el dashboard de Panters, se recomiendan los siguientes componentes:

### Cards de Métricas (Platform Revenue & Summary)
Utilizar el componente `Card` de NextUI con:
- `CardHeader`: Título de la métrica (ej. "Ingresos Brutos", "Total Suscriptores").
- `CardBody`: Valor principal en formato destacado (PTC o Cantidad) y valor secundario (USD o % de crecimiento) en un tono más tenue.
- `Skeleton`: Implementar estados de carga envolviendo el contenido del `CardBody` mientras `isLoading` es true.

### Tabla de Ranking de Modelos (Platform Summary)
Para mostrar el `topModelsByRevenue`, se recomienda:
- **Componente**: `Table` de NextUI.
- **Columnas**: Avatar/Nombre, PTC Ganados, Equivalente en USD.
- **Interacción**: Permitir navegar al perfil del modelo al hacer clic en la fila.

### Layout del Dashboard
- Usar un `Grid` responsivo para las métricas principales (3 columnas en desktop, 1 en mobile).
- Implementar una sección superior de filtros utilizando `Card` para agrupar los selectores de fecha.

## 3. Filtros y Estado (Zustand)

Si el rango de fechas debe persistir entre navegaciones o ser compartido con otros reportes futuros:
- **Store**: Crear un `useReportStore` en Zustand para manejar `dateRange`.
- **Componente**: Usar `DatePicker` o `DateRangePicker` de NextUI para actualizar el estado global.

## 4. Visualización de Moneda (Formateo)

Es crítico mantener la consistencia visual entre PTC y USD:
- **PTC**: Utilizar un icono personalizado de Panter Coin junto al valor.
- **USD**: Formatear siempre con `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })`.

## 5. Ejemplo de Flujo de Trabajo

1. El usuario selecciona un rango de fechas en el componente de filtros.
2. El estado de Zustand se actualiza.
3. TanStack Query detecta el cambio en el `queryKey` y dispara la petición al backend.
4. Los componentes `Card` muestran el `Skeleton` mientras se obtienen los nuevos datos.
5. Los datos se renderizan con animaciones suaves (`framer-motion`, integrado en NextUI).
