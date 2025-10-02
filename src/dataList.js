const log = require('logger');
const mongo = require('mongoclient')
const statCalc = require('statcalc');

let dataList = { gameData: {}, gameVersion: '' }
const start = async()=>{
  try{
    let data, status
    if(mongo.ready) data = (await mongo.find('botSettings', {_id: 'gameData'}))[0]
    if(data?.data && data?.version && data.version !== dataList.gameVersion) status = statCalc.setGameData(data.data)
    if(status){
      dataList.gameData = data.data
      dataList.gameVersion = data.version
      log.info(`gameData updated to version ${dataList.gameVersion}...`)
    }
    setTimeout(start, 5000)
  }catch(e){
    log.error(e)
    setTimeout(start, 5000)
  }
}
start()
module.exports = { dataList }
