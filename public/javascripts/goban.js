var socket = io.connect("http://localhost:3000");

// Socket.IO events
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
  $("#current-color").html(current_color);

  //Set global stones
  window.stones = data.stones;
  drawStones();
});

// Functions
function updateTimer(time){
  // Timer vars
  var SEC = 1000,
      MIN = SEC * 60,
      HOUR = MIN * 60;

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
  $("div.voting").hide().html(message).fadeIn("slow");
}

function drawStones(){
  window.stoneOverlay = new Kinetic.Layer();

  //Setup gradients for stones
  var context = stoneOverlay.getContext();
  var white_grd = context.createRadialGradient(-30, -30, 5, 0, -5, 25);
  white_grd.addColorStop(0, "#ffffff");
  white_grd.addColorStop(1, "#bbbbbb");

  var black_grd = context.createRadialGradient(-30, -30, 1, -5, -5, 25);
  black_grd.addColorStop(0, "#d8d8d8");
  black_grd.addColorStop(1, "#000000");

  var pos_x = 0, pos_y = 500;

  function getStoneColor(i){
    switch(window.stones[Math.abs(i - 80)]){
      case 0:
        return "transparent";
      case -1:
        return black_grd;
      case 1:
        return white_grd;
    }
  };

  for(var i = 80; i >= 0; i--){
    (function(){
      pos_x++

      var circle = new Kinetic.Circle({

        x: pos_x * 50,
        y: pos_y - 50,
        radius: 23,
        name: i,
        fill: getStoneColor(i),

        //Creates and binds point object to circle to pass to eidogo board/rules
        point: {x: pos_x - 1, y: Math.abs((pos_y - 500)) / 50 },
      });

      if(i !== 0 && i%9 == 0){  //If end of row
        pos_y -= 50;            //Go to next row
        pos_x = 0;              //Go to beginning of row
      }

      circle.on("mouseover", function(){
        if(getStoneColor(circle.name) != "transparent")
          return;
        this.setFill(current_color);
        this.setAlpha(.5);
        stoneOverlay.draw();
      })

      circle.on("mouseout", function(){
        this.setFill(getStoneColor(this.name));
        this.setAlpha(1);
        stoneOverlay.draw();
      })

      circle.on("mouseup", function(){
        socket.emit("vote", { coord: this.point });
      });

      stoneOverlay.add(circle);
    }());
  }
  
  drawBoardBg(function(){
    stage.add(stoneOverlay);
  });
}

function drawBoardBg(callback){
  window.stage = window.stage || new Kinetic.Stage("goban", 500, 500);
  var gobanLayer = gobanLayer || new Kinetic.Layer();
  var background = background || new Kinetic.Layer();

  var gobanGridObj = new Image();
  
  //Draw the backround
  gobanGridObj.onload = function(){

    var gobanGrid = gobanGrid || new Kinetic.Image({ image: gobanGridObj,
                                                          x: 50,
                                                          y: 50 });

    var gobanBack = gobanBack || new Kinetic.Rect({ width: 500,
                                                    height: 500,
                                                      fill: "#CC7D00" });
    gobanLayer.add(gobanBack);
    gobanLayer.add(gobanGrid);
    stage.add(gobanLayer);
    callback();
  };

  gobanGridObj.src = "/images/goban9.png";
};
