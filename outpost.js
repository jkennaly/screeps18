const funcs = require('funcs')

module.exports = outpost => {
    if (!outpost.controller || outpost.controller.my && outpost.controller.level) return 0
    //verify an outpost flag exists in a neighboring room to the outpost, or create one
    //check status of creeps. if numbers low, grab one from the outpost flag room, or spawn one
    //target creep roster:
    //1 x claim jumper or a reservation lasting at least 4000 ticks
    //1xsources.count miners with ticksToLive > 100 (unguarded sources only)
    //1xmelee miners with ticksToLive > 100

    //census
    const claimJumpers = outpost.find(FIND_MY_CREEPS, {filter: funcs.claimJumperCreep})
    const soldiers = outpost.find(FIND_MY_CREEPS, {filter: creep => _.flow(funcs.uniqueTypes, funcs.attackChecker)(creep.body)})
    const enemyCreep = funcs.hostileCreeps(outpost, {filter: creep => _.flow(funcs.uniqueTypes, funcs.attackChecker)(creep.body)})
    const reservationTicks = outpost.controller.reservation && outpost.controller.my ? outpost.controller.reservation.ticksToEnd : 0
    const workhorses = outpost.find(FIND_MY_CREEPS, {filter: creep => _.flow(funcs.uniqueTypes, funcs.workhorseChecker)(creep.body)})
    const sourcesNeedingContainers = funcs.activeSources(outpost).filter(s => s.pos.findInRange(FIND_STRUCTURES, 1, {filter: {structureType: STRUCTURE_CONTAINER}}).length === 0)
    const roadSpots = workhorses
        .filter(h => h.pos.lookFor(LOOK_TERRAIN)[0].terrain === 'swamp')
        .map(h => h.pos.createConstructionSite(STRUCTURE_ROAD))
    //console.log('wh: ' + roadSpots)
    //.filter(h => h.pos.lookFor(LOOK_TERRAIN)[0].terrain === 'swamp')
        //.map(h => h.pos.createConstructionSite(STRUCTURE_ROAD))
    //creep creation priority:
    //melee
    //claimJumper
    //console.log(JSON.stringify(sourcesNeedingContainers))
    //workhorse-miner pairs, alternating, until sufficient

    //structures:
    //1xcontainers at 10% capacity workhorses, min 1, with at least 100 ticksToLive
    return {}
}