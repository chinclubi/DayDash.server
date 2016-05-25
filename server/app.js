var Server = require('socket.io')
var io = new Server()

var Room = require('./room')

var MAX_PLAYER = 1

var rooms = {}
var users = {}

var cRoom

io.sockets.on('connection', function (client) {
	console.log(client.id + ' connected.')

	client.on('JOIN_ROOM', function() {
		// Create New Room if the room is not empty or undefined.
		if(!cRoom){
			console.log("cRoom is undefined.")
			cRoom = new Room(MAX_PLAYER)
		} else if(!cRoom.isEmpty()){
			console.log("Room no." + cRoom.getRoomNo() + " is not empty.")
			cRoom = new Room(MAX_PLAYER)
		}
		client.room = cRoom
		client.join(cRoom.getRoomNo())
		client.item = cRoom.generateItem()
		cRoom.joinRoom()
		console.log(client.id + ' join room no.' + cRoom.getRoomNo())

		client.emit('JOIN_RESPONSE', {roomInfo: cRoom.getRoomInfo()})
		if(cRoom.currentPlayer === MAX_PLAYER){
			console.log('Room no.' + cRoom.getRoomNo() + ' game is starting.')
			let members = io.sockets.in(cRoom.getRoomNo()).adapter.rooms[cRoom.getRoomNo()].sockets
			for(let member in members){
				let itemList = io.sockets.connected[member].item
				io.sockets.connected[member].emit('GENERATE_ITEM', {data: itemList})
			}
			io.sockets.in(cRoom.getRoomNo()).emit('START_GAME')
		}
	})

	client.on('FOUND_KEY', function() {
		io.sockets.in(cRoom.getRoomNo()).emit('EVENT', {data: 'KEY_FOUND'})
	})

	client.on('disconnect', function() {
		client.room.leaveRoom()
		console.log(client.id + ' leave room no.' + client.room.getRoomNo())
		if (client.room.currentPlayer <= 0){
			delete client.room
			cRoom = undefined
		}
		console.log(client.id + ' disconnected')
		delete users[client.id]
	})
})

io.listen(8000)
