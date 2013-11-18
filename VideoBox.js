function VideoBox(x, y, vid, local)
{
	var posX = x;
	var posY = y;
	var leftWing = images[1].img;
	var rightWing = images[2].img;
	var birdImg = images[3].img;
	var video = vid;
	var isLocal = local;
	var velX = 0, velY = 0;
	var accX = 0, accY = 0;
	var mass = 10;

	var sizeX = 160;
	var sizeY = 120;

	var moveFactor = 1;

	var pContext = null;
	var processor = null;

	var leftWingVel = 0;
	var rightWingVel = 0;
	var leftWingT = 0;
	var rightWingT = 0;
	var leftWingRot = 0;
	var rightWingRot = 0;



	this.init = function()
	{
		// create private canvas to get video pixel data
  		var pCanvas = document.createElement("canvas");
  		pCanvas.width = sizeX;
  		pCanvas.height = sizeY;
  		pContext = pCanvas.getContext("2d");

  		// create the processor and initialize the background with the current video frame
		processor = new Processor(sizeX, sizeY);
	}

	this.applyForce = function(forceX, forceY)
	{
		accX += forceX/mass;
		accY += forceY/mass;
	}

	this.update = function(canvas)
	{
		if (!processor) {
			return;
		}

		// process new video frame
		if (isLocal)
		{
			var cFrame = this.readFrame(video);
			var movement = processor.getMovement(cFrame);

			// handle hands movement
			if (movement.right*moveFactor > 200) {
    			// println("right = " + rightMovement);
    			var force = movement.right/100;
    			this.applyForce(-force, -force*3);
				rightWingVel += force/15; 
  			}
			if (movement.left*moveFactor > 200) {
    			// println("right = " + rightMovement);
    			var force = movement.left/100;
    			this.applyForce(force, -force*3);
				leftWingVel += force/15; 
  			}

	  		// apply parameters
			velX += accX;
			velY += accY;

			posX += velX;
			posY += velY;

			this.applyBounds(canvas.width, canvas.height);

			accX = 0;
			accY = 0.7;	// gravity

			// friction
			velX *= 0.9;
			velY *= 0.9;
  		}

  		// handle wings rotation based on wings rotation velocity
		leftWingT += leftWingVel;
		rightWingT += rightWingVel;
		leftWingRot = 0.3 - Math.PI/8 + Math.sin(leftWingT)*Math.PI/8;
		rightWingRot = -0.3 + Math.PI/8 - Math.sin(rightWingT)*Math.PI/8;

		if (isLocal) {
			leftWingVel *= 0.7;
			rightWingVel *= 0.7;			
		}
	}

	this.draw = function(context)
	{
  		context.translate(posX, posY);

   		// draw left wings
   		context.translate(-sizeX/2+30, sizeY-50);
   		context.rotate(leftWingRot);
  		context.drawImage(leftWing, -leftWing.width, -leftWing.height/2);
  		context.rotate(-leftWingRot);
  		context.translate(sizeX/2-30, -sizeY+50);

   		// draw right wings
   		context.translate(sizeX/2-30, sizeY-50);
   		context.rotate(rightWingRot);
  		context.drawImage(rightWing, 0, -rightWing.height/2);
  		context.rotate(-rightWingRot);
  		context.translate(-sizeX/2+30, -sizeY+50);

  		// draw video frame
  		context.scale(-1, 1);
 		context.drawImage(video, -sizeX/2, 0, sizeX, sizeY);
  		context.scale(-1, 1);

  		// draw bird image on top of video
 		context.drawImage(birdImg, -sizeX/2-8, -30);


  		context.translate(-posX, -posY);
	}

	this.setValues = function(data)
	{
		posX = data.x;
		posY = data.y;
		leftWingVel = data.lv;
		rightWingVel = data.rv;
	}

	this.sendParams = function(conn)
	{
		if (conn) {
			var data = {'x':posX, 'y':posY, 'lv':leftWingVel, 'rv':rightWingVel};
			conn.send(data);
		}
	}

	this.applyBounds = function(w, h)
	{
		if (posX < 0) {
			velX *= -1;
			posX = 0;
		}
		else if (posX > w) {
			velX *= -1;
			posX = w;
		}

		if (posY < 0) {
			// velY *= -1;
			posY = 0;
		}
		else if (posY > h - sizeY) {
			velY *= -1;
			posY = h - sizeY;
		}
	}

	this.readFrame = function(video)
	{
  		try {
    		pContext.drawImage(video, 0, 0, sizeX, sizeY);
  		}
  		catch (e) {
    		return null;
  		}

  		return pContext.getImageData(0, 0, sizeX, sizeY);
	}




}