const roomPoi = require('roomPoi')
const worldReady = game => worldState => game.cpu.bucket > 9900
const civOffroad= room => room.findMyCreeps({filter: c => c.type('transport') && c.status('full') && !c.status('onRoad')}).length > 0
const frontierOffroad = room => room.findMyCreeps({filter: c => (c.type('transport') || c.type('workhorse')) && c.status('full') && !c.status('onRoad')}).length > 0
const creepOffroading = room => room.frontier() ? frontierOffroad(room) : civOffroad(room)
const roomReady = room => room.energyAvailable === room.energyCapacityAvailable && room.findMyConstructionSites().length === 0 && creepOffroading(room)
const pointRange = rMax => p1 => p2 => Math.abs(p1.x - p2.x) <= rMax && Math.abs(p1.y - p2.y) <= rMax
const pointsAdjacent = p1 => p2 => pointRange(1)(p1)(p2)
const mapToPos = room => s => room.getPositionAt(s.x, s.y)
const pathEndPointsNearPoi = room => path => {
	if (path.length < 2) return false
	const poi = roomPoi.pointsOfInterest(room).map(p => p.pos)
	const endpoints = [path[0], path[path.length - 1]].map(e => room.getPositionAt(e.x, e.y))
	const endpointsNearPoi = endpoints.map(e => poi.map(pointsAdjacent(e) ).reduce((prev, cur) => prev || cur, false)).reduce((prev, cur) => prev && cur, true)
	return endpointsNearPoi
}
const pathArray = pathLibrary => {
	const firstKeys = Object.keys(pathLibrary)
	const firstObjs = firstKeys.map(k => pathLibrary[k])
	const secKeys = firstObjs.map(Object.keys)
	const secArrays = firstObjs.map((o, i) => secKeys[i].map(k => o[k]))
	const pathArray = secArrays.reduce((prev, cur) => prev.concat(cur), [])
		//console.log('roomRoads 21')
		//console.log(pathArray[0][0])
	return pathArray
}
const posMissingRoad = pos => pos.findInRange(FIND_STRUCTURES, 1, {filter: s => s.structureType === STRUCTURE_ROAD}).length === 0
const pathApproachesController = room => path => room.controller === undefined ? true : path.reduce((prev, cur) => prev || pointRange(3)(room.controller.pos)(cur), false)
const pathClear = room => path => path.map(mapToPos(room)).filter(p => p.walkable({ignoreCreeps: true})).length === path.length
const pathNeedsConstruction = room => path => path.map(mapToPos(room)).filter(p => p.lookFor(LOOK_STRUCTURES).filter(l => l.structureType === STRUCTURE_ROAD).length <= 0).length > 0
const pathEligible = room => path => i => {
	//const pathNearContr = pathApproachesController(room)(path) 
	//const epOk = pathEndPointsNearPoi(room)(path) 
	const poiMissingRoad = roomPoi.pointsOfInterest(room).map(p => p.pos).filter(posMissingRoad)
	const clear = pathClear(room)(path.slice(1, (path.length - 2)))
	const useful = pathNeedsConstruction(room)(path.slice(1, (path.length - 2)))
	const emptyDestination = poiMissingRoad.reduce((prev, cur) => prev || path.filter(s => pointsAdjacent(cur)(s)).length > 0, false)

	//console.log('roomRoads 34 path ' + i)
	//console.log('near ctr ' + pathNearContr)
	//console.log('endpoints OK ' + epOk)
	//console.log('clear ' + clear)
	//console.log('useful ' + useful)
	return clear && useful && emptyDestination
}
const chooseRoadFromPaths = game => worldState => room => pathLibrary => worldReady(game)(worldState) && roomReady(room) ? pathArray(pathLibrary).reduce((prev, cur, i) => prev.length < 2 && pathEligible(room)(cur)(i) ? cur : prev, []) : []
const buildRoadAlongPath = room => path => path.map(s => room.createConstructionSite(s.x, s.y, STRUCTURE_ROAD))

module.exports = {
	choosePath: chooseRoadFromPaths,
	buildRoad: buildRoadAlongPath,
	ready: game => worldState => room => worldReady(game)(worldState) && roomReady(room)
}