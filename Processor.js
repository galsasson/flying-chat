function Processor(w, h)
{
	var width = w;
	var height = h;
	var rightBorder = width-width/4;
	var leftBorder = width/4;
	var topBorder = height/2;
	var bottomBorder = height;

	// RGBA of previous frame
	var prevFrame = [];

	this.getMovement = function(frame) {
		var movement = {'left':0, 'right':0};

  		for (var y=0; y<height; y++)
  		{
  			// scan left side
    		for (var x=0; x<leftBorder; x++)
    		{
      			var i = (x + y*width)*4;

      			// get current frame color
 			    var currR = frame.data[i];
      			var currG = frame.data[i+1];
      			var currB = frame.data[i+2];

      			// get background color
      			var prevR = prevFrame[i];
      			var prevG = prevFrame[i+1];
      			var prevB = prevFrame[i+2];

      			// Compute the difference of the red, green, and blue values
      			var diffR = Math.abs(currR - prevR);
      			var diffG = Math.abs(currG - prevG);
      			var diffB = Math.abs(currB - prevB);

      			var diffSum = diffR + diffG + diffB;
      
      			if (diffSum > 50) {
      				movement.right++;
      			}
      		}

      		// scan right side
    		for (var x=rightBorder; x<width; x++)
    		{
      			var i = (x + y*width)*4;

      			// get current frame color
 			    var currR = frame.data[i];
      			var currG = frame.data[i+1];
      			var currB = frame.data[i+2];

      			// get background color
      			var prevR = prevFrame[i];
      			var prevG = prevFrame[i+1];
      			var prevB = prevFrame[i+2];

      			// Compute the difference of the red, green, and blue values
      			var diffR = Math.abs(currR - prevR);
      			var diffG = Math.abs(currG - prevG);
      			var diffB = Math.abs(currB - prevB);

      			var diffSum = diffR + diffG + diffB;
      
      			if (diffSum > 50) {
      				movement.left++;
      			}
    		}
  		}

  		prevFrame = frame.data;
  		return movement;
	}
}