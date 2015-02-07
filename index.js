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

function user(username, socket) {
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

userList.prototype.newUser = function(username, socket) {
	var newUser = new user(username, socket);
	this.users.push(newUser);
}

function gamesCollection() {
	this.games = [];
};

function game(id, white, black) {
	this.id = id;
	this.white = white;
	this.black = black;
}

gamesCollection.prototype.newGame = function(id, color) {
	if (color == 'white') {
		var newGame = new game(id, color);
		this.games.push(newGame);
	}

	else if (color == 'black') {
		var newGame = new game(id, undefined, color);
		this.games.push(newGame);
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
		alert('this game is full');
	}
}

var gamesCollection = new gamesCollection();
var userList = new userList();


var createID = function () {
	return Math.random().toString(36).substring(16);
}

app.post('/create', function(req, res) {

	if (userList.findUser(req.body.userName)!= -1) {
		console.log('username already exists');
		// socket.emit('userNameError');	
		res.send(false);	
	}
	else {
		userList.newUser(req.body.userName); // add user to userList
		var randID = createID();
		gamesCollection.newGame(randID, req.body.userName);
		//req.body is data object
		req.session.gameId = randID;
		// req.session.userName = req.body.userName;
		res.redirect('/create');
		// res.send(req.body);
	}
});

app.post('/join', function(req,res) {

	var response;

	if(usernames.indexOf(req.body.userName) == -1) { //if username  exists
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

	socket.emit('startSetup', socket.id);

	socket.on('setup', function(username){
		console.log('socket: '+socket.id);
		console.log(username + ' connected');


		var currentUser = userList.findUser(username);
		currentUser.socket = socket.id;
		console.log(userList);
		//var currentUserName = data.userName

		//localStorage on index.js yo
		var currentUserName = gamesCollection.findGame()
		var currentUser = userList.findUser(currentUserName);
		console.log('current user:'+currentUser.userName);
		currentUser.socket = socket.id;
		console.log(currentUserName + ' connected');
		console.log(userList);

		socket.on('join room', function ( userData, callback) {
			var room = createID();
			socket.room = room;
		});
	})
});

// app.use(express.static(__dirname + '/'));
// app.listen(process.env.PORT || 3000);

// io.on('connection', function(socket) {
// 	console.log('a user connected');

// 	function updateUsernames() {
// 		socket.emit('updateUsers', users);
// 	}

// 	socket.on('join room', function ( userData, callback) {
// 		var room = createID();
// 		socket.room = room;


// 			// if (games[room] && games[room].length && games[room].length <= 1) {
// 			// 	games[room].push(socket.id);
// 			// 	socket.join(room);
// 			// 	users[socket.id] = userData.userName;
// 			// 	socket.username = userData.userName
// 			// 	console.log(users);
// 			// 	console.log(users[socket.id], 'joined', room);
// 			// 	updateUsernames();
				
// 			// 	socket.broadcast.to(socket.room).emit('userConnect', users[socket.id] +' connected');
// 			// 	// callback(true);
			
// 			// } else if (games[room] && games[room].length && games[room].length >= 2) {
// 			// 	console.log('too many people in the room');
// 			// 	callback(false);
// 			// } else {
// 			// 	games[room] = [];
// 			// 	games[room].push(socket.id);
// 			// 	socket.join(room);
// 			// 	users[socket.id] = userData.userName;
// 			// 	socket.username = userData.userName
// 			// 	console.log(users);
// 			// 	console.log(users[socket.id] + ' joined ' + room);
// 			// 	socket.broadcast.to(socket.room).emit('userConnect', users[socket.id] +' connected');
// 			// }			
		
// 	});

	// socket.on('updateUsers', function(usernameVal, callback){
	// 	if (usernames.indexOf(usernameVal)!= -1) {
	// 		console.log(usernameVal);
	// 		console.log(users);
	// 		callback(false);
	// 	}
	// 	else {
	// 		console.log(usernameVal);
	// 		console.log('false');
	// 		callback(true);
	// 		users[socket.id] = usernameVal;
	// 		socket.username = usernameVal
	// 		usernames.push(usernameVal);
	// 		console.log(users);

	// 		updateUsernames();
	// 		socket.broadcast.to(socket.room).emit('userConnect', users[socket.id] +' connected');
	// 	}
	// });

	// socket.on('disconnect', function() {
	// 	console.log('a user disconnected');
	// 	// if (!users[socket.id]) return;
	// 	// usernames.splice(usernames.indexOf(socket.username), 1);
	// 	// io.emit('userDisconnect', users[socket.id] +' disconnected');
	// 	// delete users[socket.id];
	// 	// updateUsernames();
	// });
	// socket.on('chat message', function(msg) {
	// 	socket.to(socket.room).emit('chat message', msg, users[socket.id]);
	// 	console.log(users[socket.id]+': '+msg);
	// });
	// socket.on('userTyping', function(){
	// 	socket.broadcast.to(socket.room).emit('userTyping', users[socket.id] + ' is typing...');
	// 	console.log(users[socket.id] + ' is typing...');
	// });
	// socket.on('userNotTyping', function(){
	// 	socket.broadcast.to(socket.room).emit('userNotTyping');
	// });
	// socket.on('scrollChat', function() {
	// 	socket.to(socket.room).emit('scrollChat');
	// });
	// socket.on('chessMove', function(boardPosition, gamePosition) {
	// 	// socket.broadcast.to(socket.room).emit('chessMove', boardPosition, gamePosition);
	// 	socket.emit('chessMove', boardPosition, gamePosition);
	// 	console.log(boardPosition + ' player moved');
	// });
// });

http.listen(3000, function(){
	console.log('listening on *:3000');
});

// http.listen(3000/+url, function() {
// 	console.log('new room on :3000/'+url);
// })