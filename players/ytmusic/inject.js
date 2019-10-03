(function() {

    const {ipcRenderer} = require('electron');
    var currentTrack = {};
    var updateTimer;

    function scheduleScrobbleUpdate(info) {
        clearTimeout(updateTimer);

        info.timestamp = Math.floor((+new Date()) / 1000);
        updateTimer = setTimeout(function() {
            ipcRenderer.send('player-scrobble-time', info)
        }, 61000); // a bit bigger then minimal limit
    }

    function runWhenLoaded(func) {
        if (playerLoadedp()) {
            func();
            return;
        }

        var timer = setInterval(function() {
            if (playerLoadedp()) {
                clearInterval(timer);
                func();
                return;
            }
        }, 200);
    }

    function runWhenTrackInfoChanges(func) {
        var target = document.querySelector('.ytmusic-player-bar.title');
        target.focus();

        var observer = new MutationObserver(() => func());

        var config = {
            childList: true,
            subtree: true // see crbug.com/134322
        };

        observer.observe(target, config);
    }

    function playerLoadedp() {
        var el = document.querySelector('ytmusic-app-layout.ytmusic-app')
        return el.hasAttribute('player-visible_');
    }

    function isPlaying() {
        // We are playing if play/pause button will pause playback
        var el = document.querySelector(".play-pause-button");
        return el && el.title == "Pause";
    }

    function trackInfo() {
        // children -> [artist '-' album '-' year]
        var subtitle = document.querySelector(
            ".ytmusic-player-bar.subtitle > .byline"
        );
        return {
            track: document.querySelector(".ytmusic-player-bar.title").title,
            album: subtitle.children[2].innerText,
            artist: subtitle.children[0].innerText
        };
    }

    function tracksEqualp(one, two) {
        return one.track === two.track
            && one.album === two.album
            && one.artist === two.artist;
    }

    function analyzeTrackChange() {
        var playing = isPlaying();
         if (!playing) return;

        var info = trackInfo();

        if (!tracksEqualp(currentTrack, info)) {
            currentTrack = info;
            scheduleScrobbleUpdate(info);
            ipcRenderer.send('player-song-change', info)
        }
    }

    runWhenLoaded(runWhenTrackInfoChanges.bind(null, analyzeTrackChange));
}());
