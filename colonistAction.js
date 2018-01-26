const actionMap = require('actionMap')
const actionObject = (actionMap, targetSort) => targetArray => {
    const useSort = typeof targetSort === 'function' ? targetSort : (a, b) => 0
    const mappedArray = targetArray.sort(useSort).map(actionMap)
    const retVal = mappedArray.length > 0 ? {
        action: mappedArray[0][0],
        target: mappedArray[0][1],
        statement: mappedArray[0][2],
        param: mappedArray[0][3]

    } : undefined
    return retVal
}
const actionObjectsFunc = (action) => {return {
    settle: (ar) => actionObject(action.settle)(ar),
    suckLink: (ar) => actionObject(action.withdrawEnergy)(ar),
    suckContainer: (ar) => actionObject(action.withdrawEnergy)(ar),
    repair: (ar) => actionObject(action.repair)(ar),
    build: (ar) => actionObject(action.build)(ar),
    upgrade: (ar) => actionObject(action.controller)(ar),
    fillContainer: (ar) => actionObject(action.transferEnergy)(ar),
    suicide: () => actionObject(action.suicide),
    colonize: (controller) => actionObject(action.claim)([controller])
}}

module.exports = worldState => colonist => {
    const colonistStart = Game.cpu.getUsed()
    //if(colonist.pos === undefined) return {action: 'suicide'}
    const action = actionMap(colonist.pos)
    const actionObjects = actionObjectsFunc(action)
    const roomStatus = Game.worldState.roomStatus[colonist.room.name]
    const colonyFlags = roomStatus.flags.filter(f => f.color === COLOR_ORANGE || f.color === COLOR_YELLOW)
        .filter(f => Game.worldState.empireStatus.roomsNeedColonist.indexOf(f.assocRoomName()) > -1 || Game.rooms[f.assocRoomName()] === undefined || !Game.rooms[f.assocRoomName()].controller.my)
    const cityFlags = roomStatus.flags.filter(f => f.color === COLOR_GREEN)
    //const colonistT1 = Game.cpu.getUsed()
    //const colonistT2 = Game.cpu.getUsed()
    //const colonistT3 = Game.cpu.getUsed()
    //console.log(roomStatus.controller.my)
    const stratSaysGo = Game.worldState.strat.colony.indexOf(colonist.room.name) > -1 || Game.worldState.strat.wildcat.indexOf(colonist.room.name) > -1
    const colonizeThisRoom = colonist.room.controller && !colonist.room.controller.my && (stratSaysGo || colonyFlags.length === 0)
 //return ['none', null]
    const colonistFinish = Game.cpu.getUsed()
    //console.log(colonist.name + ' times: t1: ' + (colonistT1 - colonistStart) + ' t2: ' + (colonistT2 - colonistT1) + ' t3: ' + (colonistT3 - colonistT2) + ' fin: ' + (colonistFinish - colonistT3))
    //if(colonist.name === 'Colton') console.log(colonist.name + ' long eval ' + JSON.stringify(colonistFinish - colonistStart))
    if(colonizeThisRoom) return actionObjects.colonize(colonist.room.controller)
    if(colonyFlags.length) return actionObjects.settle(colonyFlags)
    if(cityFlags.length) return actionObjects.settle(cityFlags)

    return actionObjects.settle([colonist.pos])

}