var ipc = require('electron').ipcRenderer;

ipc.on('play-control', function(event, command){
  var webView = document.querySelector('webview#gpm-player');
    switch (command) {
        case 'rewind':
            webView.executeJavaScript("document.querySelector('.previous-button').click()");
            break;
        case 'forward':
            webView.executeJavaScript("document.querySelector('.next-button').click()");
            break;
        case 'play-pause':
            webView.executeJavaScript("document.querySelector('.play-pause-button').click()");
            break;
    }
});
