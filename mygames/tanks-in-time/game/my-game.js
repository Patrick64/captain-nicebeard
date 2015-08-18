var io = require('sandbox-io');

io.on('connection', function(socket) {
  // See the generated log in the server console:
  log.debug('New connection', socket.id);
  // Send a message to this player:
  socket.emit('srv-msg', { message: 'Welcome!' });
  // Link a receiveClientMessage reference to this socket
  // and add it as a listener for 'cli-msg' events:
  socket.on('cli-msg', receiveClientMessage.bind(socket));
});

function receiveClientMessage(data) {
  if (data == 'Hello') {
    this.emit('srv-msg', { hello: 'Wold!' });
  } else {
    this.emit('srv-msg', {
      data: data,
      msg: 'This data is a ' +
       data.constructor.toString().replace(/^function ([^(]+).*/, '$1')
      }
    );
  }
}