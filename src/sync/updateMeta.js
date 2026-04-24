'use strict'
const mongo = require('mongoclient')
const log = require('logger')
const checkSecondary = (stats = [], res)=>{
  for(let i in stats){
    if(!stats[i]?.stat?.unitStatId || stats[i]?.stat?.unitStatId !== 5) continue
    let value = +(+(stats[i]?.stat?.unscaledDecimalValue || 0) / 100000000)
    if(value < 15) continue
    if(!res[value]) res[value] = { value: value, count: 0 }
    if(res[value]) res[value].count++
  }
}
const checkMods = (mods = [], res = {})=>{
  for(let i in mods){
    if(!mods[i].secondaryStat || mods[i].secondaryStat?.length === 0) continue
    checkSecondary(mods[i].secondaryStat, res)
  }
}
module.exports = async( pObj = {} )=>{
  try{
    let data = {}
    for(let i in pObj?.roster){
      if(!pObj.roster[i]) continue
      checkMods(pObj.roster[i].mods, data)
    }
    await mongo.set('mods-count', { _id: pObj.allyCode }, { allyCode: pObj.allyCode, data: data, updated: Date.now() })
  }catch(e){
    log.error(e)
  }
}
