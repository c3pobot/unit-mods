'use strict'
const log = require('logger')
const fetch = require('node-fetch')
const parseResponse = async(res)=>{
  if(!res) return
  let body

  if (res?.status === 204) {
    body = null
  } else if (res?.headers?.get('Content-Type')?.includes('application/json')) {
    body = await res?.json()
  } else {
    body = await res?.text()
  }
  log.error ({ status: res?.status, body: body })
}
module.exports = async(uri, opts = {})=>{
  try{
    let res = await fetch(uri, opts)
    if (res?.headers?.get('Content-Type')?.includes('application/json')) return await res.json()
    if(res?.status >= 200 && res?.status < 300) return true
  }catch(e){
    if(e?.name) log.error({ error: e.name, message: e.message })
    if(e?.status) parseResponse(e)
    log.error(e)
  }
}
