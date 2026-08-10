cnf ?= .env
include $(cnf)
export $(shell sed 's/=.*//' $(cnf))

COMPOSE = docker compose

.PHONY: help up down restart ps logs prune test test-user config

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
	@echo "  config     edit configuration"


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

config:
	nano .env
