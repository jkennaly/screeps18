const actionMap = require('actionMap')
const sweetSpot = _.memoize((pos, room) => {
    const nearController = pos.nearController()
    const nearStorage = nearController && room.storage !== undefined && pos.getRangeTo(room.storage) === 1
    //const nearLink = nearStorage && pos.findInRange(FIND_MY_STRUCTURES, 1, {filter: s => s.structureType === STRUCTURE_LINK}).length > 0
    return nearStorage
})
const posMatch = (pos1, pos2) => pos1.x === pos2.x && pos1.y === pos2.y && pos1.roomName === pos2.roomName
module.exports = roomStatus => {
    const links = roomStatus.controllerLinks
    const storage = roomStatus.storage ? [roomStatus.storage] : roomStatus.controllerContainers.concat(roomStatus.sites.filter(s => s.structureType === STRUCTURE_CONTAINER).filter(s => s.pos.nearController(3)))
    const containers = storage.concat(roomStatus.controllerContainers.filter(c => !c.pos.nearSource(2)))
    const storageHasEnergy = storage.filter(s => s.store !== undefined).filter(s => s.store[RESOURCE_ENERGY] > 0).length > 0
    const controllerContainersHaveEnergy = containers.filter(c => !c.status('empty')).length > 0
    const controllerLinksHaveEnergy = links.filter(c => !c.status('empty')).length > 0
    const linksNotEmpty = links.filter(l => !l.status('empty'))
    const containerWithRoom = containers.filter(c => !c.status('full'))
    const fullContainers = containers.concat(storage).filter(c => c.status('full'))
    const upgradeCont = [roomStatus.controller]
    const favoredStoragePos = storage.length ? storage[0].pos : undefined

    const idealLinkPos = roomStatus.controllerLinks
        .map(l => l.pos)
        .map(p => p.walkableCoordsNearPos())
        .reduce((p, c) => p.concat(c), [])
        .filter(p => p.getRangeTo(roomStatus.storage) <= 1)
        .filter(p => p.getRangeTo(roomStatus.controller) <= 3)
        .filter(p => p.findInRange(FIND_MY_CREEPS, 0).length === 0)
    const controllerCritical = roomStatus.controller && roomStatus.controller.my && (roomStatus.controller.level < 2 || (roomStatus.controller.progress > roomStatus.controller.progressTotal || roomStatus.controller.ticksToDowngrade < CONTROLLER_DOWNGRADE[roomStatus.controller.level] * 0.9)) 
        
    return worker => {
        if(worker.pos === undefined) return

        const action = actionMap(worker.pos)
        const cpuCritical = Game.cpu.bucket < 9000
        const workerT0 = Game.cpu.getUsed()
        const gardenPoints = roomStatus.extensionGardens[roomStatus.name].concat(roomStatus.labGardens[roomStatus.name])
        
        const workerNeedsEnergy = !worker.status('full')
        const workerNearStorage = roomStatus.storage && roomStatus.storage.pos.getRangeTo(worker.pos) <= 1
        const workerT1 = Game.cpu.getUsed() - workerT0
        const atSweetSpot = [worker.pos]
            .filter(p => p.nearController())
            .filter(p => gardenPoints.filter(g => p.getRangeTo(g) > 2).length > 0)
            .filter(p => !roomStatus.storage || p.getRangeTo(roomStatus.storage) === 1)
            .filter(p => !roomStatus.controllerLinks.length || roomStatus.controllerLinks.filter(l => p.getRangeTo(l) <= 1).length > 0)
            .filter(p => roomStatus.storage || !roomStatus.controllerContainers.length || roomStatus.controllerContainers.filter(l => p.getRangeTo(l) <= 1).length > 0)
            .length > 0
        const still = atSweetSpot || !workerNeedsEnergy && (worker.pos.nearController() && workerNearStorage) || idealLinkPos.filter(p => posMatch(p, worker.pos)).length > 0
        const storageRaidNeeded = !still && workerNeedsEnergy && storageHasEnergy && !workerNearStorage && !controllerLinksHaveEnergy
        const storageRaid = workerNeedsEnergy && storageHasEnergy && workerNearStorage && !controllerLinksHaveEnergy
        //const workerSupplyFilter = s => worker.room.findMyStructures()
        const avoidingCreeps = worker.pos.findInRange(FIND_MY_CREEPS, 1, {filter: c => c.id !== worker.id}).length > 0 && !worker.status('empty')
        const avoidingCreep = !still && avoidingCreeps.length > 0
        const settlingStructures = worker.pos.findInRange(FIND_STRUCTURES, 0, {filter: s => (s.structureType === STRUCTURE_LINK || s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE) && s.pos.nearController()})
        const preferedAvoidance = avoidingCreeps ? worker.pos.walkableCoordsNearPos()
            .filter(c => c.nearController())
            .filter(c => c.nearStorage())
            //.filter(p => !p.hasCreepType()) 
            : []
        const avoidanceSquares = preferedAvoidance.length ? preferedAvoidance : worker.pos.walkableCoordsNearPos().filter(p => !p.hasCreepType()).sort((a, b) => a.getRangeTo(roomStatus.room.controller) - b.getRangeTo(roomStatus.room.controller))
        const linksOk = links.length === 0 || links.filter(l => l.pos.getRangeTo(worker.pos) <= 1).length > 0
        const settled = settlingStructures.length > 0 && worker.pos.nearController() && worker.pos.nearStorage() && !avoidingCreep && linksOk

        const farFromContr = !worker.pos.nearController(3)
        const farFromStor = !worker.pos.nearStorage(1)
        
        const workerT2 = Game.cpu.getUsed() - workerT1 - workerT0

        const containersWithEnergy = containers.filter(c => c.pos.getRangeTo(worker.pos) <= 1).filter(c => !c.status('emptyE')) 
        const preferredPos = !settled ? containers.concat(storage).concat(upgradeCont).map(c => c.pos.walkableCoordsNearPos()).reduce((pv, cv) => pv.concat(cv), []).sort((a, b) => a.getRangeTo(worker.pos) - b. getRangeTo(worker.pos)) : []
        const settlePos = preferredPos.length > 0 ? preferredPos : worker.pos.walkableCoordsNearPos()
        const repairStruc = !controllerCritical && !worker.status('emptyE') ? roomStatus.structuresNeedRepair.filter(s => s.pos.getRangeTo(worker.pos) <= 3) : []
        const buildOk = !controllerCritical && !worker.status('emptyE') && repairStruc.length === 0
        const buildStruc = buildOk ? roomStatus.sites.filter(s => s.pos.getRangeTo(worker.pos) <= 3) : []
        
        const nearController = !worker.status('emptyE') && upgradeCont.filter(s => s.pos.getRangeTo(worker.pos) <= 3).length > 0

        const transportNearController = upgradeCont[0].room.findMyCreeps({filter: c => c.type('transport') && c.pos.getRangeTo(worker.pos) <= 3 && c.pos.getRangeTo(upgradeCont[0]) <= 3})
        const transportSources = transportNearController.filter(c => c.carry[RESOURCE_ENERGY] > worker.carryCapacity)
        const suckTransport = transportSources.length > 0 && !worker.status('full')

        const suckLink = linksNotEmpty.length && !worker.status('full')
        const closeLink = linksNotEmpty.filter(l => l.pos.getRangeTo(worker.pos) <= 1).length > 0
        const lonelyLink = !closeLink && linksNotEmpty.filter(l => l.pos.findInRange(FIND_MY_CREEPS, 1, {filter: c => c.type('staticWorker') && c.name !== worker.name}).length === 0).length > 0
        const fillContainer = linksNotEmpty.length > 0 && storage.length > 0 && worker.fatigue === 0

        const currentPosRoads = worker.pos.lookFor(LOOK_STRUCTURES).filter(s => s.structureType === STRUCTURE_ROAD)
        //const buildRoad = currentPosRoads.length === 0 ? worker.pos.createConstructionSite(STRUCTURE_ROAD) : OK
        
        const workerT3 = Game.cpu.getUsed() - workerT1 - workerT0 - workerT2
        const lneDistance = linksNotEmpty.map(l => l.pos.getRangeTo(worker))

        //moveAction
        const moveActionInitial = avoidingCreeps ? [avoidanceSquares[0]].map(action.approach)[0] :
                            idealLinkPos.length && !atSweetSpot ? idealLinkPos.map(action.approach)[0] :
                            !settled && farFromContr ? upgradeCont.map(action.approach)[0] :
                            still ? ['none', undefined] :
                            linksNotEmpty.length && lonelyLink ? linksNotEmpty.map(action.approach)[0] :
                            storageRaidNeeded ? action.approach(favoredStoragePos) :
                            //!settled && farFromStor && (!worker.status('empty' || !suckTransport)) ? storage[0].pos.walkableCoordsNearPos().filter(p => !p.nearCreeps(0)).filter(p => p.getRangeTo(roomStatus.controller) <= 3).concat([storage[0].pos]).map(action.approach)[0] :
                            ['none', undefined]

        const moveAction = worker.fatigue > 0 ? ['none', undefined] : moveActionInitial

        const workAction = repairStruc.length ? repairStruc.map(action.repair)[0] :
                            buildStruc.length ? buildStruc.map(action.build)[0] :
                            nearController ? upgradeCont.map(action.controller)[0] :
                            ['none', undefined]

        const towers = roomStatus.tenders.length ? roomStatus.towers.filter(t => t.energy < 0.96 * t.energyCapacity).filter(t => t.pos.getRangeTo(worker.pos) <= 1) : []
        const linkFull = suckLink && linksNotEmpty.filter(l => l.energy > worker.carryCapacity).length > 0

        const transferTargets = storage

        //const transferAction = fillContainer && storage.length > 0 || towers.length ? transferTargets.map(action.transferEnergy)[0] : ['none', undefined]
        const transferAction = transferTargets.length && linksNotEmpty.length && closeLink ? action.transferEnergy(transferTargets[0], worker.carry[RESOURCE_ENERGY] - 2 * worker.body.filter(b => b.type === WORK).length) : ['none', undefined]
        const withdrawAction = suckLink & closeLink ? linksNotEmpty.map(action.withdrawEnergy)[0] :
                            storageRaid ? storage.map(action.withdrawEnergy)[0] :
                            containersWithEnergy.length ? containersWithEnergy.map(action.withdrawEnergy)[0] :
                            ['none', undefined]

        if(workerT1 + workerT2 + workerT3 > 10 ) console.log(worker.name + ' t1 ' + workerT1+ ' t2 ' + workerT2+ ' t3 ' + workerT3)
        const retVal = [moveAction, workAction, transferAction, withdrawAction]
        //if(worker.name === 'Anthony') console.log(worker.name + ' linkFull ' + JSON.stringify(linkFull))
        //if(worker.name === 'Anthony') console.log(worker.name + ' closeLink ' + JSON.stringify(closeLink))
        //if(worker.name === 'Anthony') console.log(worker.name + ' transferTargets ' + JSON.stringify(transferTargets))
        //if(worker.name === 'Anthony') console.log(worker.name + ' avoidingCreep ' + JSON.stringify(avoidingCreep))
        //if(worker.name === 'Anthony') console.log(worker.name + ' avoidingCreeps ' + JSON.stringify(avoidingCreeps))
        //if(worker.name === 'Anthony') console.log(worker.name + ' avoidanceSquares ' + JSON.stringify(avoidanceSquares))
        //if(worker.name === 'Anthony') console.log(worker.name + ' idealLinkPos ' + JSON.stringify(idealLinkPos))
        //if(worker.name === 'Anthony') console.log(worker.name + ' lonelyLink ' + JSON.stringify(lonelyLink))
        //if(worker.name === 'Anthony') console.log(worker.name + ' storageRaidNeeded ' + JSON.stringify(storageRaidNeeded))
        //if(worker.name === 'Anthony') console.log(worker.name + ' linksNotEmpty.length && lonelyLink ' + JSON.stringify(linksNotEmpty.length && lonelyLink))
        //if(worker.name === 'Anthony') console.log(worker.name + ' moveAction ' + JSON.stringify(moveAction))
        //if(worker.name === 'Anthony') console.log(worker.name + ' still ' + JSON.stringify(still))
        //if(worker.name === 'Anthony') console.log(worker.name + ' atSweetSpot ' + JSON.stringify(atSweetSpot))
        //if(worker.name === 'Anthony') console.log(worker.name + ' !settled && farFromStor && (!worker.status(empty || !suckTransport))  ' + JSON.stringify(!settled && farFromStor && (!worker.status('empty' || !suckTransport)) ))
        

        return retVal
}}