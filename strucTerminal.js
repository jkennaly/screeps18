var allOrders = [];
module.exports = (empireStatus, terminal) => {
	//if terminal has resources, check to see if order criteria are met
	//possible actions are:
		//send to another of my terminals
		//create a buy order
		//create a sell order
		//if(terminal.room.name === 'E33S36') console.log(terminal.room.name + ' strucTerminal 14 L rooms demand' + JSON.stringify({}))
		const availableForSale = Object.keys(terminal.store).filter(k => k !== RESOURCE_ENERGY).filter(k => terminal.store[k] >= 3000).filter(k => terminal.room.storage.store[k] >= 10000)
		if(!availableForSale.length) return
		const inerDest = (pv, cv) => {
			if(cv === undefined) return pv
			pv[cv] = empireStatus.shipmentNeeded(cv)
			return pv
		}
		const internalDestinations = availableForSale.reduce(inerDest, {})
		//if(terminal.room.name === 'E33S36') console.log(terminal.room.name + ' strucTerminal 14 L rooms demand' + JSON.stringify([RESOURCE_LEMERGIUM].reduce(inerDest, {})))
		//if(terminal.room.name === 'E33S36') console.log(terminal.room.name + ' strucTerminal 14 availableForSale' + JSON.stringify(availableForSale))
		//console.log(terminal.room.name + ' strucTerminal 14 L rooms demand' + JSON.stringify([RESOURCE_LEMERGIUM].reduce(inerDest, {})))
		//console.log(terminal.room.name + ' strucTerminal 14 availableForSale' + JSON.stringify(availableForSale))
		//console.log(terminal.room.name + ' strucTerminal 14 ' + JSON.stringify(internalDestinations))
		if(availableForSale[0] === undefined) return

		if(internalDestinations[availableForSale[0]].length) return internalDestinations[availableForSale[0]].map(d => terminal.send(availableForSale[0], 3000, d))



		//check around the empire for anyone who needs it

	//see what orders are present
	if(Game.cpu.bucket >= 9900 && (allOrders.length === 0 || Game.time % 1000 === 250 )) allOrders = Game.market.getAllOrders()

		//execute a buy order
		const buyOrders = allOrders.filter(o => o.type === ORDER_BUY)
		
		const ordersForSaleableGoods = buyOrders.filter(o => availableForSale.indexOf(o.resourceType) > -1)
			.filter(o => o.amount >= 10000)
			.sort((a, b) => b.price - a.price)

		if(ordersForSaleableGoods.length > 0) return Game.market.deal(ordersForSaleableGoods[0].id, 10000, terminal.room.name)
		//console.log('terminal strucTerminal 18 ' + terminal.room.name + ' poternial deal : ' + JSON.stringify(ordersForSaleableGoods[0]))

		//execute a sell order
		
    }