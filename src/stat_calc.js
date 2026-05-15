let unitData, modSetData, crTables, relicData;
function floor(value, digits = 0) {
  return Math.floor(value / ('1e'+digits)) * ('1e'+digits);
}
function setGameData(gameData = {}){
  try{
    if(gameData?.unitData){
      unitData = gameData.unitData;
      modSetData = gameData.modSetData;
      crTables = gameData.crTables;
      relicData = gameData.relicData;
    }
    if(unitData) return true
  }catch(e){
    throw(e);
  }
}
function calcRosterStats(units = [], options = {}) {
  try{
    let roster = {}
    // get character stats
    let i = units.length
    while(i--){

      let defID = units[i]?.definitionId.split(':')[0];
      let unit = {...units[i], baseId: defID }
      if (!unit || !unitData?.[defID]) continue;
      if( unitData[ defID ].combatType == 2 ) continue
      if(unit.equippedStatMod < 6 || unit.currentRarity < 7 || unit.relic.currentTier < 7 || unit.currentTier < 13) continue

      unit.stats = calcCharStats(unit);
      if(unit?.stats?.final && unit.stats.final[1]) roster[defID] = { baseId: defID, stats: unit.stats, mods: unit.equippedStatMod, relicTier: unit.relic.currentTier }
    };

    return roster
  }catch(e){
    throw(e)
  }
}
function calcCharStats(unit){
  try{
    let stats = {}, res = {};
    stats = getCharRawStats(unit);
    stats = calculateBaseStats(stats, unit.currentLevel, unit.baseId);
    stats.mods = calculateModStats(stats.base, unit)
    return calculateFinalStats(stats, unit.currentLevel);
  }catch(e){
    throw(e)
  }
}
function getCharRawStats(char) {
  try{
    const stats = {
      base: Object.assign({}, unitData[char.baseId].gearLvl[char.currentTier].stats ),
      growthModifiers: Object.assign({}, unitData[char.baseId].growthModifiers[char.currentRarity] ),
      gear: {}
    };
    // calculate stats from current gear:

    if (char.relic && char.relic.currentTier > 2) {
      // calculate stats from relics
      let relic = relicData[ unitData[char.baseId].relic[ char.relic.currentTier ] ];
      for (var statID in relic.stats) {
        stats.base[ statID ] = (stats.base[ statID ] || 0) + relic.stats[ statID ];
      }
      for (var statID in relic.gms) {
        stats.growthModifiers[ statID ] += relic.gms[ statID ];
      }
    }
    return stats;
  }catch(e){
    throw(e)
  }
}
function calculateBaseStats(stats, level, baseID) {
  // calculate bonus Primary stats from Growth Modifiers:
  stats.base[2] += floor( stats.growthModifiers[2] * level, 8) // Strength
  stats.base[3] += floor( stats.growthModifiers[3] * level, 8) // Agility
  stats.base[4] += floor( stats.growthModifiers[4] * level, 8) // Tactics
  if (stats.base[61]) {
    // calculate effects of Mastery on Secondary stats:
    let mms = crTables[ unitData[ baseID ].masteryModifierID ];
    for (var statID in mms) {
      stats.base[ statID ] = (stats.base[ statID ] || 0) + stats.base[61]*mms[ statID ];
    }
  }
  // calculate effects of Primary stats on Secondary stats:
  stats.base[1] = (stats.base[1] || 0) + stats.base[2] * 18;                                            // Health += STR * 18
  stats.base[6] = floor( (stats.base[6] || 0) + stats.base[ unitData[ baseID ].primaryStat ] * 1.4, 8); // Ph. Damage += MainStat * 1.4
  stats.base[7] = floor( (stats.base[7] || 0) + (stats.base[4] * 2.4), 8 );                             // Sp. Damage += TAC * 2.4
  //stats.base[8] = floor( (stats.base[8] || 0) + (stats.base[2] * 0.14) + (stats.base[3] * 0.07), 8);    // Armor += STR*0.14 + AGI*0.07
  //stats.base[9] = floor( (stats.base[9] || 0) + (stats.base[4] * 0.1), 8);                              // Resistance += TAC * 0.1
  //stats.base[14] = floor( (stats.base[14] || 0) + (stats.base[3] * 0.4), 8);                            // Ph. Crit += AGI * 0.4
  // add hard-coded minimums or potentially missing stats
  //stats.base[12] = (stats.base[12] || 0) + (24 * 1e8);  // Dodge (24 -> 2%)
  //stats.base[13] = (stats.base[13] || 0) + (24 * 1e8);  // Deflection (24 -> 2%)
  //stats.base[15] = (stats.base[15] || 0);               // Sp. Crit
  //stats.base[16] = (stats.base[16] || 0) + (150 * 1e6); // +150% Crit Damage
  //stats.base[18] = (stats.base[18] || 0) + (15 * 1e6);  // +15% Tenacity

  return stats
}
function calculateModStats(baseStats, char) {
  try{
    // return empty object if no mods
    if (!char.equippedStatMod ) return {};

    // calculate raw totals on mods
    const setBonuses = {};
    const rawModStats = {};
    if (char.equippedStatMod) {
      let i = char.equippedStatMod.length
      while(i--){
        let setBonus;
        if ( setBonus = setBonuses[ +char.equippedStatMod[i].definitionId[0] ] ) {
          // set bonus already found, increment
          ++setBonus.count;
          if ( char.equippedStatMod[i].level == 15 ) ++setBonus.maxLevel;
        } else {
          // new set bonus, create object
          setBonuses[ +char.equippedStatMod[i].definitionId[0] ] = { count: 1, maxLevel: char.equippedStatMod[i].level == 15 ? 1 : 0 };
        }

        // add Primary/Secondary stats to data
        let stat = char.equippedStatMod[i].primaryStat.stat, s = 0;
        do {
          rawModStats[ stat.unitStatId ] = +stat.unscaledDecimalValue + (rawModStats[ stat.unitStatId ] || 0);
          stat = char.equippedStatMod[i].secondaryStat[s] && char.equippedStatMod[i].secondaryStat[s].stat;
        } while ( s++ < char.equippedStatMod[i].secondaryStat.length );
      }
    } else {
      // return empty object if no mods
      return {};
    }

    // add stats given by set bonuses
    for (var setID in setBonuses) {
      const setDef = modSetData[setID];
      const {count: count, maxLevel: maxCount } = setBonuses[ setID ];
      const multiplier = ~~(count / setDef.count) + ~~(maxCount / setDef.count);
      rawModStats[ setDef.id ] = (rawModStats[ setDef.id ] || 0) + (setDef.value * multiplier);
    }

    // calcuate actual stat bonuses from mods
    const modStats = {};
    for (var statID in rawModStats) {
      const value = rawModStats[ statID ];
      switch (~~statID) {
        case 41: // Offense
          modStats[6] = (modStats[6] || 0) + value; // Ph. Damage
          modStats[7] = (modStats[7] || 0) + value; // Sp. Damage
          break;
        /*
        case 42: // Defense
          modStats[8] = (modStats[8] || 0) + value; // Armor
          modStats[9] = (modStats[9] || 0) + value; // Resistance
          break;
        */
        case 48: // Offense %
          modStats[6] = floor( (modStats[6] || 0) + (baseStats[6] * 1e-8 * value), 8); // Ph. Damage
          modStats[7] = floor( (modStats[7] || 0) + (baseStats[7] * 1e-8 * value), 8); // Sp. Damage
          break;
        /*
        case 49: // Defense %
          modStats[8] = floor( (modStats[8] || 0) + (baseStats[8] * 1e-8 * value), 8); // Armor
          modStats[9] = floor( (modStats[9] || 0) + (baseStats[9] * 1e-8 * value), 8); // Resistance
          break;
        case 53: // Crit Chance
          modStats[21] = (modStats[21] || 0) + value; // Ph. Crit Chance
          modStats[22] = (modStats[22] || 0) + value; // Sp. Crit Chance
          break;
        case 54: // Crit Avoid
          modStats[35] = (modStats[35] || 0) + value; // Ph. Crit Avoid
          modStats[36] = (modStats[36] || 0) + value; // Ph. Crit Avoid
          break;
        */
        case 55: // Heatlth %
          modStats[1] = floor( (modStats[1] || 0) + (baseStats[1] * 1e-8 * value), 8); // Health
          break;
        case 56: // Protection %
          modStats[28] = floor( (modStats[28] || 0) + ( (baseStats[28] || 0) * 1e-8 * value), 8); // Protection may not exist in base
          break;
        case 57: // Speed %
          modStats[5] = floor( (modStats[5] || 0) + (baseStats[5] * 1e-8 * value), 8); // Speed
          break;
        default:
          // other stats add like flat values
          modStats[ statID ] = (modStats[ statID ] || 0) + value;
      }
    }

    return modStats;
  }catch(e){
    throw(e)
  }
}
function calculateFinalStats(stats, level, options) {
  try{
    // value/scaling flags
    let scale = 1e-8; // also useful in some Stat Format calculations below
    /*
    if (options.scaled) { scale = 1e-4; }
    else if (!options.unscaled) { scale = 1e-8; }
    */
    if (stats.mods) {
      for (var statID in stats.mods) stats.mods[statID] = Math.round( stats.mods[statID] );
    }

    for (var statID in stats.base) stats.base[statID] *= scale;
    for (var statID in stats.mods) stats.mods[statID] *= scale;
    let gsStats = { final: {}, mods: {}, base: {} };
    // get list of all stat IDs used in base
    const statList = [1, 5, 6, 7, 28];

    if (stats.mods) gsStats.mods = stats.mods; // keep mod stats untouched
    let i = statList.length
    while(i--){
      let flatStatID = statList[i];
      gsStats.mods[flatStatID] = stats.mods[flatStatID] || 0, gsStats.base[flatStatID] = stats.base[flatStatID] || 0
      gsStats.final[flatStatID] = gsStats.final[flatStatID] || 0; // ensure stat already exists
      gsStats.final[flatStatID] += (stats.base[flatStatID] || 0) + (stats.gear[flatStatID] || 0) + (stats.mods && stats.mods[flatStatID] ? stats.mods[flatStatID] : 0);
    }

    return gsStats;
  }catch(e){
    throw(e)
  }
}
export default {
  setGameData, calcRosterStats
}
