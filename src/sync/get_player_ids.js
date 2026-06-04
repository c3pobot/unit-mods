'use strict'
import { gaCache } from '../cache.js'
import sorter from 'json-array-sorter'

async function getGaEvent(){
  let data = await gaCache.all('gaEventList', {}, { groupId: 1, startTime: 1, date: 1 })
  if(!data || data?.length === 0) return

  data = sorter([{ column: 'startTime', order: 'descending'}], data)
  let gaEvent, timeNow = Date.now()
  for(let i in data){
    if(timeNow >= data[i].startTime){
      gaEvent = data[i]
      break;
    }
  }
  return gaEvent
}
async function getPlayers(groupId, limit = 1000){
  let res = [], playersFound = false
  for(let i = 0;i<limit;i++){
    let bracket = await gaCache.get('bracketList', { _id: `${groupId}:${i}`}, { playerIds: 1 })
    if(!bracket?.playerIds || bracket?.playerIds?.length == 0) continue
    res = res.concat(bracket.playerIds)
    if(res?.length >= limit) playersFound = true
    if(playersFound) break
  }
  return res
}
export default async function(limit = 1000){
  let gaEvent = await getGaEvent()
  return await getPlayers(gaEvent?.groupId, limit)
}
