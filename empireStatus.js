const armyComplete = strat => roomStatusAr => {
    const targetTypes = Object.keys(strat.attackSquad)
    const typeCheck = typeComplete(strat)(roomStatusAr)
    const targetsMet = targetTypes.map(t => typeCheck(t))
        .reduce((pv, cv) => pv && cv, true)
    return targetsMet
}

const typeComplete = strat => roomStatusAr => {
    const soldiers = roomStatusAr.map(rs => rs.soldiers).reduce((pv, cv) => pv.concat(cv), [])
    const targetTypes = squadType => squadType === 'defenseSquad' ? Object.keys(strat.defenseSquad) : 
                                    squadType === 'skSquad' ? Object.keys(strat.skSquad) : 
                                    squadType === 'homeSquad' ? Object.keys(strat.homeSquad) : 
                                    Object.keys(strat.attackSquad)

    return function (type, squadType = 'attackSquad', ttl = 0) {
        const soldiersOfLife = soldiers.filter(s => s.ticksToLive > ttl)
        const soldiersOfType = soldiersOfLife.filter(s => s.type(type))
        //console.log('empireStatus 18 soldiers fo Life ' + JSON.stringify(type) + ' ' + JSON.stringify(soldiersOfLife))
        //console.log('empireStatus 18 soldiers fo Type ' + JSON.stringify(type) + ' ' + JSON.stringify(soldiersOfType))
        //console.log('empireStatus 18 roomStatusAr.length ' + JSON.stringify(roomStatusAr.length))
        const targetCount = targetTypes(squadType).indexOf(type) > -1 ? strat[squadType][type] : 0
        const retVal = targetCount === 0 || soldiersOfType.length > targetCount
        //if(type === 'melee') console.log('empireStatus 18 soldiers strat ' + JSON.stringify(type) + ' ' + JSON.stringify(strat))
        //if(type === 'melee') console.log('empireStatus 18 soldiers targetTypes(squadType) ' + JSON.stringify(type) + ' ' + JSON.stringify(targetTypes(squadType)))
        //if(type === 'melee') console.log('empireStatus 18 soldiers soldiersOfType.length ' + JSON.stringify(type) + ' ' + JSON.stringify(soldiersOfType.length))
        //if(type === 'melee') console.log('empireStatus 18 soldiers squadType ' + JSON.stringify(type) + ' ' + JSON.stringify(squadType))
        //if(type === 'melee') console.log('empireStatus 18 soldiers targetCount ' + JSON.stringify(type) + ' ' + JSON.stringify(targetCount))
        //if(type === 'melee') console.log('empireStatus 18 soldiers typeComplete ' + JSON.stringify(type) + ' ' + JSON.stringify(retVal))
        //if(type === 'melee') console.log('empireStatus 18 soldiers fo Type ' + JSON.stringify(type) + ' ' + JSON.stringify(soldiersOfType))
        //if(type === 'melee') console.log('empireStatus 18 soldiers (0 + targetCount) ' + JSON.stringify(type) + ' ' + JSON.stringify((0 + targetCount)))
        
        //console.log('typeComplete ' + type + ' squadType '+ JSON.stringify(squadType) + ' ' + JSON.stringify(soldierTypeCounts))
        return retVal
    }



}
const roomsNeedTransport = roomStatus => {
    const safe = roomStatus.enemies.length === 0
    const notMine = !roomStatus.controller || !roomStatus.controller.my
    //const resourcesToGet = roomStatus.resources.filter(r => r.amount > 1000).length > 0
    const steadyIncome = roomStatus.containers.length
    const transPresent = roomStatus.superTransports.filter(t => !t.status('full')).length
    const transSufficient = transPresent >= steadyIncome
    const retVal = safe && notMine && !transSufficient
    //console.log('empireStatus 46 room needs transport steadyIncome' + roomStatus.name + ' ' + JSON.stringify(steadyIncome))
    //console.log('empireStatus 46 room needs transport transPresent' + roomStatus.name + ' ' + JSON.stringify(transPresent))
    //console.log('empireStatus 46 room needs transport ' + roomStatus.name + ' ' + JSON.stringify(retVal))
    return retVal
}
const roomsNeedWorkhorse = roomStatus => {
    const safe = roomStatus.enemies.length === 0
    const notMine = !roomStatus.controller || !roomStatus.controller.my
    const newColony = !notMine && roomStatus.room.energyCapacityAvailable < 550
    const resourcesToGet = roomStatus.resources.filter(r => r.amount > 1000).length > 0
    const steadyIncome = roomStatus.minerContainers.length > 0
    const workToDo = roomStatus.workRemaining > 200
    const workhorsePresent = roomStatus.workhorses.filter(c => c.ticksToLive > 100).length >= roomStatus.containers.length
    const retVal = (notMine || newColony) && safe && workToDo && !workhorsePresent && (resourcesToGet || steadyIncome || newColony)
    //console.log('empireStatus 61 room needs workhorse ' + roomStatus.name + ' ' + JSON.stringify(retVal))
    //console.log('empireStatus 62 room needs workhorse steadyIncome' + roomStatus.name + ' ' + JSON.stringify(steadyIncome))
    return retVal
}
const roomsNeedJumper = roomStatus => {
    const safe = roomStatus.enemies.length === 0
    const notMine = roomStatus.controller && !roomStatus.controller.my
    const successfulMine = roomStatus.superTransports.length > 0
    const ticksToRegen = roomStatus.harvestTargets.reduce((shortest, s) => s.ticksToRegeneration === undefined ? shortest : _.min([shortest, s.ticksToRegeneration]) , 300)
    const regenSoon = !ticksToRegen || ticksToRegen < 500
    const unattendedReservation = roomStatus.jumpers.length === 0 && roomStatus.miners.filter(m => m.pos.findInRange(FIND_SOURCES, 1).length > 0).length > 0
    const expiredReservation = roomStatus.controller && (!roomStatus.controller.reservation || roomStatus.controller.reservation.ticksToEnd < 500)
    const retVal = safe && notMine && regenSoon && unattendedReservation && expiredReservation
    return retVal
}
const roomsNeedDefMelee = roomStatus => {
    const retVal = roomStatus.enemyFreeCreeps.length > 0 && roomStatus.enemyFreeCreeps.length > (roomStatus.soldiers.length + roomStatus.towers.length)
    //console.log('empireStatus 79 enemyFreeCreeps ' + roomStatus.name + ' ' + JSON.stringify(roomStatus.enemyFreeCreeps))
    //console.log('empireStatus 79 enemyFreeCreeps.owner ' + roomStatus.name + ' ' + JSON.stringify(roomStatus.enemyFreeCreeps.map(c => c > c.owner)))
    
    return retVal
}
const colonistSpawnPermittedForRoomNames = roomStatusAr => {
    const colonistInProgress = Object.keys(Game.creeps).filter(k => Game.creeps[k].spawning && Game.creeps[k].type('colonist')).length > 0
    const colonistBuilt = colonistInProgress || _.flatten(roomStatusAr.map(rs => rs.colonists)).filter(x => x).length > 0
    if(colonistBuilt) return []
    const spawnRoomColonyFlags = _.flatten(roomStatusAr.filter(rs => rs.spawns.length).map(rs => rs.flags.filter(f => f.color === COLOR_YELLOW))).filter(x => x)
        .filter(f => f.color === COLOR_YELLOW)
    if(spawnRoomColonyFlags.length === 0) return []
    const flagRoomNames = _.uniq(spawnRoomColonyFlags.map(f => f.assocRoomName()))
    const visibleRoomNames = roomStatusAr.map(rs => rs.name)
    const unknownRoomNames = flagRoomNames.filter(n => visibleRoomNames.indexOf(n) < 0)
    const uncolonizedRoomNames = roomStatusAr.filter(rs => rs.controller && !rs.controller.my).map(rs => rs.name)
    const uncolonizedFlagRoomNames = flagRoomNames.filter(n => uncolonizedRoomNames.indexOf(n) > -1)
    return unknownRoomNames.concat(uncolonizedFlagRoomNames)
}
var memoRDS = {}
const roomDerivedSafe = roomStatusAr => roomName => {
    if(memoRDS[Game.cpu.tick] && memoRDS[Game.cpu.tick][roomName]) return memoRDS[Game.cpu.tick][roomName]
    if(!memoRDS[Game.cpu.tick]) memoRDS[Game.cpu.tick] = {}
    const roomStatus = roomStatusAr.filter(rs => rs.name === roomName)[0]
    const defined = roomStatus !== undefined
    const safe = defined && roomStatus.enemies.length === 0
    const containsScouts = defined && roomStatus.scouts.length > 0
    const remoteFlags = roomStatus ? roomStatus.flags.filter(f => f.color === COLOR_BLUE || f.color === COLOR_ORANGE || f.color === COLOR_PURPLE) : []
    const thisRoomSafe = safe && defined && containsScouts
    //console.log(roomName + ' thisRoomSafe ' + thisRoomSafe )
    memoRDS[Game.cpu.tick][roomName] = thisRoomSafe
    if(remoteFlags.length === 0 || !thisRoomSafe) return thisRoomSafe
    const remoteRoomsOk = remoteFlags.map(f => roomDerivedSafe(worldState)(f.assocRoomName())).reduce((p,c) => p && c, true)
    return remoteRoomsOk
}
const shipmentNeeded = roomStatus => {

    return resource => {
        const eligible = roomStatus.terminal !== undefined && roomStatus.storage !== undefined && roomStatus.controller !== undefined && roomStatus.controller.my
        if(!eligible) return false
    
        const storageAmount = roomStatus.storage.store[resource] ? roomStatus.storage.store[resource] : 0
        const terminalAmount = roomStatus.terminal.store[resource] ? roomStatus.terminal.store[resource] : 0
        const totalAmount = storageAmount + terminalAmount
        return totalAmount < 8000
    }
     
}
const roomsNeedingResource = roomStatusAr => _.memoize(resource => roomStatusAr.filter(s => shipmentNeeded(s)(resource)).map(s => s.name))

const imperialResourcesAvail = (roomStatusAr) => {
    const res = RESOURCES_ALL.filter()
    const retVal = res
    return retVal
}

module.exports = strat => roomStatusAr => { return {
    armyComplete: armyComplete(strat)(roomStatusAr),
    typeComplete: typeComplete(strat)(roomStatusAr),
    roomsNeedTransport: roomStatusAr.filter(x => x).filter(roomsNeedTransport).filter(x => x).map(x => x.name),
    roomsNeedWorkhorse: roomStatusAr.filter(x => x).filter(roomsNeedWorkhorse).filter(x => x).map(x => x.name),
    roomsNeedJumper: roomStatusAr.filter(x => x).filter(roomsNeedJumper).filter(x => x).map(x => x.name),
    roomsNeedDefMelee: roomStatusAr.filter(x => x).filter(roomsNeedDefMelee).filter(x => x).map(x => x.name),
    roomsNeedColonist: colonistSpawnPermittedForRoomNames(roomStatusAr).filter(x => x),
    roomDerivedSafe: roomDerivedSafe(roomStatusAr),
    shipmentNeeded: roomsNeedingResource(roomStatusAr)
}}