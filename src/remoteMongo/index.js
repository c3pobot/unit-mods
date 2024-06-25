'use strict'
const log = require('logger')
const fetch = require('./fetch')
let MONGO_API_URI = process.env.MONGO_API_URI, mongoReady
const apiRequest = async(uri, collection, query, data)=>{
  if(!MONGO_API_URI) return
  let payload = { method: 'POST', headers: {'Content-Type': 'application/json'}, compress: true, timeout: 120000 }
  let body = { collection: collection, matchCondition: query, data: data }
  payload.body = JSON.stringify(body)
  return await fetch(`${MONGO_API_URI}/${uri}`, payload)
}
const checkMongo = async()=>{
  try{
    let res = await apiRequest('status')
    if(res?.status == 'ok'){
      mongoReady = true
      log.debug('mongo api client is ready...')
      return
    }
    setTimeout(checkMongo, 5000)
  }catch(e){
    log.error(e)
    setTimeout(checkMongo, 5000)
  }
}
checkMongo()
module.exports.set = async(collection, query, data)=>{
  return await apiRequest('set', collection, query, data)
}
module.exports.status = ()=>{
  return mongoReady
}
