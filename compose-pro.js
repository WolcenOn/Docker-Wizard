// Docker Wizard Pro: generación Compose con healthchecks, redes y overlays.
function serviceBlock(service) {
  const health = {
    postgres: `    healthcheck:
      test:
        - CMD-SHELL
        - pg_isready -U $\${POSTGRES_USER:-app} -d $\${POSTGRES_DB:-app}
      interval: 5s
      timeout: 3s
      retries: 10`,
    mysql: `    healthcheck:
      test:
        - CMD-SHELL
        - mysqladmin ping -h localhost -uroot -p"$\${MYSQL_ROOT_PASSWORD}" --silent
      interval: 5s
      timeout: 5s
      retries: 12`,
    redis: `    healthcheck:
      test:
        - CMD-SHELL
        - redis-cli -a "$\${REDIS_PASSWORD}" ping | grep PONG
      interval: 5s
      timeout: 3s
      retries: 10`,
    rabbitmq: `    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "-q", "ping"]
      interval: 8s
      timeout: 5s
      retries: 10`,
    mongo: `    healthcheck:
      test:
        - CMD-SHELL
        - mongosh --quiet -u "$\${MONGO_INITDB_ROOT_USERNAME}" -p "$\${MONGO_INITDB_ROOT_PASSWORD}" --authenticationDatabase admin --eval "quit(db.adminCommand('ping').ok ? 0 : 2)"
      interval: 8s
      timeout: 5s
      retries: 10`
  };

  const blocks = {
    postgres: `  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: \${POSTGRES_DB:-app}
      POSTGRES_USER: \${POSTGRES_USER:-app}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:-change-me}
${health.postgres}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - backend`,
    mysql: `  mysql:
    image: mysql:9
    environment:
      MYSQL_DATABASE: \${MYSQL_DATABASE:-app}
      MYSQL_USER: \${MYSQL_USER:-app}
      MYSQL_PASSWORD: \${MYSQL_PASSWORD:-change-me}
      MYSQL_ROOT_PASSWORD: \${MYSQL_ROOT_PASSWORD:-change-me-root}
${health.mysql}
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - backend`,
    redis: `  redis:
    image: redis:8-alpine
    environment:
      REDIS_PASSWORD: \${REDIS_PASSWORD:-change-me}
    command: ["redis-server", "--requirepass", "\${REDIS_PASSWORD:-change-me}"]
${health.redis}
    networks:
      - backend`,
    nginx: `  nginx:
    image: nginx:1.27-alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - app
    healthcheck:
      test: ["CMD-SHELL", "nginx -t || exit 1"]
      interval: 10s
      timeout: 3s
      retries: 5
    networks:
      - frontend`,
    rabbitmq: `  rabbitmq:
    image: rabbitmq:4-management-alpine
    environment:
      RABBITMQ_DEFAULT_USER: \${RABBITMQ_USER:-app}
      RABBITMQ_DEFAULT_PASS: \${RABBITMQ_PASSWORD:-change-me}
${health.rabbitmq}
    ports:
      - "15672:15672"
    networks:
      - backend`,
    mongo: `  mongo:
    image: mongo:8
    environment:
      MONGO_INITDB_ROOT_USERNAME: \${MONGO_USER:-app}
      MONGO_INITDB_ROOT_PASSWORD: \${MONGO_PASSWORD:-change-me}
${health.mongo}
    volumes:
      - mongo_data:/data/db
    networks:
      - backend`
  };
  return blocks[service];
}

function composeTemplate() {
  const services = [...state.services];
  const dependencies = services.filter(service => service !== "nginx");
  const depends = dependencies.length
    ? `\n    depends_on:\n${dependencies.map(service => `      ${service}:\n        condition: service_healthy`).join("\n")}`
    : "";
  const appExposure = state.services.has("nginx")
    ? `    expose:\n      - "${state.port}"`
    : `    ports:\n      - "${state.port}:${state.port}"`;
  const appNetworks = state.services.has("nginx")
    ? `    networks:\n      - frontend\n      - backend`
    : `    networks:\n      - backend`;
  const blocks = services.map(serviceBlock).join("\n\n");
  const volumes = services.filter(service => ["postgres", "mysql", "mongo"].includes(service));

  return `services:\n  app:\n    build:\n      context: .\n${appExposure}\n    env_file:\n      - .env\n    environment:\n      APP_ENV: \${APP_ENV:-development}${depends}\n${appNetworks}${blocks ? `\n\n${blocks}` : ""}${volumes.length ? `\n\nvolumes:\n${volumes.map(v => `  ${v}_data:`).join("\n")}` : ""}\n\nnetworks:\n  backend:\n    driver: bridge${state.services.has("nginx") ? `\n  frontend:\n    driver: bridge` : ""}`;
}

function composeDevTemplate() {
  const sourceMount = state.runtime === "python"
    ? `\n    volumes:\n      - .:/app`
    : "";
  const directPort = state.services.has("nginx")
    ? `\n    ports:\n      - "${state.port}:${state.port}"`
    : "";
  return `services:\n  app:\n    environment:\n      APP_ENV: development${sourceMount}${directPort}\n`;
}

function productionOverrides(service) {
  const blocks = {
    postgres: `  postgres:\n    restart: unless-stopped\n    environment:\n      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:?Define POSTGRES_PASSWORD in .env}`,
    mysql: `  mysql:\n    restart: unless-stopped\n    environment:\n      MYSQL_PASSWORD: \${MYSQL_PASSWORD:?Define MYSQL_PASSWORD in .env}\n      MYSQL_ROOT_PASSWORD: \${MYSQL_ROOT_PASSWORD:?Define MYSQL_ROOT_PASSWORD in .env}`,
    redis: `  redis:\n    restart: unless-stopped\n    environment:\n      REDIS_PASSWORD: \${REDIS_PASSWORD:?Define REDIS_PASSWORD in .env}\n    command: ["redis-server", "--requirepass", "\${REDIS_PASSWORD:?Define REDIS_PASSWORD in .env}"]`,
    rabbitmq: `  rabbitmq:\n    restart: unless-stopped\n    environment:\n      RABBITMQ_DEFAULT_USER: \${RABBITMQ_USER:-app}\n      RABBITMQ_DEFAULT_PASS: \${RABBITMQ_PASSWORD:?Define RABBITMQ_PASSWORD in .env}`,
    mongo: `  mongo:\n    restart: unless-stopped\n    environment:\n      MONGO_INITDB_ROOT_USERNAME: \${MONGO_USER:-app}\n      MONGO_INITDB_ROOT_PASSWORD: \${MONGO_PASSWORD:?Define MONGO_PASSWORD in .env}`,
    nginx: `  nginx:\n    restart: unless-stopped`
  };
  return blocks[service];
}

function composeProdTemplate() {
  const extras = [...state.services].map(productionOverrides).filter(Boolean);
  return `services:\n  app:\n    restart: unless-stopped\n    environment:\n      APP_ENV: production${extras.length ? `\n${extras.join("\n")}` : ""}\n`;
}

function nginxConfigTemplate() {
  return `server {\n    listen 80;\n    server_name _;\n\n    location / {\n        proxy_pass http://app:${state.port};\n        proxy_http_version 1.1;\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto $scheme;\n    }\n}\n`;
}

function envTemplate() {
  const lines = [
    "# Copia este archivo como .env y cambia las credenciales antes de un entorno compartido.",
    `APP_PORT=${state.port}`,
    `APP_ENV=${state.production ? "production" : "development"}`
  ];
  if (state.services.has("postgres")) lines.push(
    "POSTGRES_DB=app",
    "POSTGRES_USER=app",
    "POSTGRES_PASSWORD=change-me",
    "DATABASE_URL=postgresql://app:change-me@postgres:5432/app"
  );
  if (state.services.has("mysql")) lines.push(
    "MYSQL_DATABASE=app",
    "MYSQL_USER=app",
    "MYSQL_PASSWORD=change-me",
    "MYSQL_ROOT_PASSWORD=change-me-root",
    "MYSQL_URL=mysql://app:change-me@mysql:3306/app"
  );
  if (state.services.has("redis")) lines.push(
    "REDIS_PASSWORD=change-me",
    "REDIS_URL=redis://:change-me@redis:6379/0"
  );
  if (state.services.has("mongo")) lines.push(
    "MONGO_USER=app",
    "MONGO_PASSWORD=change-me",
    "MONGO_URL=mongodb://app:change-me@mongo:27017/app?authSource=admin"
  );
  if (state.services.has("rabbitmq")) lines.push(
    "RABBITMQ_USER=app",
    "RABBITMQ_PASSWORD=change-me",
    "AMQP_URL=amqp://app:change-me@rabbitmq:5672"
  );
  return `${lines.join("\n")}\n`;
}
