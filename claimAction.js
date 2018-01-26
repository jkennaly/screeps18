const actionMap = require('actionMap')

module.exports = worldState => {
    return claimJumper => {
        if (claimJumper.pos === undefined) return
        const action = actionMap(claimJumper.pos)
        const roomStatus = Game.worldState.roomStatus[claimJumper.room.name]
        const flag = roomStatus.flags
        const outpostFlags = flag.filter(f => f.color === COLOR_BLUE)
        const colonyFlags = flag.filter(f => f.color === COLOR_ORANGE)
        const flagT = outpostFlags.filter(f => Game.worldState.empireStatus.roomsNeedJumper.indexOf(f.assocRoomName()) > -1)


        //if(claimJumper.name === 'Hunter') console.log(claimJumper.name + ' filtered sinks: ' + JSON.stringify(roomStatus.sinkables.filter(s => !controllerFilter(s)).filter(transferableFilter)))
        //drop
        //harvest - attack - build - repair - dismantle - attackController - rangedHeal - heal
        //claimController
        //suicide
        //move

        const still = !flagT.length && claimJumper.pos.getRangeTo(claimJumper.room.focalPos() <= 3)
        const approachFlag = !still && flagT.length > 0
            //const approachFocalPos = !still && !approachSink && !approachSource && !approachFlag

        const moveAction = approachFlag ? [flagT[0]].map(action.approach)[0] : ['moveTo', claimJumper.room.controller]

        const nearController = claimJumper.room.controller && claimJumper.room.controller.pos.getRangeTo(claimJumper.pos) <= 1 ? [claimJumper.room.controller] : []

        const reserveController = nearController.filter(c => !c.owner && (!c.reservation || c.reservation.username === Game.worldState.strat.me)).length > 0
        const claimAction = reserveController ? nearController.map(action.reserveController)[0] : ['none', undefined]

        const retVal = [moveAction, claimAction]

        //if(claimJumper.name === 'Austin') console.log(claimJumper.name + ' moveAction ' + JSON.stringify(moveAction))
        //if(claimJumper.name === 'Lillian') console.log(claimJumper.name + ' flagT ' + JSON.stringify(flagT))
        //if(claimJumper.name === 'Lillian') console.log(claimJumper.name + ' approachFlag ' + JSON.stringify(approachFlag))

        return retVal



    }
}
