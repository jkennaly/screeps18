const actionMap = require('actionMap')
const skKnight = require('skKnight')
const coneOfSafety = defPos => leadPos => {
    const lineFormula = (pos1, pos2) => x => (po2.y - pos1.y)/(pos2.x - pos1.x) * (x - pos1.x) + pos1.y
    const leadOnEdge = leadPos.x === 0 || leadPos.y === 0 || leadPos.x === 49 || leadPos.y === 49
    const defDir = leadPos.getDirectionTo(defPos)
    const oppositeDefDir = (defDir + 3) % 8 + 1
    const adjOppDefDir = [oppositeDefDir % 8 + 1, (oppositeDefDir + 6) % 8 + 1]
    const yPlus = [TOP, TOP_RIGHT, TOP_LEFT]
    const yMinus = [BOTTOM, BOTTOM_RIGHT, BOTTOM_LEFT]
    const xPlus = [RIGHT, BOTTOM_RIGHT, TOP_RIGHT]
    const xMinus = [LEFT, TOP_LEFT, BOTTOM_LEFT]
    const posFromDir = refPos => dir => {
        const xCoord = refPos.x + (xPlus.includes(dir) ? 1 : 0) - (xMinus.includes(dir) ? 1 : 0)
        const yCoord = refPos.y + (yPlus.includes(dir) ? 1 : 0) - (yMinus.includes(dir) ? 1 : 0)
        const pos = new RoomPosition(xCoord, yCoord, refPos.roomName)
        return pos
    }

    const adjOppPos = adjOppDefDir.map(posFromDir(leadPos))
    const f = lineFormula.apply(null, adjOppPos)
    const inequality = f(defPos.x) > defPos.y ? testPos => f(testPos) < testPos.y : testPos => f(testPos) > testPos.y

    return _.memoize(inequality)
}


const defenseMove = target => {
    const findReachablePos = (startPos, checkPos) => {
        const initialCheck = startPos.findPathTo(checkPos)
        if(initialCheck !== ERR_NO_PATH) return initialCheck
        //find a constructedWall next to the checkPos
        //recurse through that

    }
    const myRoom = target.room.controller && (target.room.controller.my || target.room.controller.reservation && target.room.controller.reservation.username === Game.worldState.strat.me)
    const roomStatus = Game.worldState.roomStatus[target.room.name]
    const approachCreeps = roomStatus.enemyCreeps

}

const unitPresent = squadType => unitType => Game.worldState.empireStatus.typeComplete(unitType, squadType)
const squadPresent =  squadType => soldiers => {
    const types = _.keys(Game.worldState.strat[squadType])
    const typeTargets = types.map(t => Game.worldState.strat[squadType][t])
    const typeCheck = types.reduce((okSoFar, t, i) => okSoFar && soldiers.filter(c => c.type(t)).length >= typeTargets[i], true)
    return typeCheck
}
const squadLeader = squadType => roomStatus => roomStatus.soldiers
    .filter(s => _.keys(Game.worldState.strat[squadType]).filter(t => s.type(t)).length > 0)
    .filter(s => s.has(ATTACK) || s.has(RANGED_ATTACK))
    .sort((a, b) => a.ticksToLive - b.ticksToLive)[0]




module.exports = roomStatus => soldier => {
    if(soldier.pos === undefined) return
    //if(soldier.type('skKnight')) return skKnight(soldier)
    const action = actionMap(soldier.pos)
    const roomStatus = Game.worldState.roomStatus[soldier.room.name]
    //const posSafe = coneOfSafety
    //always
    //run from hostile attack/ranged attack creeps
    const hostileAttackers = roomStatus.enemyCreeps.length > 0
    const flags = roomStatus.flags
    const fleeFlags = flags.filter(f => f.color === COLOR_WHITE)
    const waitFlags = flags.filter(f => f.color === COLOR_CYAN)

    const attackFlags = flags.filter(f => f.color === COLOR_RED).concat(flags
        .filter(f => f.color === COLOR_BLUE || f.color === COLOR_ORANGE || f.color === COLOR_YELLOW)
        .filter(f => {
            const rs = Game.worldState.roomStatus[f.assocRoomName()]
            const rUnkown = rs === undefined
            const hostilesPresent = !rUnkown && rs.enemyCreeps.length > 0
            return rUnkown || hostilesPresent
                    })
        )

    var retVal = []

    const enemyCreeps = roomStatus.enemyCreeps
    const myRoom = soldier.room.controller && soldier.room.controller.my
    const creepTargets = myRoom || !myRoom ? enemyCreeps : []

    const friendlies = roomStatus.friendlyCreeps.filter(c => c.type('soldier'))


    //drop
    //transfer
    //withdraw
    //pickup
    //harvest - attack - build - repair - dismantle - attackController - rangedHeal - heal
    const heals = soldier.has(HEAL)
    const selfHealRate = heals ? soldier.partCount(HEAL) * 12 : 0
    const healSelf = heals && soldier.hits < (soldier.hitsMax - selfHealRate)
    //console.log(soldier.name + ' ' + healSelf)
    const friendlyWounded = heals && ! healSelf ? roomStatus.friendlyCreeps.filter(c => c.hits < c.hitsMax) : []
    const near3FriendlyWounded = friendlyWounded.filter(c => soldier.pos.getRangeTo(c.pos) <= 3).sort((a, b) => (a.hitsMax - a.hits) + (b.hitsMax - b.hits))
    const near1FriendlyWounded = near3FriendlyWounded.filter(c => soldier.pos.getRangeTo(c.pos) <= 1)
    const selfWounded = healSelf ? [soldier] : []
    const healTargets = selfWounded.concat(near1FriendlyWounded)
    const rangedHealTargets = healTargets.length === 0 ? near3FriendlyWounded : []

    const missionTargets = (r = 3) => roomStatus.missionTargets.filter(e => soldier.pos.getRangeTo(e.pos) <= r)
    const hostiles = (r = 3) => roomStatus.enemies.filter(e => soldier.pos.getRangeTo(e.pos) <= r).sort((a, b) => a.hits - b.hits)
    const attacker = soldier.has(ATTACK)
    const attackAvailable = attacker && rangedHealTargets.length === 0 && healTargets.length === 0
    const aTargetAvailable = attackAvailable ? missionTargets(1).concat(hostiles(1)).filter(f => f !== null)
        .map(t => t.pos.findInRange(FIND_HOSTILE_STRUCTURES, 0, {filter: s => s.structureType === STRUCTURE_RAMPART}).length > 0 ? t.pos.findInRange(FIND_HOSTILE_STRUCTURES, 0, {filter: s => s.structureType === STRUCTURE_RAMPART})[0] : t)
        .sort((a, b) => a.hits - b.hits) : []

    const works = soldier.has(WORK)
    const enemyWalls = roomStatus.enemyWalls.filter(e => soldier.pos.getRangeTo(e.pos) <= 1).sort((a, b) => a.hits - b.hits)
    const enemyStructures = roomStatus.enemyWalls.concat(roomStatus.enemyStructures).filter(e => soldier.pos.getRangeTo(e.pos) <= 1).sort((a, b) => a.hits - b.hits)
    //if(enemyStructures.length) retVal.push(action.dismantle(enemyStructures[0]))

    const attackSpawn = creepTargets.length === 0 && roomStatus.controller
    const enemySpawns = attackSpawn && roomStatus.enemyStructures.length ? roomStatus.enemyStructures.filter(s => s.structureType === STRUCTURE_SPAWN) : []

    //if(soldier.name === 'Madison') console.log(soldier.name + ' ' + JSON.stringify(enemySpawns))
/*
    if(healTargets.length > 0) retVal.push(action.heal(healTargets[0]))
    else if(rangedHealTargets.length > 0) retVal.push(action.rangedHeal(rangedHealTargets[0]))
        */
    //rangedAttack - rangedMassAttack - build - repair - rangedHeal
    const rAttacker = soldier.has(RANGED_ATTACK)
    const rAttackAvailable = rAttacker && rangedHealTargets.length === 0
    const rTargetAvailable = rAttackAvailable ? missionTargets().concat(hostiles()).filter(f => f !== null) : []
    const rTarg1 = rTargetAvailable.filter(e => soldier.pos.getRangeTo(e.pos) === 1).length
    const rTarg2 = rTargetAvailable.filter(e => soldier.pos.getRangeTo(e.pos) === 2).length
    const rTarg3 = rTargetAvailable.filter(e => soldier.pos.getRangeTo(e.pos) === 3).length

    const skRoom = roomStatus.skTargets.length > 0
    const skSquadAssembled = skRoom && squadPresent('skSquad')(roomStatus.soldiers)
    const skLeader = squadLeader('skSquad')(roomStatus)
    const isSkLeader = skRoom && skLeader && skLeader.name === soldier.name
    const skTarget = roomStatus.skTargets.filter(t => t.pos.findInRange(FIND_SOURCES, 5))[0]
    const skEngagedEnemy = roomStatus.soldiers.filter(s => s.pos.findInRange(FIND_HOSTILE_CREEPS, 4).length > 0)
    const skEngaged = skEngagedEnemy.length > 0
    const skPriority = skEngagedEnemy.sort((a, b) => a.hits - b.hits)
    const closestSk = roomStatus.skTargets.sort((a, b) => a.pos.getRangeTo(soldier.pos) - b.pos.getRangeTo(soldier.pos))
    const skDist = roomStatus.skTargets.map(t => [t.pos, t.pos.getRangeTo(soldier.pos)]).sort((a, b) => a[1] - b[1])
    const engageTarget = [].concat(closestSk)[0]
    const skFollowLeader = skRoom && !isSkLeader && !skEngaged && skLeader !== undefined
    const approachSk = skRoom && skSquadAssembled && isSkLeader && !skEngaged
    const separatedSquaddies = roomStatus.soldiers.filter(s => s.pos.getRangeTo(soldier.pos) > 3).sort((a, b) => a.pos.getRangeTo(soldier.pos) - b.pos.getRangeTo(soldier.pos))
    const skSquadSeparated = isSkLeader && !skEngaged && separatedSquaddies.length > 0
    const skSquadHealthy = roomStatus.soldiers.filter(s => s.hits < s.hitsMax).length === 0

    const enemiesNear = enemyCreeps.filter(c => c.pos.getRangeTo(soldier) < 4).length > 0
    const attackRoom = !enemiesNear ? attackFlags.filter(f => !f.pos.exitPos())
        .filter(p => p.pos.findInRange(FIND_STRUCTURES, 0)) : []
    const attackPos = attackRoom
    const mAttackBetter = 10 * rTarg1 + 4 * rTarg2 + rTarg3 >= 10

    const rangedEnage = soldier.has(RANGED_ATTACK) && !soldier.has(ATTACK) && enemiesNear

    const engageTarget2 = rTargetAvailable[0]
    const movePoss = soldier.pos.walkableCoordsNearPos().sort((a, b) => Math.abs(a.getRangeTo(engageTarget2) - 3) - Math.abs(b.getRangeTo(engageTarget) - 3))
    /*
    if(mAttackBetter) retVal.push(action.rangedMassAttack)
    else if(rTargetAvailable.length > 0) retVal.push(action.rangedAttack(rTargetAvailable[0]))
    else if(aTargetAvailable.length > 0) retVal.push(action.attack(aTargetAvailable[0]))
        */
    //move
    //if there is a red flag, approach it
    //if the missionTarget is a wall, and the creep has WORK, try to stand next to missiontarget
    const mT = roomStatus.missionTargets.sort((a, b) => a.pos.getRangeTo(soldier.pos) - b.pos.getRangeTo(soldier.pos))
    const freeSpaceT = mT.filter(t => t.pos.walkableCoordsNearPos().length > 0)
    const attackStaging = soldier.room.name === Game.worldState.strat.attackStaging
    const attackSquadPresent = attackStaging && squadPresent('attackSquad')(roomStatus.soldiers)
    const attackSquadStaged = attackSquadPresent && squadPresent('attackSquad')(roomStatus.soldiers.filter(s => s.pos.getRangeTo(attackFlags[0]) < 5))
    const attackWaitForSquad = attackSquadPresent && !attackSquadStaged && soldier.pos.getRangeTo(attackFlags[0]) <= 2
    const attackGo = attackStaging && !attackSquadPresent && soldier.pos.getRangeTo(attackFlags[0]) <= 5

    const avoidingCreeps = soldier.pos.findInRange(FIND_MY_CREEPS, 3).filter(c => c.id !== soldier.id)
    const avoidingCreep = avoidingCreeps.length > 0
    const avoidanceSquares = avoidingCreep && _.flatten(avoidingCreeps.map(p => p.pos.walkableCoordsNearPos()))
    const acceptableSquares = soldier.pos.walkableCoordsNearPos().filter(p => p.x === 0 || p.x === 49 || p.y === 0 || p.y === 49 || !avoidanceSquares.length || avoidanceSquares.filter(av => av.x === p.x && av.y === p.y && av.roomName === p.roomName).length === 0)
    const preferredSquares = acceptableSquares
        .filter(p => p.x === 0 || p.x === 49 || p.y === 0 || p.y === 49)
        .sort((a, b) => avoidingCreeps.reduce((maxR, avC) => _.max(maxR, a.getRangeTo(avC.pos)), 0) - avoidingCreeps.reduce((maxR, avC) => _.max(maxR, b.getRangeTo(avC.pos)), 0))
        
    const avoid = avoidanceSquares.length > 0 && preferredSquares.length > 0
    
    if(rangedEnage && movePoss.length > 0) retVal.push(action.position(movePoss[0]))
    else if(attackFlags.length > 0 && mT.length === 0 && !attackStaging) retVal.push(action.approach(attackFlags[0]))
    else if(skFollowLeader) retVal.push(action.formation(skLeader))
    else if(attackSquadPresent && !attackWaitForSquad || attackGo) retVal.push(action.approach(attackFlags[0]))
    else if(attackFlags.length > 0 && mT.length === 0 && !skRoom && !attackStaging && !enemiesNear) retVal.push(action.approach(attackFlags[0]))
    else if(approachSk && !skSquadSeparated && skLeader && (skSquadHealthy || skEngaged)) retVal.push(action.march(closestSk[0]))
    else if(skSquadSeparated && skSquadAssembled) retVal.push(['none', null])
    else if(friendlyWounded.length) retVal.push(action.march(friendlyWounded[0]))
    else if(heals && skRoom && skLeader !== undefined) retVal.push(action.approach(skLeader))
    else if(heals && hostileAttackers && skLeader !== undefined) retVal.push(action.approach(friendlies[0]))
    else if(heals && hostileAttackers && skLeader !== undefined) retVal.push(action.approach(soldier.room.focalPos()))
    else if(skRoom && skEngaged) retVal.push(action.march(engageTarget))
    //else if(skRoom && !skSquadAssembled && roomStatus.scouts.filter(s => !s.pos.exitPos()).length) retVal.push(action.approach(roomStatus.scouts.filter(s => !s.pos.exitPos())[0]))
    else if(skRoom && !skSquadAssembled) retVal.push(action.position(soldier.room.focalPos()))

    else if(works && freeSpaceT.length > 0 && freeSpaceT[0].pos.getRangeTo(soldier.pos) > 1) retVal.push(action.march(freeSpaceT[0]))
    //if not WORK, but there is a WORK present, and that WORK is not next to a wall, and there is at least 1 walkable pos, walk to it
    else if(!works && soldier.pos.nearStructure(1, STRUCTURE_WALL) && soldier.pos.walkableCoordsNearPos().length > 0 && roomStatus.friendlyCreeps.filter(c => c.soldier() && c.has(WORK) && c.pos.getRangeTo(soldier.pos) <= 3 && !c.pos.nearStructure(1, STRUCTURE_WALL)).length > 0) retVal.push(action.position(soldier.pos.walkableCoordsNearPos()[0]))
    else if(enemiesNear) retVal.push(action.march(creepTargets[0]))
    else if(attackRoom.length > 0) retVal.push(action.march(attackRoom[0]))
    else if(!creepTargets.length && enemySpawns.length > 0) retVal.push(action.march(enemySpawns[0]))
    else if(creepTargets.length && (!skLeader || skSquadHealthy)) retVal.push(action.march(creepTargets[0]))
    else if(avoid) retVal.push(['moveAlong', preferredSquares[0]])
    else if(!avoid && soldier.room.controller && soldier.room.controller.pos.getRangeTo(soldier.pos) > 7 && waitFlags.length === 0) retVal.push(action.approach(soldier.room.controller))
    else if(waitFlags.length > 0) retVal.push(action.approach(waitFlags[0]))
    //else retVal.push(action.position(soldier.room.getPositionAt(25, 25)))
    //claimController
    //suicide
    const creepsNear = soldier.pos.findInRange(FIND_MY_CREEPS, 1, {filter: c => c.name !== soldier.name})

    const moveAction = retVal.length ? retVal[0] : creepsNear.length ? creepsNear[0] : ['none', null]
    const attackAction = aTargetAvailable.length > 0 ? action.attack(aTargetAvailable[0]) : ['none', null]
    const rAttackAction = mAttackBetter ? action.rangedMassAttack : rTargetAvailable.length > 0 ? action.rangedAttack(rTargetAvailable[0]) : ['none', null]
    const healAction = healTargets.length > 0 ? action.heal(healTargets[0]) : rangedHealTargets.length > 0 ? action.rangedHeal(rangedHealTargets[0]) : ['none', null]
    const workAction = works && enemyStructures.length ? action.dismantle(enemyStructures[0]) : ['none', null]
    const retVal2 = [moveAction, attackAction, rAttackAction, healAction, workAction]


    //when carrying some energy in a reserved room
    //repair any structure within 3
    //if(soldier.name === 'Bella') console.log(soldier.name + ' moveAction ' + JSON.stringify(moveAction))
    //if(soldier.name === 'Bella') console.log(soldier.name + ' attackFlags ' + JSON.stringify(attackFlags))
    //if(soldier.name === 'Bella') console.log(soldier.name + ' mT ' + JSON.stringify(mT))
    //if(soldier.name === 'Bella') console.log(soldier.name + ' attackStaging ' + JSON.stringify(attackStaging))
    //if(soldier.name === 'Bella') console.log(soldier.name + ' retVal ' + JSON.stringify(retVal))
    return retVal2
}