// Docker Wizard Pro: arquitectura visual y paso Docker guiado.
function architectureDiagram() {
  const labels = {
    postgres: ["PostgreSQL", "SQL"],
    mysql: ["MySQL", "SQL"],
    redis: ["Redis", "caché"],
    rabbitmq: ["RabbitMQ", "mensajería"],
    mongo: ["MongoDB", "documentos"]
  };
  const infra = [...state.services].filter(service => service !== "nginx");
  const runtime = state.runtime === "node" ? "Node.js" : state.runtime[0].toUpperCase() + state.runtime.slice(1);
  const entry = state.services.has("nginx")
    ? `<div class="arch-node arch-client"><span>Cliente</span><small>HTTP</small></div><span class="arch-arrow">→</span><div class="arch-node arch-proxy"><span>Nginx</span><small>:80 · proxy</small></div><span class="arch-arrow">→</span>`
    : `<div class="arch-node arch-client"><span>Cliente</span><small>HTTP</small></div><span class="arch-arrow">→</span>`;

  return `
    <section class="architecture-card" aria-label="Arquitectura generada">
      <div class="architecture-head">
        <div><span class="eyebrow">ARQUITECTURA</span><h4>Cómo se conectan los contenedores</h4></div>
        <span class="architecture-badge">${state.services.size + 1} servicio${state.services.size ? "s" : ""}</span>
      </div>
      <div class="arch-flow">
        ${entry}
        <div class="arch-node arch-app"><span>${esc(frameworkLabels[state.framework])}</span><small>${esc(runtime)} · :${state.port}</small></div>
      </div>
      <div class="arch-connector"><span>red backend</span></div>
      <div class="arch-services">
        ${infra.length ? infra.map(service => {
          const [name, role] = labels[service] || [service, "servicio"];
          return `<div class="arch-service"><span class="health-dot" aria-hidden="true"></span><div><strong>${esc(name)}</strong><small>${esc(role)} · healthcheck</small></div></div>`;
        }).join("") : `<div class="arch-empty">La aplicación no tiene dependencias internas adicionales.</div>`}
      </div>
      <p class="architecture-note">${state.services.has("nginx") ? "Nginx y la app comparten la red frontend. La app también entra en backend para hablar con sus dependencias; las bases de datos no quedan expuestas a la red frontend." : "La app publica su puerto directamente al host. Sus dependencias quedan en una red backend explícita."}</p>
    </section>`;
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
    <p class="section-copy">Cada selección se convertirá en un servicio real de <code>compose.yml</code>. El diagrama se actualiza al instante para que veas la topología antes de generar archivos.</p>
    ${guide("↔", "Regla práctica", "Dentro de Compose, tu app no se conecta a PostgreSQL usando localhost. Usa el nombre del servicio, por ejemplo postgres:5432, porque localhost dentro del contenedor apunta al propio contenedor.")}
    ${dbCount > 1 ? guide("!", "Has elegido varias bases de datos", "Es válido si tu arquitectura lo necesita, pero para un proyecto inicial normalmente conviene elegir una sola base de datos principal.", "warning") : ""}

    <div class="toggle-list">
      ${services.map(([value, title, text, use]) => `
        <label class="service-card">
          <input type="checkbox" value="${value}" ${state.services.has(value) ? "checked" : ""} />
          <span><strong>${title}</strong><small>${text}</small></span>
          <span class="service-use">${use}</span>
        </label>`).join("")}
    </div>

    ${architectureDiagram()}

    <div class="decision-box"><h4>Arranque seguro, no solo ordenado</h4><p>El archivo generado añade <code>healthcheck</code> a las dependencias y usa <code>condition: service_healthy</code>. Así, <code>depends_on</code> deja de significar solo “crea primero” y pasa a esperar a que el servicio pueda responder.</p></div>`;

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
    <p class="section-copy">El puerto publicado conecta tu máquina con el proceso del contenedor. El generador añade además una base operativa más segura para que el resultado sea útil fuera de una demo.</p>
    ${guide("→", "Host → contenedor", state.services.has("nginx")
      ? `Como has añadido Nginx, el host publica el puerto 80 y Nginx reenvía el tráfico a <code>app:${state.port}</code>. La app no necesita quedar expuesta directamente en el compose base.`
      : `Con <code>"${state.port}:${state.port}"</code>, las peticiones a localhost:${state.port} se redirigen al puerto ${state.port} dentro del contenedor. <code>EXPOSE</code> documenta el puerto; <code>ports</code> es lo que realmente lo publica.`)}

    <div class="two-cols">
      <div class="field">
        <label for="port">Puerto de la aplicación</label>
        <input id="port" type="number" min="1" max="65535" value="${state.port}" />
        <div class="field-help">Debe coincidir con el puerto donde escucha el servidor dentro del contenedor.</div>
      </div>
      <div class="field">
        <span>Estrategia de imagen</span>
        <label class="inline-check"><input id="production" type="checkbox" ${state.production ? "checked" : ""} /> Reducir dependencias de desarrollo cuando sea posible</label>
        <div class="field-help">Afecta al Dockerfile. Además generamos overlays separados para ejecutar Compose en modo desarrollo o production-like.</div>
      </div>
    </div>

    <div class="professional-grid">
      <article class="professional-card"><span class="professional-icon">♥</span><strong>Healthchecks</strong><p>Las dependencias anuncian cuándo están preparadas antes de que arranque la app.</p></article>
      <article class="professional-card"><span class="professional-icon">⌁</span><strong>Redes separadas</strong><p>Backend aísla datos; si hay Nginx, frontend solo conecta proxy y aplicación.</p></article>
      <article class="professional-card"><span class="professional-icon">◇</span><strong>Persistencia</strong><p>Las bases de datos usan volúmenes nombrados para sobrevivir al ciclo de vida del contenedor.</p></article>
      <article class="professional-card"><span class="professional-icon">••</span><strong>Secrets preparados</strong><p>Compose referencia variables. <code>.env.example</code> documenta valores, pero el <code>.env</code> real queda fuera de la imagen.</p></article>
    </div>

    <div class="decision-box"><h4>Dos overlays, un Compose base</h4><p>Se generan <code>compose.dev.yml</code> y <code>compose.prod.yml</code>. El primero describe ajustes locales; el segundo añade reinicio automático y exige contraseñas explícitas en los servicios que las necesitan. Es una base production-like, no sustituye un despliegue endurecido ni un gestor de secretos.</p></div>

    <div class="readiness">
      <div class="check-row"><span class="check-dot">✓</span><span><code>.dockerignore</code> evita enviar Git, secretos y dependencias locales al contexto de build.</span></div>
      <div class="check-row"><span class="check-dot">✓</span><span>Las credenciales no se incrustan en el Dockerfile.</span></div>
      <div class="check-row"><span class="check-dot">✓</span><span>Si eliges Nginx, también se genera <code>nginx.conf</code> con el proxy hacia la app.</span></div>
    </div>`;

  document.querySelector("#port").addEventListener("input", (e) => {
    const value = Number(e.target.value);
    state.port = Number.isFinite(value) ? Math.max(1, Math.min(65535, value)) : 8000;
    renderSummary();
  });
  document.querySelector("#production").addEventListener("change", (e) => { state.production = e.target.checked; renderSummary(); });
}
