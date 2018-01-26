const funcs = require('funcs')
const fr = require('funcsReduce')
const targeting = require('targeting')
const creepsNeeded = require('creepsNeeded')
const strucLink = require('strucLink')
const strucTerminal = require('strucTerminal')

const creepBodyCost = creep => creep.body.reduce((total, part) => total + BODYPART_COST[part.type], 0)
const group = {
    superTransport: [MOVE, CARRY, CARRY, CARRY, CARRY],
    skMiner: [CARRY, CARRY, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
    remoteMiner: [MOVE, MOVE, WORK, WORK, WORK, WORK, CARRY, MOVE, WORK, WORK, CARRY, CARRY],
    smallMiner: [MOVE, MOVE, WORK, WORK, WORK, WORK, CARRY, MOVE, WORK, WORK],
    tinyMiner: [MOVE, MOVE, WORK, WORK, WORK, WORK, CARRY],
    workhorse: [MOVE, CARRY, WORK],
    fastMelee: [MOVE, MOVE, MOVE, MOVE, MOVE, ATTACK],
    melee: [MOVE, ATTACK],
    defMelee: [ATTACK, MOVE, MOVE, ATTACK],
    slowMelee: [MOVE, ATTACK, ATTACK],
    skKnight: [TOUGH, TOUGH, RANGED_ATTACK, HEAL, MOVE, MOVE],
    skMelee: [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK],
    claimJumper: [MOVE, CLAIM],
    colonist: [MOVE, MOVE, CLAIM],
    support: [MOVE, MOVE, HEAL, RANGED_ATTACK],
    barricadeMan: [MOVE, HEAL, RANGED_ATTACK],
    healer: [MOVE, HEAL, HEAL],
    fastHeal: [HEAL, MOVE],
    scout: [MOVE],
    wallBreaker: [TOUGH, TOUGH, TOUGH, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
    transport: [MOVE, CARRY, CARRY],
    towerTender: [MOVE, MOVE, CARRY, CARRY],
    staticWorker: [CARRY, MOVE, WORK, WORK, WORK, WORK, WORK, CARRY, WORK, CARRY, WORK, WORK, WORK, CARRY, WORK, WORK, WORK, WORK, WORK, WORK, MOVE, MOVE],
    smallWorker: [CARRY, MOVE, WORK, WORK, WORK, WORK, CARRY, WORK, WORK, CARRY, WORK, WORK, WORK],
    tinyWorker: [CARRY, MOVE, WORK, WORK, WORK, WORK, CARRY, WORK, WORK],
    miniWorker: [CARRY, MOVE, WORK, WORK, WORK, WORK, CARRY],
    quickWorker: [CARRY, MOVE, WORK, CARRY, CARRY, CARRY],
    towerCrasher: [TOUGH, MOVE, MOVE, MOVE, MOVE, MOVE, ATTACK, HEAL, HEAL, HEAL],
    privateer: [TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,HEAL,HEAL,HEAL,HEAL],
    chewer: [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY]
}
    //pure
const suggestCreep = (room, opts = { type: 'workhorse' }, capOffset = 0) => {
    if(room === undefined) return
    const roomCapacity = room.energyCapacityAvailable - capOffset
        //console.log(JSON.stringify(opts.fixed))
    const fixed = opts.fixed !== undefined ? opts.fixed : 0
    const cap = opts.cap !== undefined ? opts.cap : 50
        //no. of creeps is very low
        //if (room.energyAvailable <= 300 || roomCapacity <= 300) return [MOVE, CARRY, WORK]
    const groupUnitCost = group[opts.type].reduce((total, part) => total + BODYPART_COST[part], 0)
        //console.log(groupUnitCost)
    const numberOfGroups = _.min([fixed === 0 ? Math.floor(roomCapacity / groupUnitCost) : fixed, Math.floor(cap / group[opts.type].length)])
        //console.log(roomCapacity)
        //default
    return funcs.creepExpander(group[opts.type])(numberOfGroups)
}
//impure-issues commands to the game
const spawnCreep = (function() {
    var lastType = {}
    return (spawnPoint, opts = { type: 'workhorse' }, capOffset = 0) => {
        if (spawnPoint === undefined || spawnPoint.canCreateCreep === undefined) return
        lastType[spawnPoint.id] = opts.type
        //console.log(JSON.stringify(spawnPoint.name + ' structures 62 ' + opts.type))
        const fixed = opts.fixed !== undefined ? opts.fixed : 0
        const potentialCreep = suggestCreep(spawnPoint.room, opts, capOffset)
        if(fixed > 0) return spawnPoint.createCreep(potentialCreep)
        //console.log(JSON.stringify(potentialCreep))
        const spawnPermitted = spawnPoint.canCreateCreep(potentialCreep)
            //console.log(JSON.stringify(spawnPoint.room.energyAvailable))
        //console.log(spawnPoint.room.name + ' capOffset ' + capOffset)
        //console.log(spawnPoint.room.name + ' spawnPoint.room.energyCapacityAvailable ' + spawnPoint.room.energyCapacityAvailable)
        const retryError = spawnPermitted !== 0 && (spawnPermitted === ERR_NOT_ENOUGH_ENERGY || spawnPermitted === ERR_INVALID_ARGS)
        //if(retryError) console.log(spawnPoint.room.name + ' potentialCreep ' + spawnPermitted + ' ' + JSON.stringify(potentialCreep))
        if (!retryError || capOffset >= spawnPoint.room.energyCapacityAvailable) return spawnPoint.createCreep(potentialCreep)
        if (retryError) spawnCreep(spawnPoint, opts, capOffset + 100)
        return spawnPoint.createCreep(potentialCreep)
    }})()
const creepsNearObject = obj => funcs.nearCreeps(2)(obj.pos)
const creepTypes = [

//[type, body chunk, def Opts arg, def spawnPermitted function]
    ['fastMelee', [MOVE, MOVE, MOVE, MOVE, MOVE, ATTACK], {type: 'fastMelee', fixed: undefined}],
    ['melee', [MOVE, ATTACK], {type: 'melee', fixed: undefined}],
    ['slowMelee', [MOVE, ATTACK, ATTACK], {type: 'slowMelee', fixed: undefined}],
    ['skMelee', [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK], {type: 'skMelee', fixed: 1}],
    ['skKnight', [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL], {type: 'skKnight', fixed: 1}],
    ['support', [MOVE, MOVE, HEAL, RANGED_ATTACK], {type: 'support', fixed: undefined}],
    ['barricadeMan', [MOVE, HEAL, RANGED_ATTACK], {type: 'barricadeMan', fixed: undefined}],
    ['healer', [MOVE, HEAL, HEAL], {type: 'healer', fixed: undefined}],
    ['fastHeal', [HEAL, MOVE], {type: 'fastHeal', fixed: undefined}],
    ['wallBreaker', [TOUGH, TOUGH, TOUGH, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], {type: 'wallBreaker', fixed: undefined}],
    ['towerCrasher', [TOUGH, MOVE, MOVE, MOVE, MOVE, MOVE, ATTACK, HEAL, HEAL, HEAL], {type: 'towerCrasher', fixed: 5}],
    ['privateer', [TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,HEAL,HEAL,HEAL,HEAL], {type: 'privateer', fixed: 1}],
    ['chewer', [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY], {type: 'chewer', fixed: 1}]
    ['skMiner', [CARRY, CARRY, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], {type: 'skMiner', fixed: 1}],
    ['staticWorker', [CARRY, MOVE, WORK], {type: 'staticWorker', fixed: 1}],
    ['staticWorker', [CARRY, MOVE, WORK], {type: 'smallWorker', fixed: 1}],
    ['staticWorker', [CARRY, MOVE, WORK], {type: 'tinyWorker', fixed: 1}],
    ['staticWorker', [CARRY, MOVE, WORK], {type: 'miniWorker', fixed: 1}],
    ['staticWorker', [CARRY, MOVE, WORK], {type: 'quickWorker', fixed: 1}],
    ['superTransport', [MOVE, CARRY, CARRY, CARRY, CARRY], {type: 'superTransport', fixed: undefined}],
    ['workhorse', [MOVE, CARRY, WORK], {type: 'workhorse', fixed: undefined}],
    ['transport', [MOVE, CARRY, CARRY], {type: 'transport', fixed: undefined, cap: 30}],
    ['claimJumper', [MOVE, CLAIM], {type: 'claimJumper', fixed: undefined, cap: 10}],
    ['remoteMiner', [MOVE, MOVE, WORK, WORK, WORK, WORK, CARRY], {type: 'remoteMiner', fixed: 1}],
    ['remoteMiner', [MOVE, MOVE, WORK, WORK, WORK, WORK, CARRY], {type: 'smallMiner', fixed: 1}],
    ['remoteMiner', [MOVE, MOVE, WORK, WORK, WORK, WORK, CARRY], {type: 'tinyMiner', fixed: 1}],
    ['towerTender', [MOVE, MOVE, CARRY, CARRY], {type: 'towerTender', fixed: undefined, cap: 8}],
    ['scout', [MOVE], {type: 'scout', fixed: 1}],
    ['colonist', [MOVE, MOVE, CLAIM], {type: 'colonist', fixed: 1}],
    ['defMelee', [ATTACK, MOVE, MOVE, ATTACK], {type: 'defMelee', fixed: undefined, cap: 12}]
]
const expansion = worldState => structure => {
    const roomStatus = Game.worldState.roomStatus[structure.room.name]
    const unoccupiedOutposts = Game.worldState.strat.outpost.filter(s => Game.rooms[s] === undefined)
    const dangerRooms = Game.worldState.strat.outpost.filter(s => Game.rooms[s] !== undefined).map(s => Game.rooms[s]).filter(r => r.find(FIND_HOSTILE_CREEPS).length)
    const inDanger = dangerRooms.includes(structure.room.name)

    if (structure.structureType === STRUCTURE_SPAWN) {
        if (roomStatus.activeSpawn && structure.id === roomStatus.activeSpawn.id) {
            //console.log(creepsNeeded(worldState, structure.room.name)('workhorse'))
            //console.log(structure.room.name + ' ')
            if (!structure.spawning && structure.room.energyCapacityAvailable >= 550) {
                const outpostFlags = roomStatus.flags.filter(f => f.color === COLOR_BLUE || f.color === COLOR_ORANGE)
                if (funcs.getCurrentCreepCount(structure.room) < 1 ) console.log('spawnCreep roomEmpty result: ' + spawnCreep(structure))
                const markTime = Game.cpu.getUsed()
                //const creepsNeededSpawn = worldState => outpostFlags => structure => type => creepsNeeded(worldState, structure.room.name, { excess: outpostCreepsNeeded(worldState)(outpostFlags)(type).filter(f => f).length })(type)
                const creepTypesNeeds = worldState => structure => creepTypes.filter(x => x && x.length).map(x => [x[0], x[1], x[2], creepsNeeded(structure.room.name)(x[2].type)])
              spawnPermissive = (type, roomObject, roomStatus) => (roomObject.room.energyAvailable >= roomObject.room.energyCapacityAvailable) || (roomStatus.transports.length === 0 && (roomStatus.friendlyCreeps.length > 0 && type === 'transport' || type === 'workhorse')) || (roomStatus.miners.length === 0 && type === 'remoteMiner') || type === 'defMelee' || type === 'scout'

                //console.log('Game.worldState.empireStatus.armyComplete ' + Game.worldState.empireStatus.armyComplete)
                //if(alreadySpawningTypes.length) console.log(roomStatus.name + ' ' + structure.name + ' ' + ' alreadySpawningTypes ' + JSON.stringify(alreadySpawningTypes))
                const checkTime = Game.cpu.getUsed()

                if(roomStatus.spawningSpawns.length > 0) console.log('structures 134 already spawning in ' + roomStatus.name + ' ' + JSON.stringify(roomStatus.spawningCreeps.map(c => c.type())))


                const alreadySpawningTypes = roomStatus.spawningCreeps.map(c => c.type())
                //console.log('Game.worldState.empireStatus.armyComplete ' + Game.worldState.empireStatus.armyComplete)
                //if(alreadySpawningTypes.length) console.log(roomStatus.name + ' ' + structure.name + ' ' + ' alreadySpawningTypes ' + JSON.stringify(alreadySpawningTypes))
                const creepNeeds = creepTypesNeeds(worldState)(structure).filter(x => x !== undefined).filter(x => x[3]).filter(x => alreadySpawningTypes.indexOf(x[0]) < 0)
                //if(structure && structure.name && structure.name === 'Spawn7') console.log(structure.name + ' staticWorker spawnPermissive ' + JSON.stringify(spawnCreep(worldState, structure, {type: 'staticWorker', fixed: 1})))
                const creepNeedsReport = creepNeeds.map((x, i) => '' + i +'-' + x[0])
                if(creepNeedsReport.length) console.log(structure.name + JSON.stringify(creepNeedsReport))
                //if(creepNeedsReport.length) console.log('structures 119 creepTypeArray ' + JSON.stringify(creepNeeds))
                //if(structure.name === 'Spawn1') console.log('spawnPermissive for 3 ' + JSON.stringify(creepNeeds[2][0]))
                creepNeeds.map(creepTypeArray => spawnPermissive(creepTypeArray[0], structure, roomStatus) ? spawnCreep(structure, creepTypeArray[2]) : false)
                //console.log('creepsNeeded Time ' + (checkTime - markTime))
                    //console.log(structure.name + ' spawnPermissive for type ' + creepTypeArray[0]+ ' ' + JSON.stringify(spawnPermissive(structure)(creepTypeArray[0])(worldState)))
                if(roomStatus.workhorses.length === 0 && (structure.room.controller.level < 3)) console.log('spawnCreep critically lowPop result: ' + spawnCreep(structure))
            
                const creepBuildSlow = roomStatus.storage && roomStatus.storage[RESOURCE_ENERGY] > 10000 && structure.room.energyAvailable < structure.room.energyCapacityAvailable && structure.room.energyCapacityAvailable > 2000 && structure.room.energyAvailable >= 2000
                if(creepBuildSlow) spawnCreep(structure, {type: 'transport', fixed: 10, cap: 30})
            }

            if (!structure.spawning && (structure.room.energyCapacityAvailable < 550)) {
                //console.log('test')
                if (funcs.getCurrentCreepCount(structure.room) < 1) console.log('spawnCreep roomEmpty result: ' + spawnCreep(structure))
                const nonHostileSources = roomStatus.harvestTargets
                const numberOfWalkablePos = _.sum(nonHostileSources.map(v => v.pos.walkableCoordsNearPos().length))
                const targetCreepCount = numberOfWalkablePos
                //console.log(structure.room.name + 'structures 167 targetCreepCount ' + JSON.stringify(targetCreepCount))
                //console.log(structure.room.name + 'structures 167 nonHostileSources ' + JSON.stringify(nonHostileSources.map(v => v.pos).map(p => p.walkableCoordsNearPos())))
                if ((roomStatus.workhorses.length < targetCreepCount) && (structure.room.energyAvailable >= structure.room.energyCapacityAvailable)) console.log('spawnCreep lowPop result: ' + spawnCreep(structure))
                if (roomStatus.workhorses.length + 1 < targetCreepCount) console.log('spawnCreep critically lowPop result: ' + spawnCreep(structure))
            
            }
        } 
        if(!structure.spawning && structure.room.energyAvailable >= structure.room.energyCapacityAvailable) {
            const cutoff = _.min([1000, roomStatus.transports.reduce((pv, cv) => cv.carryCapacity > pv ? cv.carryCapacity : pv, 0)])
            const atFloor = roomStatus.transports.length <= roomStatus.containers.length
            const nearCreeps = structure.pos
                .findInRange(FIND_MY_CREEPS, 1, {filter: c => !c.boosted() && c.ticksToLive < 1400 && c.type('transport') && c.carryCapacity >= cutoff})
                .sort((a, b) => a.ticksToLive - b.ticksToLive)
            if(nearCreeps.length && atFloor) structure.renewCreep(nearCreeps[0])
        }
    }
    else if (structure.structureType === STRUCTURE_TOWER) {
        //console.log('test')
        var tower = structure
        const baseCreeps = roomStatus.enemyCreeps.filter(c => c.owner.username === 'Invader' || !c.pos.exitPos())
        const healerEnemies = baseCreeps.filter(c => c.has(HEAL)).sort((a, b) => a.hits - b.hits)
        const regularEnemies = baseCreeps.filter(c => !c.has(HEAL)).sort((a, b) => a.hits - b.hits)
        const composedEnemyCreeps = healerEnemies.reduce((p, c, i, a) => {
            const lastHealer = i === a.length
            const regDefined = regularEnemies[i] !== undefined
            const nextEl = !lastHealer ? [c, (regDefined ? regularEnemies[i] : [])] : [c].concat((regDefined ? regularEnemies.slice(i) : []))
            return p.concat(nextEl)
        }, healerEnemies.length ? [] : regularEnemies)
        const towerTargetRank = roomStatus.towers.reduce((p, c, i) => c.id === tower.id ? i % composedEnemyCreeps.length: p, 0)
        const proposedAttackTarget = composedEnemyCreeps.length ? composedEnemyCreeps[towerTargetRank] : baseCreeps.length ? baseCreeps : []
        const attackTarget = composedEnemyCreeps.length ? [proposedAttackTarget] : []
        const healTarget = !attackTarget.length ? tower.room.find(FIND_MY_CREEPS, { filter: (structure) => structure.hits < structure.hitsMax })
            .reduce(fr.lowestHits, false) : false
        if (healTarget) tower.heal(healTarget)
            //console.log('room attackTarget: ' + JSON.stringify(attackTarget))
        const repairTarget = !attackTarget.length && !healTarget && tower.energy > 0.5 * tower.energyCapacity && roomStatus.tenders.length > 0 ? roomStatus.structuresNeedRepair
            .reduce(fr.lowestHits, false) : false
            //console.log(repairTarget)
        if (repairTarget) {
            tower.repair(repairTarget)
        }
        if (attackTarget) {
            //console.log(attackTarget)
            tower.attack(attackTarget[0])
        }
        //if(structure.room.name === 'E33S35') console.log(structure.room.name + 'tower towerTargetRank ' +JSON.stringify(towerTargetRank))
        //if(structure.room.name === 'E33S35') console.log(structure.room.name + 'tower composedEnemyCreeps.length ' +JSON.stringify(composedEnemyCreeps.length))
        //if(structure.room.name === 'E33S35') console.log(structure.room.name + 'tower healerEnemies.map(x => x.pos) ' +JSON.stringify(healerEnemies.map(x => x.pos)))
        //if(structure.room.name === 'E33S35') console.log(structure.room.name + 'tower regularEnemies.map(x => x.pos) ' +JSON.stringify(regularEnemies.map(x => x.pos)))
    } else if(structure.structureType === STRUCTURE_LINK) {
        return strucLink(worldState, structure)
    } else if(structure.structureType === STRUCTURE_TERMINAL) {
        return strucTerminal(Game.worldState.empireStatus, structure)
    }
}
module.exports = {
    expansion: expansion
}
