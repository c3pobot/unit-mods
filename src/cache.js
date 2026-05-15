import log from './logger.js'
//import playerCache from './player_cache.js'
import dataCache from 'data-cache'
import RqliteCache from 'rqlite-cache'
import mongo from 'mongo-cache'
import LocalMongo from 'mongo-cache-local'

const MOD_CACHE_URL = ['http://mods-cache-0.mods-cache-internal.datastore.svc.cluster.local:4001', 'http://mods-cache-1.mods-cache-internal.datastore.svc.cluster.local:4001', 'http://mods-cache-2.mods-cache-internal.datastore.svc.cluster.local:4001']
const GA_CACHE_DB = process.env.GA_CACHE_DB || 'swgoh'
const modCache = new RqliteCache({ rqliteHost: MOD_CACHE_URL, tableName: 'modRecommendation', createTable: true, jsonOnly: true })
const modSetCache = new RqliteCache({ rqliteHost: MOD_CACHE_URL, tableName: 'modSetRecommendation', createTable: true, jsonOnly: true })
const modTypeCache = new RqliteCache({ rqliteHost: MOD_CACHE_URL, tableName: 'modTypeRecommendation', createTable: true, jsonOnly: true })
const gaCache = new mongo.MongoCache(GA_CACHE_DB)
//const playerCache = new mongo.MongoCache('mod_cache')

const playerCache = new LocalMongo({ connection_string: 'mongodb://localhost:3100/?compressors=zlib&retryReads=true&retryWrites=true&maxPoolSize=200', collections: [ { name: 'playerModCache', expireSeconds: 6 * 3600 }, { name: 'lowGPPlayers', expireSeconds: 24 * 3600 } ]})

function status(){
  let status = modCache.status()
  if(!status) return
  status = modSetCache.status()
  if(!status) return
  status = modTypeCache.status()
  if(!status) return
  status = mongo.status()
  if(!status) return
  return playerCache.status()
}
export default { status }
export { dataCache, gaCache, modCache, modSetCache, modTypeCache, playerCache }
