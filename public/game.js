var url = window.location.href;
var gameID = url.substring(url.lastIndexOf('/') + 1);
console.log(gameID);
var socket = io('/'+gameID),
$chat = $('#chatForm'),
$userForm = $('#userForm'),
$user = $('#user'),
$userList = $('.userList'),
$content = $('#main');

//User Typing Trigger
$('#m').keypress($.debounce(5000, true, function(){
	socket.emit('userTyping');
})).keypress($.debounce(5000, function(){
	socket.emit('userNotTyping');
}));



$(function() {
	var board,
	boardEl = $('#board'),
	game = new Chess(),
	 squareClass = 'square-55d63',
  	squareToHighlight,
  	colorToHighlight;

	var removeHighlights = function(color) {
	  boardEl.find('.square-55d63')
	    .removeClass('highlight-' + color);
	};

	var removeGreySquares = function() {
	  $('#board .square-55d63').css('background', '');
	};

	var greySquare = function(square) {
	  var squareEl = $('#board .square-' + square);
	  
	  var background = '#a9a9a9';
	  if (squareEl.hasClass('black-3c85d') === true) {
	    background = '#696969';
	  }

	  squareEl.css('background-color', background);
	};

	var onDragStart = function(source, piece) {
	  // do not pick up pieces if the game is over
	  // or if it's not that side's turn
	  if (game.game_over() === true ||
	      (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
	      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
	    return false;
	  }
	};

	var onDrop = function(source, target) {
	  removeGreySquares();

	  // see if the move is legal
	  var move = game.move({
	    from: source,
	    to: target,
	    promotion: 'q' // NOTE: always promote to a queen for example simplicity
	  });

	  // illegal move
	  if (move === null) return 'snapback';

	  	removeHighlights('black');
		removeHighlights('white');
		// highlight white's move
	  	boardEl.find('.square-' + source).addClass('highlight-white');
	  	boardEl.find('.square-' + target).addClass('highlight-black');

		// highlight black's move
		// boardEl.find('.square-' + move.from).addClass('highlight-black');
		squareToHighlight = move.to;

	};

	var onMouseoverSquare = function(square, piece) {
	  // get list of possible moves for this square
	  var moves = game.moves({
	    square: square,
	    verbose: true
	  });

	  // exit if there are no moves available for this square
	  if (moves.length === 0) return;

	  // highlight the square they moused over
	  greySquare(square);

	  // highlight the possible squares for this piece
	  for (var i = 0; i < moves.length; i++) {
	    greySquare(moves[i].to);
	  }
	};

	var onMouseoutSquare = function(square, piece) {
	  removeGreySquares();
	};

	var onSnapEnd = function() {
	  board.position(game.fen());
	  console.log(board.fen());
	  console.log(game.fen());
	  socket.emit('chessMove', board.fen(), game.fen());
	};

	var cfg = {
	  draggable: true,
	  position: 'start',
	  onDragStart: onDragStart,
	  onDrop: onDrop,
	  onMouseoutSquare: onMouseoutSquare,
	  onMouseoverSquare: onMouseoverSquare,
	  onSnapEnd: onSnapEnd
	};

	board = new ChessBoard('board', cfg);
	$(window).resize(board.resize);
	socket.on('chessMove', function(boardPosition, gamePosition){
	  	board.position(boardPosition);
	  	console.log(gamePosition);
	  	game.load(gamePosition);
	});
}); // end chess js

//Alert Connects and Disconnects
socket.on('userConnect', function(alert){
  $('#messages').append($('<li>').text(alert).addClass('connect-alert'));

});
socket.on('userDisconnect', function(alert){
  $('#messages').append($('<li>').text(alert).addClass('disconnect-alert'));
});
socket.on('updateUsers', function(users) {
	var html = $.map(users, function (user) {
		console.log(user);
		return user + '<br>'
	});
	$userList.html(html);
});
//Send Message Function
socket.on('chat message', function(msg, user){
  $('#messages').append($('<li>').text(user+': '+msg));
  socket.emit('scrollChat');
});
socket.on('userTyping', function(alert) {
	$('#messages').append($('<li>').text(alert).addClass('user-typing'));
	socket.emit('scrollChat');
});
socket.on('userNotTyping', function() {
	$('.user-typing').css('display', 'none');
});
socket.on('scrollChat', function() {
	//autoscroll chatbox
	var newscrollHeight = $("#messages").prop("scrollHeight") - 25; //Scroll height after the request
	$("#messages").animate({ scrollTop: newscrollHeight }, 'normal'); //Autoscroll to bottom of div
});
socket.on('joinError', function() {
	swal('Error','This room is already full', 'error');
});
socket.on('userNameError', function() {
	swal('Uh-oh', 'That username is already taken, try another one!', 'error');
})