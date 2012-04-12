/**
 * Module dependencies.
 */
var go = require('./eidogo'),
    tweet = require('tweet.js'),
    sgf = require('sgf.js'),

    //Redis client
    db = require('db.js');

var express = require('express')
  , routes = require('./routes')

  , app = module.exports = express.createServer()
  , io = require('socket.io').listen(app);

//Lowering debug level to clear up console
io.set('log level', 1);

// Set round time in minutes
var round_time = 1;

// Extending date prototype
Date.prototype.addHours = function(h){

  //Thanks kennebec from stackoverflow
  this.setHours(this.getHours() + h);
  return this;
}

Date.prototype.addMinutes = function(m){
  this.setMinutes(this.getMinutes() + m);
  return this;
}

Date.prototype.addSeconds = function(s){
  this.setSeconds(this.getSeconds() + s);
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

  //Get UNIX time stamp for when all votes should expire
  var expire_time = Math.round(next_round.getTime()/1000);

  db.exists('go:'+ip, function(err, data){
    if(err) throw err;

    if(data == 0){

      //First time voting??
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

      //Subsequent votes...
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

  //Reset timer/tweet variables
  global.tweeted = false;
  global.start_time = new Date().getTime();
  global.next_round = new Date().addMinutes(round_time);

  //Get top ranked coordinate
  db.zrevrange('go:votes', 0, 0, function(err, data){
    if(err) throw err;

    //In case of no votes reset clock
    if(data.length > 0){
      coord = JSON.parse(data);

      //Update eidogo board
      go.playMove(coord, function(coord){

        //clear votes
        db.del('go:votes', function(err){
          if(err) throw err;

          //Reverse color, or let reset if end-game
          if((coord == 'pass' && go.pass_in_a_row == 2) || coord == 'resign'){
            global.current_color = global.current_color;
          } else {
            global.current_color = -global.current_color;
          }

          sendBoardInfo();

          //update SGF file
          sgf.move(coord);
        });
      });
    } else {
      next_round = new Date().addMinutes(round_time);
      return;
    }
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
          sendBoardInfo();
        });
      }
    });
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

  //halfway through round tweet round info
  var half_way = ((next_round - start_time)/2) + start_time;
  if(tweeted == false && now > half_way){
    //tweet.info(next_round, go.rules.board.markers);
    global.tweeted = true;
  }
};

// Initialization and interval timer
global.start_time = new Date().getTime();
global.next_round = new Date().addMinutes(round_time);

//Start color as black
global.current_color =  -1;
global.tweeted = false;

setInterval(untilNext, 1000);

app.listen(3001);
