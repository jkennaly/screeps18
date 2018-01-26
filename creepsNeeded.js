var memo = {}
var counted = {}
const reportableTime = 1.00
const noLinkFilter = c => c.pos.findInRange(FIND_MY_STRUCTURES, 1, {filter: s => s.structureType === STRUCTURE_LINK}).length === 0

const timeCall = (descriptor, warnTime) => timedFunc => {
    //console.log('set up timed call ' + Game.cpu.getUsed())
    //console.log(timedFunc)
    const retVal = function() {
        const arg2 = arguments
            //console.log('arg2 ' + JSON.stringify(arg2))
            //console.log('arg3 ' + JSON.stringify(arg3))
            //console.log('execute timed call ' + Game.cpu.getUsed())
        let startCpu = Game.cpu.getUsed()
        let retVal2 = timedFunc.apply(this, arg2)
        let endCpu = Game.cpu.getUsed()
        let timeElapsed = endCpu - startCpu
        if (timeElapsed > warnTime && Game.cpu.bucket < 10000) console.log(descriptor + JSON.stringify(timeElapsed))
        return retVal2
    }
    return retVal
}
const notEdgeFilter = c => c.pos.x > 1 && c.pos.x < 48 && c.pos.y > 1 && c.pos.y < 48

const roomDefined = roomName => Game.rooms[roomName] !== undefined
const posMatch = posArrayArray => posArrayArray && posArrayArray.length && posArrayArray.length > 1 && posArrayArray.reduce((pv, cv) => pv && cv.length > 0, true) ? posArrayArray.reduce(
    (prev, posArray, pAAi, pAA) => prev || !pAAi && posArray && posArray.length && posArray.reduce(
    (posMatch, pos) => posMatch || pAA.reduce(
    (matched, pA, ari) => matched && (ari === 0 || pA.filter(p => _.isEqual(p, pos)).length > 0,
    true), false), false)) : false
const hostileCreepsPresent = room => room.findHostileCreeps()
const roomSafe = (roomName) => roomDefined(roomName) && hostileCreepsPresent(Game.rooms[roomName]).filter(notEdgeFilter).length === 0
const reservationNeeded = (room) => room && room.controller && (room.controller.reservation && room.controller.reservation.username === 'black0441' && room.controller.reservation.ticksToEnd < 500 || (room.controller.reservation === undefined && room.controller.owner === undefined))
//const spawnRoomChargedWithMaint = (roomName) => Game.worldState.strat.outpost.includes(roomName) && 

const theRoom = (roomName) => Game.rooms[roomName]
//Game.w

const roomNameFromFlag = _.memoize(flag => flag.name.indexOf('=') > -1 ? flag.name.slice(0, flag.name.indexOf('=')) : flag.name)

const soldierTypes = [
    'fastMelee',
    'melee',
    'slowMelee',
    'defMelee',
    'skMelee',
    'skKnight',
    'support',
    'barricadeMan',
    'healer',
    'wallBreaker',
    'towerCrasher',
    'privateer',
    'chewer',
]

const present = (roomName) => type => roomDefined(roomName) ? soldierTypes.indexOf(type) > -1 ? Game.worldState.roomStatus[roomName].soldiers.filter(c => c.type(type)).length : Game.worldState.roomStatus[roomName].friendlyCreeps.filter(c => c.type(Game.worldState.func.parentType(type)) && c.ticksToLive > 100).length : 0
const workerFunc = timeCall('creepsNeeded workerFunc', reportableTime)((roomName, workerRate = 15) => {
    //console.log('creepsNeeded 49 workerFunc roomName ' + roomName)
    const room = theRoom(roomName)
    const roomIsSafe = roomSafe(roomName)
    const roomStatus = Game.worldState.roomStatus[roomName]

    const highIncome = roomStatus.resources.filter(r => r.amount > 1000).length > 0
    const fullSupply = roomStatus.storage === undefined && roomStatus.controllerContainers.filter(c => c.store[RESOURCE_ENERGY] > 1800).length > 0
    const roomStable = roomStatus.workRemaining < 2000
    const lackStorage = roomStatus.storage === undefined && roomStatus.controllerContainers.length === 0
    const wanderingWorkers = roomStatus.workers.filter(w => !w.pos.nearController()).length > 0

    const highSurplus = () => (roomStatus.upgradeEnergyAvailable - 10000 - roomStatus.workers.reduce((total, w) => total + (w.ticksToLive * w.partCount(WORK)), 0)) / (workerRate * 1500)
    const normalBuild = roomStatus.enemyCreeps.length === 0 && roomStatus.possessed && roomStatus.transports.length > 0 && roomStatus.workers.filter(c => c.ticksToLive > 1000).length === 0 ? highSurplus() : 0
    const initBuild = roomStatus.workers.length === 0 && roomStatus.controllerContainers.length > 0 && roomStatus.controllerContainers.filter(c => _.sum(c.store) > 1800).length > 0 && roomStatus.storage === undefined
    
    if(lackStorage || wanderingWorkers) return 0

    const retVal = initBuild ? 1 : roomStatus.storage === undefined && roomStable && fullSupply ? roomStatus.workers.length + 1 : normalBuild
    //console.log(roomName + ' creepsNeeded 73 worker roomStatus.workRemaining ' + roomStatus.workRemaining + ' worker retVal ' + retVal)
    //console.log(roomName + ' creepsNeeded 73 worker highIncome ' + highIncome + ' worker retVal ' + retVal)
    //console.log(roomName + ' creepsNeeded 73 worker roomStable ' + roomStable + ' worker retVal ' + retVal)
    //console.log(roomName + ' creepsNeeded 73 worker fullSupply ' + fullSupply + ' worker retVal ' + retVal)
    //const testVal = typeFunctions.present(roomName)('staticWorker')
    return retVal
})

const staticWorkerFunc = (roomName) => theRoom(roomName) && theRoom(roomName).energyCapacityAvailable >= 2000 ? workerFunc(roomName) : 0
const smallWorkerFunc = (roomName) => {
    //console.log('smallWorkerFunc')
    //console.log(JSON.stringify(theRoom(roomName)))
    const room = theRoom(roomName)
    const smallWorkerEnergyOk = room && room.energyCapacityAvailable >= 1050 && room.energyCapacityAvailable < 2000
    return smallWorkerEnergyOk ? workerFunc(roomName, 9) : 0
}
const tinyWorkerFunc = (roomName) => {
    //console.log('smallWorkerFunc')
    //console.log(JSON.stringify(theRoom(roomName)))
    const room = theRoom(roomName)
    const tinyWorkerEnergyOk = room && room.energyCapacityAvailable >= 750 && room.energyCapacityAvailable < 1050
    return tinyWorkerEnergyOk ? workerFunc(roomName, 6) : 0
}
const miniWorkerFunc = (roomName) => {
    //console.log( 'creepsNeeded 95 miniWorkerFunc ' + roomName)
    //console.log(JSON.stringify(theRoom(roomName)))
    const room = theRoom(roomName)
    const tinyWorkerEnergyOk = room && room.energyCapacityAvailable < 750
    return tinyWorkerEnergyOk ? workerFunc(roomName, 4) : 0
}
const quickWorkerFunc = (roomName) => {
    const room = theRoom(roomName)
    const myRoom  = typeof room === 'object' && room.controller && room.controller.my
    const roomStatus = Game.worldState.roomStatus[roomName]
    const safe = roomStatus.enemyCreeps.length === 0
    const fullCtrlLink = roomStatus.controllerLinks.length > 0
    const noWorkers = roomStatus.workers.length === 0
    const retVal = roomStatus && fullCtrlLink && noWorkers ? 1 : 0
    //if(roomName === 'E31S37') console.log(roomName + ' creepsNeeded 114 fullCtrlLink ' + JSON.stringify(fullCtrlLink))
    //if(roomName === 'E31S37') console.log(roomName + ' creepsNeeded 114 noWorkers ' + JSON.stringify(noWorkers))
    //console.log(roomName + ' creepsNeeded 114 quickWorkers retVal ' + JSON.stringify(retVal))
    
    return  retVal
}

const transportFunc = timeCall('creepsNeeded transportFunc', reportableTime)((roomName) => {
    const room = theRoom(roomName)
    const myRoom  = typeof room === 'object' && room.controller && room.controller.my
    const roomStatus = Game.worldState.roomStatus[roomName]
    const safe = roomStatus.enemyCreeps.length === 0
    const emptyStorage = roomStatus.storage !== undefined || roomStatus.controllerContainers.filter(c => _.sum(c.store) < 800).length > 0
    const fullMines = roomStatus.minerContainers.filter(c => _.sum(c.store) >= 0.98 * c.storeCapacity).length > 0
    const maxTrans = roomStatus.containers.length * 2
    const transMaxed = roomStatus.transports.length >= maxTrans
    const minTrans = _.max([1, roomStatus.room.energyCapacityAvailable / 1000])
    const transportinNeeded = emptyStorage && fullMines && safe && !transMaxed
    const retVal = roomStatus ? (transportinNeeded ? roomStatus.transports.length + 1 : minTrans) : 0
    //console.log(roomName + ' creepsNeeded 114 minTrans ' + JSON.stringify(minTrans))
    //console.log(roomName + ' creepsNeeded 114 fullMines ' + JSON.stringify(fullMines))
    
    return  retVal
})
const defFlagsPrep = (type, squadType = 'attackSquad') => flag => {
    const assocRoom = flag.assocRoomName()
    const assocRoomStatus = Game.worldState.roomStatus[assocRoom]
    if(assocRoomStatus === undefined || Game.worldState.strat[squadType][type] === undefined) return false
    const retVal = Game.worldState.strat[squadType][type] > assocRoomStatus.soldiers.filter(s => s.type() === type).length
    return retVal
}
const soldierFunc = timeCall('creepsNeeded soldierFunc', reportableTime)((type, squadType = 'attackSquad') => (roomName) => {
    
    const roomStatus = Game.worldState.roomStatus[roomName]
    const attackFlags = roomStatus.flags.filter(f => f.color === COLOR_RED)
    if(!attackFlags.length || Game.worldState.empireStatus.typeComplete(type, squadType, 200)) return 0
    if(squadType !== 'defenseSquad') return 1
    return roomStatus.enemyCreeps.length - roomStatus.towers.length
})


const colonistFunc = timeCall('creepsNeeded colonistFunc', reportableTime)((roomName) => {
    const room = theRoom(roomName)
    //colony in strat
    const myRoom  = typeof room === 'object' && room.controller && room.controller.my
    const roomStatus = Game.worldState.roomStatus[roomName]
    const neighbors = myRoom ? room.neighbors() : []
    const colonyFlags = myRoom ? roomStatus.flags.filter(f => f.color === COLOR_ORANGE || f.color === COLOR_YELLOW) : []
    const colonialNeighbors = colonyFlags.map(f => f.assocRoomName())
    const neighborNeedsColonist = colonialNeighbors.reduce((pv, cv) => pv || Game.worldState.empireStatus.roomsNeedColonist.indexOf(cv) > -1, false)
    
    //colony is neighbor of current room
    //current room is safe
    const spawnSafe = roomSafe(roomName)
    //console.log(roomName +' creepsNeeded 143 colonialNeighbors ' + JSON.stringify(colonialNeighbors))
    //console.log(roomName +' creepsNeeded 143 Game.worldState.empireStatus.roomsNeedColonist ' + JSON.stringify(Game.worldState.empireStatus.roomsNeedColonist))
    return  spawnSafe && neighborNeedsColonist ? 1 : 0
})

const scoutFunc = timeCall('creepsNeeded scoutFunc', reportableTime)((roomName) => {
    var memo = {}
    const room = theRoom(roomName)
    const roomStatus = Game.worldState.roomStatus[roomName]
    const empireStatus = Game.worldState.empireStatus
    const longPaths = roomStatus ? roomStatus.flags.filter(f => f.color === COLOR_ORANGE).map(f => f.assocRoomNames()).reduce((p, c) => p.concat(c), []) : []


    //const colonyDesignateNames = Game.worldState.strat.colony.concat(Game.worldState.strat.outpost).concat(longPaths).filter(n => !roomDerivedSafe(worldState, n))
    const neighbors = room ? roomStatus.flags.map(f => f.assocRoomName()).filter(f => f && f.length) : []
    const neighborNeedsScout = roomStatus && roomStatus.scouts.length === 0 ? neighbors.map(n => !Game.worldState.roomStatus[n] || Game.worldState.roomStatus[n].scouts.length === 0)
        .reduce((p,c) => p || c, false) : false
    const spawnSafe = roomSafe(roomName)
    //console.log(roomName + ' creepsNeeded scoutFunc colonyDesignateNames ' + JSON.stringify(colonyDesignateNames))
    //console.log(roomName + ' neighborNeedsScout ' + JSON.stringify(neighborNeedsScout))
    //console.log(roomName + ' neighborNeedsScout ' + JSON.stringify(neighborNeedsScout))
    return  spawnSafe && neighborNeedsScout ? 1 : 0
})

const workhorseFunc = timeCall('creepsNeeded workhorseFunc', reportableTime)((roomName) => {
    const room = theRoom(roomName)
    const myRoom  = typeof room === 'object' && room.controller && room.controller.my
    const roomStatus = Game.worldState.roomStatus[roomName]
    const repairWalls = roomStatus ? roomStatus.repairWalls(Game.time)(room) : []
    const workhorses = roomStatus !== undefined ? roomStatus.workhorses : []
    const transports = roomStatus !== undefined ? roomStatus.transports : []
    const miners = roomStatus !== undefined ? roomStatus.miners : []
    const workers = roomStatus !== undefined ? roomStatus.workers : []
    const workhorseCount = workhorses.length
    const construction = roomStatus ? roomStatus.sites.filter(s => !s.pos.nearController() || roomStatus.storage === undefined && roomStatus.controllerContainers.length === 0).length : 0
    //console.log(repairWalls)
    const repairs = Math.floor(repairWalls.filter(s => s && s.pos && !s.pos.nearController()).length / 3)
    //console.log(roomName + ' ' + repairs)
    const newWorkhorses = workhorses.filter(c => c.ticksToLive > 1000).length
    const newNewWorkhorses = workhorses.filter(c => c.ticksToLive > 1250).length
    const neighbors = room ? room.neighbors() : []
        //.map(n => theRoom(n))
    const minersPresent = miners.length > 0
    const transportsPresent =transports.length > 0
    const workersPresent = workers.length > 0

    const creepsPresent = myRoom && roomStatus.friendlyCreeps.length > 0

    const colonyWorkhorsesNeeded = roomStatus && roomStatus.flags.filter(f => f.color === COLOR_ORANGE).map(f => f.destRoomName()).filter(n => Game.worldState.roomStatus[n] && Game.worldState.roomStatus[n].workhorses < 2 && Game.worldState.roomStatus[n].controller && Game.worldState.roomStatus[n].controller.level <= 3 && Game.worldState.roomStatus[n].controller.my).length > 0
    const wildcatWorkhorsesNeeded = roomStatus && roomStatus.flags.filter(f => f.color === COLOR_YELLOW).map(f => f.destRoomName()).filter(n => Game.worldState.roomStatus[n] && Game.worldState.roomStatus[n].workhorses < 2 && Game.worldState.roomStatus[n].controller && Game.worldState.roomStatus[n].controller.my && Game.worldState.roomStatus[n].sites.filter(s => s.structureType === STRUCTURE_SPAWN).length > 0).length > 0

    const pickup = roomStatus && roomStatus.controllerContainers.length === 0 && roomStatus.storage === undefined && roomStatus.pickup.filter(p => p.amount > 1000).length > 0 ? workhorseCount + 1 : 0
    const eDistNeeded = roomStatus.room.energyAvailable >= roomStatus.room.energyCapacityAvailable
    const workhorsesSeasoned = roomStatus && roomStatus.workhorses.filter(w => w.ticksToLive > 1200).length === 0
    if(pickup > 0 && !eDistNeeded && workhorsesSeasoned) return pickup
    //console.log(room.name)
    const roomEnergyAvailable = !myRoom || !room.storage || room.storage.store[RESOURCE_ENERGY] > 10000

    const roomUpgrades = roomEnergyAvailable ? construction + repairs : 0

    const creepsLow = creepsPresent ? 0 : 1

    const lackingStorage = roomStatus && roomStatus.storage === undefined && roomStatus.controllerContainers.length === 0
    const transportsFull = roomStatus && roomStatus.transports.filter(t => t.status('emptyE')).length === 0 && roomStatus.room.energyAvailable >= roomStatus.room.energyCapacityAvailable
    const energyPiling = roomStatus && roomStatus.resources.filter(p => p.amount > 1000).length > 0
    const developmentSupportNeeded = lackingStorage && transportsFull && energyPiling && workhorsesSeasoned
    //console.log(roomName + ' creepsNeeded 253 developmentSupportNeeded ' + JSON.stringify(developmentSupportNeeded))
    const workBacklog = roomStatus && roomStatus.workRemaining >= 200 && roomStatus.controllerContainers.filter(c => c.store[RESOURCE_ENERGY] > 1800).length > 0 && roomStatus.storage === undefined && roomStatus.workers.length === 0
    //console.log(roomName + ' creepsNeeded 253 workBacklog ' + JSON.stringify(workBacklog))
    if(developmentSupportNeeded || workBacklog) return roomStatus.workhorses.length + 1



    const localWorkhorsesNeeded = myRoom && !newNewWorkhorses ? roomUpgrades + pickup + creepsLow : 0

    //console.log(roomName + ' creepsNeeded 253 roomUpgrades ' + JSON.stringify(roomUpgrades))
    //console.log(roomName + ' creepsNeeded 253 roomStatus.netIncome ' + JSON.stringify(roomStatus.netIncome))
    //console.log(roomName + ' creepsNeeded 253 roomStatus.workRemaining ' + JSON.stringify(roomStatus.workRemaining))
    //if(roomName === 'W27S91') console.log(roomName + ' creepsNeeded construction ' + construction + ' repairs ' + repairs + ' pickup ' + pickup)
    //console.log(roomName + ' creepsNeeded wildcatWorkhorsesNeeded ' + wildcatWorkhorsesNeeded)
    //console.log(roomName + ' creepsNeeded colonyWorkhorsesNeeded ' + colonyWorkhorsesNeeded)
    const retVal = myRoom && roomEnergyAvailable && (localWorkhorsesNeeded > workhorseCount || ((colonyWorkhorsesNeeded || wildcatWorkhorsesNeeded) && workhorseCount === 0)) ? workhorseCount + 1 : 0
    //console.log(roomName + ' creepsNeeded workhorseCount ' + workhorseCount)
    //console.log(roomName + ' creepsNeeded retVal ' + retVal)
    return retVal
})

const minerFunc = timeCall('creepsNeeded minerFunc', reportableTime)((roomName) => {
    var memo = {}
    const room = theRoom(roomName)
    const roomStatus = Game.worldState.roomStatus[roomName]
    if(!roomStatus || roomStatus.lairs.length > 0) return 0
    const longPaths = roomStatus ? roomStatus.flags.filter(f => f.color === COLOR_ORANGE).map(f => f.assocRoomNames()).reduce((p, c) => p.concat(c), []) : []
    const roomMiningOk = roomName => {
            if(memo[Game.cpu.tick] && memo[Game.cpu.tick][roomName]) return memo[Game.cpu.tick][roomName]
            if(!memo[Game.cpu.tick]) memo[Game.cpu.tick] = {}
            const roomStatus = Game.worldState.roomStatus[roomName]
            if(!roomStatus) return true
            const safe = roomSafe(roomName) && roomStatus.skTargets.length === 0
            const defined = roomStatus !== undefined
            const containsMiners = defined && roomStatus.miners.filter(m => m.ticksToLive > 100).length >= roomStatus.harvestTargets.length

            const controlled = roomStatus && roomStatus.controller && roomStatus.controller.my
            const wildcatSupportNeeded = controlled && roomStatus.room.energyCapacityAvailable < 550
            const wildcatResourcesPresent = controlled && roomStatus.resources.filter(r => r.amount > 1000).length > 0
            const wildcatHarvestSatisfied = roomStatus.miners.length >= roomStatus.harvestTargets.length
            const wildcatMinerInhibit = !wildcatSupportNeeded || controlled && roomStatus.room.energyCapacityAvailable >= 550 || wildcatHarvestSatisfied

            const remoteFlags = roomStatus ? roomStatus.flags.filter(f => f.color === COLOR_BLUE || f.color === COLOR_ORANGE || f.color === COLOR_PURPLE || f.color === COLOR_YELLOW) : []
            const minersNotNeeded = safe && defined && containsMiners && !wildcatSupportNeeded || wildcatSupportNeeded && wildcatMinerInhibit
            //if(roomName === 'W37N5') console.log(roomName + ' creepsNeeded 227 minerFunc minersNotNeeded ' + minersNotNeeded )
            //if(roomName === 'W37N5') console.log(roomName + ' creepsNeeded 227 minerFunc wildcatSupportNeeded ' + wildcatSupportNeeded )
            //if(roomName === 'W37N5') console.log(roomName + ' creepsNeeded 227 minerFunc wildcatMinerInhibit ' + wildcatMinerInhibit )
            memo[Game.cpu.tick][roomName] = minersNotNeeded
            if(remoteFlags.length === 0 || !minersNotNeeded) return minersNotNeeded
            const remoteRoomsOk = remoteFlags.map(f => roomMiningOk(f.assocRoomName())).reduce((p,c) => p && c, true)
            return remoteRoomsOk
        }

    //const colonyDesignateNames = Game.worldState.strat.colony.concat(Game.worldState.strat.outpost).concat(longPaths).filter(n => !roomDerivedSafe(worldState, n))

    //const neighbors = room ? room.neighbors() : []
    const neighborNeedsMiner = [roomName].map(n => !roomMiningOk(n))
        .reduce((p,c) => p || c, false)
    const spawnSafe = roomSafe(roomName) && roomStatus.skTargets.length === 0
    //console.log(roomName + ' creepsNeeded 284 MinerFunc spawnSafe ' + JSON.stringify(spawnSafe))
    //console.log(roomName + ' neighborNeedsMiner ' + JSON.stringify(neighborNeedsMiner))
    const retVal = spawnSafe && neighborNeedsMiner ? roomStatus.harvestTargets.length + 1 : 0
    //if(roomName === 'W5S72') console.log(roomName + ' retVal ' + JSON.stringify(retVal))
    return retVal
})
const remoteMinerFunc = (roomName) => {
    //console.log('smallWorkerFunc')
    //console.log(JSON.stringify(theRoom(roomName)))
    const room = theRoom(roomName)
    const smallMinerEnergyOk = room && (room.energyCapacityAvailable >= 900 || !room.controller || !room.controller.my)
    return smallMinerEnergyOk ? minerFunc(roomName) : 0 
}
const smallMinerFunc = (roomName) => {
    //console.log('smallWorkerFunc')
    //console.log(JSON.stringify(theRoom(roomName)))
    const room = theRoom(roomName)
    const smallMinerEnergyOk = room && room.energyCapacityAvailable >= 800 && room.energyCapacityAvailable < 900
    return smallMinerEnergyOk ? minerFunc(roomName) : 0
}
const tinyMinerFunc = (roomName) => {
    //console.log('smallWorkerFunc')
    //console.log(JSON.stringify(theRoom(roomName)))
    const room = theRoom(roomName)
    const smallMinerEnergyOk = room && room.energyCapacityAvailable >= 550 && room.energyCapacityAvailable < 800
    return smallMinerEnergyOk ? minerFunc(roomName) : 0
}

const jumperFunc = timeCall('creepsNeeded jumperFunc', reportableTime)((roomName) => {
    const room = theRoom(roomName)
    const myRoom  = typeof room === 'object' && room.controller && room.controller.my
    const roomStatus = Game.worldState.roomStatus[roomName]
    if(!roomStatus) return 0
    const jumperNeeds = roomStatus.flags.filter(f => f.color !== COLOR_YELLOW && f.color !== COLOR_CYAN)
        .map(f => f.destRoomName())
        .map(n => (Game.worldState.roomStatus[n] && Game.worldState.roomStatus[n].jumpers.filter(c => c.ticksToLive > 100).length < 1) && Game.worldState.roomStatus[n].enemies.length === 0 ? reservationNeeded(Game.rooms[n]) : false)
    const jumpersNeeded = roomStatus.flags
        .filter(f => f.color !== COLOR_YELLOW && f.color !== COLOR_CYAN)
        .filter(f => Game.worldState.empireStatus.roomsNeedJumper.indexOf(f.assocRoomName()) > -1)
        .length > 0
    
    return jumpersNeeded  ? 1 : 0

})

const defMeleeFunc = timeCall('creepsNeeded defMeleeFunc', reportableTime)((roomName) => {
    const room = theRoom(roomName)
    const myRoom  = typeof room === 'object' && room.controller && room.controller.my
    const roomStatus = Game.worldState.roomStatus[roomName]
    if(!roomStatus) return 0
    const defMeleeNeeds = roomStatus.flags
        .map(f => f.destRoomName())
        .map(n => Game.worldState.empireStatus.roomsNeedDefMelee.indexOf(n) > -1)
    const defMeleeNeeded = defMeleeNeeds.reduce((p, c) => p || c, false) || roomStatus.enemyFreeCreeps.length > roomStatus.towers.filter(t => t.energy >= 0.8 * t.energyCapacity).length
    
    return defMeleeNeeded  ? 1 : 0

})

const tenderFunc = timeCall('creepsNeeded tenderFunc', reportableTime)((roomName) => {
    return 0
    const room = theRoom(roomName)
    const myRoom  = typeof room === 'object' && room.controller && room.controller.my
    const roomStatus = Game.worldState.roomStatus[roomName]
    if(!roomStatus) return 0
    const towersPresent = roomStatus && roomStatus.towers.length > 0
    const spawnPresent = roomStatus && roomStatus.spawns.length > 0
    const minersPresent = roomStatus && roomStatus.miners.length > 0
    const tendersNeeded = spawnPresent && towersPresent && minersPresent
    
    return tendersNeeded ? 1 : 0

})

const skMinerFunc = timeCall('creepsNeeded skMinerFunc', reportableTime)((roomName) => {
    const room = theRoom(roomName)
    const myRoom  = typeof room === 'object' && room.controller && room.controller.my
    const roomStatus = Game.worldState.roomStatus[roomName]
    if(!roomStatus) return 0
    const thisRoomLairNeeded = roomStatus.lairs / 2
    const outpostFlags = roomStatus.flags.filter(f => f.color === COLOR_BLUE)
    const skFlags = outpostFlags.filter(f => Game.worldState.roomStatus[f.assocRoomName()] && Game.worldState.roomStatus[f.assocRoomName()].lairs.length)
    const flagSkMinersNeeded = skFlags.map(f => Game.worldState.roomStatus[f.assocRoomName()]).reduce((needed, s) => needed + (s.lairs.length / 2 - s.skMiners.length), 0)

    
    return flagSkMinersNeeded

})

const superTransportFunc = timeCall('creepsNeeded superTransportFunc', reportableTime)((roomName) => {
    const room = theRoom(roomName)
    const myRoom  = typeof room === 'object' && room.controller && room.controller.my
    const roomStatus = Game.worldState.roomStatus[roomName]
    if(!roomStatus) return 0
    const outpostFlags = roomStatus.flags.filter(f => f.color === COLOR_BLUE)
    const roomStorage = roomStatus.storage !== undefined || roomStatus.controllerContainers.length > 0
    const flagSuperTransportsNeeded = roomStorage && outpostFlags.length && !roomStatus.superTransports.length ? roomStatus.superTransports.length + 1 : 0
    //console.log(roomName + ' creepsNeeded 401 superTransportFunc flagSuperTransportsNeeded ' + JSON.stringify(flagSuperTransportsNeeded))
    //console.log(roomName + ' creepsNeeded 401 superTransportFunc roomStatus.superTransports.length ' + JSON.stringify(roomStatus.superTransports.length))
    return flagSuperTransportsNeeded

})

const typeFunctions = {
    'needed': {
        'superTransport': superTransportFunc,
        'remoteMiner': remoteMinerFunc,
        'skMiner': skMinerFunc,
        'smallMiner': smallMinerFunc,
        'tinyMiner': tinyMinerFunc,
        'workhorse': workhorseFunc,
        'fastMelee': soldierFunc ('fastMelee'),
        'melee': soldierFunc ('melee'),
        'fastHeal': soldierFunc ('fastHeal'),
        'skMelee': soldierFunc ('skMelee', 'skSquad'),
        'skKnight': soldierFunc ('skKnight', 'attackSquad'),
        'healer': soldierFunc ('healer', 'skSquad'),
        //['melee': soldierFunc ('melee'),
        'slowMelee': (roomName) =>  roomDefined(roomName) ? hostileCreepsPresent(Game.rooms[roomName]).length > Game.worldState.roomStatus[roomName].towers.length : 0,
        'claimJumper': jumperFunc,
        'colonist': colonistFunc,
        'support': soldierFunc ('support', 'defenseSquad'),
        'barricadeMan': soldierFunc ('barricadeMan', 'homeSquad'),
        'defMelee': defMeleeFunc,
        'chewer': soldierFunc ('chewer'),
        'scout': scoutFunc,
        'wallBreaker': soldierFunc ('wallBreaker'),
        'towerCrasher': soldierFunc ('towerCrasher'),
        'privateer': soldierFunc ('privateer'),
        'towerTender': tenderFunc,
        'quickWorker': quickWorkerFunc,
        'miniWorker': miniWorkerFunc,
        'tinyWorker': tinyWorkerFunc,
        'smallWorker': smallWorkerFunc,
        'staticWorker': staticWorkerFunc,
        'transport': transportFunc,
        },
    'present': present
}
//needs to return a spawnCreep options argument
module.exports = (roomName, opts = {excess: 0}) => type => {
    //console.log('creepsNeeded 258 room ' + roomName + JSON.stringify(type))
    const t0 = Game.cpu.getUsed()
    const neededCreeps = parseInt(typeFunctions.needed[type](roomName), 10)
    const t1 = Game.cpu.getUsed()
    const presentCreeps = parseInt(typeFunctions.present(roomName)(type), 10)
    const t2 = Game.cpu.getUsed()
    const stdReturn = neededCreeps > presentCreeps
    const t3 = Game.cpu.getUsed()
    //console.log(' creepsNeeded 400 times for room ' + roomName + ' neededCreeps ' + type + ' ' + JSON.stringify(t1 -t0) + ' presentCreeps ' + JSON.stringify(t2 -t1))
    return stdReturn
}