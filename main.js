const {app, globalShortcut, BrowserWindow} = require('electron')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let forceQuiteApp;

function createWindow () {
    // Create the browser window.
    mainWindow = new BrowserWindow({width: 800, height: 600})
    mainWindow.maximize();

    // and load the index.html of the app.
    mainWindow.loadURL('file://' + __dirname + '/index.html');

    mainWindow.on('close', function(e){
        if (!forceQuiteApp) {
            e.preventDefault();
            mainWindow.hide();
        }
    });

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })

    globalShortcut.register('MediaPlayPause', function(){
        mainWindow.webContents.send('play-control', 'play-pause');
    }) || console.log('MediaPlayPause binding failed');

    globalShortcut.register('MediaPreviousTrack', function(){
        mainWindow.webContents.send('play-control', 'rewind');
    }) || console.log('MediaPreviousTrack binding failed');

    globalShortcut.register('MediaNextTrack', function(){
        mainWindow.webContents.send('play-control', 'forward');
    }) || console.log('MediaNextTrack binding failed');
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)
app.on('before-quit', () => forceQuiteApp = true);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    } else {
        mainWindow.show();
    }
})

app.on('activate-with-no-open-windows', function(){
    mainWindow && mainWindow.show();
});
