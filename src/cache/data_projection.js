'use strict'
function isTruthyObject(value) {
  return (typeof value === 'object' && value !== null);
}
function isTruthyWithZero(value) {
  return value || value == 0;
}
function filterSource(source = [], elemMatch = {}){
  let keys = Object.keys(elemMatch)
  if(keys?.length === 0) return source
  let i = keys.length, res = source
  while(i--){
    if(res.filter(x=>x[keys[i]]).length === 0) continue;
    res = res.filter(x=>x[keys[i]] === elemMatch[keys[i]])
  }
  return res
}
function project(source, projection) {
  let response = {};
  if (source && projection) {
    if (Array.isArray(source)) {
      response = [];
      if(projection['$elemMatch']){
        response = filterSource(source, projection['$elemMatch'])
      }else{
        for (let i = 0; i < source.length; i++) {
          response.push(project(source[i], projection));
        }
      }
      // assume this is a top level source, nested array projections not really supported

    } else {
      let keys = Object.keys(projection);
      if (keys.length > 0) {
        for (let projectKey of keys) {
          let sourceValue = source[projectKey];
          let projectValue = projection[projectKey];

          // handle nested projections
          if (isTruthyObject(sourceValue) && isTruthyObject(projectValue)) {
            response[projectKey] = project(sourceValue, projectValue);
          } else {
            if (projectValue && isTruthyWithZero(sourceValue)) {
              response[projectKey] = sourceValue;
            }
          }
        }
      } else {
        return source;
      }
    }
  } else {
    response = source;
  }

  return response;
};
module.exports = project
