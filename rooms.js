const funcs = require('funcs')
//const roomRoads = require('roomRoads')
const roomWalls = require('roomWalls')

if(Memory.extensionGardens === undefined) Memory.extensionGardens = {}
if(Memory.labGardens === undefined) Memory.labGardens = {}
const extensionGardens = Memory.extensionGardens
const labGardens = Memory.labGardens
var gardenObject = {
    extension: extensionGardens,
    lab: labGardens
}
const getRoomSpawnCount = room => room.find(FIND_MY_SPAWNS).length
    //pure
const getRoomSourceCount = room => room.find(FIND_SOURCES).length
    //pure
const getAttackFlags = room => room.find(FIND_FLAGS, { filter: { color: COLOR_RED } })
    //pure
const getOutpostFlags = room => room.find(FIND_FLAGS, { filter: { color: COLOR_BLUE } })
    //pure
const getColonyFlags = room => room.find(FIND_FLAGS, { filter: { color: COLOR_ORANGE } })
    //pure
const getwildcatFlags = room => room.find(FIND_FLAGS, { filter: { color: COLOR_YELLOW } })
    //pure
const getRoomStructureCount = room => structureType => room.find(FIND_MY_STRUCTURES, { filter: { structureType: structureType } }).length + room.find(FIND_MY_CONSTRUCTION_SITES, { filter: { structureType: structureType } }).length
    //pure
const DIRECTION_FLAG_COLOR = [COLOR_BLUE, COLOR_GREEN, COLOR_PURPLE, COLOR_ORANGE]
    //impure-issues commands to the game
const siteStructure = (room, structureType, opts = {basePos: room.controller.pos}) => {
    //console.log(room.name)
    console.log(structureType)
    console.log(JSON.stringify(opts))
    return funcs.buildNear(structureType, opts)
}
const siteFlag = (pos, opts) => funcs.plantNear(opts, pos)
const freePosFilter = {filter: c => c.pos.lookFor(LOOK_CONSTRUCTION_SITES).length === 0 && c.pos.lookFor(LOOK_STRUCTURES).length === 0}
const noNearHostilesFilter = {filter: p => funcs.nearHostiles(5)(p.pos).length === 0}


const opts = (room, strat) =>{ return room && attackNeighbors().length ? { color: COLOR_RED, secondaryColor: attackNeighbors()[0][0] } : {}}
const exitDir = (room, strat) => room ? room.findExitTo(attackNeighbors()[0][1]) : ERR_INVALID_ARGS
            //console.log('exitDir: ' + JSON.stringify(exitDir))
const exit = (room, strat) => room.controller.pos.findClosestByRange(exitDir())
const attackNeighbors = (room, strat) => room ? room.neighbors().filter(x => x).map((x, i) => [DIRECTION_FLAG_COLOR[i], x]).filter(x => strat.attack.indexOf(x[1]) > -1) : []
const outpostNeighbors = (room, strat) => room.neighbors().map((x, i) => [DIRECTION_FLAG_COLOR[i], x]).filter(x => strat.outpost.indexOf(x[1]) > -1)
const outpostOpts = (room, strat) =>{ return { color: COLOR_BLUE, secondaryColor: outpostNeighbors(room, strat)[0][0] }}
const outpostExitDir = (room, strat) => room.findExitTo(outpostNeighbors(room, strat)[0][1])
const outpostExit = (room, strat) => room.controller.pos.findClosestByRange(outpostExitDir(room, strat))
const colonyNeighbors = (room, strat) => room.neighbors().map((x, i) => [DIRECTION_FLAG_COLOR[i], x]).filter(x => strat.colony.indexOf(x[1]) > -1)
const colonyOpts = (room, strat) =>{ return { color: COLOR_ORANGE, secondaryColor: colonyNeighbors(room, strat)[0][0] }}
const colonyExitDir = (room, strat) => room.findExitTo(colonyNeighbors(room, strat)[0][1])
const colonyExit = (room, strat) => room.controller.pos.findClosestByRange(colonyExitDir(room, strat))
const wildcatNeighbors = (room, strat) => room.neighbors().map((x, i) => [DIRECTION_FLAG_COLOR[i], x]).filter(x => strat.wildcat.indexOf(x[1]) > -1)
const wildcatOpts = (room, strat) =>{ return { color: COLOR_YELLOW, secondaryColor: wildcatNeighbors(room, strat)[0][0] }}
const wildcatExitDir = (room, strat) => room.findExitTo(wildcatNeighbors(room, strat)[0][1])
const wildcatExit = (room, strat) => room.controller.pos.findClosestByRange(wildcatExitDir(room, strat))
const contFil = s => s.structureType === STRUCTURE_CONTAINER
const strucFil = m => m.pos.findInRange(FIND_STRUCTURES, 0, {filter: contFil}).length > 0
const siteFil = m => m.pos.findInRange(FIND_CONSTRUCTION_SITES, 0, {filter: contFil}).length > 0
const minerFilter = m => siteFil(m) || strucFil(m)
const noSpawnFilter = obj => obj.pos.findInRange(FIND_MY_STRUCTURES, 3, {filter: s => s.structureType === STRUCTURE_SPAWN}).length === 0
const walkabilityFilter = pos => pos.walkable() && pos.walkableCoordsNearPos().length >= 6
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}      

const controllerContainerPosPickList = (room, roomStatus) => {
    const possiblePosPicks = {}
    if (!room.controller || !room.controller.my) return []
    //walkables 1 out from controller
    const opts = {ignoreCreeps: true}
    const cont1 = room.controller.pos.walkableCoordsNearPos(opts)
    const cont2 = cont1.map(p => p.walkableCoordsNearPos(opts)).reduce((p, c) => p.concat(c), [])

    const cont2r1 = cont2.filter(p => p.findInRange(FIND_STRUCTURES, 1, {filter: s => s.structureType === STRUCTURE_ROAD}).length > 0)

    const cont2r1s0 = cont2r1
        .filter(p => p.findInRange(FIND_MY_STRUCTURES, 1, {filter: s => s.structureType !== STRUCTURE_RAMPART}).length === 0)
        .filter(p => roomStatus === undefined || roomStatus.controllerContainers.filter(c => c.pos.getRangeTo(p) <= 1).length === 0)

    const retVal = (cont2r1s0.length > 0 ? cont2r1s0 :
                        cont2r1.length > 0 ? cont2r1 :
                        cont2.length > 0 ? cont2 :
                        cont1).sort((a, b) => b.walkableCoordsNearPos().length - a.walkableCoordsNearPos().length)
    //if(room.name === 'W4S73') console.log('rooms 174 cont2r1s0 ' + JSON.stringify(cont2r1s0))

    return retVal
}
const r5PosPickList = (room, roomStatus) => {
    const possiblePosPicks = {}
    if (!room.controller || !room.controller.my) return []
    //walkables 1 out from controller
    const opts = {ignoreCreeps: true}
    const cont1 = room.controller.pos.walkableCoordsNearPos(opts)
    const cont2 = cont1.map(p => p.walkableCoordsNearPos(opts)).reduce((p, c) => p.concat(c), [])
    const cont3 = cont2.map(p => p.walkableCoordsNearPos(opts)).reduce((p, c) => p.concat(c), [])
    const cont4 = cont3.map(p => p.walkableCoordsNearPos(opts)).reduce((p, c) => p.concat(c), [])
    const cont5 = cont4.map(p => p.walkableCoordsNearPos(opts)).reduce((p, c) => p.concat(c), [])

    const cont5r1 = cont5.filter(p => p.findInRange(FIND_STRUCTURES, 1, {filter: s => s.structureType === STRUCTURE_ROAD}).length > 0)

    const cont5r1s0 = cont5r1
        .filter(p => p.findInRange(FIND_MY_STRUCTURES, 1, {filter: s => s.structureType !== STRUCTURE_RAMPART}).length === 0)
        .filter(p => roomStatus === undefined || roomStatus.controllerContainers.filter(c => c.pos.getRangeTo(p) <= 1).length === 0)

    const retVal = cont5r1s0.length > 0 ? cont5r1s0 :
                    cont5r1.length > 0 ? cont5r1 :
                    cont5.length > 0 ? cont5 :
                    cont4.length > 0 ? cont4 :
                    cont3.length > 0 ? cont3 :
                    cont2.length > 0 ? cont2 :
                    cont1
    //if(room.name === 'W4S73') console.log('rooms 174 cont2r1s0 ' + JSON.stringify(cont2r1s0))

    return retVal
}
const offEdgeFilter = p => p.x >= 2 && p.y >= 2 && p.x <= 47 && p.y <= 47

const rPosPickList = (centerPos, r = 2, startArray = [], startTime = Game.cpu.getUsed(), filterFunction = p => true) => {
    //baseCase: r === 0, filterStartArray and return filteredArray
    if(r === 0) return startArray.filter(offEdgeFilter).filter(filterFunction)
    if(Game.cpu.getUsed() - startTime > 0.1) return []
    //filter startArray to only get poss at right distance
    const initArray = startArray.length ? startArray.filter(offEdgeFilter) : centerPos.walkableCoordsNearPos()
    const workingR = startArray.length ? r : r - 1
    //console.log('rooms 111 workingR ' + JSON.stringify(workingR) + ' startArray ' + JSON.stringify(startArray) + ' r ' + JSON.stringify(r))
    if(workingR === 0) return initArray.filter(offEdgeFilter).filter(filterFunction)
    const currentDistance = _.max(initArray.map(p => p.getRangeTo(centerPos)))
    const workingArray = initArray.filter(offEdgeFilter).filter(p => p.getRangeTo(centerPos) === currentDistance)
    if(workingArray.length === 0) return []
    //expand array by 1, filter for uniform range, and recurse
    expandedArray = workingArray.map(p => p.walkableCoordsNearPos())
        .reduce((p, c) => p.concat(c), [])
        .filter(offEdgeFilter)
        .filter(p => p.getRangeTo(centerPos) === (currentDistance + 1))
    if(expandedArray.length === 0) return []
    return rPosPickList(centerPos, workingR - 1, expandedArray, startTime, filterFunction)
}
const coordsValidFilter = coordPair => coordPair[0] >= 0 && coordPair[1] >= 0 && coordPair[0] <= 49 && coordPair[1] <= 49
const rCoords = r => centerPos => {
    const ar0_49 = _.range(50)
    const xCy = ar0_49.filter(c => c >= (centerPos.y - r) && c <= (centerPos.y + r))
    const yCx = ar0_49.filter(c => c >= (centerPos.x - r) && c <= (centerPos.x + r))
    const xC = _.flatten(xCy.map(coord => [[centerPos.x - r, coord], [centerPos.x + r, coord]]))
        .filter(coordsValidFilter)
    const yC = _.flatten(yCx.map(coord => [[coord, centerPos.y - r], [coord, centerPos.y + r]]))
        .filter(coordsValidFilter)
    const retVal = xC.concat(yC)
    return retVal
}
const basePointOK = room => seedPos => {
    const clearOfMyStruc = seedPos.findInRange(FIND_MY_STRUCTURES, 1).length === 0
    const myStructOk = clearOfMyStruc
    const clearOfRoads = seedPos.findInRange(FIND_STRUCTURES, 1).length === 0
    const roadsOk = true
    const clearOfWalls = room
        .lookForAtArea(LOOK_TERRAIN, seedPos.y - 1, seedPos.x - 1, seedPos.y + 1, seedPos.x + 1, true)
        
   // console.log('rooms 160 ' + room.name + ' clearOfWalls ' + JSON.stringify(clearOfWalls))
    const terrainOk = clearOfWalls.filter(t => t.terrain === 'wall')
        .length === 0
    const edgeOk = seedPos.x > 4 && seedPos.y > 4 && seedPos.x < 45 && seedPos.y < 45
    const roomToMove = rCoords(2)(seedPos).map(c => room.getPositionAt(c[0], c[1])).filter(p => p.walkable()).length >= 15
    const farFromSource = !seedPos.nearSource(4)
    return myStructOk && roadsOk && terrainOk && edgeOk && roomToMove && farFromSource
}
const fillGarden = (basePos, connectorPos, room, strucType) => {
    if(basePos === undefined || connectorPos === undefined) return

    const connectorRoadNeeded = connectorPos.findInRange(FIND_STRUCTURES, 0).length === 0
    const baseRoadNeeded = basePos.findInRange(FIND_STRUCTURES, 0).length === 0
    const cRoad = connectorRoadNeeded ? connectorPos.createConstructionSite(STRUCTURE_ROAD) : 0
    const bRoad = baseRoadNeeded ? basePos.createConstructionSite(STRUCTURE_ROAD) : 0
    const extParams = rCoords(1)(basePos).filter(p => p[0] != connectorPos.x || p[1] != connectorPos.y).map(x => [x[0],x[1], strucType])
    //console.log('rooms 174 extParams ' + JSON.stringify(extParams) )
    const gExt = extParams.map(p => room.createConstructionSite.apply(room, p))
    return gExt

}            
const findBase = (spawns, room) => (r = 4) => {
    const baseAtR = _.flatten(spawns.map(s => s.pos).map(rCoords(r)))
        .map(c => room.getPositionAt.apply(room, c))
        .filter(basePointOK(room))
    if(baseAtR.length > 0) return baseAtR
    if(r > 45) return []
    return findBase(spawns, room)(r + 4)
}
const extGarden = (room, structType, baseStrucArr) => {
    const getRoomCount = getRoomStructureCount(room)
    let extensionGardens = gardenObject[structType]
    const gardensDefined = extensionGardens[room.name] !== undefined
    if(!gardensDefined) extensionGardens[room.name] = []
    const currentGardens = extensionGardens[room.name]
/*
    const roomyGardenFilter = g => {
        const centerPos = room.getPositionAt(g.x, g.y)
        const ext7 = centerPos
    }
*/
    const unfilledGardens = currentGardens
        .filter(g => rCoords(2)(room.getPositionAt(g.x, g.y)).map(c => room.getPositionAt(c[0], c[1])).filter(p => p.walkable()).length >= 16)
        .filter(g => room.getPositionAt(g.x, g.y).findInRange(FIND_MY_STRUCTURES, 1, {filter: s => s.structureType === structType}).length < 7)
    const newGardenNeeded = unfilledGardens.length === 0
    //console.log('rooms 215 ' + room.name + ' newGardenNeeded ' + JSON.stringify(newGardenNeeded))
    //console.log('rooms 215 ' + room.name + ' unfilledGardens ' + JSON.stringify(unfilledGardens))
    //console.log('rooms 215 ' + room.name + ' currentGardens ' + JSON.stringify(currentGardens))
    
    const firstGarden = currentGardens.length === 0 && newGardenNeeded
    //console.log(structType + ' rooms 224 room ' + room.name)
    //console.log(newGardenNeeded + ' rooms 224 room ' + room.name)
    //console.log(' rooms 224 room ' + room.name + ' findBase ' + JSON.stringify(findBase(baseStrucArr, room)()))
    const potentialFirstBasePos = (!newGardenNeeded ? unfilledGardens : findBase(baseStrucArr, room)())
        .filter(g => rCoords(2)(room.getPositionAt(g.x, g.y)).map(c => room.getPositionAt(c[0], c[1])).filter(p => p.walkable()).length >= 16)
    const okFirstBasePos = newGardenNeeded ? potentialFirstBasePos : potentialFirstBasePos
        .map(p => room.getPositionAt(p.x, p.y))
        .filter(p => {
            const walkables = p.walkableCoordsNearPos()
            const empties = walkables.filter(p => p.findInRange(FIND_MY_STRUCTURES, 0).length === 0)
            const posOk = empties.length > 0
            return posOk
        })
    //console.log('rooms 215 ' + room.name + ' potentialFirstBasePos ' + JSON.stringify(potentialFirstBasePos))
    //console.log('rooms 215 ' + room.name + ' okFirstBasePos ' + JSON.stringify(okFirstBasePos))
    //console.log('rooms 215 ' + room.name + ' newGardenNeeded ' + JSON.stringify(newGardenNeeded))
    //console.log('rooms 215 ' + room.name + ' extensionsNeeded ' + JSON.stringify(extensionsNeeded))
    //console.log('rooms 215 ' + room.name + ' unfilledGardens ' + JSON.stringify(unfilledGardens))
    
    const newGardenBasePos = okFirstBasePos.length ? (okFirstBasePos[0].look === undefined ? room.getPositionAt(okFirstBasePos[0].x, okFirstBasePos[0].y) : okFirstBasePos[0]) : undefined
    //console.log('rooms 226 ' + room.name + ' newGardenBasePos ' + JSON.stringify(newGardenBasePos))
    const potentialConnectorPos = !newGardenBasePos ? [] : rCoords(1)(newGardenBasePos).map(c => room.getPositionAt.apply(room, c))
    //console.log('rooms 215 ' + room.name + ' potentialConnectorPos ' + JSON.stringify(potentialConnectorPos))
    
    const newGardenConnector = potentialConnectorPos.sort((a, b) => a.getRangeTo(room.controller) - b.getRangeTo(room.controller))[0]
    ////console.log('rooms 230 ' + room.name + ' newGardenConnector ' + JSON.stringify(newGardenConnector))
    const newGardenReady = newGardenBasePos && newGardenBasePos.roomName.length > 2 && newGardenConnector.roomName.length > 2
    //console.log('rooms 215 ' + room.name + ' newGardenReady ' + JSON.stringify(newGardenReady))
    
    //console.log('Rooms 279: ')
    //console.log(JSON.stringify(potentialFirstBasePos[0].look))
    //console.log(JSON.stringify(newGardenBasePos))
    //if(room.name === 'E33S36') console.log('rooms 291 newGardenNeeded ' + JSON.stringify(newGardenNeeded))
    //if(room.name === 'E33S36') console.log('rooms 291 potentialFirstBasePos ' + JSON.stringify(potentialFirstBasePos))
    //if(room.name === 'E33S36') console.log('rooms 291 okFirstBasePos ' + JSON.stringify(okFirstBasePos))
    //if(room.name === 'E33S36') console.log('rooms 291 newGardenReady ' + JSON.stringify(newGardenReady))
    //if(room.name === 'E33S35') console.log('rooms 292 newGardenBasePos ' + JSON.stringify(newGardenBasePos))
    //if(room.name === 'E33S35') console.log('rooms 292 structType ' + JSON.stringify(structType))

    const buildGarden = newGardenReady ? fillGarden(newGardenBasePos, newGardenConnector, room, structType) : []
    //console.log('rooms 215 ' + room.name + ' buildGarden ' + JSON.stringify(buildGarden))
    if(buildGarden.filter(b => b === 0).length) {
        extensionGardens[room.name][extensionGardens[room.name].length] = newGardenBasePos
        if(structType === STRUCTURE_EXTENSION) Memory.extensionGardens[room.name] = extensionGardens[room.name]
        if(structType === STRUCTURE_LAB) Memory.labGardens[room.name] = extensionGardens[room.name]
        
    }
}
const expansion = strat => (roomStatus, room) => {
    const t0 = Game.cpu.getUsed()
    //console.log('rooms 191 ' + room.name + ' time used t0' + JSON.stringify(t0))
    if (room.controller && room.controller.my) {
        //const testPos = room.getPositionAt(10, 10)
        //console.log(JSON.stringify(testPos.walkableCoordsNearPos()))
        const getRoomCount = getRoomStructureCount(room)
            //add a spawn point if neede, centered on the source with the most creeps within 3
        //const spawnBase = room.find(FIND_FLAGS, {filter: {color: COLOR_BLUE}}).concat(room.controller.pos.findClosestByRange(FIND_SOURCES))[0].pos
        //console.log(JSON.stringify(spawnBase))

        //const extBase = shuffle([].concat(roomStatus.extensions).concat(roomStatus.harvestTargets))[0].pos
        //console.log(JSON.stringify(extBase))
        //if (!getRoomSpawnCount(room)) siteStructure(room, STRUCTURE_SPAWN, {basePos: spawnBase})
            //target any square a creep is on for road construction
            /*
        if(room.controller.level > 1 && !room.find(FIND_MY_CONSTRUCTION_SITES).length) {
            const potentialRoadPos = room.find(FIND_MY_CREEPS, {filter: c => {
                //console.log(JSON.stringify(c.pos.findInRange(FIND_STRUCTURES, 1)))
                return c.room.energyAvailable > 0.9 * c.room.energyAvailableCapacity && (c.pos.walkableCoordsNearPos().length > 1 && (c.pos.findInRange(FIND_STRUCTURES, 1, {filter: {structureType: STRUCTURE_ROAD}}).length === 1 && c.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {filter: {structureType: STRUCTURE_ROAD}}).length === 0 || Game.map.getTerrainAt(c.pos) === 'swamp' || c.pos.findInRange(FIND_MY_STRUCTURES, 1).length || c.pos.findInRange(FIND_SOURCES, 1).length))
            }}).map(x => x.pos)
            .map(pos => pos.createConstructionSite(STRUCTURE_ROAD))
        }
        */

        const storageNeeded = getRoomCount(STRUCTURE_STORAGE) < CONTROLLER_STRUCTURES[STRUCTURE_STORAGE][room.controller.level]
        const terminalNeeded = getRoomCount(STRUCTURE_TERMINAL) < CONTROLLER_STRUCTURES[STRUCTURE_TERMINAL][room.controller.level] && room.storage
        const transportsPresent = roomStatus.transports.length > 0
        const transFullAtCont = roomStatus.transports.filter(t => t.status('full')).filter(t => t.pos.nearController())
        const controllerContainerNeeded = room.controller.level > 1 && room.controller.level < 4 && roomStatus.controllerContainers.length < 1 && roomStatus.sites.length < 1
        const controllerLinkPresent = roomStatus.controllerLinks.length > 0 || roomStatus.sites.filter(s => s.structureType === STRUCTURE_LINK).length > 0
        const controllerLinkNeeded = !controllerLinkPresent && getRoomCount(STRUCTURE_LINK) < CONTROLLER_STRUCTURES[STRUCTURE_LINK][room.controller.level] && roomStatus.storage !== undefined && roomStatus.sites.filter(s => s.structureType === STRUCTURE_LINK).length === 0
        const minerLinksNeeded = controllerLinkPresent && roomStatus.containers.length > roomStatus.dropoffLinks.length && getRoomCount(STRUCTURE_LINK) < CONTROLLER_STRUCTURES[STRUCTURE_LINK][room.controller.level]
        const missingLink = c => c.pos.findInRange(FIND_MY_STRUCTURES, 1, {filter: s => s.structureType === STRUCTURE_LINK}).length === 0 && c.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 1, {filter: s => s.structureType === STRUCTURE_LINK}).length === 0
        const minerContainersWithoutLinks = minerLinksNeeded ? roomStatus.containers.filter(missingLink).sort((a, b) => b.pos.getRangeTo(roomStatus.controller) - a.pos.getRangeTo(roomStatus.controller)) : []
        //console.log(room.name + ' allows for ' + JSON.stringify(roadsPotential) + ' more roads')
            //console.log(room.name + ' allows for ' + getRoomMaxTowers(room) + ' Towers and has: ' + getRoomTowerCount(room))

        //if(room.name === 'E33S35') console.log('rooms 176 controllerLinkNeeded ' + JSON.stringify(controllerLinkNeeded))

        const wildcatRoom = room.controller && room.controller.my && room.energyCapacityAvailable < 550
        //console.log(room.name + ' wildcatRoom ' + JSON.stringify(wildcatRoom))
         

        const buildSpawn = getRoomCount(STRUCTURE_SPAWN) < CONTROLLER_STRUCTURES[STRUCTURE_SPAWN][room.controller.level] && (room.controller.level > 3 || wildcatRoom)
        //console.log(room.name + ' buildSpawn ' + JSON.stringify(buildSpawn))

        const extensionsPresent = getRoomCount(STRUCTURE_EXTENSION) > 0

        const labsNeeded = getRoomCount(STRUCTURE_LAB) < CONTROLLER_STRUCTURES[STRUCTURE_LAB][room.controller.level] && roomStatus.terminal
        if(labsNeeded && (!roomStatus.sites.length || room.controller.level <= 2)) {
            const retVal = extGarden(room, STRUCTURE_LAB, [roomStatus.terminal])
            roomStatus.reloadGardens()
        }
        
        const extensionsNeeded = getRoomCount(STRUCTURE_EXTENSION) < CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][room.controller.level] && roomStatus.spawns.length >= 1
        
        if(extensionsNeeded && (!roomStatus.sites.length || room.controller.level <= 2)) {
            const retVal = extGarden(room, STRUCTURE_EXTENSION, roomStatus.spawns)
            roomStatus.reloadGardens()
        }
        const t1 = Game.cpu.getUsed()
        //console.log('rooms 191 ' + room.name + ' time used extensions needed' + JSON.stringify(t1 - t0))
        //console.log('rooms 230 ' + room.name + ' buildSpawn ' + JSON.stringify(buildSpawn))
        //if eextensionsNeeded) siteStructure(room, STRUCTURE_EXTENSION, {basePos: extBase, nearStructure: STRUCTURE_ROAD})

        const spawnPos =  buildSpawn ? _.flatten(roomStatus.miners
                    .filter(minerFilter)
                    .filter(noSpawnFilter)
                    .map(m => rCoords(3)(m.pos))
                    .filter(x => x && x.length))
                    .filter(x => x && x.length)
                    .map(x => {
                        //console.log('rooms 285 ' + JSON.stringify(x))
                        return x
                    })
                    .map(x => room.getPositionAt.apply(room, x))
                    .filter(walkabilityFilter) : []
        const buildTower = getRoomCount(STRUCTURE_TOWER) < CONTROLLER_STRUCTURES[STRUCTURE_TOWER][room.controller.level]
        const strucCountInRange = (r, s) => (a, b) => (_.memoize(str => {
            return a.pos.findInRange(FIND_STRUCTURES, r, {filter: ['structureType', s]})
        })('' + a.id + b.id))
        const towerPos = buildTower ? _.flatten(roomStatus.spawns.sort(strucCountInRange(3, STRUCTURE_TOWER)).map(s => s.pos.walkableCoordsNearPos())) : []
        if (spawnPos.length) spawnPos[0].createConstructionSite(STRUCTURE_SPAWN)
        if (towerPos.length) towerPos[0].createConstructionSite(STRUCTURE_TOWER)
        if (getRoomCount(STRUCTURE_EXTRACTOR) < CONTROLLER_STRUCTURES[STRUCTURE_EXTRACTOR][room.controller.level]) room.findMinerals()[0].pos.createConstructionSite(STRUCTURE_EXTRACTOR)
        //if (getRoomCount(STRUCTURE_LINK) < CONTROLLER_STRUCTURES[STRUCTURE_LINK][room.controller.level] && !controllerLinkPresent) siteStructure(room, STRUCTURE_LINK, {basePos: room.storage.pos, nearStructure: STRUCTURE_STORAGE})
        //if ((getRoomCount(STRUCTURE_CONTAINER) < CONTROLLER_STRUCTURES[STRUCTURE_CONTAINER][room.controller.level]) && controllerContainerNeeded ) siteStructure(room, STRUCTURE_CONTAINER, {basePos: room.controller.pos, nearStructure: STRUCTURE_ROAD})

/*
        //storage shpuld be between 2-5 away from controller
        //controllerContainer pos should be within 3 of controller and within 2 of controller and walkable and not within 1 of either
        const findWalkableInInfluence => room => (pos, r, i) => {
            const possibleCoords = _.range(50)
            const axes = ['x', 'y']
            const t1 = axis => (pos, r, i) => xt => xt <= pos[axis] + r
            const t2 = axis => (pos, r, i) => xt => xt >= pos[axis] - r
            const t3 = axis => (pos, r, i) => xt => xt > pos[axis] + i
            const t4 = axis => (pos, r, i) => xt => xt < pos[axis] - i
            const testBattery = [t1, t2, t3, t4]
            const testEval = testResultArray => testResultArray[0] && testResultArray[1] && (testResultArray[2] || testResultArray[3])
            const preparedTest = axes.map(a => testBattery.map(t => t(a)(pos, r, i)))
            const completedTest = possibleCoords.reduce((resultObj, coord) => {
                const test = preparedTest.map(ax => ax.map(t => t(coord)))
                const newObj = prev
            }, {})
        }
        */
        //attack neighbors
            //console.log('attack: ' + JSON.stringify(attackNeighbors))
        const attackFlag = getAttackFlags(room)[0]
        //console.log('exit: ' + JSON.stringify(exit))
        const verifyFlag = strat.attack.length === 0 || attackFlag || room.createFlag(exit(room, strat), undefined, opts(room, strat).color, opts(room, strat).secondaryColor)

        //maintain/create outpost
        const outpostFlags = getOutpostFlags(room)
        const verifyOutpostFlag = strat.outpost.length === 0 || outpostNeighbors(room, strat).length === 0 || outpostFlags.length || room.createFlag(outpostExit(room, strat), outpostNeighbors(room, strat)[0][1], outpostOpts(room, strat).color, outpostOpts(room, strat).secondaryColor)

        //create colony
        const colonyFlags = getColonyFlags(room)
        const verifycolonyFlag = strat.colony.length === 0 || colonyNeighbors(room, strat).length === 0 || colonyFlags.length || room.createFlag(colonyExit(), colonyNeighbors()[0][1], colonyOpts().color, colonyOpts().secondaryColor)
/*
        const roomReadyForRoad = roomRoads.ready(Game)(strat)(room)
        const pathLibrary = roomReadyForRoad ? room.fromToPath.getPaths(room.name) : undefined
        const chosenPath = pathLibrary !== undefined ? roomRoads.choosePath(Game)(strat)(room)(pathLibrary) : undefined
        const buildPath = chosenPath !== undefined && chosenPath.length ? roomRoads.buildRoad(room)(chosenPath) : undefined
*/

        //if (roomReadyForRoad) console.log(room.name + ' ready for road construction')
        //if (roomReadyForRoad) console.log(room.name + ' path pathLibrary: ')
        //if (roomReadyForRoad) console.log(pathLibrary)
        //if (roomReadyForRoad) console.log(room.name + ' path Chosen: ')
        //if (roomReadyForRoad) console.log(chosenPath)
        //if (roomReadyForRoad) console.log(room.name + ' path Built: ')
        //if (roomReadyForRoad) console.log(buildPath)

        const roomReadyWalls = Game.cpu.bucket === 10000 && room.controller && room.controller.level >= 4 && room.energyAvailable === room.energyCapacityAvailable && room.findMyConstructionSites().length <= 1 && roomStatus.storage !== undefined && Game.time === Memory.wallMemoExpTick[room.name] - 1
        const gatesOk = roomReadyWalls ? roomWalls.gateBuild(room) : undefined
        //if (roomReadyWalls) console.log(room.name + ' roomReadyWalls ' + roomReadyWalls)
        //if (roomReadyWalls) console.log(room.name + ' gatesOk ' + gatesOk)

        //frontier roads
        const front = room.frontier()
        const fullWorkhorses = front ? roomStatus.workhorses.filter(c => c.status('full')) : []
        const fWOnSwamp = fullWorkhorses.filter(c => c.pos.lookFor(LOOK_TERRAIN) === 'swamp')

        //console.log( room.name + ' ' + JSON.stringify(fWOnSwamp))

        //kickstart wildcat
        const wildcatFlags = getwildcatFlags(room)
        const verifywildcatFlag = strat.wildcat.length === 0 || wildcatNeighbors(room, strat).length === 0 || wildcatFlags.length || room.createFlag(wildcatExit(room, strat), wildcatNeighbors(room, strat)[0][1], wildcatOpts(room, strat).color, wildcatOpts(room, strat).secondaryColor)


        //build controllerContainer in early room
        //ideal controllerContainer spot: 2 away from controller
        //within 1 of road
        //not next to any of my structures except ramparts

        //if(room.name === 'W4S73') console.log('rooms 174 controllerContainerPosPickList ' + JSON.stringify(controllerContainerPosPickList(room)))
        //console.log('rooms 175 controllerContainerNeeded ' + JSON.stringify(controllerContainerNeeded))
        //if(room.name === 'W4S73') console.log('rooms 176 storageNeeded ' + JSON.stringify(storageNeeded))

        const buildControllerContainer = controllerContainerNeeded && controllerContainerPosPickList(room, roomStatus).length ? controllerContainerPosPickList(room, roomStatus)[0].createConstructionSite(STRUCTURE_CONTAINER) : -5
        const storagePoss = storageNeeded ? controllerContainerPosPickList(room, roomStatus) : []
        const buildStorage = storagePoss.length > 0 ? storagePoss[roomStatus.controllerContainers.length].createConstructionSite(STRUCTURE_STORAGE) : storageNeeded ? console.log(room.name + ' could not find storage location') : -5
        
        //console.log('rooms 355 storageNeeded ' + JSON.stringify(storageNeeded))
        //console.log('rooms 355 storagePoss ' + JSON.stringify(storagePoss))
        //console.log('rooms 355 buildStorage ' + JSON.stringify(buildStorage))
        const controllerLinkPos = controllerLinkNeeded ? rPosPickList(roomStatus.storage.pos, 2, [], Game.cpu.getUsed(), p => p.findInRange(FIND_MY_STRUCTURES, 0, {filter: s => s.structureType !== STRUCTURE_RAMPART}).length === 0) : undefined

        
        const t2 = Game.cpu.getUsed()
        //console.log('rooms 191 ' + room.name + ' time used flags' + JSON.stringify(t2 - t1))

        const terminalPos = terminalNeeded ? rPosPickList(room.storage.pos, 3, [], Game.cpu.getUsed(), p => p.findInRange(FIND_MY_STRUCTURES, 1, {filter: s => s.structureType !== STRUCTURE_RAMPART}).length === 0) : []

        const buildTerminal = terminalPos.length ? terminalPos[0].createConstructionSite(STRUCTURE_TERMINAL) : -5

        if(buildTerminal < 0 && terminalNeeded) console.log('Terminal needed but not built in room ' + room.name + ' error ' + buildTerminal)

        const t3 = Game.cpu.getUsed()
        //console.log('rooms 420 ' + room.name + ' time used links1 ' + JSON.stringify(t3 - t2))
        const buildMinerLink = minerLinksNeeded ? rPosPickList(minerContainersWithoutLinks[0].pos, 1, [], Game.cpu.getUsed(), p => p.findInRange(FIND_MY_STRUCTURES, 0, {filter: s => s.structureType !== STRUCTURE_RAMPART}).length === 0)[0].createConstructionSite(STRUCTURE_LINK) : -5

        const buildControllerLink = controllerLinkPos && controllerLinkPos.length > 0 ? controllerLinkPos[0].createConstructionSite(STRUCTURE_LINK) : -5
        
        
        const t4 = Game.cpu.getUsed()
        //console.log('rooms 432 ' + room.name + ' time used links2 ' + JSON.stringify(t4 - t3))
        //if(room.name === 'E33S34') console.log('rooms 432 minerContainersWithoutLinks ' + JSON.stringify(minerContainersWithoutLinks))        
        const linkSpots = minerContainersWithoutLinks.length ? rPosPickList(minerContainersWithoutLinks[0].pos, 1, [], p => p.findInRange(FIND_MY_STRUCTURES, 0, {filter: s => s.structureType !== STRUCTURE_RAMPART}).length === 0) : []
        //if(room.name === 'E33S35') console.log('rooms 418 minerLinksNeeded ' + JSON.stringify(minerLinksNeeded))               
        //if(room.name === 'E33S35') console.log('rooms 418 controllerLinkPresent ' + JSON.stringify(controllerLinkPresent))    
        //if(room.name === 'E33S35') console.log('rooms 418 linkSpots ' + JSON.stringify(linkSpots))    
    }
    const tf = Game.cpu.getUsed()
    const totalTime = tf -t0
    //console.log(roomStatus.name + ' rooms 434 total time: ' + JSON.stringify(totalTime))    

}
module.exports = {
    expansion: expansion
}
