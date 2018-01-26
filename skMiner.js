
const roomNameFromFlag = _.memoize(flag => flag.name.indexOf('=') > -1 ? flag.name.slice(0, flag.name.indexOf('=')) : flag.name)
const actionMap = require('actionMap')

const nearHostiles = (range, opts) => pos => pos.findInRange(FIND_HOSTILE_CREEPS, range, opts).concat(pos.findInRange(FIND_HOSTILE_STRUCTURES, range))
const mineableSource = minerOkId => (source ) => {
    const mineralSource = source.energy === undefined
    const energyAvailable = !mineralSource && source.energy > 0
    const minePossible = energyAvailable
    const enemyCreepsClear = minePossible && source.pos.findInRange(FIND_HOSTILE_CREEPS, 5).length === 0
    const nearestLair = source.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES)
    const nearestLairSafe = !nearestLair || nearestLair.ticksToSpawn > 10
    const nearestMiners = source.pos.findInRange(FIND_MY_CREEPS, 1, {filter: m => m.id !== minerOkId})
    return minePossible && nearestLairSafe && nearestMiners.length === 0
}
const closest = refPos => (a, b) => a.pos.getRangeTo(refPos) - b.pos.getRangeTo(refPos)

module.exports = worldState => skMiner => {
    //if(skMiner.name === 'Taylor') console.log(skMiner.name + skMiner.room.name)
    if(skMiner.pos === undefined) return
    const roomStatus = Game.worldState.roomStatus[skMiner.room.name]
    //if(skMiner.name === 'Wyatt') console.log(skMiner.name + skMiner.room.name + ' ' + roomStatus)
    const action = actionMap(skMiner.pos)

    const mineRoom = roomStatus.lairs.length > 0 && roomStatus.harvestTargets.length > 0

    const followFlag = !mineRoom && roomStatus.flags
        .filter(f => f.color === COLOR_BLUE)
        .map(f => f.assocRoomName())
        .map(n => Game.worldState.roomStatus[n])
        .filter(x => x)
        .filter(s => s.skMiners.length < (s.lairs.length / 2))
        .length > 0

    const mainResource = skMiner.carries()[0]
    const flagTargets = followFlag ? roomStatus.flags.filter(f => f.color === COLOR_BLUE) : undefined
    const approachSource = !followFlag && mineRoom
    const sourceTargets = approachSource ? roomStatus.harvestTargets.filter(mineableSource(skMiner.id)).sort(closest(skMiner.pos)) : undefined

    const workAction = roomStatus.harvestTargets.filter(t => t.pos.getRangeTo(skMiner) <= 1).map(action.harvest)[0]


    //near rampart next to flag
    const nearestExitRamparts = obj => obj.pos.findClosestByRange(FIND_MY_STRUCTURES, {filter: s => s.structureType === STRUCTURE_RAMPART && s.pos.findInRange(FIND_STRUCTURES, 0, {filter: r => r.structureType === STRUCTURE_ROAD}).length > 0})
    const waitingPos = obj => nearestExitRamparts(obj)[0].pos.walkableCoordsNearPos().filter(p => p.findInRange(FIND_STRUCTURES, 0, {filter: r => r.structureType === STRUCTURE_ROAD}).length === 0)[0]
    const localPos = () => remoteMinersNeeded.length > 0 ? waitingPos(remoteMinersNeeded[0]) : roomStatus.miners.sort((a, b) => a.ticksToLive - b.ticksToLive)[0]
    const moveAction = followFlag ? flagTargets.map(action.approach)[0] :
                        approachSource ? sourceTargets.map(action.approach)[0] :
                        ['none', undefined]

    const workAction2 = workAction && workAction.length ? workAction :
                        ['none', undefined]

    const xferResource = Object.keys(skMiner.carry).filter(k => skMiner.carry[k] > 0)

    const xferAction = 
                        ['none', undefined]

    const finalWorkAction = ['none', undefined]

    const pickupAction = ['none', undefined]

    const dropAction = moveAction && moveAction.length && moveAction[0] !== 'none' && _.sum(skMiner.carry) > 0 ? action.drop(mainResource) : ['none', undefined]






    //const currentPosRoads = skMiner.pos.lookFor(LOOK_STRUCTURES).filter(s => s.structureType === STRUCTURE_ROAD)
    //const roadUseful = currentPosRoads.length === 0 && initialTarget.pos.findInRange(FIND_STRUCTURES, 1, {filter: s => s.structureType === STRUCTURE_ROAD}).length === 0
    //const buildRoad = roadUseful ? skMiner.pos.createConstructionSite(STRUCTURE_ROAD) : OK

    if('Molly' === skMiner.name) console.log(skMiner.name + ' ' + skMiner.room.name + ' skMinerAction followFlag' + JSON.stringify(followFlag))
    if('Molly' === skMiner.name) console.log(skMiner.name + ' ' + skMiner.room.name + ' skMinerAction moveAction' + JSON.stringify(moveAction))
    //if('Riley' === skMiner.name) console.log(skMiner.name + ' ' + skMiner.room.name + ' skMinerAction unemployedMinerFilter(skMiner)' + JSON.stringify(unemployedMinerFilter(skMiner)))
    //if('Dominic' === skMiner.name) console.log(skMiner.name + ' ' + skMiner.room.name + ' skMinerAction xferAction' + JSON.stringify(xferAction))
    //if('Dominic' === skMiner.name) console.log(skMiner.name + ' ' + skMiner.room.name + ' skMinerAction pickupAction' + JSON.stringify(pickupAction))
    return [moveAction, workAction2, xferAction, pickupAction]
}