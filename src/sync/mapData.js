'use strict'
const log = require('logger')
const mongo = require('mongoclient')
const { eachLimit } = require('async')
const sorter = require('json-array-sorter')
const mapSetIds = (set = {}, array = [], totalCount = 0)=>{
  if(set.setCount > set.count) return
  let count = Math.floor(set.count / set.setCount)
  if(!count || count < 1) return
  for(let i = 0;i<count;i++) array.push({ setId: set.setId })
}
const checkCompleteSets = (sets = {})=>{
  let count = 0
  for(let i in sets){
    if(sets[i].count < sets[i].setCount) continue
    count += (Math.floor(sets[i].count / sets[i].setCount) * sets[i].setCount) || 0
  }
  if(count === 6) return true
}

const mapModSets = (mods = [], modSets = {}, modStats = {}, modDef = {}, modEnum = {})=>{
  let sets = {}, stats = []
  for(let i in mods){
    let def = modDef[mods[i].definitionId], statId = mods[i]?.primaryStat?.stat?.unitStatId || 0
    if(!def) continue
    if(!modEnum[def.setId]) modEnum[def.setId] = { setId: def.setId, nameKey: def.nameKey, setCount: def.setCount }
    if(!sets[def.setId]) sets[def.setId] = { setId: def.setId, count: 0, setCount: +def.setCount }
    if(sets[def.setId]) sets[def.setId].count++
    if(statId) stats.push({ id: `${def.slot}-${statId}`, slot: def.slot, statId: statId })
  }
  let hasCompleteSets = checkCompleteSets(sets)
  if(!hasCompleteSets) return

  let array = []
  for(let i in sets) mapSetIds(sets[i], array)

  array = sorter([{column: 'setId', order: 'ascending'}], array || [])
  if(!array || array?.length === 0) return

  let setStr = array.shift()?.setId
  for(let i in array) setStr += `-${array[i].setId}`
  if(!setStr) return

  if(!modSets[setStr]) modSets[setStr] = { id: setStr, sets: setStr.split('-'),  count: 0 }
  if(modSets[setStr]) modSets[setStr].count++

  for(let i in stats){
    if(!modStats[stats[i].slot]) modStats[stats[i].slot] = { slot: stats[i].slot, stats: {} }
    if(!modStats[stats[i].slot]?.stats[stats[i].statId]) modStats[stats[i].slot].stats[stats[i].statId] = { statId: stats[i].statId, count: 0}
    if(modStats[stats[i].slot]?.stats[stats[i].statId]) modStats[stats[i].slot].stats[stats[i].statId].count++
  }
  return true
}

const mapModType = (unit = {}, mods = [], modDef = {}, statDef = {}, modTypeMap = {})=>{
  try{
    if(!unit.baseId || mods.length == 0) return
    for(let i in mods){
      if(modDef[mods[i].definitionId]?.rarity < 5 || !mods[i]?.primaryStat?.stat?.unitStatId) continue
      let tempDef = modDef[mods[i].definitionId]
      if(!tempDef.slot) continue
      let key = `${tempDef.setId}-${tempDef.slot}-${mods[i].primaryStat.stat.unitStatId}`
      if(!modTypeMap[key]) modTypeMap[key] = { id: key, slot: tempDef.slot, slotNameKey: tempDef.slotNameKey, setId: tempDef.setId, setNameKey: tempDef.nameKey, primaryStat: mods[i].primaryStat.stat.unitStatId, statNameKey: statDef[mods[i].primaryStat.stat.unitStatId]?.nameKey, units: {}, count: 0 }
      if(modTypeMap[key]) modTypeMap[key].count++
      if(!modTypeMap[key].units[unit.baseId]) modTypeMap[key].units[unit.baseId] = { baseId: unit.baseId, nameKey: unit.name, count: 0 }
      if(modTypeMap[key].units[unit.baseId]) modTypeMap[key].units[unit.baseId].count++
    }
  }catch(e){
    log.error(e)
  }
}
module.exports = async(playerIds = [])=>{

  let unitList = (await mongo.find('autoComplete', { _id: 'unit' }, { data: { combatType: 1, baseId: 1, name: 1 }}))[0]
  if(!unitList?.data || unitList?.data?.length === 0) return

  unitList = unitList.data.filter(x=>x.combatType === 1)
  if(!unitList || unitList?.length === 0) return

  let modDef = (await mongo.find('configMaps', { _id: 'modDefMap' }, { data: 1}))[0]?.data
  if(!modDef || !modDef['111']) return

  let statDef = (await mongo.find('configMaps', { _id: 'statDefMap' }, { data: 1}))[0]?.data
  if(!statDef || !statDef[1]) return

  let modTypeMap = {}
  log.debug('started sync of unit-mods')
  await eachLimit(unitList, 80, async(unit)=>{
    if(!unit?.baseId) return

    let players = await mongo.find('playerModCache', { _id: { $in: playerIds } }, { playerId: 1, allyCode: 1, roster: { [unit.baseId]: { mods: 1}}})
    players = players?.filter(x=>x.roster && x.roster[unit.baseId]?.mods)
    if(!players || players?.length === 0) return

    let modSets = {}, modStats = {}, modEnum = {}, totalCount = 0
    for(let i in players){
      mapModType(unit, players[i]?.roster[unit.baseId]?.mods, modDef, statDef, modTypeMap)
      let mapModSetStatus = mapModSets(players[i]?.roster[unit.baseId]?.mods, modSets, modStats, modDef, modEnum)
      if(mapModSetStatus) totalCount++
    }
    modSets = sorter([{column: 'count', order: 'descending'}], Object.values(modSets) || [])
    if(!modSets || modSets?.length === 0) return

    for(let i in modSets){
      let array = []
      for(let s in modSets[i].sets){
        let def = modEnum[modSets[i].sets[s]]
        if(!def) continue
        array.push({ setId: def.setId, nameKey: def.nameKey, setCount: def.setCount })
      }
      modSets[i].sets = array
      modSets[i].totalCount = totalCount
      modSets[i].pct = (modSets[i].count / totalCount) * 100
    }
    for(let i in modStats){
      modStats[i].stats = sorter([{column: 'count', order: 'descending'}], Object.values(modStats[i].stats) || [])
      if(!modStats[i]?.stats || modStats[i]?.stats?.length === 0) continue
      for(let s in modStats[i].stats){
        modStats[i].stats[s].totalCount = totalCount
        modStats[i].stats[s].pct = (modStats[i].stats[s].count / totalCount) * 100
      }

    }
    await mongo.set('modRecommendation', { _id: unit.baseId }, { sets: modSets, totalCount:  totalCount, stats: modStats })
  })
  for(let i in modTypeMap) await mongo.set('modTypeRecommendation', { _id: modTypeMap[i].id }, modTypeMap[i])
  log.debug('finished sync of unit-mods')
}
