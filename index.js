var express = require('express');
var path = require('path');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var _ = require('lodash');
var bodyParser = require('body-parser');
var session = require('express-session');
var cookieParser = require('cookie-parser');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({
  extended: true
}));

//set up cookies and session vars to pass around routes
app.use(cookieParser());
app.use(session({secret:'somesecrettokenhere'}));


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

function user(userName, socket) {
	this.socketId = socket;
	this.userName = userName;
}

userList.prototype.findUser = function(identifier, token) {
	//identifier == username or user id
	//token == 'un' for username or 'id' for user socker id

	return _.find(this.users, function(user) {
		if (token === 'un' && user.userName === identifier) return true;
		else if (token === 'id' && user.socketId === identifier) return true;
		else return false;
	});
}

userList.prototype.newUser = function(username, socket) {
	var newUser = new user(username, socket);
	this.users.push(newUser);
}

function gamesCollection() {
	this.games = [];
};

function game(id, player1, player2) {
	this.id = id;
	this.players = [];
	this.boardFEN = 'start';
	this.gameFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
	this.gameStarted = false;
}

game.prototype.addPlayer = function(user) {
	this.players.push(user);
}

game.prototype.isFull = function() {
	 return this.players.length > 1;
}

game.prototype.getPlayer = function(userName) {
	return _.find(this.players, {'userName': userName});
}

game.prototype.getPlayerColor = function(userName) {
	var player = _.find(this.players, {'userName': userName});
	return player.color;
}

gamesCollection.prototype.newGame = function(gameid, color, username) {

		var userObject = {
			userName: username,
			color: color
		};
		var newGame = new game(gameid);
		newGame.addPlayer(userObject);
		this.games.push(newGame);
}

gamesCollection.prototype.findGame = function(gameID) {
	return _.find(this.games, {'id': gameID});
};

gamesCollection.prototype.findGameFromUserName = function(userName) {
	return _.find(this.games, function(game) { 
		return _.where(game.players, {userName: userName}).length;
	 });
}

gamesCollection.prototype.findGameFromUserId = function(id) {
	return _.find(this.games, function(game) { 
		return _.where(game.players, {socketId: id}).length;
	 });
}

gamesCollection.prototype.joinGame = function(gameId, player2userName) {
	var currentGame = this.findGame(gameId);

	if (currentGame.players.length == 1) { //if you can join the game
		var color = currentGame.players[0].color;
		var newUserColor = color == 'white' ? 'black':'white';
		currentGame.addPlayer({userName: player2userName, color: newUserColor});
		console.log(gamesCollection);
	}

	else if (currentGame.users.length == 0) { //if game does not exist

	}


	// if (currentGame.users.length == 'white' && currentGame.white == undefined) {
	// 	currentGame.white = sideColor;
	// }
	// else if (sideColor == 'black' && currentGame.black == undefined) {
	// 	currentGame.black = sideColor;
	// }
	// else {
	// 	alert('this game is full');
	// }
}

var gamesCollection = new gamesCollection();
var userList = new userList();


var createID = function () {
	return Math.random().toString(36).substring(16);
}

app.post('/create', function(req, res) {

	if (userList.findUser(req.body.userName, 'un')) {
		console.log('username already exists');	
		res.send(false);	
	}
	else {
		userList.newUser(req.body.userName); // add user to userList
		var randID = createID();
		gamesCollection.newGame(randID, 'white', req.body.userName);
		console.log(gamesCollection);
		//req.body is data object
		req.session.gameId = randID;
		// req.session.userName = req.body.userName;
		res.redirect('/create');
		// res.send(req.body);
	}
});

app.post('/join', function(req,res) {

	var response;

	if(userList.findUser(req.body.userName, 'un')) { //if username already exists
		res.status(409).send({error: 'userNameExists'});
	} 

	else if (!gamesCollection.findGame(req.body.gameId)) { //if game does not exists
		res.status(404).send({error: 'gameDoesNotExist'});
	}

	else if (gamesCollection.findGame(req.body.gameId)) { 
		var searchedGame = gamesCollection.findGame(req.body.gameId);
		console.log(searchedGame);
		if (searchedGame.isFull()) { //if game is full
			res.status(409).send({error: 'gameIsFull'});
		}

		else {
			var searchedGame = gamesCollection.findGame(req.body.gameId);
			gamesCollection.joinGame(searchedGame.id, req.body.userName);
			userList.newUser(req.body.userName, undefined);
			console.log('joined room');
			res.send();
		}
	}

	else {
		console.log('could not join game -- check code'); //put better error here
	}
});


app.get('/create', function (req, res) {
	var newGameId = req.session.gameId;
	res.redirect('/game/' + newGameId);
});

app.get('/game/:gameID', function (req, res, next) {
	// console.log(req.params);
	var gameID = req.params.gameID;
	res.sendFile(__dirname + '/game.html');

	// var joiningUser = userList.findUser(req.session.userName);
	// joiningUser.socket = socket.id;/\
	// console.log(userList);
});

io.on('connection', function(socket) {



	socket.emit('startSetup');
	socket.on('setup', function(username){

		var currentUser = userList.findUser(username, 'un');
		currentUser.socketId = socket.id;

		console.log(currentUser.userName + 'connected');
		console.log(userList);

		var currentGame = gamesCollection.findGameFromUserName(username);
		var player = currentGame.getPlayer(username);
		player.socketId = socket.id;
		var boardFEN = currentGame.boardFEN;
		var gameFEN = currentGame.gameFEN;
		var color = currentGame.getPlayerColor(username);

		console.log(currentGame);
		console.log(color);

		socket.emit('endSetup', color, boardFEN);
	});

	socket.on('getColor', function() {

		var currentUser = userList.findUser(socket.id, 'id'); 
		var currentGame = gamesCollection.findGameFromUserName(currentUser.userName);
		console.log(currentGame);
		var color = currentGame.getPlayerColor(currentUser.userName);
		socket.emit('getColor', color);
	});

	socket.on('chessMove', function(boardPosition, gamePosition) {

		var currentGame = gamesCollection.findGameFromUserId(socket.id);
		currentGame.boardFEN = boardPosition;
		currentGame.gameFEN = gamePosition;
		io.emit('chessMove', boardPosition, gamePosition);
		console.log(boardPosition + ' player moved');
	});

	socket.on('chat message', function(msg) {
		var currentUser = userList.findUser(socket.id, 'id');
		socket.broadcast.emit('chat message', msg, currentUser.userName);
		console.log(currentUser.userName+': '+msg);
	});

	 socket.on('userTyping', function(){
	 	var currentUser = userList.findUser(socket.id, 'id');
		socket.broadcast.emit('userTyping', currentUser.userName + ' is typing...');
		console.log(currentUser.userName + ' is typing...');
	});
	socket.on('userNotTyping', function(){
		io.emit('userNotTyping');
	});
	socket.on('scrollChat', function() {
		io.emit('scrollChat');
	});

	socket.on('pieceDrop', function(pieceSource, pieceTarget) {
		io.emit('pieceDrop', pieceSource, pieceTarget);
	});
});
	// socket.on('disconnect', function() {
	// 	console.log('a user disconnected');
	// 	// if (!users[socket.id]) return;
	// 	// usernames.splice(usernames.indexOf(socket.username), 1);
	// 	// io.emit('userDisconnect', users[socket.id] +' disconnected');
	// 	// delete users[socket.id];
	// 	// updateUsernames();
	// });


http.listen(3000, function(){
	console.log('listening on *:3000');
});