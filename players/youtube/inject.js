(function() {

    const {ipcRenderer} = require('electron');
    var currentTrack = {};
    var updateTimer;

    function scheduleScobbleUpdate(info) {
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
        var target = document.querySelector('#page');
        target.focus();

        var observer = new MutationObserver(() => func());

        var config = {
            childList: true,
            subtree: true // see crbug.com/134322
        };

        observer.observe(target, config);
    }

    function isPlaying() {
        var el = document.querySelector(".html5-main-video");
        return el && !el.paused;
    }

    function playerLoadedp() {
        return location.href.match(/\/watch\?v=/) && !!document.querySelector(".watch-title");
    }

    function trackInfo() {
        var title = document.querySelector('.watch-title').title;
        var parts = title.match(/((?:\w+\s+)+)\W+(.*)/);
        if (parts && parts.length === 3) {
            //best guess
            return {
                track: parts[2].trim(),
                artist: parts[1].trim()
            };
        } else {
            return {
                track: title,
                artist: "unknown"
            };
        }
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
            scheduleScobbleUpdate(info);
            ipcRenderer.send('player-song-change', info)
        }
    }

    runWhenLoaded(runWhenTrackInfoChanges.bind(null, analyzeTrackChange));
}());
