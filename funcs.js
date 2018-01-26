/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('funcs');
 * mod.thing == 'a thing'; // true
 */
const ctrlDownGradeWarning = room => room.controller.ticksToDowngrade < 0.8 * CONTROLLER_DOWNGRADE[room.controller.level]
const getCurrentCreepCount = room => room.find(FIND_MY_CREEPS).length
const nearCreeps = (range, opts) => pos => pos.findInRange(FIND_MY_CREEPS, range, opts)
const nearHostiles = (range, opts) => pos => pos.findInRange(FIND_HOSTILE_CREEPS, range, opts).concat(pos.findInRange(FIND_HOSTILE_STRUCTURES, range))
const roomCreeps = (room, opts) => room.find(FIND_MY_CREEPS, opts)
const workhorseChecker = ar => _.indexOf(ar, MOVE) > -1 && _.indexOf(ar, CARRY) > -1 && _.indexOf(ar, WORK) > -1
const attackChecker = ar => _.indexOf(ar, MOVE) > -1 && _.indexOf(ar, ATTACK) > -1
const scoutChecker = ar => _.indexOf(ar, MOVE) > -1 && ar.length === 1
const claimJumperChecker = ar => _.indexOf(ar, MOVE) > -1 && _.indexOf(ar, CLAIM) > -1 && ar.length === 2
const colonistChecker = ar => _.indexOf(ar, MOVE) > -1 && _.indexOf(ar, CLAIM) > -1 && _.indexOf(ar, CARRY) > -1
const colonistCreep = c => _.flow(uniqueTypes, colonistChecker)(c.body)
const claimJumperCreep = c => _.flow(uniqueTypes, claimJumperChecker)(c.body)
const attackCreep = c => _.flow(uniqueTypes, attackChecker)(c.body)
const scoutCreep = c => _.flow(uniqueTypes, scoutChecker)(c.body)
const uniqueTypes = ar => _.uniq(ar.map(x => x.type))
const roomSources = (room, opts) => {
    const retVal = room.find(FIND_SOURCES, opts)
    //console.log(retVal)
    return retVal
}
const sortBy = list => fn => [].concat(list).sort(fn)
const hostileCreeps = (room, opts) => room.find(FIND_HOSTILE_CREEPS, opts)
    //pure
const hostileCreepsInRoom = room => hostileCreeps(room).length > 0
    //pure
const hostileStructures = (room, opts) => room.find(FIND_HOSTILE_STRUCTURES, opts)
    //pure
const friendlyStructures = (room, opts) => room.find(FIND_MY_STRUCTURES, opts)
    //pure
const hostileStructuresInRoom = room => hostileStructures(room).length > 0
    //pure
const getGlobalPriorities = worldState => Game.worldState.strat.global
    //pure
const getRoomState = (worldState, roomName) => Game.worldState.rooms[roomName]
    //pure
const creepExpander = (group, base = []) => count => {
    if(count < 1) return base
    //console.log(JSON.stringify(group.concat(group)) + 'x' + count)
    return creepExpander(group, base.concat(group))(count - 1)
}
const getRoomSourceCount = room => room.find(FIND_SOURCES).length
const getRoomPriority = worldState => _.memoize( room => {
    const globalP = getGlobalPriorities(worldState)
    const hostileCreepsPresent = hostileCreepsInRoom(room)
    const hostileStructuresPresent = hostileStructuresInRoom(room)
    const specified = Game.worldState.strat[room.name]

    if (specified) return specified
    if (hostileStructuresPresent) return 'expansion'
    if (hostileCreepsPresent) return 'expansion'
    return globalP
})
const roomSourcesAtOneTick = room => {

    const safeSources = room.find(FIND_SOURCES, { filter: s => s.ticksToRegeneration === 1 && nearHostiles(5)(s.pos).length === 0})
    //console.log('safeSources' + JSON.stringify(safeSources))
    return safeSources
}
const creepRdyDeploy = creep => _.sum(creep.carry) === 0 && creep.hits / creep.hitsMax > 0.9 && creep.ticksToLive > 600 && creep.pos.findInRange(FIND_SOURCES_ACTIVE, 1).length === 0
const creepHealthy = creep => creep.hits / creep.hitsMax > 0.9 && creep.ticksToLive > 1300
const creepEmpty = creep => creep.carryCapacity > 0 && _.sum(creep.carry) === 0
const creepFull = creep => creep.carry.energy >= creep.carryCapacity
const roomSourcesFull = room => room.find(FIND_SOURCES, { filter: s => s.energy === s.energyCapacity && nearHostiles(5)(s.pos).length === 0})
const nearPos = (basePos, assym) => {
    //console.log(basePos.x)
    //console.log(assym)
    const newX = _.max([_.min([_.floor(Math.random() * (2 * assym + 1)) + basePos.x - assym, 49]), 0])
    const newY = _.max([_.min([_.floor(Math.random() * (2 * assym + 1)) + basePos.y - assym, 49]), 0])
    //console.log(_.floor(Math.random() * (2 * assym + 1)))
    const retVal = new RoomPosition(newX, newY, basePos.roomName)
    return retVal
}

const buildNear = (structureType, opts, baseAssym = 0) => {
    //console.log(JSON.stringify(structureType))

    const minFreeSpaces = OBSTACLE_OBJECT_TYPES.indexOf(structureType) === -1 ? STRUCTURE_ROAD === structureType ? 2 : 1 : 8
    if (opts.nearStructure && Game.rooms[opts.basePos.roomName].find(FIND_STRUCTURES, {filter: {structureType: opts.nearStructure}}).length === 0) return ERR_NOT_FOUND
    const xSign = opts.basePos.x > 42 ? -1 : opts.basePos.x < 7 ? 1 : opts.basePos.y % 2 === 1 ? 1 : -1
    const ySign = opts.basePos.y > 42 ? -1 : opts.basePos.y < 7 ? 1 : opts.basePos.x % 2 === 1 ? 1 : -1
    const xMod = baseAssym * xSign
    const yMod = baseAssym * ySign
    const baseX = opts.basePos.x + xMod < 44 ? opts.basePos.x + xMod > 4 ? opts.basePos.x + xMod : opts.basePos.x - xMod : opts.basePos.x - xMod 
    const baseY = opts.basePos.y + yMod < 44 ? opts.basePos.y + yMod > 4 ? opts.basePos.y + yMod : opts.basePos.y - yMod : opts.basePos.y - yMod
    const finalX = Math.abs(baseX > 5 ? baseX < 44 ? baseX : baseX % 44 : baseX + 39)
    const finalY = Math.abs(baseY > 5 ? baseY < 44 ? baseY : baseY % 44 : baseY + 39)
    console.log('funcs 95 buildNear assym y/x/roomName ' + baseAssym + ' ' + finalY + ' ' + finalX + ' ' + opts.basePos.roomName)
    const startPos = baseAssym === 0 ? opts.basePos : new RoomPosition(finalX, finalY, opts.basePos.roomName)
    const nearStructurePos = _.flatten([startPos]
            .map(x => x.walkableCoordsNearPos()))
        .filter((x, i, ar) => ar.indexOf(x) === i)
        .filter(x => x.nearStruc(opts.nearStructure))
        .filter(x => !x.nearSource(3))
        .filter(x => !x.nearController(3))
        .filter(x => x.lookFor(LOOK_STRUCTURES).length === 0)
        .filter(x => x.lookFor(LOOK_CONSTRUCTION_SITES).length === 0)/*
        .map(x => {

            console.log('funcs 100 buildNear possibility ' + JSON.stringify(x))
            console.log('funcs 100 buildNear assymetry ' + JSON.stringify(baseAssym))
            return x
        })*/
        .filter(x => nearHostiles(5)(x).length === 0)
        .filter(testPos => testPos.x > 4 && testPos.x < 45 && testPos.y > 4 && testPos.y < 45)
    //console.log('funcs 110 buildNear possibility nearStructurePos ' + JSON.stringify(nearStructurePos))
    //console.log('funcs 111 buildNear possibility opts ' + JSON.stringify(opts))
    if(nearStructurePos.length) return nearStructurePos[0].createConstructionSite(structureType)
    const assym = baseAssym < 49 ? baseAssym + 1 : 0
    if(assym === 0) return ERR_INVALID_TARGET
    if(opts.nearStructure && !nearStructurePos) return buildNear(structureType, opts, assym)
    const testPos = opts.nearStructure ? Game.rooms[opts.basePos.roomName].find(FIND_STRUCTURES, {filter: {structureType: opts.nearStructure}})[0].pos :nearPos(opts.basePos, assym)
    //console.log(JSON.stringify(testPos.look()))
    const notOnEdge = testPos.x > 2 && testPos.x < 47 && testPos.y > 2 && testPos.y < 47
    const nearStructOK = opts.nearStructure ? testPos.walkableCoordsNearPos().length >= minFreeSpaces && testPos.walkableCoordsNearPos().reduce((prev, pos) => prev || pos.lookFor(opts.nearStructure).length, false) : true
    if (notOnEdge && (nearStructOK && testPos.look().length === 1 && (testPos.look()[0].terrain === 'plain' || testPos.look()[0].terrain === 'swamp'))) return testPos.createConstructionSite(structureType)
    //console.log('trying again')
    return buildNear(structureType, opts, assym)
}
const plantNear = (opts, basePos, baseAssym) => {
    const assym = !baseAssym || baseAssym < 1 || baseAssym > 50 ? 1 : baseAssym + 1
    const testPos = nearPos(basePos, assym)
    //console.log(JSON.stringify(testPos))
    const notOnEdge = testPos.x > 2 && testPos.x < 47 && testPos.y > 2 && testPos.y < 47
    
    if (notOnEdge && testPos.lookFor(LOOK_STRUCTURES).length === 0 && testPos.createFlag(testPos, undefined, opts.color, opts.secondaryColor) === 0) return 0
    return plantNear(opts, basePos, assym)
}
const lookForBuildSite = creep => {
    const creepOnPos = pos => pos.lookFor(LOOK_CREEPS).length > 0
    const allSites = creep => creep.room.find(FIND_MY_CONSTRUCTION_SITES)
    const freeSites = creep => allSites(creep).filter(site => !creepOnPos(site.pos))
        //console.log(freeSites)
    if (freeSites.length < 1) return undefined
    const closestFreeSite = freeSites(creep).reduce((prev, cur, i, arr) => {
        if (creep.pos.getRangeTo(cur.pos) > creep.pos.getRangeTo(prev.pos)) return prev
        return cur
    })
    return closestFreeSite
}
const activeSources = (room, opts) => room.find(FIND_SOURCES_ACTIVE, opts)
const roomFromFlag = worldState => flag => {
    if( Game.rooms[flag.name] !== undefined) return Game.rooms[flag.name]
    const slicedFlagName = flag.name.slice(0, flag.name.indexOf('='))
    //console.log('roomFromFlag' + Game.rooms[slicedFlagName])
    if( Game.rooms[slicedFlagName] !== undefined) return Game.rooms[slicedFlagName]
    return undefined
}
const roomNameFromFlag = _.memoize(flag => flag.name.indexOf('=') > -1 ? flag.name.slice(0, flag.name.indexOf('=')) : flag.name)
module.exports = {
    nearPos: nearPos,
    buildNear: buildNear,
    plantNear: plantNear,
    lookForBuildSite: lookForBuildSite,
    getCurrentCreepCount: getCurrentCreepCount,
    getRoomPriority: getRoomPriority,
    sourcesFull: roomSourcesFull,
    sourcesAtOneTick: roomSourcesAtOneTick,
    nearCreeps: nearCreeps,
    nearHostiles: nearHostiles,
    creepExpander: creepExpander,
    hostileStructures: hostileStructures,
    hostileCreeps: hostileCreeps,
    friendlyStructures: friendlyStructures,
    ctrlDownGradeWarning: ctrlDownGradeWarning,
    getRoomCreeps: roomCreeps,
    getRoomSources: roomSources,
    sortBy: sortBy,
    workhorseChecker: workhorseChecker,
    attackChecker: attackChecker,
    claimJumperChecker: claimJumperChecker,
    uniqueTypes: uniqueTypes,
    activeSources: activeSources,
    creepHealthy: creepHealthy,
    creepEmpty: creepEmpty,
    creepRdyDeploy: creepRdyDeploy,
    colonistCreep: colonistCreep,
    claimJumperCreep: claimJumperCreep,
    scoutCreep: scoutCreep,
    attackCreep: attackCreep,
    roomFromFlag: roomFromFlag,
    roomNameFromFlag: roomNameFromFlag
}