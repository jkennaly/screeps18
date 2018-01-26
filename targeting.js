const healerCreep = c => c.body.includes(HEAL)
const attackCreep = c => c.body.includes(ATTACK)
const rangedAttackCreep = c => c.body.includes(RANGED_ATTACK)
const hitsAsc = (a, b) => a && a.hits ? b && b.hits ? a.hits - b.hits : 0 : 0
const enemyStructureEmpty = s => {return {
    STRUCTURE_CONTAINER: _.sum(s.store) === 0,
    STRUCTURE_CONTROLLER: s => true,
    STRUCTURE_EXTENSION: s => s.energy === 0,
    STRUCTURE_EXTRACTOR: s => true,
    STRUCTURE_KEEPER_LAIR: s => true,
    STRUCTURE_LAB: s => s.energy === 0 && s.mineralAmount === 0,
    STRUCTURE_LINK: s => s.energy === 0,
    STRUCTURE_NUKER: s => s.energy === 0 && s.ghodium === 0,
    STRUCTURE_OBSERVER: s => true,
    STRUCTURE_POWER_BANK: s => s.power === 0,
    STRUCTURE_POWER_SPAWN: s => s.energy === 0 && s.power === 0,
    STRUCTURE_PORTAL: s => true,
    STRUCTURE_RAMPART: s => true,
    STRUCTURE_ROAD: s => true,
    STRUCTURE_SPAWN: s => s.energy === 0,
    STRUCTURE_STORAGE: _.sum(s.store) === 0,
    STRUCTURE_TERMINAL: _.sum(s.store) === 0,
    STRUCTURE_TOWER: s => s.energy === 0,
    STRUCTURE_WALL: s => true
}[s.structureType]}
const enemyTowersRoomArray = wolrdState => _.memoize(room => room.find(FIND_HOSTILE_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}}).sort(hitsAsc))
const enemyHealersRoomArray = wolrdState => _.memoize(room => room.find(FIND_HOSTILE_CREEPS, {filter: healerCreep}).sort(hitsAsc))
const enemyAttackCreepsArray = wolrdState => _.memoize(room => room.find(FIND_HOSTILE_CREEPS, {filter: attackCreep}).sort(hitsAsc))
const enemyRangedAttackCreepsArray = wolrdState => _.memoize(room => room.find(FIND_HOSTILE_CREEPS, {filter: rangedAttackCreep}).sort(hitsAsc))
const enemyCivilianCreepsArray = wolrdState => _.memoize(room => room.find(FIND_HOSTILE_CREEPS, {filter: c => !c.healerCreep && !attackCreep && !rangedAttackCreep}).sort(hitsAsc))
const enemyEmptyStructArray = wolrdState => _.memoize(room => room.find(FIND_HOSTILE_STRUCTURES, {filter: s => enemyStructureEmpty(s)(s)}).sort(hitsAsc))
const roomAttackArray = wolrdState => room => enemyTowersRoomArray(wolrdState)(room).concat(enemyHealersRoomArray(wolrdState)(room)).concat(enemyAttackCreepsArray(wolrdState)(room)).concat(enemyRangedAttackCreepsArray(wolrdState)(room)).concat(enemyCivilianCreepsArray(wolrdState)(room)).concat(enemyEmptyStructArray(wolrdState)(room))
module.exports = {
    roomAttack: roomAttackArray
}