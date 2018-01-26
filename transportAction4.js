const actionMap = require('actionMap')
const mcFilter = v => mc => _.sum(mc.store) >= v
const clFilter = r => cl => cl.energy >= r * cl.energyCapacity
const eFilter = r => cl => cl.energy < r * cl.energyCapacity
const sFilter = r => cl => _.sum(cl.store) < r * cl.storeCapacity
const sortDistance = refPos => (a, b) => (a.pos ? a.pos : a).getRangeTo(refPos) - (b.pos ? b.pos : b).getRangeTo(refPos)
const sortNearest = refPos => (a, b) => (a.pos ? a.pos : a).getRangeTo(refPos) - (b.pos ? b.pos : b).getRangeTo(refPos)
const sortMostCarryE = (a, b) => b.carry[RESOURCE_ENERGY] - a.carry[RESOURCE_ENERGY]
const sortOldest = (a, b) => a.ticksToLive - b.ticksToLive
const eStored = b => b.store ? _.sum(b.store) : b.energy
const sortMaxMin = sortMax => (a, b) => sortMax === true ? eStored(b) - eStored(a) : eStored(a) - eStored(b)
const statusFilter = refCreep => testCreep => testCreep.status('full') === refCreep.status('full') && testCreep.status('empty') === refCreep.status('empty')
const nearestFilter = (transport, excludeArray) => {
    var excludeNames = [transport.name].concat(excludeArray)
    //console.log('transportAction4 13 excludeNames ' + JSON.stringify(excludeNames) )
    return t => {
        const nearestArray = transport.nearestOfTypeToPos(t.pos ? t.pos : t, {filter: statusFilter(transport)}, excludeNames)
        if(nearestArray[1] && excludeNames.indexOf(nearestArray[1]) > -1) excludeNames.push(nearestArray[1])
        return t.structureType && t.structureType === STRUCTURE_STORAGE || nearestArray[0]
    }
}
const noLinkFilter = c => c.pos.findInRange(FIND_MY_STRUCTURES, 1, {filter: s => s.structureType === STRUCTURE_LINK}).length === 0
const posMap = arr => arr.map(c => !c.structureType || c.structureType !== STRUCTURE_EXTENSION ? c.pos.walkableCoordsNearPos() : [c]).reduce((p, c) => p.concat(c), [])
const workerTransFilter = {filter: c => c.type('staticWorker') || c.type('transport')}
const workerTransPresent = l => l.pos.findInRange(FIND_MY_CREEPS, 1, workerTransFilter).length > 0
var requestedTransports = []
const posCompare = (p0, p1) => p0.x === p1.x && p0.y === p1.y && p0.roomName === p1.roomName
const extFilter = {filter: {structureType: STRUCTURE_EXTENSION}}
const posNeedTick = _.memoize(tick => _.memoize(deliveryPos => _.min([1000, deliveryPos.findInRange(FIND_MY_STRUCTURES, 1).reduce((total, struct) => total + (struct.energyCapacity - struct.energy), 0)])))
const deliveryPosMap = transArray => {
    var eTransports = transArray
    return deliveryPos => {
        const posNeed = posNeedTick(Game.time)(deliveryPos)
        const nearTrans = deliveryPos.findInRange(FIND_MY_CREEPS, 1, {filter: t => t.type('transport') && !t.status('emptyE')}).filter((c, i) => i === 0)
        const sortedTrans = nearTrans.concat(eTransports
            .filter(t => !t.status('emptyE'))
            .sort(sortMostCarryE))
            //.sort(sortNearest(deliveryPos))
        const retVal = sortedTrans.length > 0 ? sortedTrans[0].name : undefined
        if(sortedTrans.length > 0) eTransports = sortedTrans.slice(1)
        //if(deliveryPos.roomName === 'E33S34' && deliveryPos.x === 25) console.log(deliveryPos.roomName + ' transportAction4 155 deliveryPos ' + JSON.stringify(deliveryPos))
        //if(deliveryPos.roomName === 'E33S34' && deliveryPos.x === 25) console.log(deliveryPos.roomName + ' transportAction4 155 posNeed ' + JSON.stringify(posNeed))
        //if(deliveryPos.roomName === 'E33S34' && deliveryPos.x === 25) console.log(deliveryPos.roomName + ' transportAction4 155 sortedTrans ' + JSON.stringify(sortedTrans))
        //if(deliveryPos.roomName === 'E33S34' && deliveryPos.x === 25) console.log(deliveryPos.roomName + ' transportAction4 155 transArray ' + JSON.stringify(transArray))
        //if(deliveryPos.roomName === 'E33S34' && deliveryPos.x === 25) console.log(deliveryPos.roomName + ' transportAction4 155 retVal ' + JSON.stringify(retVal))

        return retVal
}}
const testReduction = (i, pos) => (indexFound, testPos, testIndex) => indexFound === -1 && testIndex <= i && posCompare(testPos, pos) ? testIndex : indexFound
const deliveryReduction = (result, pos, i, ar) => ar.reduce(testReduction(i, pos), -1) === i ? result.concat([pos]) : result
module.exports = roomsNeedTransport => {
const outpostsNameNeedTransport = roomsNeedTransport
const posNeed = posNeedTick(Game.time)
//console.log('transportAction3 27 roomsNeedTransport ' + JSON.stringify(roomsNeedTransport))
    return roomStatus => {
        const transSetStart = Game.cpu.getUsed()
        const strat = Game.worldState.strat
        const waitFlags = roomStatus.flags.filter(f => f.color === COLOR_CYAN)
        const hostilesPresent = roomStatus.enemyCreeps.length > 0 && false

        

        //energy withdrawals enabled
        const minerContainersEnabled = roomStatus.resources.filter(r => r.amount > 1000).length === 0
        const controllerLinksEnabled = roomStatus.dropoffLinks.concat(roomStatus.controllerLinks).filter(l => l.energy > 100).length > 0
        const roomEDeficit = roomStatus.room.energyCapacityAvailable - roomStatus.room.energyAvailable
        const roomSpawnDeficit = roomStatus.spawns.reduce((p, c) => p + (c.energyCapacity - c.energy), 0)
        const deficitSpawnsRefreshing = roomEDeficit !== roomSpawnDeficit || roomSpawnDeficit <= 0 ? [] : roomStatus.spawns
            .filter(s => s.energy < s.energyCapacity)
            .filter(s => !s.spawning)
            .filter(s => roomStatus.transports.filter(t => !t.status('emptyE')).filter(t => s.pos.getRangeTo(t) <= 1).length > 0)

        const roomEOkBase = roomEDeficit <= 0 || deficitSpawnsRefreshing.length > 0
        const resContainers = roomStatus.containers.filter(c => _.sum(c.store) > c.store[RESOURCE_ENERGY])
        const mixedStorage = roomStatus.storage && resContainers.length > 0
        const controllerLinkManned = roomStatus.workers.length > 0 || roomStatus.controllerLinks.filter(workerTransPresent).length > 0
        const controllerLinkBehind = roomStatus.controllerLinks.filter(l => l.energy >= 0.25 * l.energyCapacity).length
        const linkPull = controllerLinkBehind && !controllerLinkManned && (roomEOkBase || !roomStatus.storage || roomStatus.storage.store[RESOURCE_ENERGY] < 1000)
        const dropffLinksSecX = controllerLinkManned
        const towersGood = roomStatus.towers.filter(t => t.energy < 0.88 * t.energyCapacity).length === 0



        //terminal Energy
        //if less than 10k, move from local storage
        //if more than 30k, move to local storage
        const tELow = roomStatus.terminal && roomStatus.terminal.store[RESOURCE_ENERGY] < 10000
        const tEHi = roomStatus.terminal && roomStatus.terminal.store[RESOURCE_ENERGY] > 30000

        //terminal local unfinished resources
        const storageAmount = resource => roomStatus.storage && roomStatus.storage.store[resource] > 0 ? roomStatus.storage.store[resource] : 0
        const terminalAmount = resource => roomStatus.terminal && roomStatus.terminal.store[resource] > 0 ? roomStatus.terminal.store[resource] : 0
        const totalAmount = resource => storageAmount(resource) + terminalAmount(resource)
        const transportResources = roomStatus.transports.reduce((resourceArr, t) => t.carries().reduce((availRes, r) => r[0] === RESOURCE_ENERGY || r[1] < 1 ? availRes : availRes.concat([r[0]]), []).concat(resourceArr), [])
        const availResources = roomStatus.storage && roomEOkBase ? Object.keys(roomStatus.storage.store).filter(r => r !== RESOURCE_ENERGY && totalAmount(r) > 20000) : []
        const terminalReqResources = RESOURCES_ALL.filter(r => r !== RESOURCE_ENERGY && r !== RESOURCE_POWER && terminalAmount(r) < 10000 )
        const terminalReqAvailResources = terminalReqResources.filter(r => transportResources.indexOf(r) > -1)
        const reqResources = terminalReqAvailResources
        //terminal processed resources
        const terminalEnabled = roomEOkBase && roomStatus.terminal && (tEHi || tELow || availResources.length)
        const unfilledExtensions = roomStatus.extensions.filter(eFilter(1))

        const xG = roomStatus.extensionGardens[roomStatus.name] ? roomStatus.extensionGardens[roomStatus.name] : []
        const exGardens = xG
            .filter((g, i, ar) => ar.reduce(testReduction(i, g), -1) === i)
            .map(g => g.look ? g : new RoomPosition(g.x, g.y, g.roomName))
            .filter(g => g.findInRange(FIND_MY_STRUCTURES, 1, extFilter).filter(x => x.energy < x.energyCapacity).length > 0)
        const mainEDelivery = (exGardens && exGardens.length && unfilledExtensions.length ? exGardens : [])
                    .concat(roomStatus.spawns.filter(eFilter(1)).map(s => s.pos))
                    .concat(roomStatus.tenders.length === 0 ? roomStatus.towers.filter(eFilter(0.90)).map(t => t.pos) : [])
                    //.filter(dPos => dPos.findInRange(FIND_MY_CREEPS, 1, {filter: c => c.type('transport')}).length === 0)
                    .sort((a, b) => posNeed(b) - posNeed(a))
                    //.filter(x => console.log(roomStatus.name + ' transportAction4 106 deliveryPoint ' + JSON.stringify(x)) || true)
                    .reduce(deliveryReduction , [])
                    //.concat(roomStatus.resources.filter(r => r.amount > 1000).map(r => _.range(r.amount / 1000 + 1).map(x => r.pos)).reduce((p, c) => p.concat(c), []))
                    
        const eTransports = roomStatus.transports
            .filter(t => !t.status('emptyE'))
            .filter(t => exGardens.filter(g => t.pos.getRangeTo(g) <= 1).length === 0)



        const preferredDeliverers = mainEDelivery.map(deliveryPosMap(eTransports))
            //.filter(x => x)

        const delivererNeeded = mainEDelivery.length > preferredDeliverers.length

        //energy xfers enabled
        const towerTargetsEnabled = roomStatus.tenders.length === 0
        const spawnSupplyEnabled = !roomEOkBase
        const extSupplyEnabled = !roomEOkBase
        const transNearStorage = [roomStatus.storage].concat(roomStatus.controllerContainers.filter(sFilter(1)))
            .filter(x => x)
            .filter(s => s.pos.findInRange(FIND_MY_CREEPS, 1, {filter: c => c.type('transport') && !c.status('emptyE')})).length > 0
        const storageSupplyEnabled = (roomEOkBase) && roomStatus.workers.length > 0 && (roomStatus.controllerContainers.length > 0 || roomStatus.storage !== undefined)
        const priStorageXfer = roomStatus.storage && !tELow && roomEOkBase && (storageSupplyEnabled && !roomStatus.dropoffLinks.length || roomStatus.storage.store[RESOURCE_ENERGY] < roomStatus.room.energyCapacityAvailable || tEHi)
        const secStorageXfer = !hostilesPresent && roomStatus.storage && !tELow
        //const cutoff = _.min([1000, roomStatus.transports.reduce((pv, cv) => cv.carryCapacity > pv ? cv.carryCapacity : pv, 0)])
        const cutoff = 1000
        const primaryWithdraw = []
            .concat(minerContainersEnabled ? roomStatus.minerContainers.filter(noLinkFilter).filter(mcFilter(cutoff)).filter(c => c.store[RESOURCE_ENERGY] > 0 || roomEOkBase) : [])
            .concat(roomStatus.resources.filter(r => r.amount > 100))
            .concat(minerContainersEnabled && !roomEOkBase ? roomStatus.minerContainers.filter(mcFilter(100)) : [])
            .concat(minerContainersEnabled ? roomStatus.otherContainers.filter(mcFilter(cutoff)) : [])
            .concat(roomStatus.storage ? roomStatus.controllerContainers.filter(mcFilter(1)) : [])
            .concat(roomStatus.storage && (reqResources.length || delivererNeeded) ? [roomStatus.storage] : [])
            .concat(terminalEnabled && tEHi ? [roomStatus.terminal] : [])
            
        const primaryTransfer = []
            .concat(!hostilesPresent && priStorageXfer ? [roomStatus.storage] : [])
            .concat(!hostilesPresent && roomEOkBase && !roomStatus.storage ? roomStatus.controllerContainers.filter(sFilter(1)) : [])
            .concat(!hostilesPresent && terminalEnabled && (tELow || terminalReqAvailResources.length) ? [roomStatus.terminal] : [])
            .concat(!hostilesPresent ? roomStatus.labs.filter(eFilter(0.5)) : [])
            //.concat(towerTargetsEnabled ? roomStatus.towers.filter(eFilter(0.90)) : [])
            //.concat(!hostilesPresent && spawnSupplyEnabled ? roomStatus.spawns.filter(eFilter(1)) : [])
            //.concat(!hostilesPresent && extSupplyEnabled ? unfilledExtensions : [])

        const primaryWithdrawTargetsPresent = primaryWithdraw.length > 0
        const primarySupply = primaryWithdrawTargetsPresent
        const primaryTransferTargetsPresent = primaryTransfer.length > 0
        const primaryDump = primaryTransferTargetsPresent
        const primaryTargets = primarySupply || primaryDump
        
        const secStorageWithdrawEnabled = roomStatus.storage && roomStatus.storage.store[RESOURCE_ENERGY] > 0 && (!storageSupplyEnabled || !roomEOkBase || tELow)

        const secondaryWithdraw = []
            .concat(minerContainersEnabled ? roomStatus.minerContainers.filter(mcFilter(cutoff)) : [])
            .concat(roomStatus.storage && (secStorageWithdrawEnabled || roomEDeficit > 0 || !primaryTargets) ? [roomStatus.storage].filter(mcFilter(cutoff)) : [])
            .concat(secStorageWithdrawEnabled ? roomStatus.controllerContainers.filter(mcFilter(cutoff)) : [])
            .concat(roomStatus.controllerLinks.concat(roomStatus.dropoffLinks).filter(clFilter(0.50)))
            .concat(linkPull ? roomStatus.controllerLinks : [])
            .concat(mixedStorage ? resContainers : [])

        const secondaryTransfer = roomEOkBase ? []
            .concat(secStorageXfer  ? [roomStatus.storage] : [])
            .concat(!hostilesPresent && controllerLinkManned ? roomStatus.dropoffLinks.filter(eFilter(0.50)) : []) : []

        const eCarriedByTransports = roomStatus.transports
            .filter(t => !t.pos.nearController())
            .reduce((total, t) => total + t.carry[RESOURCE_ENERGY], 0)
        const eDeficit =  2 * (roomStatus.room.energyCapacityAvailable - roomStatus.room.energyAvailable)
        const eCarriedByTransportsSufficient = roomEOkBase || eCarriedByTransports > eDeficit
        const delNames = preferredDeliverers.filter(x => x)


        const findRestingPlace = transport => {
            console.log('transportAction4 188 findRestingPlace for ' + transport.name)
            const waitFlagRest = waitFlags.map(f => f.pos)
            if(waitFlags.length) return waitFlagRest[0]
            const offroadRest = transport.pos
            return transport.pos
        }


        //if(roomStatus.name === 'E31S37') console.log(roomStatus.name + ' transportAction4 163 mainEDelivery ' + JSON.stringify(mainEDelivery))
        //if(roomStatus.name === 'E31S37') console.log(roomStatus.name + ' transportAction4 163 preferredDeliverers ' + JSON.stringify(preferredDeliverers))
        //if(roomStatus.name === 'E31S37') console.log(roomStatus.name + ' transportAction4 163 delNames ' + JSON.stringify(delNames))
        
        const transSetEnd = Game.cpu.getUsed()
        const transSetTime = transSetEnd - transSetStart
        if(transSetTime > 10) console.log(roomStatus.name + ' transports setup time ' + JSON.stringify(transSetTime))
            
        //console.log(roomStatus.name + ' transportAction4 104 transSetTime ' + transSetTime)
        return transport =>  {
            const transStart = Game.cpu.getUsed()
            if(transport.pos === undefined) return [['none', undefined]]
            const refreshingSpawn = transport.boosted() ? [] : deficitSpawnsRefreshing.filter(s => transport.pos.getRangeTo(s) <= 1)
            const creepsNear = transport.pos.nearCreeps(1).length > 1
            //if(!primaryTargets && refreshingSpawn.length === 0 && !creepsNear && !mainEDelivery.length) return [['none', undefined]]


            const action = actionMap(transport.pos)


            const roomEOk = (roomEOkBase || eCarriedByTransportsSufficient && transport.carry[RESOURCE_ENERGY] === 0) && towersGood

            const targetWithdraw = transport.status('empty') || !transport.status('full') && (!delNames.length && mainEDelivery.length || primaryWithdraw.length && !primaryTransfer.length && !secondaryTransfer.length)
            const targetTransfer = !targetWithdraw
 
            const quickMoveIndex = preferredDeliverers.indexOf(transport.name)
            const quickMoveTarget = quickMoveIndex > -1 ? mainEDelivery[quickMoveIndex] : undefined
            const quickMove = quickMoveIndex > -1 ? action.approach(quickMoveTarget) : undefined

            const notBusy = !secondaryTransfer.length && !secondaryWithdraw.length


            const quickMoveTransfers = []
                .concat(towerTargetsEnabled ? roomStatus.towers.filter(eFilter(0.90)) : [])
                .concat(!hostilesPresent && spawnSupplyEnabled ? roomStatus.spawns.filter(eFilter(1)) : [])
                .concat(!hostilesPresent && extSupplyEnabled ? unfilledExtensions : [])

            const awayPosAr = quickMoveTransfers.map(t => t.pos).sort(sortNearest(transport.pos))
            const awayDir = awayPosAr.length && delNames.indexOf(transport.name) === -1 ? awayPosAr[0].getDirectionTo(transport) : 0

            const carryingResource = transport.carry[RESOURCE_ENERGY] < _.sum(transport.carry)
            const carryingTerminalResource = terminalReqResources.filter(r => transport.carry[r] && transport.carry[r] > 0).length > 0
            
            const xferPrestore = carryingResource && !availResources.length && roomStatus.storage && roomStatus.storage.pos.getRangeTo(transport) <= 1 ? [roomStatus.storage] : []
            const withdrawalTargets = (!roomEOk || tELow ? primaryWithdraw.concat(secondaryWithdraw) : primaryWithdraw).concat(notBusy && transport.pos.nearStorage() ? [roomStatus.storage] : []).filter(t => t.pos ? t.pos.getRangeTo(transport.pos) <= 1 : t.getRangeTo(transport.pos) <= 1)
            const pickupTargets = roomStatus.resources.filter(t => t.pos.getRangeTo(transport.pos) <= 1).sort((a, b) => b.amount - a.amount)
            const xferTargets = carryingTerminalResource && transport.pos.nearStruc(STRUCTURE_TERMINAL) ? [roomStatus.terminal] : refreshingSpawn.concat(xferPrestore).concat(primaryTransfer.concat(quickMoveTransfers).concat(roomEOkBase && towersGood ? secondaryTransfer : []).filter(t => (!transport.status('emptyE') || carryingTerminalResource) || !t.structureType || t.structureType !== STRUCTURE_TERMINAL || t.store[RESOURCE_ENERGY] < 10000).filter(t => !transport.status('emptyE') || !carryingTerminalResource || t.structureType && t.structureType === STRUCTURE_TERMINAL).filter(t => t.pos.getRangeTo(transport.pos) <= 1))
            
            const xferPermitted = xferTargets.length > 0 && _.sum(transport.carry) > 0 && (!transport.status('emptyE') || !carryingTerminalResource || xferTargets[0].structureType && xferTargets[0].structureType === STRUCTURE_TERMINAL)
            const withdrawPermitted = !xferPermitted && withdrawalTargets.length > 0 && _.sum(transport.carry) < transport.carryCapacity && (primaryTransfer.concat(mainEDelivery).length > 0 || secondaryTransfer.length > 0 || notBusy)
            const pickupPermitted = pickupTargets.length > 0 && _.sum(transport.carry) < transport.carryCapacity
            
            const neededResource = (withdrawalTargets.length && withdrawalTargets.filter(t => typeof (t.stores) === 'function').length > 0 ? withdrawalTargets.filter(t => typeof (t.stores) === 'function')[0].stores() : []).filter(s => s[1] > 0).filter(s => !availResources.length || reqResources.indexOf(s[0]) > -1).filter(s => s[0] !== undefined)[0]
            const allResources = withdrawPermitted && withdrawalTargets[0].stores && (withdrawalTargets[0].structureType !== STRUCTURE_STORAGE || availResources.length > 0) && neededResource && neededResource.length > 0
            const withdrawResource = transport.carries().filter(r => r[1] > 0).length > 0 ? transport.carries()[0][0] : allResources ? neededResource[0] : RESOURCE_ENERGY
            const xferResource = xferPermitted ? transport.carries().filter(s => s[1] > 0)[0][0] : RESOURCE_ENERGY
            const withdrawAction = withdrawPermitted ? action.withdrawResource(withdrawResource)(withdrawalTargets[0]) : ['none', null]
            const pickupAction = pickupPermitted ? action.pickup(pickupTargets[0]) : ['none', null]
            const xferAction = xferPermitted ? action.transferResource(xferResource)(xferTargets[0]) : ['none', null]
           

            //if(transport.name === 'Jackson') console.log(transport.name + ' quickMove ' + JSON.stringify(quickMove))
            //if(transport.name === 'Jackson') console.log(transport.name + ' quickMoveTarget ' + JSON.stringify(quickMoveTarget))
            //if(transport.name === 'Jackson') console.log(transport.name + ' quickMoveTransfers ' + JSON.stringify(quickMoveTransfers))
            //if(transport.name === 'Jackson') console.log(transport.name + ' mainEDelivery ' + JSON.stringify(mainEDelivery))
            //if(transport.name === 'Jackson') console.log(transport.name + ' preferredDeliverers ' + JSON.stringify(preferredDeliverers))
            //if(transport.name === 'Jackson') console.log(transport.name + ' exGardens ' + JSON.stringify(exGardens))
            //if(transport.name === 'Jackson') console.log(transport.name + ' xG ' + JSON.stringify(xG))
            

            if(quickMove || transport.fatigue > 0) return [withdrawAction, pickupAction, xferAction, quickMove]
            
            const transCapLow = transport.carryCapacity < 350
            const moveTargetPreferredRaw = targetWithdraw ? primaryWithdraw : primaryTransfer.concat(refreshingSpawn).concat(transCapLow ? quickMoveTransfers : [])
            /*
            const moveTargetPreferred = preferredDelivererIdRaw.indexOf(transport.id) > -1 ? mainEDelivery[preferredDelivererIdRaw.indexOf(transport.id)] : moveTargetPreferredRaw.filter(nearestFilter(transport))
            
            */
            const moveTargetPreferred = moveTargetPreferredRaw
                //.filter(nearestFilter(transport, transport.pos.findInRange(FIND_MY_CREEPS, 1).map(c => c.name)))
            const usePreferredTarget = moveTargetPreferred.length > 0
            const secondaryAction = targetWithdraw ? secondaryWithdraw : secondaryTransfer
            const moveTargetUnfiltered = carryingResource && roomStatus.storage ? [roomStatus.storage] : usePreferredTarget ? moveTargetPreferred : secondaryAction

            //console.log(transport.name + ' moveTargetUnfiltered[0] ' + JSON.stringify(moveTargetUnfiltered[0]))
            //console.log(transport.name + ' moveTargetUnfiltered[0] ' + JSON.stringify(moveTargetUnfiltered[0]))

            //console.log(JSON.stringify(roomStatus.resolveGardenPos(moveTargetUnfiltered[0].pos)))
            
            const moveTargetUnsorted = posMap(moveTargetUnfiltered
                .filter(t => !t.structureType || t.structureType !== STRUCTURE_SPAWN || roomStatus.transports.filter(c => t.pos.getRangeTo(c) <= 1).length <= 1))
                .filter(p => [roomStatus.resolveGardenPos(p.pos ? p.pos : p)].map(p0 => new RoomPosition(p0.x, p0.y, p0.roomName))[0].findInRange(FIND_MY_CREEPS, 0, {filter: c => c.id !== transport.id}).length === 0)
            const moveTargetAccepted = moveTargetUnsorted.sort(sortOldest)
            const moveTarget = moveTargetAccepted.length ? (moveTargetAccepted[0].pos ? moveTargetAccepted[0].pos : moveTargetAccepted[0]) : moveTargetPreferredRaw.sort(sortMaxMin(targetWithdraw)).concat([findRestingPlace(transport)])[0]
            const moveTargetExt = roomStatus.resolveGardenPos(moveTarget)
            const stayingStill = !moveTarget || moveTargetExt.x === transport.pos.x && moveTargetExt.y === transport.pos.y && moveTargetExt.roomName === transport.pos.roomName
            const inOthersWay = stayingStill && (transport.pos.nearStruc(STRUCTURE_ROAD, 0).length > 0 || transport.pos.findInRange(FIND_MY_CREEPS, 1).length > 1)

            const moveNeeded = carryingTerminalResource ? action.approach(roomStatus.terminal) : action.approach(moveTargetExt)
            const move = inOthersWay ? action.approach(transport.pos.walkableCoordsNearPos()[0]) : moveNeeded
            const transEnd = Game.cpu.getUsed()
            const transTime = transEnd - transStart
            if(transTime > 10) console.log(transport.name + ' ' + transport.room.name + ' ' + JSON.stringify(transTime))

            //if(transport.name === 'Maria') console.log(transport.name + ' move ' + JSON.stringify(move))
            //if(transport.name === 'Maria') console.log(transport.name + ' roomEDeficit ' + JSON.stringify(roomEDeficit))
            //if(transport.name === 'Maria') console.log(transport.name + ' stayingStill ' + JSON.stringify(stayingStill))
            //if(transport.name === 'Maria') console.log(transport.name + ' inOthersWay ' + JSON.stringify(inOthersWay))
            //if(transport.name === 'Maria') console.log(transport.name + ' targetWithdraw ' + JSON.stringify(targetWithdraw))
            //if(transport.name === 'Maria') console.log(transport.name + ' primaryTransfer ' + JSON.stringify(primaryTransfer))
            //if(transport.name === 'Maria') console.log(transport.name + ' secondaryTransfer ' + JSON.stringify(primaryTransfer))
            //if(transport.name === 'Maria') console.log(transport.name + ' primaryWithdraw ' + JSON.stringify(primaryWithdraw))
            //if(transport.name === 'Maria') console.log(transport.name + ' secondaryWithdraw ' + JSON.stringify(primaryWithdraw))
            //if(transport.name === 'Maria') console.log(transport.name + ' moveTargetUnsorted ' + JSON.stringify(moveTargetUnsorted))
            //if(transport.name === 'Maria') console.log(transport.name + ' moveTargetPreferred ' + JSON.stringify(moveTargetPreferred))
            //if(transport.name === 'Maria') console.log(transport.name + ' moveTargetPreferredRaw ' + JSON.stringify(moveTargetPreferredRaw))
            //if(transport.name === 'Maria') console.log(transport.name + ' secStorageXfer ' + JSON.stringify(secStorageXfer))
            //if(transport.name === 'Maria') console.log(transport.name + ' withdrawPermitted ' + JSON.stringify(withdrawPermitted))
            //if(transport.name === 'Maria') console.log(transport.name + ' xferPermitted ' + JSON.stringify(xferPermitted))
            //if(transport.name === 'Maria') console.log(transport.name + ' withdrawResource ' + JSON.stringify(withdrawResource))
            //if(transport.name === 'Maria') console.log(transport.name + ' withdrawalTargets ' + JSON.stringify(withdrawalTargets))
            //if(transport.name === 'Maria') console.log(transport.name + ' withdrawAction ' + JSON.stringify(withdrawAction))
            //if(transport.name === 'Maria') console.log(transport.name + ' availResources ' + JSON.stringify(availResources))
            //if(transport.name === 'Maria') console.log(transport.name + ' terminalReqAvailResources ' + JSON.stringify(terminalReqAvailResources))
            

            const currentPosRoads = transport.pos.lookFor(LOOK_STRUCTURES).filter(s => s.structureType === STRUCTURE_ROAD).length > 0
            const roadUseful = (!transport.pos.nearExit() || transport.pos.nearStruc(STRUCTURE_RAMPART, 1)) && !roomStatus.resources.length && !currentPosRoads && (transport.status('full') || roomStatus.controller && roomStatus.controller.my && roomStatus.controller.level > 4 && !transport.status('empty')) && transport.pos.findInRange(FIND_CREEPS, 3).length === 1
            const buildRoad = roadUseful ? transport.pos.createConstructionSite(STRUCTURE_ROAD) : OK

            //return [withdrawAction, pickupAction, xferAction, (awayDir > 0 && move[0] === 'none' ? transport.move(awayDir) : move)]
            return [withdrawAction, pickupAction, xferAction, move]


}}} 