var express = require('express');
var path = require('path');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var users = {};
app.use(express.static(path.join(__dirname, 'public')));
var url = 'room';

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

var nsp = io.of('/room');

// app.use(express.static(__dirname + '/'));
// app.listen(process.env.PORT || 3000);

nsp.on('connection', function(socket) {
	console.log('a user connected');

	function updateUsernames() {
		io.emit('updateUsers', users);
	}

	socket.on('updateUsers', function(usernameVal, callback){
		if (usernameVal in users) {
			callback(false);
		}
		else {
			console.log(usernameVal);
			callback(true);
			users[socket.id] = usernameVal;

			updateUsernames();
			socket.broadcast.emit('userConnect', users[socket.id] +' connected');
		}
	});

	socket.on('disconnect', function() {
		console.log('a user disconnected');
		if (!socket.id) return;
		// users.splice(users.indexOf(users[socket.id]), 1);
		delete users[socket.id];
		updateUsernames();
		io.emit('userDisconnect', users[socket.id] +' disconnected');
	});
	socket.on('chat message', function(msg) {
		io.emit('chat message', msg, users[socket.id]);
		console.log(users[socket.id]+': '+msg);
	});
	socket.on('userTyping', function(){
		socket.broadcast.emit('userTyping', 'a user is typing...');
		console.log('a user is typing...');
	});
	socket.on('userNotTyping', function(){
		socket.broadcast.emit('userNotTyping');
	});
	socket.on('scrollChat', function() {
		socket.emit('scrollChat');
	});
	socket.on('chessMove', function(boardPosition, gamePosition) {
		socket.broadcast.emit('chessMove', boardPosition, gamePosition);
		console.log(boardPosition + 'player moved');
	});
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});

// http.listen(3000/+url, function() {
// 	console.log('new room on :3000/'+url);
// })