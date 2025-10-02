'use strict'
const log = require('logger')
let limit = +(process.env.PLAYER_LIMIT || 1000)

const getPlayerIds = require('./getPlayerIds')
const syncPlayers = require('./syncPlayers')
const mapData = require('./mapData')

module.exports = async()=>{
  let playerIds = await getPlayerIds(limit)
  if(!playerIds || playerIds?.length === 0) return
  log.debug(`found ${playerIds?.length} players to sync...`)
  let timeStart = Date.now()
  await syncPlayers(playerIds)
  log.debug(`sync for ${limit} players completed in ${(Date.now() - timeStart) / 1000} seconds...`)
  await mapData(playerIds)
}
