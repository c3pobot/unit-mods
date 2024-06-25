'use strict'
const mongo = require('mongoclient')
const { eachLimit } = require('async')
const swgohClient = require('src/swgohClient')

const getPlayer = async(playerId)=>{
  if(!playerId) return
  let data = await swgohClient('player', { playerId: playerId })
  if(!data?.rosterUnit || data?.rosterUnit?.length === 0) return

  let res = { playerId: playerId, allyCode: +data.allyCode, roster: {} }
  let rosterUnit = data.rosterUnit
  for(let i in rosterUnit){
    if(rosterUnit[i]?.currentRarity < 7 || rosterUnit[i]?.currentLevel < 85 || rosterUnit[i]?.currentTier < 13) continue
    if(!rosterUnit[i].equippedStatMod || rosterUnit[i].equippedStatMod?.length < 6 ) continue
    let baseId = rosterUnit[i]?.definitionId?.split(':')[0]
    if(!baseId) continue
    res.roster[baseId] = { baseId: baseId, mods: rosterUnit[i].equippedStatMod }
  }
  await mongo.set('playerModCache', { _id: playerId }, res)
}

module.exports = async(playerIds = [])=>{
  await eachLimit(playerIds, 80, async(playerId)=>{
    await getPlayer(playerId)
  })
  return true
}
