cnf ?= .env
include $(cnf)
export $(shell sed 's/=.*//' $(cnf))

COMPOSE = docker compose

.PHONY: help up down restart ps logs prune test config

help:
	@echo
	@echo "Usage: make TARGET"
	@echo
	@echo "Oracle Database Express Edition (XE) stack automation helper (Linux)"
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
	@echo "Warning: Clearing data directory and logs..."
	$(COMPOSE) down -v
	sudo rm -rf $(ORACLE_DATA_DIR) || true
	mkdir -p ./oracle_data
	sudo chown -R 54321:54321 ./oracle_data

test:
	@echo "Testing Oracle connection via internal healthcheck loop..."
	@if docker exec -i $(ORACLE_CONTAINER_NAME) sh -c \
		'echo "SELECT 1 FROM DUAL;" | sqlplus -S system/$(ORACLE_ROOT_PASSWORD)@//localhost:1521/XE' 2>&1 | grep -q "ORA-"; then \
		echo "❌ Connection failed! Database is still booting up or credentials mismatch."; \
		exit 1; \
	else \
		echo "🎉 Connection successful! Oracle XE is online and ready."; \
	fi

test-user:
	@echo "Testing connection for custom user 'my_test_user' against XEPDB1..."
	@(echo "SET PAGESIZE 50"; echo "SET LINESIZE 120"; echo "COLUMN title FORMAT A35"; echo "SELECT id, title, status FROM todo_list;"; echo "EXIT;") | docker exec -i $(ORACLE_CONTAINER_NAME) sqlplus -S my_test_user/my_secure_password@//localhost:1521/XEPDB1

config:
	nano .env
