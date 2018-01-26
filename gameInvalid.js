const soldierParts = [TOUGH, ATTACK, RANGED_ATTACK, HEAL]
const parseForRoomName = _.memoize(str => {
    if(_.startsWith(str, 'Flag')) return undefined
    const strPre = str.indexOf('-') > -1 ? str.slice(0, str.indexOf('-')) : str
    //console.log('gameInvalid 5 str/strPre ' + str + ' / ' + strPre)
    if (strPre[0] === 'E' || strPre[0] === 'W') return strPre
    return undefined
})
var pathFunctionMemo = {}
var pathLibraryObject = {}
/*
if(Memory.pathLibraryObject === undefined) Memory.pathLibraryObject = {}
_.forOwn(Memory.pathLibraryObject, (v, k) => {
    const kValid = Game.rooms[k] !== undefined
    //const longPaths = v.filter()
    const array = Object.keys(v).length < 100 ? v : {}
    if(kValid) {pathLibraryObject[k] = array}
})
Memory.pathLibraryObject = pathLibraryObject
*/
var memo = {}
const dirMatrix = [
    [0, 0],      //none
    [0, -1],     //top
    [1, -1],    //top right
    [1, 0],     //right
    [1, 1],    //bottom right
    [0, 1],    //bottom
    [-1, 1],    //bottom left
    [-1, 0],     //left
    [-1, -1],    //top left
]

const posInDir = _.memoize(pos => _.memoize(dir => pos && dir ? new RoomPosition(pos.x + dirMatrix[dir][0], pos.y + dirMatrix[dir][1], pos.roomName) : undefined))
const exitPos = _.memoize(pos => pos.x === 0 || pos.y === 0 || pos.x === 49 || pos.y === 49)
const ar0_49 = _.range(50)
const edges = []
    .concat(ar0_49.map(e => {return {x: 0, y: e}}))
    .concat(ar0_49.map(e => {return {x: 49, y: e}}))
    .concat(ar0_49.map(e => {return {x: e, y: 0}}))
    .concat(ar0_49.map(e => {return {x: e, y: 49}}))
const nearEdges = []
    .concat(ar0_49.map(e => {return {x: 1, y: e}}))
    .concat(ar0_49.map(e => {return {x: 48, y: e}}))
    .concat(ar0_49.map(e => {return {x: e, y: 1}}))
    .concat(ar0_49.map(e => {return {x: e, y: 48}}))
    .concat(ar0_49.map(e => {return {x: 2, y: e}}))
    .concat(ar0_49.map(e => {return {x: 47, y: e}}))
    .concat(ar0_49.map(e => {return {x: e, y: 2}}))
    .concat(ar0_49.map(e => {return {x: e, y: 47}}))
const edgeCoord = edgePos => testPos => edgePos.x === 2 && testPos.x === 1 || edgePos.y === 2 && testPos.y === 1 || edgePos.x === 47 && testPos.x === 48 || edgePos.y === 47 && testPos.y === 48
const coreCoord = edgePos => testPos => edgePos.x === 2 && testPos.x === 3 || edgePos.y === 2 && testPos.y === 3 || edgePos.x === 47 && testPos.x === 46 || edgePos.y === 47 && testPos.y === 46
const edgePosFilter = pos => {
    const exitSideWalakables = pos.walkableCoordsNearPos().filter(edgeCoord(pos))
    const coreSideWalkables = pos.walkableCoordsNearPos().filter(coreCoord(pos))
    const retVal = exitSideWalakables.length > 0 && coreSideWalkables.length > 0
    return retVal
}
function ExtensionGarden (pos) {
    //needsEnergy
    //buildComplete
}
const standardFunc = (toPos, room, edges) => (roomName, costMatrix) => {
    const bannedSquares = room.find(FIND_STRUCTURES, {filter: s => s.structureType === STRUCTURE_CONTAINER})
        .concat(room.find(FIND_MY_CREEPS, {filter: c => c.type('staticWorker') || c.fatigue > 0}))
        .map(s => s.pos)
        .concat(toPos.exitPos() ? [] : edges)
    const discouragedSquares = !!room.storage ? room.storage.pos.walkableCoordsNearPos().filter(pos => pos.findInRange(FIND_MY_STRUCTURES, 1).length !== 1) : []
    const prefSquares = room.find(FIND_CONSTRUCTION_SITES, {filter: s => s.structureType === STRUCTURE_ROAD})
        .map(s => s.pos)
    const retVal = bannedSquares.map(p => costMatrix.set(p.x, p.y, 255))
        .concat(discouragedSquares.map(p => costMatrix.set(p.x, p.y, 20)))
        .concat(prefSquares.map(p => costMatrix.set(p.x, p.y, 1)))
    return retVal
}
function pathFunction () {
    const posInPathDir = (pos, pathLibrary, excludeCoord, toPos) => {

        //console.log('gameInvalid 196 toPos ' + JSON.stringify(toPos))
        //console.log('gameInvalid 197 fromPos ' + JSON.stringify(pos))
        const posPathLibrary = pathLibrary.filter(path => {
            if(!path) return false
            //console.log('posInPathDir posPathLibrary ' + JSON.stringify(pos) + ' ' + JSON.stringify(posPathLibrary))
            const containsTarget = path.filter(pPos => pPos.x === pos.x && pPos.y === pos.y).length > 0
            const containsExcluded = excludeCoord !== undefined ? path.filter(pPos => pPos.x === excludeCoord.x && pPos.y === excludeCoord.y).length > 0 : false
            return containsTarget && !containsExcluded
        }).sort((a, b) => {
            const aFromPosIndex = a.map((p, i) => [p, i]).filter(pPos => pPos[0].x === pos.x && pPos[0].y === pos.y).map(p => p[1])
            const bFromPosIndex = b.map((p, i) => [p, i]).filter(pPos => pPos[0].x === pos.x && pPos[0].y === pos.y).map(p => p[1])
            const aToPosIndex = a.map((p, i) => [p, i]).filter(pPos => pPos[0].x === toPos.x && pPos[0].y === toPos.y).map(p => p[1])
            const bToPosIndex = b.map((p, i) => [p, i]).filter(pPos => pPos[0].x === toPos.x && pPos[0].y === toPos.y).map(p => p[1])
            const aDist = Math.abs(aToPosIndex - aFromPosIndex)
            const bDist = Math.abs(bToPosIndex - bFromPosIndex)
            return bDist - aDist
        })
        //console.log('posInPathDir posPathLibrary ' + JSON.stringify(pos) + ' ' + JSON.stringify(posPathLibrary))
        const retVal = posPathLibrary.length ? posPathLibrary[0].filter(pPos => pPos.x === pos.x && pPos.y === pos.y)[0].direction : false
        return retVal
    }

    var retVal = function (fromPosRaw, toPosRaw, worldState) {
        if(toPosRaw === undefined) return ERR_INVALID_ARGS
            const fromPos = typeof fromPosRaw.roomName === 'string' ? fromPosRaw : fromPosRaw.pos
            const toPos = typeof toPosRaw.roomName === 'string' ? toPosRaw : toPosRaw.pos
            const fromString = JSON.stringify(fromPos)
            const toString = JSON.stringify(toPos)
            //console.log('gameInvalid room.fromToPath ' + fromPos + ' ' + toPos)
            if(memo[this.room.name] === undefined) memo[this.room.name] = {}
            if(memo[this.room.name][toString] === undefined) memo[this.room.name][toString] = {}
            const optsArg = {ignoreCreeps: true, respectStillCreeps: true, worldState: worldState}
            const param0 = memo[this.room.name][toString][fromString]
            const nextPos = param0 !== undefined && memo[this.room.name][toString][fromString] !== undefined ? posInDir(fromPos)(param0) : undefined
            const param1 = memo[this.room.name][toString][JSON.stringify(nextPos)]
            const twoPos = param1 !== undefined && nextPos !== undefined && memo[this.room.name][toString][JSON.stringify(nextPos)] !== undefined ? posInDir(nextPos)(param1) : undefined
            const rejectNextPos = nextPos && nextPos.walkable && !nextPos.walkable()
            const circleFound = rejectNextPos || twoPos !== undefined ? rejectNextPos || twoPos.x === fromPos.x && twoPos.y === fromPos.y && twoPos.roomName === fromPos.roomName : false
            const memoGood = memo[this.room.name][toString][fromString] !== undefined && !circleFound
            //if(toPos.x === 28 && toPos.y === 33) console.log(this.room.name + ' gameInvalid 92 memoGood ' + JSON.stringify(memoGood))
            //if(toPos.x === 28 && toPos.y === 33) console.log(this.room.name + ' gameInvalid 93 nextPos ' + JSON.stringify(nextPos))
            //if(toPos.x === 28 && toPos.y === 33) console.log(this.room.name + ' gameInvalid 94 mem ' + JSON.stringify(memo[this.room.name][toString][fromString]))
            //if(memoGood) console.log(this.room.name + ' gameInvalid 94 memo: good')
            //if(!memoGood) console.log(this.room.name + ' gameInvalid 94 memo: bad')
            if(memoGood) return memo[this.room.name][toString][fromString]
            if(Game.cpu.bucket < 2000) return 0
            if(circleFound) memo[this.room.name][toString] = {}
            if(circleFound) pathLibraryObject[this.room.name][toString] = []
            /*
            if(circleFound) Memory.pathLibraryObject[this.room.name][toString] = []
            Memory removal
            */
            //check existing pathLibrary to see if this pos has already been calcd
            /*
            if(pathLibraryObject[this.room.name] === undefined) Memory.pathLibraryObject[this.room.name] = {}
            Memory removal
            */
            if(pathLibraryObject[this.room.name] === undefined) pathLibraryObject[this.room.name] = {}
            /*
            if(pathLibraryObject[this.room.name][toString] === undefined) Memory.pathLibraryObject[this.room.name][toString] = []
            Memory removal
            */
            if(pathLibraryObject[this.room.name][toString] === undefined) pathLibraryObject[this.room.name][toString] = []
            //console.log(this.room.name + ' fromString ' + fromString)
            //console.log(this.room.name + ' toString ' + toString)
            //console.log(this.room.name + ' toString ' + toString)
            //console.log('gameInvalid 231 toPos ' + toString)
            const pathDir = posInPathDir(fromPos, pathLibraryObject[this.room.name][toString], undefined, toPos)
            // if(toPos.x === 25 && toPos.y === 33) console.log(this.room.name + ' gameInvalid 111 pathDir' + JSON.stringify(pathDir))
            const pathDirPos = posInDir(fromPos)(memo[this.room.name][toString][fromString])
            const pathDirPosOk = pathDirPos && pathDirPos.walkable && pathDirPos.walkable()
            if(pathDir !== false && pathDirPosOk) memo[this.room.name][toString][fromString] = pathDir
            if(pathDir !== false && pathDirPosOk) return pathDir
                /*
            if(pathDir !== false && !pathDirPosOk) Memory.pathLibraryObject[this.room.name][toString] = []
            Memory removal
                */
            if(pathDir !== false && !pathDirPosOk) pathLibraryObject[this.room.name][toString] = []
            
            const edgeValue = toPos.exitPos() ? 1 : 255
            const newPathRaw = this.room.findPath(fromPos, toPos, {ignoreCreeps: true, maxRooms: 1, costCallback: standardFunc(toPos, this.room, edges)})
            //if(toPos.x === 49 && toPos.y === 17) console.log(this.room.name + ' gameInvalid 90 ' + JSON.stringify(newPathRaw))
            const newPath = newPathRaw.reduce((pathStack, pathTargetRaw) => {
                const currentPos = pathStack.pop()
                const pathTarget = {
                    x: currentPos.x,
                    y: currentPos.y,
                    dx: pathTargetRaw.dx,
                    dy: pathTargetRaw.dy,
                    direction: pathTargetRaw.direction
                }
                const nextPos = {
                    x: pathTargetRaw.x,
                    y: pathTargetRaw.y,
                    roomName: currentPos.roomName
                }
                pathStack.push(pathTarget)
                pathStack.push(nextPos)
                return pathStack
            }, [fromPos])
            const pathLength = pathLibraryObject[this.room.name][toString].length
            pathLibraryObject[this.room.name][toString][pathLength] = newPath
            /*
            if(Memory.pathLibraryObject[this.room.name][toString] === undefined) Memory.pathLibraryObject[this.room.name][toString] = pathLibraryObject[this.room.name][toString]
            Memory.pathLibraryObject[this.room.name][toString][pathLength] = newPath
            Memory removal
            */
            //console.log('gameInvalid 269 toPos ' + toString)
            // if(toPos.x === 0 && toPos.y === 25) console.log(this.room.name + ' gameInvalid 111 newPath' + JSON.stringify(newPath))
            const finalDirection = newPath[0].direction
            if(finalDirection !== false) memo[this.room.name][toString][fromString] = finalDirection
            //console.log('posInPathDir newPath' + ' ' + JSON.stringify(newPath))
        const retVal = finalDirection ? finalDirection : 0
            //if(toPos.x === 45) console.log(this.room.name + ' gameInvalid 111 retVal ' + JSON.stringify(retVal ))
            return retVal
    }
    retVal.getPaths = function(roomName) {
        //console.log('gameInvalid 276 ' + roomName + JSON.stringify(pathLibraryObject))
        return pathLibraryObject[roomName]
    }
    return retVal
}



var posWalkMemo = {}
function posWalkable() {
    
    return function(opts = {}) {
        const key = JSON.stringify('' + this.roomName + '-' + this.x + '-' + this.y)
        if (posWalkMemo[key] !== undefined && opts === {}) return posWalkMemo[key]
        if (posWalkMemo[key] === undefined && opts === {}) posWalkMemo[key] = []
        const stillsRespected = true
        //if(opts.worldState && !stillsRespected) console.log('opts worldState valid ' + (opts.Game.time))
        const finalObstacles = OBSTACLE_OBJECT_TYPES.filter(t => t !== LOOK_CREEPS).concat('wall')
        const retVal = this.look().reduce((prev, object, i, ar) => {
        const retVal = prev && finalObstacles.indexOf(object.type) === -1 && (object.type !== 'terrain' || finalObstacles.indexOf(object.terrain) === -1) && (object.type !== 'structure' || finalObstacles.indexOf(object.structure.structureType) === -1)
        //if(this.x === 27 && this.y === 17) console.log(JSON.stringify(prev) + JSON.stringify(opts) + JSON.stringify(retVal))
            return retVal
        }, stillsRespected)
        //if(opts.worldState && !stillsRespected) console.log('opts stillsRespected ' + stillsRespected)
        //if(opts.worldState && !stillsRespected) console.log(this)
        //if(opts.worldState && !stillsRespected) console.log(retVal)
        //console.log('gameInvalid 146 ' + JSON.stringify(this) + ' posWalkable ' + JSON.stringify(retVal))
        posWalkMemo[key] = retVal
    
    return retVal
}}
var posWalkCoordMemo = {}
function posWalkableCoords() {
    return function(opts) {
        const key = JSON.stringify('' + this.roomName + '-' + this.x + '-' + this.y)
        if (posWalkCoordMemo[key] !== undefined && opts === undefined) return posWalkCoordMemo[key]
        if (posWalkCoordMemo[key] === undefined && opts === undefined) posWalkCoordMemo[key] = []

        //returns an array containing actual room positions!
        //The returned array is 0-8 elements long (inside a wall or out in an open field)
        //get the up to 8 positions that neighbor this position that are walkable
        //note that creeps block walkability! check separately for creeps if needed
        const Xray = [_.max([this.x - 1, 0]), this.x, _.min([this.x + 1, 49])].filter((x, i, ar) => ar.indexOf(x) === i)
        const Yray = [_.max([this.y - 1, 0]), this.y, _.min([this.y + 1, 49])].filter((x, i, ar) => ar.indexOf(x) === i)
        const combinedRay = _.flatten(Xray.map(x => Yray.reduce((row, nextY) => {
                row.push([x, nextY])
                const retVal = row
                return retVal
            }, []))).filter(x => x[0] !== this.x || x[1] !== this.y)
            .map(x => new RoomPosition(x[0], x[1], this.roomName))
            .filter(x => x.walkable(opts))
        //if(this.x === 20 && this.y === 8) console.log(JSON.stringify(combinedRay))
        posWalkCoordMemo[key] = combinedRay
        return combinedRay
    }
}
module.exports = () => {
    Room.prototype.getPLO = function () {
        return pathLibraryObject[this.name]
    }
    Room.prototype.neighbors = function() {
        var memo = {}
        return function(dir) {
            const key = this.name
            const argKey = dir !== undefined ? dir : 'all'
            if (memo[key] === undefined) memo[key] = {}
            if (memo[key][argKey] !== undefined) return memo[key][argKey]
            const getCoord = (roomName, coord = '') => {
                //return coord after reaching a letter (with a nonzero coord.length) or end of string
                //console.log(roomName.charAt(coord.length + 1))
                if (isNaN(roomName.charAt(coord.length + 1)) || roomName.length === coord.length + 1) return [roomName.charAt(0), coord]
                return getCoord(roomName, coord + roomName.charAt(coord.length + 1))
            }
            const getCoords = _.memoize(roomName => [getCoord(roomName), getCoord(roomName.substr(getCoord(roomName)[1].length + 1))])
            const switchCoord = letter => {
                const switcher = {
                    'N': 'S',
                    'S': 'N',
                    'E': 'W',
                    'W': 'E'
                }
                const switched = switcher[letter]
                if (switched) return ERR_INVALID_ARGS
                return switched
            }
            //splice into a ns and ew component
            const coords = getCoords(this.name)
                //console.log(JSON.stringify(coords))
            const neighbooringCoords = (coords, dir) => {
                let latSide = [],
                    longSide = []
                const onLineLat = coords[0][1] === '0'
                const onLineLong = coords[1][1] === '0'
                latSide[0] = onLineLat ? [switchCoord(coords[0][0]), '0'] : [coords[0][0], '' + (parseInt(coords[0][1], 10) - 1)]
                latSide[1] = [coords[0][0], '' + (parseInt(coords[0][1], 10) + 1)]
                longSide[0] = onLineLong ? [switchCoord(coords[1][0]), '0'] : [coords[1][0], '' + (parseInt(coords[1][1], 10) - 1)]
                longSide[1] = [coords[1][0], '' + (parseInt(coords[1][1], 10) + 1)]
                const nSide = coords[1][0] === 'S' ? longSide[0] : longSide[1]
                const sSide = coords[1][0] === 'N' ? longSide[0] : longSide[1]
                const eSide = coords[0][0] === 'W' ? latSide[0] : latSide[1]
                const wSide = coords[0][0] === 'E' ? latSide[0] : latSide[1]
                const n = [coords[0], nSide]
                const s = [coords[0], sSide]
                const e = [eSide, coords[1]]
                const w = [wSide, coords[1]]
                if (!dir) return [n, s, e, w]
                const dirs = {
                    n: n,
                    s: s,
                    e: e,
                    w: w
                }
                return [dirs[dir]]
            } 
            //get the neighboring ns components
            //get the neighboring ew components
            //get north room
            //get w room
            //get s room
            //get e room
            const neighborCoords = neighbooringCoords(coords, dir).map(x => x[0][0] + x[0][1] + x[1][0] + x[1][1])
                //console.log(JSON.stringify(neighborCoords))
            memo[key][argKey] = neighborCoords
            return neighborCoords
                //concatenate into array and return
        }
    }()
    Room.prototype.friendlyWalls = function() {
        let wallMemo = {}
        let wallMemoExpTick = {}
        return function(tick) {
            const funcStartTime = Game.cpu.getUsed()
            //console.log(this.name + ' thisStatus 64: friendlyWalls wallMemo ' + JSON.stringify(wallMemo))
            const cacheTicks = 1000
            let retVal
            if(!this.controller || !this.controller.my) return []
            const useMemory = Object.keys(wallMemo).length === 0
            if(useMemory && Memory.wallMemo === undefined) {
                Memory.wallMemo = {}
                Memory.wallMemoExpTick = {}
            }
            if(useMemory) {
                wallMemo = Object.keys(Memory.wallMemo).reduce((pv, k) => {pv[k] = Memory.wallMemo[k].map(Game.getObjectById); return pv}, {})
                //console.log('gameInvalid 356 wallMemo for room ' + this.name + ' ' + JSON.stringify(wallMemo))
                wallMemoExpTick = Memory.wallMemoExpTick
            }

            const testTime = Game.cpu.getUsed()
            //console.log('gameInvalid 362 room ' + this.name + ' friendlyWalls testTime ' + JSON.stringify(testTime - funcStartTime))
            //console.log('gameInvalid 362 useMemory for room ' + this.name + ' ' + useMemory)
            //console.log('gameInvalid 362 wallMemo[this.name] for room ' + this.name + ' ' + JSON.stringify(wallMemo[this.name]))
            const cacheEmpty = wallMemo[this.name] === undefined || wallMemo[this.name] === []
            const cacheStale = !cacheEmpty && wallMemoExpTick[this.name] !== undefined && (tick > wallMemoExpTick[this.name])
            if(!cacheEmpty && (!cacheStale || Game.cpu.bucket <= 9800 || Game.cpu.getUsed() > 15)) return wallMemo[this.name].filter(w => w).map(w => Game.getObjectById(w.id))
            if(Game.cpu.bucket <= 9800 || Game.cpu.getUsed() > 15) return []
            const memCheckCompleteTime = Game.cpu.getUsed()
            //console.log('gameInvalid 362 room ' + this.name + ' friendlyWalls memCheckTime ' + JSON.stringify(memCheckTime - funcStartTime))
            //console.log('gameInvalid 362 fresh friendlyWalls calculation for room ' + this.name)



            
            const ar0_49 = _.range(50)
            const edge_x0 = this.findExitTo(this.neighbors('w')[0]) === FIND_EXIT_LEFT  ? ar0_49.map(e => this.getPositionAt(2, e)).filter(edgePosFilter) : []
            const edge_y0 = this.findExitTo(this.neighbors('n')[0]) === FIND_EXIT_TOP ? ar0_49.map(e => this.getPositionAt(e, 2)).filter(edgePosFilter) : []
            const edge_x49 = this.findExitTo(this.neighbors('e')[0]) === FIND_EXIT_RIGHT ? ar0_49.map(e => this.getPositionAt(47, e)).filter(edgePosFilter) : []
            const edge_y49 = this.findExitTo(this.neighbors('s')[0]) === FIND_EXIT_BOTTOM ? ar0_49.map(e => this.getPositionAt(e, 47)).filter(edgePosFilter) : []
            const edges = [].concat(edge_x0).concat(edge_x49).concat(edge_y0).concat(edge_y49)
            retVal = edges.reduce((walls, pos) => walls.concat(pos.findInRange(FIND_STRUCTURES, 0, {filter: s => s.structureType === STRUCTURE_WALL})) , [])
            




            wallMemoExpTick[this.name] = tick + cacheTicks
            //console.log(this.name + ' gameInvalid 267: friendlyWalls wallMemo post' + JSON.stringify(wallMemo))
            //console.log(this.name + ' gameInvalid 268: friendlyWalls retVal ' + JSON.stringify(retVal))
            //console.log(this.name + ' gameInvalid 269: friendlyWalls wallMemoExpTick ' + JSON.stringify(wallMemoExpTick))
            wallMemo[this.name] = retVal
            Memory.wallMemo[this.name] = retVal.map(w => w.id)
            Memory.wallMemoExpTick[this.name] = wallMemoExpTick[this.name]

            return retVal
    }}()
    Room.prototype.focalPos = function() {
        var memo = {}
        return function() {
            const key = this.name
            if (memo[key] !== undefined) return memo[key]
                //if(this.name === 'Parker') console.log(this.name + ' ' + JSON.stringify(this.body))
            const contPos = this.controller !== undefined ? this.controller.pos : this.getPositionAt(25, 25)
            memo[key] = contPos
            return contPos
        }
    }()
    Room.prototype.posToPos = function() {
        return true
    }
    RoomPosition.prototype.dirWalkable = function (dir, opts = {ignoreCreeps: true, respectStillCreeps: false}) {
        const walkable = this.walkableCoordsNearPos(opts)
        return walkable.reduce((pv, cv) => pv || this.getDirectionTo(cv) === dir , false)
    }  
    RoomPosition.prototype.walkable = posWalkable()
    RoomPosition.prototype.walkableCoordsNearPos = posWalkableCoords()
    RoomPosition.prototype.nearSource = function() {
        var memo = {}
        return function(r = 1) {
            const key = '' + this.roomName + this.x + this.y
                //console.log('nearSource ' + key)
            if (memo[key] === undefined) memo[key] = {}
            if (memo[key][r] !== undefined) return memo[key][r]
            const retVal = this.findInRange(FIND_SOURCES, r).length > 0
            memo[key][r] = retVal
            return retVal
        }
    }()
    RoomPosition.prototype.nearController = function() {
        var memo = {}
        return function(r = 3) {
            const key = this.roomName + this.x + this.y
            if (memo[key] === undefined) memo[key] = {}
            if (memo[key][r] !== undefined) return memo[key][r]
            const retVal = this.findInRange(FIND_STRUCTURES, r, { filter: { structureType: STRUCTURE_CONTROLLER } }).length > 0
            memo[key][r] = retVal
            return retVal
        }
    }()

    RoomPosition.prototype.nearStorage = function() {
        var memo = {}
        return function(r = 1) {
            const key = this.roomName + this.x + this.y
            if (memo[key] === undefined) memo[key] = {}
            if (memo[key][r] !== undefined) return memo[key][r]
            const retVal = this.findInRange(FIND_STRUCTURES, r, { filter: { structureType: STRUCTURE_STORAGE } }).length > 0
            memo[key][r] = retVal
            return retVal
        }
    }()
    RoomPosition.prototype.nearStruc = function() {
        return function(struc, r = 1) {
            const retVal = this.findInRange(FIND_STRUCTURES, r, { filter: { structureType: struc } }).length > 0
            return retVal
        }
    }()
    RoomPosition.prototype.hasCreepType = function() {
        var memo = {}
        return function(type) {
            const key = this.roomName + this.x + this.y
            if (memo[key] === undefined) memo[key] = {}
            if (type && memo[key][type] !== undefined) return memo[key][type]
            const retVal = this.look().filter(x => x.type === 'creep').filter(x => !type || x.creep.type(type)).length > 0
            if(type) memo[this.name][type] = retVal
            return retVal
        }
    }()
    RoomPosition.prototype.exitPos = function() {
        var memo = {}
        return function(type) {
            const key = this.roomName + this.x + this.y
            if (memo[key] === undefined) memo[key] = {}
            if (memo[key][type] !== undefined) return memo[key][type]
            const retVal = this.x === 0 || this.y === 0 || this.x === 49 || this.y === 49
            memo[key][type] = retVal
            return retVal
        }
    }()
    RoomPosition.prototype.nearExit = function() {
        var memo = {}
        return function(type) {
            const key = this.roomName + this.x + this.y
            if (memo[key] === undefined) memo[key] = {}
            if (memo[key][type] !== undefined) return memo[key][type]
            const retVal = this.x < 3 || this.y < 3 || this.x > 46 || this.y > 46
            memo[key][type] = retVal
            return retVal
        }
    }()
    Creep.prototype.energyCost = function() {
        return this.body.reduce((total, part) => total + BODYPART_COST[part], 0)
    }
    Creep.prototype.soldier = function() {
        var memo = {}
        return function() {
            const key = this.id
            if (memo[key] !== undefined) return memo[key]
                //if(this.name === 'Parker') console.log(this.name + ' ' + JSON.stringify(this.body))
            const includesSoldierParts = this.body.reduce((pv, cv) => pv || soldierParts.reduce((pr, cu) => pr || cu === cv.type, false), false)
            memo[key] = includesSoldierParts
            return includesSoldierParts
                //return this.body.indexOf(TOUGH) > -1 || this.body.indexOf(ATTACK) > -1 || this.body.indexOf(HEAL) > -1 || this.body.indexOf(RANGED_ATTACK) > -1 || this.body.indexOf(CLAIM) > -1
        }
    }()
    Creep.prototype.has = function() {
        var memo = {}
        return function(part) {
            const key = this.id
            if (memo[key] === undefined) memo[key] = {}
            if (memo[key][part] !== undefined) return memo[key][part]
            const retVal = this.body.reduce((pv, cv) => pv || cv.type === part, false)
            memo[key][part] = retVal
            return retVal
        }
    }()
    Creep.prototype.partCount = function() {
        var memo = {}
        return function(part) {
            const key = this.id
            if (memo[key] === undefined) memo[key] = {}
            if (memo[key][part] !== undefined) return memo[key][part]
            const retVal = this.body.reduce((pv, cv) => pv + (cv.type === part ? 1 : 0), 0)
            memo[key][part] = retVal
            return retVal
        }
    }()  
    Creep.prototype.fromToPath = pathFunction()
    Creep.prototype.moveAlong = function (pos, x ,worldState) {
        const moveDir = this.fromToPath(this.pos, pos, worldState)
        //console.log(moveDir)
        const movePos = moveDir && moveDir > 0 ? posInDir(this.pos)(moveDir) : this.pos
        const creepOnPos = movePos.findInRange(FIND_MY_CREEPS, 0)
        const creepTypeOnPos = creepOnPos.length > 0
        const moreCreeps = creepTypeOnPos && movePos.findInRange(FIND_MY_CREEPS, 1).length > 2

        const retVal = moreCreeps ? this.moveTo(pos) : this.move(moveDir)

        if(this.name === 'Tyler') console.log(this.name + ' ' + this.room.name + ' moveDir ' + moveDir)
        if(this.name === 'Tyler') console.log(this.name + ' ' + this.room.name + ' movePos ' + movePos)
        if(this.name === 'Tyler') console.log(this.name + ' ' + this.room.name + ' creepTypeOnPos ' + creepTypeOnPos)
        if(this.name === 'Tyler') console.log(this.name + ' ' + this.room.name + ' moreCreeps ' + moreCreeps)
        if(this.name === 'Tyler') console.log(this.name + ' ' + this.room.name + ' retVal ' + retVal)
        return retVal
        
        //return this.move(moveDir)
    }

    Creep.prototype.energyTransfer = function(target, amount) {
        const resources = Object.keys(this.carry)
        const carriedResources = resources.filter(r => this.carry[r])
        return this.transfer(target, carriedResources[0], amount)
    }

    Creep.prototype.boosted = function() {
        return false
    }


    Creep.prototype.type = function() {
        var memo = {}
        return function(testType) {
            const key = this.id
            if (memo[key] === undefined) memo[key] = {}
            if (memo[key][testType] !== undefined) return memo[key][testType]
                //if testType is not a string, return the creeps type as a string
                //if testType is a string, return true if it is this creeps type
                //if(key === 'Katherine') console.log(JSON.stringify(_.slice(this.body.map(x => x.type), 0, this.typeArray[4][1].length)))
                //if(key === 'Amelia') console.log(JSON.stringify(this.typeArray.filter(type => _.isEqual(_.slice(this.body.map(x => x.type), 0, type[1].length), type[1]))))
            const type = this.typeArray.filter(type => _.isEqual(_.slice(this.body.map(x => x.type), 0, type[1].length), type[1]))
                .reduce((pv, cv) => pv[1].length > cv[1].length ? pv : cv, ['', []])[0]
                //if(key === 'Katherine') console.log(key + JSON.stringify(testType))
                //if(key === 'Katherine') console.log(key + JSON.stringify(type))
            const retVal = typeof testType === 'string' ? testType === type : type
            memo[key][testType] = retVal
            return retVal
        }
    }()
    Flag.prototype.assocRoomName = function () {
        var memo = {}
        return function () {
            const key = this.name
            if (memo[key] !== undefined) return memo[key]

            const e = this.pos.x === 49
            const w = this.pos.x === 0
            const n = this.pos.y === 0
            const s = this.pos.y === 49
            dir = e ? 'e' : w ? 'w' : n ? 'n' : s ? 's' : undefined
            //if(this.name === 'W41S4') console.log(this.name + ' ' + dir)
            const parsedFlags = parseForRoomName(this.name)
            //if(this.room.name === 'W6S71') console.log(this.name + ' flag parsedFlags ' + JSON.stringify(parsedFlags))

            const retVal = parsedFlags ? parsedFlags : dir ? this.room.neighbors(dir)[0] : undefined
            memo[key] = retVal
            return retVal
        }
        
    }()
    Flag.prototype.destRoomName = function () {
        var memo = {}
        return function () {
            const key = this.name
            if (memo[key] !== undefined) return memo[key]
        const e = this.pos.x === 49
        const w = this.pos.x === 0
        const n = this.pos.y === 0
        const s = this.pos.y === 49
        dir = e ? 'e' : w ? 'w' : n ? 'n' : s ? 's' : undefined
        //if(this.name === 'W41S4') console.log(this.name + ' ' + dir)
        const parsedFlags = parseForRoomName(this.name)

        const retVal = parsedFlags ? parsedFlags : dir ? this.room.neighbors(dir)[0] : undefined
            memo[key] = retVal
            return retVal
        }
        
    }()
    Flag.prototype.nextRoomName = function () {
        var memo = {}
        return function () {
            const key = this.name
            if (memo[key] !== undefined) return memo[key]
        const e = this.pos.x === 49
        const w = this.pos.x === 0
        const n = this.pos.y === 0
        const s = this.pos.y === 49
        dir = e ? 'e' : w ? 'w' : n ? 'n' : s ? 's' : undefined
        //if(this.name === 'W41S4') console.log(this.name + ' ' + dir)
        const parsedFlags = parseForRoomName(this.name)

        const retVal = dir ? this.room.neighbors(dir)[0] : undefined
            memo[key] = retVal
            return retVal
        }
        
    }()
    Flag.prototype.assocRoomNames = function () {
        var memo = {}
        return function () {
            const key = this.name
            if (memo[key] !== undefined) return memo[key]
        const e = this.pos.x === 49
        const w = this.pos.x === 0
        const n = this.pos.y === 0
        const s = this.pos.y === 49
        dir = e ? 'e' : w ? 'w' : n ? 'n' : s ? 's' : undefined
        //if(this.name === 'W41S4') console.log(this.name + ' ' + dir)
        const parsedFlags = [parseForRoomName(this.name)]
        const dirFlags = this.room.neighbors(dir)
        const retVal = _.uniq(parsedFlags.concat(dirFlags))

        memo[key] = retVal
            return retVal
        }
        
    }()
}
