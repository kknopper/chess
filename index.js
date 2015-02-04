var express = require('express');
var path = require('path');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var _ = require('lodash');
var bodyParser = require('body-parser');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({
  extended: true
}));

var url = 'room';

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

app.get('/favicon.ico', function(req, res) {
	res.send('');
});


// Game & User constructor functions

function userList() {
	this.users = [];
}

function user(socket, username) {
	this.socket = socket;
	this.username = username;
}

userList.prototype.findUser = function(identifier) {
	if (typeof identifier == 'string') { // check if identifier is searching by username (better checks??)
		var userIndex = _.findIndex(this.users, {'username': identifier});
		if (userIndex == -1) return userIndex;
		else return this.users[userIndex];
	}

	else {
		var userIndex = _.findIndex(this.users, {'socket': identifier}); //identifier is searching for socket id
		if (userIndex == -1) return userIndex;
		else return this.users[userIndex];
	}
}

userList.prototype.addUser = function(socket, username) {
	var newUser = new user(socket, username);
	this.users.push(newUsers);
}

function gamesCollection() {
	this.games = [];
};

function game(id, white, black) {
	this.id = id;
	this.white = white;
	this.black = black;
}

gamesCollection.prototype.addGame = function(id, color) {
	if (color == 'white') {
		var newGame = new game(id, color);
	}

	else if (color == 'black') {
		var newGame = new game(id, undefined, color);
	}
}

gamesCollection.prototype.findGame = function(gameID) {
	var gameIndex = _.findIndex(this.games, {'id': gameID});
	return this.games[gameIndex];
};

gamesCollection.prototype.joinGame = function(gameId, playerId, sideColor) {
	var currentGame = this.findGame(gameId);
	if (sideColor == 'white' && currentGame.white == undefined) {
		currentGame.white = sideColor;
	}
	else if (sideColor == 'black' && currentGame.black == undefined) {
		currentGame.black = sideColor;
	}
	else {
		show.error(function() {
			/* Act on the event */
		});
	}
}

var gamesCollection = new gamesCollection();
var userList = new userList();


var createID = function () {
	return Date.now();
}

app.post('/create', function(req, res) {
	console.log(req.body.userName);

	if (findUser(req.body.userName)!= -1) {
		console.log('username already exists');
		// socket.emit('userNameError');	
		res.send(false);	
	}
	else {
		addUser(req.body.userName); // add user to game
		console.log(usernames);
		//req.body is data object
		console.log(req.body);
		res.send(req.body);
	}
});

app.post('/join', function(req,res) {

	var response;

	if(usernames.indexOf(req.body.userName)!= -1) { //if username already exists
		response = 0;
		res.send(response);
	} 

	else if (!games[req.body.gameID]) { //if game does not exist
		response = 1;
		res.send(response);
	}

	else if (Object.keys(games[req.body.gameID])) {

	}
});


app.get('/create', function (req, res) {
	var newGame = createID();
	games[newGame] = {};
	res.redirect('/game/' + newGame);
	//create socket room here
});

app.get('/game/:gameID', function (req, res, next) {
	console.log(req.params);
	var gameID = req.params.gameID;
	//if (gameID.length !== 5) return res.send('Game ID not valid');
	res.sendFile(__dirname + '/game.html');
});


// app.use(express.static(__dirname + '/'));
// app.listen(process.env.PORT || 3000);

io.on('connection', function(socket) {
	console.log('a user connected');

	function updateUsernames() {
		socket.emit('updateUsers', users);
	}

	socket.on('join room', function ( userData, callback) {
		var room = createID();
		socket.room = room;


			if (games[room] && games[room].length && games[room].length <= 1) {
				games[room].push(socket.id);
				socket.join(room);
				users[socket.id] = userData.userName;
				socket.username = userData.userName
				console.log(users);
				console.log(users[socket.id], 'joined', room);
				updateUsernames();
				
				socket.broadcast.to(socket.room).emit('userConnect', users[socket.id] +' connected');
				// callback(true);
			
			} else if (games[room] && games[room].length && games[room].length >= 2) {
				console.log('too many people in the room');
				callback(false);
			} else {
				games[room] = [];
				games[room].push(socket.id);
				socket.join(room);
				users[socket.id] = userData.userName;
				socket.username = userData.userName
				console.log(users);
				console.log(users[socket.id] + ' joined ' + room);
				socket.broadcast.to(socket.room).emit('userConnect', users[socket.id] +' connected');
			}			
		
	});

	socket.on('updateUsers', function(usernameVal, callback){
		if (usernames.indexOf(usernameVal)!= -1) {
			console.log(usernameVal);
			console.log(users);
			callback(false);
		}
		else {
			console.log(usernameVal);
			console.log('false');
			callback(true);
			users[socket.id] = usernameVal;
			socket.username = usernameVal
			usernames.push(usernameVal);
			console.log(users);

			updateUsernames();
			socket.broadcast.to(socket.room).emit('userConnect', users[socket.id] +' connected');
		}
	});

	socket.on('disconnect', function() {
		console.log('a user disconnected');
		if (!users[socket.id]) return;
		usernames.splice(usernames.indexOf(socket.username), 1);
		io.emit('userDisconnect', users[socket.id] +' disconnected');
		delete users[socket.id];
		updateUsernames();
	});
	socket.on('chat message', function(msg) {
		socket.to(socket.room).emit('chat message', msg, users[socket.id]);
		console.log(users[socket.id]+': '+msg);
	});
	socket.on('userTyping', function(){
		socket.broadcast.to(socket.room).emit('userTyping', users[socket.id] + ' is typing...');
		console.log(users[socket.id] + ' is typing...');
	});
	socket.on('userNotTyping', function(){
		socket.broadcast.to(socket.room).emit('userNotTyping');
	});
	socket.on('scrollChat', function() {
		socket.to(socket.room).emit('scrollChat');
	});
	socket.on('chessMove', function(boardPosition, gamePosition) {
		// socket.broadcast.to(socket.room).emit('chessMove', boardPosition, gamePosition);
		socket.emit('chessMove', boardPosition, gamePosition);
		console.log(boardPosition + ' player moved');
	});
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});

// http.listen(3000/+url, function() {
// 	console.log('new room on :3000/'+url);
// })