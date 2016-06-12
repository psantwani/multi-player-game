/**Variables**/
var usersInAGame = {};
var socketId_game_pair = {};
var currentStateOfGame = {};
var feedSchema = require('./models/feed.js');
var Feed = mongoose.model('Feed', feedSchema, "feeds");

exports.onConnect = function(socket, data){
	var userId = data;
	console.log("User " + userId + " has logged in.");
};

exports.getFeed = function(callback){
	Feed.find({'available' : true}).lean().exec(function (err, items) {
		return callback(JSON.stringify(items));
	});
};

exports.game = function(socket,data){
	data = JSON.parse(data);
	var playerId = data.playerId;
	var createdBy = data.createdBy;
	if(playerId == createdBy){
		newGame(socket,data);
	}
	else if(playerId != createdBy){
		addPlayerToGame(socket, data);
	}
};

exports.startGame = function(socket, gameId){
	Feed.update({gameId : {$eq: gameId}}, {$set: {available : false, updatedAt : Date.now()}}, function(err, result){
		console.log("Updated successfully");
		console.log(result);
	});
	currentStateOfGame[gameId] = [];
	socket.to(gameId).emit("gameStarted", 0);
	socket.emit('firstTurn', 0);
};

exports.userPlayed = function(socket, data){
	var localdata = JSON.parse(data);
	var gameId = localdata.gameId;
	var cardValue = localdata.card;
	var numberOfPlayers = localdata.playerCount;
	var existingState = currentStateOfGame[gameId];
	existingState.push(cardValue);
	var playerTurn;
	if(existingState.length < numberOfPlayers){
		playerTurn = existingState.length;
	}
	else{
		playerTurn = 0;
	}

	var lastPlaydata = {
		playerTurn : playerTurn,
		playerId : localdata.playerId,
		card : cardValue
	};
	
	socket.to(gameId).emit('otherUserPlayed', JSON.stringify(lastPlaydata));
	if(existingState.length == numberOfPlayers){
		var maxScore = Math.max.apply(null,existingState);
		var index = existingState.indexOf(maxScore);
		socket.to(gameId).emit('gameResult',index);
		socket.emit('gameResult', index);
		currentStateOfGame[gameId] = [];
	}
	else{
		currentStateOfGame[gameId] = existingState;
	}
};

exports.gameStopped = function(socket, gameId){
	socket.to(gameId).emit("gameStopped", "");
};


exports.quitGame = function(socket, data){
	data = JSON.parse(data);
	removeUsersFromGame(socket, data);
};

exports.destroyGame = function(socket, gameId){
	delete currentStateOfGame[gameId];
	delete usersInAGame[gameId];
	socket.to(gameId).emit('gameDestroyed',"");
	Feed.update({gameId : {$eq: gameId}}, {$set: {available : false, updatedAt : Date.now()}}, function(err, result){
		console.log("Updated successfully");
		console.log(result);
		socket.broadcast.emit('removeFromFeed',gameId);
		socket.emit('removeFromFeed',gameId);
	});
};

exports.onDisconnect = function(socket){
	var socketId = socket.id;
	var gameDetails = socketId_game_pair[socketId];
	if(typeof gameDetails != "undefined"){
		var data = {
			gameId : gameDetails.gameId,
			playerId : gameDetails.playerId
		};
		removeUsersFromGame(socket, data);
		delete socketId_game_pair[socketId];
	}
	console.log("A user has logged out.");
};


function newGame(socket, data){
	var socketId = socket.id;
	usersInAGame[data.gameId] = [data.playerId];
	console.log("User " + data.playerId + " has created a new game " + data.gameId + ".");
	socket.join(data.gameId);
	var socketGameDetails = {
		gameId : data.gameId,
		playerId : data.playerId
	};
	socketId_game_pair[socketId] = socketGameDetails;
	socket.emit("gamePlayerCount", usersInAGame[data.gameId]);
	updateFeed(socket, data);
	newFeedRecord(data);
}

function addPlayerToGame(socket,data){
	console.log("User " + data.playerId + " has joined the game");
	var socketId = socket.id;
	var existingPlayers = usersInAGame[data.gameId];
	existingPlayers.push(data.playerId);
	socket.join(data.gameId);
	usersInAGame[data.gameId] = existingPlayers;
	var socketGameDetails = {
		gameId : data.gameId,
		playerId : data.playerId
	};
	socketId_game_pair[socketId] = socketGameDetails;
	socket.emit("gamePlayerCount", existingPlayers);
	var newPlayerJoined = {
		newJoinee : data.playerId,
		players : existingPlayers
	};
	socket.to(data.gameId).emit("newPlayerJoined", JSON.stringify(newPlayerJoined));
	updateFeedRecord(data.gameId, existingPlayers.length, (existingPlayers.length < 4) ? true : false);
}

function updateFeed(socket, data){
	socket.broadcast.emit('updateFeed', JSON.stringify(data));
}

function newFeedRecord(data){
	var feedData = {
		gameId: data.gameId,
		createdBy: data.playerId,
		playerCount: 1,
		available: true,
		createdAt: data.createdAt,
		updatedAt: data.createdAt
	};

	var feedRecord = new feedSchema(feedData);
	feedRecord.save(function(err){
		if(err){
			console.log("Error occured in creating a new feed record.");
			console.log(err);
		}
		else{
			console.log('Data added to DB');
		}
	});
}

function updateFeedRecord(gameId, playerCount, available){
	Feed.update({gameId : {$eq: gameId}}, {$set: {playerCount: playerCount, available : available, updatedAt : Date.now()}}, function(err, result){
		console.log("Updated successfully");
		console.log(result);
	});
}


function removeUsersFromGame(socket, data){
	var playerId = data.playerId;
	var socketId = socket.id;
	var gameId = data.gameId;
	var existingPlayers = usersInAGame[gameId];
	if(typeof existingPlayers != "undefined"){
		var indexOfPlayer = existingPlayers.indexOf(playerId);
		var available = (existingPlayers.length < 4) ? true : false;
		existingPlayers.splice(indexOfPlayer,1);
		console.log("removing player");
		delete socketId_game_pair[socketId];
		Feed.update({gameId : {$eq: gameId}}, {$set: {playerCount: existingPlayers.length, available : available, updatedAt : Date.now()}}, function(err, result){
			console.log("Updated successfully");
			var quitGameData = {
				playerId : playerId,
				playersLeft : existingPlayers
			};
			socket.to(gameId).emit("playerLeft", JSON.stringify(quitGameData));
			console.log(result);
		});
	}
}