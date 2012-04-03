require('./lang.js');
require('./eidogo.js');
require('./board.js');
require('./rules.js');

// Setup Eidogo board
exports.pass_in_a_row = pass_in_a_row = 0;
var board = new eidogo.Board;
var rules = exports.rules = new eidogo.Rules(board);

function resetCounters(){
    //Reset vote array + pass/resigns
    rules.board.markers = rules.board.makeBoardArray(0);
    rules.board.passes = 0;
    rules.board.resigns = 0;
}

exports.playMove = function (coord, color, callback) {
  if (coord == 'pass') {

    exports.pass_in_a_row = pass_in_a_row += 1;

    //Check if both players have passed in row
    if(pass_in_a_row == 2){
      exports.pass_in_a_row = pass_in_a_row = 0;
      rules.board.reset();
      global.current_color = -1;
    }

    resetCounters();
    callback('pass');

  } else if (coord == 'resign') {
    exports.pass_in_a_row = pass_in_a_row = 0;

    //reset game if resign
    rules.board.reset();
    global.current_color = -1;

    resetCounters();
    callback('resign');
  } else if (coord) {
    exports.pass_in_a_row = pass_in_a_row = 0;

    //Add stone  
    board.addStone(coord, color);
    rules.apply(coord, color);

    resetCounters();
    callback(coord);
  }
};

//function to collect votes into 'markers' and 'passes'/'resigns'
exports.voteStone = function (old_coord, coord, callback){

  if(old_coord != false){
    if(old_coord == 'pass'){
      rules.board.passes -= 1;
    }
    else if(old_coord == 'resign'){
      rules.board.resigns -= 1;
    }
    else {
      rules.board.markers[old_coord.y * 9 + old_coord.x] -= 1;
    }
  } 

  if (coord == 'pass'){
    rules.board.passes += 1;
    callback();

  } else if (coord == 'resign'){
    rules.board.resigns += 1;
    callback();

  } else {
    rules.board.markers[coord.y * 9 + coord.x] += 1;
    callback();
  }
}

exports.checkMove = function (coord, callback) {
  if (rules.board.stones[coord.y * 9 + coord.x] == 0){
    callback(true);
  } else if (coord == 'pass' || coord == 'resign'){
    callback(true);
  } else {
    callback(false);
  }
}
