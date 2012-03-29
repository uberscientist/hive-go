require('./lang.js');
require('./eidogo.js');
require('./board.js');
require('./rules.js');

// Setup Eidogo board
var board = new eidogo.Board;
var rules = exports.rules = new eidogo.Rules(board);


exports.playMove = function (coord, color, callback) {
  if (coord == 'pass') {
    callback('pass');
  } else if (coord == 'resign') {
    callback('resign');
  } else if (coord) {
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
