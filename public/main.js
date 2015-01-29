var socket = io(),
$chat = $('#chatForm'),
$userForm = $('#userForm'),
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


$('#createButton').click(function(){
	$('.modal').css('display', 'block');
})

//Alert Connects and Disconnects
socket.on('userConnect', function(alert){
  $('#messages').append($('<li>').text(alert).addClass('connect-alert'));
});
socket.on('userDisconnect', function(alert){
  $('#messages').append($('<li>').text(alert).addClass('disconnect-alert'));
});
