### Installing Oracle SQL*Plus CLI on Zorin OS 18.1

This guide provides a step-by-step walkthrough for installing and configuring the **Oracle SQL*Plus CLI (Version 23c)** on **Zorin OS 18.1** (which is built on Ubuntu 24.04 LTS).


#### Step 1: Install Dependencies
Open your terminal and install the required core packages:
```bash
sudo apt update
sudo apt install unzip libaio1t64 -y
```


#### Step 2: Download Oracle Instant Client Packages
1. Navigate to the official [Oracle Instant Client for Linux x86-64](https://www.oracle.com/database/technologies/instant-client/linux-x86-64-downloads.html) download page.
2. Download the **Basic Package (ZIP)** (e.g., `instantclient-basic-linux.x64-23.x.x.x.x.dbru.zip`).
3. Download the **SQL*Plus Package (ZIP)** (e.g., `instantclient-sqlplus-linux.x64-23.x.x.x.x.dbru.zip`).

*Note: Ensure both packages have matching version numbers.*


#### Step 3: Extract the Archives
Create a centralized directory in `/opt` and extract both downloaded ZIP archives into it:
```bash
# Create the destination directory
sudo mkdir -p /opt/oracle

# Move your downloaded ZIP files to the new directory
sudo cp ~/Downloads/instantclient-*.zip /opt/oracle/

# Extract the archives
cd /opt/oracle
sudo unzip instantclient-basic-linux.x64-*.zip
sudo unzip instantclient-sqlplus-linux.x64-*.zip

# Clean up the installation zip files
sudo rm instantclient-*.zip
```
*(This extracts everything into a subdirectory, typically named `/opt/oracle/instantclient_23_6` depending on your exact version).*


#### Step 4: Fix the Modern Ubuntu Library Conflict
Zorin OS 18.1 utilizes a modern 64-bit time-aware asynchronous I/O library (`libaio.so.1t64`). Because Oracle SQL*Plus explicitly searches for the legacy filename `libaio.so.1`, you must create a symbolic link to bridge the gap:
```bash
sudo ln -s /usr/lib/x86_64-linux-gnu/libaio.so.1t64 /usr/lib/x86_64-linux-gnu/libaio.so.1
```


#### Step 5: Configure Environment Variables
To expose the `sqlplus` command globally, append the Oracle variables to your user profile:

1. Open your bash configuration file:
   ```bash
   nano ~/.bashrc
   ```
2. Append the following lines at the absolute bottom of the file (verify your exact folder name in `/opt/oracle/` matches):
   ```bash
   export ORACLE_HOME=/opt/oracle/instantclient_23_6
   export LD_LIBRARY_PATH=$ORACLE_HOME:$LD_LIBRARY_PATH
   export PATH=$ORACLE_HOME:$PATH
   ```
3. Save and exit (`Ctrl+O`, `Enter`, then `Ctrl+X`).
4. Apply the configuration instantly to your active terminal session:
   ```bash
   source ~/.bashrc
   ```


#### Step 6: Verify the Installation
Test that the CLI tool runs successfully:
```bash
sqlplus -v
```


##### Expected Output
```text
SQL*Plus: Release 23.26.3.0.0 - Production
Version 23.26.3.0.0
```


#### Step 7: Connection Reference Examples
* **Easy Connect Syntax:**
  ```bash
  sqlplus username/password@hostname:port/service_name
  ```
* **Secure Prompt Mode (Hides Password):**
  ```bash
  sqlplus username@hostname:port/service_name
  ```


### EOF (2026/08/08)