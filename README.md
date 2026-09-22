# Docker Wizard Pro

Asistente visual en HTML, CSS y JavaScript puro para **diseñar, generar y entender** entornos Docker Compose paso a paso.

No requiere build, npm ni dependencias para ejecutar la interfaz: abre `index.html` en el navegador.

## Qué incluye

- Wizard guiado de 5 pasos.
- Python, Node.js y Go con varios frameworks.
- Modo **Full Stack** con React + Vite, Vue + Vite o Svelte + Vite como frontend independiente.
- PostgreSQL, MySQL, Redis, Nginx, RabbitMQ y MongoDB.
- Diagrama visual de la arquitectura elegida.
- Healthchecks para servicios de infraestructura.
- `depends_on` con `condition: service_healthy` cuando la aplicación depende de servicios con healthcheck.
- Redes explícitas `backend` y, cuando hay Nginx, `frontend`.
- Volúmenes nombrados para datos persistentes.
- Generación de:
  - `Dockerfile`
  - `Dockerfile.frontend` cuando se selecciona Full Stack
  - `PROJECT_LAYOUT.md` para documentar la estructura Full Stack
  - `compose.yml`
  - `compose.dev.yml`
  - `compose.prod.yml`
  - `.env.example`
  - `.dockerignore`
  - `nginx.conf` cuando se selecciona Nginx
- Explicaciones del porqué de cada instrucción y propiedad relevante.
- Runbook operativo con validación, arranque, estado, logs y apagado.
- Advertencias claras sobre secretos, persistencia y `docker compose down -v`.
- Copia y descarga de archivos desde el navegador.
- Diseño responsive sin frameworks ni dependencias externas.

## Ejecutar Docker Wizard

Abre:

```text
index.html
```

También puedes servir la carpeta con cualquier servidor HTTP estático.

## Flujo recomendado en un proyecto generado

Primero crea el archivo local de variables:

```bash
cp .env.example .env
```

Revisa los valores `change-me` antes de usar el entorno fuera de tu equipo local.

Valida el Compose base:

```bash
docker compose config
```

Valida la combinación de desarrollo:

```bash
docker compose -f compose.yml -f compose.dev.yml config
```

Arranca el entorno de desarrollo:

```bash
docker compose -f compose.yml -f compose.dev.yml up --build -d
```

Comprueba el estado y los healthchecks:

```bash
docker compose ps
```

Sigue los logs de la aplicación:

```bash
docker compose logs -f app
```

Antes de usar el overlay production-like, valida que las credenciales obligatorias estén definidas:

```bash
docker compose -f compose.yml -f compose.prod.yml config
```

## Por qué hay un Compose base y overlays

`compose.yml` contiene la arquitectura compartida: servicios, dependencias, redes, healthchecks y persistencia.

`compose.dev.yml` añade ajustes útiles durante el desarrollo. Por ejemplo, en Python monta el código local dentro del contenedor y, si existe Nginx, permite publicar también el puerto de la aplicación para depuración directa.

`compose.prod.yml` añade una configuración **production-like**: reinicio automático y validaciones para evitar arrancar determinados servicios con contraseñas por defecto.

No pretende sustituir una plataforma de producción completa.

## Full Stack

El modo **Full Stack** mantiene el backend en la raíz del proyecto y añade un proyecto Vite en `frontend/`. De esta forma el modo API existente sigue siendo compatible y el frontend obtiene su propia imagen.

La imagen del frontend es multi-stage:

1. Node instala dependencias con `npm ci`.
2. Vite ejecuta `npm run build`.
3. Solo `dist/` pasa a una imagen final Nginx.

El contrato entre frontend y backend es `VITE_API_URL`. Si se selecciona Nginx, su valor recomendado es `/api` y el proxy reenvía esas peticiones al backend. Sin Nginx, el frontend apunta al puerto publicado del backend y este debe permitir el origen web mediante CORS.

La salida Full Stack añade:

```text
Dockerfile
Dockerfile.frontend
compose.yml
compose.dev.yml
compose.prod.yml
.env.example
PROJECT_LAYOUT.md
nginx.conf          # si se selecciona Nginx
```

El puerto web local es configurable desde el wizard; por defecto usa `5173`.

## Nginx

Cuando se selecciona Nginx, Docker Wizard genera `nginx.conf` y cambia la topología:

```text
Cliente
   │
   ▼
 Nginx :80
   │
   ├── /      → frontend:80   (Full Stack)
   └── /api/  → app:<puerto>
   │
   ├── PostgreSQL / MySQL / MongoDB
   ├── Redis
   └── RabbitMQ
```

La aplicación comparte la red `frontend` con Nginx y la red `backend` con sus dependencias. Las bases de datos no necesitan formar parte de la red de entrada.

## Estructura del proyecto

```text
.
├── index.html
├── styles.css
├── pro.css
├── app.js
├── architecture.js
├── compose-pro.js
├── explanations-pro.js
├── generate-pro.js
├── README.md
└── LICENSE
```

Los módulos `*-pro.js` amplían la versión base sin convertir `app.js` en un archivo monolítico.

## GitHub Pages

El proyecto sigue siendo un sitio estático.

1. Abre **Settings → Pages**.
2. En **Build and deployment**, selecciona **Deploy from a branch**.
3. Elige la rama **main** y la carpeta **/(root)**.
4. Guarda los cambios.

## Límites de la plantilla

La salida es una base educativa y operativa razonable, pero un despliegue público real debería revisar, entre otras cosas:

- TLS y terminación HTTPS.
- Gestión externa de secretos.
- Backups y restauración de datos.
- Observabilidad y alertas.
- Actualización y pinning de imágenes.
- Usuarios no-root cuando la imagen y el runtime lo permitan.
- Límites de CPU y memoria.
- Estrategia de migraciones de base de datos.
- Configuración específica del framework y del entorno de despliegue.

