
/**
 * Module dependencies.
 */
var go = require('./eidogo'),

    //Redis client
    db = require('db.js');

var express = require('express')
  , routes = require('./routes')

  , app = module.exports = express.createServer()
  , io = require('socket.io').listen(app);

//Lowering debug level to clear up console
io.set('log level', 1);

// Extending prototypes
Date.prototype.addHours = function(h){

  //Thanks kennebec from stackoverflow
  this.setHours(this.getHours() + h);
  return this;
}

Date.prototype.addMinutes = function(m){

  //Thanks kennebec from stackoverflow
  this.setMinutes(this.getMinutes() + m);
  return this;
}

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Functions
function vote(coord, ip, callback){
  db.sismember('go:already-voted', ip, function(err, data){
    if(err) throw err;

    if(data){
      callback(false);

    } else {

      //Increase coordinate score by 1
      db.multi()
        .zincrby('go:votes', 1, JSON.stringify(coord))
        .sadd('go:already-voted', ip)
        .exec(function(err){
            if(err) throw err;
            callback(true);
        });
    }
  });
};

function updateBoard(){
  //Get top ranked coordinate
  db.zrevrange('go:votes', 0, 0, function(err, data){
    if(err) throw err;

    //In case of no votes reset clock
    if(data.length > 0){
      data = JSON.parse(data);
    } else {
      next_round = new Date().addMinutes(1).getTime();
      return;
    }
    
    //Update eidogo board
    go.playMove(data, global.current_color, function(coord){
       //Reset countdown
      next_round = new Date().addMinutes(1).getTime();
      //clear IPs and votes
      db.multi()
        .del('go:already-voted')
        .del('go:votes')
        .exec(function(err){
          if(err) throw err;

          //Reverse color
          global.current_color = -global.current_color;

          io.sockets.emit('message', { message: 'New Turn!' });
          io.sockets.emit('board', { color: global.current_color
                                  , stones: go.rules.board.stones });
        });
    });
  });
}


// Routes
app.get('/', routes.index);

// Socket.IO
io.sockets.on('connection', function(socket){
  var ip = socket.handshake.address.address;
  io.sockets.emit('board', { color: global.current_color
                          , stones: go.rules.board.stones });

  socket.on('vote', function(data){
    go.checkMove(data.coord, function(check){
      if(check){
        vote(data.coord, ip, function(voted){
          if(!voted){
            socket.emit('message', { message: 'Your IP has already voted for this turn' })
          } else {
            socket.emit('message', { message: 'Every vote counts! Thank you' })
          }
        });
      } else {
        socket.emit('message', { message: 'Invalid Move' });
      }
    })
  });

});

//Timer updater
function untilNext(){
  var now = new Date().getTime();
  var countdown = next_round - now;
  io.sockets.emit('tick', { until_next: countdown });

  //At end of round update board
  if(countdown <= 0){
    updateBoard();
  }
};

setInterval(untilNext, 1000);

// Initialization and interval timer
var next_round = new Date().addMinutes(1).getTime();

//Start color as black (-1)
global.current_color =  -1;

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
