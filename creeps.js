const skMinerAction = require('skMiner')
const colonistAction = require('colonistAction')
//const soldierAction = require('soldierAction')
//const scoutAction = require('scoutAction')
const claimAction = require('claimAction')


const expansion = worldState => creep => {
    //if(creep.name === 'Nolan') console.log(creep.name + ' ' + creep.type())
        
    var errorLog = []
    //if(creep.name === 'Jack') console.log(creep.name + ' ' + creep.room.name + ' ' + JSON.stringify(creep.type()))
    if(creep.spawning) return
    const startCpu = Game.cpu.getUsed()

    if(creep.type('claimJumper')) {
        const claimActions = claimAction(worldState)(creep).filter(a => a !== null && a !== undefined && a.length && a[0] !== 'none')
        //if(creep.name === 'Evan') console.log(creep.name + JSON.stringify(claimActions))
        //console.log(creep.name + JSON.stringify(claimActions))
        const claimExecution = claimActions.map(actionObject => creep[actionObject[0]](actionObject[1], actionObject[3]))
    } else if(creep.type('colonist')) {
        const colonistActionObject = colonistAction(worldState)(creep)
        //if(creep.name === 'Colton') console.log(creep.name + ' ' + JSON.stringify(colonistActionObject))
        //creep.say(colonistActionObject.statement ? colonistActionObject.statement : colonistActionObject.action)
        if (creep[colonistActionObject.action](colonistActionObject.target, colonistActionObject.param) < 0) {
            if(creep.pos.getRangeTo(colonistActionObject.target) > 1) {
                creep.moveTo(colonistActionObject.target)
                creep[colonistActionObject.action](colonistActionObject.target, colonistActionObject.param)
            }
        }

    } else if(creep.type('skMiner')) {
         const skMinerActions = skMinerAction(worldState)(creep).filter(a => a !== null && a !== undefined && a.length && a[0] !== 'none')
        //if(creep.name === 'Nolan') console.log(creep.name + JSON.stringify(skMinerActions))
        //console.log(creep.name + JSON.stringify(skMinerActions))
        const skMinerExecution = skMinerActions.map(actionObject => creep[actionObject[0]](actionObject[1], actionObject[3]))
    }
    //if(errorLog && errorLog.length) console.log(errorLog)

    const totalCpu = Game.cpu.getUsed() - startCpu
    if(totalCpu > 30 && Game.cpu.bucket < 9900) console.log(creep.name + ' ' + creep.type() + ' ' + creep.room.name + ' ' + totalCpu)

}
module.exports = {
    expansion: expansion
}
