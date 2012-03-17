var spawn = require('child_process').spawn;

var gnugo = spawn('gnugo', ['--mode', 'gtp']);

gnugo.stdout.on('data', function(data){
  console.log('stdout:');
  console.log(data.toString('ascii'));
});

gnugo.stderr.on('data', function(data){
  console.log('stderr:');
  console.log(data.toString('ascii'));
});

for(var i = 1; i < 10; i++){
  if(i==1)
    gnugo.stdin.write('boardsize 9\n');
  if(i%2 !== 0)
    gnugo.stdin.write('play w a'+ i + '\n');
  else
    gnugo.stdin.write('play b a'+ i + '\n');
  if(i==9)
    gnugo.stdin.write('showboard\n');
}
