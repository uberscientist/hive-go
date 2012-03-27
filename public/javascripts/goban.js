var socket = io.connect("http://localhost:3000");

window.onload = function(){
  var stage = new Kinetic.Stage("goban", 500, 500);
  var gobanLayer = new Kinetic.Layer();
  var stoneOverlay = new Kinetic.Layer();
  var background = new Kinetic.Layer();

  var gobanGridObj = new Image();
  var pos_x = 0, pos_y = 500;
  
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
    stage.add(stoneOverlay);
  };

  for(var i = 80; i >= 0; i--){
    (function(){

      pos_x++

      var circle = new Kinetic.Circle({
        x: pos_x * 50,
        y: pos_y - 50,
        radius: 23,

        //Creates point object to circle to pass to eidogo board/rules
        point: {x: pos_x - 1, y: Math.abs((pos_y - 500)) / 50 },
        alpha: .5,
      });

      if(i !== 0 && i%9 == 0){  //If end of row
        pos_y -= 50;            //Go to next row
        pos_x = 0;              //Go to beginning of row
      }

    circle.on("mouseover", function(){
      this.setFill("black");
      stoneOverlay.draw();
    })

    circle.on("mouseout", function(){
      this.setFill("transparent");
      stoneOverlay.draw();
    })

    circle.on("click", function(){
      socket.emit("vote", { coord: this.point });
    });

    stoneOverlay.add(circle);
    }());
  }

  gobanGridObj.src = "/images/goban9.png";

};
