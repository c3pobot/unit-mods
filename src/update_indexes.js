import { playerCache } from './cache.js'
const collections = [
  { name: 'playerModCache', indexes: [{ keys: { TTL: 1 }, opts: { name: '_TTL', expireAfterSeconds: 6 * 3600 }}] },
  { name: 'lowGPPlayers', indexes: [{ keys: { TTL: 1 }, opts: { name: '_TTL', expireAfterSeconds: 6 * 3600 }}] }
]

async function updateIndex( data ){
  if(!data?.name || !data?.indexes || data?.indexes?.length == 0) return
  for(let i in data.indexes){
    if(!data.indexes[i]) continue
    let status = await playerCache.updateIndex( data.name, data.indexes[i].keys, data.indexes[i].opts )
    if(!status) return
  }
  return true
}
export default async function(){
  for(let i in collections){
    if(!collections[i].name) continue
    let status = await updateIndex(collections[i])
    if(!status) return
  }
  return true
}
