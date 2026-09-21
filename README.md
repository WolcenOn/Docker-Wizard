# Docker Wizard Pro

Asistente visual en HTML, CSS y JavaScript puro para generar, entender y ejecutar configuraciones Docker paso a paso.

## Ejecutar

Abre `index.html` directamente en el navegador. No requiere build, npm ni dependencias.

## Publicar con GitHub Pages

El proyecto está preparado como sitio estático. En GitHub:

1. Abre **Settings → Pages**.
2. En **Build and deployment**, selecciona **Deploy from a branch**.
3. Elige la rama **main** y la carpeta **/(root)**.
4. Guarda los cambios.

GitHub Pages servirá directamente `index.html`.

## Qué incluye

- Wizard guiado de 5 pasos.
- Python, Node.js y Go con varios frameworks.
- PostgreSQL, MySQL, Redis, Nginx, RabbitMQ y MongoDB.
- Generación de `Dockerfile`, `compose.yml`, `.env.example` y `.dockerignore`.
- Explicaciones del porqué de cada instrucción Docker y propiedad de Compose.
- Runbook de comandos: `config`, `build`, `up`, `ps`, `logs` y `down`.
- Advertencias sobre secretos, persistencia y `docker compose down -v`.
- Copia y descarga de archivos desde el navegador.
- Diseño responsive sin frameworks ni dependencias externas.

## Estructura

```text
.
├── index.html
├── styles.css
├── app.js
├── README.md
└── LICENSE
```

## Nota

Las plantillas son una base educativa. Para producción conviene añadir healthchecks, gestión real de secretos, usuarios no-root, versionado de imágenes, estrategia de backups y ajustes específicos de cada framework.
