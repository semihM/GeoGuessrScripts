// ==UserScript==
// @name         Wiki Summary
// @include      /^(https?)?(\:)?(\/\/)?([^\/]*\.)?geoguessr\.com($|\/.*)/
// @version      0.4.0
// @description  Display Wikipedia summary of the Geoguessr locations. Works with both streaks and 5 round games.
// @author       semihM (aka rhinoooo_)
// @source       https://github.com/semihM/GeoGuessrScripts/blob/main/WikiSummary
// @supportURL   https://github.com/semihM/GeoGuessrScripts/issues
// @downloadURL  https://raw.githubusercontent.com/semihM/GeoGuessrScripts/main/WikiSummary/userscript.js
// @updateURL    https://raw.githubusercontent.com/semihM/GeoGuessrScripts/main/WikiSummary/userscript.js
// @require      http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// @grant        GM_addStyle
// ==/UserScript==


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// API KEYS : Get your keys from following sites
// - https://www.bigdatacloud.com/
// - https://opentripmap.io/
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// BigDataCloud for location information
let BigDataCloud_APIKEY = 'ENTER_API_KEY_HERE'; //Replace ENTER_API_KEY_HERE with yours from https://www.bigdatacloud.com/

// OpenTripMap for places nearby
let OpenTripMap_APIKEY = 'ENTER_API_KEY_HERE'; //Replace ENTER_API_KEY_HERE with yours from https://opentripmap.io/

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SETTINGS: Right hand side values can be updated if desired
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const MaximumFactMessageLength = 420; // Maximum fact text length, may exceed the limit if last sentence is long enough

const MaximumPlaceFactCountToDisplay = 4; // Maximum amount of famous place facts to display
const MaximumFactCountToDisplay = 12; // Maximum amount of facts(geographical + famous place) to display

const PlaceCategoriesToSearchFor = "historic,cultural,natural,architecture"; // Categories for nearby places, check https://opentripmap.io/catalog for other categories. Seperate categories with ',' commas
const PlaceSearchRadiusInMeters = 1000 // Radius in meters to search for places nearby

const DisplayFactsBelowButtons = false // true: Display facts under the main green continue button; false: Display facts before continue button

const FactWikiTitleColor = "lime" // Fact's wiki title color for both geographical and famous place facts
const FactWikiTextColor = "white" // Fact's wiki text color for both geographical and famous place facts

const GeographyFactTitle = "Geographical" // Geographical fact title
const GeographyFactTitleColorName = "orange" // Geographical fact title color name, lowercase

const FamousPlaceFactTitle = "Famous Place" // Famous place fact title
const FamousPlaceFactTitleColorName = "cyan" // Famous place fact text color name, lowercase

const DisplayFactNumber = true // true: Display fact number after the title; false: Don't display fact number

const ExcludedWikiPageIds =
      [
          // Remove the first '//' before the wiki ids ( //12345, -> 12345, ) to exclude the wiki page from results
          // Add more by adding a ',' comma after the previous wiki id
          //83759, // USA
          //13530298, // UK
      ]

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const DEBUG_ENABLED = false // true: Console print enabled for debugging; false: Don't print any debug information

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const API_URL = "https://api.bigdatacloud.net/data/reverse-geocode?localityLanguage=en&"
const WIKI_URL = "https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&origin=*&titles="
const WIKIDATA_URL = "https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&origin=*&props=sitelinks&sitefilter=enwiki&ids="
const OPENTRIP_URL = `https://api.opentripmap.com/0.1/en/places/radius?radius=${PlaceSearchRadiusInMeters}&limit=${MaximumPlaceFactCountToDisplay}&src_attr=wikidata&kinds=${encodeURIComponent(PlaceCategoriesToSearchFor)}&apikey=`

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const EMPTYAPIKEY = "ENTER_API_KEY_HERE"
const INVALIDLINK = "#";
const BIGDATACLOUD_APICOOKIE = "geoguessr_script_semihM_bigdatacloudkey"
const OPENTRIPMAP_APICOOKIE = "geoguessr_script_semihMopentripmapkey"

const _class_roundResult_5roundGame = "round-result_actions__27yr5"
const _class_roundResult_streakGame = "streak-round-result_root__1QCM0"

const SummaryLoadingPlaceHolderInnerHtml = `<div id="location-fact" style="text-align:center">Loading wikipedia summaries...</div><br>`

const CookieDays = 365

let checked = parseInt(sessionStorage.getItem("FactLocationChecked"), 10);
let facts = []

let placeWikidataTitles = []
let needsWiki = true;

if(sessionStorage.getItem("FactLocationChecked") == null) {
    sessionStorage.setItem("FactLocationChecked", 0);
    checked = 0;
};

CheckCookiesForAPIKeys()

function debug(obj)
{
    if(DEBUG_ENABLED) console.log(obj)
}

function setCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function CheckCookiesForAPIKeys()
{
    let key = ""
    if (BigDataCloud_APIKEY == EMPTYAPIKEY)
    {
        if (key = getCookie(BIGDATACLOUD_APICOOKIE)) BigDataCloud_APIKEY = key
        else if ((key = prompt("Couldn't find bigdatacloud.com API key, please enter your key")) != "") setCookie(BIGDATACLOUD_APICOOKIE, BigDataCloud_APIKEY = key, CookieDays);
        else return alert("Failed to initialize WikiSummary script. Make sure to add your key manually!")
    }
    else setCookie(BIGDATACLOUD_APICOOKIE, BigDataCloud_APIKEY, CookieDays)

    if (OpenTripMap_APIKEY == EMPTYAPIKEY)
    {
        if (key = getCookie(OPENTRIPMAP_APICOOKIE)) OpenTripMap_APIKEY = key
        else if ((key = prompt("Couldn't find opentripmap.io API key, please enter your key")) != "") setCookie(OPENTRIPMAP_APICOOKIE, OpenTripMap_APIKEY = key, CookieDays);
        else return alert("Failed to initialize WikiSummary script. Make sure to add your key manually!")
    }
    else setCookie(OPENTRIPMAP_APICOOKIE, OpenTripMap_APIKEY, CookieDays)
}

function cleanPages(pages)
{
    // Missing or invalid
    if (-1 in pages) delete pages[-1]
    if (-2 in pages) delete pages[-2]

    ExcludedWikiPageIds.forEach(idx => idx in pages ? delete pages[idx] : null);
}

function setNameToPostal(obj, name)
{
    obj.name = name
    obj.description = name
}

function styleFact(name,desc)
{
    return `<h3 style="color: ${FactWikiTitleColor}">${name}</h3>${desc}`
}

function getTitlesFromLocation()
{
    return getLocationObject()
    .then(async loc => {
        debug(loc)

        needsWiki = true;
        placeWikidataTitles = [];

        if (loc == null || !("localityInfo" in loc)) return null

        let infos = loc.localityInfo.informative.concat(loc.localityInfo.administrative.filter(o => o.adminLevel >= 3))
                .sort((firstEl, secondEl) => firstEl.order > secondEl.order ? 1 : -1)

        if (infos.length == 0) return null

        let maxorder = infos[infos.length - 1].order

        debug("]infos")
        debug(infos)

        return await getNearByLocationsFromLatLng(loc.latitude, loc.longitude)
        .then(locs => {
            debug("]locs")
            debug(locs)
            return locs.features.map(place =>
                "wikidata" in place.properties ?
                 {
                     "order" : Math.floor(maxorder + (Math.random() * maxorder) / 2.0),
                     "name" : place.properties.name,
                     "description" : place.properties.name + "(" + place.properties.kinds + ")",
                     "wikidataId" : place.properties.wikidata,
                     "isPlaceFact" : true
                 }
                 : null).filter(o => o != null)
        })
        .then(async places => {

            debug("]places")
            debug(places)

            infos = infos.concat(places)
                .sort((firstEl, secondEl) => firstEl.order > secondEl.order ? 1 : -1);

            debug("]infos")
            debug(infos)

            let len = Object.keys(infos).length;
            if (len == 1)
            {
                let info = infos[0]
                if (info.order < 3)
                {
                    needsWiki = false;
                    return styleFact(info.name, info.description)
                }
                return info;
            }
            else
            {
                let filtered = infos.filter(o => o.order >= 3 && "wikidataId" in o);

                if (filtered.length < MaximumFactCountToDisplay)
                {
                    filtered = infos.filter(o => o.order >= 2 && "wikidataId" in o);
                }

                filtered.forEach(obj => obj.description == "postal code" ? setNameToPostal(obj, loc.city == "" ? loc.principalSubdivision : loc.city) : null);
                debug("]filtered infos")
                debug(filtered)

                if (filtered.length == 0)
                {
                    if (infos.length >= 1)
                    {
                        facts = infos.map(obj => { return {"text": styleFact(obj.name, obj.description), "link": INVALIDLINK, "isGeoFact": true} })
                    }
                    needsWiki = false;
                    return null;
                }

                let red = []
                let i = 0;
                while (i < filtered.length)
                {
                    let curr = filtered[i];
                    let t = await fetch(WIKIDATA_URL + curr.wikidataId)
                    .then(res => res.json())
                    .then(out =>
                          (out.success != 1 || "error" in out || !("enwiki" in out.entities[curr.wikidataId].sitelinks))
                          ? ""
                          : processAndGetWikidataTitle(out, curr))

                    if (t != "" && red.indexOf(t) == -1) red.push(t);

                    i++;
                }

                return red.reverse().join("|")
            }
        })
    })
}

function processAndGetWikidataTitle(data, obj)
{
    let title = data.entities[obj.wikidataId].sitelinks.enwiki.title;

    if ("isPlaceFact" in obj)
    {
        if (placeWikidataTitles.indexOf(title) == -1)
        {
            debug("]place title processed: " + title)
            placeWikidataTitles.push(title)
        }
    }
    else debug("]geographic title processed: " + title)

    return encodeURIComponent(title)
}

function getLocationObject()
{
    const game_tag = window.location.href.substring(window.location.href.lastIndexOf('/') + 1)
    const api_url = "https://www.geoguessr.com/api/v3/games/"+game_tag

    return fetch(api_url)
    .then(res => res.json())
    .then(out => {
        let guess_counter = out.player.guesses.length

        let lat = out.rounds[guess_counter-1].lat;
        let lng = out.rounds[guess_counter-1].lng;

        return getLocationFromLatLng(lat, lng);
    })
}

function getNearByLocationsFromLatLng(lat, lng)
{
    let api = OPENTRIP_URL + OpenTripMap_APIKEY + "&lat="+lat+"&lon="+lng
    return fetch(api)
        .then(res => res.json())
}

function getLocationFromLatLng(lat, lng)
{
    let api = API_URL + "latitude="+lat+"&longitude="+lng+"&key="+BigDataCloud_APIKEY
    return fetch(api)
        .then(res => res.json())
}

function getFactFromTitles(titles)
{
    return fetch(WIKI_URL + titles)
        .then(res => res.json())
        .then(result =>{

        facts = []
        let pages = result.query.pages;
        cleanPages(pages);

        debug("]cleaned pages");
        debug(pages)

        let keys = Object.keys(pages);
        if (keys.length == 0) return null

        let del = 0;

        keys.forEach(k =>
        {
            if (facts.length >= MaximumFactCountToDisplay) return

            let fact = pages[k];
            if (fact == null) return

            let reduced = fact.extract;
            reduced = reduced.trimEnd("\n")
            if (reduced.endsWith("refer to:")) return

            if (reduced.length > MaximumFactMessageLength)
            {
                let paragraphs = reduced.split(". ")
                let j = 0
                reduced = paragraphs.length != 0 ? "" : reduced

                while (j < paragraphs.length && reduced.length <= MaximumFactMessageLength)
                {
                    reduced = reduced + ". " + paragraphs[j]
                    j++;
                }

                // TO-DO: Add "read more" button
                //reduced = reduced.slice(0,MaximumFactMessageLength) + "..."
            }

            let f = {
                "text": styleFact(fact.title, reduced),
                "link": "https://en.wikipedia.org/?curid=" + fact.pageid,
                "isGeoFact": placeWikidataTitles.indexOf(fact.title) == -1
            }
            //debug(f)
            facts.push(f)
        })

        return facts;
    });
}


function SetDisplayFact()
{
    getTitlesFromLocation()
        .then(titles => {

        debug("]reduced titles result: " + titles)
        if (needsWiki)
        {
            getFactFromTitles(titles).then(facts => {
                if (facts == null)
                {
                    facts = [
                        {
                            "text": styleFact(titles.name, titles.description),
                            "link": INVALIDLINK,
                            "isGeoFact": true
                        }
                    ]
                }
                debug(facts)
                setFactInnerHtml();
            })
        }
        else
        {
            needsWiki = true;
            if (titles != null)
            {
                facts =
                [
                    {
                        "text": titles,
                        "link": INVALIDLINK,
                        "isGeoFact": true
                    }
                ]
            }
            setFactInnerHtml();
        }
    })
}

function getFactTitleColor(fact)
{
    return fact.isGeoFact ? GeographyFactTitleColorName : FamousPlaceFactTitleColorName;
}

function getFactTitle(fact)
{
    return fact.isGeoFact ? GeographyFactTitle : FamousPlaceFactTitle;
}

function getFactTextHtml(fact)
{
    return `<div style="color: ${FactWikiTextColor}">` + fact.text.split(". ").reduce((prev, curr) => prev + "<br>" + curr) + "</div>";
}

function setFactInnerHtml()
{
    let str = facts
    .map((fact,i) => {
         return `<br><h2 style="color: ${getFactTitleColor(fact)}">${getFactTitle(fact)} Fact ${DisplayFactNumber ? (i+1) : ""}</h2>(<u><a href="${fact.link}"; style="color: white"><i>source</i></a></u>)<br><div style="text-align: justify;text-justify: inter-word;">${getFactTextHtml(fact)}</div>`
        })
    .join("<hr>")

    document.getElementById("location-fact").innerHTML = str;
}

// 5 round game round summary div or null
function get5RoundGameSummaryDiv()
{
    let div = document.getElementsByClassName(_class_roundResult_5roundGame);
    if (div.length == 0) return null
    else return div[0]
}

function set5RoundGameSummaryDivPlaceHolder()
{
    let newDiv1 = document.createElement("div")
    let parent = get5RoundGameSummaryDiv();

    if (DisplayFactsBelowButtons) parent.appendChild(newDiv1);
    else parent.insertBefore(newDiv1, parent.lastElementChild);

    newDiv1.innerHTML = SummaryLoadingPlaceHolderInnerHtml;
}

// Streak game round summary div or null
function getStreakGameSummaryDiv()
{
    let div = document.getElementsByClassName(_class_roundResult_streakGame);
    if (div.length == 0) return null
    else return div[0]
}

function setStreakGameSummaryDivPlaceHolder()
{
    let newDiv1 = document.createElement("div")
    let parent = getStreakGameSummaryDiv();

    if (DisplayFactsBelowButtons) parent.appendChild(newDiv1);
    else parent.insertBefore(newDiv1, parent.lastElementChild);

    newDiv1.innerHTML = SummaryLoadingPlaceHolderInnerHtml;
}

function factCheckStateAttempt(newDiv1) {
    if(document.getElementById("location-fact") || !isInValidGameLocation()) return

    if (get5RoundGameSummaryDiv()) set5RoundGameSummaryDivPlaceHolder()
    else if(getStreakGameSummaryDiv()) setStreakGameSummaryDivPlaceHolder()
};

function isInValidGameLocation()
{
    return location.pathname.startsWith("/game/");
}

function isFactAlreadyChecked()
{
    return sessionStorage.getItem("FactLocationChecked") != 0
}

function factCheckState()
{
    if (!!document.querySelector('.result-layout_root__pCZux') && isInValidGameLocation() && !isFactAlreadyChecked()){
        SetDisplayFact();
        checked = checked + 1;
        sessionStorage.setItem("FactLocationChecked", checked);
    }
    else if (!document.querySelector('.result-layout_root__pCZux') && isInValidGameLocation() && isFactAlreadyChecked()) {
        checked = 0;
        sessionStorage.setItem("FactLocationChecked", checked)
    };
}

function tryFactCheck()
{
    factCheckState();

    setTimeout(factCheckState, 250);
    setTimeout(factCheckState, 500);
    setTimeout(factCheckState, 1200);
    setTimeout(factCheckState, 2000);

    setTimeout(factCheckStateAttempt,300);
    setTimeout(factCheckStateAttempt,500);
    setTimeout(factCheckStateAttempt,1200);
    setTimeout(factCheckStateAttempt,2000);
};

document.addEventListener('click', tryFactCheck, false);
