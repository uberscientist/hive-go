require('./lang.js');
require('./eidogo.js');
require('./board.js');
require('./rules.js');

// Setup Eidogo board
exports.pass = pass = 0;
var board = new eidogo.Board;
var rules = exports.rules = new eidogo.Rules(board);


exports.playMove = function (coord, color, callback) {
  if (coord == 'pass') {

    //Check if both players have passed in row
    exports.pass = pass += 1;
    if(pass == 2){
      pass = 0;
      rules.board.reset();
      global.current_color = -1;
    }
    callback('pass');
  } else if (coord == 'resign') {
    pass = 0;

    //reset game if resign
    rules.board.reset();
    global.current_color = -1;
    callback('resign');
  } else if (coord) {
    pass = 0;

    //Add stone  
    board.addStone(coord, color);
    rules.apply(coord, color);
    callback(coord);
  }
};

exports.checkMove = function (coord, callback) {
  if (rules.board.stones[coord.y * 9 + coord.x] == 0){
    callback(true);
  } else if (coord == 'pass' || coord == 'resign'){
    callback(true);
  } else {
    callback(false);
  }
}
