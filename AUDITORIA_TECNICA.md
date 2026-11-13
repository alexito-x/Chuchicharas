# Auditoría técnica — Chuchicharas

## Alcance de la revisión

Se revisaron el frontend React/Vite, el backend Express, las rutas y validaciones, la configuración de ejecución, los scripts, el esquema SQL, la migración de imágenes y los recursos estáticos.

## Correcciones aplicadas

- Se corrigió la construcción de la lista CORS para evitar arrays anidados y se limita el acceso a los orígenes configurados.
- El servidor ahora puede importarse en pruebas sin abrir un puerto automáticamente; el arranque ocurre al ejecutar `src/server.js` directamente.
- Se centralizó la configuración MySQL y se protegió el rollback para no ocultar el error original.
- Se reforzó la configuración de producción: exige secretos JWT distintos y robustos, un origen HTTPS válido y un usuario de base de datos dedicado (no `root`) con contraseña robusta.
- Se ampliaron validaciones de perfil, usuarios, reseñas, listados administrativos, pedidos, paginación e identificadores.
- Se impide que un administrador se quite su propio acceso o desactive/elimine al último administrador activo.
- Se conserva el historial de pedidos: los usuarios con pedidos asociados se desactivan en lugar de eliminarse físicamente.
- Se consolidan líneas repetidas de un mismo producto antes de comprobar stock y se limitan cantidades para evitar omisiones en la validación.
- Se limita el descuento de cupones al subtotal y se restringen las fuentes de imágenes admitidas y su tamaño.
- Las columnas de imágenes ahora admiten Data URI mediante `MEDIUMTEXT`; se incluye una migración no destructiva para bases ya creadas.
- Se corrigió el tratamiento de cancelaciones y reembolsos: cancelar no registra automáticamente un reembolso inexistente. El administrador puede marcar como reembolsado un pedido pagado después de confirmar la operación real. Los pedidos cancelados/reembolsados no se cuentan como ingresos ni como compras verificadas para reseñas.
- Se mejoró la recuperación de sesión del frontend ante fallos temporales de red.
- Se dividió el bundle de producción del frontend para reducir el tamaño de los paquetes iniciales.
- Se retiró la dependencia de Jest que no se utilizaba y se habilitó el ejecutor de pruebas integrado de Node.

## Verificaciones realizadas

- Backend: `npm test` — **7 pruebas aprobadas, 0 fallidas**.
- Frontend: `vite build` — **compilación de producción completada**.
- Análisis estático: **90 archivos JavaScript/JSX** parseados correctamente, sin imports relativos faltantes.
- CSS: **2 hojas de estilos** parseadas correctamente.
- Configuración de producción: credenciales MySQL inseguras rechazadas y configuración con usuario dedicado aceptada.

## Pasos pendientes antes de publicar

- No había una instancia MySQL/MariaDB disponible durante esta auditoría. Por eso no se ejecutó una prueba integral contra una base real ni se modificó la base de datos del establecimiento.
- Si ya existe una base creada, ejecuta una sola vez `database/migrations/2026_11_02_expand_image_url_columns.sql` desde phpMyAdmin. Si crearás una base nueva, importa `database/schema.sql` y no necesitas esa migración.
- El endpoint de pago incluido en el proyecto es una simulación interna. No existe todavía una integración real con Mercado Pago ni un procesador de tarjetas. No debe usarse para cobrar tarjetas reales hasta integrar y probar un proveedor de pagos.
- Antes de producción configura HTTPS, credenciales privadas, correo transaccional, usuario MySQL dedicado, copias de seguridad y pruebas end-to-end de registro, compra, inventario y panel administrativo.

## Archivos excluidos del paquete limpio

No se distribuyen `node_modules`, `dist`, archivos `.env` locales ni `database/backups`. El respaldo SQL que venía dentro de la carpeta de backups contiene datos de cuentas y hashes de contraseña; se excluyó del paquete redistribuible por seguridad. El ZIP original que adjuntaste no se modificó. Conserva ese respaldo en una ubicación privada y protegida.
