// Docker Wizard Pro: explicaciones y runbook ampliado.
function explanationsFor(fileName) {
  const commonDockerfile = [
    ["FROM", "Selecciona la imagen base. Todo lo demás se construye encima de este filesystem y runtime."],
    ["WORKDIR", "Define el directorio de trabajo para COPY, RUN y CMD, evitando rutas absolutas repetidas."],
    ["COPY", "Copia archivos del contexto de build a la imagen. Copiar dependencias antes que el código mejora la caché."],
    ["RUN", "Ejecuta acciones durante el build y crea una nueva capa, por ejemplo instalar paquetes o compilar."],
    ["EXPOSE", "Documenta el puerto esperado por la aplicación, pero no lo publica en el host."],
    ["CMD", "Define el proceso principal al arrancar el contenedor. Si ese proceso termina, el contenedor termina."]
  ];
  const compose = [
    ["services", "Declara los contenedores que forman el entorno."],
    ["healthcheck", "Prueba si una dependencia está realmente preparada para recibir tráfico."],
    ["depends_on.condition", "Hace que la app espere a service_healthy en lugar de confiar solo en el orden de creación."],
    ["networks", "Separa el plano frontend del backend cuando hay proxy y mantiene las dependencias fuera de la red de entrada."],
    ["volumes", "Mantiene datos importantes fuera del ciclo de vida efímero del contenedor."],
    ["\${VAR:-default}", "Permite parametrizar Compose con .env sin incrustar credenciales en el YAML."]
  ];
  const dev = [
    ["override", "Se combina con compose.yml; no duplica todo el archivo, solo cambia lo necesario para desarrollo."],
    ["APP_ENV", "Marca el entorno como development para que la aplicación pueda elegir configuración local."],
    ["ports", "Con Nginx activo, el overlay también publica el puerto de la app para depuración directa."],
    ["volumes", "En Python monta el código local dentro del contenedor; otros runtimes mantienen un baseline conservador para no romper dependencias."]
  ];
  const prod = [
    ["restart", "Pide a Docker que reinicie servicios salvo que se hayan detenido explícitamente."],
    ["\${VAR:?mensaje}", "Hace fallar la configuración si falta una credencial obligatoria, evitando arrancar production-like con contraseñas por defecto."],
    ["APP_ENV", "Cambia la aplicación a configuración de producción sin modificar el Compose base."],
    ["límite", "Este overlay mejora el baseline, pero no sustituye TLS, backups, observabilidad, usuarios no-root ni un gestor de secretos."]
  ];
  const env = [
    [".env.example", "Documenta todas las variables necesarias sin convertir el archivo de ejemplo en un secreto."],
    ["change-me", "Es un marcador deliberado. Debes cambiarlo en el .env real antes de compartir o desplegar."],
    ["*_URL", "Usa nombres de servicio como hostname porque Docker DNS resuelve esos nombres dentro de la red Compose."]
  ];
  const ignore = [
    [".env", "Evita incorporar secretos locales al contexto y, potencialmente, a la imagen."],
    ["node_modules / .venv", "Las dependencias deberían instalarse dentro de la imagen para que correspondan con su sistema operativo."],
    [".git", "El historial no es necesario para ejecutar la aplicación y aumenta el contexto de build."],
    ["dist / build", "Evita arrastrar artefactos locales que pueden estar desactualizados o ser incompatibles."]
  ];
  const nginx = [
    ["proxy_pass", state.appType === "fullstack" ? "En Full Stack, / sirve el frontend y /api/ reenvía al backend usando DNS interno de Docker." : "Reenvía las peticiones al servicio app usando el DNS interno de Docker."],
    ["X-Forwarded-*", "Conserva información del protocolo y cliente original para que la aplicación pueda interpretarla."],
    ["server_name _", "Actúa como virtual host por defecto para este scaffold local."]
  ];
  if (fileName === "Dockerfile") return commonDockerfile;
  if (fileName === "Dockerfile.frontend") return [
    ["deps", "Instala las dependencias del proyecto Vite antes de copiar el código para aprovechar la caché de capas."],
    ["build", "Node ejecuta npm run build y genera el directorio estático dist/."],
    ["VITE_API_URL", "Fija durante el build el punto de entrada que usará el navegador para llamar al backend."],
    ["runtime", "La imagen final contiene Nginx y los archivos estáticos, no Node ni las dependencias de compilación."],
    ["HEALTHCHECK", "Verifica que el servidor web está respondiendo antes de considerarlo preparado."]
  ];
  if (fileName === "PROJECT_LAYOUT.md") return [
    ["raíz", "El backend permanece en la raíz para conservar compatibilidad con el modo API existente."],
    ["frontend/", "El proyecto Vite vive separado y tiene su propio package.json y lockfile."],
    ["VITE_API_URL", "Es el contrato entre el frontend compilado y el punto de entrada de la API."]
  ];
  if (fileName === "compose.yml") return state.appType === "fullstack"
    ? [...compose,
      ["frontend", "Añade una segunda imagen desplegable para la SPA, conectada solo a la red frontend."],
      ["frontend/backend", "Dos redes evitan que el contenedor que sirve la web acceda directamente a las bases de datos."]
    ]
    : compose;
  if (fileName === "compose.dev.yml") return dev;
  if (fileName === "compose.prod.yml") return prod;
  if (fileName === ".env.example") return env;
  if (fileName === "nginx.conf") return nginx;
  return ignore;
}

function commandRunbook() {
  return [
    ["cp .env.example .env", "Crea tu archivo local de variables a partir del contrato de ejemplo. Después cambia cualquier valor change-me antes de compartir el entorno.", ""],
    ["docker compose config", "Valida el Compose base, resuelve variables y muestra la configuración final antes de crear recursos.", ""],
    ["docker compose -f compose.yml -f compose.dev.yml config", "Comprueba cómo queda la configuración al combinar el archivo base con el overlay de desarrollo.", ""],
    ["docker compose -f compose.yml -f compose.dev.yml up --build -d", "Construye y arranca el entorno de desarrollo en segundo plano.", ""],
    ["docker compose ps", "Muestra estado y health de los servicios. Un servicio unhealthy merece revisión antes de mirar la app.", ""],
    [state.appType === "fullstack" ? "docker compose logs -f frontend app" : "docker compose logs -f app", state.appType === "fullstack" ? "Sigue frontend y backend a la vez para distinguir un fallo de servidor web, build o API." : "Sigue los logs de la aplicación; es el primer diagnóstico cuando el proceso no arranca o pierde una dependencia.", ""],
    ["docker compose -f compose.yml -f compose.prod.yml config", "Valida el overlay production-like y falla si faltan secretos marcados como obligatorios.", "warning"],
    ["docker compose down", "Detiene y elimina contenedores y redes del proyecto, pero conserva por defecto los volúmenes nombrados.", "warning"],
    ["docker compose down -v", "También elimina los volúmenes. Puede borrar datos persistentes de tus bases de datos.", "danger"]
  ];
}

function renderCommandCoach() {
  const commands = [
    ["Validar configuración", "docker compose config", "Antes de crear contenedores, valida el Compose base y comprueba cómo se resuelven sus variables."],
    ["Construir la imagen", "docker compose build", "Ejecuta el Dockerfile y aprovecha la caché de capas cuando las entradas no han cambiado."],
    ["Revisar servicios", "docker compose config --services", "Comprueba qué servicios forman realmente el entorno antes de arrancarlo."],
    ["Validar modo desarrollo", "docker compose -f compose.yml -f compose.dev.yml config", "Combina el Compose base con el overlay de desarrollo y muestra el resultado efectivo."],
    ["Preparar y validar", "cp .env.example .env", "Crea primero el archivo local de variables; después sigue el runbook y cambia cualquier credencial change-me."]
  ];
  const [title, command, reason] = commands[state.step];
  commandTitle.textContent = title;
  terminalCommand.textContent = command;
  commandReason.textContent = reason;
}
