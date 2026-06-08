import log from './logger.js'

const GAME_CLIENT_URL = process.env.GAME_CLIENT_URL || 'http://swgoh-client:3000', retryCount = +process.env.CLIENT_RETRY_COUNT || 6, API_KEY = process.env.API_KEY

async function parseResponse(r){
  let contentType = r?.headers.get("content-type")
  if(contentType && contentType?.indexOf("application/json") !== -1) return await r?.json()
}

async function requestWithRetry(uri, opts = {}, count = 0){
  try{
    opts.signal = AbortSignal.timeout(30000)
    let r = await fetch(uri, opts)
    count++

    let res = await parseResponse(r)
    if(!r.ok && !res?.code && count < retryCount) return await requestWithRetry(uri, opts, count)
    if((!r.ok || res?.code === 6 || (r?.status === 400 && res?.message && res?.code !== 4)) && count < retryCount) return await requestWithRetry(uri, opts, count)
    if(!r.ok){
      if(res?.code == 6) return
      log.error(`[swgoh-client] : ${uri}`)
      if(res) console.error(JSON.stringify(res))
      return
    }
    return res
  }catch(e){
    log.error(`[swgoh-client]`)
    console.error(e)
  }
}
export default async function(uri, payload, identity){
  try{
    let opts = { method: 'POST', compress: true }
    if(payload || identity){
      let body = {}
      if(payload) body.payload = payload
      if(identity) body.identity = identity
      opts.body = JSON.stringify(body)
      opts.headers = { "Content-Type": "application/json" }
    }
    return await requestWithRetry(`${GAME_CLIENT_URL}/${uri}`, opts, 0)
  }catch(e){
    log.error(`[swgoh-client]`)
    log.error(e)
  }
}
