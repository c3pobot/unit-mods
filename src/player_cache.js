import log from './logger.js'

const cache = new Map(), expireMs = ( 6 * 3600 * 1000 )

function set(id, data){
  if(!id || !data) return
  return cache.set(id, { data, ttl: Date.now() })

}
function get(id){
  if(!id) return
  let res = cache.get(id)
  if(!res?.data || !res?.ttl) return

  let expireTime = Date.now() - expireMs
  if(expireTime >= res.ttl){
    cache.delete(id)
    return
  }

  return res.data
}
export default { get, set }
