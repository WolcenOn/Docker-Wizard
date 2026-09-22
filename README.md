# Docker Wizard Pro

Asistente visual en HTML, CSS y JavaScript puro para **diseñar, generar y entender** entornos Docker Compose paso a paso.

No requiere build, npm ni dependencias para ejecutar la interfaz: abre `index.html` en el navegador.

## Qué incluye

- Wizard guiado de 5 pasos.
- Python, Node.js y Go con varios frameworks.
- PostgreSQL, MySQL, Redis, Nginx, RabbitMQ y MongoDB.
- Diagrama visual de la arquitectura elegida.
- Healthchecks para servicios de infraestructura.
- `depends_on` con `condition: service_healthy` cuando la aplicación depende de servicios con healthcheck.
- Redes explícitas `backend` y, cuando hay Nginx, `frontend`.
- Volúmenes nombrados para datos persistentes.
- Generación de:
  - `Dockerfile`
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

## Nginx

Cuando se selecciona Nginx, Docker Wizard genera `nginx.conf` y cambia la topología:

```text
Cliente
   │
   ▼
 Nginx :80
   │
   ▼
 app:<puerto>
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

