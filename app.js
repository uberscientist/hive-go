/**
 * Module dependencies.
 */
var go = require('./eidogo'),
    tweet = require('tweet.js'),

    //Redis client
    db = require('db.js');

var express = require('express')
  , routes = require('./routes')

  , app = module.exports = express.createServer()
  , io = require('socket.io').listen(app);

//Lowering debug level to clear up console
io.set('log level', 1);

// Set round time in minutes
var round_time = 21;

// Extending prototypes
Date.prototype.addHours = function(h){

  //Thanks kennebec from stackoverflow
  this.setHours(this.getHours() + h);
  return this;
}

Date.prototype.addMinutes = function(m){
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
function sendBoardInfo(){
    io.sockets.emit('board', { color: global.current_color
                            , stones: go.rules.board.stones
                            ,   heat: go.rules.board.markers
                            , passes: go.rules.board.passes
                            ,resigns: go.rules.board.resigns });
}


function vote(coord, ip, callback){
  var expire_time = Math.round(next_round.getTime()/1000);

  db.exists('go:'+ip, function(err, data){
    if(err) throw err;

    if(data == 0){
      db.multi()
        .set('go:'+ip, JSON.stringify(coord))
        .expireat('go:'+ip, expire_time)
        .zincrby('go:votes', 1, JSON.stringify(coord))
        .exec(function(err, results){
          if(err) throw err;
          go.voteStone(false, coord, function(){
            callback();
          });
        });
    } else {
      db.get('go:'+ip, function(err, old_coord){
        db.multi()
          .zincrby('go:votes', -1, old_coord)
          .zincrby('go:votes', 1, JSON.stringify(coord))
          .set('go:'+ip, JSON.stringify(coord))
          .expireat('go:'+ip, expire_time)
          .exec(function(err){
            if(err) throw err;
            go.voteStone(JSON.parse(old_coord), coord, function(){
              callback();
            });
          });
      });
    }
  });
};

function updateBoard(){

  //Set current color for tweet
  if(global.current_color = 1)
    var color = 'black\'s';
  else
    var color = 'white\'s';
  
  //...and tweet!
  tweet.updateStatus('New round! '+ round_time +' minutess until next vote count! It\'s ' + color + ' turn.');

  //Get top ranked coordinate
  db.zrevrange('go:votes', 0, 0, function(err, data){
    if(err) throw err;

    //In case of no votes reset clock
    if(data.length > 0){
      data = JSON.parse(data);
    } else {
      next_round = new Date().addMinutes(round_time);
      return;
    }
    
    //Update eidogo board
    go.playMove(data, global.current_color, function(coord){
      //Reset countdown
      next_round = new Date().addMinutes(round_time);

      //clear votes
      db.del('go:votes', function(err){
        if(err) throw err;

        //Reverse color, or let reset if end-game
        if((coord == 'pass' && go.pass_in_a_row == 2) || coord == 'resign')
          global.current_color = global.current_color;
        else
          global.current_color = -global.current_color;

        io.sockets.emit('message', { message: 'until next vote count' });
        console.log(next_round);

        sendBoardInfo();
      });
    });
  });
}


// Routes
app.get('/', routes.index);

// Socket.IO
io.sockets.on('connection', function(socket){
  var ip = socket.handshake.address.address;

  //On connect send board info
  sendBoardInfo();
 
  socket.on('vote', function(data){
    go.checkMove(data.coord, function(check){
      if(check){
        vote(data.coord, ip, function(){
          socket.emit('message', { message: 'Every vote counts! Thank you' })
          sendBoardInfo();
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
  var countdown = next_round.getTime() - now;
  io.sockets.emit('tick', { until_next: countdown });

  //At end of round update board
  if(countdown <= 0){
    updateBoard();
  }
};

setInterval(untilNext, 1000);

// Initialization and interval timer
var next_round = new Date().addMinutes(round_time);

//Start color as black (-1)
global.current_color =  -1;

app.listen(3001);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
