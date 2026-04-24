'use strict'
const log = require('logger')
const { DataApiClient } = require('rqlite-js')

const dataProject = require('./data_projection');

const MODS_CACHE_URL = process.env.MODS_CACHE_HOST || 'http://mods-cache.datastore.svc.cluster.local:4001', CACHE_EXPIRE_TTL = 7200
const dataApiClient = new DataApiClient(MODS_CACHE_URL);

const RQLITE_TABLES = require('./rqlite_tables')

const reportError = (dataResults)=>{
  let err = dataResults?.getFirstError()
  if(err) log.error(err)
}

let status
const expirePlayerCache = async()=>{
  try{
    let sql = `DELETE FROM playerCache WHERE ttl < ${Date.now() - (CACHE_EXPIRE_TTL * 1000)}`
    let dataResults = await dataApiClient.execute(sql)
    if(dataResults?.hasError()) reportError(dataResults)
    setTimeout(expirePlayerCache, 10000)
  }catch(e){
    setTimeout(expirePlayerCache, 5000)
    log.error(e)
  }
}
const init = async()=>{
  try{
    for(let i in RQLITE_TABLES){
      let dataResults = await dataApiClient.execute(RQLITE_TABLES[i])
      if(dataResults?.hasError()){
        reportError(dataResults)
        setTimeout(init, 5000)
        return
      }
    }
    log.info(`mod-cache tables create successfully...`)
    status = true
    expirePlayerCache()
  }catch(e){
    setTimeout(init, 5000)
    log.error(e)
  }
}
init()

module.exports.status = ()=>{
  return status
}
module.exports.set = async(table, id, data)=>{
  try{
    if(!table || !id || !data) return

    let json = JSON.stringify(data)
    let base64 = Buffer.from(json, 'utf8')?.toString('base64')

    let sql = `INSERT OR REPLACE into ${table} VALUES('${id}', '${base64}', '${Date.now()}')`

    let res = await dataApiClient.execute(sql)
    if(res?.hasError()){
      reportError(res)
      return
    }
    return res

  }catch(e){
    log.error(e)
  }
}
module.exports.get = async(table, id, projection)=>{
  try{
    if(!table || !id) return;

    let sql = `SELECT data from ${table} WHERE id="${id}"`
    let res = await dataApiClient.query(sql)
    if(res.hasError()){
      reportError(res)
      return
    }
    let result = res.get(0)
    if(result?.data?.data){
      let base64 = Buffer.from(result.data.data, "base64").toString('utf8')
      let data = JSON.parse(base64)
      if(projection) return dataProject(data, projection)
      return data
    }
  }catch(e){
    log.error(e)
  }
}
