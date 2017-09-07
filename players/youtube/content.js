var ipc = require('electron').ipcRenderer;

ipc.on('play-control', function(event, command){
  var webView = document.querySelector('webview#gpm-player');
    switch (command) {
        case 'rewind':
            webView.executeJavaScript("window.history.back()");
            break;
        case 'forward':
            webView.executeJavaScript("document.querySelector('.ytp-next-button').click()");
            break;
        case 'play-pause':
            webView.executeJavaScript("document.querySelector('.ytp-play-button').click()");
            break;
    }
});
