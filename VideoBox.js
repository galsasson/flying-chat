function VideoBox(x, y, vid)
{
	var posX = x;
	var posY = y;
	var video = vid;
	var velX = 0, velY = 0;
	var accX = 0, accY = 0;
	var mass = 10;

	var sizeX = 160;
	var sizeY = 120;

	var moveFactor = 1;

	var pContext = null;
	var processor = null;

	this.init = function()
	{
		// create private canvas to get video pixel data
  		var pCanvas = document.createElement("canvas");
  		pCanvas.width = sizeX;
  		pCanvas.height = sizeY;
  		pContext = pCanvas.getContext("2d");

  		// create the processor and initialize the background with the current video frame
		processor = new Processor(sizeX, sizeY);
		this.initBackground();
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
		var cFrame = this.readFrame(video);
		var movement = processor.getMovement(cFrame);
		if (movement.right*moveFactor > 200) {
    		// println("right = " + rightMovement);
    		var force = movement.right/300;
    		this.applyForce(force, -force*2);
  		}
		if (movement.left*moveFactor > 200) {
    		// println("right = " + rightMovement);
    		var force = movement.left/300;
    		this.applyForce(-force, -force*2);
  		}

		velX += accX;
		velY += accY;

		posX += velX;
		posY += velY;

		this.applyBounds(canvas.width, canvas.height);

		accX = 0;
		accY = 1;	// gravity

		// friction
		velX *= 0.96;
		velY *= 0.96;
	}

	this.draw = function(context)
	{
  		context.scale(-1, 1);
  		context.translate(-posX, posY);
  		context.drawImage(video, -sizeX, 0, sizeX, sizeY);
  		context.translate(posX, -posY);
  		context.scale(-1, 1);
	}

	this.applyBounds = function(w, h)
	{
		if (posX < 0) {
			velX *= -1;
			posX = 0;
		}
		else if (posX > w - sizeX) {
			velX *= -1;
			posX = w - sizeX;
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


	this.initBackground = function()
	{
		if (!video) {
			return;
		}

		var curFrame = this.readFrame(video);
		processor.initBackground(curFrame);
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