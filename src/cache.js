import log from './logger.js'
//import playerCache from './player_cache.js'
import RqliteCache from 'rqlite-cache'
import { MongoCache } from 'mongo-cache'

const MOD_CACHE_URL = ['http://mods-cache-0.mods-cache-internal.datastore.svc.cluster.local:4001', 'http://mods-cache-1.mods-cache-internal.datastore.svc.cluster.local:4001', 'http://mods-cache-2.mods-cache-internal.datastore.svc.cluster.local:4001']

const modCache = new RqliteCache({ rqliteHost: MOD_CACHE_URL, tableName: 'modRecommendation', createTable: true, jsonOnly: true })
const modSetCache = new RqliteCache({ rqliteHost: MOD_CACHE_URL, tableName: 'modSetRecommendation', createTable: true, jsonOnly: true })
const modTypeCache = new RqliteCache({ rqliteHost: MOD_CACHE_URL, tableName: 'modTypeRecommendation', createTable: true, jsonOnly: true })

const dataCache = new MongoCache({
  connection_string: 'mongodb://mongo-data-rs2.datastore.svc.cluster.local?replicaSet=rs2&ssl=false&compressors=snappy&retryReads=true&retryWrites=true',
  db_name: 'game_data'
 })
const playerCache = new MongoCache({
  connection_string: 'mongodb://localhost:3100/?ssl=false&compressors=snappy&retryReads=true&retryWrites=true',
  db_name: 'player_cache'
 })

 const gaCache = new MongoCache({
    connection_string: 'mongodb://mongo-ga-rs1.datastore.svc.cluster.local:27018?replicaSet=rs1&ssl=false&compressors=snappy&retryReads=true&retryWrites=true',
    db_name: 'ga_data'
 })

function status(){
  let status = modCache.status()
  if(!status) return
  status = modSetCache.status()
  if(!status) return
  status = modTypeCache.status()
  if(!status) return
  status = gaCache.status()
  if(!status) return
  return playerCache.status()
}
export default { status }
export { dataCache, gaCache, modCache, modSetCache, modTypeCache, playerCache }
