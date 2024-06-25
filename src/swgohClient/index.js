'use strict'
const log = require('logger')
const fetch = require('./fetch')
const GAME_CLIENT_URL = process.env.GAME_CLIENT_URL, retryCount = +process.env.CLIENT_RETRY_COUNT || 6

const requestWithRetry = async(uri, opts = {}, count = 0)=>{
  try{
    let res = await fetch(uri, opts)
    if(res?.error === 'FetchError'){
      if(count < retryCount){
        count++
        return await requestWithRetry(uri, opts, count)
      }else{
        throw(`tried request ${count} time(s) and errored with ${res.error} : ${res.message}`)
      }
    }
    if(res?.body?.code === 6){
      if(count < retryCount){
        count++
        return await requestWithRetry(uri, opts, count)
      }else{
        throw(`tried request ${count} time(s) and errored with ${res?.body?.code} : ${res?.body?.message}`)
      }
    }
    if(res?.status === 400 && res?.body?.message){
      if(count < retryCount){
        count++
        return await requestWithRetry(uri, opts, count)
      }else{
        throw(`tried request ${count} time(s) and errored with ${res?.body?.code} : ${res?.body?.message}`)
      }
    }
    return res
  }catch(e){
    throw(e)
  }
}
module.exports = async(uri, payload = {})=>{
  try{
    let opts = { headers: { 'Content-Type': 'application/json'}, timeout: 30000, compress: true, method: 'POST' }
    let body = { payload: payload }
    opts.body = JSON.stringify(body)
    let res = await requestWithRetry(`${GAME_CLIENT_URL}/${uri}`, opts)
    if(res?.body?.message && res?.body?.code !== 5) log.error(uri+' : Code : '+res.body.code+' : Msg : '+res.body.message)
    if(res?.body) return res.body
  }catch(e){

    log.error(e);
  }
}
