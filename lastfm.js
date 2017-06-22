const {BrowserWindow, ipcMain} = require('electron')
var http = require('http')
var url = require('url')
var LastFmApi = require('lastfmapi')
const settings = require('electron-settings')

var lfm = new LastFmApi({
    api_key: "5d7acf24194765ce3944d02f9fa58fc3",
    secret: "15fcf7b5578ede4ed6ab9180ca72f3c5"
});

var sessionData;

exports.api = lfm;

var server;
var lfmWindow;

var port = 4567;
var host = 'http://127.0.0.1';
var connect_url = () =>  host + ':' + port + '/auth';

exports.startServer = function(cb) {
    if (server) return;

    port++ // we don't want to fail if we did not stop previous server

    server = http.createServer(function (req, res) {
        var pathname = url.parse(req.url).pathname;
        if (pathname === '/auth') {
            var token = url.parse(req.url, true).query.token;
            exports.stopServer();
            cb(token);
        }

        res.writeHead(200, { 'Content-Type' : 'text/html' });
        res.end('');
    });

    server.listen(port);
}

exports.stopServer = function() {
    if (!server) return;

    server.close();
    server = null;
};

exports.init = function() {
    sessionData = settings.get('lastfm');

    if (sessionData) {
        lfm.setSessionCredentials(sessionData.username, sessionData.key);
    }

    return null;
}

exports.nowPlaying = function(track) {
    if (!exports.isAuthorized()) return;

    lfm.track.updateNowPlaying(track) // we don't care about response
}

exports.scrobble = function(track) {
    if (!exports.isAuthorized()) return;

    lfm.track.scrobble([ track ]);
}

exports.isAuthorized = function() {
    return !!sessionData;
}

exports.authorize = function(cb) {
    if (lfmWindow) {
        lfmWindow.focus();
        return;
    }

    lfmWindow = new BrowserWindow({
        width: 600,
        height: 600,
    })

    exports.startServer(function(token) {
        exports.stopServer();
        lfmWindow.destroy();
        lfmWindow = null;

        lfm.authenticate(token, function (err, session) {
            if (err) { throw err; }
            sessionData = session;
            settings.set('lastfm', session);
            cb();
        });
    });

    lfmWindow.on('close', function(e){
        lfmWindow = null;
        exports.stopServer();
    });

    var url = lfm.getAuthenticationUrl({
        cb: connect_url()
    });

    lfmWindow.loadURL(url);
}

exports.disconnect = function(cb) {
    settings.sef('lastfm', null);
    sessionData = null;
    cb();
}
