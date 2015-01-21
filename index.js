var express = require('express');
var path = require('path');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var users = {};
var games = {};
var usernames = [];
app.use(express.static(path.join(__dirname, 'public')));
var url = 'room';

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

app.get('/favicon.ico', function(req, res) {
	res.send('');
});

var createID = function () {
	return Date.now();
}


app.get('/create', function (req, res) {
	var newGame = createID();
	games[newGame] = {};

	res.redirect('/' + newGame);
});

app.get('/:gameID', function (req, res, next) {
	console.log(req.params);
	var gameID = req.params.gameID;
	//if (gameID.length !== 5) return res.send('Game ID not valid');
	res.sendFile(__dirname + '/index.html');
});


// app.use(express.static(__dirname + '/'));
// app.listen(process.env.PORT || 3000);

io.on('connection', function(socket) {
	console.log('a user connected');

	function updateUsernames() {
		io.emit('updateUsers', users);
	}

	socket.on('join room', function (room) {
		socket.room = room;
		if (games[room] && games[room].length && games[room].length <= 1) {
			games[room].push(socket.id);
			socket.join(room);
			console.log(users[socket.id], 'joined', room);
		} else if (games[room] && games[room].length && games[room].length >= 2) {
			console.log('too many people in the room');
		} else {
			games[room] = [];
			games[room].push(socket.id);
			socket.join(room);
			console.log(users[socket.id], 'joined', room);
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
		io.broadcast.to(socket.room).emit('userDisconnect', users[socket.id] +' disconnected');
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
		socket.broadcast.to(socket.room).emit('chessMove', boardPosition, gamePosition);
		console.log(boardPosition + 'player moved');
	});
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});

// http.listen(3000/+url, function() {
// 	console.log('new room on :3000/'+url);
// })