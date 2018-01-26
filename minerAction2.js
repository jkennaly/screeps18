
const creepsNeeded = require('creepsNeeded')
const actionMap = require('actionMap')

const nearHostiles = (range, opts) => pos => pos.findInRange(FIND_HOSTILE_CREEPS, range, opts).concat(pos.findInRange(FIND_HOSTILE_STRUCTURES, range))

const fil = function(container) {
        //console.log(JSON.stringify(container))
        const transportRoom = container.length > 0 ? _.sum(container[0].store) : 0
        const retVal = {filter: c => c.type('transport') || c.type('workhorse')}
        //console.log('trans has room' + transportRoom)
        return retVal
    }    
const sourcesWithContainersFilter = s => s.pos.findInRange(FIND_STRUCTURES, 1, {filter: {structureType: STRUCTURE_CONTAINER}}).length > 0 || s.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {filter: {structureType: STRUCTURE_CONTAINER}}).length > 0
const sourcesLackingContainersFilter = s => s.pos.findInRange(FIND_STRUCTURES, 1, {filter: {structureType: STRUCTURE_CONTAINER}}).length === 0 && s.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {filter: {structureType: STRUCTURE_CONTAINER}}).length === 0
const sourcesBeingMinedFilter = s => s.pos.findInRange(FIND_MY_CREEPS, 1, {filter: c => c.type('remoteMiner') && c.ticksToLive > 100}).length > 0
const sourcesNeedingMinersFilter = id => s => s.pos.findInRange(FIND_MY_CREEPS, 1, {filter: c => c.type('remoteMiner') && c.ticksToLive > 100 && c.id !== id}).length === 0
const sourcesWithoutWorkhorse = s => s.pos.findInRange(FIND_MY_CREEPS, 1, {filter: c => c.type('workhorse')}).length === 0

const lifeLeftMinerFilter = c => c.type() === 'remoteMiner' && c.ticksToLive > 100
const extractorFilterObj = { filter: s => s.structureType === STRUCTURE_EXTRACTOR}
const minerFromFromSource = c => c.type('remoteMiner') && c.pos.findInRange(FIND_SOURCES, 1).length === 0 && c.pos.findInRange(FIND_STRUCTURES, 1, extractorFilterObj).length === 0
const minerContainerless = c => c.type('remoteMiner') && c.pos.findInRange(FIND_STRUCTURES, 0, {filter: s => s.structureType === STRUCTURE_CONTAINER}).length === 0
const unemployedMinerFilter = c => lifeLeftMinerFilter(c) && (minerFromFromSource(c) || minerContainerless(c))
const nearestExitRamparts = obj => obj.pos.findClosestByRange(FIND_MY_STRUCTURES, {filter: s => s.structureType === STRUCTURE_RAMPART && s.pos.findInRange(FIND_STRUCTURES, 0, {filter: r => r.structureType === STRUCTURE_ROAD}).length > 0})
const waitingPos = obj => nearestExitRamparts(obj)[0].pos.walkableCoordsNearPos().filter(p => p.findInRange(FIND_STRUCTURES, 0, {filter: r => r.structureType === STRUCTURE_ROAD}).length === 0)[0]
const flagEnemyFree = f => Game.worldState.roomStatus[f.assocRoomName()].enemyFreeCreeps.length === 0
const wildcatSupportNeeded = roomStatus => roomStatus.controller && roomStatus.controller.level <= 2 && roomStatus.miners.filter(lifeLeftMinerFilter).length < roomStatus.harvestTargets.length
  
module.exports = roomStatus => {
        const transSetStart = Game.cpu.getUsed()
        
        const hostiles = roomStatus.enemyFreeCreeps
        const hostileAttackers = roomStatus.enemyFreeCreeps.length > 0
        const fleeFlags = roomStatus.flags.filter(f => f.color === COLOR_GREEN | f.color === COLOR_WHITE)
        const cityFlags = roomStatus.flags.filter(f => f.color === COLOR_GREEN)
        const wildcatFlags = roomStatus.flags.filter(f => f.color === COLOR_YELLOW)
        const wildcatMinersNeededNames = wildcatFlags
            .filter(f => Game.worldState.roomStatus[f.assocRoomName()])
            .filter(flagEnemyFree)
            .map(f => f.assocRoomName())
            .map(n => Game.worldState.roomStatus[n])
            .filter(wildcatSupportNeeded)
            .map(s => s.name)
        const wildcatsNeedingMiners = wildcatFlags
            //.filter(f => wildcatMinersNeededNames.indexOf(f.assocRoomName()) > -1)
        const outpostFlags = roomStatus.flags
            .filter(f => f.color === COLOR_BLUE || f.color === COLOR_ORANGE || f.color === COLOR_PURPLE)
    
        const outpostsNeedingMiners = outpostFlags.filter(f => creepsNeeded(f.assocRoomName())('remoteMiner') > 0)
        const remoteMinersNeeded = outpostsNeedingMiners.concat(wildcatsNeedingMiners)
        const mineableRoom = roomStatus.possessed || (Game.worldState.strat.outpost.indexOf(roomStatus.name) > -1 || outpostFlags.length === 0) && wildcatFlags.length === 0
        const sources = mineableRoom ? roomStatus.sources.filter(s => roomStatus.miners.length >= roomStatus.harvestTargets.length || s.mineralType === undefined) : []
        const localPos = () => remoteMinersNeeded.length > 0 ? waitingPos(remoteMinersNeeded[0]) : roomStatus.miners.sort((a, b) => a.ticksToLive - b.ticksToLive)[0]
        const noHarvest = !cityFlags.length && (!!outpostFlags.length || !!wildcatFlags.length)
        const fleeObject = [{
                action: 'moveAlong',
                target: fleeFlags[0],
                statement: 'runAway',
                param: undefined

            }]  
            const transSetEnd = Game.cpu.getUsed()
        const transSetTime = transSetEnd - transSetStart
 
        return miner => {
            const transStart = Game.cpu.getUsed()
            //if(miner.name === 'Taylor') console.log(miner.name + roomStatus.name)
            if(miner.pos === undefined) return
            //miner is within 1 of another miner
            const nearMiner = miner.pos.findInRange(FIND_MY_CREEPS, 1, {filter: c => c.type('remoteMiner')})
            //that miner has less than 100 ticks
            if(nearMiner.length > 1 && miner.ticksToLive < 100) return miner.suicide() ? [['none', undefined]] : [['none', undefined]]
            //if(miner.name === 'Hunter') console.log(miner.name + ' ' + roomStatus.name + ' ' + ' skipped quick returns')

            if(nearMiner.filter(m => m.ticksToLive < 100).length === 1 && miner.ticksToLive >= 100) return [['none', undefined]]
            //if(miner.name === 'Hunter') console.log(miner.name + ' ' + roomStatus.name + ' ' + ' skipped quick returns')
            const action = actionMap(miner.pos)
            //always
        //run from hostile attack/ranged attack creeps
        //run from hostile towers
            

            


        //Outpost Flags
            

            const nearestUnminedSources = sources.filter(sourcesNeedingMinersFilter(miner.id)).sort((a, b) => a.pos.getRangeTo(miner) - b.pos.getRangeTo(miner))
            const nearSource = sources.filter(s => miner.pos.getRangeTo(s.pos) === 1)
            const nearestCreepToDesiredSource = nearestUnminedSources.concat(nearSource)
                //.filter(s => roomStatus.miners.filter(unemployedMinerFilter).length > 0 && roomStatus.miners.filter(unemployedMinerFilter).name === miner.name)
                //.concat(nearestUnminedSources.length === 0 ? nearSource : [])
                //.filter(s => s.pos.findInRange(FIND_MY_CREEPS, 1, {filter: unemployedMinerFilter}).length === 1 || miner.pos.findInRange(FIND_STRUCTURES, 0, {filter: s => s.structureType === STRUCTURE_CONTAINER}).length > 0)
                
            const sourceHarvestable = s => true
            const initialTarget = sources.length ? sources.reduce((pv, cv) => {
                return pv.pos.getRangeTo(miner.pos) > cv.pos.getRangeTo(miner.pos) ? cv : pv.pos.getRangeTo(miner.pos) === cv.pos.getRangeTo(miner.pos) ? sourceHarvestable(cv) ? cv : pv : pv
            }) : outpostFlags[0]

            const initialStatement = 'mine'
            const initialAction = 'harvest'
            //structures
            const readyToMine = initialTarget && initialTarget.pos.getRangeTo(miner.pos) === 1
            const container = miner.pos.lookFor(LOOK_STRUCTURES).concat(miner.pos.lookFor(LOOK_CONSTRUCTION_SITES)).filter(s => s.structureType === STRUCTURE_CONTAINER)
            const onContainer = container.length > 0 && sources.filter(s => s.pos.getRangeTo(miner.pos) <= 1).length > 0
            const containerFull = onContainer ? _.sum(container[0].store) >= container[0].storeCapacity : false
            const sourceLacksContainer = initialTarget ? sourcesLackingContainersFilter(initialTarget) : false
            const needsContainer = readyToMine && sourceLacksContainer && miner.room.controller && (miner.room.controller.my || miner.room.controller.reservation && miner.room.controller.reservation.username === Game.worldState.strat.me)
            //if(miner.name === 'Blake') console.log(miner.name + ' sources ' + initialTarget)

            //+command
            if(needsContainer) miner.pos.createConstructionSite(STRUCTURE_CONTAINER)

            const needToReposition = (readyToMine && !onContainer && !sourceLacksContainer || !readyToMine) && nearestUnminedSources.length > 0
            const containerPos = !sourceLacksContainer && initialTarget ? initialTarget.pos.findInRange(FIND_STRUCTURES, 1, {filter: {structureType: STRUCTURE_CONTAINER}}).concat(initialTarget.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {filter: {structureType: STRUCTURE_CONTAINER}}))[0].pos : undefined
            const containerFree = !sourceLacksContainer && initialTarget ? containerPos.lookFor(LOOK_CREEPS).length === 0 : false

            //if standing on a container and free resource, fill container with resource
            const resourceAvailable = miner.pos.findInRange(FIND_DROPPED_RESOURCES, 1)
            const underDevelopment = container.length && container[0].progress !== undefined

              const filt = fil(container)
            //console.log(JSON.stringify(filt))
            const nearTransports = miner.pos.findInRange(FIND_MY_CREEPS, 1, filt)
            const transportWaiting = onContainer && nearTransports.length > 0
            const dryLoad = miner.status('full') && miner.status('emptyE')
            const okToLoad = transportWaiting && dryLoad  && (container.length === 0 || containerFull)


            const targetLinks = roomStatus.dropoffLinks.filter(l => !l.status('full') && l.pos.getRangeTo(miner.pos) <= 1).map(action.transferEnergy)
            const emptyLink = targetLinks.filter(l => l[1].status('empty'))

            const containerReadyToFill = container.length > 0 && container[0].store !== undefined && _.sum(container[0].store) >= 0.55 * container[0].storeCapacity
            const containerReadyOrMissing = containerReadyToFill || container.length === 0
            const fillLink = targetLinks.length > 0 && miner.status('full') && !miner.status('emptyE')

            const pickupNeeded = roomStatus.resources.filter(r => r.pos.getRangeTo(miner.pos) === 0).length > 0
            const pickupTargets = roomStatus.resources.filter(r => r.pos.getRangeTo(miner.pos) === 0).map(action.pickup)


            const myContainer = onContainer ? miner.pos.findInRange(FIND_STRUCTURES, 0, {filter: s => s.structureType === STRUCTURE_CONTAINER})[0] : undefined

            const withdrawPermitted = myContainer && _.sum(miner.carry) < miner.carryCapacity && initialTarget.ticksToRegeneration && roomStatus.dropoffLinks.length
            

            const repairStruc = !miner.status('emptyE') ? roomStatus.structuresNeedRepair.filter(s => s.pos.getRangeTo(miner.pos) <= 3) : []
            const buildStruc = !miner.status('emptyE') ? miner.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 3) : []
            
            const keepMining = mineableRoom && readyToMine && (onContainer || sourceLacksContainer)
            const hopOnContainer = mineableRoom && needToReposition && nearestCreepToDesiredSource.length > 0 && containerPos && containerFree
            const unmannedMine = remoteMinersNeeded.length
            const waitFlags = roomStatus.flags.filter(f => f.color === COLOR_CYAN)
            const approachFocalPos = true

            //near rampart next to flag
            const moveAction = keepMining ? ['none', undefined] :
                                hopOnContainer ?  [containerPos].map(action.approach)[0] :
                                mineableRoom && nearestUnminedSources.length > 0  && nearestCreepToDesiredSource.length ? nearestCreepToDesiredSource.map(action.approach)[0] :
                                unmannedMine ? remoteMinersNeeded.map(action.approach)[0] :
                                noHarvest ? [outpostsNeedingMiners[0]].map(action.approach)[0] :
                                waitFlags.length ? [waitFlags[0]].map(action.approach)[0] :
                                approachFocalPos ? [localPos()].map(action.approach)[0] :
                                ['none', undefined]
            const workReady = miner.carry[RESOURCE_ENERGY] > 0.5 * miner.carryCapacity && !fillLink
            const workAction = repairStruc.length && workReady ? repairStruc.map(action.repair)[0] :
                                buildStruc.length && workReady ? buildStruc.map(action.build)[0] :
                                readyToMine && !fillLink ? [initialTarget].map(action.harvest)[0] :
                                ['none', undefined]

            const xferResource = Object.keys(miner.carry).filter(k => miner.carry[k] > 0)

            const xferAction = fillLink ? targetLinks[0] :
                                okToLoad && xferResource.length > 0 ? nearTransports.map(action.transferResource(xferResource[0]))[0] :
                                ['none', undefined]

            const finalWorkAction = keepMining ? workAction : ['none', undefined]

            const pickupAction = pickupNeeded && !miner.status('full') ? pickupTargets[0] :
                                ['none', undefined]

            const workNeeded = repairStruc.length || buildStruc.length
            const dropAction = !miner.status('empty') && miner.status('emptyE') && myContainer && _.sum(myContainer.store) < myContainer.storeCapacity ? action.drop(miner.carries()[0][0]) : ['none', undefined]
            const withdrawAction = withdrawPermitted ? action.withdrawEnergy(myContainer) : ['none', undefined]





            const currentPosRoads = miner.pos.lookFor(LOOK_STRUCTURES).filter(s => s.structureType === STRUCTURE_ROAD).concat(
                  moveAction.length && moveAction[1] ?  (moveAction[1].pos ? moveAction[1].pos : moveAction[1]).lookFor(LOOK_STRUCTURES).filter(s => s.structureType === STRUCTURE_ROAD) : [])
            const roadMissing = initialTarget !== undefined && currentPosRoads.length === 0
            const roomUnowned = !roomStatus.controller || !roomStatus.controller.owner
            const roomConnectFlags = roomStatus.flags.filter(f => f.color === COLOR_CYAN || f.color === COLOR_YELLOW)
            const roomDanger = roomConnectFlags.length === 0 || roomStatus.soldiers.length > 0
            const edgeRoom = roomUnowned && roomDanger
            const productiveRoom = roomStatus.possessed && roomStatus.transports.length === 0 && roomStatus.superTransports.length === 0 && roomStatus.miners.length <= roomStatus.harvestTargets.length
            const roadUseful = roadMissing && (edgeRoom || productiveRoom)
            const buildRoad = roadUseful ? miner.pos.createConstructionSite(STRUCTURE_ROAD) : OK
            const fleeRoom = hostileAttackers && fleeFlags.length > 0

            //if('Jake' === miner.name) console.log(miner.name + ' ' + roomStatus.name + ' minerAction moveAction ' + JSON.stringify(moveAction))
            //if('James' === miner.name) console.log(miner.name + ' ' + roomStatus.name + ' minerAction withdrawAction ' + JSON.stringify(withdrawAction))
            //if('James' === miner.name) console.log(miner.name + ' ' + roomStatus.name + ' minerAction withdrawPermitted ' + JSON.stringify(withdrawPermitted))
            //if('James' === miner.name) console.log(miner.name + ' ' + roomStatus.name + ' minerAction myContainer ' + JSON.stringify(myContainer))
            //if('James' === miner.name) console.log(miner.name + ' ' + roomStatus.name + ' minerAction _.sum(miner.carry) < miner.carryCapacity ' + JSON.stringify(_.sum(miner.carry) < miner.carryCapacity))
            //if('Jake' === miner.name) console.log(miner.name + ' ' + roomStatus.name + ' minerAction remoteMinersNeeded ' + JSON.stringify(remoteMinersNeeded))
            //if('Jake' === miner.name) console.log(miner.name + ' ' + roomStatus.name + ' minerAction keepMining ' + JSON.stringify(keepMining))
            //if('Jake' === miner.name) console.log(miner.name + ' ' + roomStatus.name + ' minerAction unmannedMine ' + JSON.stringify(unmannedMine))
            //if('Jake' === miner.name) console.log(miner.name + ' ' + roomStatus.name + ' minerAction fleeRoom ' + JSON.stringify(fleeRoom))
            //if('Jake' === miner.name) console.log(miner.name + ' ' + roomStatus.name + ' minerAction hostileAttackers ' + JSON.stringify(hostileAttackers))
            //if('Jake' === miner.name) console.log(miner.name + ' ' + roomStatus.name + ' minerAction hostiles ' + JSON.stringify(hostiles))
            //if('Jake' === miner.name) console.log(miner.name + ' ' + roomStatus.name + ' minerAction hostiles.map(h => h.owner) ' + JSON.stringify(hostiles.map(h => h.owner)))
            
            const transEnd = Game.cpu.getUsed()
            const transTime = transEnd - transStart
            if(transTime > 10) console.log(miner.name + ' ' + miner.room.name + ' ' + JSON.stringify(transTime))
            //if('Hudson' !== miner.name) 
            return fleeRoom ? fleeObject : [moveAction, finalWorkAction, xferAction, pickupAction, dropAction, withdrawAction]

            //return [['none', null]]
}}