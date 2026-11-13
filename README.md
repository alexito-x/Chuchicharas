# 🛒 Chuchicharas — Tienda Virtual Multi-Producto

Tienda e-commerce completa con identidad visual propia de **Chuchicharas**, construida con:

- **Frontend:** React 18 + Vite + React Router + Axios
- **Backend:** Node.js + Express (API REST)
- **Base de datos:** MySQL / MariaDB (XAMPP), con esquema independiente del código
- **Autenticación:** JWT (access + refresh token) y contraseñas con bcrypt

---

## 📁 Estructura del proyecto

```
Chuchicharas/
├── frontend/                  # Aplicación React + Vite
│   ├── src/
│   │   ├── components/        # Componentes reutilizables (layout, ui, admin)
│   │   ├── context/           # AuthContext y CartContext
│   │   ├── pages/             # Páginas públicas y admin/
│   │   ├── services/          # Capa de servicios (Axios)
│   │   ├── styles/            # Diseño global (tema Chuchicharas)
│   │   └── utils/             # Formateadores y etiquetas
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/                   # API REST Node.js + Express
│   ├── src/
│   │   ├── config/            # Configuración y pool MySQL
│   │   ├── controllers/       # Lógica de negocio
│   │   ├── middleware/        # Auth, validación y errores
│   │   ├── routes/            # Endpoints de la API
│   │   ├── validators/        # Validaciones de entrada
│   │   └── server.js          # Punto de entrada
│   ├── .env                   # Variables de entorno locales
│   └── package.json
│
├── database/
│   └── schema.sql             # Creación de tablas, relaciones, seeds y triggers
│
└── README.md
```

---

## 🚀 Instalación paso a paso

### 1) Requisitos previos

- **Node.js 18 o superior** (recomendado 20+)
- **XAMPP** instalado (MySQL/MariaDB y phpMyAdmin) para desarrollo local
- Navegador moderno

Verificá Node con:

```bash
node --version
npm --version
```

### 2) Levantar MySQL en XAMPP

1. Abrí el **Panel de Control de XAMPP**.
2. Iniciá **MySQL** (también podés iniciar **Apache** si querés usar phpMyAdmin).
3. Verificá que el indicador de MySQL esté en verde.

### 3) Crear e importar la base de datos

**Opción A — phpMyAdmin (recomendada):**

1. Abrí `http://localhost/phpmyadmin`.
2. Pestaña **Importar**.
3. Seleccioná el archivo `database/schema.sql`.
4. Clic en **Continuar**.

El script crea automáticamente la base `chuchicharas_db`, las tablas, relaciones, vistas, triggers, categorías y el catálogo inicial de 141 productos. Por seguridad no precarga una cuenta de administrador: créala después con `npm run seed:admin` usando las credenciales que configures en `backend/.env`.

**Opción B — consola (Windows CMD):**

```cmd
C:\xampp\mysql\bin\mysql.exe --default-character-set=utf8mb4 -u root < "RUTA\A\Chuchicharas\database\schema.sql"
```

> El parámetro `--default-character-set=utf8mb4` es importante para que los acentos (`Electrónica`, `Bebés`, etc.) se importen correctamente.

Verificación rápida:

```cmd
C:\xampp\mysql\bin\mysql.exe -u root -e "SHOW DATABASES;"
```

> Si tu MySQL tiene contraseña, agregá `-p` y escribila cuando la pida.

> **Base de datos existente:** si ya habías importado una versión anterior del esquema, ejecuta una sola vez `database/migrations/2026_11_02_expand_image_url_columns.sql` en phpMyAdmin. La migración amplía las columnas de imágenes para admitir Data URI válidos sin truncarlos; no borra productos ni imágenes.

### 4) Configurar y levantar el Backend

```bash
cd backend
```

Antes de arrancar, crea el archivo local a partir de la plantilla:

```bash
cp .env.example .env
```

En Windows CMD utiliza `copy .env.example .env`. Después edita `.env`: configura la conexión MySQL, el origen del frontend y credenciales administrativas únicas y seguras. No reutilices contraseñas de ejemplo ni compartas este archivo.

Instala dependencias, crea la contraseña del administrador y arranca el servidor:

```bash
npm ci
npm run seed:admin
npm run dev
```

> `npm run seed:admin` crea o actualiza la cuenta indicada en `ADMIN_EMAIL` con la contraseña de `ADMIN_PASSWORD`. Esa contraseña no se muestra ni se guarda en el frontend.
>
> Si vienes de una base con precios en pesos argentinos, ejecuta una sola vez `npm run migrate:prices` para convertir productos, cupones y pedidos a MXN.
>
> Para reemplazar el catálogo actual por `backend/scripts/data/catalogo-141.json`, ejecuta `npm run import:catalog`. El comando asigna stock inicial de 10 unidades, deja inactivas las categorías vacías y requiere que no existan pedidos con productos asociados. Haz un respaldo de la base antes de usarlo.

**Importante sobre producción:** configura un usuario MySQL dedicado, distinto de `root`, con contraseña segura de al menos 16 caracteres. La validación del backend bloquea credenciales de base de datos inseguras cuando `NODE_ENV=production`.

**Importante sobre pagos:** el endpoint actual de pago es una simulación interna, no conecta con Mercado Pago ni con un procesador de tarjetas. No captures ni almacenes datos reales de tarjetas. Antes de publicar cobros reales, integra y prueba un proveedor de pagos certificado. Los cambios de pedido a “Reembolsado” son una confirmación administrativa posterior al reembolso real, no una operación ejecutada por esta aplicación.

La API quedará disponible en:

- `http://localhost:3001/api/v1`
- Health check: `http://localhost:3001/health`

Si ves el mensaje `✅ Conexión a MySQL establecida correctamente`, todo está listo.

### 5) Configurar y levantar el Frontend

En otra terminal, crea el archivo local de configuración (opcional si usarás la URL predeterminada):

```bash
cd frontend
cp .env.example .env
npm ci
npm run dev
```

En Windows CMD utiliza `copy .env.example .env`. El valor predeterminado apunta a `http://localhost:3001/api/v1`.

Abrí en el navegador:

```
http://localhost:5173
```

> No publiques el archivo `frontend/.env` si contiene rutas o configuraciones específicas de tu entorno.

---

## 🔑 Acceso de administrador

El administrador se configura únicamente en `backend/.env`. Usa un correo que controles y una contraseña única, robusta y privada. El script `npm run seed:admin` crea la cuenta a partir de esos valores; no hay credenciales universales precargadas.

Después de cambiarlos, ejecuta:

```bash
cd backend
npm run seed:admin
```

Inicia sesión en `/login` con ese correo y contraseña para acceder al **Panel de Administración** en `/admin`. Las credenciales no se muestran en la interfaz ni se incluyen en el bundle del frontend.

También puedes registrar usuarios normales desde `/registro`.

---

## ✨ Funcionalidades incluidas

### Tienda (público)
- **Home** con hero, beneficios, categorías, ofertas, destacados y más vendidos.
- **Búsqueda avanzada** con autocompletado en vivo (productos y categorías).
- **Catálogo** con filtros por categoría/subcategoría, precio, marca, condición y ordenamiento (precio, rating, más vendidos, novedades).
- **Detalle de producto** con galería, meses sin intereses, envío, stock, especificaciones y reseñas.
- **Favoritos** para invitados y usuarios (se sincronizan al iniciar sesión).
- **Compartir producto** por WhatsApp, Facebook, X, Telegram, correo, enlace copiado o el menú nativo del dispositivo.
- **Precios en MXN** con formato `es-MX` y fallback local para imágenes inválidas o Base64 incompletos.
- **Carrito** persistente en base de datos (por usuario).
- **Checkout simulado** con dirección de envío y múltiples medios de pago.
- **Pago simulado** (genera referencia de pago y confirma el pedido).
- **Mis compras** con historial, estado del pedido y cancelación.
- **Perfil** para editar datos y cambiar contraseña.
- **Contacto / Quiénes somos** con dirección, horarios y ubicación en Atlacomulco de Fabela.
- **Reseñas** con calificación de 1 a 5 estrellas.

### Panel de administración (`/admin`)
- **Dashboard** con métricas: clientes, productos, pedidos, ingresos, stock bajo y categorías top.
- **Productos:** crear, editar, eliminar, stock, precio, SKU, imágenes y atributos.
- **Pedidos:** listar, filtrar, ver detalle y avanzar estados (pendiente → confirmado → preparación → enviado → entregado).
- **Categorías:** CRUD de categorías y subcategorías (organización clara del catálogo).
- **Usuarios:** listar, cambiar rol/estado y eliminar.
- **Reseñas:** aprobar o rechazar opiniones.

---

## 🎨 Diseño

- Paleta de marca: magenta `#C2007A`, rosa claro `#FCE7F3`, ciruela `#2D0A23`, verde `#0D9F6E` y grises cálidos.
- Logo oficial en `frontend/public/brand/` para navbar, footer y favicon.
- Totalmente **responsivo** (móvil, tablet y escritorio).
- Animaciones y transiciones suaves: hover en tarjetas, dropdowns, skeletons, toasts.
- Tipografía **Inter** y componentes accesibles.

---

## 🔌 Endpoints principales

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/v1/auth/register` | Registro de usuario |
| POST | `/api/v1/auth/login` | Inicio de sesión |
| POST | `/api/v1/auth/refresh-token` | Renovar token |
| GET | `/api/v1/auth/profile` | Perfil (auth) |
| GET | `/api/v1/products` | Catálogo con filtros y paginación |
| GET | `/api/v1/products/featured` | Productos destacados |
| GET | `/api/v1/products/search/suggestions?q=` | Autocompletado |
| GET | `/api/v1/products/:id` | Detalle de producto |
| GET | `/api/v1/categories/tree` | Árbol de categorías |
| GET/POST/PUT/DELETE | `/api/v1/cart` | Carrito (auth) |
| GET/POST/DELETE | `/api/v1/favorites` | Favoritos (auth) |
| POST | `/api/v1/orders` | Crear pedido (auth) |
| POST | `/api/v1/orders/:id/pay` | Pago simulado (auth) |
| GET | `/api/v1/orders` | Mis pedidos (auth) |
| GET | `/api/v1/admin/users` | Usuarios (solo admin) |
| GET | `/api/v1/admin/users/dashboard/stats` | Métricas (solo admin) |
| POST/PUT/DELETE | `/api/v1/products` | CRUD productos (solo admin) |

La API valida permisos con JWT y devuelve respuestas con la forma:

```json
{ "success": true, "data": { ... } }
```

---

## 🧪 Verificación automatizada

El backend incluye pruebas de humo ejecutables con `npm test` desde `backend/`. Cubren el endpoint de salud, la raíz de la API, CORS local, validación de acceso y validación de fuentes de imagen. Estas pruebas no sustituyen la comprobación de integración con una instancia real de MySQL.

Para comprobar el frontend después de instalar las dependencias ejecuta `npm run build` desde `frontend/`. Para una verificación de compra completa se requiere MySQL/MariaDB con `database/schema.sql` importado y ejecutar manualmente el flujo de usuario y administrador.

---

## 🛠️ Solución de problemas

**“No se pudo conectar a MySQL”**
- Verificá que MySQL esté iniciado en XAMPP.
- Revisá usuario/contraseña/puerto en `backend/.env`.

**“El token '&&' no es un separador de instrucciones válido”**
- Windows PowerShell 5.1 no admite `&&`. Ejecutá los comandos en líneas separadas o usá `;`:
  ```powershell
  cd backend; npm run dev
  ```
- O bien, en dos líneas:
  ```powershell
  cd backend
  npm run dev
  ```

**“Port 3001 is already in use”**
- Cerrá el proceso anterior o cambiá `PORT` en `backend/.env` y `VITE_API_URL` en `frontend/.env`.

**Las imágenes no cargan**
- Las imágenes de ejemplo son URLs externas y requieren conexión a internet.
- Si una URL falla o un Base64 está incompleto, la tienda muestra `public/images/product-placeholder.svg` automáticamente.
- En el panel admin puedes reemplazarlas por una URL válida o un Base64 completo.

**Error de CORS**
- Asegurate de acceder al frontend desde `http://localhost:5173` y que `FRONTEND_URL` coincida en `backend/.env`.

**Error al importar el SQL en versiones viejas de MySQL**
- El script está pensado para MySQL 8+ / MariaDB 10.4+. Actualizá XAMPP si es necesario.

**Los acentos se ven como caracteres extraños (`Electr�nica`)**
- Eliminá la base `chuchicharas_db` y volvé a importar `database/schema.sql` usando el parámetro `--default-character-set=utf8mb4`.

**La contraseña del admin no funciona**
- Revisa `ADMIN_EMAIL` y `ADMIN_PASSWORD` en `backend/.env`.
- Ejecuta `cd backend` y luego `npm run seed:admin` para actualizar la cuenta.
- No es necesario reinstalar la base para cambiar la contraseña.

---

## 📦 Build para producción (opcional)

```bash
cd frontend
npm run build
npm run preview
```

Para el backend:

```bash
cd backend
npm start
```

> En producción, `JWT_SECRET` y `JWT_REFRESH_SECRET` deben ser distintos, aleatorios y de al menos 32 caracteres. El backend rechaza el arranque en producción si detecta valores de ejemplo o débiles. Genera ambos con `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` ejecutando el comando dos veces. Configura `FRONTEND_URL` con el origen público real del frontend. Sirve el frontend con un servidor estático y configura HTTPS; no uses el pago simulado para cobrar pedidos reales.

---

## 💳 Aviso

La pasarela de pago es **simulada** con fines académicos/demostrativos. No se procesan pagos reales ni se almacenan datos de tarjetas.

---

Hecho con ❤️ para **Chuchicharas**.
