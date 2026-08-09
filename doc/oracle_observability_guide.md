# Oracle DB Observability Stack Setup Guide

This guide summarizes our complete discussion on setting up a lightweight, containerized monitoring environment for **Oracle Express Edition (XE)** or **Oracle Free** using **Prometheus** and **Grafana**.

---

## 📂 1. Directory Tree & Pre-requisites

To ensure persistence and isolate monitoring assets, organize your relative project structure exactly as follows:

```text
├── .env                  # Environment configuration tokens
├── Makefile              # Automation workflow routines
├── docker-compose.yml    # Cluster container definition orchestration
├── prometheus.yml        # Metrics scraping configuration
└── monitoring/
    ├── grafana_data/     # Persistent storage for users & custom views
    └── prometheus_data/  # Persistent storage for metrics database telemetry
```

### 🔒 Secure Folder Permissions Configuration
Instead of using insecure wide-open tracking permissions (`chmod 777`), isolate resource allocation safely by forcing your local active account to take absolute namespace ownership:

```bash
# Create local mapping paths
mkdir -p ./monitoring/prometheus_data ./monitoring/grafana_data

# Force active user account ownership over your persistent directories
sudo chown -R $USER:$USER ./monitoring/grafana_data ./monitoring/monitoring/prometheus_data

# Establish structural read/write boundaries
chmod 755 ./monitoring/grafana_data ./monitoring/prometheus_data
```

---

## 🛠️ 2. Core Service Infrastructure (`docker-compose.yml`)

Update your local Docker composition setup file to include the metrics scraping engine alongside the native database image layers. Note the use of `user: "1000:1000"` flags to correspond with local system permissions:

```yaml
version: "3.8"

services:
  oracle-db:
    image: ${ORACLE_IMAGE_NAME}
    container_name: ${ORACLE_CONTAINER_NAME}
    ports:
      - "${ORACLE_PORT}:1521"
    environment:
      ORACLE_PASSWORD: ${ORACLE_ROOT_PASSWORD}
      ORACLE_DATABASE: ${ORACLE_DATABASE}
    volumes:
      - ${ORACLE_DATA_DIR}:/opt/oracle/oradata
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
      # Administrative connection string tracking dynamic PDB selections
      DATA_SOURCE_NAME: "oracle://system:${ORACLE_ROOT_PASSWORD}@oracle-db:1521/${PDBNAME}"
    ports:
      - "9161:9161"
    links:
      - oracle-db:oracle-db
    depends_on:
      oracle-db:
        condition: service_healthy
    restart: unless-stopped

  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    user: "1000:1000"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=15d'
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./monitoring/prometheus_data:/prometheus
    ports:
      - "9091:9090"  # Swapped to 9091 to avoid host allocation port blocks!
    links:
      - oracle-exporter:oracle-exporter
    depends_on:
      - oracle-exporter
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    user: "1000:1000"
    ports:
      - "8080:3000"  # Swapped to 8080 to map your custom dashboard landing address
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - ./monitoring/grafana_data:/var/lib/grafana
    depends_on:
      - prometheus
    restart: unless-stopped
```

---

## 📈 3. Metrics Scrape Configurations (`prometheus.yml`)

Save this exact monitoring layout inside your project directory as `prometheus.yml`:

```yaml
global:
  scrape_interval: 5s     # Scrape metrics rapidly every 5 seconds
  evaluation_interval: 5s

scrape_configs:
  - job_name: 'oracle-db-metrics'
    static_configs:
      - targets: ['oracle-exporter:9161']

  - job_name: 'prometheus-self'
    static_configs:
      - targets: ['localhost:9090']
```

---

## 🔍 4. Verification Check and Operational Logs

To confirm proper initialization across all database abstractions, check logs frequently using the following diagnostics:

### A. Verify Grafana Directory Permissions
```bash
docker logs grafana
```
* **Success Indicator:** Service prints initialization tables successfully.
* **Failure Warning:** `GF_PATHS_DATA='/var/lib/grafana' is not writable` means you must fix folder file structures using `chown`.

### B. Verify Oracle Exporter Performance
```bash
docker logs oracle-exporter
```
* **Success Indicator:** Logs explicitly say `Listening on :9161` and `No custom metrics defined.`
* **Safe-to-Ignore Warnings:** Oracle XE or Free editions will report errors parsing `v$resource_limit` or `v$waitclassmetric`. These are premium, enterprise-level views and their omission does not impact baseline functionality.

---

## 📊 5. Grafana Integration Dashboard Setup

1. **Access Web Panel:** Open your browser and navigate to **`http://localhost:8080`** (Default entry points: `admin` / `admin`).
2. **Add Data Source:**
   * Go to **Connections** > **Data Sources** > Click **Add data source**.
   * Select **Prometheus**.
   * Set Connection URL to exactly: `http://prometheus:9090` *(Internal container network address)*.
   * Click **Save & Test** at the bottom to confirm connectivity.
3. **Import Pre-configured Dashboards:**
   * Click the **`+` (Plus icon)** in the top right menu bar and choose **Import**.
   * Inside the "Import via grafana.com" field, input the official template ID numbers:
     * **`3333`** (Mainline Community Oracle DB Matrix)
     * **`13555`** / **`15033`** (Alternative Operational Views)
   * Click **Load**.
   * Link the setup dropdown to your newly established **Prometheus** connection pool.
   * Click **Import** to bring real-time operations alive!