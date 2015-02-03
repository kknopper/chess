var socket = io(),
$chat = $('#chatForm'),
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

	$.post('/create', newUserData,  function(userData) {
		console.log(userData);
		if (!userData) {
			swal('Uh-oh', 'That username is already taken, try another one!', 'error');
		}
		else  {
			window.location ='/create';

			//After Redirect Join user to socket room
			socket.emit('join room', userData, function(username) {
				console.log(username);
			});
		}
	});

	$('#userName').val(''); 
});

$gameForm.submit(function(e) {
	e.preventDefault();
	var newUserData = {};
	newUserData.userName = $('#joinUserName').val();
	newUserData.color = 'b';
	newUser.gameID = $('#gameCode').val();

	$.post('/join', newUserData, function(userData) {

		if (userData == 0) {
			swal('Sorry', 'That game code is invalid, make sure the code is correct!', 'error');
		}

		else if (userData == 1) {
			swal('Uh-oh', 'That username is already taken, try another one!', 'error');
		}

		else{
			window.location = '/game/' + gameRoom;
			socket.emit('join room', userName, function(username) {
				console.log(username);
			});
		}
	})
})


$('#createButton').click(function(){
	$('.username-modal').css('display', 'block');
})

$('#joinButton').click(function(){
	$('.game-modal').css('display', 'block');
})

//Alert Connects and Disconnects
socket.on('userConnect', function(alert){
  $('#messages').append($('<li>').text(alert).addClass('connect-alert'));
});
socket.on('userDisconnect', function(alert){
  $('#messages').append($('<li>').text(alert).addClass('disconnect-alert'));
});
