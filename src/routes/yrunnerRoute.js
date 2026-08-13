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
router.post('/runselectsql', async (req, res, next) => {
  try {
    const result = await runner.runSelectSQL(req.body.cmdText, req.body.lowerKeys)
    res.status(result.success ? 200 : 400).json(result)
  } catch (err) {
    next(err)
  }
})

router.post('/runvaluesql', async (req, res, next) => {
  try {
    const result = await runner.runValueSQL(req.body.cmdText, req.body.lowerKeys)
    res.status(result.success ? 200 : 400).json(result)
  } catch (err) {
    next(err)
  }
})

router.post('/runsql', async (req, res, next) => {
  try {
    const result = await runner.runSQL(req.body.cmdTexts)
    res.status(result.success ? 200 : 400).json(result)
  } catch (err) {
    next(err)
  }
})

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
// Get all
router.get('/:table', async (req, res, next) => {
  try {
    const table = req.params.table
    const query = url.parse(req.url, true).query
    const { _filter, _sort, _order, _offset, _limit, _lowerKeys } = query

    const cmdText = `select * from ${table} ` +
      (_filter ? `where ${_filter} ` : ' ') +
      (_sort ? `order by ${_sort} ` : ' ') +
      (_order ? `${_order} ` : ' ') +
      (_offset ? `offset ${_offset} rows ` : ' ') +
      (_limit ? `fetch next ${_limit} rows only ` : ' ')

    if (query._norun) return res.status(200).json({ cmdText })

    const result = await runner.runSelectSQL(cmdText, _lowerKeys)
    res.status(result.success ? 200 : 400).json({ cmdText, ...result })
  } catch (err) {
    next(err)
  }
})

// Get one
router.get('/:table/:key', async (req, res, next) => {
  try {
    const table = req.params.table
    const query = url.parse(req.url, true).query
    const _keyname = query._keyname || 'id'
    const quote = query._keytype === 'string' ? "'" : ''
    const keyvalue = req.params.key
    const _lowerKeys = query._lowerKeys

    const cmdText = `select * from ${table} where ${_keyname}=${quote}${keyvalue}${quote}`

    if (query._norun) return res.status(200).json({ cmdText })

    const result = await runner.runSelectSQL(cmdText, _lowerKeys)
    res.status(result.success ? 200 : 400).json({
      cmdText,
      success: result.success,
      row: result.rows[0] ? result.rows[0] : null
    })
  } catch (err) {
    next(err)
  }
})

// Create one
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

    if (query._norun) return res.status(200).json({ cmdText })

    const result = await runner.runSQL([cmdText])
    res.status(result.success ? 201 : 400).json({ cmdText, ...result })
  } catch (err) {
    next(err)
  }
})

// Update one
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

    if (query._norun) return res.status(200).json({ cmdText })

    const result = await runner.runSQL([cmdText])
    res.status(result.success ? 200 : 400).json({ cmdText, ...result })
  } catch (err) {
    next(err)
  }
})

// Delete one
router.delete('/:table/:key', async (req, res, next) => {
  try {
    const table = req.params.table
    const query = url.parse(req.url, true).query
    const _keyname = query._keyname || 'id'
    const quote = query._keytype === 'string' ? "'" : ''
    const keyvalue = req.params.key

    const cmdText = `delete from ${table} where ${_keyname}=${quote}${keyvalue}${quote}`

    if (query._norun) return res.status(200).json({ cmdText })

    const result = await runner.runSQL([cmdText])
    res.status(result.success ? 204 : 400).json({ cmdText, ...result })
  } catch (err) {
    next(err)
  }
})

export { router }
