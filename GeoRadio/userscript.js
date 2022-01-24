// ==UserScript==
// @name         GeoRadio
// @include      /^(https?)?(\:)?(\/\/)?([^\/]*\.)?geoguessr\.com($|\/.*)/
// @version      0.1.0
// @description  Listen to the radio stations of the country you get in GeoGuessr rounds
// @author       semihM (aka rhinoooo_), MiniKochi
// @source       https://github.com/semihM/GeoGuessrScripts/blob/main/GeoRadio
// @supportURL   https://github.com/semihM/GeoGuessrScripts/issues
// @require      http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// @require      https://raw.githubusercontent.com/semihM/GeoGuessrScripts/main/GeoRadio/stations.js
// @grant        GM_addStyle
// @namespace https://greasyfork.org/users/851187
// ==/UserScript==

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SETTINGS

let Settings = {
    // true: Pop-up in the center of the browser, false: Pop-up in the upper-left corner
    "CenterPopUp": false,

    // Button text color name, lowercase
    "ButtonTextColorName": "orange",
    // Button background color name, lowercase ("transparent" possible)
    "ButtonBackgroundColorName": "transparent"
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const DEBUG_ENABLED = false // true: Console print enabled for debugging; false: Don't print any debug information

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const _storage_checked = "RadioSet"

let checked = parseInt(sessionStorage.getItem(_storage_checked), 10);

let latlng = [0, 0]

function debug(obj, title) {
    if (DEBUG_ENABLED && title) console.log("]" + title)
    if (DEBUG_ENABLED) console.log(obj)
}

var radio_window;

function createRadioWindow(path = "") {
    if (radio_window && radio_window.window) {
        radio_window.location.href = "https://radio.garden" + path
        radio_window.focus()
    } else {
        const h = 350;
        const w = 450;
        const y = window.top.outerHeight / 2 + window.top.screenY - (h / 2);
        const x = window.top.outerWidth / 2 + window.top.screenX - (w / 2);
        const center_coord = Settings.CenterPopUp ? `, top=${y}, left=${x}` : ''
        radio_window = window.open("https://radio.garden" + path, "GeoRadioPopUp", `height=${h}, width=${w}${center_coord}`)
    }

    if (!radio_window) {
        alert("GeoRadio requires pop-up windows to be enabled for geoguessr.com! Please allow it by clicking the button at the end of the URL bar!")
        createRadioWindow(path)
    }

    debug(radio_window, "radio_window")
}

function haversine_distance(mk1, mk2) {
    var R = 3958.8; // Radius of the Earth in miles
    var rlat1 = mk1[0] * (Math.PI / 180); // Convert degrees to radians
    var rlat2 = mk2[0] * (Math.PI / 180); // Convert degrees to radians
    var difflat = rlat2 - rlat1; // Radian difference (latitudes)
    var difflon = (mk2[1] - mk1[1]) * (Math.PI / 180); // Radian difference (longitudes)

    var d = 2 * R * Math.asin(Math.sqrt(Math.sin(difflat / 2) * Math.sin(difflat / 2) + Math.cos(rlat1) * Math.cos(rlat2) * Math.sin(difflon / 2) * Math.sin(difflon / 2)));
    return d;
}

async function getLocationObject() {
    const tag = window.location.href.substring(window.location.href.lastIndexOf('/') + 1)
    const game_endpoint = "https://www.geoguessr.com/api/v3/games/" + tag
    const challenge_endpoint = "https://www.geoguessr.com/api/v3/challenges/" + tag + "/game"
    let api_url = isInChallange() ? challenge_endpoint : game_endpoint

    const res = await fetch(api_url);
    return await res.json();
}

function startRadio() {
    getLocationObject()
        .then(loc => {

            debug("]real_loc: ")
            debug(loc)

            latlng = [loc.rounds[loc.player.guesses.length - 1].lat, loc.rounds[loc.player.guesses.length - 1].lng]
            setRadio()
        })
}

async function setRadio() {
    let closestIndex = 0
    let closestDist = 10000000

    let len = allstations.length;

    for (let i = 0; i < len; i++) {
        let dist = haversine_distance(allstations[i].geo, latlng)
        if (dist < closestDist) {
            closestDist = dist;
            closestIndex = i
        }
    }
    if (len > 0) {
        if (!document.getElementById(_id_radio_div_guess)) return

        let d = document.getElementById(_id_radio_div_guess);
        d.textContent = " Click to start listening the closest local radio! "
        d.style.color = Settings.ButtonTextColorName
        d.style.background = Settings.ButtonBackgroundColorName
        d.style.cursor = "pointer"
        d.onclick = () => createRadioWindow("/listen/" + allstations[closestIndex].url)
        d.parentElement.style.background = ""

    }
}

const _id_radio_div_guess = "radio-div-id"
const _class_roundResult_5roundGame = "result-layout_content__jAHfP"
const _class_roundResult_streakGame = "streak-round-result_root__WxUU9"

const RadioPlaceHolderGuess = `<div id="${_id_radio_div_guess}" align="right" style="margin: 50px 0 0 0;text-align:center;z-index:99999;color:cyan;background-color:${Settings.ButtonBackgroundColorName};"> Waiting for radio link... </div>`

// 5 round game round summary div or null
function get5RoundGameSummaryDiv() {
    let div = document.getElementsByClassName(_class_roundResult_5roundGame);
    if (div.length == 0) return null
    else return div[0]
}

function set5RoundGameSummaryDivPlaceHolder() {
    let guess = document.createElement("div")
    let parent = get5RoundGameSummaryDiv();
    const background = Settings.ButtonBackgroundColorName == "transparent" ? "none" : "#eee"

    parent.insertBefore(guess, parent.firstElementChild);

    guess.innerHTML = RadioPlaceHolderGuess;
    guess.style = `position: fixed; z-index: 1; right: 60px; background: ${background}; overflow-x: hidden; padding: 8px 0;`
}

// Streak game round summary div or null
function getStreakGameSummaryDiv() {
    let div = document.getElementsByClassName(_class_roundResult_streakGame);
    if (div.length == 0) return null
    else return div[0]
}

function setStreakGameSummaryDivPlaceHolder() {
    let guess = document.createElement("div")
    let corect = document.createElement("div")
    let parent = getStreakGameSummaryDiv();
    const background = Settings.ButtonBackgroundColorName == "transparent" ? "none" : "#eee"

    parent.insertBefore(guess, parent.firstElementChild);

    guess.innerHTML = StreetViewPlaceHolderGuess;
    guess.style = `position: fixed; z-index: 1; right: 60px; background: ${background}; overflow-x: hidden; padding: 8px 0;`
}

function radioStateAttempt(newDiv1) {
    if (document.getElementById(_id_radio_div_guess) || !isInValidGameLocation()) return

    if (get5RoundGameSummaryDiv()) set5RoundGameSummaryDivPlaceHolder()
    else if (getStreakGameSummaryDiv()) setStreakGameSummaryDivPlaceHolder()

};

function isInChallange() {
    return location.pathname.startsWith("/challenge/");
}

function isInValidGameLocation() {
    return location.pathname.startsWith("/game/") || isInChallange();
}

function isRealScoreAlreadyChecked() {
    return sessionStorage.getItem(_storage_checked) != 0
}

function radioCheckState() {
    if (!!document.querySelector('.result-layout_root__NfX12') && isInValidGameLocation() && !isRealScoreAlreadyChecked()) {
        startRadio();
        checked = checked + 1;
        sessionStorage.setItem(_storage_checked, checked);
    } else if (!document.querySelector('.result-layout_root__NfX12') && isInValidGameLocation() && isRealScoreAlreadyChecked()) {
        checked = 0;
        sessionStorage.setItem(_storage_checked, checked)
    };
}

function tryRadioCheck() {
    radioCheckState();

    setTimeout(radioCheckState, 250);
    setTimeout(radioCheckState, 500);
    setTimeout(radioCheckState, 1200);
    setTimeout(radioCheckState, 2000);

    setTimeout(radioStateAttempt, 300);
    setTimeout(radioStateAttempt, 500);
    setTimeout(radioStateAttempt, 1200);
    setTimeout(radioStateAttempt, 2000);
};

document.addEventListener('click', tryRadioCheck, false);