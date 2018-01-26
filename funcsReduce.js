const nearestObject = referencePosition => (objA, objB) => {
    const rangeA = referencePosition.getRangeTo(objA)
    const rangeB = referencePosition.getRangeTo(objB)
    const retVal = rangeA > rangeB ? objB : objA
    return retVal
}
const closestToCompletion = (siteA, siteB) => {
    const timeA = siteA.progressTotal - siteA.progress
    const timeB = siteB.progressTotal - siteB.progress
    const retVal = timeA > timeB ? siteB : siteA
    return retVal
}
const soonestRegen = (objA, objB) => {
    const retVal = objB && objA.ticksToRegeneration > objB.ticksToRegeneration ? objB : objA
    return retVal
}
const lowestHits = (objA, objB) => {
    //console.log('a: ' + objA.hits)
    //console.log('b: ' + objB.hits)
    const retVal = objB && (!objA || objA.hits > objB.hits) ? objB : objA
    return retVal
}
module.exports = {
    nearestObject: nearestObject,
    closestToCompletion: closestToCompletion,
    soonestRegen: soonestRegen,
    lowestHits: lowestHits
}