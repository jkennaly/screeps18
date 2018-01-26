const actionMap = require('actionMap')
const sorts = require('sorts')
const controllerFilter = s => s && s.structureType && s.structureType === STRUCTURE_CONTROLLER
const wallFilter = s => s && s.structureType && (s.structureType === STRUCTURE_WALL)
const buildableFilter = s => s && s.status && s.status('buildable') && !s.room.energyCritical()
const repairableFilter = s => s && s.hits < 0.9 * s.hitsMax && s.hits < s.room.targetHits()
const transferableFilter = permissive => permissive ? s => s && s.room && !s.status('full') && (!s.structureType || s.structureType !== STRUCTURE_CONTAINER) : s => false
//const transferableFilter = s => s.status('transferable') && !(s.structureType && s.structureType === STRUCTURE_CONTAINER) && (s.room.energyCritical() || !s.room.repairCritical())
const sinkStatusFilter = p => s => s && (wallFilter(s) || buildableFilter(s) || repairableFilter(s) || transferableFilter(p)(s) || s.status && s.status('upgradeable'))
const build = s => s.progress && s.progress < s.progressTotal
const repair = s => !build(s) && s.hits < s.hitsMax && s.hits < s.room.targetHits()
const sinksRange3Filter = s => build(s) || repair(s) || controllerFilter(s)
const capacityFilter = workhorse => s => s.energyCapacity && s.energy > workhorse.carryCapacity || s.storeCapacity && s.store[RESOURCE_ENERGY] > workhorse.carryCapacity || s.storeCapacity === undefined && s.energyCapacity === undefined
module.exports = roomStatus => {
    var memo = {}
     const towerEnergy = roomStatus.tenders.length === 0 ? roomStatus.towers.filter(t => t.energy < 0.90 * t.energyCapacity) : []
    
    

    const sinks = roomStatus.sinkables
        .filter(s => !controllerFilter(s))
        //.filter(sinkStatusFilter(!workhorse.status('emptyE')))
        //.filter(t => t.pos.findInRange(FIND_HOSTILE_CREEPS, 5).length === 0)
    const neededHere = roomStatus.controller && roomStatus.controller.my && roomStatus.workhorses.length < 3 && (roomStatus.miners.length === 0 || roomStatus.transports.length === 0) || roomStatus.flags.length === 0
    
    const roomDowngradeCritical = roomStatus.controller && (roomStatus.controller.ticksToDowngrade < 0.5 * CONTROLLER_DOWNGRADE[roomStatus.controller.level])
    const roomDowngradeWarning = roomStatus.controller && (roomStatus.controller.ticksToDowngrade < 0.9 * CONTROLLER_DOWNGRADE[roomStatus.controller.level])
     const cityFlags = roomStatus.flags
        .filter(f => f.color === COLOR_GREEN)
        .filter(f => Game.worldState.roomStatus[f.assocRoomName()] !== undefined)
    /*
    const flagEnemyFree = f => Game.worldState.roomStatus[f.assocRoomName()] && Game.worldState.roomStatus[f.assocRoomName()].enemyCreeps.length === 0
    const baseFlag = roomStatus.flags
    const outpostFlags = roomStatus.flags.filter(f => f.color === COLOR_BLUE || f.color === COLOR_ORANGE || f.color === COLOR_PURPLE)
   
    const wildcatFlags = roomStatus.flags.filter(f => f.color === COLOR_YELLOW)

    const wildcatNameNeedsWorkhorse = wildcatFlags
        .map(f => f.destRoomName())
        .map(n => Game.worldState.roomStatus[n])
        .filter(rs => rs && rs.sites.filter(s => s.structureType === STRUCTURE_SPAWN).length > 0 && rs.possessed && rs.workhorses.length < 2)
        .map(rs => rs.name)

    const wildcatNeedsWorkhorse = wildcatFlags.filter(f => wildcatNameNeedsWorkhorse.indexOf(f.assocRoomName()) > -1)
   
    const outpostsNameNeedWorkhorse = outpostFlags.map(f => f.destRoomName()).filter(n => Game.worldState.roomStatus[n] && (Game.worldState.roomStatus[n].workhorses.length === 0 && Game.worldState.roomStatus[n].sites.length > 0))
    const outpostsNeedWorkhorse = outpostFlags.filter(f => outpostsNameNeedWorkhorse.indexOf(f.assocRoomName()) > -1)
    const flagTargets.length = wildcatNeedsWorkhorse.length > 0 && roomStatus.friendlyCreeps.length > 2
    const flagTargets.length = outpostsNeedWorkhorse.length > 0 && !neededHere
    const cityFlagEligible = cityFlags.length && !flagTargets.length
    const citiesNameNeedWorkhorse = cityFlagEligible ? cityFlags.map(f => f.assocRoomName()).filter(n => Game.worldState.roomStatus[n].repairWalls.length > 1 || Game.worldState.roomStatus[n].sites.length > 0) : []
    const citiesNeedWorkhorse = cityFlags.filter(f => citiesNameNeedWorkhorse.indexOf(f.assocRoomName()) > -1)
    */


    const spawnSites = _.memoize(sites => sites.filter(s => s.structureType === STRUCTURE_SPAWN))
    const spawnSiteCritical = roomStatus.possessed && roomStatus.spawns.length === 0 && spawnSites(roomStatus.sites).length > 0
    const roomSites = spawnSiteCritical ? spawnSites(roomStatus.sites) : roomStatus.sites
    //console.log(roomStatus.name + ' workhorseAction3 57')
    return workhorse => {
        if(workhorse.pos === undefined) return
        const cpuInit = Game.cpu.getUsed()
        
        //if(workhorse.name === 'Asher') console.log(workhorse.name + ' Game.time ' + JSON.stringify(Game.time))

        if(memo[Game.time] !== undefined && memo[Game.time][workhorse.name] !== undefined) return memo[Game.time][workhorse.name]
        if(memo[Game.time] === undefined) {
            memo = {}
            memo[Game.time] = {}
        }
       //

       const harvestPermitted = roomStatus.miners.length < roomStatus.sources.length && roomStatus.minerContainers.filter(capacityFilter(workhorse)).length === 0
    
        //
        const sinks1Filter = s => workhorse.pos.getRangeTo(s.pos) <= 1
        const sinks3Filter = s => !sinks1Filter(s) && workhorse.pos.getRangeTo(s.pos) <= 3
        const sinks5Filter = s => !sinks1Filter(s) && !sinks3Filter(s) && workhorse.pos.getRangeTo(s.pos) <= 5
        const sources1Filter = s => workhorse.pos.getRangeTo(s.pos) <= 1
        const sources3Filter = s => !sources1Filter(s) && workhorse.pos.getRangeTo(s.pos) <= 3
        const sources6Filter = s => !sources1Filter(s) && !sources3Filter(s) && workhorse.pos.getRangeTo(s.pos) <= 6
        const sinkLongFilter = s => !sinks1Filter(s) && !sinks3Filter(s) && !sinks5Filter(s)
        const sourceLongFilter = s => !sources1Filter(s) && !sources3Filter(s) && !sources6Filter(s)
        const flagBusy = f => f.pos.lookFor(LOOK_CREEPS).filter(c => c.id !== workhorse.id).length === 0
        
        const action = actionMap(workhorse.pos)
        const roomNamesNeedWorkhorse =  Game.worldState.empireStatus.roomsNeedWorkhorse
        const FlagFilter = f => roomNamesNeedWorkhorse.indexOf(f.assocRoomName()) > -1 || cityFlags.length === 0 && (!f.room.controller || !f.room.controller.my)
        const flag = roomStatus.flags.filter(FlagFilter).filter(flagBusy)
        const near1Sinks = sinks.filter(sinks1Filter)
        const sink3 = sinks.filter(sinks3Filter)
        const near3Sinks= sink3.filter(sinksRange3Filter)
        const mid3Sinks = sink3.filter(s => !sinksRange3Filter(s))
        const sink5 = sinks.filter(sinks5Filter)
        const mid5Sinks = sink5.filter(sinksRange3Filter)
        const nothingToDoHere = workhorse.status('empty') || sinks.length === 0
        //const approachCity = cityFlagEligible && (citiesNeedWorkhorse.length > 0 || (workhorse.status('full') && sinks.length === 0))


        const cpu1 = Game.cpu.getUsed()

                

        const flagTargets = flag.filter(f => workhorse.nearestOfTypeToPos(f.pos))


        const nearSinks = near1Sinks.concat(near3Sinks)
        const midSinks = nearSinks.length === 0 ? mid3Sinks.concat(mid5Sinks) : []
        const farSinks = nearSinks.length === 0 && midSinks.length === 0 ? sink5.filter(s => !sinksRange3Filter(s)).concat(sinks.filter(sinkLongFilter)).sort((a, b) => workhorse.pos.getRangeTo(a.pos) - workhorse.pos.getRangeTo(b.pos)) : []

        const source = roomStatus.sourceables
            .filter(s => s.mineralType === undefined)
            .filter(capacityFilter(workhorse))
            .filter(s => s.pos.findInRange(FIND_CREEPS, 1).length < s.pos.walkableCoordsNearPos().length || s.pos.getRangeTo(workhorse) <= 1)
            .filter(t => t.pos.findInRange(FIND_HOSTILE_CREEPS, 5).length === 0)
            .filter(s => !s.pos.nearSource(0) || harvestPermitted)
        const nearSource = source.filter(sources1Filter)
        const midSource = nearSource.length === 0 ? source.filter(sources3Filter) : []
        const midHiSource = nearSource.length === 0 && midSource.length === 0 ? source.filter(sources6Filter) : []
        const farSource = nearSource.length === 0 && midSource.length === 0  && midHiSource.length === 0 ? source.filter(sourceLongFilter) : []
        const farSourceSorted = farSource.sort(sorts.nearest(workhorse.pos))

        const sourceWalk = nearSource.concat(midSource).concat(midHiSource).concat(farSourceSorted)

        //if(workhorse.name === 'Hunter') console.log(workhorse.name + ' filtered sinks: ' + JSON.stringify(roomStatus.sinkables.filter(s => !controllerFilter(s)).filter(transferableFilter)))
        //drop
        //harvest - attack - build - repair - dismantle - attackController - rangedHeal - heal
        //claimController
        //suicide
        //move


        
        //console.log(workhorse.name + ' ' + workhorse.fatigue)
        //const approachFocalPos = !still && !approachSink && !approachSource && !approachFlag
        //if(workhorse.name === 'Stella') console.log(workhorse.name + ' sources: ' + JSON.stringify(still))
        //if(workhorse.name === 'Caleb') console.log(workhorse.name + ' resources: ' + JSON.stringify(roomStatus.resources))
        
        //work
        //withdraw
            //if not full and there is an *energyContainer* within 1, withdraw
        const withdrawTargets = () => nearSource.filter(s => s.status('withdrawable')).map(c => (c.stores ? c.stores() : c.carries() ).map(r => r[1] > 0 && (!(c.structureType && c.structureType === STRUCTURE_STORAGE) || r[0] === RESOURCE_ENERGY) ? action.withdrawResource(r[0])(c) : false).filter(r => r !== false)).reduce((pv, cv) => pv.concat(cv), [])
            //if there is a source within 1 with no miner within 2 squares, harvest
        const harvestTargets = () => harvestPermitted ? nearSource.filter(s => s.status('harvestable')).filter(s => s.pos.getRangeTo(workhorse.pos) <= 1 || s.pos.walkableCoordsNearPos().filter(p => p.findInRange(FIND_CREEPS, 0).length === 0).length > 0).map(c => action.harvestEnergy(c)) : []
            //if there is a construction site within 3, build
        const energyForWork = workhorse.carry[RESOURCE_ENERGY] * 2 >= workhorse.carryCapacity || !workhorse.status('emptyE') && !harvestTargets().length
        

        const buildTargets = () => energyForWork && (roomStatus.transports.length > 0 || roomStatus.extensions.length === 0 || roomStatus.room.energyAvailable >= roomStatus.room.energyCapacityAvailable || workhorse.fatigue > 0) ? roomStatus.sites.filter(s => roomStatus.room.energyCapacityAvailable >= 550 || s.structureType !== STRUCTURE_ROAD || workhorse.fatigue > 0 || (!roomStatus.controller.my && roomStatus.miners.length > 0)).map(c => action.build(c)).filter(x => x[0] !== 'none') : []
                //if there is a structure with *creepRepair*, repair
        const buildLongEligible = () => (roomStatus.miners.length > 0 || ((!roomStatus.activeSpawn ? 1 : 0) + roomStatus.spawningSpawns.length === 0))
        const buildTargetsLong = () => buildLongEligible() ? roomStatus.sites.filter(s => roomStatus.room.energyCapacityAvailable >= 550 || s.structureType !== STRUCTURE_ROAD || (!roomStatus.controller.my && roomStatus.miners.length > 0)).map(c => action.buildLong(c)).filter(x => x[0] !== 'none') : []
                //if there is a structure with *creepRepair*, repair
        const woundedRamparts = () => (!roomStatus.controller || roomStatus.controller.my && roomStatus.room.energyCapacityAvailable >= 550) && roomStatus.ramparts.filter(r => r.hits < 2 * r.room.targetHits())
        const repairTargets = () => (!roomStatus.controller || roomStatus.controller.my && roomStatus.room.energyCapacityAvailable >= 550) && energyForWork && !buildTargets().length && roomStatus.miners.length > 0 ? roomStatus.repairWalls(Game.time)(roomStatus.room).concat(woundedRamparts()).map(c => action.repair(c)) : []
        const repairTargetsLong = () => (!roomStatus.controller || roomStatus.controller.my && roomStatus.room.energyCapacityAvailable >= 550) && roomStatus.miners.length > 0 ? !buildTargetsLong().length && !workhorse.status('emptyE') ? roomStatus.repairWalls(Game.time)(roomStatus.room).map(c => action.repairLong(c)).filter(r => r[0] !== 'none') : [] : []
        
        const harvestTargetsLong = () => harvestPermitted ? roomStatus.sources.filter(s => s.status('harvestable')).filter(s => s.pos.findInRange(FIND_MY_CREEPS, 3, {filter: c => c.type('remoteMiner')}).length === 0).map(c => action.harvestEnergy(c)).map(action.harvestEnergy) : []
        
        const dismantleTargets = () => roomStatus.enemyStructures.filter(s => s.status('empty')).filter(s => s.pos.getRangeTo(workhorse) <= 1)
            .concat(roomStatus.storage ? roomStatus.controllerContainers : [])
            .filter(t => workhorse.pos.getRangeTo(t) <= 1)
            .map(c => action.dismantle(c))


        const cpu2 = Game.cpu.getUsed()


        const controllers = roomStatus.controller && roomStatus.controller.my ? [roomStatus.controller] : []
        const sink = nearSinks.concat(midSinks).concat(farSinks).concat(controllers).concat(flag).filter(s => s.room.storage === undefined || !(s.structureType && s.structureType === STRUCTURE_CONTAINER))
        const baseSink = nearSinks.concat(midSinks).concat(farSinks)
        const colonySink = nearSinks.concat(midSinks).concat(farSinks).concat(controllers)
        const nearSink = nearSinks.concat(controllers.filter(s => sinks1Filter(s) || sinks3Filter(s)))
        const midSink = midSinks.concat(controllers.filter(sinks5Filter))
        const farSink = farSinks.concat(controllers.filter(sinkLongFilter))

        const pickupTargetsPermitted =  !workhorse.status('full')
        const pickupTargets = pickupTargetsPermitted ? roomStatus.pickup.filter(r => r.pos.getRangeTo(workhorse.pos) <= 1).map(c => action.pickup(c)) : [['none', undefined]]
        const pickupTargetsLong = pickupTargetsPermitted ? roomStatus.pickup.sort((a, b) => a.pos.getRangeTo(workhorse) - b.pos.getRangeTo(workhorse)) : ['none', undefined]
        const pickupAction = pickupTargets.length ? pickupTargets[0] : ['none', undefined]
        const allowSource = !workhorse.status('full') && !flagTargets.length
        
        const fatigued = workhorse.fatigue > 0
        const finishingHarvest = allowSource && workhorse.pos.nearSource() && neededHere && harvestPermitted
        const nearRampart = !workhorse.status('emptyE') && roomStatus.miners.length && roomStatus.ramparts.filter(r => r.pos.getRangeTo(workhorse.pos) <= 3).filter(r => r.hits < 2*r.room.targetHits()).length > 0
        
        const preferSink = !workhorse.status('empty') && nearSource.filter(s => s.structureType === undefined || s.structureType !== STRUCTURE_STORAGE).length === 0 || workhorse.status('full')
        const allowSink = !workhorse.status('empty')  && (!flagTargets.length || nearRampart)
        
        const oldStill = workhorse.nearCreeps().length === 0 && !flagTargets.length && (!workhorse.status('emptyE') && nearSink.length > 2 || !workhorse.status('full') && nearSource.length > 0 && (!nearSource[0].status('empty') || flag.length === 0))
        const still = (fatigued || finishingHarvest || nearRampart) && workhorse.pos.x !== 0 && workhorse.pos.y !== 0 && workhorse.pos.x !== 49 && workhorse.pos.y !== 49
        const sinkPriority = !workhorse.status('emptyE') && (workhorse.status('full') || !finishingHarvest)
        const approachSink = !still && !flagTargets.length && !workhorse.status('emptyE') && (sink.length > 0 || buildTargetsLong().length > 0 || repairTargetsLong().length > 0)
        
        const aso2 = !flagTargets.length || (pickupTargets.length !== 0) || (roomStatus.miners.length === 0)
        const aso3 = (roomStatus.miners.length === 0) || ((buildTargetsLong().length > 0) || (repairTargetsLong().length > 0) || (pickupTargetsLong.length > 0)) || workhorse.status('empty')
        const approachSource = !still && aso2 && !approachSink && !flagTargets.length && source.length && aso3 && !workhorse.status('full') 
        
        const approachFlag = !still && !approachSink && !approachSource && flagTargets.length > 0

        const controllerCritical = roomStatus.controller && roomStatus.controller.my && (roomStatus.controller.level < 2 || (roomStatus.controller.progress > roomStatus.controller.progressTotal || roomStatus.controller.ticksToDowngrade < CONTROLLER_DOWNGRADE[roomStatus.controller.level] * 0.9)) && !workhorse.status('emptyE') && (workhorse.status('somewhatFull') && !nearSource.length > 0)
        const controllerPre = controllerCritical ? [roomStatus.controller] : []

         //pickup
            //if there is a resource on the ground within 1, pickup
 
        //rangedAttack - rangedMassAttack - build - repair - rangedHeal
         //upgradeController
        const upgradeTargetsAllowed = !!roomStatus.controller && !buildTargetsLong().length && !repairTargetsLong().length && !workhorse.status('emptyE') && (roomStatus.transports.length > 0 || roomStatus.controller.level < 3)
        const upgradeTargets = () => upgradeTargetsAllowed ? [roomStatus.controller].filter(c => c.pos.getRangeTo(workhorse.pos) <= 3).map(c => action.controller(c)) : [['none', undefined]]
        const upgradeTargetsLong = () => upgradeTargetsAllowed ? [roomStatus.controller].map(c => action.controller(c)) : [['none', undefined]]
        
        const sourceTargets = allowSource ? [].concat(dismantleTargets()).concat(withdrawTargets()).concat(harvestTargets().concat(pickupTargetsLong)) : []
        const upgradeAvail = roomStatus.controller && roomStatus.controller.progress >= roomStatus.controller.progressTotal
        const upgradePriority = roomDowngradeCritical || (roomDowngradeWarning || upgradeAvail) && workhorse.pos.nearController()
        const targets = !workhorse.status('emptyE') && (allowSink || upgradePriority) ? [].concat(upgradePriority ? controllers.map(action.controller) : []).concat(repairTargets()).concat(buildTargets()).concat(upgradeTargets()).concat(sourceTargets).filter(x => x).filter(x => x[0] !== 'none') : sourceTargets
        
        const workAction = targets.length ? targets[0] : ['none', undefined]

        //carry
        //transfer
        //if there is a structure that is not full within 1, transferEnergy
        const lowTransports = roomStatus.transports.length === 0
        const minersLow = roomStatus.miners.length < roomStatus.harvestTargets.length
        const noWork = roomStatus.workRemaining <= 0
        const hasEnergy = workhorse.carry[RESOURCE_ENERGY] > 0
        const okToXfer = hasEnergy && !upgradePriority && roomStatus.extensions.length > 0
        const roomTransferReady = lowTransports || minersLow || noWork && roomStatus.extensions.filter(e => e.pos.getRangeTo(workhorse) <= 10).length > 0
        const roomEnergyCapHi = roomStatus.room.energyCapacityAvailable > 300
        const transferActionPermitted = okToXfer && roomTransferReady && roomStatus.controller.level > 1
        const transferETargets = transferActionPermitted ? nearSinks.concat(midSinks).concat(farSinks)
            .filter(s => s.structureType !== STRUCTURE_TOWER || s.energy < 0.90 * s.energyCapacity)
            .filter(s => s.structureType !== STRUCTURE_STORAGE || !terminalEnergyLow && (((s.store[RESOURCE_ENERGY] < 100000) || (sinks.length === 1)) && s.room.energyAvailable >= s.room.energyCapacityAvailable ))
            .filter(s => s.structureType !== STRUCTURE_CONTAINER || (!s.pos.nearSource(1) && s.room.energyAvailable >= s.room.energyCapacityAvailable && flagTargets.length > 0))
            .filter(s => s.structureType !== STRUCTURE_LINK || (!s.pos.nearController() && s.room.energyAvailable >= s.room.energyCapacityAvailable && flagTargets.length > 0))
            .filter(s => s.structureType !== STRUCTURE_TERMINAL || needsMet && terminalEnergyLow)
            .filter(s => s.structureType !== STRUCTURE_SPAWN || roomStatus.controller.level > 1 && roomStatus.transports.length < roomStatus.miners.length)
            .filter(s => s.structureType !== STRUCTURE_EXTENSION || roomStatus.controller.level > 1 && roomStatus.transports.length < roomStatus.miners.length)
            .sort((a, b) => a.pos.getRangeTo(workhorse.pos) - b.pos.getRangeTo(workhorse.pos))
            .filter((c, i) => i === 0)
            .map(c => action.transferEnergy(c)) : [['none', undefined]]

        const dropoffMinerals = !workhorse.status('empty') && workhorse.status('emptyE')
        const storageTargets = roomStatus.room.storage && (dropoffMinerals || (roomStatus.room.energyAvailable >= roomStatus.room.energyCapacityAvailable && (!approachSource || sourceWalk.length === 0 && roomStatus.room.storage.store[RESOURCE_ENERGY] > 800) && !approachSink && !approachFlag && buildTargetsLong().length === 0 && repairTargetsLong().length === 0)) ? [roomStatus.room.storage] : []
        const approachStorageSink = !still && !workhorse.status('empty') && workhorse.status('emptyE') && storageTargets.length
        const approachStorageSource = !still && workhorse.status('empty') && (!approachSource || sourceWalk.length === 0) && storageTargets.length
        const approachStorage = approachStorageSink || approachStorageSource
        const nearStorageTargets = storageTargets.filter(t => workhorse.pos.getRangeTo(t) <= 1)
        const storageTransfer = nearStorageTargets.length > 0 && flagTargets.length > 0 ? workhorse.carries().map(r => r[1] > 0 ? action.transferResource(r[0])(nearStorageTargets[0]) : false).filter(r => r !== false) : []
        const transferTargets = storageTransfer.concat(transferETargets)


        const cpu3 = Game.cpu.getUsed()


        const transferAction = transferTargets.length ? transferTargets[0] : ['none', undefined]
        //creep
        //move
        const sinkTargetsBase = [].concat(upgradePriority ? controllers : []).concat(transferActionPermitted ? transferETargets : []).concat(buildTargetsLong())
            .concat(repairTargetsLong())
            //.concat(sink.filter(s => s.structureType !== STRUCTURE_LINK || (!s.pos.nearController(5) && (roomStatus.room.energyAvailable >= roomStatus.room.energyCapacityAvailable) && flagTargets.length > 0)).map(s => [0, s]))
            .concat(upgradeTargetsLong()).filter(s => s[0] !== 'none')
        //const sinkTarget = transferTargets.concat(targets).filter(t => t && t[0] !== 'none')
        //if(workhorse.name === 'Hunter') console.log(workhorse.name + ' ' + JSON.stringify(sourceTargets))
        const pickRampart = () => roomStatus.ramparts
            .filter(r => r.hits < 2 * r.room.targetHits())
            .filter(r => r.pos.findInRange(FIND_MY_CREEPS, 3, {filter: c => c.type('workhorse') && c.id !== workhorse.id}).length === 0)
            .sort((a, b) => b.hits - a.hits)
            .map(r => [,r])
        const rampartResort = sinkTargetsBase.length > 0
        const nearRamparts = roomStatus.ramparts
            .filter(r => r.pos.getRangeTo(workhorse) <= 3)
            .sort((a, b) => b.hits - a.hits)
        //console.log('workhorseAction 270 nearRamparts ' + JSON.stringify(nearRamparts))
        const sinkTargets = rampartResort ? sinkTargetsBase : pickRampart()
        const rampartRepairAction = rampartResort || !nearRamparts.length ? ['none', undefined] : action.repair(nearRamparts[0])

        const moveAction =  upgradePriority && !workhorse.status('emptyE') ? controllers.map(action.approach)[0] :
                        approachStorage ? [storageTargets[0]].map(action.approach)[0] :
                        approachSink && sinkTargets.length ? [sinkTargets[0][1]].map(action.approach)[0] :
                        approachSource ? [sourceWalk[0]].map(action.approach)[0] :
                        approachFlag ? [flagTargets[0]].map(action.approach)[0] :
                        cityFlags.length ? action.approach(cityFlags[0]) :
                        ['none', undefined]
        const statementString =  approachStorage ? "approachStorage" :
                        approachSink ? "approachSink" :
                        approachSource ? "approachSource" :
                        approachFlag ? "approachFlag" :
                        'still'


        const retVal = [statementString, moveAction, transferAction, pickupAction, workAction, rampartRepairAction]
        
        
        //console.log('workhorseAction2 206 paths ' + JSON.stringify(workAction))
        memo[Game.time][workhorse.name] = retVal
        const cpu4 = Game.cpu.getUsed()
        
        //if(workhorse.name === 'Jeremiah') console.log(workhorse.name + ' moveAction ' + roomStatus.room.name + ' ' + JSON.stringify(moveAction))
        //if(workhorse.name === 'Jeremiah') console.log(workhorse.name + ' still ' + roomStatus.room.name + ' ' + JSON.stringify(still))
        //if(workhorse.name === 'Jeremiah') console.log(workhorse.name + ' approachSink ' + roomStatus.room.name + ' ' + JSON.stringify(approachSink))
        //if(workhorse.name === 'Jeremiah') console.log(workhorse.name + ' sinkTargets[0] ' + roomStatus.room.name + ' ' + JSON.stringify(sinkTargets[0]))
        //if(workhorse.name === 'Jeremiah') console.log(workhorse.name + ' transferTargets ' + roomStatus.room.name + ' ' + JSON.stringify(transferTargets))
        //if(workhorse.name === 'Jeremiah') console.log(workhorse.name + ' transferETargets ' + roomStatus.room.name + ' ' + JSON.stringify(transferTargets))
        //if(workhorse.name === 'Jeremiah') console.log(workhorse.name + ' transferActionPermitted ' + roomStatus.room.name + ' ' + JSON.stringify(transferActionPermitted))
        //if(workhorse.name === 'Jeremiah') console.log(workhorse.name + ' buildTargets() ' + roomStatus.room.name + ' ' + JSON.stringify(buildTargets()))
        //if(workhorse.name === 'Jeremiah') console.log(workhorse.name + ' buildTargetsLong() ' + roomStatus.room.name + ' ' + JSON.stringify(buildTargetsLong()))
        return retVal




}}