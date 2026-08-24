cnf ?= .env
include $(cnf)
export $(shell sed 's/=.*//' $(cnf))

COMPOSE = docker compose

# --- Configuration Variables ---
# IMAGE_NAME = albert0i/oracle-db-api-gateway:1.0

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

# up:
# 	@mkdir -p $(ORACLE_DATA_DIR)
# 	$(COMPOSE) up -d --remove-orphans
up:
	$(COMPOSE) up -d --remove-orphans
	@echo ""
	@echo "┌────────────────────────────────────────────────────────────────────────┐"
	@echo "│ 🚀 Oracle Database & client are running active                         │"
	@echo "├────────────────────────────────────────────────────────────────────────┤"
	@echo "│                                                                        │"
	@echo "│ 🌐 1. Oracle Database Manager (DBeaver / CloudBeaver)                  │"
	@echo "│    👉 URL:        http://localhost:8979                                │"
	@echo "│    👉 DB Host:    ${ORACLE_HOST}                                            │"
	@echo "│    👉 DB Port:    ${ORACLE_PORT}                                                 │"
	@echo "│    👉 DB Name:    ${ORACLE_DATABASE}                                                │"	
	@echo "│                                                                        │"
	@echo "│ 🌐 2. API Gateway                                                      │"
	@echo "│    👉 URL:        http://localhost:${API_PORT}                                │"
	@echo "│                                                                        │"
	@echo "│ 🌐 3. Grafana Dashboards                                               │"
	@echo "│    👉 URL:        http://localhost:8080/dashboards                     │"
	@echo "│                                                                        │"
	@echo "│ 🌐 4. Prometheus Backend                                               │"
	@echo "│    👉 URL:        http://localhost:9091/targets                        │"
	@echo "│                                                                        │"	
	@echo "└────────────────────────────────────────────────────────────────────────┘"

down:
	$(COMPOSE) down -v

restart:
	$(COMPOSE) restart

ps:
	$(COMPOSE) ps

logs:
	$(COMPOSE) logs -f

# prune:
# 	@echo "⚠️ Warning: Clearing data directories, volumes, and monitoring logs..."
# 	$(COMPOSE) down -v
# 	sudo rm -rf $(ORACLE_DATA_DIR) grafana_data prometheus_data dbeaver_data || true
	
# 	@echo "🛠️ Re-creating clean local directories..."
# 	mkdir -p $(ORACLE_DATA_DIR) ./prometheus_data ./grafana_data
# 	sudo mkdir -p ./dbeaver_data
	
# 	@echo "🔒 Setting secure ownership and permission boundaries..."
# 	sudo chown -R 54321:54321 $(ORACLE_DATA_DIR)
# 	sudo chown -R 1001:1001 ./dbeaver_data
# 	chown -R $$USER:$$USER ./grafana_data ./prometheus_data
# 	chmod 755 ./grafana_data ./prometheus_data
# 	@echo "✨ Prune completed successfully! Environment is fresh and clean."
prune:
	@echo "⚠️ Warning: Clearing entire data directory, volumes, and monitoring logs..."
	$(COMPOSE) down -v
	
	# 1. Nuke the entire data folder cleanly
	sudo rm -rf ./data || true
	
	@echo "🛠️ Re-creating clean local directories..."
	# 2. Re-create the structure safely under your normal user profile
	mkdir -p $(ORACLE_DATA_DIR) ./data/prometheus_data ./data/grafana_data ./data/dbeaver_data
	
	@echo "🔒 Setting secure ownership and permission boundaries..."
	# 3. Critical: Align host permissions with internal container UIDs
	sudo chown -R 54321:54321 ./data/oracle_data
	sudo chown -R 1001:1001 ./data/dbeaver_data
	
	# 4. Enforce standard read/write permissions for monitoring tools
	chmod 755 ./data/grafana_data ./data/prometheus_data
	@echo "✨ Prune completed successfully! Environment is fresh and clean."

	# 5.Verifying directory permissions...
	@echo "📊 Verifying directory permissions..."
	tree -ugp ./data

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
