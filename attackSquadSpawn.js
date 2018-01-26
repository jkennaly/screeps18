module.exports = (worldState, roomName) => {
    const squad = Game.worldState.strat.attackSquad
    const stagingRoom = Game.rooms[Game.worldState.strat.attackStaging]
    const stagedCreeps = stagingRoom.find(FIND_MY_CREEPS)
    //const squadTypeCreeps = stagedCreeps.filter(c => )
}