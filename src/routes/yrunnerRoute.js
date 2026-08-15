/**
 * routes/yrunnerRoute.js
 */
import 'dotenv/config'
import express from 'express'
import url from 'url'
import oracledb from 'oracledb'

import { createDbConfig } from '../config/dbConfig.js'
import { createRunner } from '../yrunner.js'

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT

// Oracle connection settings
const host = process.env.ORACLE_HOST || 'localhost'
const port = process.env.ORACLE_PORT || 1521
const database = process.env.ORACLE_DATABASE || 'XEPDB1'

const config = createDbConfig({
  user: process.env.ORACLE_APP_USER,
  password: process.env.ORACLE_APP_USER_PASSWORD,
  connectString: `${host}:${port}/${database}`
})

const runner = createRunner(config)
const router = express.Router()

/*
   YRunner Direct
*/
/**
 * @openapi
 * /api/v1/yr/runselectsql:
 *   post:
 *     summary: Run a SQL SELECT command
 *     tags:
 *       - YRunner Direct
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cmdText:
 *                 type: string
 *                 description: "SQL SELECT statement to execute"
 *               lowerKeys:
 *                 type: boolean
 *                 description: "Return keys in lowercase"
 *             example:
 *               cmdText: " SELECT * FROM employees f1, departments f2 WHERE f1.department_id = f2.department_id AND f2.department_name = 'IT' "
 *               lowerKeys: "false"
 *     responses:
 *       200:
 *         description: "Query executed successfully, rows returned"
 *       400:
 *         description: "Query failed"
 */
router.post('/runselectsql', async (req, res, next) => {
  try {
    const result = await runner.runSelectSQL(req.body.cmdText, req.body.lowerKeys)

    // Strip off meta info. 
    res.status(result.success ? 200 : 400).json({ 
      cmdText: req.body.cmdText, 
      success: result.success,
      rows: result.success ? result.rows : null,
      error: result.error,
      message: result.message 
    })

  } catch (err) {
    next(err)
  }
})

/**
 * @openapi
 * /api/v1/yr/runvaluesql:
 *   post:
 *     summary: Run a SQL command that returns a single value
 *     tags:
 *       - YRunner Direct
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cmdText:
 *                 type: string
 *                 description: "SQL statement to execute"
 *               lowerKeys:
 *                 type: boolean
 *                 description: "Return keys in lowercase"
 *             example:
 *               cmdText: "SELECT count(*) AS \"employeesCount\" FROM employees"
 *               lowerKeys: "false"
 *     responses:
 *       200:
 *         description: "SQL executed successfully, single value returned"
 *       400:
 *         description: "Execution failed"
 */
router.post('/runvaluesql', async (req, res, next) => {
  try {
    const result = await runner.runValueSQL(req.body.cmdText, req.body.lowerKeys)
    // res.status(result.success ? 200 : 400).json(result)
    console.log('result =', result)
    // Strip off meta info. 
    res.status(result.success ? 200 : 400).json({ 
      cmdText: req.body.cmdText, 
      ...result
    })
  } catch (err) {
    next(err)
  }
})

/**
 * @openapi
 * /api/v1/yr/runsql:
 *   post:
 *     summary: Run one or more SQL commands
 *     tags:
 *       - YRunner Direct
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cmdTexts:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: "Array of SQL statements to execute"
 *             example:
 *               cmdTexts:
 *                 - "DELETE FROM employees WHERE first_name='David'"
 *                 - "UPDATE employees SET salary = salary + 100 WHERE 1=1"
 *     responses:
 *       200:
 *         description: "SQL commands executed successfully"
 *       400:
 *         description: "Execution failed"
 */
router.post('/runsql', async (req, res, next) => {
  try {
    const result = await runner.runSQL(req.body.cmdTexts)
    res.status(result.success ? 200 : 400).json(result)
  } catch (err) {
    next(err)
  }
})

/**
 * @openapi
 * /api/v1/yr/runinsertsqlyieldrowid:
 *   post:
 *     summary: Run an INSERT SQL command and return the auto-increment row ID
 *     tags:
 *       - YRunner Direct
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cmdText:
 *                 type: string
 *                 description: "SQL INSERT statement to execute"
 *               id:
 *                 type: string
 *                 description: "Name of the auto-increment column (default: id)"
 *             example:
 *               cmdText: " INSERT INTO todo_list (title) VALUES ('Insert one more row to todo_list and get me the id... pleaase...') "
 *               id: "id"
 *     responses:
 *       201:
 *         description: "Row inserted successfully, row ID returned"
 *       400:
 *         description: "Insert failed"
 */
router.post('/runinsertsqlyieldrowid', async (req, res, next) => {
  try {
    const result = await runner.runInsertSQLYieldRowID(req.body.cmdText, req.body.id)
    res.status(result.success ? 201 : 400).json(result)
  } catch (err) {
    next(err)
  }
})

/*
   YRunner RESTful
*/
/**
 * @openapi
 * /api/v1/yr/{table}:
 *   get:
 *     summary: Get all rows from a table
 *     tags:
 *       - YRunner RESTful
 *     parameters:
 *       - in: path
 *         name: table
 *         required: true
 *         schema:
 *           type: string
 *         description: "Table name"
 *       - in: query
 *         name: _filter
 *         schema:
 *           type: string
 *         description: "SQL WHERE clause filter"
 *       - in: query
 *         name: _sort
 *         schema:
 *           type: string
 *         description: "Column name to sort by"
 *       - in: query
 *         name: _order
 *         schema:
 *           type: string
 *         description: "Sort order, ASC or DESC"
 *       - in: query
 *         name: _offset
 *         schema:
 *           type: integer
 *         description: "Number of rows to skip"
 *       - in: query
 *         name: _limit
 *         schema:
 *           type: integer
 *         description: "Maximum number of rows to return"
 *       - in: query
 *         name: _lowerkeys
 *         schema:
 *           type: boolean
 *         description: "Return keys in lowercase"
 *       - in: query
 *         name: _norun
 *         schema:
 *           type: boolean
 *         description: "If true, return SQL text only without executing"
 *     responses:
 *       200:
 *         description: "Rows retrieved successfully"
 *       400:
 *         description: "Query failed"
 */
router.get('/:table', async (req, res, next) => {
  try {
    const table = req.params.table
    const query = url.parse(req.url, true).query
    const { _filter, _sort, _order, _offset, _limit, _lowerkeys } = query

    const cmdText = `select * from ${table} ` +
      (_filter ? `where ${_filter} ` : ' ') +
      (_sort ? `order by ${_sort} ` : ' ') +
      (_order ? `${_order} ` : ' ') +
      (_offset ? `offset ${_offset} rows ` : ' ') +
      (_limit ? `fetch next ${_limit} rows only ` : ' ')

    if (query._norun === "true") return res.status(200).json({ cmdText })

    const result = await runner.runSelectSQL(cmdText, _lowerkeys)

    // Strip off meta info. 
    res.status(result.success ? 200 : 400).json({ 
      cmdText, 
      success: result.success,
      rows: result.success ? result.rows : null,
      error: result.error,
      message: result.message 
    })
  } catch (err) {
    next(err)
  }
})

/**
 * @openapi
 * /api/v1/yr/{table}/{key}:
 *   get:
 *     summary: Get a single row by key
 *     tags:
 *       - YRunner RESTful
 *     parameters:
 *       - in: path
 *         name: table
 *         required: true
 *         schema:
 *           type: string
 *         description: "Table name"
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: "Key value identifying the row"
 *       - in: query
 *         name: _keyname
 *         schema:
 *           type: string
 *         description: "Column name used as key (default: id)"
 *       - in: query
 *         name: _keytype
 *         schema:
 *           type: string
 *         description: "Key type, either 'string' or 'number'"
 *       - in: query
 *         name: _lowerkeys
 *         schema:
 *           type: boolean
 *         description: "Return keys in lowercase"
 *     responses:
 *       200:
 *         description: "Row retrieved successfully"
 *       400:
 *         description: "Query failed"
 */
router.get('/:table/:key', async (req, res, next) => {
  try {
    const table = req.params.table
    const query = url.parse(req.url, true).query
    const _keyname = query._keyname || 'id'
    const quote = query._keytype === 'string' ? "'" : ''
    const keyvalue = req.params.key
    const _lowerkeys = query._lowerkeys

    const cmdText = `select * from ${table} where ${_keyname}=${quote}${keyvalue}${quote}`

    if (query._norun === "true") return res.status(200).json({ cmdText })

    const result = await runner.runSelectSQL(cmdText, _lowerkeys)
    
    //  res.status(result.success ? 200 : 400).json({ cmdText, ...result })
    // Strip off meta info. 
    res.status(result.success ? 200 : 400).json({
      cmdText,
      success: result.success,
      row: result.success ? result.rows[0] : null,
      error: result.error,
      message: result.message 
    })
  } catch (err) {
    next(err)
  }
})

/**
 * @openapi
 * /api/v1/yr/{table}:
 *   post:
 *     summary: Create a new row in a table
 *     tags:
 *       - YRunner RESTful
 *     parameters:
 *       - in: path
 *         name: table
 *         required: true
 *         schema:
 *           type: string
 *         description: "Table name"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: "Fields and values to insert into the table"
 *             example:
 *               title: "史都華拯救宇宙失敗記 (Stuart Fails to Save the Universe) but why?"
 *     responses:
 *       201:
 *         description: "Row created successfully"
 *       400:
 *         description: "Insert failed"
 */
router.post('/:table', async (req, res, next) => {
  try {
    const table = req.params.table
    const query = url.parse(req.url, true).query
    let fieldList = ''
    let valueList = ''

    for (const [key, value] of Object.entries(req.body)) {
      if (fieldList !== '') fieldList += ', '
      if (valueList !== '') valueList += ', '

      fieldList += key
      valueList += (typeof value === 'string' ? "'" : '') + value + (typeof value === 'string' ? "'" : '')
    }

    const cmdText = `insert into ${table} (${fieldList}) values(${valueList})`

    if (query._norun === "true") return res.status(200).json({ cmdText })

    const result = await runner.runSQL([cmdText])
    res.status(result.success ? 201 : 400).json({ cmdText, ...result })
  } catch (err) {
    next(err)
  }
})

/**
 * @openapi
 * /api/v1/yr/{table}/{key}:
 *   patch:
 *     summary: Update a row in a table
 *     tags:
 *       - YRunner RESTful
 *     parameters:
 *       - in: path
 *         name: table
 *         required: true
 *         schema:
 *           type: string
 *         description: "Table name"
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: "Key value identifying the row"
 *       - in: query
 *         name: _keyname
 *         schema:
 *           type: string
 *         description: "Column name used as key (default: id)"
 *       - in: query
 *         name: _keytype
 *         schema:
 *           type: string
 *         description: "Key type, either 'string' or 'number'"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: "Fields to update with new values"
 *           example:
 *             status: "FINISHED"
 *     responses:
 *       200:
 *         description: "Row updated successfully"
 *       400:
 *         description: "Update failed"
 */
router.patch('/:table/:key', async (req, res, next) => {
  try {
    const table = req.params.table
    const query = url.parse(req.url, true).query
    const _keyname = query._keyname || 'id'
    const quote = query._keytype === 'string' ? "'" : ''
    const keyvalue = req.params.key
    let setList = ''

    for (const [key, value] of Object.entries(req.body)) {
      if (setList !== '') setList += ', '
      setList += `${key}=${(typeof value === 'string' ? "'" : '')}${value}${(typeof value === 'string' ? "'" : '')}`
    }

    const cmdText = `update ${table} set ${setList} where ${_keyname}=${quote}${keyvalue}${quote} `

    if (query._norun === "true") return res.status(200).json({ cmdText })

    const result = await runner.runSQL([cmdText])
    res.status(result.success ? 200 : 400).json({ cmdText, ...result })
  } catch (err) {
    next(err)
  }
})

/**
 * @openapi
 * /api/v1/yr/{table}/{key}:
 *   delete:
 *     summary: Delete a row from a table
 *     tags:
 *       - YRunner RESTful
 *     parameters:
 *       - in: path
 *         name: table
 *         required: true
 *         schema:
 *           type: string
 *         description: "Table name"
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: "Key value identifying the row"
 *       - in: query
 *         name: _keyname
 *         schema:
 *           type: string
 *         description: "Column name used as key (default: id)"
 *       - in: query
 *         name: _keytype
 *         schema:
 *           type: string
 *         description: "Key type, either 'string' or 'number'"
 *     responses:
 *       204:
 *         description: "Row deleted successfully"
 *       400:
 *         description: "Delete failed"
 */
router.delete('/:table/:key', async (req, res, next) => {
  try {
    const table = req.params.table
    const query = url.parse(req.url, true).query
    const _keyname = query._keyname || 'id'
    const quote = query._keytype === 'string' ? "'" : ''
    const keyvalue = req.params.key

    const cmdText = `delete from ${table} where ${_keyname}=${quote}${keyvalue}${quote}`

    if (query._norun === "true") return res.status(200).json({ cmdText })

    const result = await runner.runSQL([cmdText])
    res.status(result.success ? 204 : 400).json({ cmdText, ...result })
  } catch (err) {
    next(err)
  }
})

export { router }

/*
   node-oracledb | SQL Execution
   https://node-oracledb.readthedocs.io/en/latest/user_guide/sql_execution.html#queryoutputformats

   JavaScript String to Boolean – How to Parse a Boolean in JS
   https://www.freecodecamp.org/news/javascript-string-to-boolean/
*/