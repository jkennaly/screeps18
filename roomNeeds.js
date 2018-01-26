//fight
//WORK
//CARRY
//WORK+CARRY
//CLAIM

//stationary    1/5
//slow          1/4
//normal        1/3
//fast          1/2
//lightning     4/5

//sources+minerals require harvesting /+WORK /stationary
//structures require repair /+WORK+CARRY /normal
//sites require build /+WoRK+CARRY /normal
//minerContainers require emptying /+CARRY /normal
//towers require filling /+CARRY /fast
//spawns require filling /+CARRY /normal
//extensions require filling /+CARRY 
//controllers require upgrading /+WORK+CARRY /stationary
//controllerContainers may be filled /+CARRY

//links may be filled /+CARRY
//storage may be filled /+CARRY
//storage may be emptied /+CARRY
//links may be emptied /+CARRY

//sources+minerals require harvesting /+WORK /stationary
//use roomStatus harvestTargets to identify unmanned sources


//all needs

//harvest
const harvestTargets = roomStatus => roomStatus.harvestTargets

//repair
const repairsNeeded = roomStatus => roomStatus.structuresNeedRepair

//build
const buildNeeded = roomStatus => roomStatus.sites

//empty
const emptiableMinerContainers = roomStatus => roomStatus.minerContainers
    .filter(c => _.sum(c.store) > 0)
const emptiableControllerContainers = roomStatus => roomStatus.controllerContainers
    .filter(c => _.sum(c.store) > 0)
const emptiableLinks = roomStatus => roomStatus.links
    .filter(t => t.energy > 0)
const emptiableStorage = roomStatus => roomStatus.controller !== undefined ? [roomStatus.controller] : []
    .filter(c => _.sum(c.store) > 0)

//fill
const towers = roomStatus => roomStatus.towers
    .filter(t => t.energy < 0.98 * t.energyCapacity)
const spawns = roomStatus => roomStatus.spawns
    .filter(t => t.energy < t.energyCapacity)
const extensions = roomStatus => roomStatus.extensions
    .filter(t => t.energy < t.energyCapacity)
const controllerContainers = roomStatus => roomStatus.controllerContainers
    .filter(c => _.sum(c.store) < c.storeCapacity)
const fillableLinks = roomStatus => roomStatus.links
    .filter(t => t.energy < t.energyCapacity)
const fillableStorage = roomStatus => roomStatus.storage !== undefined ? [roomStatus.storage] : []
    .filter(c => _.sum(c.store) < c.storeCapacity)

//upgrade
const controllers = roomStatus => roomStatus.controller !== undefined && roomStatus.controller.my ? [roomStatus.controller] : []

//utilities

const hasEnergy = creep => !creep.status('emptyE')
const hasRoom = creep => !creep.status('full') || !creep.status('emptyE')

//need priorities
//Tier 1
//controller downgrade imminent

var tier1Memo = {
    eligible: {},
    ready: {},
    potential: {}
}
var tier2Memo = {
    eligible: {},
    ready: {},
    potential: {}
}
var tier3Memo = {
    eligible: {},
    ready: {},
    potential: {}
}
var tier4Memo = {
    eligible: {},
    ready: {},
    potential: {}
}
var tier5Memo = {
    eligible: {},
    ready: {},
    potential: {}
}
var tier6Memo = {
    eligible: {},
    ready: {},
    potential: {}
}
var tier7Memo = {
    eligible: {},
    ready: {},
    potential: {}
}
const tier1 = _.memoize(roomStatus => {return {
    upgradeController: controllers(roomStatus)
        .filter(c => c.ticksToDowngrade < 1000)
}})
const tier1Total = roomStatus => Object.keys(tier1(roomStatus)).reduce((total, cv) => total + tier1[cv].length, 0)
const tier1Eligible = roomStatus => creep => {
    if(tier1Memo.eligible[creep.name] !== undefined) return tier1Memo.eligible[creep.name]
    const work = creep.has(WORK)
    const carry = creep.has(CARRY)
    const workCarry = work && carry
    const retVal = workCarry
    tier1Memo.eligible[creep.name] = retVal
    return retVal
}
const tier1Ready = roomStatus => creep => {
    if(tier1Memo.ready[creep.name] !== undefined) return tier1Memo.ready[creep.name]
    const eligible = tier1Eligible(roomStatus)(creep)
    const retVal = eligible && hasEnergy(creep)
    tier1Memo.ready[creep.name] = retVal
    return retVal
}

//Tier 2
//harvestTarget not being harvested
const tier2 = _.memoize(roomStatus => {
    const alreadyHarvested = harvestTarget => harvestTarget.pos.findInRange(FIND_MY_CREEPS, 1 {filter: c => c.type('remoteMiner')}).length > 0
    const freeSpot = harvestTarget => harvestTarget.pos.walkableCoordsNearPos().length > 0
    return {
    harvest: harvestTargets(roomStatus)
        .filter(t => !alreadyHarvested(t))
        .filter(t => freeSpot(t))
}})
const tier2Total = roomStatus => Object.keys(tier2(roomStatus)).reduce((total, cv) => total + tier2[cv].length, 0)
const tier2Eligible = roomStatus => creep => {
    if(tier2Memo.eligible[creep.name] !== undefined) return tier2Memo.eligible[creep.name]
    const work = creep.has(WORK)
    const retVal = work
    tier2Memo.eligible[creep.name] = retVal
    return retVal
}
const tier2Ready = roomStatus => creep => {
    if(tier2Memo.ready[creep.name] !== undefined) return tier2Memo.ready[creep.name]
    const eligible = tier2Eligible(roomStatus)(creep)
    const minerContainerFilter = containers => s => containers.reduce((pv, c) => pv || s.pos.getRangeTo(c.pos), false)
    //the creep is within 1 of a source or extractor
    //source either has a mminerContainer or not
    //if source has a minerContainer, and the creep is standing on it, the creep is ready
    //if the source has no minerContainer:
    //if the source has a site for a minerContainer, and the creep is standing on it, the creep is ready
    //if the source has no minerContainer built and no site for a minerContainer, the creep is ready
    const inPos = roomStatus => creep => {

        const within1 = creep.pos.findInRange(FIND_SOURCES, 1)
        const withContainers = within1.filter(minerContainerFilter(roomStatus.minerContainers))
        const noContainers = within1.filter(c => !minerContainerFilter(roomStatus.minerContainers)(c))
        const noContainer = noContainers.length > 0
        const containerFilter = s => s.structureType === STRUCTURE_CONTAINER
        const onContainer = withContainers.length > 0 && creep.pos.findInRange(FIND_MY_STRUCTURES, 0, {filter: containerFilter}).length > 0
        const onContainerSite = noContainer && creep.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 0, {filter: containerFilter}).length > 0
        const hasContainer = withContainers.length > 0
        const standingOnContainer = hasContainer && onContainer
        const noContainerOrSite = noContainer && witin1[0].pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 1, {filter: containerFilter}).length === 0

        const retVal = standingOnContainer || noContainer && (onContainerSite || noContainerOrSite)
        return retVal
        
    }
    const retVal = eligible && inPos(creep)
    tier2Memo.ready[creep.name] = retVal
    return retVal
}
//Tier 3
//tower fillable
const tier3 = _.memoize(roomStatus => {
    return {
    transfer: towers(roomStatus)
        .filter(t => t.energy < 0.90 * t.energyCapacityAvailable)
}})
const tier3Total = roomStatus => Object.keys(tier3(roomStatus)).reduce((total, cv) => total + tier3[cv].length, 0)
const tier3Eligible = roomStatus => creep => {
    if(tier3Memo.eligible[creep.name] !== undefined) return tier3Memo.eligible[creep.name]
    const carry = creep.has(CARRY)
    const retVal = carry
    tier3Memo.eligible[creep.name] = retVal
    return retVal
}
const tier3Ready = roomStatus => creep => {
    if(tier3Memo.ready[creep.name] !== undefined) return tier3Memo.ready[creep.name]
    const eligible = tier3Eligible(roomStatus)(creep)
    const retVal = eligible && hasEnergy(creep)
    tier3Memo.ready[creep.name] = retVal
    return retVal
}
//Tier 4
//spawn fillable
//extension fillable
const tier4 = _.memoize(roomStatus => {
    return {
    transfer: spawns(roomStatus).concat(extensions(roomStatus))
}})
const tier4Total = roomStatus => Object.keys(tier4(roomStatus)).reduce((total, cv) => total + tier4[cv].length, 0)
const tier4Eligible = roomStatus => creep => {
    if(tier4Memo.eligible[creep.name] !== undefined) return tier4Memo.eligible[creep.name]
    const carry = creep.has(CARRY)
    const retVal = carry
    tier4Memo.eligible[creep.name] = retVal
    return retVal
}
const tier4Ready = roomStatus => creep => {
    if(tier4Memo.ready[creep.name] !== undefined) return tier4Memo.ready[creep.name]
    const eligible = tier4Eligible(roomStatus)(creep)
    const retVal = eligible && hasEnergy(creep)
    tier4Memo.ready[creep.name] = retVal
    return retVal
}


//Tier 5
//minerContainers with a full load emptiable
const tier5 = _.memoize(roomStatus => {
    return {
    withdraw: emptiableMinerContainers(roomStatus).filter(c => c.store[RESOURCE_ENERGY] >= 1000)
}})
const tier5Total = roomStatus => Object.keys(tier5(roomStatus)).reduce((total, cv) => total + tier5[cv].length, 0)

const tier5Eligible = roomStatus => creep => {
    if(tier5Memo.eligible[creep.name] !== undefined) return tier5Memo.eligible[creep.name]
    const carry = creep.has(CARRY)
    const retVal = carry
    tier5Memo.eligible[creep.name] = retVal
    return retVal
}
const tier5Ready = roomStatus => creep => {
    if(tier5Memo.ready[creep.name] !== undefined) return tier5Memo.ready[creep.name]
    const eligible = tier5Eligible(roomStatus)(creep)
    const retVal = eligible && hasRoom(creep)
    tier5Memo.ready[creep.name] = retVal
    return retVal
}
//Tier 6
//repair
const tier6 = _.memoize(roomStatus => {
    return {
    repair: repairsNeeded(roomStatus)
}})
const tier6Total = roomStatus => Object.keys(tier6(roomStatus)).reduce((total, cv) => total + tier6[cv].length, 0)

//Tier60
//build
const tier60 = _.memoize(roomStatus => {
    return {
    build: buildNeeded(roomStatus)
}})
const tier60Total = roomStatus => Object.keys(tier60(roomStatus)).reduce((total, cv) => total + tier60[cv].length, 0)
const tier6Eligible = roomStatus => creep => {
    if(tier6Memo.eligible[creep.name] !== undefined) return tier6Memo.eligible[creep.name]
    const work = creep.has(WORK)
    const carry = creep.has(CARRY)
    const workCarry = work && carry
    const retVal = workCarry
    tier6Memo.eligible[creep.name] = retVal
    return retVal
}
const tier6Ready = roomStatus => creep => {
    if(tier6Memo.ready[creep.name] !== undefined) return tier6Memo.ready[creep.name]
    const eligible = tier6Eligible(roomStatus)(creep)
    const retVal = eligible && hasEnergy(creep)
    tier6Memo.ready[creep.name] = retVal
    return retVal
}
//Tier 7
//controllerContainers emptiable
//stored energy in excess of 10x room energyCapacityAvailable emptiable
const tier7 = _.memoize(roomStatus => {
    return {
    withdraw: emptiableMinerContainers(roomStatus).filter(c => c.store[RESOURCE_ENERGY] >= 1000)
        .concat(emptiableStorage(roomStatus).filter(s => s.store[RESOURCE_ENERGY] > s.room.energyCapacityAvailable * 10))
}})
const tier7Total = roomStatus => Object.keys(tier7(roomStatus)).reduce((total, cv) => total + tier7[cv].length, 0)
const tier7Eligible = roomStatus => creep => {
    if(tier7Memo.eligible[creep.name] !== undefined) return tier7Memo.eligible[creep.name]
    const carry = creep.has(CARRY)
    const retVal = carry
    tier7Memo.eligible[creep.name] = retVal
    return retVal
}
const tier7Ready = roomStatus => creep => {
    if(tier7Memo.ready[creep.name] !== undefined) return tier7Memo.ready[creep.name]
    const eligible = tier7Eligible(roomStatus)(creep)
    const retVal = eligible && hasRoom(creep)
    tier7Memo.ready[creep.name] = retVal
    return retVal
}
//other energy supplies
//stored energy
//links
const supplyCarry = _.memoize(roomStatus => {
    return {
    withdraw: emptiableStorage(roomStatus).filter(s => s.store[RESOURCE_ENERGY] > 1000)
        .concat(emptiableLinks(roomStatus))
}})
const supplyCarryTotal = roomStatus => Object.keys(secondarySupplies(roomStatus)).reduce((total, cv) => total + secondarySupplies[cv].length, 0)

//specialty dumps
//controller upgrades
const dumpWorkCarry = _.memoize(roomStatus => {return {
    upgradeController: controllers(roomStatus)
        .filter(c => c.level && c.level < 8)
}})
const dumpWorkCarryTotal = roomStatus => Object.keys(dumpWorkCarry(roomStatus)).reduce((total, cv) => total + dumpWorkCarry[cv].length, 0)



//other energy dumps
//storage
//controllerContainers fillable
//links
const dumpCarry = _.memoize(roomStatus => {
    return {
    transfer: fillableStorage(roomStatus)
        .concat(controllerContainers(roomStatus))
        .concat(fillableLinks(roomStatus))
        .concat(towers(roomStatus))
}})
const dumpCarryTotal = roomStatus => Object.keys(secondaryDumps(roomStatus)).reduce((total, cv) => total + secondaryDumps[cv].length, 0)

//prioritization
const removeSelfFilter = thisCreep => testCreep => thisCreep.name !== testCreep.id

const tiers = [1, 2, 3, 4, 5, 6, 7]
const tieredNeedCounts = roomStatus => { return {
    '1': tier1Total(roomStatus),
    '2': tier2Total(roomStatus),
    '3': tier3Total(roomStatus),
    '4': tier4Total(roomStatus),
    '5': tier5Total(roomStatus),
    '6': tier6Total(roomStatus) + tier60Total(roomStatus),
    '7': tier7Total(roomStatus)
}}

const creepsEligibleByTier = roomStatus => { return {
    '1': roomStatus.friendlyCreeps.filter(tier1Eligible(roomStatus)),
    '2': roomStatus.friendlyCreeps.filter(tier2Eligible(roomStatus)),
    '3': roomStatus.friendlyCreeps.filter(tier3Eligible(roomStatus)),
    '4': roomStatus.friendlyCreeps.filter(tier4Eligible(roomStatus)),
    '5': roomStatus.friendlyCreeps.filter(tier5Eligible(roomStatus)),
    '6': roomStatus.friendlyCreeps.filter(tier6Eligible(roomStatus)),
    '7': roomStatus.friendlyCreeps.filter(tier7Eligible(roomStatus))
}}

const creepsReadyByTier = roomStatus => { return {
    '1': roomStatus.friendlyCreeps.filter(tier1Ready(roomStatus)),
    '2': roomStatus.friendlyCreeps.filter(tier2Ready(roomStatus)),
    '3': roomStatus.friendlyCreeps.filter(tier3Ready(roomStatus)),
    '4': roomStatus.friendlyCreeps.filter(tier4Ready(roomStatus)),
    '5': roomStatus.friendlyCreeps.filter(tier5Ready(roomStatus)),
    '6': roomStatus.friendlyCreeps.filter(tier6Ready(roomStatus)),
    '7': roomStatus.friendlyCreeps.filter(tier7Ready(roomStatus))
}}

//returns: 
//a list of assigned creeps and their suggested assignment
//a list of tiered potential targets with no creep assigned
//a list of creeps with no assigned destination

var tieredTargetsMissingCreeps = []
var creepsBeenAssigned = []
var creepsLackingAssignment = []

const upgradeControllerScoreReady = assignment => readyCreep => {
    const speed = readyCreep.partCount(MOVE) / readyCreep.body.length
    const freeMove = readyCreep.fatigue === 0 ? 1 : 0
    const distance = readyCreep.pos.getRangeTo(assignment.pos)
    const withinRange = distance <= 3
    const timeToFulfill = 1
    const timeToArrive = 49 - (withinRange ? 0 : 2 * (distance - 3) - freeMove)
    const workEffectiveness = readyCreep.partCount(WORK) ^ 2
    const overall = timeToArrive * workEffectiveness
    return {
        timeToArrive: timeToArrive,
        workEffectiveness: workEffectiveness,
        overall: overall
    }
}
const harvestScoreReady = assignment => readyCreep => {
    const speed = readyCreep.partCount(MOVE) / readyCreep.body.length
    const freeMove = readyCreep.fatigue === 0 ? 1 : 0
    const distance = readyCreep.pos.getRangeTo(assignment.pos)
    const withinRange = distance <= 1
    const timeToFulfill = assignment.energy ? assignment.energy / (_.min[(readyCreep.partCount(WORK) * 2), readyCreep.ticksToLive]) : readyCreep.ticksToLive
    const timeToArrive = 49 - (withinRange ? 0 : 2 * (distance - 3) - freeMove)
    const workEffectiveness = readyCreep.partCount(WORK) ^ 2
    const overall = timeToArrive * workEffectiveness
    return {
        timeToArrive: timeToArrive,
        workEffectiveness: workEffectiveness,
        overall: overall
    }
}

const assignments = roomStatus => (tier, eligibleCreeps, readyCreeps) => {
    var unfilledAssignments = tier
    var unassignedCreeps = eligibleCreeps
    var preferredCreeps = readyCreeps
    var assignedCreeps = []

    return {
        tieredTargetsMissingCreeps: missingCreeps,
        creepsBeenAssigned: []
        creepsLackingAssignment: eligibleCreeps
    }
}



const moveAction = creep => {
if(creep.type('workhorse')) {

} else if(creep.type('scout')) {

} else if(creep.type('claimJumper')) {

} else if(creep.type('colonist')) {

} else if(creep.soldier()) {

} else if(creep.type('remoteMiner')) {

} else if(creep.type('transport')) {
    //tier3 if the room has no towerTender
    //tier4 if creep has energy
    //tier5 if creep has no energy
    //tier7 if creep has no energy

    //supplyCarry if creep has no energy but there is an unassigned tier3/tier4
    //dumpCarry if creep has energy but there is an unassigned tier5/tier7
} else if(creep.type('towerTender')) {
} else if(creep.type('staticWorker')) {
}
}


//movers
//creeps

//assigning destinations to movers:
//start from lowest tier to highest, and assign each objective to an appropriate actor
//if there are any actors who have not received an objective, assign one based on the actor from the other other categories (non-tiered)





module.exports = roomStatus => {
    const startCpu = Game.cpu.getUsed()
    const retVal = {
        
    }
    const endCpu = Game.cpu.getUsed()
    const cpuUsed = endCpu - startCpu
    if(cpuUsed > 10 && Game.cpu.bucket < 10000) console.log('long roomNeed execution ' + room.name + ' ' + cpuUsed)
    return retVal
}