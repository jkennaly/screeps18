const actionMap = require('actionMap')
const roomDefined = (worldState, roomName) => Game.rooms[roomName] !== undefined
const hostileCreepsPresent = room => room.findHostileCreeps()

const roomSafe = (worldState, roomName) => roomDefined(worldState, roomName) && hostileCreepsPresent(Game.rooms[roomName]).length === 0


var memo = {}
const roomDerivedSafe = roomName => {
    if(memo[Game.cpu.tick] && memo[Game.cpu.tick][roomName]) return memo[Game.cpu.tick][roomName]
    if(!memo[Game.cpu.tick]) memo[Game.cpu.tick] = {}
    const roomStatus = Game.worldState.roomStatus[roomName]
    const safe = roomSafe(worldState, roomName)
    const defined = roomStatus !== undefined
    const containsScouts = defined && roomStatus.scouts.length > 0
    const possessed = defined && (containsScouts || roomStatus.possessed)
    const remoteFlags = roomStatus ? roomStatus.flags.filter(f => f.color === COLOR_BLUE || f.color === COLOR_ORANGE || f.color === COLOR_PURPLE || f.color === COLOR_YELLOW) : []
    const thisRoomSafe = safe && defined && possessed
    //console.log(roomName + ' thisRoomSafe ' + thisRoomSafe )
    memo[Game.cpu.tick][roomName] = thisRoomSafe
    if(remoteFlags.length === 0 || !thisRoomSafe) return thisRoomSafe
    const remoteRoomsOk = remoteFlags.map(f => roomDerivedSafe(f.assocRoomName())).reduce((p,c) => p && c, true)
    return remoteRoomsOk
}
module.exports = roomStatus => {

    return scout => {
        if(scout.pos === undefined) return ['none', null]
        const action = actionMap(scout.pos)
        const remoteFlags = roomStatus ? roomStatus.flags.filter(f => f.color === COLOR_BLUE || f.color === COLOR_ORANGE || f.color === COLOR_PURPLE || f.color === COLOR_YELLOW) : []
        if(roomStatus.controller && (roomStatus.controller.my || scout.pos.findInRange(FIND_CREEPS, 3).length === 1) && remoteFlags.length === 0 && roomStatus.enemyCreeps.length === 0 && scout.pos.findInRange(FIND_FLAGS, 3).length === 0 && scout.pos.findInRange(FIND_STRUCTURES, 0).length === 0) return ['none', null]
        
        const neighbors = remoteFlags.map(f => f.assocRoomName()).filter(n => n && n.length)
        const uncontrolled = rs => !rs.controller || !rs.controller.my
        const neighborNeedsScout = neighbors.filter(n => !Game.worldState.roomStatus[n] || Game.worldState.roomStatus[n].scouts.length === 0 && uncontrolled(Game.worldState.roomStatus[n]))
        const flagT = remoteFlags.filter(f => f.assocRoomName() !== undefined && f.assocRoomName() !== scout.room.name).filter(f => neighborNeedsScout.indexOf(f.assocRoomName()) > -1 || Game.worldState.roomStatus[f.assocRoomName()] === undefined)
        

        //if(scout.name === 'Hunter') console.log(scout.name + ' filtered sinks: ' + JSON.stringify(roomStatus.sinkables.filter(s => !controllerFilter(s)).filter(transferableFilter)))
        //drop
        //harvest - attack - build - repair - dismantle - attackController - rangedHeal - heal
        //claimController
        //suicide
        //move
        const avoidingCreeps = scout.pos.findInRange(FIND_MY_CREEPS, 3, {filter: c => !c.type('scout')})
        const avoidingCreep = avoidingCreeps.length > 0
        const avoidanceSquares = avoidingCreep && _.flatten(avoidingCreeps.map(p => p.pos.walkableCoordsNearPos()))
        const acceptableSquares = scout.pos.walkableCoordsNearPos().filter(p => p.x === 0 || p.x === 49 || p.y === 0 || p.y === 49 || !avoidanceSquares.length || avoidanceSquares.filter(av => av.x === p.x && av.y === p.y && av.roomName === p.roomName).length === 0)
        const preferredSquares = acceptableSquares
            .sort((a, b) => avoidingCreeps.reduce((maxR, avC) => _.max(maxR, a.getRangeTo(avC.pos)), 0) - avoidingCreeps.reduce((maxR, avC) => _.max(maxR, b.getRangeTo(avC.pos)), 0))
        const still = !flagT.length && scout.pos.findInRange(FIND_CREEPS, 3).length === 1
        const approachFlag = !still && flagT.length > 0
        //const approachFocalPos = !still && !approachSink && !approachSource && !approachFlag

        const flyingSolo = roomStatus.scouts.length === 1

        const hostilesPresent = roomStatus.enemyCreeps.length > 0
        const nearestEnemy = roomStatus.enemyCreeps.sort((a, b) => a.pos.getRangeTo(scout) - b.pos.getRangeTo(scout))[0]
        const enemyRange = hostilesPresent ? nearestEnemy.pos.getRangeTo(scout) : 0
        const avoidPos = hostilesPresent ? scout.pos.walkableCoordsNearPos().filter(p => !p.exitPos() && p.getRangeTo(nearestEnemy) > 3) : []
    
        const moveAction = avoidPos.length && !approachFlag ? ['moveTo', avoidPos[0]] :
                        flyingSolo && !approachFlag  && !avoidingCreep ? ['moveAlong', scout.room.focalPos()] :
                        approachFlag ? [flagT[0]].map(action.approach)[0] :
                        avoidanceSquares.length > 0 && preferredSquares.length > 0 ? ['moveTo', preferredSquares[0]] :
                        still ? ['none', null] :
                        ['moveAlong', scout.room.focalPos()]

        const retVal = [moveAction]
    
        //console.log(scout.name + ' ' + scout.room.name + ' retVal ' + JSON.stringify(retVal))
        //if(scout.name === 'Christopher') console.log(scout.name + ' flagT ' + JSON.stringify(flagT))
        //if(scout.name === 'Allison') console.log(scout.name + ' neighbors ' + JSON.stringify(neighbors))
        //if(scout.name === 'Allison') console.log(scout.name + ' scout.room.name ' + JSON.stringify(scout.room.name))
        //if(scout.name === 'Allison') console.log(scout.name + ' still ' + JSON.stringify(still))
        //if(scout.name === 'Allison') console.log(scout.name + ' avoidPos.length && !approachFlag ' + JSON.stringify(avoidPos.length && !approachFlag))
        //if(scout.name === 'Allison') console.log(scout.name + ' flyingSolo && !approachFlag  && !avoidingCreep ' + JSON.stringify(flyingSolo && !approachFlag  && !avoidingCreep))
        //if(scout.name === 'Allison') console.log(scout.name + ' avoidanceSquares.length > 0 && preferredSquares.length > 0 ' + JSON.stringify(avoidanceSquares.length > 0 && preferredSquares.length > 0))
        //if(scout.name === 'Allison') console.log(scout.name + ' moveAction ' + JSON.stringify(moveAction))
        //if(scout.name === 'Allison') console.log(scout.name + ' neighborNeedsScout ' + JSON.stringify(neighborNeedsScout))
        //if(scout.name === 'Allison') console.log(scout.name + ' approachFlag ' + JSON.stringify(approachFlag))
    
        return retVal



}}