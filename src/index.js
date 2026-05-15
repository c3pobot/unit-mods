import log from './logger.js'
import swgohClient from './swgoh_client.js'
import { dataList } from './data_list.js'
import sync from './sync/index.js'
import cache from './cache.js'

async function checkApi(){
  try{
    let obj = await swgohClient('metadata')
    if(obj?.latestGamedataVersion){
      log.info('API is ready..')
      return checkCache()
    }
    setTimeout(checkApi, 10000)
  }catch(e){
    log.error(e)
    setTimeout(checkApi, 5000)
  }
}
function checkCache(){
  try{
    let status = cache.status()
    if(status){
      log.info(`cache is ready...`)
      return checkGameData()
    }
    setTimeout(checkCache, 5000)
  }catch(e){
    log.error(e)
    setTimeout(checkCache, 5000)
  }
}
function checkGameData(){
  try{
    if(dataList?.gameData?.unitData){
      log.info(`gameData is ready...`)
      //return
      return sync()
    }
    setTimeout(checkGameData, 5000)
  }catch(e){
    log.error(e)
    setTimeout(checkGameData, 5000)
  }
}
checkApi()
