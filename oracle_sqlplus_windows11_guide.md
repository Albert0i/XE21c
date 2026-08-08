### Installing Oracle SQL*Plus CLI on Windows 11

This comprehensive guide details how to download, install, and configure the Oracle SQL*Plus Command Line Interface (CLI) on Windows 11 using the Oracle Instant Client ZIP files.


#### Step 1: Download the Required Packages

Oracle requires both the core library bundle and the specific SQL*Plus extension tool. 

1. Navigate to the official [Oracle Instant Client for Microsoft Windows x64 Downloads Page](https://www.oracle.com/database/technologies/instant-client/winx64-64-downloads.html).
2. Download the following two matching ZIP packages (Version **23.x** or **21.x** are recommended):
   * **Basic Package (ZIP):** Contains the necessary shared libraries (e.g., `instantclient-basic-windows.x64-23.6.0.24.10.zip`).
   * **SQL*Plus Package (ZIP):** Contains the SQL*Plus executable and resource files (e.g., `instantclient-sqlplus-windows.x64-23.6.0.24.10.zip`).

*Note: Both ZIP packages must have the identical version number sequence.*


#### Step 2: Extract and Structure the Installation Directories

1. Open **File Explorer** and create a permanent base directory for Oracle tools, such as:
   ```text
   C:\oracle
   ```
2. Open your downloaded **Basic Package ZIP**, copy the internal folder (e.g., `instantclient_23_6`), and extract it directly into your new directory:
   ```text
   C:\oracle\instantclient_23_6
   ```
3. Open your downloaded **SQL*Plus Package ZIP** and extract its entire contents into that exact same folder:
   ```text
   C:\oracle\instantclient_23_6
   ```
4. Verify that `sqlplus.exe` now resides safely inside the `C:\oracle\instantclient_23_6\` directory alongside the database `.dll` files.


#### Step 3: Configure Windows System Environment Variables

To execute the `sqlplus` engine from any Command Prompt or PowerShell container, you must register its path inside Windows.

1. Press the **Windows Key**, type `env`, and select **Edit the system environment variables**.
2. In the System Properties window, click the **Environment Variables...** button at the bottom.
3. Under the **System variables** section (bottom pane), scroll down, select the **Path** variable, and click **Edit...**.
4. Click **New** on the right side and type or paste your exact path string:
   ```text
   C:\oracle\instantclient_23_6
   ```
5. Click **OK** to close the Path editor.
6. (*Optional but Recommended*) Click **New...** under System variables to create an absolute home reference:
   * **Variable name:** `ORACLE_HOME`
   * **Variable value:** `C:\oracle\instantclient_23_6`
7. Click **OK** on all remaining open configuration windows to permanently save your environment changes.


#### Step 4: Verify the CLI Configuration

1. Launch a fresh terminal window by pressing **Win + R**, typing `cmd`, and hitting **Enter**.
2. Execute the version validation parameter:
   ```cmd
   sqlplus -v
   ```
3. Your screen will display the clean SQL*Plus version release block:
   ```text
   SQL*Plus: Release 23.6.0.24.10 - Production
   Version 23.6.0.24.10
   ```


#### Step 5: Connecting to Your Target Instance

Now that configuration is verified, connect to your environment using the standard CLI patterns:

* **Direct Connect Connection String:**
  ```cmd
  sqlplus username/password@hostname:port/service_name
  ```
* **Masked Password Secure Login:**
  ```cmd
  sqlplus username@hostname:port/service_name
  ```


### EOF (2026/08/08)
