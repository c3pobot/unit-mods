import log from './logger.js'

const GAME_CLIENT_URL = process.env.GAME_CLIENT_URL || 'http://swgoh-client:3000', retryCount = +process.env.CLIENT_RETRY_COUNT || 6, API_KEY = process.env.API_KEY

async function apiRequest(uri, opts){
  try{
    opts.signal = AbortSignal.timeout(20000)
    let r = await fetch(uri, opts)
    let body = await r?.json()
    if(!r?.ok){
      log.error(`[fetch-error]`)
      if(body) console.error(JSON.stringify(body))
    }
    return { body, ok: r.ok, status: r.status }
  }catch(e){
    if(e?.name) return { ok: false, error: e.name }
    log.error(`[fetch-error]`)
    log.error(e)
  }
}

async function requestWithRetry(uri, opts = {}, count = 0){
  try{
    let res = await apiRequest(uri, opts)
    count++
    if(res?.body?.code == 6 && count < retryCount) return await requestWithRetry(uri, opts, count)
    if(!res?.ok && !res?.body?.code && count < retryCount) return await requestWithRetry(uri, opts, count)
    if(!res?.ok && count >= retryCount){
      if(res) log.error(`tried request ${count} time(s) and errored with ${JSON.stringify(res)}`)
    }
    return res
  }catch(e){
    throw(e)
  }
}
export default async function(uri, payload){
  try{
    if(!GAME_CLIENT_URL){
      log.error(`missing GAME_CLIENT_URL`)
      return
    }

    let opts = { headers: {}, compress: true, method: 'POST' }
    if(API_KEY) opt.headers['Authorization'] = `Bearer ${API_KEY}`
    if(payload){
      let body = { payload: payload }
      opts.body = JSON.stringify(body)
      opts.headers['Content-Type'] = 'application/json'
    }
    let res = await requestWithRetry(`${GAME_CLIENT_URL}/${uri}`, opts)
    if(res?.body?.message && res?.body?.code !== 5) log.error(uri+' : Code : '+res.body.code+' : Msg : '+res.body.message)
    if(res?.body) return res.body
  }catch(e){
    log.error(e);
  }
}
