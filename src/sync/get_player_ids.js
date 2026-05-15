'use strict'
import { gaCache } from '../cache.js'
import sorter from 'json-array-sorter'

async function getGaEvent(){
  let data = await gaCache.all('gaEvents', {}, { eventInstanceId: 1, endTime: 1, date: 1, leagues: { KYBER: 1 } })
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
async function getPlayers(eventInstanceId, limit = 1000){
  let res = [], playersFound = false
  for(let i = 0;i<limit;i++){
    let bracket = await gaCache.get('gaPlayers', { _id: `${eventInstanceId}:KYBER:${i}`}, { players: 1 })
    if(!bracket?.players || bracket?.players?.length == 0) continue
    res = res.concat(bracket.players.map(x=>x.id))
    if(res?.length >= limit) playersFound = true
    if(playersFound) break
  }
  return res
}
export default async function(limit = 1000){
  let gaEvent = await getGaEvent()
  return await getPlayers(gaEvent?.eventInstanceId, limit)
}
