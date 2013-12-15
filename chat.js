
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

var selfAddr = "http://flapchat.net";

var isHosting = false;
var callToID;

var images = [
              {'src': "/img/bkg.png", 'loaded':false, 'img':null},
              {'src': "/img/leftwing.png", 'loaded':false, 'img':null},
              {'src': "/img/rightwing.png", 'loaded':false, 'img':null},
              {'src': "/img/bird.png", 'loaded':false, 'img':null},
             {'src': "/img/siton.png", 'loaded':false, 'img':null},
             {'src': "/img/hidespot.png", 'loaded':false, 'img':null}
          ];
var numImagesLoaded = 0;

var callBtn;
var endCallBtn;

// entry point after page load
function setup()
{
  myVideo = document.createElement("video");
  myVideo.width = 160;
  myVideo.height = 120;
  myVideo.muted = true;
  myVideo.autoplay = true;

  theirVideo = document.createElement("video");
  theirVideo.width = 160;
  theirVideo.height = 120;
  theirVideo.muted = true;
  theirVideo.autoplay = true;
/*
  myVideo = document.getElementById("my-video");
  theirVideo = document.getElementById("their-video");
*/
  var container = document.getElementById("container");
  chatCanvas = document.createElement("canvas");
  chatCanvas.width = window.innerWidth;
  chatCanvas.height = window.innerHeight;
  container.appendChild(chatCanvas);
  /*
  chatCanvas = document.getElementById("chat-canvas");
  */
  chatContext = chatCanvas.getContext("2d");

  window.addEventListener( 'resize', onWindowResize, false );


  preloadImages(initializeVideo);
}

/*
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
*/

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
  var params = getUrlVars();
  callToID = params["call"];
  if (callToID != undefined) {
    isHosting = false;
  }
  else {
    isHosting = true;
  }

  initPeerjs();

  myVideo.src = URL.createObjectURL(stream);
  myVideo.play();
  myVideo.style.visibility = "hidden";

  console.log(window.innerWidth + "x" + window.innerHeight);

  myBox = new VideoBox(chatCanvas.width/2, 0, myVideo, true);
  myBox.init();

  /* handle request (call user or setup new conversation) */
  if (!isHosting)
  {
    outgoingCall(callToID);
  }
  
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
}

function initPeerjs()
{
  // peerjs stuff
  peer = new Peer({key:"flapchat-peerjs", host:"ec2-54-200-165-69.us-west-2.compute.amazonaws.com", port:8182});
  // peer = new Peer({ key: 'sgqbz6uzemf5hfr', debug: 1, config: {'iceServers': [
  //   { url: 'stun:stun.l.google.com:19302' } // Pass in optional STUN and TURN server for maximum network compatibility
  // ]}});

  // when we successfully connect to the peer server
  peer.on('open', function() {
    // display my ID on the web page
    if (isHosting) {
      //console.log($('my-id-label'));
      $('#my-id-label').text("Give this link to a friend to flapchat:");
      $('#my-id').text(selfAddr + "/?call=" + peer.id);
    }
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
        theirBox.setValues(data, chatCanvas.width, chatCanvas.height);
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

  // callBtn.style.visibility = "hidden";
  // endCallBtn.style.visibility = "visible";
}

function draw()
{
  if (!myBox) {
    return;
  }

  chatContext.clearRect(0, 0, chatCanvas.width, chatCanvas.height);

  // draw the background

  chatContext.drawImage(images[0].img, 0, 0, chatCanvas.width, chatCanvas.height);

  // draw sit on spot
  chatContext.drawImage(images[4].img, chatCanvas.width-200, chatCanvas.height/2, 200, chatCanvas.height/2+50);

  // draw my video box
  if (myBox) {
    myBox.update(chatCanvas);
    if (connection) {
      if (frameCount%2 == 0) {
        myBox.sendParams(connection, chatCanvas.width, chatCanvas.height);
      }
    }
    myBox.draw(chatContext);
  }

  if (theirBox) {
    theirBox.update(chatCanvas);
    theirBox.draw(chatContext);      
  }

  // draw hide spot
  chatContext.drawImage(images[5].img, -50, chatCanvas.height-250);


  requestAnimationFrame(draw);
  frameCount++;
}

function getUrlVars()
{
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

function onWindowResize()
{
  chatCanvas.width = window.innerWidth;
  chatCanvas.height = window.innerHeight;
}
