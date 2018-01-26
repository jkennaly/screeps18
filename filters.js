module.exports = {
    largeAmount: refCapacity => dr => dr.amount > 0.10 * refCapacity,
    near: refPos => target => refPos.getRangeTo(target) <= 1,
    near3: refPos => target => refPos.getRangeTo(target) <= 3,
    near5: refPos => target => refPos.getRangeTo(target) <= 5,
    near7: refPos => target => refPos.getRangeTo(target) <= 7,
    containsEnergy: structure => structure.store && structure.store[RESOURCE_ENERGY] > 0 || structure.energy && structure.energy > 0 || structure.carry && structure.carry[RESOURCE_ENERGY] > 0,
    sufficientEnergy: refMin => structure => structure.store && structure.store[RESOURCE_ENERGY] >= refMin || structure.energy && structure.energy >= refMin || structure.carry && structure.carry[RESOURCE_ENERGY] >= refMin
}