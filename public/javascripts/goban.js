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

  drawStones(data);
});

// Functions
function updateTimer(time){
  var SEC = 1000,           //Timer variables 
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

//Map gameboard array to color
function getStoneColor(i, stones, heat){

  //Setup gradients for stones
  var context = stoneOverlay.getContext();
  var white_grd = context.createRadialGradient(-30, -30, 5, 0, -5, 25);
  white_grd.addColorStop(0, "#ffffff");
  white_grd.addColorStop(1, "#bbbbbb");

  var black_grd = context.createRadialGradient(-30, -30, 1, -5, -5, 25);
  black_grd.addColorStop(0, "#d8d8d8");
  black_grd.addColorStop(1, "#000000");

  switch(stones[Math.abs(i - 80)]){
    case 0:
      if(heat[80-i] == 0)
        return "transparent";
      else
        return "#8F0000";             // Return red for positions with votes
    case -1:
      return black_grd;
    case 1:
      if($.browser.mozilla == true)   // check for FF and 
        return "white";               // return flat white instead of gradient
      else
        return white_grd;
  }
};

function drawStones(data){
  var stones = data.stones;
  var heat = data.heat;
  var heatOverlay = new Kinetic.Layer();
  var pos_x = 0, pos_y = 500;
  window.stoneOverlay = new Kinetic.Layer();

  //Vote display
  var vote_display = new Kinetic.Text({
    text:"",
    fontFamily: "Chelsea Market",
    fontSize: 28,
    textFill: "black", 
    textStroke: "white", 
  });

  for(var i = 80; i >= 0; i--){
    (function(){
      pos_x++

      var circle = new Kinetic.Circle({

        x: pos_x * 50,
        y: pos_y - 50,
        radius: 23,
        name: i,
        heat: heat[80-i],
        fill: getStoneColor(i, stones, heat),
        alpha: (heat[80-i] != 0) ? .2 : 1,

        //Creates and binds point object to circle to pass to eidogo board/rules
        point: { x: pos_x - 1, y: Math.abs((pos_y - 500)) / 50 },
      });

      if(heat[80-i] != 0){
        vote_display.setPosition(circle.x - 5, circle.y - 15);
        vote_display.setText(circle.heat);
        heatOverlay.draw();
      }

      if(i !== 0 && i%9 == 0){  // If end of row
        pos_y -= 50;            // Go to next row
        pos_x = 0;              // Go to beginning of row
      }

      circle.on("mouseover", function(){
        var circ_fill = getStoneColor(circle.name, stones, heat);

        if(circ_fill != "#8F0000" && circ_fill != "transparent"){
          return;
        }
        this.setFill(current_color);
        this.setAlpha(.3);
        stoneOverlay.draw();
      })

      circle.on("mouseout", function(){
        this.setFill(getStoneColor(this.name, stones, heat));
        heatOverlay.draw();
        if(this.fill != "#8F0000"){
          this.setAlpha(1);
        }
        stoneOverlay.draw();
      })

      circle.on("mouseup", function(){
        socket.emit("vote", { coord: this.point });
      });

      stoneOverlay.add(circle);
    }());
  }


  heatOverlay.add(vote_display);

  /**
  * Create "pass" and "resign" buttons
  */
  var pass_rect = new Kinetic.Rect({
    x: 100,
    y: 480,
    width: 100,
    height: 40,
    fill: "#A36400",
    stroke: "#7A4B00",
    strokeWidth: 3
  });

  var pass_text = new Kinetic.Text({
    x: 150,
    y: 500,
    text: "Pass",
    fontSize: 20,
    fontFamily: "Chelsea Market",
    textFill: "black",
    align: "center",
    verticalAlign: "middle"
  });

  var resign_rect = new Kinetic.Rect({
    x: 300,
    y: 480,
    width: 100,
    height: 40,
    fill: "#A36400",
    stroke: "#7A4B00",
    strokeWidth: 3
  });

  var resign_text = new Kinetic.Text({
    x: 350,
    y: 500,
    text: "Resign",
    fontSize: 20,
    fontFamily: "Chelsea Market",
    textFill: "black",
    align: "center",
    verticalAlign: "middle"
  });

  function button_over(button){
    button.setFill("#F6AA31");
    stoneOverlay.draw();
  }
  function button_out(button){
    button.setFill("#A36400");
    stoneOverlay.draw();
  }

  pass_rect.on("mouseover", function(){
    button_over(this);
  });
  pass_text.on("mouseover", function(){
    button_over(pass_rect);
  });
  pass_rect.on("mouseout", function(){
    button_out(this);
  });
  pass_text.on("mouseout", function(){
    button_out(pass_rect);
  });
  pass_rect.on("mouseup", function(){
    socket.emit("vote", { coord: "pass" } );
  });
  pass_text.on("mouseup", function(){
    socket.emit("vote", { coord: "pass" } );
  });

  resign_rect.on("mouseover", function(){
    button_over(this);
  });
  resign_text.on("mouseover", function(){
    button_over(resign_rect);
  });
  resign_rect.on("mouseout", function(){
    button_out(this);
  });
  resign_text.on("mouseout", function(){
    button_out(resign_rect);
  });
  resign_rect.on("mouseup", function(){
    socket.emit("vote", { coord: "resign" } );
  });
  resign_text.on("mouseup", function(){
    socket.emit("vote", { coord: "resign" } );
  });

  stoneOverlay.add(pass_rect);
  stoneOverlay.add(resign_rect);
  stoneOverlay.add(pass_text);
  stoneOverlay.add(resign_text);

  //Add coordinates
  for(var i=0; i < 9; i++){
    alpha = new Kinetic.Text({
      x: 50 + i * 50,
      y: 18,
      fontFamily: "Chelsea Market",
      fontSize: 10,
      text: (i == 8) ? "J" : String.fromCharCode(65 + i),
      textFill: "black",
      align: "center",
      verticalAlign: "middle"
    });
    stoneOverlay.add(alpha);
  }
  
  for(var i=0; i < 9; i++){
    number = new Kinetic.Text({
      x: 18,
      y: 50 + i * 50,
      fontFamily: "Chelsea Market",
      fontSize: 10,
      text: 9 - i,
      textFill: "black",
      align: "center",
      verticalAlign: "middle"
    });
    stoneOverlay.add(number);
  }
  
  //Draw board, then add stones after everything else is done
  drawBoardBg(function(){
    stage.add(heatOverlay);
    stage.add(stoneOverlay);
  });
}

function drawBoardBg(callback){
  window.stage = window.stage || new Kinetic.Stage("goban", 500, 550);
  var gobanLayer = gobanLayer || new Kinetic.Layer();
  var background = background || new Kinetic.Layer();

  var gobanGridObj = new Image();
  
  //Draw the backround
  gobanGridObj.onload = function(){

    var gobanGrid = gobanGrid || new Kinetic.Image({ image: gobanGridObj,
                                                          x: 50,
                                                          y: 50 });

    var gobanBack = gobanBack || new Kinetic.Rect({ width: 500,
                                                    height: 550,
                                                      fill: "#CC7D00" });
    gobanLayer.add(gobanBack);
    gobanLayer.add(gobanGrid);
    stage.add(gobanLayer);
    callback();
  };

  gobanGridObj.src = "/images/goban9.png";
};
