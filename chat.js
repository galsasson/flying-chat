
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

var images = [{'src': "/bkg.png", 'loaded':false, 'img':null}];
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

  myBox = new VideoBox(0, 0, myVideo);
  myBox.init();

  requestAnimationFrame(draw);
}

function startTheirStream(stream)
{
  theirStream = stream;

  theirVideo.src = URL.createObjectURL(stream);
  theirVideo.play();
  theirVideo.style.visibility = "hidden";

  theirBox = new VideoBox(0, 0, theirVideo);
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
  peer = new Peer({ key: 'sgqbz6uzemf5hfr', debug: 3, config: {'iceServers': [
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
      console.log('Received', data);
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

// UI Peer helper methods
/*
function step1 () {
  // Get audio/video stream
  navigator.getUserMedia({audio: true, video: true}, function(stream){
    // Set your video displays
    $('#my-video').prop('src', URL.createObjectURL(stream));

    window.localStream = stream;
    step2();
  }, function(){ $('#step1-error').show(); });
}

function step2 () {
  $('#step1, #step3').hide();
  $('#step2').show();
}

function step3 (call) {
  // Hang up on an existing call if present
  if (window.existingCall) {
    window.existingCall.close();
  }

  // Wait for stream on the call, then set peer video display
  call.on('stream', function(stream){
    $('#their-video').prop('src', URL.createObjectURL(stream));
  });

  // UI stuff
  window.existingCall = call;
  $('#their-id').text(call.peer);
  call.on('close', step2);
  $('#step1, #step2').hide();
  $('#step3').show();
}


// PeerJS object
// Insert your own key here!
var peer = new Peer({ key: 'sgqbz6uzemf5hfr', debug: 3, config: {'iceServers': [
  { url: 'stun:stun.l.google.com:19302' } // Pass in optional STUN and TURN server for maximum network compatibility
]}});

peer.on('open', function(){
  $('#my-id').text(peer.id);
});

// Receiving a call
peer.on('call', function(call){
  // Answer the call automatically (instead of prompting user) for demo purposes
  call.answer(window.localStream);
  step3(call);
});

// Receiving a data connection
peer.on('connection', function(conn) { 
  connection = conn;
  attachConnListeners();
});

peer.on('error', function(err){
  alert(err.message);
  // Return to step 2 if error occurs
  step2();
});

function attachConnListeners() {
  connection.on('open', function() {
    console.log("CONNECTION OPENEED");
    // Receive messages
    connection.on('data', function(data) {
      console.log('Received', data);
    });

    // Send messages
    connection.send('Hello!');
  });
}

// Button cick handlers setup
$(function(){
  $('#make-call').click(function(){
    // Initiate a call!
    var id = $('#callto-id').val();
    var call = peer.call(id, window.localStream);
    connection = peer.connect(id);
    attachConnListeners();
    step3(call);
  });

  $('#end-call').click(function(){
    window.existingCall.close();
    step2();
  });

  // Retry if getUserMedia fails
  $('#step1-retry').click(function(){
    $('#step1-error').hide();
    step1();
  });

  // Send message over data connection
  $('#send-data').click(function(){
    var msg = $('#data-msg').val();
    //console.log("sent ");
    connection.send(msg);
  });


  // Start speech
  $('#start-speech').click(function(){
    console.log("starting speech");
    startSpeech();
    $('#start-speech').hide();
  });

  // Start facetracking
  $('#start-tracking').click(function(){
    console.log("starting tracking");
    startTracking();
    $('#start-tracking').hide();
  });

  // Get things started
  step1();
});




// Chrome speech to text
// See github.com/yyx990803/Speech.js for more.
function startSpeech() {

  var speech = new Speech({
      // lang: 'cmn-Hans-CN', // Mandarin Chinese, default is English.
      // all boolean options default to false
      debugging: false, // true, - will console.log all results
      continuous: true, // will not stop after one sentence
      interimResults: true, // trigger events on iterim results
      autoRestart: true, // recommended when using continuous:true
                        // because the API sometimes stops itself
                        // possibly due to network error.
  });

  // simply listen to events
  // chainable API
  speech
      .on('start', function () {
          console.log('started')
      })
      .on('end', function () {
          console.log('ended')
      })
      .on('error', function (event) {
          console.log(event.error)
      })
      .on('interimResult', function (msg) {
      })
      .on('finalResult', function (msg) {
        // if (connection) connection.send(msg);
        console.log("sent: " + msg);
      })
      .start()
}


// CLM Facetracking 
// See github.com/auduno/clmtrackr for more.

function startTracking() {

  var vid = document.getElementById('my-video');
  var overlay = document.getElementById('overlay');
  var overlayCC = overlay.getContext('2d');
  
  var ctrack = new clm.tracker({useWebGL : true});
  ctrack.init(pModel);

  startVideo();

  function startVideo() {

    // start video
    vid.play();
    // start tracking
    ctrack.start(vid);
    // start loop to draw face
    drawLoop();
  }
  
  function drawLoop() {
    requestAnimationFrame(drawLoop);
    overlayCC.clearRect(0, 0, overlay.width, overlay.height);
    //psrElement.innerHTML = "score :" + ctrack.getScore().toFixed(4);
    if (ctrack.getCurrentPosition()) {
      ctrack.draw(overlay);
    }
  }

}
*/

