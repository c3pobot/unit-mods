'use strict'
const log = require('logger')
const cache = require('src/cache')

const getPlayer = async(playerId, baseId)=>{
  if(!playerId) return;
  return await cache.get('playerCache', playerId, { playerId: 1, allyCode: 1, roster: { [baseId]: { mods: 1, stats: 1 }}})
}
module.exports = async(playerIds, baseId)=>{
  try{
    if(!playerIds || playerIds?.length == 0) return;

    let array = [], i = playerIds?.length
    while(i--) array.push(getPlayer(playerIds[i], baseId))
    let res = await Promise.allSettled(array)
    console.log(res[0])
    return res?.filter(x=>x?.value?.playerId)?.map(x=>x.value)
  }catch(e){
    log.error(e)
  }
}
