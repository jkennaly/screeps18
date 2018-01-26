const bestNearestPos = refPos => c => (c.pos === undefined ? c : c.pos).walkableCoordsNearPos().reduce((soFar, testPos) => {
    const currentRange = refPos.getRangeTo(soFar.pos)
    const testRange = refPos.getRangeTo(testPos)
    const checkForRoad = currentRange === testRange
    const currentHasRoad = checkForRoad && soFar.findInRange(FIND_STRUCTURES, 0, {filter: s => s.structureType === STRUCTURE_ROAD}).length > 0
    const closest = refPos => (a, b) => a.getRangeTo(refPos) - b.getRangeTo(refPos) > 0 ? b : a
    const retVal = currentHasRoad ? soFar : closest(c)(soFar, testPos)
    return retVal

}, (c.pos === undefined ? c : c.pos))



const aLongApproach = refPos => c => refPos.x < 2 || refPos.x > 47 || refPos.y < 2 || refPos.y > 47 ||  c && c.walkable() && (refPos.getRangeTo(c) > 1 || c.walkable({ignoreCreeps: true}) && c.lookFor(LOOK_FLAGS).length)

const actionMap = refPos => {

    return {
        position: p => ['moveTo', p],
        heal: c => ['heal', c],
        rangedHeal: c => ['rangedHeal', c],
        rangedAttack: c => ['rangedAttack', c],
        attack: c => ['attack', c],
        harvest: c => ['harvest', c],
        dismantle: c => ['dismantle', c],
        rangedMassAttack: ['rangedMassAttack'],
        drop: r => ['drop', r],
        withdrawEnergy: c => ['withdraw', c, 'suck E', RESOURCE_ENERGY, refPos.getRangeTo(c.pos)],
        withdrawResource: r => c => ['withdraw', c, 'suck R', r, refPos.getRangeTo(c.pos)],
        harvestEnergy: c => ['harvest', c, 'drill E', undefined, refPos.getRangeTo(c.pos)],
        pickup: c => ['pickup', c, 'pickup', undefined, refPos.getRangeTo(c.pos)],
        transferEnergy: (c, a) => ['energyTransfer', c, 'xfer E', a, refPos.getRangeTo(c.pos)],
        transferResource: r => c => ['transfer', c, 'xfer', r, refPos.getRangeTo(c.pos)],
        repair: c => refPos.getRangeTo(c.pos) <= 3 ? ['repair', c, 'repair', undefined, refPos.getRangeTo(c.pos)] : ['none', undefined, 'wait', 0],
        build: c => refPos.getRangeTo(c.pos) <= 3 ? ['build', c, 'build', undefined, refPos.getRangeTo(c.pos)] : ['none', undefined, 'wait', 0],
        repairLong: c => c.structureType !== STRUCTURE_ROAD ? ['repair', c, 'repair', undefined, refPos.getRangeTo(c.pos)] : ['none', undefined, 'wait', 0],
        buildLong: c => ['build', c, 'build', undefined, refPos.getRangeTo(c.pos)],
        controller: c => ['upgradeController', c, 'controller', undefined, refPos.getRangeTo(c.pos)],
        settle: c => ['moveAlong', c.pos, 'settle', undefined, refPos.getRangeTo(c.pos)],
        suicide: ['suicide', undefined, undefined, 0],
        claim: c => refPos.getRangeTo(c.pos) > 1 ? ['moveAlong', c.pos, 'approach', undefined, refPos.getRangeTo(c.pos)] : ['claimController', c, 'colonize', refPos.getRangeTo(c.pos)],
        attackController: c => ['attackController', c],
        reserveController: c => ['reserveController', c],
        approach: c => {
            if(c === undefined) return ['none', undefined, 'wait', 0]
            const pos = c.length ? c[1].pos : c.x !== undefined && c.y !== undefined ? c.lookFor !== undefined ? c : new RoomPosition(c.x, c.y, c.roomName) : c.pos
            //console.log('actionMap 46 ' + JSON.stringify(c))
            //if(pos === undefined) console.log('actionMap 46 c ' + JSON.stringify(c))
            //if(pos.walkable === undefined) console.log('actionMap 46 pos ' + JSON.stringify(pos))
            const posWalakble = true // pos.walkable()
            const targetPos = posWalakble ? pos : bestNearestPos(refPos)(pos)
            const retVal = refPos.getRangeTo(pos) > 1 ? ['moveAlong', targetPos, 'approach', undefined, refPos.getRangeTo(targetPos)] :  ['moveTo', targetPos, 'approach', undefined, refPos.getRangeTo(targetPos)]
            
            //if(targetPos.roomName === 'E33S35' && refPos.x === 18) console.log('actionMap 49 targetPos far' + JSON.stringify(targetPos) + JSON.stringify(refPos) + JSON.stringify(retVal) + refPos.lookFor)
            return retVal
        },
        march: c => c && c.pos && (refPos.getRangeTo(c.pos) > 1 || c.pos.walkable() && c.pos.lookFor(LOOK_FLAGS).length) ? ['moveTo', c.pos, 'march', undefined, refPos.getRangeTo(c.pos)] : ['none', undefined, 'wait', 0],
        formation: c => c && c.pos && (refPos.getRangeTo(c.pos) > 2 || c.pos.walkable() && c.pos.lookFor(LOOK_FLAGS).length) ? ['moveTo', c.pos, 'march', undefined, refPos.getRangeTo(c.pos)] : c && c.pos && c.pos.walkableCoordsNearPos().length < 1 ? ['moveTo', refPos.walkableCoordsNearPos()[0], 'march', undefined, 1] : ['none', undefined, 'wait', 0]
    }}



module.exports = refPos => actionMap(refPos)