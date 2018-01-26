module.exports = (worldState, link) => {
    const otherLinks = link.room.findMyStructures({filter: l => l.structureType === STRUCTURE_LINK && l.id !== link.id})
    if(otherLinks.length === 0) return
    const thisLinkNearSource = !link.pos.nearController(4)
    const thisLinkNearCont = link.pos.nearController(4)
    const targetFilter = thisLinkNearSource ? s => s.pos.nearController(4) : s => false
    const potentialTargetLinks = otherLinks.filter(targetFilter).filter(l => l.energyCapacity - l.energy > 0)
    const targetLink = potentialTargetLinks !== undefined ? potentialTargetLinks[0] : undefined
    const targetLinkEnergySpace = targetLink !== undefined ? targetLink.energyCapacity - targetLink.energy : 0
    const transferAmount = _.min([link.energy, targetLinkEnergySpace])
    const retVal = link.transferEnergy(targetLink, transferAmount)
    //console.log(link.id + ' linkFull ' + JSON.stringify(link.status('full')) + ' thisLinkNearSource ' + thisLinkNearSource)

    if(transferAmount > 0.5 * link.energyCapacity) return retVal

}