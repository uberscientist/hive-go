
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

// Extending prototypes
Date.prototype.addHours = function(h){

  //Thanks kennebec from stackoverflow
  this.setHours(this.getHours() + h);
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
  db.sismember('go:already-voted', ip, function(err, data){
    if(err) throw err;
    
    if(data == 1){
      callback(true);

    } else {

      //update vote array
      go.voteStone(coord, function(coord){

        //Increase coordinate score by 1
        db.multi()
          .zincrby('go:votes', 1, JSON.stringify(coord))
          .sadd('go:already-voted', ip)
          .exec(function(err){
              if(err) throw err;
              callback(false);
          });
      });
    }
  });
};

function updateBoard(){

  //Set current color for tweet
  if(global.current_color = -1)
    var color = 'black\'s';
  else
    var color = 'white\'s';
  
  //...and tweet!
  tweet.updateStatus('New round! 2 hours until next vote count! It\'s ' + color + ' turn.');

  //Get top ranked coordinate
  db.zrevrange('go:votes', 0, 0, function(err, data){
    if(err) throw err;

    //In case of no votes reset clock
    if(data.length > 0){
      data = JSON.parse(data);
    } else {
      next_round = new Date().addHours(1);
      return;
    }
    
    //Update eidogo board
    go.playMove(data, global.current_color, function(coord){
      //Reset countdown
      next_round = new Date().addHours(1);

      //clear IPs and votes
      db.multi()
        .del('go:already-voted')
        .del('go:votes')
        .exec(function(err){
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

  //On connect send stuff from Redis so they can draw the page
  db.multi()
    .scard('go:already-voted')
    .zrange('go:votes', 0, -1, 'withscores')
    .exec(function(err, results){

      sendBoardInfo();
     });

 
  socket.on('vote', function(data){
    go.checkMove(data.coord, function(check){
      if(check){
        vote(data.coord, ip, function(voted){
          if(voted){
            socket.emit('message', { message: 'Your IP has already voted for this turn' })
          } else {
            socket.emit('message', { message: 'Every vote counts! Thank you' })
            sendBoardInfo();
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
  var countdown = next_round.getTime() - now;
  io.sockets.emit('tick', { until_next: countdown });

  //At end of round update board
  if(countdown <= 0){
    updateBoard();
  }
};

setInterval(untilNext, 1000);

// Initialization and interval timer
var next_round = new Date().addHours(1);

//Start color as black (-1)
global.current_color =  -1;

app.listen(3001);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
