import log from './logger.js'
import statCalc from './stat_calc.js'

import dataCache from 'data-cache'

let dataList = { gameData: {}, gameVersion: '' }

async function updateGameData(){
  try{
    let obj = await dataCache.get('data', 'gameData')
    if(!obj.data || !obj.gameVersion) return
    if(obj.gameVersion == dataList.gameVersion) return true

    statCalc.setGameData(obj.data)
    dataList.gameData = obj.data, dataList.gameVersion = obj.gameVersion
    log.info(`gameData updated to ${dataList.gameVersion}`)
    return true
  }catch(e){
    log.error(e)
  }
}
async function sync(){
  try{
    let syncTime = 60
    let status = await updateGameData()
    if(!status) syncTime = 5
    setTimeout(sync, syncTime * 1000)
  }catch(e){
    log.error(e)
    setTimeout(sync, 5000)
  }
}
sync()
export { dataList }
