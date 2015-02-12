// var socket = io(),
var $chat = $('#chatForm'),
$userForm = $('#userForm'),
$gameForm = $('#gameForm'),
$user = $('#user'),
$userList = $('.userList'),
$content = $('#main');

var room = location.pathname.slice(1);;

// var playerTurn = 'w';
$chat.submit(function(e){
	e.preventDefault();
	socket.emit('chat message', $('#m').val());
	socket.emit('userNotTyping');
	$('#m').val('');
	return false;
});

$userForm.submit(function(e){
	e.preventDefault();
	var newUserData = {};
	newUserData.userName = $('#userName').val();

	newUserData.color = 'w';
	console.log(newUserData);

	$.post('/create', newUserData, function(userData) {
		console.log(userData);
		if (!userData) {
			swal('Uh-oh', 'That username is already taken, try another one!', 'error');
		}
		else  {
			localStorage.setItem("username", newUserData.userName);
			console.log(localStorage.getItem('username'));
			window.location ='/create';

			//After Redirect Join user to socket room
			// socket.emit('join room', userData, function(username) {
			// 	console.log(username);
			// });
		}
	});

	$('#userName').val(''); 
});

$gameForm.submit(function(e) {
	e.preventDefault();
	var newUserData = {};
	newUserData.userName = $('#joinUserName').val();
	newUserData.color = 'b';
	newUserData.gameId = $('#gameCode').val();

	$.post('/join', newUserData, function(userData) {
		// if post is successful redirect 
		window.location = '/game/' + newUserData.gameId;
		
	}).fail(function(xhr) {
		var response = JSON.parse(xhr.responseText);
		switch(response.error) {
			case 'userNameExists':
				swal('Uh-oh', 'That username is already taken, try another one!', 'error');
				break;
			case 'gameDoesNotExist':
				swal('Sorry', 'That game code is invalid, make sure the code is correct!', 'error');
				break;
			case 'gameIsFull':
				swal('Sorry', 'That game is already full, try joining another game!', 'error');
				break;
			default:
				swal('SERVER ERROR', 'Something went wrong, try again', 'error');
				break;
		}
	});
})


$('#createButton').click(function(){
	$('.username-modal').css('display', 'block');
})

$('#joinButton').click(function(){
	$('.game-modal').css('display', 'block');
})

// //Alert Connects and Disconnects
// socket.on('userConnect', function(alert){
//   $('#messages').append($('<li>').text(alert).addClass('connect-alert'));
// });
// socket.on('userDisconnect', function(alert){
//   $('#messages').append($('<li>').text(alert).addClass('disconnect-alert'));
// });
