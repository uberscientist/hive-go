var socket = io.connect("http://localhost:3000");

//Timer vars
var SEC = 1000,
    MIN = SEC * 60,
    HOUR = MIN * 60;

//Socket.IO events
socket.on("message", function(data){
  updateMessage(data.message);
});

socket.on("tick", function(data){
  updateTimer(data.until_next);
});

socket.on("board", function(data){
  if(data.color == -1)
    window.current_color = "black";
  else
    window.current_color = "white";
  $('#current-color').html(current_color);

  //Set global stones
  window.stones = data.stones;
  drawStones();
});

function updateTimer(time){
  if(time <= 0){
    $("div.timer").html("-:-:-");
    return;
  }

  var hour = Math.floor(time/HOUR);
  var min = Math.floor(time/MIN) - hour * 60;
  var sec = Math.floor(time/SEC) - (hour * 60 * 60) - (min * 60);
  $("div.timer").html(hour + ":" + min + ":" + sec);
}

function updateMessage(message){
  $("div.voting").html(message);
}

function getStoneColor(index){
  var color = window.stones[Math.abs(index - 80)];
  if(color == 0)
    return "transparent";
  if(color == -1)
    return "black";
  if(color == 1)
    return "white";
}

function drawStones(){
  window.stoneOverlay = window.stoneOverlay || new Kinetic.Layer();
  stoneOverlay.clear();
  var pos_x = 0, pos_y = 500;

  for(var i = 80; i >= 0; i--){
    (function(){
      pos_x++

      var circle = new Kinetic.Circle({
        x: pos_x * 50,
        y: pos_y - 50,
        radius: 23,
        name: i,
        fill: getStoneColor(i),

        //Creates point object to circle to pass to eidogo board/rules
        point: {x: pos_x - 1, y: Math.abs((pos_y - 500)) / 50 },
      });

      if(i !== 0 && i%9 == 0){  //If end of row
        pos_y -= 50;            //Go to next row
        pos_x = 0;              //Go to beginning of row
      }

    circle.on("mouseover", function(){
      this.setFill(current_color);
      stoneOverlay.draw();
    })

    circle.on("mouseout", function(){
      this.setFill(getStoneColor(this.name));
      stoneOverlay.draw();
    })

    circle.on("click", function(){
      socket.emit("vote", { coord: this.point });
    });

    stoneOverlay.add(circle);
    }());
  }

  stage.add(stoneOverlay);
  stoneOverlay.draw();
}

window.onload = function(){
  window.stage = new Kinetic.Stage("goban", 500, 500);
  var gobanLayer = new Kinetic.Layer();
  var background = new Kinetic.Layer();

  var gobanGridObj = new Image();
  
  //Draw the backround
  gobanGridObj.onload = function(){
    var gobanGrid = new Kinetic.Image({ image: gobanGridObj,
                                            x: 50,
                                            y: 50 });

    var gobanBack = new Kinetic.Rect({ width: 500,
                                      height: 500,
                                        fill: "#CC7D00" });
    gobanLayer.add(gobanBack);
    gobanLayer.add(gobanGrid);
    stage.add(gobanLayer);
    drawStones();
  };

  gobanGridObj.src = "/images/goban9.png";
};
