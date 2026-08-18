### Oracle Database XE 21c with Docker (Cont)

> "The world belongs to those who don’t feel. The essential condition for being a practical man is the absence of sensibility. ... The one who ordains is the one who doesn’t feel. The one who succeeds is the one who thinks only of what is needed for success." <br /><br />"O mundo é de quem não sente. A condição essencial para se ser um homem prático é a ausência de sensibilidade. A qualidade principal na prática. ... Manda quem não sente. Vence quem pensa só o que precisa para vencer.."<br/>--- The Book of Disquiet by Fernando Pessoa


#### Prologue
It is tedious to install software again and again; it is even more tedious to think about the tedium itself. In application development, nine out of ten times you need persistent storage, may it be SQL, NoSQL, or simply a key‑value store.


#### I. Project Structure
```
  .
  ├── package.json
  ├── .env                     # Environment variables (DB connection, secrets)
  ├── docker-compose.yml       # Container orchestration
  ├── Makefile                 # Automation tasks
  ├── init.sql                 # Initialization script executed on first boot
  ├── oracle_data/             # Persistent storage for Oracle XE 21c data
  ├── prometheus.yml           # Configuration file for Prometheus
  ├── prometheus_data/         # Persistent storage for Prometheus data
  ├── grafana_data/            # Persistent storage for Grafana data
  ├── Dockerfile               # Docker file for API Gateway
  ├── src/
  │   ├── api.js               # Main Express app entry
  │   ├── swagger.js           # Swagger configuration
  │   ├── swagger.html         # Custom footer
  │   ├── yrunner.js           # YRunner utility
  │   ├── runSqlPlus.js        # SQLPlus NodeJS wrapper 
  │   ├── testConn.js          # Test connection
  │   ├── config/              # Configuration folder
  │   │   └── dbConfig.js      # Oracle database config
  │   ├── routes/              # Route definitions
  │   │   └── yrunnerRoute.js  # YRunner route
  │   ├── middleware/          # Custom middleware
  │   │   └── handle404.js     # Catch-all 404 handler
  │   └── utils/               # Utility folder
  │       └── lowerKeys.js     # Convert keys to lowercase
  ├── sample/                  # Sample data folder
  │   └── load_sample.sql      # Employes database
  ├── tool/                    # Tool folder
  │   ├── instantclient-basic-linux.x64-23.26.3.0.0.zip   # Oracle Instant Client
  │   └── instantclient-sqlplus-linux.x64-23.26.3.0.0.zip # SQLPlus Package
  └── docs/                    # Documentation folder
```


#### II. `.env`
```
ORACLE_IMAGE_NAME=gvenzl/oracle-xe:21.3.0
ORACLE_ROOT_PASSWORD=123456
ORACLE_DATABASE=mypdb
ORACLE_CONTAINER_NAME=oracle-db
ORACLE_DATA_DIR=./oracle_data

ORACLE_APP_USER=my_user
ORACLE_APP_USER_PASSWORD=my_password

API_IMAGE_NAME=albert0i/oracle-db-api-gateway:1.0
API_PORT=1522
```


#### III. `docker-compose.yml` 
```
#version: "3.8"

services:
  oracle-db:
    image: ${ORACLE_IMAGE_NAME}
    container_name: ${ORACLE_CONTAINER_NAME}
    ports:
      - "${ORACLE_PORT}:1521"
    environment:
      ORACLE_PASSWORD: ${ORACLE_ROOT_PASSWORD}
      ORACLE_DATABASE: ${ORACLE_DATABASE}
      APP_USER: ${ORACLE_APP_USER}
      APP_USER_PASSWORD: ${ORACLE_APP_USER_PASSWORD}
    volumes:
      - ${ORACLE_DATA_DIR}:/opt/oracle/oradata
      # Map your initialization script safely
      - ./init.sql:/container-entrypoint-initdb.d/init.sql:ro
    restart: unless-stopped

    healthcheck:
      test: ["CMD", "healthcheck.sh"]
      interval: 10s
      timeout: 5s
      retries: 10

  oracle-exporter:
    image: iamseth/oracledb_exporter:latest
    container_name: oracle-exporter
    environment:
      # Connects using system admin credentials to scrape global database activity
      DATA_SOURCE_NAME: "oracle://system:${ORACLE_ROOT_PASSWORD}@oracle-db:1521/${ORACLE_DATABASE}"
    ports:
      - "9161:9161"
    links:
      - oracle-db:oracle-db
    depends_on:
      oracle-db:
        condition: service_healthy
    restart: unless-stopped
    # http://localhost:9161/metrics

  prometheus:
    image: prom/prometheus:latest
    container_name: oracle-prometheus
    user: "1000:1000"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=15d'
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./prometheus_data:/prometheus
    ports:
      - "9091:9090"  # <-- Explicitly mapped to 9091 to avoid host port allocation conflicts
    depends_on:
      - oracle-exporter
    restart: unless-stopped
    # http://localhost:9091/targets

  grafana:
    image: grafana/grafana:latest
    container_name: oracle-grafana
    user: "1000:1000"
    ports:
      - "8080:3000"  # <-- Changed host port from 3000 to 8080
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - ./grafana_data:/var/lib/grafana
    depends_on:
      - prometheus
    restart: unless-stopped
    # http://localhost:8080/
    # Dashboard id: 13555

  oracle-db-api-gateway:
    image: albert0i/oracle-db-api-gateway:1.0
    container_name: oracle-db-api-gateway
    build:
      context: . # Ensures Docker reads from root (access to ./tool and ./src)
      dockerfile: Dockerfile
    ports:
      - "${API_PORT}:3000"
    env_file:
      - .env # Injects credentials directly into container memory securely
    environment:
      - ORACLE_HOST=oracle-db  # 2. OVERRIDES 'localhost' with the internal Docker service name
      - NODE_OPTIONS=--no-deprecation  # Silences the url.parse() warning    
    depends_on:
      oracle-db:
        condition: service_healthy    
    restart: always
```

#### VI. `Dockerfile`
```
# --- Stage 1: Build & Dependencies ---
FROM node:24-slim AS builder

# Install unzip to extract local archives
RUN apt-get update && apt-get install -y --no-install-recommends \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Create and switch to target directory for Oracle Instant Client
WORKDIR /opt/oracle

# Explicitly copy all zip files from host ./tool into the current working directory
COPY ./tool/*.zip ./

# Force overwrite (-o) to avoid interactive prompts due to META-INF file collisions
RUN unzip -o "*.zip" && rm *.zip

WORKDIR /app

# Copy dependency manifests first for efficient layer caching
COPY package*.json ./
RUN npm ci

# Copy the source code folder from host context ./src to image /app/src
COPY ./src ./src


# --- Stage 2: Production Runtime ---
FROM node:24-slim

# Install libaio1 runtime dependency required by the Oracle binary engines
RUN apt-get update && apt-get install -y --no-install-recommends \
    libaio1 \
    && rm -rf /var/lib/apt/lists/*

# Copy the pre-extracted Oracle Instant Client assets from the builder stage
COPY --from=builder /opt/oracle /opt/oracle

# Configure required environment paths cleanly without triggering warnings
ENV LD_LIBRARY_PATH=/opt/oracle/instantclient_23_26
ENV PATH=/opt/oracle/instantclient_23_26:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

WORKDIR /app

# Copy production node_modules and code assets from the builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src

# Expose internal application port
EXPOSE 3000

# Set Node environment flag to production
ENV NODE_ENV=production

# Application runtime entry point
CMD ["node", "src/api.js"]

#
# docker build -t albert0i/oracle-db-api-gateway:1.0 -f Dockerfile .
#
```


#### V. `Makefile`
```
cnf ?= .env
include $(cnf)
export $(shell sed 's/=.*//' $(cnf))

COMPOSE = docker compose

.PHONY: help up down restart ps logs prune test test-user build push config

#
# Deteccting the right PDB name...
#
ifneq ($(findstring xe,$(ORACLE_IMAGE_NAME)),)
    PDBNAME := XEPDB1
	IMAGE_TYPE = Express
else ifneq ($(findstring free,$(ORACLE_IMAGE_NAME)),)
    PDBNAME := FREEPDB1
	IMAGE_TYPE = Free
else
    PDBNAME := XEPDB1
	IMAGE_TYPE = Express
endif
# $(info ℹ️ Resolved Database PDBNAME: $(PDBNAME))


help:
	@echo
	@echo "Usage: make TARGET"
	@echo
	@echo "Oracle Database ${IMAGE_TYPE} Edition stack automation helper (Linux)"
	@echo
	@echo "Targets:"
	@echo "  up         start all services"
	@echo "  down       stop all services and delete volumes"
	@echo "  restart    restart services"
	@echo "  ps         show running containers"
	@echo "  logs       show logs"
	@echo "  prune      clear data volumes and logs (DANGER!)"
	@echo "  test       test if admin (system) connection is online"
	@echo "  test-user  test if app user (my_test_user) can read data"
	@echo "  build      build API gateway image"
	@echo "  push       push API gateway image to Docker Hub"
	@echo "  config     edit configuration"
	@echo " "

up:
	@mkdir -p $(ORACLE_DATA_DIR)
	$(COMPOSE) up -d --remove-orphans

down:
	$(COMPOSE) down -v

restart:
	$(COMPOSE) restart

ps:
	$(COMPOSE) ps

logs:
	$(COMPOSE) logs -f

prune:
	@echo "⚠️ Warning: Clearing data directories, volumes, and monitoring logs..."
	$(COMPOSE) down -v
	sudo rm -rf $(ORACLE_DATA_DIR) grafana_data prometheus_data || true
	
	@echo "🛠️ Re-creating clean local directories..."
	mkdir -p $(ORACLE_DATA_DIR) ./prometheus_data ./grafana_data
	
	@echo "🔒 Setting secure ownership and permission boundaries..."
	sudo chown -R 54321:54321 $(ORACLE_DATA_DIR)
	chown -R $$USER:$$USER ./grafana_data ./prometheus_data
	chmod 755 ./grafana_data ./prometheus_data
	@echo "✨ Prune completed successfully! Environment is fresh and clean."

test:
	@echo "Checking Oracle container health and system user credentials..."
	@if [ "$$(docker inspect -f '{{.State.Running}}' $(ORACLE_CONTAINER_NAME) 2>/dev/null)" != "true" ]; then \
		echo "❌ Connection failed! The Docker container '$(ORACLE_CONTAINER_NAME)' is stopped or down."; \
		exit 0; \
	elif docker exec -i $(ORACLE_CONTAINER_NAME) sh -c \
		'echo "SELECT 1 FROM DUAL;" | sqlplus -S system/$(ORACLE_ROOT_PASSWORD)@//${ORACLE_HOST}:${ORACLE_PORT}/${PDBNAME}' 2>&1 | grep -q "ORA-"; then \
		echo "❌ Connection failed! Database is still booting up or credentials mismatch."; \
		exit 0; \
	else \
		echo "🎉 Connection successful! Oracle ${IMAGE_TYPE} is online and ready."; \
	fi

test-user:
	@echo "Testing connection for custom user 'my_test_user' against ${PDBNAME}..."
	@if [ "$$(docker inspect -f '{{.State.Running}}' $(ORACLE_CONTAINER_NAME) 2>/dev/null)" != "true" ]; then \
		echo "❌ Connection failed! The Docker container '$(ORACLE_CONTAINER_NAME)' is stopped or down."; \
		exit 0; \
	else \
		( \
			echo "SET PAGESIZE 50"; \
			echo "SET LINESIZE 120"; \
			echo "COLUMN id FORMAT 9999"; \
			echo "COLUMN title FORMAT A80"; \
			echo "COLUMN status FORMAT A10"; \
			echo "SELECT id, title, status FROM todo_list;"; \
			echo "EXIT;"; \
		) | docker exec -i $(ORACLE_CONTAINER_NAME) sqlplus -S my_test_user/my_secure_password@//${ORACLE_HOST}:${ORACLE_PORT}/${PDBNAME}; \
	fi

# 1. Automated compilation target for the oracle gateway engine
build:
	@echo "Initializing build for $(API_IMAGE_NAME)..."
	docker build -t $(API_IMAGE_NAME) -f Dockerfile . --no-cache 

# 2. Automated distribution target to push the image to Docker Hub
push:
	@echo "Checking Docker Hub authorization..."
	@docker system info | grep -q "Username" || (echo "❌ Error: You must run 'docker login' first!" && exit 1)
	@echo "Pushing $(API_IMAGE_NAME) to Docker Hub..."
	docker push $(API_IMAGE_NAME)

config:
	nano .env
```


#### VI. Let’s get started!
Clone the repositry from [here](https://github.com/Albert0i/XE21c.git) and change into the folder. 
```
cp dotenv .env 

make prune
```
![alt make](img/make-cont.png)

![alt make up ps](img/make-cont-up-ps.png)

![alt grafana-1](img/grafana-1.png)

![alt grafana-2](img/grafana-2.png)

![alt api-gateway-1](img/api-gateway-1.png)

![alt api-gateway-2](img/api-gateway-2.png)

![alt api-gateway-3](img/api-gateway-3.png)


#### VII. `init.sql` 
```
-- 
-- ALTER SESSION to use the default pluggable database context.
-- Oracle XE: 
--      The user will be created in the default `XEPDB1`  pluggable database.
-- Oracle Free: 
--      The user will be created in the default `FREEPDB1` pluggable database. 
--
SET SERVEROUTPUT ON;

-- Block 1: Print ASCII Art Banner
BEGIN
    DBMS_OUTPUT.PUT_LINE('██╗███╗░░██╗██╗████████╗░░░░██████╗░██████╗░██╗░░░░░');
    DBMS_OUTPUT.PUT_LINE('██║████╗░██║██║╚══██╔══╝░░░██╔════╝██╔═══██╗██║░░░░░');
    DBMS_OUTPUT.PUT_LINE('██║██╔██╗██║██║░░░██║░░░░░░╚█████╗░██║██╗██║██║░░░░░');
    DBMS_OUTPUT.PUT_LINE('██║██║╚████║██║░░░██║░░░░░░░╚═══██╗╚██████╔╝██║░░░░░');
    DBMS_OUTPUT.PUT_LINE('██║██║░╚███║██║░░░██║░░░██╗██████╔╝░╚═██╔═╝░███████╗');
    DBMS_OUTPUT.PUT_LINE('╚═╝╚═╝░░╚══╝╚═╝░░░╚═╝░░░╚═╝╚═════╝░░░░╚═╝░░░╚══════╝');
END;
/

-- Block 2: Detect Image and Print Message FIRST, then End the Block (Flushing the Output)
VARIABLE g_target_pdb VARCHAR2(30);

DECLARE
    v_edition VARCHAR2(4000); 
BEGIN
    SELECT banner_full INTO v_edition FROM v$version WHERE ROWNUM = 1;

    IF INSTR(LOWER(v_edition), 'express') > 0 THEN
        DBMS_OUTPUT.PUT_LINE('[init.sql]: Detected Oracle XE Image. Selecting PDB: XEPDB1...');
        :g_target_pdb := 'XEPDB1';
    ELSIF INSTR(LOWER(v_edition), 'free') > 0 THEN
        DBMS_OUTPUT.PUT_LINE('[init.sql]: Detected Oracle Free Image. Selecting PDB: FREEPDB1...');
        :g_target_pdb := 'FREEPDB1';
    ELSE
        DBMS_OUTPUT.PUT_LINE('[init.sql]: Unrecognized database version. Defaulting to XEPDB1...');
        :g_target_pdb := 'XEPDB1';
    END IF;
END;
/

-- Block 3: Execute the Session Container Alteration (Safely after printing)
BEGIN
    EXECUTE IMMEDIATE 'ALTER SESSION SET CONTAINER = ' || :g_target_pdb;
END;
/

-- Block 4: Re-enable Server Output inside the new PDB container environment
SET SERVEROUTPUT ON;
BEGIN
    DBMS_OUTPUT.PUT_LINE('[init.sql]: Container switch verified. Initializing schema customization...');
END;
/


-- 1. Create a custom application user profile
CREATE USER my_test_user IDENTIFIED BY my_secure_password;

-- 2. Grant necessary development permissions
GRANT CONNECT, RESOURCE, CREATE VIEW TO my_test_user;

-- 3. Set unlimited storage space allocation for the user on the default tablespace
ALTER USER my_test_user QUOTA UNLIMITED ON USERS;

-- 4. Create a sample table under the new user schema context
CREATE TABLE my_test_user.todo_list (
    id          NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    title       VARCHAR2(100) NOT NULL,
    status      VARCHAR2(20) DEFAULT 'PENDING',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Insert initial seed sample records (12 total rows)
INSERT INTO my_test_user.todo_list (title) VALUES ('Fix the quantum interference device broken by Stuart Bloom');
INSERT INTO my_test_user.todo_list (title) VALUES ('Escape the repressive AI on the idyllic version of Earth');
INSERT INTO my_test_user.todo_list (title) VALUES ('Enlist a powerful wizard to help Bert find a sorcery gift');
INSERT INTO my_test_user.todo_list (title) VALUES ('Survive the post-apocalyptic Pasadena and avoid giant moths');
INSERT INTO my_test_user.todo_list (title) VALUES ('Barter canned vegetables and cat food for rare comic books');
INSERT INTO my_test_user.todo_list (title) VALUES ('Overthrow military dictator Barry Kripke in alternate reality');
INSERT INTO my_test_user.todo_list (title) VALUES ('Locate Denise after she mysteriously disappears in the multiverse');
INSERT INTO my_test_user.todo_list (title) VALUES ('Convince doctors in the mental institution that the multiverse is real');
INSERT INTO my_test_user.todo_list (title) VALUES ('Break out of the Matrix pods before reality resets again');
INSERT INTO my_test_user.todo_list (title) VALUES ('Undo the multiverse Armageddon accidentally unleashed by the gang');
INSERT INTO my_test_user.todo_list (title) VALUES ('Help Gary secure his new job working for UPS');
INSERT INTO my_test_user.todo_list (title) VALUES ('Find the original universe where Leonard and Sheldon live');

COMMIT;
```


#### VIII. Loading `todo_list`
```
CREATE TABLE ALBERTOI.todo_list (
    id          NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    title       VARCHAR2(100) NOT NULL,
    status      VARCHAR2(20) DEFAULT 'PENDING',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO albertoi.todo_list (title) VALUES ('Fix the quantum interference device broken by Stuart Bloom');
INSERT INTO albertoi.todo_list (title) VALUES ('Escape the repressive AI on the idyllic version of Earth');
INSERT INTO albertoi.todo_list (title) VALUES ('Enlist a powerful wizard to help Bert find a sorcery gift');
INSERT INTO albertoi.todo_list (title) VALUES ('Survive the post-apocalyptic Pasadena and avoid giant moths');
INSERT INTO albertoi.todo_list (title) VALUES ('Barter canned vegetables and cat food for rare comic books');
INSERT INTO albertoi.todo_list (title) VALUES ('Overthrow military dictator Barry Kripke in alternate reality');
INSERT INTO albertoi.todo_list (title) VALUES ('Locate Denise after she mysteriously disappears in the multiverse');
INSERT INTO albertoi.todo_list (title) VALUES ('Convince doctors in the mental institution that the multiverse is real');
INSERT INTO albertoi.todo_list (title) VALUES ('Break out of the Matrix pods before reality resets again');
INSERT INTO albertoi.todo_list (title) VALUES ('Undo the multiverse Armageddon accidentally unleashed by the gang');
INSERT INTO albertoi.todo_list (title) VALUES ('Help Gary secure his new job working for UPS');
INSERT INTO albertoi.todo_list (title) VALUES ('Find the original universe where Leonard and Sheldon live');

SELECT * FROM todo_list; 
```


#### IX. Summary
Mon Ami, our journey begins with Docker and ends with Docker. Problem‑solving is a kind of journey and so is *life*. 

![alt img/vlcsnap-2026-08-13-19h22m30s018](img/vlcsnap-2026-08-13-19h22m30s018.png)


#### X. Bibliography
1. [gvenzl/oracle-xe](https://hub.docker.com/r/gvenzl/oracle-xe)
2. [gvenzl/oracle-free](https://hub.docker.com/r/gvenzl/oracle-free)
3. [Oracle AI Database Free](https://www.oracle.com/database/free/)
4. [Oracle Instant Client Downloads](https://www.oracle.com/database/technologies/instant-client/downloads.html)
5. [SQL*Plus® User's Guide and Reference](https://docs.oracle.com/en/database/oracle/oracle-database/21/sqpug/index.html)
6. [DBeaver Community 26.1.4](https://dbeaver.io/download/)
7. [Sample database of employee table on ORACLE 21c](https://download.oracle.com/oll/tutorials/DBXETutorial/html/module2/les02_load_data_sql.htm)
8. [Oracle Database XE Downloads](https://www.oracle.com/database/technologies/express-edition-downloads.html)
9. [Oracle AI Database 26ai Download for Linux (Intel x86-64) (64-bit)](https://www.oracle.com/database/technologies/oracle26ai-linux-downloads.html)
10. [node-oracledb](https://www.npmjs.com/package/oracledb)
11. [Text Art](https://fsymbols.com/text-art/)
12. [The Book of Disquiet by Fernando Pessoa](doc/The%20Book%20of%20Disquiet%20-%20Fernando%20Pessoa.pdf)


#### Epilogue
> "The things we dream have just one side. We can’t walk around them to see what’s on the other side. The problem with the things of life is that we can look at them from all sides. The things we dream have, like our souls,* only the side that we see."

> "As coisas sonhadas só têm o lado de cá... Não se lhes pode ver o outro lado... Não se pode andar à roda delas... O mal das coisas da vida é que as podemos ir olhando por todos os lados... As coisas de sonho só têm o lado que vemos... Têm amores só puros, como as nossas almas’."


### EOF (2026/08/28)
