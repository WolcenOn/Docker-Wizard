// Docker Wizard Pro: pantalla final y archivos adicionales.
function renderGenerateStep() {
  const files = {
    "Dockerfile": dockerfileTemplate(),
    "compose.yml": composeTemplate(),
    "compose.dev.yml": composeDevTemplate(),
    "compose.prod.yml": composeProdTemplate(),
    ".env.example": envTemplate(),
    ".dockerignore": dockerignoreTemplate()
  };
  if (state.services.has("nginx")) files["nginx.conf"] = nginxConfigTemplate();

  if (!files[state.previewFile]) state.previewFile = "Dockerfile";
  const current = files[state.previewFile];
  const explanations = explanationsFor(state.previewFile);

  stepContent.innerHTML = `
    <h3 class="section-title">Archivos listos. Ahora entiende la arquitectura y cómo operarla.</h3>
    <p class="section-copy">El resultado separa configuración base, ajustes por entorno y secretos. Antes de descargar nada puedes inspeccionar tanto la topología como cada decisión del YAML.</p>
    ${guide("✓", "Baseline operativo", `Se generará una app ${esc(state.runtime)} / ${esc(frameworkLabels[state.framework])} en el puerto ${state.port}, con healthchecks, redes explícitas y ${state.services.size} servicio(s) auxiliar(es).`, "success")}

    ${architectureDiagram()}

    <div class="environment-strip">
      <div><span class="environment-label">DEV</span><strong>compose.yml + compose.dev.yml</strong><small>Ajustes cómodos para trabajar y depurar localmente.</small></div>
      <div><span class="environment-label prod">PROD-LIKE</span><strong>compose.yml + compose.prod.yml</strong><small>Reinicio automático y guardas para credenciales obligatorias.</small></div>
    </div>

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
      <h4>Runbook recomendado: validar → arrancar → observar → detener</h4>
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

    <div class="info-box warning-box"><strong>Producción real:</strong> el overlay de producción es una guía segura para aprender y probar. Antes de Internet público añade TLS, backups, actualización de imágenes, observabilidad, usuarios no-root cuando aplique y secretos gestionados fuera del repositorio.</div>`;

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

render();
