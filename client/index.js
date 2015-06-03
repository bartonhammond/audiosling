var myImageUploader = new Slingshot.Upload("myImageUploads");
var myAudioUploader = new Slingshot.Upload("myAudioUploads");
var audioContext;
var audioRecorder;
var _realAudioInput;

var BinaryFileReader = {
  read: function(file, callback){
    var reader = new FileReader;

    var fileInfo = {
      name: file.name,
      type: file.type,
      size: file.size,
      file: null
    }

    reader.onload = function(){
      fileInfo.file = new Uint8Array(reader.result);
      callback(null, fileInfo);
    }
    reader.onerror = function(){
      callback(reader.error);
    }

    reader.readAsArrayBuffer(file);
  }
}

function handlerStartUserMedia(stream) {

  console.log('handlerStartUserMedia');
  console.log('sampleRate:'+ audioContext.sampleRate);

  // MEDIA STREAM SOURCE -> ZERO GAIN >
  _realAudioInput = audioContext.createMediaStreamSource(stream);

  audioRecorder = new Recorder(_realAudioInput, function(blob) {
    BinaryFileReader.read(blob, function(err, fileInfo){
      var audio = {
        blob: fileInfo,
        blobURL: window.URL.createObjectURL(blob),
        submitted: new Date(),
        mp3: ''
      };
      Audios.insert(audio);
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
  },
  'click #saveAudio': function(e, tmpl) {
    var _self = this;
    var blob = new Blob([_self.blob.file],{type: _self.blob.type});
    var _id = _self._id;
    myAudioUploader.send(blob, function (error, downloadUrl) {
      if (!error) {
        Audios.update({_id: _id}, 
          {$set:
           { url: downloadUrl }
          });
      }//error
    });
  }
});
Template.recordingButtons.helpers({
  audios: function() {
    return Audios.find();
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
