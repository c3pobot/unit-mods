'use strict'
const log = require('logger')
const { eachLimit } = require('async')
const swgohClient = require('src/swgohClient')
const statCalc = require('statcalc');
const updateMeta = require('./updateMeta')
const cache = require('src/cache')

const getPlayer = async(playerId)=>{
  if(!playerId) return
  let data = await swgohClient('player', { playerId: playerId })
  if(!data?.rosterUnit || data?.rosterUnit?.length === 0) return
  let gp = +(data?.profileStat?.find(x=>x.nameKey == 'STAT_GALACTIC_POWER_ACQUIRED_NAME')?.value || 0)
  if(!gp || gp < 10000000) log.debug(`${playerId} less than 10mil GP...`)
  if(!gp || gp < 10000000) return

  let profile = statCalc.calcRosterStats(data.rosterUnit, data?.allyCode)
  if(!profile?.summary) return

  let res = { playerId: playerId, allyCode: +data.allyCode, roster: {}, gp: gp }
  let rosterUnit = data.rosterUnit
  for(let i in rosterUnit){
    if(rosterUnit[i]?.currentRarity < 7 || rosterUnit[i]?.currentLevel < 85 || rosterUnit[i]?.currentTier < 13 || rosterUnit[i]?.relic?.currentTier < 5) continue
    if(!rosterUnit[i].equippedStatMod || rosterUnit[i].equippedStatMod?.length < 6 ) continue
    let baseId = rosterUnit[i]?.definitionId?.split(':')[0]
    if(!baseId) continue
    res.roster[baseId] = { baseId: baseId, mods: rosterUnit[i].equippedStatMod, stats: rosterUnit[i].stats }
  }
  //await cache.set('playerCache', playerId, res)
  updateMeta(res)
  return res
}

module.exports = async(playerIds = [])=>{
  let players = []
  await eachLimit(playerIds, 80, async(playerId)=>{
    let player = await getPlayer(playerId)
    if(player?.playerId) players.push(player)
  })
  return players
}
