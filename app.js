var express = require('express');
var http = require('http');
var socketIO = require('socket.io');
var path = require('path');
var m = require('mori');
var game = require('./game.js');

var app = express();
var server = http.Server(app);
var io = socketIO(server);

app.set('views', path.join(__dirname, 'templates'));
app.set('view engine', 'jade');

// app.use(express.static('public'));
app.use('/public', express.static('public'));

var gameState = game.getInitialState();

app.get('/', function(req, res) {
  // var stateObject = m.toJs(gameState);
  // console.log('gameState:', stateObject);
  // res.render('index', stateObject);
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log('CONNECT', socket.id);
  socket.on('log on', function(name){
    console.log('LOG ON', name);
    gameState = game.addPlayer(name, gameState);
    console.log('gameState.players:', m.get(gameState, 'players'));
    socket.broadcast.emit('log on', name);
  })
  socket.on('log off', function(name) {
    console.log('LOG OFF', name);
    gameState = game.removePlayer(name, gameState);
    console.log('gameState.players:', m.get(gameState, 'players'));
    socket.broadcast.emit('log off', name);
  })
  socket.on('disconnect', function(){
    console.log('DISCONNECT', socket.id);
  });
  socket.on('card click', function(click){
    console.log('CARD CLICK', click.user, click.card);
    gameState = game.claimCard(click.user, click.card, gameState);
    console.log('gameState.players.' + click.user + '.claimed:', m.getIn(gameState, ['players', click.user, 'claimed']));
    io.emit('card click', click);
    // can I turn this into a function that takes 2 callbacks?
    //game.processClick(click, function() {socket.emit("success");}, function() {socket.emit("failure");})
    var hasCandidate = game.checkForCandidate(click.user, gameState);
    if (hasCandidate) {
        var hasSet = game.checkForSet(click.user, gameState);
        if (hasSet) {
          console.log("HAS SET", click.user, m.getIn(gameState, ['players', click.user, 'claimed']));
          // increment score etc.
          // emit set success event
        }
        else {
          console.log("NOT SET", click.user, m.getIn(gameState, ['players', click.user, 'claimed']));
          // decrement score etc.
          // emit set failure event
        }
    }

  });
});

server.listen(3000, function() {
  console.log("listening on port 3000");
});
