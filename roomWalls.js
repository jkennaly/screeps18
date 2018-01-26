//get wallTargets: For each walkable coord with a 0 or a 49 in it, get each walkableCoordNearPos that has neither a 0 or a 49, and condense to uniques. for each of those pos,
//		get each walkableCoordNearPos that has none of: 0, 1, 48, or 49, and condense to unique
//sort each wallTarget into: corners(x and y are 2 and/or 47), edge-x2(x=2, y not 2 or 47), edge-x47(x=47, y not 2 or 47), edge-y2(y=2, x not 2 or 47), edge-y47(y=47, x not 2 or 47)
//secure existing structures: For each walltarget that contains a structure already, build a rampart.
//For each of the edge groups, designate at least one gate:
//		Every road structure or road construction site is considered a gate
//			If there is not at least one road structure or construction site already, create one at the following location:
const includesCoord = coordArray => pos => coordArray.indexOf(pos.x) > -1 || coordArray.indexOf(pos.y) > -1
const nearestRoadDistance = (pos) => {
	//console.log(pos)
	const nearestRoad = pos.findClosestByPath(FIND_STRUCTURES, s => s.structureType === STRUCTURE_ROAD)
	return nearestRoad !== undefined ? nearestRoad.pos.getRangeTo(pos) : undefined
}
const roadTest = pos => pos && pos.look().filter(l => l.type === LOOK_STRUCTURES || l.type === LOOK_CONSTRUCTION_SITES).filter(s => s[s.type].structureType === STRUCTURE_ROAD).length > 0
const rampartTest = pos => pos && pos.look().filter(l => l.type === LOOK_STRUCTURES || l.type === LOOK_CONSTRUCTION_SITES).filter(s => s[s.type].structureType === STRUCTURE_RAMPART).length > 0
const constructionSiteFree = pos => pos && pos.lookFor(LOOK_CONSTRUCTION_SITES).length === 0
const baseRoad = edge => {
	if (edge.length === 0) return undefined
		//console.log('baseRoad edge roomWalls 18 ' + JSON.stringify(edge))
	const dist = nearestRoadDistance(edge[0])
	if (dist !== undefined) return edge[0]
	return baseRoad(edge.slice(1))
}
const bestRoad = edge => baseRoad => rMax => type => {
	if (edge.length === 0) return baseRoad
	const nextRoads = edge[0].findInRange(FIND_STRUCTURES, rMax, {filter: {structureType: type}})
	if (nextRoads.length === 0) return bestRoad(edge.slice(1))(baseRoad)(rMax)(type)
	const bestDist = nearestRoadDistance(edge[0])
	return bestRoad(edge.slice(1))(edge[0])(bestDist)(type)
}
const gatePositions = edges => {
	const proposeGate = edge => () => {
		const startRoadPos = baseRoad(edge)
		const rMax = nearestRoadDistance(startRoadPos)
		const type = STRUCTURE_ROAD
		return bestRoad(edge)(startRoadPos)(rMax)(type)
	}
	const retVal =  edges.reduce((prev, cur) => prev.concat(cur.findInRange(FIND_MY_STRUCTURES, 0, {filter: s => s.structureType === STRUCTURE_RAMPART}).length > 0 || cur.findInRange(FIND_STRUCTURES, 0, {filter: s => s.structureType === STRUCTURE_ROAD}).length > 0 ? [cur] : []), [])
		//.map(g => g())
		//.reduce((prev, cur) => prev.concat(cur), []) 
	//console.log('' + 'roomWalls 42 retVal: ' + JSON.stringify(retVal))
	
	return retVal
}
const edgeCoord = edgePos => testPos => edgePos.x === 2 && testPos.x === 1 || edgePos.y === 2 && testPos.y === 1 || edgePos.x === 47 && testPos.x === 48 || edgePos.y === 47 && testPos.y === 48
const coreCoord = edgePos => testPos => edgePos.x === 2 && testPos.x === 3 || edgePos.y === 2 && testPos.y === 3 || edgePos.x === 47 && testPos.x === 46 || edgePos.y === 47 && testPos.y === 46
const edgePosFilter = pos => {
    const exitSideWalakables = pos.walkableCoordsNearPos().filter(edgeCoord(pos))
    const coreSideWalkables = pos.walkableCoordsNearPos().filter(coreCoord(pos))
    const retVal = exitSideWalakables.length > 0 && coreSideWalkables.length > 0
    return retVal
}
const wallBuild = edges => edges.filter(p => p.lookFor(LOOK_STRUCTURES).filter(s => s.structureType === STRUCTURE_RAMPART).length === 0).map(p => p.createConstructionSite(STRUCTURE_WALL))
const gateBuild = room => {
	if(Game.cpu.getUsed() > 25) return false
	const ar1_48 = _.range(48).map(x => x + 1)
     const edge_x0 = room.findExitTo(room.neighbors('w')[0]) === FIND_EXIT_LEFT  ? ar1_48.map(e => room.getPositionAt(2, e)).filter(edgePosFilter) : []
     const edge_y0 = room.findExitTo(room.neighbors('n')[0]) === FIND_EXIT_TOP ? ar1_48.map(e => room.getPositionAt(e, 2)).filter(edgePosFilter) : []
     const edge_x49 = room.findExitTo(room.neighbors('e')[0]) === FIND_EXIT_RIGHT ? ar1_48.map(e => room.getPositionAt(47, e)).filter(edgePosFilter) : []
     const edge_y49 = room.findExitTo(room.neighbors('s')[0]) === FIND_EXIT_BOTTOM ? ar1_48.map(e => room.getPositionAt(e, 47)).filter(edgePosFilter) : []
     const edges = [].concat(edge_x0).concat(edge_x49).concat(edge_y0).concat(edge_y49)
            
	//if(room.name === 'W6S71') console.log('roomWalls 63 room.neighbors-n ' + JSON.stringify(room.neighbors('n')) + ' ' + JSON.stringify(room.findExitTo(room.neighbors('n')[0]) > 0))	
	//console.log(room.name + 'roomWalls 42 edges: ' + JSON.stringify(edges))
	const gates = gatePositions(edges)
	//console.log(room.name + 'roomWalls 42 gates: ' + JSON.stringify(gates))
	
	const gatesNeedRoads = gates.filter(g => g && !roadTest(g)).filter(constructionSiteFree).map(g => g.createConstructionSite(STRUCTURE_ROAD))
	const gatesNeedRamparts = gates
		.filter(g => roadTest(g))
		.filter(g => !rampartTest(g))
		.filter(constructionSiteFree)
		.map(g => g.createConstructionSite(STRUCTURE_RAMPART))

	//console.log(room.name + 'roomWalls 42 gatesNeedRamparts: ' + JSON.stringify(gatesNeedRamparts))
	

	const roadsComplete = gatesNeedRoads.length === 0
	const rampartsComplete = gatesNeedRamparts.length === 0
	const gatesComplete = roadsComplete && rampartsComplete

	return gatesComplete ? wallBuild(edges) : false
}

module.exports = {
	gateBuild: gateBuild
}