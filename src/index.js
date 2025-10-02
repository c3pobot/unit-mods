'use strict'
const log = require('logger')
const mongo = require('mongoclient')
const swgohClient = require('./swgohClient')
const { dataList } = require('./dataList')
const sync = require('./sync')

const CheckMongo = ()=>{
  if(mongo?.ready){
    CheckApi()
    return
  }
  setTimeout(CheckMongo, 5000)
}
const CheckApi = async()=>{
  try{
    log.info(`start up api check...`)
    let obj = await swgohClient('metadata')
    if(obj?.latestGamedataVersion){
      log.info('API is ready. Starting Sync...')
      CheckGameData()
      return
    }
    setTimeout(CheckApi, 5000)
  }catch(e){
    log.error(e)
    setTimeout(CheckApi, 5000)
  }
}
const CheckGameData = async()=>{
  try{
    log.info(`start up gameData check...`)
    if(dataList?.gameData?.unitData){
      startSync()
      return
    }
    setTimeout(CheckGameData, 5000)
  }catch(e){
    log.error(e)
    setTimeout(CheckGameData, 5000)
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
CheckMongo()
