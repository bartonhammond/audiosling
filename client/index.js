var myImageUploader = new Slingshot.Upload("myImageUploads");
var myAudioUploader = new Slingshot.Upload("myAudioUploads");
var audioContext;
var audioRecorder;
var _realAudioInput;


function handlerStartUserMedia(stream) {

  console.log('handlerStartUserMedia');
  console.log('sampleRate:'+ audioContext.sampleRate);

  // MEDIA STREAM SOURCE -> ZERO GAIN >
  _realAudioInput = audioContext.createMediaStreamSource(stream);

  audioRecorder = new Recorder(_realAudioInput, function(blob) {
    console.log('blob completed' + blob.size + ' ' + blob.type);
    myAudioUploader.send(blob, function (error, downloadUrl) {
      if (!error) {
        Meteor.users.update(Meteor.userId(), {$set: {"profile.audio": {'name': 'audio', 'url': downloadUrl}}});
      }
    });

  });
}

function handlerErrorUserMedia(e) {
  console.log('No live audio input: ', e);
}


function dataURItoBlob(dataURI) {
  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  var binary = atob(dataURI.split(',')[1]);
  var array = [];
  for(var i = 0; i < binary.length; i++) {
    array.push(binary.charCodeAt(i));
  }
  return new Blob([new Uint8Array(array)], {type: mimeString});
}
/**
 * When DOM is ready.  This causes the page to ask for Microphone permissions
 */
Template.recordingButtons.rendered = function() {
  window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;
  
  navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
  
  window.URL = window.URL || window.webkitURL;
  
  audioContext = new AudioContext;
  
  navigator.getUserMedia({video:false, audio: true}, handlerStartUserMedia, handlerErrorUserMedia);
  
};

Template.recordingButtons.events({
  'click #startRecordingBtn': function(e) {
    console.log('startRecordingBtn clicked');
    if(!audioRecorder)
      return;
    
    audioRecorder && audioRecorder.record();

    //GUI - setup reactive in Session so buttons work together
  },
  'click #stopRecordingBtn': function(e) {
    console.log('stopRecordingBtn clicked');
    if(!audioRecorder)
      return;
    audioRecorder && audioRecorder.stop();
    //GUI - setup reactive in Session so buttons work together
  }
});
Template.recordingButtons.helpers({
  audio: function() {
    var user = Meteor.users.findOne(Meteor.userId());
    if (user && user.profile && user.profile.audio) {
      return user.profile.audio.url;
    } else {
      return undefined;
    }
  }
});
Template.slingshotForm.events({
  'submit form': function(e) {
    console.log('submit form');
    e.preventDefault();
    var file =  document.getElementById('fileToUpload').files[0];

    processImage(file, 300, 300, function(dataURI) {
      var blob = dataURItoBlob(dataURI);
      myImageUploader.send(blob, function (error, downloadUrl) {
        Meteor.users.update(Meteor.userId(), {$push: {"profile.files": {'name': file.name, 'url': downloadUrl}}});
      });

    });

  }
});


Template.uploadedPictures.helpers ({
  pictures: function() {
    var user = Meteor.users.findOne(Meteor.userId());
    if (user && user.profile && user.profile.files) {
      return user.profile.files;
    } else {
      return [];
    }
  }
})
