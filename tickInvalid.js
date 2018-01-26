const creepsNeeded = require('creepsNeeded')
const parseForRoomName = _.memoize(str => {
    if(_.startsWith(str, 'Flag')) return undefined
    if (str[0] === 'E' || str[0] === 'W') return str
    return undefined
})
const repairPossible = obj => obj.hits && obj.hits < obj.hitsMax
const belowTargetHits = obj => obj.hits && obj.hits < obj.room.targetHits()

const developedRoom = container => container.room.controller.level >= 4 && container.room.controller && container.room.controller.my && container.room.energyAvailable > 0.5 * container.room.energyAvailableCapacity
const empty = container => container.store !== undefined && ((_.sum(container.store) < 50 && developedRoom(container) || _.sum(container.store) === 0) && container.storeCapacity > 0) || container.energy !== undefined && container.energy === 0
const somewhatFull = container => !empty(container) && _.sum(container.store) < 1.0 * container.storeCapacity && container.storeCapacity > 0 || container.energy !== undefined && container.energy > 0 && container.energy < 1.0 * container.energyCapacity
const full = container => !empty(container) && !somewhatFull(container)
const fullLoad = container => (container.resourceType ? _.sum(container.store) : 0) + (container.store ? _.sum(container.store) : 0) + (container.energy ? container.energy : 0) >= 1000 || full(container)
const repairable = obj => repairPossible(obj) && belowTargetHits(obj)
const repairCritical = obj => repairable(obj) && obj.hits < 0.25 * obj.hitsMax && obj.hits < 0.25 * obj.room.targetHits()
const repairHi = obj => repairable(obj) && !repairCritical(obj) && obj.hits < 0.85 * obj.hitsMax && obj.hits < 0.85 * obj.room.targetHits() && obj.hits >= 0.70 * obj.hitsMax && obj.hits >= 0.70 * obj.room.targetHits()
const repairLo = obj => repairable(obj) && !repairCritical(obj) && !repairHi(obj)

const transferable = obj => !full(obj)

const harvestable = obj => obj.mineralAmount && obj.pos.lookFor(LOOK_STRUCTURES).length || obj.pos.nearSource(0) && obj.energy
const withdrawable = container => container.structureType !== undefined && (container.energy !== undefined && container.energy > 0 || container.store !== undefined && container.store[RESOURCE_ENERGY] > 0)
const emptyE = obj => (obj.storeCapacity === 0 || obj.store === undefined || obj.store[RESOURCE_ENERGY] === 0 || obj.store[RESOURCE_ENERGY] === undefined) && (obj.energy === undefined || obj.energy === 0)


const pickupable = obj => obj.resourceType && obj.amount

const buildable = obj => !obj.level && obj.progressTotal && obj.progressTotal > 0

const upgradeable = obj => obj.structureType && obj.structureType === STRUCTURE_CONTROLLER && obj.my
const onRoad = obj => obj.pos.lookFor(LOOK_STRUCTURES).filter(l => l.structure.structureType === STRUCTURE_ROAD).length > 0


module.exports = (gameTick) => {
    Room.prototype.findExitTop = function(opts) {return this.find(FIND_EXIT_TOP, opts)}
    Room.prototype.findExitRight = function(opts) {return this.find(FIND_EXIT_RIGHT, opts)}
    Room.prototype.findExitBottom = function(opts) {return this.find(FIND_EXIT_BOTTOM, opts)}
    Room.prototype.findExitLeft = function(opts) {return this.find(FIND_EXIT_LEFT, opts)}
    Room.prototype.findExit = function(opts) {return this.find(FIND_EXIT, opts)}
    Room.prototype.findCreeps = function(opts) {return this.find(FIND_CREEPS, opts)}
    Room.prototype.findMyCreeps = function(opts) {return this.find(FIND_MY_CREEPS, opts)}
    Room.prototype.findHostileCreeps = function(opts) {return this.find(FIND_HOSTILE_CREEPS, opts)}
    Room.prototype.findSourcesActive = function(opts) {return this.find(FIND_SOURCES_ACTIVE, opts)}
    Room.prototype.findSources = function(opts) {return this.find(FIND_SOURCES, opts)}
    Room.prototype.findDroppedEnergy = function(opts) {return this.find(FIND_DROPPED_ENERGY, opts)}
    Room.prototype.findDroppedResources = function(opts) {return this.find(FIND_DROPPED_RESOURCES, opts)}
    Room.prototype.findStructures = function(opts) {return this.find(FIND_STRUCTURES, opts)}
    Room.prototype.findMyStructures = function(opts) {return this.find(FIND_MY_STRUCTURES, opts)}
    Room.prototype.findHostileStructures = function(opts) {return this.find(FIND_HOSTILE_STRUCTURES, opts)}
    Room.prototype.findFlags = function(opts) {return this.find(FIND_FLAGS, opts)}
    Room.prototype.findConstructionSites = function(opts) {return this.find(FIND_CONSTRUCTION_SITES, opts)}
    Room.prototype.findMySpawns = function(opts) {return this.find(FIND_MY_SPAWNS, opts)}
    Room.prototype.findHostileSpawns = function(opts) {return this.find(FIND_HOSTILE_SPAWNS, opts)}
    Room.prototype.findMyConstructionSites = function(opts) {return this.find(FIND_MY_CONSTRUCTION_SITES, opts)}
    Room.prototype.findHostileConstructionSites = function(opts) {return this.find(FIND_HOSTILE_CONSTRUCTION_SITES, opts)}
    Room.prototype.findMinerals = function(opts) {return this.find(FIND_MINERALS, opts)}
    Room.prototype.findNukes = function(opts) {return this.find(FIND_NUKES, opts)}
    Room.prototype.frontier = function() {return !this.controller || !this.controller.my || this.controller.level < 4}
    Room.prototype.energyCritical = function() {
        const spawns = this.findMySpawns({filter: s => s.spawning !== null}).length === 0
        const creeps = this.findMyCreeps({filter: c => c.timeToLive > 1400}).length === 0
        
        return spawns && creeps && this.energyAvailable < 0.9 * this.energyCapacityAvailable
    }
    Room.prototype.largestTransportCapacity = function() {return this.findMyCreeps().filter(c => c.type('transport')).reduce((pv, cv) => cv.carryCapacity > pv ? cv.carryCapacity : pv, 0)}
    Room.prototype.controllerDowngradeWarning = function() {return this.controller && (this.controller.ticksToDowngrade < 0.95 * CONTROLLER_DOWNGRADE[this.controller.level] && this.controller.ticksToDowngrade > 0)}
    RoomPosition.prototype.containsMyCreepType = function(type, statusArray = []) {
        const typeMatch = this.look().filter(o => o.type === LOOK_CREEPS).map(x => x.creep).filter(c => c.my).filter(c => c.type(type))
        const statusMatch = statusArray.reduce((matched, testStatus) => matched && typeMatch[0].status(testStatus), typeMatch.length > 0)
        return statusMatch
    }
    Room.prototype.containsCreepType = function(type) {
        return this.findMyCreeps(c => c.type(type))
    }
    Room.prototype.harvestOverflow = function() {
        return this.findStructures({filter: s => s.structureType === STRUCTURE_CONTAINER && !s.pos.nearController() && s.status('full')}).length > 0
    }
    Room.prototype.targetHits = function() { return this.controller !== undefined ? (this.controller.level - 1) * CONTROLLER_DOWNGRADE[this.controller.level] * 1.5 : 0}
    Room.prototype.repairCritical = function() {
        /*
        const dmgFilter = r => s => s.hits < 0.75 * s.hitsMax && s.hits < 0.95 * r.targetHits()
        const damagedStructs = this.findStructures({filter: dmgFilter(this)})
        //const repairNear = damagedStructs.filter(s => s.pos.findInRange(FIND_MY_CREEPS, 5, {filter: c => c.type('workhorse')}).length)
        const repairFar = damagedStructs.filter(s => s.pos.findInRange(FIND_MY_CREEPS, 5, {filter: c => c.type('workhorse')}).length === 0)

        return repairFar.length > 2
        */
        const repairOptions = { filter: s => s.hits && s.hits < 0.25 * s.hitsMax && s.hits < 0.25 * s.room.targetHits()}
        const damagedStructs = this.findStructures(repairOptions).length
        return damagedStructs > 2
    }
    Room.prototype.leadSoldier = function() {
        const leadSorter = (a, b) => {
            const roomFocalPos = this.focalPos()
            const aRange = a.getRangeTo(roomFocalPos)
            const bRange = b.getRangeTo(roomFocalPos)
            const rDiff = aRange - bRange
            const retVal = rDiff !== 0 ? rDiff : a.timeToLive - b.timeToLive
            return retVal
        }
        const soldiers = this.findMyCreeps({filter: c => c.soldier()}).sort(leadSorter)
        return soldiers[0]
    }
    Room.prototype.resourceDestination = function(resourceType) {
        if(this.storage === undefined) return {}
        if(this.terminal === undefined) return this.storage
        //console.log(resourceType)
        const storageResources = Object.keys(this.storage.store).filter(r => r !== RESOURCE_ENERGY)
        const resourceStored = storageResources.indexOf(resourceType) > -1
        const resourceStorageSufficient = resourceStored && this.storage.store[resourceType] >= 10000
        const resourceStorageExcess = resourceStorageSufficient && this.storage.store[resourceType] >= 20000
        const terminalResources = Object.keys(this.storage.store).filter(r => r !== RESOURCE_ENERGY)
        const resourceTerminated = terminalResources.indexOf(resourceType) > -1
        const resourceTerminationSufficient = resourceTerminated && this.terminal.store[resourceType] >= 10000
        const useStorage = resourceTerminationSufficient || !resourceTerminated && !resourceStorageExcess || !resourceStorageSufficient
        const target = useStorage ? this.storage : this.terminal
        return target

    }
    RoomPosition.prototype.roadAccess = function() {
        return this.findInRange(FIND_STRUCTURES, 1, {filter: {structureType: STRUCTURE_ROAD}}).length > 0
    }
    RoomPosition.prototype.nearestStructure = function(type = STRUCTURE_ROAD, r = 1) {
        return this.findInRange(FIND_STRUCTURES, r, {filter: {structureType: type}}).reduce((prev, cur) => prev === undefined || cur.pos.getDistanceTo(this) < prev.pos.getDistanceTo(this) ? cur : prev, undefined)
    }
    RoomPosition.prototype.nearStructure = function() {
        var memo = {}
        return function(r = 1, type = '') {
            const key = '' + this.roomName + this.x + this.y
                //console.log('nearSource ' + key)
            if (memo[key] === undefined) memo[key] = {}
            if (memo[key][r] === undefined) memo[key][r] = {}
            if (memo[key][r][type] !== undefined) return memo[key][r][type]
            const retVal = this.findInRange(FIND_STRUCTURES, r, {filter: {structureType: type}}).length > 0
            memo[key][r][type] = retVal
            return retVal
        }
    }()
    RoomPosition.prototype.nearCreeps = function(range = 1, opts) {
        return this.findInRange(FIND_CREEPS, range, opts)
    }
    RoomObject.prototype.status = function(testStatus) {
        const statusFunctionObject = {
            developedRoom: developedRoom,
            empty: empty,
            emptyE: emptyE,
            somewhatFull: somewhatFull,
            full: full,
            withdrawable: withdrawable,
            repairable: repairable,
            repairCritical: repairCritical,
            repairHi: repairHi,
            repairLo: repairLo,
            transferable: transferable,
            harvestable: harvestable,
            pickupable: pickupable,
            buildable: buildable,
            upgradeable: upgradeable,
            fullLoad: fullLoad,
            onRoad: onRoad
        }
        const statusFunctionArray = [
            ['developedRoom'. developedRoom],
            ['empty'. empty],
            ['emptyE'. emptyE],
            ['somewhatFull'. somewhatFull],
            ['full'. full],
            ['withdrawable', withdrawable],
            ['repairable', repairable],
            ['repairCritical', repairCritical],
            ['repairHi', repairHi],
            ['repairLo', repairLo],
            ['transferable', transferable],
            ['harvestable', harvestable],
            ['pickupable', pickupable],
            ['buildable', buildable],
            ['upgradeable', upgradeable],
            ['fullLoad', fullLoad],
            ['onRoad', onRoad]
        ]
        //console.log('SC statsu ' + testStatus)
        return typeof testStatus === 'string' ? statusFunctionObject[testStatus](this) : statusFunctionArray.filter(sf => sf[1](this)).map(sf => sf[0])
    }
    StructureTerminal.prototype.status = function (testStatus) {
        if(testStatus !== 'emptyE') return RoomObject.prototype.status.call(this, testStatus)
        return this.store[RESOURCE_ENERGY] < 100000
    }
    Structure.prototype.stores = function () {
        let retVal = []
        for (var i in this.store) if ({}.hasOwnProperty.call(this.store, i)) retVal.push([i, this.store[i]])
        if(retVal.length === 0 && this.energyCapacity) retVal.push([RESOURCE_ENERGY, this.energy])
        return retVal
    }

    Creep.prototype.nearCreeps = function(range = 1, opts) {
        const allCreeps = this.pos.nearCreeps(range, opts)
        return allCreeps.filter(c => c.id !== this.id)
    }
    Creep.prototype.carries = function () {
        let retVal = []
        for (var i in this.carry) if ({}.hasOwnProperty.call(this.carry, i)) retVal.push([i, this.carry[i]])
        return retVal
    }
    Creep.prototype.nextMove = function(nextPos) {
        let lastStored = undefined
        if(nextPos !== undefined) lastStored = nextPos
        return lastStored        
    }
    Creep.prototype.nearestOfTypeToPos = function(pos, opts, excludeNames = []) {
        const myType = this.type()
        const myCreeps = this.room.findMyCreeps(opts)
            .filter(c => c.type(myType))
            .filter(c => c.name !== this.name && excludeNames.indexOf(c.name) < 0)
        const nearest = myCreeps.reduce((closestSoFar, testCreep) => pos.getRangeTo(closestSoFar) > pos.getRangeTo(testCreep) ? testCreep : closestSoFar, this)
        const thisCreepPasses = !opts || !opts.filter || opts.filter(this)
        //console.log('tickInvalid 292 thisCreepPasses ' + thisCreepPasses)
        const retVal = thisCreepPasses && (nearest.name === this.name)
        return excludeNames.length ? [retVal, nearest.name] : retVal
    }
    Flag.prototype.creepNeeded = function (worldState, creep, opts) {
        const currentRoomName = creep.room.name
        const assocRoomName = this.assocRoomName()
        const assocNeed = () => creepsNeeded(assocRoomName, opts)(creep.type())
        const currentNeed = () => creepsNeeded(currentRoomName, opts)(creep.type())
        return !currentNeed() && assocNeed()
    }
}