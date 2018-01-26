
const roomNameFromFlag = _.memoize(flag => flag.name.indexOf('=') > -1 ? flag.name.slice(0, flag.name.indexOf('=')) : flag.name)
const actionMap = require('actionMap')

const nearHostiles = (range, opts) => pos => pos.findInRange(FIND_HOSTILE_CREEPS, range, opts).concat(pos.findInRange(FIND_HOSTILE_STRUCTURES, range))
const mineableSource = minerOkId => (source ) => {
    const mineralSource = source.energy === undefined
    const energyAvailable = !mineralSource && source.energy > 0
    const minePossible = energyAvailable
    const enemyCreepsClear = minePossible && source.pos.findInRange(FIND_HOSTILE_CREEPS, 5).length === 0
    const nearestLair = source.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES)
    const nearestLairSafe = !nearestLair || nearestLair.ticksToSpawn > 10
    const nearestMiners = source.pos.findInRange(FIND_MY_CREEPS, 1, {filter: m => m.id !== minerOkId})
    return minePossible && nearestLairSafe && nearestMiners.length === 0
}
const closest = refPos => (a, b) => a.pos.getRangeTo(refPos) - b.pos.getRangeTo(refPos)

module.exports = skKnight => {
    //if(skKnight.name === 'Taylor') console.log(skKnight.name + skKnight.room.name)
    if(skKnight.pos === undefined) return
    const roomStatus = Game.worldState.roomStatus[skKnight.room.name]
    //if(skKnight.name === 'Wyatt') console.log(skKnight.name + skKnight.room.name + ' ' + roomStatus)
    const action = actionMap(skKnight.pos)

    const mineRoom = roomStatus.lairs.length > 0 && roomStatus.harvestTargets.length > 0

    const followFlag = !mineRoom && roomStatus.flags
        .filter(f => f.color === COLOR_BLUE)
        .map(f => f.assocRoomName())
        .map(n => Game.worldState.roomStatus[n])
        .filter(x => x)
        .filter(s => s.skKnights.length < (s.lairs.length / 2))
        .length > 0

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
    const aTargetAvailable = attackAvailable ? missionTargets(1).concat(hostiles(1)).filter(f => f !== null) : []

    const works = soldier.has(WORK)
    const enemyWalls = roomStatus.enemyWalls.filter(e => soldier.pos.getRangeTo(e.pos) <= 1).sort((a, b) => a.hits - b.hits)
    const enemyStructures = roomStatus.enemyWalls.concat(roomStatus.enemyStructures).filter(e => soldier.pos.getRangeTo(e.pos) <= 1).sort((a, b) => a.hits - b.hits)
    if(enemyStructures.length) retVal.push(action.dismantle(enemyStructures[0]))

    //if(soldier.name === 'Ella') console.log(soldier.name + ' ' + JSON.stringify(attackFlags))

    
    //rangedAttack - rangedMassAttack - build - repair - rangedHeal
    const rAttacker = soldier.has(RANGED_ATTACK)
    const rAttackAvailable = rAttacker && rangedHealTargets.length === 0
    const rTargetAvailable = rAttackAvailable ? missionTargets().concat(hostiles()).filter(f => f !== null) : []
    const rTarg1 = rTargetAvailable.filter(e => soldier.pos.getRangeTo(e.pos) === 1).length
    const rTarg2 = rTargetAvailable.filter(e => soldier.pos.getRangeTo(e.pos) === 2).length
    const rTarg3 = rTargetAvailable.filter(e => soldier.pos.getRangeTo(e.pos) === 3).length

    const skRoom = roomStatus.skTargets.length > 0
    const skEngagedEnemy = roomStatus.soldiers.filter(s => s.pos.findInRange(FIND_HOSTILE_CREEPS, 6).length > 0)
    const skEngaged = skEngagedEnemy.length > 0
    
    const closestSk = roomStatus.skTargets.sort((a, b) => a.pos.getRangeTo(soldier.pos) - b.pos.getRangeTo(soldier.pos))
    const skDist = roomStatus.skTargets.map(t => [t.pos, t.pos.getRangeTo(soldier.pos)]).sort((a, b) => a[1] - b[1])
    const engageTarget = [].concat(closestSk)[0]
    const skFollowLeader = skRoom && !isSkLeader && !skEngaged && skLeader !== undefined
    const approachSk = skRoom && skKnight.hits >= skKnight.hitsMax && closestSk
    const separatedSquaddies = roomStatus.soldiers.filter(s => s.pos.getRangeTo(soldier.pos) > 3).sort((a, b) => a.pos.getRangeTo(soldier.pos) - b.pos.getRangeTo(soldier.pos))
    const skSquadSeparated = isSkLeader && !skEngaged && separatedSquaddies.length > 0
    const skSquadHealthy = roomStatus.soldiers.filter(s => s.hits < s.hitsMax).length === 0

    const engagementRange = skDist[0]


    const movePoss = skKnight.pos.walkableCoordsNearPos().sort((a, b) => Math.abs(a.getRangeTo(engageTarget) - 3) - Math.abs(b.getRangeTo(engageTarget) - 3))

    const healAction = healTargets.length > 0 ? action.heal(healTargets[0]) :
        rangedHealTargets.length > 0 ? action.rangedHeal(rangedHealTargets[0]) :
        ['none', undefined]

    const rAttackAction = (10 * rTarg1 + 4 * rTarg2 + rTarg3 >= 10) ? action.rangedMassAttack :
        (rTargetAvailable.length > 0) ? action.rangedAttack(rTargetAvailable[0]) :
        ['none', undefined]

    //near rampart next to flag
    const nearestExitRamparts = obj => obj.pos.findClosestByRange(FIND_MY_STRUCTURES, {filter: s => s.structureType === STRUCTURE_RAMPART && s.pos.findInRange(FIND_STRUCTURES, 0, {filter: r => r.structureType === STRUCTURE_ROAD}).length > 0})
    const waitingPos = obj => nearestExitRamparts(obj)[0].pos.walkableCoordsNearPos().filter(p => p.findInRange(FIND_STRUCTURES, 0, {filter: r => r.structureType === STRUCTURE_ROAD}).length === 0)[0]
    const localPos = () => remoteMinersNeeded.length > 0 ? waitingPos(remoteMinersNeeded[0]) : roomStatus.miners.sort((a, b) => a.ticksToLive - b.ticksToLive)[0]
    const moveAction = skEngaged && engagementRange === 3 ? ['none', undefined] :
        skEngaged ? action.position(movePoss[0]) :
        followFlag ? flagTargets.map(action.approach)[0] :
                        approachSk ? action.approach(closestSk) :
                        ['none', undefined]

  



    //const currentPosRoads = skKnight.pos.lookFor(LOOK_STRUCTURES).filter(s => s.structureType === STRUCTURE_ROAD)
    //const roadUseful = currentPosRoads.length === 0 && initialTarget.pos.findInRange(FIND_STRUCTURES, 1, {filter: s => s.structureType === STRUCTURE_ROAD}).length === 0
    //const buildRoad = roadUseful ? skKnight.pos.createConstructionSite(STRUCTURE_ROAD) : OK

    if('Peyton' === skKnight.name) console.log(skKnight.name + ' ' + skKnight.room.name + ' skKnightAction followFlag' + JSON.stringify(followFlag))
    if('Peyton' === skKnight.name) console.log(skKnight.name + ' ' + skKnight.room.name + ' skKnightAction approachSk' + JSON.stringify(approachSk))
    if('Peyton' === skKnight.name) console.log(skKnight.name + ' ' + skKnight.room.name + ' skKnightAction moveAction' + JSON.stringify(moveAction))
    //if('Riley' === skKnight.name) console.log(skKnight.name + ' ' + skKnight.room.name + ' skKnightAction unemployedMinerFilter(skKnight)' + JSON.stringify(unemployedMinerFilter(skKnight)))
    //if('Dominic' === skKnight.name) console.log(skKnight.name + ' ' + skKnight.room.name + ' skKnightAction xferAction' + JSON.stringify(xferAction))
    //if('Dominic' === skKnight.name) console.log(skKnight.name + ' ' + skKnight.room.name + ' skKnightAction pickupAction' + JSON.stringify(pickupAction))
    return [moveAction, healAction, rAttackAction]
}