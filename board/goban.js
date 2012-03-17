window.onload = function(){
  var stage = new Kinetic.Stage("goban", 500, 500);
  var gobanLayer = new Kinetic.Layer();
  var stoneOverlay = new Kinetic.Layer();
  var debugOverlay = new Kinetic.Layer();

  var bgGobanObj = new Image();
  var pos_x = 0, pos_y = 0;
  
  //Draw the backround
  bgGobanObj.onload = function(){
    var bgGoban = new Kinetic.Image({ image: bgGobanObj,
                                          x: 50,
                                          y: 50 });
    gobanLayer.add(bgGoban);
    stage.add(gobanLayer);
    stage.add(stoneOverlay);
  };

  for(var i = 0; i <= 80; i++){
    (function(){

      if(i !== 0 && i%9 == 0){  //If end of row
        pos_y += 50;            //Go to next row
        pos_x = 0;              //Go to beginning of row
      }

      var circle = new Kinetic.Circle({
      x: pos_x * 50 + 50,
      y: pos_y + 50,
      radius: 23,
      name: i,
      alpha: .5,
      stroke: "none",
      strokeWidth: 2
    });

    pos_x++

    circle.on("mouseover", function(){
      this.setFill("black");
      stoneOverlay.draw();
    })

    circle.on("mouseout", function(){
      this.setFill("none");
      stoneOverlay.draw();
    })

    circle.on("click", function(){
      this.setFill("black");
      this.alpha = 1;
      stoneOverlay.draw();
      alert(this.name);
    });

    stoneOverlay.add(circle);
    }());
  }

  bgGobanObj.src = "goban9.png";

};
