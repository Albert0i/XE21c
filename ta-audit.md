### TA Audit<br /> – Adding Timestamp Fields and Triggers
```
In tables deep the timestamps lie,
Created once, they never die.
Updated marks the shifting sand,
A record kept by trigger’s hand.
```


#### I. Project Description  
This project injects two audit fields — `createdAt` and `updatedAt` for all `TA` tables — into the schema `DCDEVDTA`. These fields will automatically record when a row is created and when it is last updated. To enforce this behavior consistently across multiple tables, we will add the fields, create triggers to maintain them, and prepare rollback scripts to remove them if necessary.  

Total 16 tables: 
```
TACARTITEMS       TACARTITEMS_LOG   TACARTS       TACONTRACTS
TACREASONS        TACRESULTS        TACTYPES      TADAYS
TAFAMILY          TANOTES           TAOPTIONS     TASKS
TASTATUS (DEV)    TATIMES           TAUNSIGN      TAUSERS
```


#### II. Deployment: Add Columns  

```
ALTER TABLE DCDEVDTA.TACARTITEMS       ADD (updatedAt TIMESTAMP, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL);
ALTER TABLE DCDEVDTA.TACARTITEMS_LOG   ADD (updatedAt TIMESTAMP, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL);
ALTER TABLE DCDEVDTA.TACARTS           ADD (updatedAt TIMESTAMP, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL);
ALTER TABLE DCDEVDTA.TACONTRACTS       ADD (updatedAt TIMESTAMP, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL);
ALTER TABLE DCDEVDTA.TACREASONS        ADD (updatedAt TIMESTAMP, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL);
ALTER TABLE DCDEVDTA.TACRESULTS        ADD (updatedAt TIMESTAMP, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL);
ALTER TABLE DCDEVDTA.TACTYPES          ADD (updatedAt TIMESTAMP, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL);
ALTER TABLE DCDEVDTA.TADAYS            ADD (updatedAt TIMESTAMP, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL);

ALTER TABLE DCDEVDTA.TAFAMILY          ADD (updatedAt TIMESTAMP, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL);
ALTER TABLE DCDEVDTA.TANOTES           ADD (updatedAt TIMESTAMP, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL);
ALTER TABLE DCDEVDTA.TAOPTIONS         ADD (updatedAt TIMESTAMP, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL);
ALTER TABLE DCDEVDTA.TASKS             ADD (updatedAt TIMESTAMP, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL);
-- ALTER TABLE DCDEVDTA.TASTATUS          ADD (updatedAt TIMESTAMP, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL);
ALTER TABLE DCDEVDTA.TATIMES           ADD (updatedAt TIMESTAMP, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL);
ALTER TABLE DCDEVDTA.TAUNSIGN          ADD (updatedAt TIMESTAMP, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL);
ALTER TABLE DCDEVDTA.TAUSERS           ADD (updatedAt TIMESTAMP, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL);
```


#### III. Deployment: Create Triggers  

```
-- 1
CREATE OR REPLACE TRIGGER DCDEVDTA.TRG_TACARTITEMS_AUDIT
BEFORE INSERT OR UPDATE ON DCDEVDTA.TACARTITEMS
FOR EACH ROW
BEGIN
  IF INSERTING THEN
    -- Set createdAt only once, leave updatedAt null
    :NEW.createdAt := COALESCE(:NEW.createdAt, CURRENT_TIMESTAMP);
    :NEW.updatedAt := NULL;
  ELSIF UPDATING THEN
    -- Refresh updatedAt, do not touch createdAt
    :NEW.updatedAt := CURRENT_TIMESTAMP;
  END IF;
END;

-- 2
CREATE OR REPLACE TRIGGER DCDEVDTA.TRG_TACARTITEMS_LOG_AUDIT
BEFORE INSERT OR UPDATE ON DCDEVDTA.TACARTITEMS_LOG
FOR EACH ROW
BEGIN
  IF INSERTING THEN
    -- Set createdAt only once, leave updatedAt null
    :NEW.createdAt := COALESCE(:NEW.createdAt, CURRENT_TIMESTAMP);
    :NEW.updatedAt := NULL;
  ELSIF UPDATING THEN
    -- Refresh updatedAt, do not touch createdAt
    :NEW.updatedAt := CURRENT_TIMESTAMP;
  END IF;
END;

-- 3
CREATE OR REPLACE TRIGGER DCDEVDTA.TRG_TACARTS_AUDIT
BEFORE INSERT OR UPDATE ON DCDEVDTA.TACARTS
FOR EACH ROW
BEGIN
  IF INSERTING THEN
    -- Set createdAt only once, leave updatedAt null
    :NEW.createdAt := COALESCE(:NEW.createdAt, CURRENT_TIMESTAMP);
    :NEW.updatedAt := NULL;
  ELSIF UPDATING THEN
    -- Refresh updatedAt, do not touch createdAt
    :NEW.updatedAt := CURRENT_TIMESTAMP;
  END IF;
END;

-- 5
CREATE OR REPLACE TRIGGER DCDEVDTA.TRG_TACONTRACTS_AUDIT
BEFORE INSERT OR UPDATE ON DCDEVDTA.TACONTRACTS
FOR EACH ROW
BEGIN
  IF INSERTING THEN
    -- Set createdAt only once, leave updatedAt null
    :NEW.createdAt := COALESCE(:NEW.createdAt, CURRENT_TIMESTAMP);
    :NEW.updatedAt := NULL;
  ELSIF UPDATING THEN
    -- Refresh updatedAt, do not touch createdAt
    :NEW.updatedAt := CURRENT_TIMESTAMP;
  END IF;
END;

-- 5
CREATE OR REPLACE TRIGGER DCDEVDTA.TRG_TACREASONS_AUDIT
BEFORE INSERT OR UPDATE ON DCDEVDTA.TACREASONS
FOR EACH ROW
BEGIN
  IF INSERTING THEN
    -- Set createdAt only once, leave updatedAt null
    :NEW.createdAt := COALESCE(:NEW.createdAt, CURRENT_TIMESTAMP);
    :NEW.updatedAt := NULL;
  ELSIF UPDATING THEN
    -- Refresh updatedAt, do not touch createdAt
    :NEW.updatedAt := CURRENT_TIMESTAMP;
  END IF;
END;

-- 6
CREATE OR REPLACE TRIGGER DCDEVDTA.TRG_TACRESULTS_AUDIT
BEFORE INSERT OR UPDATE ON DCDEVDTA.TACRESULTS
FOR EACH ROW
BEGIN
  IF INSERTING THEN
    -- Set createdAt only once, leave updatedAt null
    :NEW.createdAt := COALESCE(:NEW.createdAt, CURRENT_TIMESTAMP);
    :NEW.updatedAt := NULL;
  ELSIF UPDATING THEN
    -- Refresh updatedAt, do not touch createdAt
    :NEW.updatedAt := CURRENT_TIMESTAMP;
  END IF;
END;

-- 7
CREATE OR REPLACE TRIGGER DCDEVDTA.TRG_TACTYPES_AUDIT
BEFORE INSERT OR UPDATE ON DCDEVDTA.TACTYPES
FOR EACH ROW
BEGIN
  IF INSERTING THEN
    -- Set createdAt only once, leave updatedAt null
    :NEW.createdAt := COALESCE(:NEW.createdAt, CURRENT_TIMESTAMP);
    :NEW.updatedAt := NULL;
  ELSIF UPDATING THEN
    -- Refresh updatedAt, do not touch createdAt
    :NEW.updatedAt := CURRENT_TIMESTAMP;
  END IF;
END;

-- 8
CREATE OR REPLACE TRIGGER DCDEVDTA.TRG_TADAYS_AUDIT
BEFORE INSERT OR UPDATE ON DCDEVDTA.TADAYS
FOR EACH ROW
BEGIN
  IF INSERTING THEN
    -- Set createdAt only once, leave updatedAt null
    :NEW.createdAt := COALESCE(:NEW.createdAt, CURRENT_TIMESTAMP);
    :NEW.updatedAt := NULL;
  ELSIF UPDATING THEN
    -- Refresh updatedAt, do not touch createdAt
    :NEW.updatedAt := CURRENT_TIMESTAMP;
  END IF;
END;

-- 9
CREATE OR REPLACE TRIGGER DCDEVDTA.TRG_TAFAMILY_AUDIT
BEFORE INSERT OR UPDATE ON DCDEVDTA.TAFAMILY
FOR EACH ROW
BEGIN
  IF INSERTING THEN
    -- Set createdAt only once, leave updatedAt null
    :NEW.createdAt := COALESCE(:NEW.createdAt, CURRENT_TIMESTAMP);
    :NEW.updatedAt := NULL;
  ELSIF UPDATING THEN
    -- Refresh updatedAt, do not touch createdAt
    :NEW.updatedAt := CURRENT_TIMESTAMP;
  END IF;
END;

-- 10
CREATE OR REPLACE TRIGGER DCDEVDTA.TRG_TANOTES_AUDIT
BEFORE INSERT OR UPDATE ON DCDEVDTA.TANOTES
FOR EACH ROW
BEGIN
  IF INSERTING THEN
    -- Set createdAt only once, leave updatedAt null
    :NEW.createdAt := COALESCE(:NEW.createdAt, CURRENT_TIMESTAMP);
    :NEW.updatedAt := NULL;
  ELSIF UPDATING THEN
    -- Refresh updatedAt, do not touch createdAt
    :NEW.updatedAt := CURRENT_TIMESTAMP;
  END IF;
END;

-- 11
CREATE OR REPLACE TRIGGER DCDEVDTA.TRG_TAOPTIONS_AUDIT
BEFORE INSERT OR UPDATE ON DCDEVDTA.TAOPTIONS
FOR EACH ROW
BEGIN
  IF INSERTING THEN
    -- Set createdAt only once, leave updatedAt null
    :NEW.createdAt := COALESCE(:NEW.createdAt, CURRENT_TIMESTAMP);
    :NEW.updatedAt := NULL;
  ELSIF UPDATING THEN
    -- Refresh updatedAt, do not touch createdAt
    :NEW.updatedAt := CURRENT_TIMESTAMP;
  END IF;
END;

-- 12
CREATE OR REPLACE TRIGGER DCDEVDTA.TRG_TASKS_AUDIT
BEFORE INSERT OR UPDATE ON DCDEVDTA.TASKS
FOR EACH ROW
BEGIN
  IF INSERTING THEN
    -- Set createdAt only once, leave updatedAt null
    :NEW.createdAt := COALESCE(:NEW.createdAt, CURRENT_TIMESTAMP);
    :NEW.updatedAt := NULL;
  ELSIF UPDATING THEN
    -- Refresh updatedAt, do not touch createdAt
    :NEW.updatedAt := CURRENT_TIMESTAMP;
  END IF;
END;

-- 13
-- CREATE OR REPLACE TRIGGER DCDEVDTA.TRG_TASTATUS_AUDIT
-- BEFORE INSERT OR UPDATE ON DCDEVDTA.TASTATUS
-- FOR EACH ROW
-- BEGIN
--  IF INSERTING THEN
--    -- Set createdAt only once, leave updatedAt null
--    :NEW.createdAt := COALESCE(:NEW.createdAt, CURRENT_TIMESTAMP);
--    :NEW.updatedAt := NULL;
--  ELSIF UPDATING THEN
--    -- Refresh updatedAt, do not touch createdAt
--    :NEW.updatedAt := CURRENT_TIMESTAMP;
--  END IF;
-- END;

-- 14
CREATE OR REPLACE TRIGGER DCDEVDTA.TRG_TATIMES_AUDIT
BEFORE INSERT OR UPDATE ON DCDEVDTA.TATIMES
FOR EACH ROW
BEGIN
  IF INSERTING THEN
    -- Set createdAt only once, leave updatedAt null
    :NEW.createdAt := COALESCE(:NEW.createdAt, CURRENT_TIMESTAMP);
    :NEW.updatedAt := NULL;
  ELSIF UPDATING THEN
    -- Refresh updatedAt, do not touch createdAt
    :NEW.updatedAt := CURRENT_TIMESTAMP;
  END IF;
END;

-- 15
CREATE OR REPLACE TRIGGER DCDEVDTA.TRG_TAUNSIGN_AUDIT
BEFORE INSERT OR UPDATE ON DCDEVDTA.TAUNSIGN
FOR EACH ROW
BEGIN
  IF INSERTING THEN
    -- Set createdAt only once, leave updatedAt null
    :NEW.createdAt := COALESCE(:NEW.createdAt, CURRENT_TIMESTAMP);
    :NEW.updatedAt := NULL;
  ELSIF UPDATING THEN
    -- Refresh updatedAt, do not touch createdAt
    :NEW.updatedAt := CURRENT_TIMESTAMP;
  END IF;
END;

-- 16
CREATE OR REPLACE TRIGGER DCDEVDTA.TRG_TAUSERS_AUDIT
BEFORE INSERT OR UPDATE ON DCDEVDTA.TAUSERS
FOR EACH ROW
BEGIN
  IF INSERTING THEN
    -- Set createdAt only once, leave updatedAt null
    :NEW.createdAt := COALESCE(:NEW.createdAt, CURRENT_TIMESTAMP);
    :NEW.updatedAt := NULL;
  ELSIF UPDATING THEN
    -- Refresh updatedAt, do not touch createdAt
    :NEW.updatedAt := CURRENT_TIMESTAMP;
  END IF;
END;
```


#### IV. Rollback Plan  

1. **Drop Triggers**

```sql
DROP TRIGGER DCDEVDTA.TRG_TACARTITEMS_AUDIT;
DROP TRIGGER DCDEVDTA.TRG_TACARTITEMS_LOG_AUDIT;
DROP TRIGGER DCDEVDTA.TRG_TACARTS_AUDIT;
DROP TRIGGER DCDEVDTA.TRG_TACONTRACTS_AUDIT;
DROP TRIGGER DCDEVDTA.TRG_TACREASONS_AUDIT;
DROP TRIGGER DCDEVDTA.TRG_TACRESULTS_AUDIT;
DROP TRIGGER DCDEVDTA.TRG_TACTYPES_AUDIT;
DROP TRIGGER DCDEVDTA.TRG_TADAYS_AUDIT;

DROP TRIGGER DCDEVDTA.TRG_TAFAMILY_AUDIT;
DROP TRIGGER DCDEVDTA.TRG_TANOTES_AUDIT;
DROP TRIGGER DCDEVDTA.TRG_TAOPTIONS_AUDIT;
DROP TRIGGER DCDEVDTA.TRG_TASKS_AUDIT;
-- DROP TRIGGER DCDEVDTA.TRG_TASTATUS_AUDIT;
DROP TRIGGER DCDEVDTA.TRG_TATIMES_AUDIT;
DROP TRIGGER DCDEVDTA.TRG_TAUNSIGN_AUDIT;
DROP TRIGGER DCDEVDTA.TRG_TAUSERS_AUDIT;
```

2. **Drop Columns**
```
ALTER TABLE DCDEVDTA.TACARTITEMS       DROP COLUMN createdAt;
ALTER TABLE DCDEVDTA.TACARTITEMS       DROP COLUMN updatedAt;
ALTER TABLE DCDEVDTA.TACARTITEMS_LOG   DROP COLUMN createdAt;
ALTER TABLE DCDEVDTA.TACARTITEMS_LOG   DROP COLUMN updatedAt;
ALTER TABLE DCDEVDTA.TACARTS           DROP COLUMN createdAt;
ALTER TABLE DCDEVDTA.TACARTS           DROP COLUMN updatedAt;
ALTER TABLE DCDEVDTA.TACONTRACTS       DROP COLUMN createdAt;
ALTER TABLE DCDEVDTA.TACONTRACTS       DROP COLUMN updatedAt;
ALTER TABLE DCDEVDTA.TACREASONS        DROP COLUMN createdAt;
ALTER TABLE DCDEVDTA.TACREASONS        DROP COLUMN updatedAt;
ALTER TABLE DCDEVDTA.TACRESULTS        DROP COLUMN createdAt;
ALTER TABLE DCDEVDTA.TACRESULTS        DROP COLUMN updatedAt;
ALTER TABLE DCDEVDTA.TACTYPES          DROP COLUMN createdAt;
ALTER TABLE DCDEVDTA.TACTYPES          DROP COLUMN updatedAt;
ALTER TABLE DCDEVDTA.TADAYS            DROP COLUMN createdAt;
ALTER TABLE DCDEVDTA.TADAYS            DROP COLUMN updatedAt;

ALTER TABLE DCDEVDTA.TAFAMILY          DROP COLUMN createdAt;
ALTER TABLE DCDEVDTA.TAFAMILY          DROP COLUMN updatedAt;
ALTER TABLE DCDEVDTA.TANOTES           DROP COLUMN createdAt;
ALTER TABLE DCDEVDTA.TANOTES           DROP COLUMN updatedAt;
ALTER TABLE DCDEVDTA.TAOPTIONS         DROP COLUMN createdAt;
ALTER TABLE DCDEVDTA.TAOPTIONS         DROP COLUMN updatedAt;
ALTER TABLE DCDEVDTA.TASKS             DROP COLUMN createdAt;
ALTER TABLE DCDEVDTA.TASKS             DROP COLUMN updatedAt;
-- ALTER TABLE DCDEVDTA.TASTATUS          DROP COLUMN createdAt;
-- ALTER TABLE DCDEVDTA.TASTATUS          DROP COLUMN updatedAt;
ALTER TABLE DCDEVDTA.TATIMES           DROP COLUMN createdAt;
ALTER TABLE DCDEVDTA.TATIMES           DROP COLUMN updatedAt;
ALTER TABLE DCDEVDTA.TAUNSIGN          DROP COLUMN createdAt;
ALTER TABLE DCDEVDTA.TAUNSIGN          DROP COLUMN updatedAt;
ALTER TABLE DCDEVDTA.TAUSERS           DROP COLUMN createdAt;
ALTER TABLE DCDEVDTA.TAUSERS           DROP COLUMN updatedAt;
```

#### V. Filtering Updated Rows
Once the audit triggers are in place, you can easily query which rows have been updated by checking the `updatedAt` field.  

1. **Querying Which Rows Are Updated**
This returns all rows where `updatedAt` has been set (i.e., not `NULL`):  

```sql
SELECT *
FROM DCDEVDTA.TACARTITEMS
WHERE updatedAt IS NOT NULL;
```

2. **Querying Updated Rows by Date Range** 
This filters rows updated within a specific time window. For example, to find rows updated between **August 1, 2026** and **August 15, 2026**:  

```sql
SELECT *
FROM DCDEVDTA.TACARTITEMS
WHERE updatedAt BETWEEN TO_TIMESTAMP('2026-08-01 00:00:00','YYYY-MM-DD HH24:MI:SS')
                    AND TO_TIMESTAMP('2026-08-31 23:59:59','YYYY-MM-DD HH24:MI:SS');
```

- `BETWEEN` checks inclusively for values in the given range.  
- `TO_TIMESTAMP` ensures the string is interpreted as a proper timestamp.  
- Adjust the date/time values to match your reporting needs.  

With these queries, you can quickly identify which rows have been modified and when, making it straightforward to audit changes across your TA tables.  


#### VI. Summary  
The TA Audit Enhancement Project strengthens data integrity across 18 critical tables in the `DCDEVDTA` schema by introducing standardized audit fields (`createdAt`, `updatedAt`) and automated triggers to maintain them. This ensures every record consistently captures when it was created and last modified, improving traceability and compliance.  

The deployment plan provides scripts to add columns and create triggers, while the rollback plan offers a safe path to remove them if needed. By using consistent naming conventions and scripting both forward and backward changes, the project guarantees maintainability, reversibility, and minimal disruption.  

In short, this enhancement delivers a unified, reliable audit mechanism across all TA tables, enabling better monitoring, reporting, and long‑term system accountability.  

```
No manual hand need set the time,
The trigger guards with code sublime.
Each row now speaks of when it grew,
And when its fate was shaped anew.
```


### EOF (2026/08/25)