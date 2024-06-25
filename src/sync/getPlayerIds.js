'use strict'
const mongo = require('mongoclient')
const sorter = require('json-array-sorter')
const getGaEvent = async()=>{
  let data = await mongo.find('gaEvents', {}, { eventInstanceId: 1, endTime: 1, date: 1, leagues: { KYBER: 1 } })
  if(!data || data?.length === 0) return

  data = sorter([{ column: 'endTime', order: 'descending'}], data)
  let gaEvent, timeNow = Date.now()
  for(let i in data){
    if(timeNow >= data[i].endTime){
      gaEvent = data[i]
      break;
    }
  }
  return gaEvent
}
const getPlayers = async(eventInstanceId, limit = 1000) =>{
  let res = []
  for(let i = 0;i<limit;i++){
    let bracket = (await mongo.find('gaPlayers', { _id: `${eventInstanceId}:KYBER:${i}`}, { players: 1, groupId: 1, _id: 1}))[0]
    if(!bracket?.players || bracket?.players?.length == 0) continue
    for(let p in bracket.players) res.push(bracket.players[p].id)
    if(res?.length >= limit) break
  }
  return res
}
module.exports = async(limit = 1000)=>{
  let gaEvent = await getGaEvent()
  return await getPlayers(gaEvent?.eventInstanceId)
}
