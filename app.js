const steps = [
  { title: "Proyecto", subtitle: "Qué vas a contenerizar" },
  { title: "Tecnología", subtitle: "Runtime y framework" },
  { title: "Servicios", subtitle: "Dependencias del entorno" },
  { title: "Docker", subtitle: "Puerto y estrategia" },
  { title: "Generar", subtitle: "Archivos, explicación y runbook" }
];

const frameworksByRuntime = {
  python: ["fastapi", "django", "flask"],
  node: ["express", "nestjs", "nextjs"],
  go: ["gin", "fiber", "net-http"]
};

const frameworkLabels = {
  fastapi: "FastAPI", django: "Django", flask: "Flask",
  express: "Express", nestjs: "NestJS", nextjs: "Next.js",
  gin: "Gin", fiber: "Fiber", "net-http": "net/http"
};

const defaultPorts = {
  fastapi: 8000, django: 8000, flask: 5000,
  express: 3000, nestjs: 3000, nextjs: 3000,
  gin: 8080, fiber: 3000, "net-http": 8080
};

const state = {
  step: 0,
  name: "mi-proyecto",
  appType: "api",
  runtime: "python",
  framework: "fastapi",
  port: 8000,
  production: false,
  frontendFramework: "react",
  frontendPort: 5173,
  services: new Set(["postgres"]),
  previewFile: "Dockerfile"
};

const stepContent = document.querySelector("#step-content");
const stepsEl = document.querySelector("#steps");
const summaryEl = document.querySelector("#summary");
const titleEl = document.querySelector("#step-title");
const descriptionEl = document.querySelector("#step-description");
const nextBtn = document.querySelector("#next-btn");
const backBtn = document.querySelector("#back-btn");
const resetBtn = document.querySelector("#reset-btn");
const statusBadge = document.querySelector("#status-badge");
const progressPill = document.querySelector("#progress-pill");
const terminalCommand = document.querySelector("#terminal-command");
const commandTitle = document.querySelector("#command-title");
const commandReason = document.querySelector("#command-reason");

function esc(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function projectNameIsValid() {
  return /^[a-z0-9][a-z0-9._-]*$/i.test(state.name) && !state.name.includes(" ");
}

function renderSteps() {
  stepsEl.innerHTML = steps.map((step, index) => {
    const active = index === state.step;
    const done = index < state.step;
    return `
      <button class="step-item ${active ? "active" : ""} ${done ? "done" : ""}" data-step="${index}" type="button" ${index > state.step ? "disabled" : ""}>
        <span class="step-index">${done ? "✓" : index + 1}</span>
        <span class="step-copy"><strong>${step.title}</strong><small>${step.subtitle}</small></span>
      </button>`;
  }).join("");

  stepsEl.querySelectorAll("[data-step]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = Number(button.dataset.step);
      if (target <= state.step) {
        state.step = target;
        render();
      }
    });
  });
}

function renderSummary() {
  const services = [...state.services];
  summaryEl.innerHTML = `
    <div class="summary-row"><span>Proyecto</span><strong>${esc(state.name)}</strong></div>
    <div class="summary-row"><span>Arquitectura</span><strong>${state.appType === "api" ? "API / Backend" : "Full stack"}</strong></div>
    <div class="summary-row"><span>Aplicación</span><strong>${state.runtime === "node" ? "Node.js" : state.runtime[0].toUpperCase() + state.runtime.slice(1)} · ${esc(frameworkLabels[state.framework])}</strong></div>
    ${state.appType === "fullstack" ? `<div class="summary-row"><span>Frontend</span><strong>${state.frontendFramework === "react" ? "React + Vite" : state.frontendFramework === "vue" ? "Vue + Vite" : "Svelte + Vite"}</strong></div>` : ""}
    <div class="summary-row"><span>Puerto host → contenedor</span><strong>${state.port} → ${state.port}</strong></div>
    <div class="summary-row"><span>Servicios</span><div class="tags">${services.length ? services.map(s => `<span class="tag">${esc(s)}</span>`).join("") : `<span class="tag">ninguno</span>`}</div></div>
    <div class="summary-row"><span>Estrategia</span><strong>${state.production ? "Orientada a producción" : "Desarrollo local"}</strong></div>`;

  const ready = state.step === steps.length - 1;
  statusBadge.textContent = ready ? "Listo" : "Configurando";
  statusBadge.classList.toggle("ready", ready);
  progressPill.textContent = `Paso ${state.step + 1} de ${steps.length}`;
}

function renderCommandCoach() {
  const commands = [
    ["Validar configuración", "docker compose config", "Parsea compose.yml y muestra la configuración resultante. Es una comprobación barata antes de crear nada."],
    ["Construir la imagen", "docker compose build", "Ejecuta las instrucciones del Dockerfile y prepara la imagen de tu aplicación."],
    ["Revisar servicios", "docker compose config --services", "Enumera los servicios que Docker Compose reconoce en tu archivo."],
    ["Arrancar el entorno", "docker compose up --build", "Construye si hace falta y levanta todos los servicios definidos en compose.yml."],
    ["Primer comando recomendado", "docker compose config", "Empieza validando el archivo. Después sigue el runbook completo de la pantalla final."]
  ];
  const [title, command, reason] = commands[state.step];
  commandTitle.textContent = title;
  terminalCommand.textContent = command;
  commandReason.textContent = reason;
}

function optionCard(name, value, title, text, selected, note = "") {
  return `
    <label class="option-card ${selected ? "selected" : ""}">
      <div class="option-title-row"><input type="radio" name="${name}" value="${value}" ${selected ? "checked" : ""} /><strong>${title}</strong></div>
      <p>${text}</p>${note ? `<span class="option-note">${note}</span>` : ""}
    </label>`;
}

function guide(mark, title, text, type = "") {
  return `<div class="guide-strip ${type}"><div class="guide-mark">${mark}</div><div><strong>${title}</strong><p>${text}</p></div></div>`;
}

function renderProjectStep() {
  const valid = projectNameIsValid();
  stepContent.innerHTML = `
    <h3 class="section-title">Define qué vas a contenerizar</h3>
    <p class="section-copy">Docker empaqueta una aplicación junto con su entorno. Aquí decidimos la forma del proyecto antes de escribir ningún archivo.</p>
    ${guide("1", "Empieza por una unidad desplegable", "Un contenedor funciona mejor cuando tiene una responsabilidad clara. Para empezar, piensa en tu aplicación como un servicio principal y añade dependencias alrededor.")}

    <div class="field">
      <label for="project-name">Nombre del proyecto</label>
      <input id="project-name" class="${valid ? "" : "invalid"}" type="text" value="${esc(state.name)}" maxlength="50" autocomplete="off" />
      <div class="field-help">Usa letras, números, guiones, puntos o guiones bajos. Evita espacios para que el nombre también funcione bien en CLI, carpetas y recursos Docker.</div>
      ${valid ? "" : `<div class="field-error">El nombre no puede contener espacios ni caracteres especiales.</div>`}
    </div>

    <div class="option-grid">
      ${optionCard("appType", "api", "API / Backend", "Una única aplicación servidor. Es la ruta más directa para aprender Docker y Compose.", state.appType === "api", "Recomendado para empezar")}
      ${optionCard("appType", "fullstack", "Full stack", "Pensado para separar frontend, backend y servicios auxiliares en varios contenedores.", state.appType === "fullstack", "Más componentes")}
    </div>

    <div class="decision-box"><h4>¿Por qué importa esta decisión?</h4><p>Compose está pensado para coordinar varios servicios. Una API sencilla puede vivir en un contenedor; un full stack suele beneficiarse de separar frontend, backend, base de datos y proxy para poder evolucionarlos de forma independiente.</p></div>`;

  const nameInput = document.querySelector("#project-name");
  nameInput.addEventListener("input", (e) => {
    state.name = e.target.value.trim() || "mi-proyecto";
    renderSummary();
    nextBtn.disabled = !projectNameIsValid();
    const currentValid = projectNameIsValid();
    nameInput.classList.toggle("invalid", !currentValid);
  });

  stepContent.querySelectorAll('input[name="appType"]').forEach((input) => {
    input.addEventListener("change", (e) => { state.appType = e.target.value; render(); });
  });
}

function renderTechnologyStep() {
  stepContent.innerHTML = `
    <h3 class="section-title">Elige la imagen base de tu aplicación</h3>
    <p class="section-copy">Tu runtime determina la imagen base del Dockerfile y cómo se instalan dependencias, se construye el proyecto y se inicia el proceso.</p>
    ${guide("i", "Consejo", "Empieza con imágenes oficiales y variantes pequeñas como slim o alpine cuando encajen. Reducen superficie y tamaño, pero conviene priorizar compatibilidad antes que ahorrar unos megabytes.")}

    <div class="option-grid three">
      ${optionCard("runtime", "python", "Python", "Instala dependencias con pip y ejecuta tu servidor Python.", state.runtime === "python", "Imagen: python:*‑slim")}
      ${optionCard("runtime", "node", "Node.js", "Instala exactamente el lockfile con npm ci y arranca mediante scripts npm.", state.runtime === "node", "Imagen: node:*‑alpine")}
      ${optionCard("runtime", "go", "Go", "Compila un binario y lo copia a una imagen final más pequeña.", state.runtime === "go", "Multi-stage build")}
    </div>

    <div class="field" style="margin-top:20px">
      <label for="framework">Framework</label>
      <select id="framework">${frameworksByRuntime[state.runtime].map(f => `<option value="${f}" ${f === state.framework ? "selected" : ""}>${frameworkLabels[f]}</option>`).join("")}</select>
      <div class="field-help">También usamos el framework para proponer el puerto habitual y el comando de arranque.</div>
    </div>

    ${state.appType === "fullstack" ? `
      <div class="decision-box">
        <h4>Frontend independiente</h4>
        <p>El backend conserva el runtime elegido arriba. El frontend tendrá su propia imagen multi-stage: Node compila el proyecto Vite y Nginx sirve únicamente los archivos estáticos resultantes.</p>
      </div>
      <div class="option-grid three" style="margin-bottom:20px">
        ${optionCard("frontendFramework", "react", "React + Vite", "SPA React compilada a dist/ y servida por Nginx.", state.frontendFramework === "react", "Frontend")}
        ${optionCard("frontendFramework", "vue", "Vue + Vite", "Vue 3 con el mismo pipeline de build reproducible.", state.frontendFramework === "vue", "Frontend")}
        ${optionCard("frontendFramework", "svelte", "Svelte + Vite", "Svelte en modo SPA con salida estática dist/.", state.frontendFramework === "svelte", "Frontend")}
      </div>
      ${guide("/api", "Contrato frontend → backend", "Con Nginx, el frontend puede llamar a /api y el proxy entregará esas peticiones al backend. Sin Nginx se usará la URL directa del backend y tendrás que permitir el origen del frontend mediante CORS.")}
    ` : ""}
    <div class="decision-box"><h4>Lo que generará el Dockerfile</h4><p><code>FROM</code> elegirá el runtime, <code>WORKDIR</code> fijará una carpeta de trabajo, <code>COPY</code> introducirá tus archivos, <code>RUN</code> instalará o compilará dependencias y <code>CMD</code> definirá el proceso principal del contenedor.</p></div>`;

  stepContent.querySelectorAll('input[name="runtime"]').forEach((input) => {
    input.addEventListener("change", (e) => {
      state.runtime = e.target.value;
      state.framework = frameworksByRuntime[state.runtime][0];
      state.port = defaultPorts[state.framework];
      render();
    });
  });

  document.querySelector("#framework").addEventListener("change", (e) => {
    state.framework = e.target.value;
    state.port = defaultPorts[state.framework] || state.port;
    renderSummary();
  });

  stepContent.querySelectorAll('input[name="frontendFramework"]').forEach((input) => {
    input.addEventListener("change", (e) => {
      state.frontendFramework = e.target.value;
      render();
    });
  });
}

function renderServicesStep() {
  const services = [
    ["postgres", "PostgreSQL", "Base de datos SQL robusta y generalista.", "datos persistentes"],
    ["mysql", "MySQL", "Base de datos SQL muy extendida en web.", "datos persistentes"],
    ["redis", "Redis", "Caché, sesiones, rate limits o colas ligeras.", "memoria / caché"],
    ["nginx", "Nginx", "Proxy inverso y punto de entrada HTTP.", "entrada HTTP"],
    ["rabbitmq", "RabbitMQ", "Broker para mensajería y trabajos asíncronos.", "mensajería"],
    ["mongo", "MongoDB", "Base de datos orientada a documentos.", "datos persistentes"]
  ];
  const dbCount = ["postgres", "mysql", "mongo"].filter(s => state.services.has(s)).length;

  stepContent.innerHTML = `
    <h3 class="section-title">Compón el entorno alrededor de tu aplicación</h3>
    <p class="section-copy">Cada selección se convertirá en un servicio de <code>compose.yml</code>. Docker crea una red interna para que los servicios puedan comunicarse por su nombre.</p>
    ${guide("↔", "Regla práctica", "Dentro de Compose, tu app no debería conectarse a PostgreSQL usando localhost. Usará el nombre del servicio, por ejemplo postgres:5432, porque localhost dentro del contenedor apunta al propio contenedor.")}
    ${dbCount > 1 ? guide("!", "Has elegido varias bases de datos", "Es válido si tu arquitectura lo necesita, pero para un proyecto inicial normalmente conviene elegir una sola base de datos principal.", "warning") : ""}

    <div class="toggle-list">
      ${services.map(([value, title, text, use]) => `
        <label class="service-card">
          <input type="checkbox" value="${value}" ${state.services.has(value) ? "checked" : ""} />
          <span><strong>${title}</strong><small>${text}</small></span>
          <span class="service-use">${use}</span>
        </label>`).join("")}
    </div>

    <div class="decision-box"><h4>¿Qué hace <code>depends_on</code>?</h4><p>Indica el orden de creación de servicios, pero por sí solo no garantiza que una base de datos ya esté lista para aceptar conexiones. En proyectos reales conviene combinarlo con <code>healthcheck</code> o con lógica de reintento en la aplicación.</p></div>`;

  stepContent.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    input.addEventListener("change", (e) => {
      if (e.target.checked) state.services.add(e.target.value);
      else state.services.delete(e.target.value);
      render();
    });
  });
}

function renderDockerStep() {
  stepContent.innerHTML = `
    <h3 class="section-title">Decide cómo expones y construyes la aplicación</h3>
    <p class="section-copy">El puerto publicado conecta tu máquina con el proceso del contenedor. La estrategia de producción cambia cómo instalamos dependencias o construimos la imagen.</p>
    ${guide("→", "Host → contenedor", `Con <code>\"${state.port}:${state.port}\"</code>, las peticiones a localhost:${state.port} se redirigen al puerto ${state.port} dentro del contenedor. <code>EXPOSE</code> documenta el puerto; <code>ports</code> es lo que realmente lo publica.`)}

    <div class="two-cols">
      <div class="field">
        <label for="port">Puerto de la aplicación</label>
        <input id="port" type="number" min="1" max="65535" value="${state.port}" />
        <div class="field-help">Debe coincidir con el puerto donde escucha el servidor dentro del contenedor.</div>
      </div>
      <div class="field">
        <span>Estrategia</span>
        <label class="inline-check"><input id="production" type="checkbox" ${state.production ? "checked" : ""} /> Preparar una imagen más orientada a producción</label>
        <div class="field-help">En Node omite dependencias de desarrollo. En Go ya usamos un build multi-stage para separar compilación y ejecución.</div>
      </div>
    </div>

    <div class="decision-box"><h4>Por qué usamos <code>.dockerignore</code></h4><p>Docker envía un contexto de build al daemon. Excluir <code>node_modules</code>, entornos virtuales, Git, builds previos o secretos reduce el contexto, mejora la caché y evita copiar archivos innecesarios dentro de la imagen.</p></div>

    <div class="readiness">
      <div class="check-row"><span class="check-dot">✓</span><span>Puerto válido dentro del rango TCP/UDP.</span></div>
      <div class="check-row"><span class="check-dot">✓</span><span>Variables sensibles irán a un archivo de entorno de ejemplo, no incrustadas en la imagen.</span></div>
      <div class="check-row"><span class="check-dot">✓</span><span>Los datos persistentes de bases de datos usarán volúmenes nombrados.</span></div>
    </div>`;

  document.querySelector("#port").addEventListener("input", (e) => {
    const value = Number(e.target.value);
    state.port = Number.isFinite(value) ? Math.max(1, Math.min(65535, value)) : 8000;
    renderSummary();
  });
  document.querySelector("#production").addEventListener("change", (e) => { state.production = e.target.checked; renderSummary(); });
}

function dockerfileTemplate() {
  if (state.runtime === "python") {
    const command = state.framework === "fastapi"
      ? `CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "${state.port}"]`
      : state.framework === "django"
        ? `CMD ["python", "manage.py", "runserver", "0.0.0.0:${state.port}"]`
        : `CMD ["python", "app.py"]`;
    return `FROM python:3.12-slim\n\nWORKDIR /app\n\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\n\nCOPY . .\n\nEXPOSE ${state.port}\n\n${command}`;
  }
  if (state.runtime === "node") {
    return `FROM node:22-alpine\n\nWORKDIR /app\n\nCOPY package*.json ./\nRUN npm ci${state.production ? " --omit=dev" : ""}\n\nCOPY . .\n\nEXPOSE ${state.port}\n\nCMD ["npm", "run", "${state.production ? "start" : "dev"}"]`;
  }
  return `FROM golang:1.24-alpine AS builder\nWORKDIR /app\nCOPY . .\nRUN go build -o server .\n\nFROM alpine:3.21\nWORKDIR /app\nCOPY --from=builder /app/server ./server\nEXPOSE ${state.port}\nCMD ["./server"]`;
}

function serviceBlock(service) {
  const blocks = {
    postgres: `  postgres:\n    image: postgres:17-alpine\n    environment:\n      POSTGRES_DB: app\n      POSTGRES_USER: app\n      POSTGRES_PASSWORD: app\n    volumes:\n      - postgres_data:/var/lib/postgresql/data`,
    mysql: `  mysql:\n    image: mysql:9\n    environment:\n      MYSQL_DATABASE: app\n      MYSQL_USER: app\n      MYSQL_PASSWORD: app\n      MYSQL_ROOT_PASSWORD: root\n    volumes:\n      - mysql_data:/var/lib/mysql`,
    redis: `  redis:\n    image: redis:8-alpine`,
    nginx: `  nginx:\n    image: nginx:alpine\n    ports:\n      - "80:80"`,
    rabbitmq: `  rabbitmq:\n    image: rabbitmq:4-management-alpine\n    ports:\n      - "15672:15672"`,
    mongo: `  mongo:\n    image: mongo:8\n    volumes:\n      - mongo_data:/data/db`
  };
  return blocks[service];
}

function composeTemplate() {
  const services = [...state.services];
  const depends = services.length ? `\n    depends_on:\n${services.map(s => `      - ${s}`).join("\n")}` : "";
  const blocks = services.map(serviceBlock).join("\n\n");
  const volumes = services.filter(s => ["postgres", "mysql", "mongo"].includes(s));
  return `services:\n  app:\n    build:\n      context: .\n    ports:\n      - "${state.port}:${state.port}"${depends}${blocks ? `\n\n${blocks}` : ""}${volumes.length ? `\n\nvolumes:\n${volumes.map(v => `  ${v}_data:`).join("\n")}` : ""}`;
}

function envTemplate() {
  const lines = [`APP_PORT=${state.port}`, `APP_ENV=${state.production ? "production" : "development"}`];
  if (state.services.has("postgres")) lines.push("DATABASE_URL=postgresql://app:app@postgres:5432/app");
  if (state.services.has("mysql")) lines.push("MYSQL_URL=mysql://app:app@mysql:3306/app");
  if (state.services.has("redis")) lines.push("REDIS_URL=redis://redis:6379/0");
  if (state.services.has("mongo")) lines.push("MONGO_URL=mongodb://mongo:27017/app");
  if (state.services.has("rabbitmq")) lines.push("AMQP_URL=amqp://guest:guest@rabbitmq:5672");
  return `${lines.join("\n")}\n`;
}

function dockerignoreTemplate() {
  return `.git\n.gitignore\n.env\nnode_modules\n__pycache__\n*.pyc\n.venv\ndist\nbuild\ncoverage\n.DS_Store\n`;
}

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
    ["build.context", "Indica desde qué carpeta se envía el contexto para construir la imagen de la app."],
    ["ports", "Publica un puerto del contenedor en tu máquina con formato host:contenedor."],
    ["depends_on", "Expresa dependencias de arranque entre servicios; no sustituye un healthcheck de disponibilidad."],
    ["environment", "Inyecta variables al contenedor. En producción conviene gestionar secretos fuera del YAML."],
    ["volumes", "Mantiene datos importantes fuera del ciclo de vida efímero del contenedor."]
  ];
  const env = [
    ["APP_*", "Configuración de la aplicación que puede variar entre desarrollo, pruebas y producción."],
    ["*_URL", "Usa nombres de servicio de Compose como hostname para comunicar contenedores dentro de su red."],
    [".env.example", "Sirve de contrato de configuración. Se comparte sin secretos reales para documentar variables necesarias."]
  ];
  const ignore = [
    [".env", "Evita incorporar secretos locales al contexto y, potencialmente, a la imagen."],
    ["node_modules / .venv", "Las dependencias deberían instalarse dentro de la imagen para que correspondan con su sistema operativo."],
    [".git", "El historial no es necesario para ejecutar la aplicación y aumenta el contexto de build."],
    ["dist / build", "Evita arrastrar artefactos locales que pueden estar desactualizados o ser incompatibles."]
  ];
  return fileName === "Dockerfile" ? commonDockerfile : fileName === "compose.yml" ? compose : fileName === ".env.example" ? env : ignore;
}

function commandRunbook() {
  return [
    ["docker compose config", "Valida la sintaxis, resuelve variables y enseña la configuración final. Úsalo antes de arrancar.", ""],
    ["docker compose build", "Construye la imagen de la app. Docker reutiliza capas en caché cuando sus entradas no han cambiado.", ""],
    ["docker compose up -d", "Crea y arranca los servicios en segundo plano. Usa -d para recuperar tu terminal.", ""],
    ["docker compose ps", "Muestra el estado y puertos de los contenedores del proyecto.", ""],
    ["docker compose logs -f app", "Sigue los logs del servicio app. Es el primer sitio que mirar cuando algo no arranca.", ""],
    ["docker compose down", "Detiene y elimina contenedores y red del proyecto, pero conserva por defecto los volúmenes nombrados.", "warning"],
    ["docker compose down -v", "También elimina los volúmenes del proyecto. Puede borrar datos persistentes de tus bases de datos.", "danger"]
  ];
}

function copyText(value, button) {
  if (!navigator.clipboard) {
    button.textContent = "Copia manual";
    return;
  }
  navigator.clipboard.writeText(value).then(() => {
    const original = button.textContent;
    button.textContent = "Copiado ✓";
    setTimeout(() => { button.textContent = original; }, 1200);
  }).catch(() => { button.textContent = "Copia manual"; });
}

function renderGenerateStep() {
  const files = {
    "Dockerfile": dockerfileTemplate(),
    "compose.yml": composeTemplate(),
    ".env.example": envTemplate(),
    ".dockerignore": dockerignoreTemplate()
  };
  const current = files[state.previewFile] || files.Dockerfile;
  const explanations = explanationsFor(state.previewFile);

  stepContent.innerHTML = `
    <h3 class="section-title">Archivos listos. Ahora entiende qué vas a ejecutar.</h3>
    <p class="section-copy">La configuración es útil, pero el objetivo del wizard es que sepas modificarla y diagnosticarla sin depender del generador.</p>
    ${guide("✓", "Configuración coherente", `Se generará una app ${esc(state.runtime)} / ${esc(frameworkLabels[state.framework])} en el puerto ${state.port}, con ${state.services.size} servicio(s) auxiliar(es).`, "success")}

    <div class="preview-tabs">
      ${Object.keys(files).map(name => `<button class="preview-tab ${state.previewFile === name ? "active" : ""}" data-preview="${esc(name)}" type="button">${esc(name)}</button>`).join("")}
    </div>

    <div class="preview-layout">
      <article class="code-card">
        <div class="code-head"><strong>${esc(state.previewFile)}</strong><button class="copy-btn" id="copy-current" type="button">Copiar archivo</button></div>
        <pre>${esc(current)}</pre>
      </article>
      <aside class="explain-panel">
        <div class="explain-panel-head"><strong>Por qué está aquí</strong></div>
        <div class="explain-list">${explanations.map(([token, text]) => `<div class="explain-item"><span class="explain-token">${esc(token)}</span><p>${esc(text)}</p></div>`).join("")}</div>
      </aside>
    </div>

    <div class="download-actions">
      ${Object.keys(files).map(name => `<button class="download-btn" data-download="${esc(name)}" type="button">Descargar ${esc(name)}</button>`).join("")}
    </div>

    <section class="runbook">
      <h4>Runbook recomendado: del YAML a un entorno funcionando</h4>
      <div class="command-list">
        ${commandRunbook().map(([command, reason, type], index) => `
          <div class="command-step ${type}">
            <span class="command-number">${index + 1}</span>
            <div class="command-main">
              <div class="command-line-row"><code>${esc(command)}</code><button class="small-copy" data-command="${esc(command)}" type="button">Copiar</button></div>
              <p>${esc(reason)}</p>
            </div>
          </div>`).join("")}
      </div>
    </section>

    <div class="info-box warning-box"><strong>Importante:</strong> los usuarios y contraseñas incluidos son valores de desarrollo. No uses credenciales reales dentro de un Dockerfile ni subas un <code>.env</code> con secretos al repositorio.</div>`;

  stepContent.querySelectorAll("[data-preview]").forEach(button => {
    button.addEventListener("click", () => { state.previewFile = button.dataset.preview; renderStepContent(); });
  });
  document.querySelector("#copy-current").addEventListener("click", (e) => copyText(current, e.currentTarget));
  stepContent.querySelectorAll("[data-download]").forEach(button => {
    button.addEventListener("click", () => downloadFile(button.dataset.download, files[button.dataset.download]));
  });
  stepContent.querySelectorAll("[data-command]").forEach(button => {
    button.addEventListener("click", () => copyText(button.dataset.command, button));
  });
}

function downloadFile(name, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function renderStepContent() {
  [renderProjectStep, renderTechnologyStep, renderServicesStep, renderDockerStep, renderGenerateStep][state.step]();
}

function render() {
  renderSteps();
  renderSummary();
  renderCommandCoach();
  renderStepContent();
  titleEl.textContent = steps[state.step].title;
  descriptionEl.textContent = steps[state.step].subtitle;
  backBtn.disabled = state.step === 0;
  nextBtn.disabled = state.step === 0 && !projectNameIsValid();
  nextBtn.textContent = state.step === steps.length - 1 ? "Volver al inicio" : "Siguiente →";
}

function reset() {
  Object.assign(state, {
    step: 0, name: "mi-proyecto", appType: "api", runtime: "python",
    framework: "fastapi", port: 8000, production: false,
    frontendFramework: "react", frontendPort: 5173, previewFile: "Dockerfile"
  });
  state.services = new Set(["postgres"]);
  render();
}

backBtn.addEventListener("click", () => { if (state.step > 0) { state.step -= 1; render(); } });
nextBtn.addEventListener("click", () => { if (state.step < steps.length - 1) { state.step += 1; render(); } else reset(); });
resetBtn.addEventListener("click", reset);

render();