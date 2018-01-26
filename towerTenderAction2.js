const actionMap = require('actionMap')
const controllerFilter = s => s.structureType && s.structureType === STRUCTURE_CONTROLLER
const buildableFilter = s => s.status('buildable') && !s.room.energyCritical()
const repairableFilter = s => (s.status('repairCritical') || s.status('repairLo')) && !s.room.energyCritical()
const transferableFilter = s => s.room.energyCritical() && s.status('transferable') && s.structureType !== STRUCTURE_CONTAINER
//const transferableFilter = s => s.status('transferable') && !(s.structureType && s.structureType === STRUCTURE_CONTAINER) && (s.room.energyCritical() || !s.room.repairCritical())
const sinkStatusFilter = s => buildableFilter(s) || repairableFilter(s) || transferableFilter(s) || s.status('upgradeable')
const build = s => s.progress && s.progress < s.progressTotal
const repair = s => !build(s) && s.hits < 0.9 * s.hitsMax && s.hits < s.room.targetHits()
const sinksRange3Filter = s => build(s) || repair(s) || controllerFilter(s)

module.exports = roomStatus => {
    return tender => {
        if(tender.pos === undefined) return
        const sinks1Filter = s => tender.pos.getRangeTo(s.pos) <= 1
        const sinks3Filter = s => !sinks1Filter(s) && tender.pos.getRangeTo(s.pos) <= 3
        const sinks5Filter = s => !sinks1Filter(s) && !sinks3Filter(s) && tender.pos.getRangeTo(s.pos) <= 5
        const sources1Filter = s => s && tender.pos.getRangeTo(s.pos) <= 1
        const sources3Filter = s => s && !sources1Filter(s) && tender.pos.getRangeTo(s.pos) <= 3
        const sinkLongFilter = s => s && !sinks1Filter(s) && !sinks3Filter(s) && !sinks5Filter(s)
        const sourceLongFilter = s => s && !sources1Filter(s) && !sources3Filter(s)
        const action = actionMap(tender.pos)

        const posScore = distance => supplierScore => supplierScore / distance



        const towerEnergy = roomStatus.towers.filter(t => t.energy < t.energyCapacity).sort((a, b) => a.energy - b.energy)
        const nearSink = towerEnergy.filter(t => t.pos.getRangeTo(tender.pos) <= 1)
        const near1Sinks = nearSink
        
        const tenderRoom = tender.carryCapacity - _.sum(tender.carry)
        const roomENeeded = tender.room.energyCapacityAvailable - tender.room.energyAvailable
        const tenderECarried = roomStatus.tenders.reduce((totalE, trans) => totalE + trans.carry[RESOURCE_ENERGY], 0)
        const energyCollectionNeeded = roomStatus.pickup.filter(p => p.amount > 100).length > 0 || roomStatus.suppliers.length > 0
        const needsMet = tenderECarried >= roomENeeded && towerEnergy.length === 0

        const pullFromStorage = true
        const storagePull = pullFromStorage ? [tender.room.storage] : []
        //if(tender.name === 'Zachary') console.log(tender.name + ' energyCollectionNeeded ' + tender.room.name + ' ' + JSON.stringify(energyCollectionNeeded))
        
        //if(tender.name === 'Brody') console.log(tender.name + ' pullFromStorage ' + JSON.stringify((pullFromStorage)))
        
        const otherCreepNearSupplier = thisCreep => source => source.pos.findInRange(FIND_MY_CREEPS, 1, {filter: otherCreep => otherCreep.name !== thisCreep.name && otherCreep.type() === thisCreep.type()}).length > 0
        const source = roomStatus.sourceables
            .filter(s => s.ticksToRegeneration === undefined)
            .filter(s => s.body === undefined)
            .filter(s => s.status('transferable') && !s.status('emptyE'))
            .concat(storagePull)
            .filter(x => !!x)
        const sourceScores = source.map(x => [x.pos, posScore(x.pos.getRangeTo(tender.pos))(x.supplierScore)])
        const nearSource = source.filter(sources1Filter)
        const midSource = nearSource.length === 0 ? source.filter(sources3Filter) : []
        const farSource = nearSource.length === 0 && midSource.length === 0 ? source.filter(sourceLongFilter) : []
        const sourceTargets = nearSource.concat(midSource).concat(source)


        const sinks = towerEnergy
        
        //if(tender.name === 'Hunter') console.log(tender.name + ' filtered sinks: ' + JSON.stringify(roomStatus.sinkables.filter(s => !controllerFilter(s)).filter(transferableFilter)))
        //drop
        //harvest - attack - build - repair - dismantle - attackController - rangedHeal - heal
        //claimController
        //suicide
        //move
        const currentNeedsMet = roomStatus.tenders.length > 1 || !roomStatus.controller || !roomStatus.controller.my
        



const allowSource = !tender.status('full')
        
        const atTower = nearSink.filter(s => s.structureType === STRUCTURE_TOWER && s.energy < 0.90 * s.energyCapacity).length > 0
        const runToTower = towerEnergy.length > 0 || tender.status('full')
        const still = (!runToTower || atTower)
        const approachSink = !still && !tender.status('emptyE') && sinks.length > 0
        const approachTower = runToTower && !approachSink
        const sourceOk = source.length > 0 && !still && !approachSink
        const approachSource = (towerEnergy.length === 0 || tender.status('emptyE')) && allowSource
        // ((roomStatus.tenders.length === 1 && tender.status('emptyE')) || (tender.status('emptyE') || (!tender.status('full') && tender.room.storage)) && (!bestChoiceForOutpost.length || (source.length > 0 && roomStatus.tenders.filter(t => t.status('empty')).length > 1 && needsMet)))
        //if(tender.name === 'Matthew') console.log(tender.name + ' nearSource ' + tender.room.name + ' ' + JSON.stringify(nearSource))
        
        const approachFocalPos = !still && !approachSink && !approachSource
    
        //if(tender.name === 'Caleb') console.log(tender.name + ' resources: ' + JSON.stringify(roomStatus.resources))
    
        
        //work
        //withdraw
            //if not full and there is an *energyContainer* within 1, withdraw
    
        //carry
        //pickup
            //if there is a resource on the ground within 1, pickup
        const pickupTargetsPermitted =  !tender.status('full')
        const pickupTargets = pickupTargetsPermitted ? roomStatus.pickup.filter(p => p.amount > 100 && !p.pos.nearExit()).sort((a, b) => a.pos.getRangeTo(tender.pos) - b.pos.getRangeTo(tender.pos)).map(c => action.pickup(c)) : [['none', undefined]]
        //transfer
            //if there is a structure that is not full within 1, transferEnergy
        
        const preferPickup = true
        const pickupTargetsPre = preferPickup && roomStatus.pickup.length > 0 ? roomStatus.pickup : []
        const pickupTargetsPost = !preferPickup && roomStatus.pickup.length > 0 ? roomStatus.pickup : []
        //const sourceTargets = allowSource ? pickupTargetsPre.concat(source).concat(pickupTargetsPost) : []
        const preferSink = !tender.status('empty')
        //creep
        //move
        //if(tender.name === 'Hunter') console.log(tender.name + ' ' + JSON.stringify(sourceTargets))
        const transferActionPermitted = tender.carry[RESOURCE_ENERGY] > 0
        const transferETargets = transferActionPermitted ? near1Sinks
            .filter(s => s.structureType === STRUCTURE_TOWER && s.energy < 0.90 * s.energyCapacity)
            .filter(s => s.status('transferable'))
            .filter(s => s.structureType !== STRUCTURE_CONTAINER || (!s.pos.nearSource(1) && s.room.energyAvailable >= s.room.energyCapacityAvailable))
            .filter((c, i) => i === 0)
            .map(c => action.transferEnergy(c)) : [['none', undefined]]

        
        const carryingResource = tender.status('emptyE') && !tender.status('empty')
        const nearStorageTargets = []
        const storageTransfer = []
        const transferTargets = towerEnergy.filter(t => t.pos.getRangeTo(tender) <= 1).map(action.transferEnergy)
        const targets = preferSink ? [].concat(pickupTargets).concat(sourceTargets) : pickupTargets.concat(sourceTargets)
        const sinkTarget = towerEnergy

        const bestChoicePickup = t => t[1] && t[1].pos && tender.nearestOfTypeToPos(t[1].pos)
        const worthTrip = r => (r[1].amount > tender.carryCapacity && tender.status('empty')) || r[1].amount < (tender.carryCapacity - _.sum(tender.carry)) || source.filter(s => s.structureType && s.structureType !== STRUCTURE_STORAGE).length === 0
        const pickupsAvail = pickupTargets.filter(bestChoicePickup).filter(worthTrip)
        const makePickup = pickupsAvail.length > 0
        
        const avoidingCreeps = tender.pos.findInRange(FIND_MY_CREEPS, 1, {filter: c => !c.type('towerTender')})
        const avoidingCreep = avoidingCreeps.length > 0
        const avoidanceSquares = tender.pos.walkableCoordsNearPos().filter(p => p.findInRange(FIND_MY_CREEPS, 1, {filter: c => !c.type('towerTender')})).length === 0
        

        const moveAction = avoidingCreep && avoidanceSquares.length ? action.position(avoidanceSquares[0]) :
                        makePickup ? [pickupsAvail[0][1]].map(action.approach)[0] :
                        approachSink ? [sinkTarget[0]].map(action.approach)[0] :
                        approachSource ? [source[0]].map(action.approach)[0] :
                        approachTower ? action.approach(roomStatus.towers[0]) :
                        ['none', undefined]

        const transferAction = (approachSink || still) && transferTargets.length ? transferTargets[0] : ['none', undefined]
        
        const pickupAction = pickupTargets.length ? pickupTargets[0] : ['none', undefined]
        
        const consideredWithdrawAction = source.filter(c => c.pos.getRangeTo(tender.pos) <= 1).map(action.withdrawResource(RESOURCE_ENERGY))[0]
        //const leaveToStorage = !pullFromStorage && approachStorage && consideredWithdrawAction && consideredWithdrawAction[1].id === tender.room.storage.id
        const withdrawAction = consideredWithdrawAction 


        const retVal = [moveAction, transferAction, pickupAction, withdrawAction]
        //if(tender.name === 'Bella') console.log(tender.name + ' ' + tender.room.name + ' avoidanceSquares ' + JSON.stringify(avoidanceSquares))
        //if(tender.name === 'Bella') console.log(tender.name + ' ' + tender.room.name + ' makePickup ' + JSON.stringify(makePickup))
        //if(tender.name === 'Bella') console.log(tender.name + ' ' + tender.room.name + ' approachSource ' + JSON.stringify(approachSource))
        //if(tender.name === 'Bella') console.log(tender.name + ' ' + tender.room.name + ' approachSink ' + JSON.stringify(approachSink))
        //if(tender.name === 'Bella') console.log(tender.name + ' ' + tender.room.name + ' approachTower ' + JSON.stringify(approachTower))
        
        return retVal



}}