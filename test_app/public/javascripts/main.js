var socket_address = "wss://echo.websocket.org";
var max_users = 3;
var max_channels = 3;
var messages_interval = 3000;

var users = [];
var channels = [];
var messages = [];

for (var i = 0; i < max_users; i++) {
  users.push({
    first_name: 'User - ' + i + ' First Name',
    last_name: 'User - ' + i + ' Last Name',
    username: 'User - ' + i + ' User Name'
  });
}

for (i = 0; i < max_channels; i++) {
  channels.push({ channel: 'Channel - ' + i });
}

var getRandomInt = function (min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
};

var guid = function () {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }

  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
};

var printMessages = function() {
  var results = _.chain(messages)
    .groupBy(function(item) {
      return item.channel;
    })
    .pairs()
    .map(function(pair) {
      return {
        channel: pair[0],
        users: _.chain(pair[1])
          .groupBy(function(message) {
            return message.user.username;
          })
          .pairs()
          .map(function(t) { return { user: t[0], messages: t[1].map(function(m) { return m.message; }) } })
          .sortBy('user')
          .value()
      };
    })
    .sortBy('channel')
    .value();

  var $results = $('#results');
  var $channels = $('<ul/>');

  _.each(results, function(channel) {
    var $users = $('<ul/>');
    var $channel= $('<li/>');
    $channel.append('<span>Channel: ' + channel.channel + '</span>');

    _.each(channel.users, function(user) {
      var $messages = $('<ul/>');
      var $user = $('<li/>');
      $user.append('<span>User: ' + user.user + '</span>');
      _.each(user.messages, function(message) {
        var $message = $('<li></li><span>id: ' + message.id + '; text: ' + message.text + '</span></li>');
        $messages.append($message);
      });

      $user.append($messages);
      $users.append($user);
    });

    $channel.append($users);
    $channels.append($channel);
  });

  $results.append($channels);
};

var max_messages = getRandomInt(5, 10);

var initSockets = function() {
  var start = function() {
    var counter = 0;

    var interval = setInterval(function() {
      if (counter >= max_messages) {
        clearInterval(interval);
        return;
      }

      var channel = channels[getRandomInt(0, channels.length)];
      var user = users[getRandomInt(0, users.length)];
      var data = {
        user: user,
        channel: channel.channel,
        message: {
          id: guid(),
          text: guid()
        }
      };

      socket.send(JSON.stringify(data));
      counter++;
    }, messages_interval);
  };

  var socket = new WebSocket(socket_address);
  socket.onopen = function() {
    $('#status').text("Connected...");
    console.log("Connected...");
    start();
  };

  socket.onclose = function(event) {
    if (event.wasClean) {
      console.log('Socket closed cleanly');
    } else {
      console.log('Socket closed');
    }

    $('#status').text('Code: ' + event.code + ' reason: ' + event.reason);
    console.log('Code: ' + event.code + ' reason: ' + event.reason);
  };

  socket.onmessage = function(event) {
    messages.push(JSON.parse(event.data));
    $('#status').text('Got ' + messages.length + ' messages. ' + (max_messages - messages.length) + ' messages left...');
    $('#messages').append('<div>' + event.data + '</div>');

    if (messages.length === max_messages) {
      printMessages();
    }
  };

  socket.onerror = function(error) {
    console.log("Error " + error.message);
  };
};

function ready() {
  initSockets();
}

