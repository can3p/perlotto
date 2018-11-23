const {app, globalShortcut, BrowserWindow, ipcMain, Menu, MenuItem, session} = require('electron')
const lastfm = require('./lastfm');

const filter = {};
// we need filters because it's supper annoying to listen ads after every second song. Thanks
var ad_filters = [
    /https:\/\/.*\.youtube\.com\/ad.*/,
    /.*.doubleclick.net\/.*/,
    /.*\/pagead\/lvz?.*/,
    /.*-pagead-id\..*/,
    /.*log_event.*/,
    /.*log_interaction.*/,
    /.*adServer.*/,
    /.*cumulus-cloud.*/,
    /.*youtube.com\/ptracking\?.*/,
    /.*pagead.*/,
    /.*adunit.*/,
    /.*googlesyndication.*/,
    /.*api\/ads.*/,
    /.*api\/stats\/ads.*/,
    /.*s\.youtube.com\/.*/,
    /.*(googlevideo|youtube).com\/.*_204.*/,
];

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let forceQuiteApp;
let playerName = 'gmusic';

function createWindow () {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        title: "Perlotto",
        icon: __dirname + '/build/icon.png'
    });
    mainWindow.maximize();

    // and load the index.html of the app.
    mainWindow.loadURL('file://' + __dirname + '/players/' + playerName + '/index.html');

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

    ipcMain.on('player-song-change', function(e, arg) {
        // console.log('player-song-change', arg);
        lastfm.nowPlaying(arg);
    });

    ipcMain.on('player-scrobble-time', function(e, arg) {
        // console.log('player-scrobble-time', arg);
        lastfm.scrobble(arg);
    });

    lastfm.init(mainWindow);
    updateMenu();
    initFilters();
}

function checkFilters(url) {
    return ad_filters.reduce(function(acc, filter) {
        return acc || !!filter.exec(url);
    }, false);
}

function initFilters() {
    session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
        callback({cancel: checkFilters(details.url)});
    })
}

function getPlayersTemplate(currentPlayer) {
    var genSwitchPlayer = function(player) {
        return switchPlayer.bind(null, player, updateMenu);
    };
    
    var players = [
        {
            label: 'Youtube',
            name:  'youtube',
            click: genSwitchPlayer('youtube')
        },
        {
            label: 'Google Music',
            name: 'gmusic',
            click: genSwitchPlayer('gmusic')
        }];

    return players.filter((item) => item.name !== currentPlayer);
}


function getMenuTemplate(lastFMEnabled) {
    var template = [
        {
            label: app.getName(),
            submenu: [
                {label: 'Reload player', click: function() {
                    reloadPlayer(updateMenu);
                }},
                {
                    role: 'toggledevtools',
                    accelerator: 'Alt+CmdOrCtrl+I'
                },
                {type: 'separator'},
                (lastFMEnabled ?
                    {label: 'Disconnect from Last.FM', click: function() { lastfm.disconnect(updateMenu) } }
                  : {label: 'Connect to Last.FM', click: function() { lastfm.authorize(updateMenu); } }),
                {type: 'separator'},
                {role: 'quit'}
            ]
        },
        {
            label: 'Edit',
            submenu: [
                {
                    label: 'Undo',
                    accelerator: 'CmdOrCtrl+Z',
                    selector: 'undo:'
                },
                {
                    label: 'Redo',
                    accelerator: 'Shift+CmdOrCtrl+Z',
                    selector: 'redo:'
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Cut',
                    accelerator: 'CmdOrCtrl+X',
                    selector: 'cut:'
                },
                {
                    label: 'Copy',
                    accelerator: 'CmdOrCtrl+C',
                    selector: 'copy:'
                },
                {
                    label: 'Paste',
                    accelerator: 'CmdOrCtrl+V',
                    selector: 'paste:'
                },
                {
                    label: 'Select All',
                    accelerator: 'CmdOrCtrl+A',
                    selector: 'selectAll:'
                },
            ]
        },
        {
            label: "Switch Player",
            submenu: getPlayersTemplate(playerName)
        }
    ];

    return template;
}

function switchPlayer(name, cb) {
    playerName = name;
    mainWindow.loadURL('file://' + __dirname + '/players/' + playerName + '/index.html');
    cb();
}

function reloadPlayer(cb) {
    mainWindow.reload();
    cb();
}

function updateMenu() {
    var lastFMEnabled = lastfm.isAuthorized();
    var menu = Menu.buildFromTemplate(getMenuTemplate(lastFMEnabled));
    Menu.setApplicationMenu(menu);
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
