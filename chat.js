
// Compatibility shim
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

var peer = null;

var myVideo, theirVideo;
var myStream, theirStream;

var existingCall = null;
var connection;

var chatContext;
var chatCanvas;

var processor = null;
var frameCount = 0;

var myBox = null;
var theirBox = null;

var images = [{'src': "/bkg.png", 'loaded':false, 'img':null},
              {'src': "/leftwing.png", 'loaded':false, 'img':null},
              {'src': "/rightwing.png", 'loaded':false, 'img':null},
              {'src': "/birdsmall2.png", 'loaded':false, 'img':null}];
var numImagesLoaded = 0;

var callBtn;
var endCallBtn;

// entry point after page load
function setup()
{
  myVideo = document.getElementById("my-video");
  theirVideo = document.getElementById("their-video");

  chatCanvas = document.getElementById("chat-canvas");
  chatContext = chatCanvas.getContext("2d");

  // call / end-call buttons
  callBtn = document.getElementById("make-call");
  endCallBtn = document.getElementById("end-call");
  endCallBtn.style.visibility = "hidden";
  callBtn.onclick = function() {
    var id = $('#callto-id').val();
    outgoingCall(id);    
  };

  endCallBtn.onclick = function() {
    existingCall.close();
  };

  // preload all images.
  // after all images are loaded initializeVideo will be called
  preloadImages(initializeVideo);
}

function preloadImages(onDone)
{
  for (var i=0; i<images.length; i++)
  {
    images[i].img = new Image();
    images[i].img.src = images[i].src;
    var image = images[i];
    images[i].img.onload = function() { imageLoadDone(onDone); }
    images[i].img.onerror = function() { imageLoadDone(onDone); }
  }
}

function imageLoadDone(onDone)
{
  numImagesLoaded++;

  if (numImagesLoaded == images.length) {
    onDone();
  }
}

function initializeVideo()
{
  // Get audio/video stream
  navigator.getUserMedia({audio: true, video: true}, startMyStream, function() {});
}

function startMyStream(stream)
{
  myStream = stream;

  // init peerjs stuff
  initPeerjs();

  myVideo.src = URL.createObjectURL(stream);
  myVideo.play();
  myVideo.style.visibility = "hidden";

  myBox = new VideoBox(chatCanvas.width/2, 0, myVideo, true);
  myBox.init();

  requestAnimationFrame(draw);
}

function startTheirStream(stream)
{
  theirStream = stream;

  theirVideo.src = URL.createObjectURL(stream);
  theirVideo.play();
  theirVideo.style.visibility = "hidden";

  theirBox = new VideoBox(chatCanvas.width/2, 0, theirVideo, false);
  theirBox.init();
}

function callEnded()
{
  theirBox = null;

  callBtn.style.visibility = "visible";
  endCallBtn.style.visibility = "hidden";
}

function initPeerjs()
{
  // peerjs stuff
  peer = new Peer({ key: 'sgqbz6uzemf5hfr', debug: 1, config: {'iceServers': [
    { url: 'stun:stun.l.google.com:19302' } // Pass in optional STUN and TURN server for maximum network compatibility
  ]}});

  // when we successfully connect to the peer server
  peer.on('open', function() {
    // display my ID on the web page
    $('#my-id').text(peer.id);
  });

  // when someone calls us
  peer.on('call', incomingCall);

  // Receiving a data connection
  peer.on('connection', function(conn) { 
    connection = conn;
    attachDataConnListeners();
  });

  peer.on('error', function(err){
    alert(err.message);
  });
}

function attachDataConnListeners()
{
    connection.on('open', function() {
      console.log("CONNECTION OPENNED");
    });

    // Receive messages
    connection.on('data', function(data) {
      if (theirBox) {
        theirBox.setValues(data);
      }
    });
}

function incomingCall(call)
{
  // Answer the call automatically (instead of prompting user) for demo purposes
  call.answer(myStream);

  connectWithCall(call);
}

function outgoingCall(id)
{
  var call = peer.call(id, myStream);
  connection = peer.connect(id);
  attachDataConnListeners();
  connectWithCall(call);
}

function connectWithCall(call)
{
  // hand up previous call if exists
  if (existingCall) {
    existingCall.close();
  }
  existingCall = call;

  // Wait for stream on the call, then set peer video display
  call.on('stream', startTheirStream);

  call.on('close', callEnded);

  callBtn.style.visibility = "hidden";
  endCallBtn.style.visibility = "visible";
}

function draw()
{
  if (!myBox) {
    return;
  }

  chatContext.clearRect(0, 0, chatCanvas.width, chatCanvas.height);

  // draw the background
  chatContext.drawImage(images[0].img, 0, 0, chatCanvas.width, chatCanvas.height);

  // draw my video box
  if (myBox) {
    myBox.update(chatCanvas);
    if (connection) {
      if (frameCount%2 == 0) {
        myBox.sendParams(connection);
      }
    }
    myBox.draw(chatContext);
  }

  if (theirBox) {
    theirBox.update(chatCanvas);
    theirBox.draw(chatContext);      
  }

  requestAnimationFrame(draw);
  frameCount++;
}

addEventListener("DOMContentLoaded", setup);
