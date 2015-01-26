Slingshot.fileRestrictions("myImageUploads", {
  allowedFileTypes: ["image/png", "image/jpeg", "image/jpg", "image/gif"],
  maxSize: 1 * 1024 * 1024 // 1 MB
});

Slingshot.fileRestrictions("myAudioUploads", {
  allowedFileTypes: ["audio/mp3"],
  maxSize: 5 * 1024 * 1024 // 1 MB
});
