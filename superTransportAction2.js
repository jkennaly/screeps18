const actionMap = require('actionMap')
const mcFilter = v => mc => _.sum(mc.store) >= v
const clFilter = r => cl => cl.energy >= r * cl.energyCapacity
const eFilter = r => cl => cl.energy < r * cl.energyCapacity
const sFilter = r => cl => _.sum(cl.store) < r * cl.storeCapacity
const rFilter = a => r => r.amount >= a
const sortStored = (a, b) => _.sum(a.store) - _.sum(b.store)
const sortDistance = refObj => (a, b) => a.pos.getRangeTo(refObj) - b.pos.getRangeTo(refObj)
const sortStoredDistance = refPos => (a, b) => {
    const storageDifference = _.sum(b.store) - _.sum(a.store)
    const distanceDfifference = a.pos.getRangeTo(refPos) - b.pos.getRangeTo(refPos)
    return storageDifference !== 0 ? storageDifference : distanceDfifference
}
const statusFilter = refCreep => testCreep => testCreep.status('full') === refCreep.status('full') && testCreep.status('empty') === refCreep.status('empty')
const nearestFilter = transport => {
    var excludeNames = [transport.name]
    return t => {
        const nearestArray = transport.nearestOfTypeToPos(t.pos, {filter: statusFilter(transport)}, excludeNames)
        if(nearestArray[1] && excludeNames.indexOf(nearestArray[1]) > -1) excludeNames.push(nearestArray[1])
        return t.structureType && t.structureType === STRUCTURE_STORAGE || nearestArray[0]
    }
}
module.exports = roomsNeedTransport => {
const outpostsNameNeedTransport = roomsNeedTransport
//console.log('transportAction3 27 roomsNeedTransport ' + JSON.stringify(roomsNeedTransport))
    return roomStatus => {
        const transSetStart = Game.cpu.getUsed()
        
        //energy withdrawals enabled
        const minerContainersEnabled = !roomStatus.controller || !roomStatus.controller.owner
        const otherContainersEnabled = !roomStatus.controller || !roomStatus.controller.owner
        
        //energy pickups enabled
        const pickupsEnabled = !roomStatus.controller || !roomStatus.controller.owner
        

        //energy xfers enabled
        const potentialDropoffLinks = roomStatus.dropoffLinks.filter(l => !l.status('full'))
        const dropoffLinksEnabled = roomStatus.controller && roomStatus.controller.my && potentialDropoffLinks.length > 0
        const potenitalDropoffContainers = roomStatus.containers.filter(l => !l.status('full'))
        const dropoffContainersEnabled = roomStatus.controller && roomStatus.controller.my && potenitalDropoffContainers.length > 0
        const storageXferEnabled = roomStatus.controller && roomStatus.controller.my && roomStatus.storage

        const primaryWithdraw = []
            .concat(minerContainersEnabled ? roomStatus.minerContainers.filter(mcFilter(700)) : [])
            .concat(otherContainersEnabled ? roomStatus.otherContainers.filter(mcFilter(100)) : [])

        const primaryPickup = []
            .concat(pickupsEnabled ? roomStatus.pickup.filter(rFilter(800)) : [])
            
        const primaryTransfer = []
            .concat(dropoffLinksEnabled ? potentialDropoffLinks : [])
            .concat(dropoffContainersEnabled ? potenitalDropoffContainers : [])
            .concat(storageXferEnabled &&  roomStatus.storage ? [roomStatus.storage] : [])
            .concat(storageXferEnabled && !roomStatus.storage ? roomStatus.controllerContainers.filter(sFilter(1)) : [])

            
        const primaryWithdrawTargetsPresent = primaryWithdraw.length > 0
        const primaryPickupTargetsPresent = primaryPickup.length > 0
        const primarySupplyTargets = [].concat(primaryWithdraw).concat(primaryPickup)
        const primarySupply = primaryWithdrawTargetsPresent || primaryPickupTargetsPresent
        const primaryTransferTargetsPresent = primaryTransfer.length > 0
        const primaryDump = primaryTransferTargetsPresent
        const primaryTargets = primarySupply || primaryDump

        const transColor = roomStatus.controller && roomStatus.controller.my && !roomStatus.enemyCreeps.length ? COLOR_BLUE : COLOR_GREEN
        const outpostFlags = roomStatus.flags.filter(f => f.color === transColor)
        const baseActiveFlags = outpostFlags.filter(f => {
            if(transColor === COLOR_GREEN) return true
            const roomNames = f.assocRoomNames()
            //console.log('supperTransportAction 56 roomNames ' + JSON.stringify(roomNames))
            const nameNeeded = roomNames.reduce((active, name) => {
                return active || outpostsNameNeedTransport.indexOf(name) > -1
            }, false)
            return nameNeeded
        })
        const waitingFlags = roomStatus.flags.filter(f => f.color === COLOR_CYAN)
        
        const transSetEnd = Game.cpu.getUsed()
        const transSetTime = transSetEnd - transSetStart

        //console.log(roomStatus.name + ' transportAction3 57 transSetTime ' + transSetTime)
        return transport =>  {
            if(!primaryTargets && baseActiveFlags.length === 0 && transColor === COLOR_GREEN) return [['none', undefined]]
            const transStart = Game.cpu.getUsed()
            if(transport.pos === undefined) return [['none', undefined]]

            if(transSetTime > 10) console.log(roomStatus.name + ' transports setup time ' + JSON.stringify(transSetTime))
            const action = actionMap(transport.pos)
            const outpost = !roomStatus.controller || !roomStatus.controller.my
            const targetWithdraw = outpost && !transport.status('full') || !outpost && _.sum(transport.carry) === 0
            const targetTransfer = !targetWithdraw
            const moveTargetPreferred = targetWithdraw ? primarySupplyTargets.filter(nearestFilter(transport)) : primaryTransfer.sort(sortDistance(transport.pos))
            const transActiveFlags = transport.status('full') && transColor === COLOR_GREEN || transport.status('empty') && transColor === COLOR_BLUE ? baseActiveFlags : []
            const moveTargetUnsorted = moveTargetPreferred.length ? moveTargetPreferred : transActiveFlags
            const moveTargetAccepted = moveTargetUnsorted.sort(sortStoredDistance(transport.pos))
            //const fallbackTargets = transport.pos.exitPos() ? transport.pos.walkableCoordsNearPos().filter(p => !p.exitPos) : [transport.pos]
            const baseMoveTarget = moveTargetAccepted.length ? moveTargetAccepted[0].pos : undefined
            const moveTarget = roomStatus.enemyCreeps.length && baseActiveFlags.length ? baseActiveFlags[0].pos : baseMoveTarget
            const withdrawalTargets = primaryWithdraw.filter(t => t.pos.getRangeTo(transport.pos) <= 1)
            const pickupTargets = roomStatus.resources.filter(t => t.pos.getRangeTo(transport.pos) <= 1).sort((a, b) => b.amount - a.amount)
            const xferTargets = primaryTransfer.filter(t => t.pos.getRangeTo(transport.pos) <= 1)
            
            const withdrawPermitted = withdrawalTargets.length > 0 && _.sum(transport.carry) < transport.carryCapacity
            const pickupPermitted = pickupTargets.length > 0 && _.sum(transport.carry) < transport.carryCapacity
            const xferPermitted = xferTargets.length > 0 && _.sum(transport.carry) > 0

            const withdrawAction = withdrawPermitted ? action.withdrawResource(RESOURCE_ENERGY)(withdrawalTargets[0]) : ['none', null]
            const pickupAction = pickupPermitted ? action.pickup(pickupTargets[0]) : ['none', null]
            const xferAction = xferPermitted ? action.transferResource(RESOURCE_ENERGY)(xferTargets[0]) : ['none', null]


            //needs to move to dropPos if no container or link available and not empty
            
            const finalMove = moveTarget === undefined && waitingFlags.length > 0 ? waitingFlags.sort((a, b) => a.pos.getRangeTo(transport) - b.pos.getRangeTo(transport))[0] : moveTarget
            //if(transport.name === 'Annabelle') console.log(transport.name + ' primaryTransfer ' + roomStatus.room.name + ' ' + JSON.stringify(primaryTransfer))
            //if(transport.name === 'Annabelle') console.log(transport.name + ' moveTargetPreferred ' + roomStatus.room.name + ' ' + JSON.stringify(moveTargetPreferred))
            //if(transport.name === 'Annabelle') console.log(transport.name + ' moveTarget ' + roomStatus.room.name + ' ' + JSON.stringify(moveTarget))
            //if(transport.name === 'Annabelle') console.log(transport.name + ' finalMove ' + roomStatus.room.name + ' ' + JSON.stringify(finalMove))
            const move = action.approach(finalMove)

            const transEnd = Game.cpu.getUsed()
            const transTime = transEnd - transStart
            if(transTime > 10) console.log(transport.name + ' ' + transport.room.name + ' ' + JSON.stringify(transTime))

            const currentPosRoads = transport.pos.lookFor(LOOK_STRUCTURES).filter(s => s.structureType === STRUCTURE_ROAD).length > 0
            const roadUseful = !currentPosRoads && transport.status('full') && transport.pos.findInRange(FIND_CREEPS, 3).length === 1
            const buildRoad = roadUseful ? transport.pos.createConstructionSite(STRUCTURE_ROAD) : OK


            return [withdrawAction, pickupAction, xferAction, move]

}}} 