(function(window) {

  var encoderMp3Worker = new Worker('/enc/mp3/mp3Worker.js');

  var Recorder = function(source, callback) {

    var bufferLen = 4096;
    var recording = false;
    encoderMp3Worker.callback = callback;
    this.context = source.context;

    /*
      ScriptProcessorNode createScriptProcessor (optional unsigned long bufferSize = 0,
      optional unsigned long numberOfInputChannels = 2, optional unsigned long numberOfOutputChannels = 2 );
    */

    this.node = (this.context.createScriptProcessor || this.context.createJavaScriptNode).call(this.context, bufferLen, 1, 1);
    this.node.connect(this.context.destination); //this should not be necessary

    this.node.onaudioprocess = function(e) {

      if (!recording)
        return;

      var channelLeft = e.inputBuffer.getChannelData(0);

      console.log('onAudioProcess' + channelLeft.length);

      encoderMp3Worker.postMessage({
        command: 'encode',
        buf: channelLeft
      });

    }

    source.connect(this.node);

    this.record = function() {

      if (recording)
        return false;

      recording = true;

      var sampleRate = this.context.sampleRate;

      console.log("Initializing to Mp3");

      encoderMp3Worker.postMessage({
        command: 'init',
        config: {
          channels: 1,
          mode: 3 /* means MONO*/ ,
          samplerate: 22050,
          bitrate: 64,
          insamplerate: sampleRate
        }
      });

    }

    this.stop = function() {

      if (!recording)
        return;

      encoderMp3Worker.postMessage({
        command: 'finish'
      });

      recording = false;

    }

    encoderMp3Worker.onmessage = function(e) {

      var command = e.data.command;

      console.log('encoderMp3Worker - onmessage: ' + command);

      switch (command) {
      case 'data':
        var buf = e.data.buf;
        console.log('Receiving data from mp3-Encoder');

        //maybe you want to send to websocket channel, as:
        //https://github.com/akrennmair/speech-to-server

        break;
      case 'mp3':
        var buf = e.data.buf;
        endFile(buf, 'mp3');
        break;
      }

    };
    /**
     * Here the blob is exactly the same as slingshot/main.js blob
     that is saved to S3.
     Just use the uploader.send() to S3
    */
    function endFile(blob, extension) {

      console.log("Done converting to " + extension);
      console.log("the blob " + blob + " " + blob.size + " " + blob.type);
      encoderMp3Worker.callback(blob);

    }

  };

  window.Recorder = Recorder;

})(window);
