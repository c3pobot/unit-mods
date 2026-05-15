import log from '../logger.js'
import { eachLimit } from 'async'
import statCalc from '../stat_calc.js'
import { playerCache } from '../cache.js'
import swgohClient from '../swgoh_client.js'

async function getPlayer(playerId){
  try{
    if(!playerId) return
    let data = await swgohClient('player', { playerId: playerId })
    if(!data?.rosterUnit || data?.rosterUnit?.length === 0) return
    let gp = +(data?.profileStat?.find(x=>x.nameKey == 'STAT_GALACTIC_POWER_ACQUIRED_NAME')?.value || 0)
    if(!gp || gp < 10000000){
      log.debug(`${playerId} less than 10mil GP...`)
      await playerCache.set('lowGPPlayers', { _id: playerId }, { playerId })
      return
    }
    if(!gp || gp < 10000000) return
    let rosterUnit = data.rosterUnit.filter(x=>x.equippedStatMod?.length >= 6)?.filter(x=>x.currentRarity >= 7 && x.currentLevel >= 85 && x.currentTier >= 13 && x.relic?.currentTier >= 7 )
    let roster = statCalc.calcRosterStats(data.rosterUnit, data?.allyCode)
    if(Object.keys(roster || {})?.length == 0) return
    let status = await playerCache.set('playerModCache', { _id: data.playerId }, { playerId: data.playerId, allyCode: data.allyCode, gp, roster })
    if(status) return playerId


    /*
    for(let i in rosterUnit){
      if(rosterUnit[i]?.currentRarity < 7 || rosterUnit[i]?.currentLevel < 85 || rosterUnit[i]?.currentTier < 13 || rosterUnit[i]?.relic?.currentTier < 5) continue
      if(!rosterUnit[i].equippedStatMod || rosterUnit[i].equippedStatMod?.length < 6 ) continue
      let baseId = rosterUnit[i]?.definitionId?.split(':')[0]
      if(!baseId) continue
      res.roster[baseId] = { baseId: baseId, mods: rosterUnit[i].equippedStatMod, stats: rosterUnit[i].stats }
    }
    */
  }catch(e){
    log.error(e)
  }
}

export default async function(playerIds = []){
  let players = []
  let lowPlayers = await playerCache.all('lowGPPlayers', {}, { playerId: 1 })

  let lowGPSet = new Set(lowPlayers?.filter(x=>x?.playerId)?.map(x=>x?.playerId))
  await eachLimit(playerIds, 100, async(playerId)=>{
    if(lowGPSet.has(playerId)) return
    let player = await getPlayer(playerId)
    if(player) players.push(player)
  })
  return players
}
