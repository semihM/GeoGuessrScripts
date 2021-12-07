// ==UserScript==
// @name         Wiki Summary
// @include      /^(https?)?(\:)?(\/\/)?([^\/]*\.)?geoguessr\.com($|\/.*)/
// @version      0.1
// @description  Display Wikipedia summary of the Geoguessr locations
// @author       semihM (aka rhinoooo_)
// @source       https://github.com/semihM/GeoGuessrScripts
// @require      http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// @grant        GM_addStyle
// ==/UserScript==

let API_Key = 'ENTER_API_KEY_HERE'; //Replace ENTER_API_KEY_HERE with your API Key (so keep the quote marks)
let MaximumFactMessageLength = 420; // Messages can exceed this limit in version 0.1
let MaximumFactsCountToDisplay = 5; // Maximum amount of facts to display

let API_URL = "https://api.bigdatacloud.net/data/reverse-geocode?localityLanguage=en&"
let WIKI_URL = "https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&origin=*&titles="
let WIKIDATA_URL = "https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&origin=*&props=sitelinks&sitefilter=enwiki&ids="

let checked = parseInt(sessionStorage.getItem("FactLocationChecked"), 10);
let facts = []

let INVALIDLINK = "#";

if(sessionStorage.getItem("FactLocationChecked") == null) {
    sessionStorage.setItem("FactLocationChecked", 0);
    checked = 0;
};

const DEBUG_ENABLED = false

function debug(obj)
{
    if(DEBUG_ENABLED) console.log(obj)
}

function cleanPages(pages)
{
    let exclude = [-2, -1,// Missing or invalid
                   /* TO-DO: Maybe exclude
                   83759,// USA
                   13530298,// UK
                   1223848,// North EU Plain
                   1145843,// Atlantic Coastal Plain
                   */
                  ]
    exclude.forEach(idx => idx in pages ? delete pages[idx] : null);
}

function setNameToPostal(obj, name)
{
    obj.name = name
    obj.description = name
}

function styleFact(name,desc)
{
    return `<h3 style="color: green">${name}</h3>${desc}`
}

function getTitlesFromLocation()
{
    return getLocationObject()
    .then(async loc => {
        needsWiki = true;
        let infos = loc.localityInfo.informative.concat(loc.localityInfo.administrative.filter(o => o.adminLevel >= 3))
                     .sort((firstEl, secondEl) => firstEl.order > secondEl.order ? 1 : -1);
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
            filtered.forEach(obj => obj.description == "postal code" ? setNameToPostal(obj, loc.city == "" ? loc.principalSubdivision : loc.city) : null);

            if (filtered.length == 0)
            {
                if (infos.length >= 1)
                {
                    needsWiki = false;
                    facts = infos.map(obj => { return {"text": styleFact(obj.name, obj.description), "link": INVALIDLINK} })
                    return null;
                }
                else
                {
                    needsWiki = false;
                    return "nothing interesting...";
                }
            }

            let red = ""
            let i = 0;
            while (i < filtered.length)
            {
                let curr = filtered[i];
                let t = await fetch(WIKIDATA_URL + curr.wikidataId)
                    .then(res => res.json())
                    .then(out =>
                          "error" in out || !("enwiki" in out.entities[curr.wikidataId].sitelinks)
                          ? ""
                          : (encodeURIComponent(out.entities[curr.wikidataId].sitelinks.enwiki.title) + "|"))

                red = t + red;
                i++;
            }

            return red.length > 0 ? red.slice(0, red.length - 1) : red
        }
    })

}

function getEnTitle(id)
{
    return
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

function getLocationFromLatLng(lat, lng)
{
    let api = API_URL + "latitude="+lat+"&longitude="+lng+"&key="+API_Key
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
        debug(pages)

        let keys = Object.keys(pages);
        if (keys.length == 0) return null

        let del = 0;

        keys.forEach(k =>
        {
            if (facts.length >= MaximumFactsCountToDisplay) return

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
                "link": "https://en.wikipedia.org/?curid=" + fact.pageid
            }
            debug(f)
            facts.push(f)
        })

        return facts;
    });
}

let needsWiki = true;

function SetDisplayFact()
{
    getTitlesFromLocation()
        .then(titles => {
        debug(titles)
        if (needsWiki)
        {
            getFactFromTitles(titles).then(facts => {
                if (facts == null)
                {
                    facts = [
                        {
                            "text": styleFact(titles.name, titles.description),
                            "link": INVALIDLINK
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
            facts = [
                        {
                            "text": titles,
                            "link": INVALIDLINK
                        }
            ]
            setFactInnerHtml();
        }
    })
}

function setFactInnerHtml()
{
    let str = facts
    .map((fact,i) => {
         return `<br><h2 style="color: orange">Fact ${i+1}</h2>(<u><a href="${fact.link}"; style="color: white"><i>source</i></a></u>)<br><div style="text-align: justify;text-justify: inter-word;">${fact.text.split(". ").reduce((prev, curr) => prev + "<br>" + curr)}</div>`
        })
    .join("<hr>")

    document.getElementById("location-fact").innerHTML = str;
}

function factAttempt1(newDiv1) {
    if(document.getElementById("location-fact") == null && document.getElementsByClassName("round-result_distanceDescription__13lR1").length == 1 && location.pathname.startsWith("/game/")) {
        newDiv1 = document.createElement("div")
        document.getElementsByClassName("round-result_distanceDescription__13lR1")[0].appendChild(newDiv1);
        newDiv1.innerHTML = `<div id="location-fact" style="text-align:center">Loading wikipedia summaries...</div>`;
    };
};

function tryFactCheck()
{
    if (!!document.querySelector('.result-layout_root__pCZux') && location.pathname.startsWith("/game/") && sessionStorage.getItem("FactLocationChecked") == 0){
        SetDisplayFact();
        checked = checked + 1;
        sessionStorage.setItem("FactLocationChecked", checked);
    }
    else if (!document.querySelector('.result-layout_root__pCZux') && location.pathname.startsWith("/game/") && sessionStorage.getItem("FactLocationChecked") != 0) {
        checked = 0;
        sessionStorage.setItem("FactLocationChecked", checked)
    };

    setTimeout(function() {
        if (!!document.querySelector('.result-layout_root__pCZux') && location.pathname.startsWith("/game/") && sessionStorage.getItem("FactLocationChecked") == 0){
            SetDisplayFact();
            checked = checked + 1;
            sessionStorage.setItem("FactLocationChecked", checked);
        }
        else if (!document.querySelector('.result-layout_root__pCZux') && location.pathname.startsWith("/game/") && sessionStorage.getItem("FactLocationChecked") != 0) {
            checked = 0;
            sessionStorage.setItem("FactLocationChecked", checked)
        };
    }, 250);

    setTimeout(function() {
        if (!!document.querySelector('.result-layout_root__pCZux') && location.pathname.startsWith("/game/") && sessionStorage.getItem("FactLocationChecked") == 0){
            SetDisplayFact();
            checked = checked + 1;
            sessionStorage.setItem("FactLocationChecked", checked);
        }
        else if (!document.querySelector('.result-layout_root__pCZux') && location.pathname.startsWith("/game/") && sessionStorage.getItem("FactLocationChecked") != 0) {
            checked = 0;
            sessionStorage.setItem("FactLocationChecked", checked)
        };
    }, 500);

    setTimeout(function() {
        if (!!document.querySelector('.result-layout_root__pCZux') && location.pathname.startsWith("/game/") && sessionStorage.getItem("FactLocationChecked") == 0){
            SetDisplayFact();
            checked = checked + 1;
            sessionStorage.setItem("FactLocationChecked", checked);
        }
        else if (!document.querySelector('.result-layout_root__pCZux') && location.pathname.startsWith("/game/") && sessionStorage.getItem("FactLocationChecked") != 0) {
            checked = 0;
            sessionStorage.setItem("FactLocationChecked", checked)
        };
    }, 1200);

    setTimeout(function() {
        if (!!document.querySelector('.result-layout_root__pCZux') && location.pathname.startsWith("/game/") && sessionStorage.getItem("FactLocationChecked") == 0){
            SetDisplayFact();
            checked = checked + 1;
            sessionStorage.setItem("FactLocationChecked", checked);
        }
        else if (!document.querySelector('.result-layout_root__pCZux') && location.pathname.startsWith("/game/") && sessionStorage.getItem("FactLocationChecked") != 0) {
            checked = 0;
            sessionStorage.setItem("FactLocationChecked", checked)
        };
    }, 2000);

    setTimeout(function(){
        factAttempt1();
    },300);

    setTimeout(function(){
        factAttempt1();
    },500);

    setTimeout(function(){
        factAttempt1();
    },1200);

    setTimeout(function(){
        factAttempt1();
    },2000);
};

document.addEventListener('click', tryFactCheck, false);
