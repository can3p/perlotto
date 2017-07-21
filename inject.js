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
        var target = document.querySelector('#playerSongInfo');
        target.focus();

        var observer = new MutationObserver(() => func());

        var config = {
            childList: true,
            subtree: true // see crbug.com/134322
        };

        observer.observe(target, config);
    }

    function playerLoadedp() {
        return !!document.querySelector("#player-bar-play-pause");
    }

    function isPlaying() {
        var el = document.querySelector("#player-bar-play-pause");
        return el && el.classList.contains("playing");
    }

    function trackInfo() {
        return {
            track: document.querySelector("#currently-playing-title").innerText,
            album: document.querySelector(".player-album").innerText,
            artist: document.querySelector(".player-artist").innerText
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
