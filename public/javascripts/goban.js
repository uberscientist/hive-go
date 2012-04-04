var socket = io.connect("http://localhost:3001");

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
function pad(num){
  var str = '' + num;
  while (str.length < 2){
    str = '0' + str;
  }
  return str;
}
function updateTimer(time){
  var SEC = 1000,           //Timer variables 
      MIN = SEC * 60,
      HOUR = MIN * 60;

  if(time <= 0){
    $("div.timer").html("00:00:00");
    return;
  }

  var hour = pad(Math.floor(time/HOUR));
  var min = pad(Math.floor(time/MIN) - hour * 60);
  var sec = pad(Math.floor(time/SEC) - (hour * 60 * 60) - (min * 60));
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

function drawInfo(data){
  var passes = data.passes;
  var resigns = data.resigns;

  var pass_count = new Kinetic.Text({
    x: 150,
    y: 500,
    text: "",
    fontSize: 20,
    fontFamily: "Chelsea Market",
    textFill: "black",
    fill: "#A36400",
    stroke: "#7A4B00",
    strokeWidth: 3,
    padding: 15,
    align: "center",
    verticalAlign: "middle"
  });
}

function drawStones(data){
  var stones = data.stones;
  var heat = data.heat;
  var heatOverlay = new Kinetic.Layer();
  window.stoneOverlay = new Kinetic.Layer();
  var pos_x = 0, pos_y = 500;

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
        point: { x: pos_x - 1, y: Math.abs((pos_y - 500)) / 50 },
      });

      if(circle.heat != 0){
        var vote_display = new Kinetic.Text({    //Vote counter text object
          text:"",
          fontFamily: "Chelsea Market",
          fontSize: 28,
          textFill: "black", 
          textStroke: "white", 
        });

        //Adjust vote size based on #
        if(circle.heat == 1)
          vote_display.setPosition(circle.x - 5, circle.y - 14);
        else if(circle.heat > 1 && circle.heat < 10)
          vote_display.setPosition(circle.x - 10, circle.y - 14);
        else if(circle.heat > 9 && circle.heat < 20){ //Double digits
          vote_display.setFontSize(25);
          vote_display.setPosition(circle.x - 13, circle.y - 14);
        } else {
          vote_display.setFontSize(25);
          vote_display.setPosition(circle.x - 19, circle.y - 14);
        }

        vote_display.setText(circle.heat);
        heatOverlay.add(vote_display);
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

      circle.on("click", function(){
        socket.emit("vote", { coord: this.point });
      });

      stoneOverlay.add(circle);
    }());
  }

  /**
  * Create "pass" and "resign" buttons
  */

  var pass_text = new Kinetic.Text({
    x: 150,
    y: 500,
    text: "Pass " + data.passes,
    fontSize: 20,
    fontFamily: "Chelsea Market",
    textFill: "black",
    fill: "#F6AA31",
    stroke: "black",
    strokeWidth: 2,
    padding: 15,
    align: "center",
    verticalAlign: "middle"
  });
 
  var resign_text = new Kinetic.Text({
    x: 350,
    y: 500,
    text: "Resign " + data.resigns,
    fontSize: 20,
    fontFamily: "Chelsea Market",
    textFill: "black",
    fill: "#F6AA31",
    stroke: "black",
    strokeWidth: 2,
    padding: 15,
    align: "center",
    verticalAlign: "middle"
  });

  //Functions to deal with mouse events
  function button_over(button){
    button.setFill("#DB8700");
    stoneOverlay.draw();
  }

  function button_out(button){
    button.setFill("#F6AA31");
    stoneOverlay.draw();
  }

  //event listeners
  pass_text.on("mouseover", function(){
    button_over(this);
  });
  pass_text.on("mouseout", function(){
    button_out(this);
  });
  pass_text.on("click", function(){
    socket.emit("vote", { coord: "pass" } );
  });

  resign_text.on("mouseover", function(){
    button_over(this);
  });
  resign_text.on("mouseout", function(){
    button_out(this);
  });
  resign_text.on("click", function(){
    socket.emit("vote", { coord: "resign" } );
  });

  stoneOverlay.add(pass_text);
  stoneOverlay.add(resign_text);

  //Add pass/resign votes to stoneOverlay
//  drawInfo(data);
  
  //Draw board, then add stones/votes after everything else is done
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
                                                      fill: "#E09110" });

    gobanLayer.add(gobanBack);
    gobanLayer.add(gobanGrid);

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
      gobanLayer.add(alpha);
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
      gobanLayer.add(number);
    }

    stage.add(gobanLayer);
    callback();
  };

  gobanGridObj.src = "/images/goban9.png";
};
