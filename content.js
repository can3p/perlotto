var ipc = require('electron').ipcRenderer;

ipc.on('play-control', function(event, command){
  var webView = document.querySelector('webview#gpm-player');
  webView.executeJavaScript("document.querySelector('#player-bar-" + command + "').click()");
});
