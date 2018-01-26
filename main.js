const funcs = require('funcs')

const creeps = require('creeps')
const structures = require('structures')
const rooms = require('rooms')
const roomStatus = require('roomStatus2')
const empireStatus = require('empireStatus')
const strat = require('strat')
const outpost = require('outpost')
const transportAction = require('transportAction4')
const workhorseAction = require('workhorseAction3')
const superTransportAction = require('superTransportAction2')
const workerAction = require('staticWorkerAction2')
const minerAction = require('minerAction2')
const soldierAction = require('soldierAction2')
const scoutAction = require('scoutAction')
const tenderAction = require('towerTenderAction2')
const tickInvalid = require('tickInvalid')
//console.log(Game.cpu.getUsed() + ' t1 new global')
require('gameInvalid')()
tickInvalid(Game.time)
//console.log(Game.cpu.getUsed() + ' t1a')
const CREEP_TYPES = [


//[type, body chunk, def Opts arg, def spawnPermitted function]
    ['superTransport', [MOVE, CARRY, CARRY, CARRY, CARRY], {type: 'superTransport', fixed: undefined}],
    ['workhorse', [MOVE, CARRY, WORK], {type: 'workhorse', fixed: undefined}],
    ['fastMelee', [MOVE, MOVE, MOVE, MOVE, MOVE, ATTACK], {type: 'fastMelee', fixed: undefined}],
    ['melee', [MOVE, ATTACK], {type: 'melee', fixed: undefined}],
    ['slowMelee', [MOVE, ATTACK, ATTACK], {type: 'slowMelee', fixed: undefined}],
    ['defMelee', [ATTACK, MOVE, MOVE, ATTACK], {type: 'defMelee', fixed: undefined, cap: 12}],
    ['skMelee', [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK], {type: 'skMelee', fixed: 1}],
    ['skKnight', [TOUGH, TOUGH, RANGED_ATTACK, HEAL, MOVE, MOVE], {type: 'skKnight', fixed: undefined}],
    ['claimJumper', [MOVE, CLAIM], {type: 'claimJumper', fixed: undefined, cap: 4}],
    ['colonist', [MOVE, MOVE, CLAIM], {type: 'colonist', fixed: 1}],
    ['support', [MOVE, MOVE, HEAL, RANGED_ATTACK], {type: 'support', fixed: undefined}],
    ['barricadeMan', [MOVE, HEAL, RANGED_ATTACK], {type: 'barricadeMan', fixed: undefined}],
    ['pinger', [TOUGH, HEAL, MOVE], {type: 'pinger', fixed: undefined}],
    ['healer', [MOVE, HEAL, HEAL], {type: 'healer', fixed: undefined}],
    ['fastHeal', [HEAL, MOVE], {type: 'fastHeal', fixed: undefined}],
    ['scout', [MOVE], {type: 'scout', fixed: 1}],
    ['wallBreaker', [TOUGH, TOUGH, TOUGH, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], {type: 'wallBreaker', fixed: undefined}],
    ['staticWorker', [CARRY, MOVE, WORK], {type: 'staticWorker', fixed: 1}],
    ['staticWorker', [CARRY, MOVE, WORK], {type: 'smallWorker', fixed: 1}],
    ['staticWorker', [CARRY, MOVE, WORK], {type: 'tinyWorker', fixed: 1}],
    ['staticWorker', [CARRY, MOVE, WORK], {type: 'miniWorker', fixed: 1}],
    ['staticWorker', [CARRY, MOVE, WORK], {type: 'quickWorker', fixed: 1}],
    ['transport', [MOVE, CARRY, CARRY], {type: 'transport', fixed: undefined, cap: 30}],
    ['towerTender', [MOVE, MOVE, CARRY, CARRY], {type: 'towerTender', fixed: undefined, cap: 8}],
    ['skMiner', [CARRY, CARRY, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], {type: 'skMiner', fixed: 1}],
    ['remoteMiner', [MOVE, MOVE, WORK, WORK, WORK, WORK, CARRY], {type: 'remoteMiner', fixed: 1}],
    ['remoteMiner', [MOVE, MOVE, WORK, WORK, WORK, WORK, CARRY], {type: 'smallMiner', fixed: 1}],
    ['remoteMiner', [MOVE, MOVE, WORK, WORK, WORK, WORK, CARRY], {type: 'tinyMiner', fixed: 1}],
    ['towerCrasher', [TOUGH, MOVE, MOVE, MOVE, MOVE, MOVE, ATTACK, HEAL, HEAL, HEAL], {type: 'towerCrasher', fixed: 5}],
    ['privateer', [TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,HEAL,HEAL,HEAL,HEAL], {type: 'privateer', fixed: 1}],
    ['chewer', [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY], {type: 'chewer', fixed: 1}]
]


//console.log(JSON.stringify(strat))

Creep.prototype.typeArray = CREEP_TYPES
Creep.prototype.status = function(testStatus) {
    const cr = this
    //if testStatus is not a string, return the creeps status as a string
    const developedRoom = creep => creep.room.controller && creep.room.controller.level >= 4 && creep.room.controller.my && creep.room.energyAvailable > 0.5 * creep.room.energyAvailableCapacity
    const empty = creep => (_.sum(creep.carry) < 50 && developedRoom(creep) || _.sum(creep.carry) < 0.04 * creep.carryCapacity) && creep.carryCapacity > 0
    const somewhatFull = creep => !empty(creep) && _.sum(creep.carry) <= 0.96 * creep.carryCapacity && creep.carryCapacity > 0
    const full = creep => !empty(creep) && !somewhatFull(creep)
    const fullLoad = creep => _.sum(c.carry) >= creep.room.largestTransportCapacity() || full(creep)
    const energized = creep => creep.ticksToLive > 1400
    const fresh = creep => creep.ticksToLive <= 1400 && creep.ticksToLive >= 600
    const tired = creep => creep.ticksToLive < 600 && creep.ticksToLive >= 100
    const exhausted = creep => creep.ticksToLive < 100
    const pickupable = creep => false
    const harvestable = creep => false
    const emptyE = creep => creep.carryCapacity === 0 || creep.carry[RESOURCE_ENERGY] < 0.04 * creep.carryCapacity || creep.carry[RESOURCE_ENERGY] === undefined
    const withdrawable = creep => false
    const onRoad = obj => obj.pos.lookFor(LOOK_STRUCTURES).filter(l => l.structureType === STRUCTURE_ROAD).length > 0
    const statusFunctionObject = {
        developedRoom: developedRoom,
        empty: empty,
        somewhatFull: somewhatFull,
        full: full,
        energized: energized,
        fresh: fresh,
        tired: tired,
        exhausted: exhausted,
        pickupable: pickupable,
        harvestable: harvestable,
        emptyE: emptyE,
        withdrawable: withdrawable,
            onRoad: onRoad
    }
    const statusFunctionArray = [
        ['developedRoom'. developedRoom],
        ['empty'. empty],
        ['somewhatFull'. somewhatFull],
        ['full'. full],
        ['energized'. energized],
        ['fresh'. fresh],
        ['tired'. tired],
        ['exhausted'. exhausted],
        ['pickupable'. pickupable],
        ['harvestable'. harvestable],
        ['emptyE'.emptyE],
        ['withdrawable'.withdrawable],
            ['onRoad', onRoad]
    ]
    if(typeof testStatus === 'string' && typeof statusFunctionObject[testStatus] !== 'function' ) console.log('main 66 testStatus is not a function ' + testStatus)
    return typeof testStatus === 'string' ? statusFunctionObject[testStatus](this) : statusFunctionArray.filter(sf => sf[1](this)).map(sf => sf[0])
}

const func = {
    parentType: _.memoize(type => CREEP_TYPES.filter(t => t[2].type === type)[0][0])
    
}

//console.log(Game.cpu.getUsed() + ' t2')
//impure-reads state of the world
const getWorldState = () => {
    const gws1 = Game.cpu.getUsed()
    var rooms = []
    var i
    var creepObject = {}
    var siteObject = {}
    var flagObject = {}
    var structureObject = {}
    for (i in Game.rooms) if ({}.hasOwnProperty.call(Game.rooms, i)) rooms.push(Game.rooms[i])
    const roomStat = roomStatus(Game.time)
    const gws2 = Game.cpu.getUsed()
    for (i in Game.creeps) {
        creepObject[Game.creeps[i].pos.roomName] === undefined ? creepObject[Game.creeps[i].pos.roomName] = [Game.creeps[i]] : creepObject[Game.creeps[i].pos.roomName].push(Game.creeps[i])
    }
    for (i in Game.flags) {
        flagObject[Game.flags[i].pos.roomName] === undefined ? flagObject[Game.flags[i].pos.roomName] = [Game.flags[i]] : flagObject[Game.flags[i].pos.roomName].push(Game.flags[i])
    }
    for (i in Game.structures) {
        structureObject[Game.structures[i].pos.roomName] === undefined ? structureObject[Game.structures[i].pos.roomName] = [Game.structures[i]] : structureObject[Game.structures[i].pos.roomName].push(Game.structures[i])
    }
    for (i in Game.constructionSites) {
        siteObject[Game.constructionSites[i].pos.roomName] === undefined ? siteObject[Game.constructionSites[i].pos.roomName] = [Game.constructionSites[i]] : siteObject[Game.constructionSites[i].pos.roomName].push(Game.constructionSites[i])
    }

    const roomStatusAr = rooms.map(r => roomStat(r, {
        creeps: creepObject[r.name],
        structures: structureObject[r.name],
        sites: siteObject[r.name],
        flags: flagObject[r.name],
    }))
    const gws3 = Game.cpu.getUsed()
    const roomStatuses = roomStatusAr.reduce((pv, cv) => {
        pv[cv.name] = cv
        return pv
    }, {})
    const gws4 = Game.cpu.getUsed()
    const empireStat = empireStatus(strat)(roomStatusAr)
    const gws5 = Game.cpu.getUsed()
    const retVal = {
        //Memory: Memory,
        //Game: Game,
        strat: strat,
        creepTypes: CREEP_TYPES,
        roomStatus: roomStatuses,
        empireStatus: empireStat,
        func: func
    }
    const gws6 = Game.cpu.getUsed()
    //console.log('main getworldState ' + JSON.stringify(empireStat))
    if(gws6 - gws1 > 10 && Game.cpu.bucket < 10000) console.log('gws times: 1-2: ' + (gws2 - gws1) + ' 2-3: ' + (gws3 - gws2) + ' 3-4: ' + (gws4 - gws3) + ' 4-5: ' + (gws5 - gws4) + ' 5-6: ' + (gws6 - gws5))
    return retVal
}
const creepBodyCost = creep => creep.body.reduce((total, part) => total + BODYPART_COST[part.type], 0)
    //pure
const hostileCreeps = room => room.find(FIND_HOSTILE_CREEPS)
    //pure
const hostileCreepsInRoom = room => hostileCreeps(room).length > 0
    //pure
const hostileStructures = room => room.find(FIND_HOSTILE_STRUCTURES)
    //pure
const hostileStructuresInRoom = room => hostileStructures(room).length > 0
    //pure
const getGlobalPriorities = worldState => 'expansion'
    //pure
const getRoomState = (worldState, roomName) => Game.worldState.rooms[roomName]
    //pure
const getRoomPriority = (worldState, room) => {
    const globalP = getGlobalPriorities(worldState)
    const hostileCreepsPresent = hostileCreepsInRoom(room)
    const hostileStructuresPresent = hostileStructuresInRoom(room)
    const specified = Game.worldState.strat[room.name]
    if (specified) return specified
    if (hostileStructuresPresent) return 'expansion'
    if (hostileCreepsPresent) return 'expansion'
    return globalP
}
//pure
const getRoomSourceCount = room => room.find(FIND_SOURCES).length
const creepExpander = (group, base = []) => count => {
    if (count < 1) return base
        //console.log(JSON.stringify(group.concat(group)) + 'x' + count)
    return creepExpander(group, base.concat(group))(count - 1)
}
//impure-may issue commands to game
const roomInstructions = strat => (roomStatus, room) => {
    //const roomPriority = getRoomPriority(worldState, room)
    //console.log('room ' + room.name + ' roomStatus: ' + roomStatus.name)
    rooms.expansion(strat)(roomStatus, room)
    return ERR_INVALID_ARGS
}
//impure-may issue commands to game
const structureInstructions = worldState => struct => {
    const startCpu = Game.cpu.getUsed()
    structures.expansion(worldState)(struct)
    //if(Game.cpu.bucket < 10000) console.log(Game.cpu.getUsed() - startCpu + ' strucTime ' + struct.structureType)
    return ERR_INVALID_ARGS
}
const actionMap = creep => actionObject => {
    if(!actionObject) return
    //console.log('main 186 creep ' + creep.name + ' action Object ' + JSON.stringify(actionObject))
    const retVal = actionObject.length && typeof creep[actionObject[0]] === 'function' ? creep[actionObject[0]](actionObject[1], actionObject[3]) : ERR_INVALID_ARGS
    //console.log('creep execution error ' + creep.name + JSON.stringify(actionObject))
    return retVal

}
//impure-may issue commands to game
const creepInstructions = worldState => creep => {
    //if(creep.name === 'Colton') console.log(creep.name + ' ' + creep.type('colonist'))

    const workerStart = Game.cpu.getUsed()
    const startCpu = Game.cpu.getUsed()
    const retVal = creeps.expansion(worldState)(creep)
    const workerFinish = Game.cpu.getUsed()
    //console.log(worker.name + ' times: t1: ' + (workerT1 - workerStart) + ' t2: ' + (workerT2 - workerT1) + ' t3: ' + (workerT3 - workerT2) + ' fin: ' + (workerFinish - workerT3))
    if(workerFinish - workerStart > 5 && Game.cpu.bucket < 9000) console.log(creep.name + ' ' + JSON.stringify(creep.type()) + ' long eval ' + JSON.stringify(workerFinish - workerStart))
    return retVal
}

const roomObjectsByRoomName = (prevObjects, obj) => {
    const prevRoomObjects = prevObjects[obj.room.name]
    let curRoomObjects = prevRoomObjects !== undefined ? prevRoomObjects : []
    curRoomObjects.push(obj)
    let retVal = prevObjects
    retVal[obj.room.name] = curRoomObjects
    return retVal
}
const transportActionMap = transNeeded => roomStatus => {
    const preppedAction = transportAction(transNeeded)(roomStatus)
    return t => preppedAction(t).map(actionMap(t))
}
const superTransportActionMap = transNeeded => roomStatus => {
    const preppedAction = superTransportAction(transNeeded)(roomStatus)
    return t => preppedAction(t).map(actionMap(t))
}
const creepActionMap = actionFunc => roomStatus => {
    const preppedAction = actionFunc(roomStatus)
    return t => preppedAction(t).map(actionMap(t))
}
const preCreepMem = Memory.creeps
for (var name in Memory.creeps) {
    if (!Game.creeps[name]) {
        delete Memory.creeps[name]
        //console.log('Clearing non-existing creep memory:', name)
    }
}
module.exports.loop = () => {
    const loop0 = Game.cpu.getUsed()
    if(Game.cpu.bucket < 1000) return
    
    const loopA = Game.cpu.getUsed()
    //const creeps = Object.keys(Game.creeps).reduce((pv, cv) => roomObjectsByRoomName(pv, Game.creeps[cv]), {})
    //console.log('main 223 creeps time ' + (Game.cpu.getUsed() - loop0))

    Game.worldState = getWorldState()
    const worldState = {}
    const loop1 = Game.cpu.getUsed()
    const roomInst = roomInstructions(Game.worldState.strat)
    //console.log(Game.cpu.getUsed() + ' t3')
    // Always place this memory cleaning code at the very top of your main loop!
    var i
    if (Game.cpu.bucket > 4500 || Game.cpu.getUsed() === 0) for (i in Game.rooms) if ({}.hasOwnProperty.call(Game.rooms, i)) roomInst(Game.worldState.roomStatus[Game.rooms[i].name], Game.rooms[i])

    Game.worldState.strat.outpost.filter(x => Game.rooms[x] && true).map(x => outpost(Game.rooms[x]))
    const loop2 = Game.cpu.getUsed()
    const structureInst = structureInstructions(worldState)

    for (i in Game.structures) {
        const cmdStruct = [STRUCTURE_SPAWN, STRUCTURE_TOWER, STRUCTURE_LINK, STRUCTURE_TERMINAL]
        const ownP = {}.hasOwnProperty.call(Game.structures, i)
        const struct = ownP ? Game.structures[i] : {}
        const instrucNeeded = ownP && cmdStruct.indexOf(struct.structureType) > -1 && (Game.time % 25 === 0 || struct.structureType === STRUCTURE_TOWER || Game.cpu.bucket > 9950)
        //if(instrucNeeded) console.log(struct.structureType)
        if (instrucNeeded) structureInst(struct)
    }
    const loop3 = Game.cpu.getUsed()
    const creepInst = creepInstructions(worldState)
    
    //console.log(Game.cpu.getUsed() + ' t4')
    for (i in Game.creeps) if ({}.hasOwnProperty.call(Game.creeps, i)) creepInst(Game.creeps[i])
    const loop4 = Game.cpu.getUsed()
    const creepRooms = Object.keys(Game.worldState.roomStatus)
    const loop5 = Game.cpu.getUsed()
    const preppedTransAction = transportActionMap(Game.worldState.empireStatus.roomsNeedTransport)
    const preppedSuperTransAction = superTransportActionMap(Game.worldState.empireStatus.roomsNeedTransport)
    creepRooms.map(k => Game.worldState.roomStatus[k].transports.map(preppedTransAction(Game.worldState.roomStatus[k])))
    creepRooms.map(k => Game.worldState.roomStatus[k].superTransports.map(preppedSuperTransAction(Game.worldState.roomStatus[k])))
    creepRooms.map(k => Game.worldState.roomStatus[k].tenders.map(t => tenderAction(Game.worldState.roomStatus[k])(t).map(actionMap(t))))
    const loop6 = Game.cpu.getUsed()
    creepRooms.map(k => Game.worldState.roomStatus[k].workers.map(creepActionMap(workerAction)(Game.worldState.roomStatus[k])))
    const loop7 = Game.cpu.getUsed()
    creepRooms.map(k => Game.worldState.roomStatus[k].miners.map(creepActionMap(minerAction)(Game.worldState.roomStatus[k])))
    const loop8 = Game.cpu.getUsed()
    creepRooms.map(k => Game.worldState.roomStatus[k].workhorses.map(creepActionMap(workhorseAction)(Game.worldState.roomStatus[k])))
    const loop9 = Game.cpu.getUsed()
    creepRooms.map(k => Game.worldState.roomStatus[k].scouts.map(t => scoutAction(Game.worldState.roomStatus[k])(t).map(actionMap(t))))
    const loop10 = Game.cpu.getUsed()
    creepRooms.map(k => Game.worldState.roomStatus[k].soldiers.map(t => soldierAction(Game.worldState.roomStatus[k])(t).map(actionMap(t))))
    const loop11 = Game.cpu.getUsed()
    //if(Game.cpu.bucket < 9000) console.log('bucket: ' + Game.cpu.bucket)
    //console.log(Game.cpu.getUsed() + ' t4a')
    //console.log(Game.cpu.getUsed())
    //console.log(Game.cpu.getUsed() + ' t5')
    //console.log('main 323 empireStatus: roomsNeedJumper' + JSON.stringify(Game.worldState.empireStatus.roomsNeedJumper))
    const finalTime = Game.cpu.getUsed()
    const finalDiff = Game.cpu.limit - finalTime
    if(Game.cpu.bucket < 9000 || (finalDiff < -1 * Game.cpu.limit)) console.log('bucket: ' + Game.cpu.bucket + (finalTime > Game.cpu.limit ? '-' + (finalTime - Game.cpu.limit) : '+' + (Game.cpu.limit - finalTime)) + ' tick: ' + Game.time + ' getWorldState: ' + (loop1 - loop0) + ' rooms and outposts: ' + (loop2 - loop1) + ' structures: ' + (loop3 - loop2) + ' old creeps: ' + (loop4 - loop3) + ' new creep prep: ' + (loop5 - loop4) + ' transports: ' + (loop6 - loop5) + ' workers: ' + (loop7 - loop6) + ' miners: ' + (loop8 - loop7) + ' workhorse: ' + (loop9 - loop8) + ' scout: ' + (loop10 - loop9) + ' soldier: ' + (loop11 - loop10) + ' total ' + finalTime)
    }

/* creepRooms.map(k => Game.worldState.roomStatus[k].scouts.map(t => {
        const action = scoutAction(Game.worldState.roomStatus[k])(t)
        console.log(k + ' ' + JSON.stringify(action))
        action.map(actionMap(t))
        }))*/