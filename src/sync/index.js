import log from '../logger.js'
import { playerCache } from '../cache.js'
import getPlayerIds from './get_player_ids.js'
import getPlayers from './get_players.js'
import mapData from './map_data.js'

let limit = +(process.env.PLAYER_LIMIT || 1000)
async function syncPlayers(){
  try{
    let syncTime = 3600
    let playerIds = await getPlayerIds(limit)
    if(!playerIds || playerIds?.length === 0) return setTimeout(syncPlayers, 5000)
    log.info(`found ${playerIds?.length} players to sync...`)
    let timeStart = Date.now()
    let foundIds = await getPlayers(playerIds)
    log.info(`sync for ${foundIds?.length || 0}/${playerIds?.length} players completed in ${(Date.now() - timeStart) / 1000} seconds...`)
    if(foundIds < 500) syncTime = 30
    setTimeout(syncPlayers, syncTime * 1000)
  }catch(e){
    log.error(e)
    setTimeout(syncPlayers, 5000)
  }
}
async function syncMods(){
  try{
    let syncTime = 3600
    let players = await playerCache.all('playerModCache', {}, { playerId: 1 })
    let playerIds = players?.map(x=>x?.playerId)
    if(!playerIds || playerIds?.length < 500){
      log.info(`only found ${playerIds?.length} in cache will retry`)
      return setTimeout(syncMods, 300 * 1000)
    }
    log.info(`found ${playerIds?.length} in cache for mods sync`)
    let status = await mapData(playerIds)
    if(!status){
      log.error(`Error syncing mods`)
      syncTime = 5
    }
    setTimeout(syncMods, syncTime * 1000)
  }catch(e){
    log.error(e)
    setTimeout(syncMods, 5000)
  }
}
export default function (){
  syncPlayers()
  syncMods()
}
