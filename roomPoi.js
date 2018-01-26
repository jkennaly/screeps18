const getRoomPoi = room => {
	const myStruc = room.findMyStructures()
	const cont = room.controller ? room.controller : undefined
	const roomSources = room.findSources()
	const roomMinerals = room.findMinerals()
	const poi = myStruc.concat([cont]).concat(roomSources).concat(roomMinerals).filter(e => e !== undefined)
	return poi
}

module.exports = {
	pointsOfInterest: getRoomPoi
}