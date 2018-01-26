const initTime = Game.cpu.getUsed()
const reportableTime = 10.00
const timeCall = (descriptor, warnTime) => timedFunc => {
    //console.log('set up timed call ' + Game.cpu.getUsed())
    //console.log(timedFunc)
    const retVal = function() {
        const arg2 = arguments
        const retVal2 = function() {
            const arg3 = arguments
                //console.log('arg2 ' + JSON.stringify(arg2))
                //console.log('arg3 ' + JSON.stringify(arg3))
                //console.log('execute timed call ' + Game.cpu.getUsed())
            let startCpu = Game.cpu.getUsed()
            let retVal3 = timedFunc(arg2[0])(arg3[0])
            let endCpu = Game.cpu.getUsed()
            let timeElapsed = endCpu - startCpu
            if (timeElapsed > warnTime && Game.cpu.bucket < 10000) console.log(descriptor + timeElapsed)
            return retVal3
        }
        return retVal2


        
    }
    return retVal
}

if(Memory.extensionGardens === undefined) Memory.extensionGardens = {}
var extensionGardens = Memory.extensionGardens
if(Memory.labGardens === undefined) Memory.labGardens = {}
var labGardens = Memory.labGardens
module.exports = tick => {
   
   
return (room, my = {}) => {

const startCpu = Game.cpu.getUsed()
const struct = my.structures ? my.structures : []
const creep = my.creeps ? my.creeps : []
const site = my.sites ? my.sites : []
const flag = my.flags ? my.flags : []
const creepsByType = creep.reduce((creepTypes, c) => {
    if(c.soldier()) creepTypes.soldier.push(c)
    creepTypes[c.type()] === undefined ? creepTypes[c.type()] = [c] : creepTypes[c.type()].push(c)
    return creepTypes
}, {
soldier: [],
transport: [],
superTransport: [],
towerTender: [],
remoteMiner: [],
skMiner: [],
colonist: [],
staticWorker: [],
workhorse: [],
soldier: [],
scout: [],
claimJumper: []
})
const structsByType = struct.reduce((strucTypes, c) => {
    strucTypes[c.structureType] === undefined ? strucTypes[c.structureType] = [c] : strucTypes[c.structureType].push(c)
    return strucTypes
}, {
extractor: [],
link: [],
controller: [],
extension: [],
rampart: [],
spawn: [],
tower: [],
lab: [],
})

const flags = tick => room => flag

const sites = tick => room => site.sort((a, b) => (a.progressTotal - a.progress) - (b.progressTotal - b.progress))

const extractors = tick => room => structsByType.extractor
const links = tick => room => structsByType.link
const controllers = tick => room => structsByType.controller
const extensions = tick => room => structsByType.extension
const ramparts = tick => room => structsByType.rampart
const spawns = tick => room => structsByType.spawn
const labs = tick => room => structsByType.lab
const towers = tick => room => structsByType.tower
const enemyCreeps = tick => room => room.findHostileCreeps()
const enemyFreeCreeps = tick => room => enemyCreeps(tick)(room).filter(c => !c.owner || c.owner.username !== 'Source Keeper')

const losingFight = (structsByType.spawn.filter(s => s.hits < s.hitsMax).length > 0 || creep.length === 0) && enemyCreeps(tick)(room).length > 0
if(losingFight && structsByType.controller.length && structsByType.controller[0].my && structsByType.controller[0].safeModeAvailable > 0) structsByType.controller[0].activateSafeMode()

const reloadGardens = () => {
    extensionGardens = Memory.extensionGardens
    labGardens = Memory.labGardens
}
//console.log('roomStatus 88 extensionGardens ' + JSON.stringify(extensionGardens))
const resolveGardenPos = extPos => {
    if(!extPos) return extPos
    const g1 = extensionGardens[extPos.roomName]
    const g2 = labGardens[extPos.roomName]
    const revisedG1 = g1 ? g1 : []
    const revisedG2 = g2 ? g2 : []
    const combinedG = revisedG1.concat(revisedG2)
    const retVal2 = extPos && combinedG.length ? combinedG.reduce((pv, cv) => {
        const dx = cv ? extPos.x - cv.x : 100
        const dy = cv ? extPos.y - cv.y : 100
        const xOk = dx >= -1 && dx <= 1
        const yOk = dy >= -1 && dy <= 1
        const useG = xOk && yOk
        const retVal = useG ? cv : pv
        //console.log('roomStatus 96 retVal '+ JSON.stringify(retVal))
        return retVal
    }, extPos) : extPos
    return retVal2}





const spawningCreeps = tick => room => Object.keys(Game.creeps).filter(k => Game.creeps[k].spawning && Game.creeps[k].room.name === room.name).map(k => Game.creeps[k])
const enemyStructures = tick => room => room.findHostileStructures({ filter: s => s.hits })
const lairs = tick => room => room.findHostileStructures({ filter: s => s.structureType === STRUCTURE_KEEPER_LAIR })
const enemyWalls = tick => room => room.controller && room.controller.my ? [] : room.findStructures({ filter: { structureType: STRUCTURE_WALL } })
const sources = tick => room => room.findSources()
const resources = tick => room => room.findDroppedResources().sort((a, b) => b.amount - a.amount)
const containers = tick => room => room.findStructures({ filter: { structureType: STRUCTURE_CONTAINER } })

const friendlyWalls = tick => room => room.friendlyWalls(tick)


    //collect
const minerContainers = tick => room => containers(tick)(room).filter(s => s.pos.nearSource(1))
const controllerContainers = tick => room => containers(tick)(room).filter(s => s.pos.nearController() && !s.pos.nearSource(1))
const otherContainers = tick => room => containers(tick)(room).filter(s => !s.pos.nearController() && !s.pos.nearSource())
const controllerLinks = tick => room => structsByType.link.filter(s => s.pos.nearController(4))
    //disperse
const minerLinks = tick => room => structsByType.link.filter(s => s.pos.nearSource(2))
const dropoffLinks = tick => room => structsByType.link.filter(s => !s.pos.nearController(4))
const waitingTransports = tick => room => minerContainerUnfilledTransports(tick)(room)


const baseTime = Game.cpu.getUsed() - initTime

//controller
const controller = tick => room => room.controller
    //repair
const repairRoads = tick => room => {
    const creepPos = creep.map(c => c.pos)
    const posRoads = creepPos.filter(p => p.lookFor(LOOK_STRUCTURES).filter(s => (s.structureType === STRUCTURE_ROAD || (s.structureType === STRUCTURE_CONTAINER && (!s.room.storage || !s.pos.nearController()))) && s.hits < 0.50 * s.hitsMax).length)
    const damagedRoads = posRoads.map(p => p.lookFor(LOOK_STRUCTURES).filter(s => (s.structureType === STRUCTURE_ROAD || (s.structureType === STRUCTURE_CONTAINER && (!s.room.storage || !s.pos.nearController()))) && s.hits < 0.50 * s.hitsMax)[0])
    //if(room.name === 'W42S2') console.log(room.name + ' creepPos ' + JSON.stringify(creepPos))
    //if(room.name === 'W42S2') console.log(room.name + ' posRoads ' + JSON.stringify(posRoads))
    //if(room.name === 'W42S2') console.log(room.name + ' damagedRoads ' + JSON.stringify(damagedRoads))
    return damagedRoads
}
const repairWalls = tick => room => {
    const wallR = friendlyWalls(tick)(room)
    //console.log('roomStatus 82 ' + room.name + ' wallR ' + JSON.stringify(wallR))
    const walls = wallR.filter(x => x).filter(s => s.hits < s.hitsMax && s.hits < room.targetHits())
    const containerss = room.storage === undefined ? controllerContainers(tick)(room).filter(s => s.hits < 0.9 * s.hitsMax && s.hits < room.targetHits()) : []
    const rampartss = structsByType.rampart.filter(s => s.hits < 0.9 * s.hitsMax && s.hits < room.targetHits())
    const roadss = repairRoads(tick)(room)
    return room.controller && room.controller.my ? walls.concat(containerss).concat(rampartss).concat(roadss) : []
}
const structuresNeedRepair = tick => room => struct
    .filter(s => s.hitsMax && s.hits < 0.25 * s.hitsMax && s.hits < s.room.targetHits())
    .concat(repairRoads(tick)(room))
const minorRepairs = tick => room => structuresNeedRepair(tick)(room).filter(s => {
    const hitCap = _.min([s.hitsMax, s.room.targetHits()])
    return hitCap - s.hits < 4000 && hitCap - s.hits > 1000
})
const majorRepairs = tick => room => structuresNeedRepair(tick)(room)
    .filter(s => _.min([s.hitsMax, s.room.targetHits()]) - s.hits >= 4000)
    //build
const buildSites = tick => room => site.filter(s => s.structureType !== STRUCTURE_TOWER || s.room.controller.level >= 3)
    //harvest
const harvestableEnergy = tick => room => {
    const allSources = sources(tick)(room)
    const sourcesFull = allSources.filter(s => s.energy === s.energyCapacity)
    const sourcesWalklable = sourcesFull.filter(s => s.pos.walkableCoordsNearPos().length > 0).filter(s => s.pos.findInRange(FIND_MY_CREEPS, 1).length === 0)
    const workhorsesAvailable = creepsByType.workhorse.filter(c => c.status('empty')).length > 0
    return sourcesWalklable && !workhorsesAvailable
}
const harvestTargets = tick => room => {
    const sourcess = sources(tick)(room)
    const extractorss = structsByType.extractor
    const minerals = extractorss.map(e => e.pos.lookFor(LOOK_MINERALS)[0]).filter(m => m.mineralAmount > 0 || m.ticksToRegeneration < 100)
    return sourcess.concat(minerals)

}
const enemies = tick => room => {
    return enemyCreeps(tick)(room).concat(enemyStructures(tick)(room)).concat(enemyWalls(tick)(room))
}
const missionTargets = tick => room => {
    const flagss = flag
    const attackFlags = flagss.filter(f => f.color === COLOR_RED)
    const targets = attackFlags.map(f => f.pos.look())
        .map(objectList => objectList.filter(object => object.type === LOOK_CREEPS || object.type === LOOK_STRUCTURES))
        .reduce((pv, cv) => pv.concat(cv), [])
        .map(el => el[el.type])
        .filter(el => el.my !== true)
        //console.log('targets' + JSON.stringify(targets))
    return targets
}
const skTargets = tick => room => {
    const skLairs = lairs(tick)(room).filter(s=> s.structureType === STRUCTURE_KEEPER_LAIR)
    const skRoom = skLairs.length > 0
    const sks = skRoom ? enemyCreeps(tick)(room) : []
    const sksComing = skRoom && sks.length === 0 ? skLairs : []
    const retVal = [].concat(sks).concat(sksComing)
    //console.log('roomStatus 122 skTargets ' + room.name + ' ' + retVal)
    return retVal
}

const targetTime = Game.cpu.getUsed() - baseTime
const pickup = tick => room => resources(tick)(room)
    //.filter(r => r.type === RESOURCE_ENERGY || room.storage)
const suppliers = tick => room => pickup(tick)(room)
    .filter(r => r.amount > 200)
    .map(r => {
        r.supplierScore = r.amount * 1.5
        return r
    })
    .concat(
        containers(tick)(room)
            .concat([room.storage])
        .filter(x => x)
        .filter(c => _.sum(c.store) >= 1000)
        .map(c => {
            c.supplierScore = _.sum(c.store)
            return c
        })
        )
const supplierScore = tick => room => _.sum(suppliers(tick)(room).filter(s => s.supplierScore >= 800).map(s => s.supplierScore))
const consumers = tick => room => []
    .concat(towers(tick)(room).filter(t => t.energy < 0.9 * t.energyCapacity))
    .concat(extensions(tick)(room).filter(t => t.energy < t.energyCapacity))
    .concat(spawns(tick)(room).filter(t => t.energy < t.energyCapacity))
    .concat(dropoffLinks(tick)(room).filter(t => t.energy < t.energyCapacity).filter(s => s.room.energyAvailable >= s.room.energyCapacityAvailable))
    .concat(controllerContainers(tick)(room).filter(c => room.storage === undefined && c.room.energyAvailable >= c.room.energyCapacityAvailable))

const sinkables = tick => room => consumers(tick)(room)

const frontierControllerContainers = tick => room => room.frontier() ? controllerContainers(tick)(room).filter(c => !c.status('empty')) : []
const sourceables = tick => room => [].concat(pickup(tick)(room))
    .concat(enemyStructures(tick)(room).filter(c => !c.status('emptyE')))
    .concat(containers(tick)(room).filter(c => !c.status('emptyE')))
    .concat([room.storage].filter(s => s && s.store[RESOURCE_ENERGY]))
    .concat(sources(tick)(room).filter(s => s.pos.nearCreeps(1, {filter: s.room.energyCapacityAvailable >= 550 ? c => c.type('remoteMiner') : true}).length === 0).filter(c => c.energy > 0 || c.ticksToRegeneration < 10))
    .concat(controllerLinks(tick)(room)
    .concat(dropoffLinks(tick)(room))
    .filter(c => !c.status('empty')))
    //flags
const availableSpawn = tick => room => spawns(tick)(room).filter(s => !s.spawning)
const spawningSpawns = tick => room => spawns(tick)(room).filter(s => !!s.spawning)
const activeSpawn = tick => room => availableSpawn(tick)(room).length > 0 ? availableSpawn(tick)(room)[0] : undefined
    //


const upgradeEnergyAvailable = tick => room => {
    const controllerContainerEnergy = controllerContainers(tick)(room).reduce((prev, cur) => prev + cur.store[RESOURCE_ENERGY] , 0)
    const controllerLinkEnergy = controllerLinks(tick)(room).reduce((prev, cur) => prev + cur.energy , 0)
    const storageEnergy = room.storage ? room.storage.store[RESOURCE_ENERGY] : 0
    return controllerContainerEnergy + storageEnergy + controllerLinkEnergy
}

const possessed = tick => room => {
    const reserved = room.controller && room.controller.reservation && room.controller.reservation.username === 'black0441'
    const owned = room.controller && room.controller.my
    const operatingBase = flag.filter(f => f.color === COLOR_CYAN).length > 0
    return owned || reserved || operatingBase

}


const netIncome = tick => room => {
    const activeMiners = creepsByType.remoteMiner.filter(m => m.pos.findInRange(FIND_SOURCES, 1).length > 0)
    const perTickIncomeProjected = activeMiners.length * 2000 / 300
    const creepProductionFactor = 0.67
    const miningIncome = perTickIncomeProjected * creepProductionFactor

    const workerCostFull = creepsByType.staticWorker.reduce((total, w) => total + _.countBy(w.body, 'type')[WORK], 0)
    const workerCostPerTick = workerCostFull * 0.99
    const workhorseCostFull = creepsByType.workhorse.reduce((total, w) => total + _.countBy(w.body, 'type')[WORK], 0)
    const workhorseCostPerTick = workhorseCostFull * 0.50
    const creepExpenses = workerCostPerTick + workhorseCostPerTick

    return miningIncome - creepExpenses
}

const workRemaining = tick => room => {
    const repair = repairWalls(tick)(room)
    const repairWork = repair.reduce((total, s) => total + _.min([room.targetHits(), s.hitsMax]) - _.min([room.targetHits(), s.hitsMax, s.hits]) , 0)
    const construction = sites(tick)(room).filter(s => !s.pos.nearController() || room.storage === undefined && controllerContainers(tick)(room).length === 0)
    const constructionWork = construction.reduce((total, s) => total + s.progressTotal - s.progress, 0)
    return repairWork + constructionWork
}

const storageAmount = resource => room.storage && room.storage.store[resource] > 0 ? room.storage.store[resource] : 0
const terminalAmount = resource => room.terminal && room.terminal.store[resource] > 0 ? room.terminal.store[resource] : 0
const totalAmount = resource => storageAmount(resource) + terminalAmount(resource)
const threatened = tick => room => {
    const to = towers(tick)(room)
    const enemies = enemyCreeps(tick)(room)
    const healthyTowers = to.filter(t => t.energy >= 0.5 * t.energyCapacity)
    const towersOk = healthyTowers.length > 0.5 * to.length
    const enemyThreatSignificant = enemies.length >= healthyTowers.length
    const retVal = !towersOk && enemyThreatSignificant
    return retVal
}


        const retVal = {
            structuresNeedRepair: structuresNeedRepair(tick)(room),
            resources: resources(tick)(room),
            harvestTargets: harvestTargets(tick)(room),
            sites: site,
            transports: creepsByType.transport,
            superTransports: creepsByType.superTransport,
            tenders: creepsByType.towerTender,
            miners: creepsByType.remoteMiner,
            skMiners: creepsByType.skMiner,
            colonists: creepsByType.colonist,
            workers: creepsByType.staticWorker,
            workhorses: creepsByType.workhorse,
            soldiers: creepsByType.soldier,
            scouts: creepsByType.scout,
            jumpers: creepsByType.claimJumper,
            sources: harvestTargets(tick)(room),
            consumers: consumers(tick)(room),
            suppliers: suppliers(tick)(room),
            pickup: pickup(tick)(room),
            controllerContainers: controllerContainers(tick)(room),
            minerContainers: minerContainers(tick)(room),
            otherContainers: otherContainers(tick)(room),
            controllerLinks: controllerLinks(tick)(room),
            dropoffLinks: dropoffLinks(tick)(room),
            containers: containers(tick)(room),
            ramparts: ramparts(tick)(room),
            friendlyCreeps: creep,
            enemyCreeps: enemyCreeps(tick)(room),
            enemyFreeCreeps: enemyFreeCreeps(tick)(room),
            enemyStructures: enemyStructures(tick)(room),
            controller: controller(tick)(room),
            harvestableEnergy: harvestableEnergy(tick)(room),
            enemies: enemies(tick)(room),
            flags: flag,
            missionTargets: missionTargets(tick)(room),
            sinkables: sinkables(tick)(room),
            sourceables: sourceables(tick)(room),
            activeSpawn: activeSpawn(tick)(room),
            spawningSpawns: spawningSpawns(tick)(room),
            spawningCreeps: spawningCreeps(tick)(room),
            spawns: spawns(tick)(room),
            extensions: extensions(tick)(room),
            labs: labs(tick)(room),
            resolveGardenPos: resolveGardenPos,
            enemyWalls: enemyWalls(tick)(room),
            towers: towers(tick)(room),
            repairWalls: repairWalls,
            skTargets: skTargets(tick)(room),
            lairs: lairs(tick)(room),
            upgradeEnergyAvailable: upgradeEnergyAvailable(tick)(room),
            possessed: possessed(tick)(room),
            name: room.name,
            controller: room.controller,
            terminal: room.terminal,
            room: room,
            storage: room.storage,
            netIncome: netIncome(tick)(room),
            workRemaining: workRemaining(tick)(room),
            threatened: threatened(tick)(room),
            reloadGardens: reloadGardens,
            extensionGardens: extensionGardens,
            labGardens: labGardens
        }
        const endCpu = Game.cpu.getUsed()
        const cpuUsed = endCpu - startCpu
        if(cpuUsed > 10 && Game.cpu.bucket < 10000) console.log('long roomStatus execution ' + room.name + ' ' + cpuUsed)
        return retVal
}}


/*
f(0) = 10
f(1) = 1
y = -9x + 10
*/