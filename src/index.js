'use strict'
const log = require('logger')
const mongo = require('mongoclient')
const swgohClient = require('./swgohClient')
const sync = require('./sync')

const checkMongo = ()=>{
  log.info(`start up mongo check...`)
  let status = mongo.status()
  if(status) log.debug(`mongo connection ready...`)
  if(status){
    checkApi()
    return
  }
  setTimeout(checkMongo, 5000)
}
const checkApi = async()=>{
  try{
    log.info(`start up api check...`)
    let obj = await swgohClient('metadata')
    if(obj?.latestGamedataVersion){
      log.info('API is ready. Starting Sync...')
      startSync()
      return
    }
    setTimeout(checkApi, 5000)
  }catch(e){
    log.error(e)
    setTimeout(checkApi, 5000)
  }
}
const startSync = async()=>{
  try{
    await sync()
    setTimeout(startSync, 3600 * 1000 )
  }catch(e){
    log.error(e)
    setTimeout(startSync, 5000)
  }
}
checkMongo()
