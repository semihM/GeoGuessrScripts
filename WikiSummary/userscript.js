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
let MaximumFactMessageLength = 420; // Maximum message length. Messages can exceed this limit in version 0.1 if last sentence is too long

let API_URL = "https://api.bigdatacloud.net/data/reverse-geocode?localityLanguage=en&"
let WIKI_URL = "https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&origin=*&titles="

let checked = parseInt(sessionStorage.getItem("FactLocationChecked"), 10);
let last_fact =
    {
        "link": "<link_not_provided>",
        "text": "nothing interesting"
    }

if(sessionStorage.getItem("FactLocationChecked") == null) {
    sessionStorage.setItem("FactLocationChecked", 0);
    checked = 0;
};

function setNameToPostal(obj, name)
{
    obj.name = name
    obj.description = name
}

function getTitlesFromLocation()
{
    return getLocationObject()
    .then(loc => {
        needsWiki = true;
        let infos = loc.localityInfo.informative;

        let len = Object.keys(infos).length;

        if (len == 1)
        {
            let info = infos[0]
            if (info.order < 3)
            {
                needsWiki = false;
                return info.description
            }
            return info;
        }
        else
        {
            let filtered = infos.filter(o => o.order >= 3 && o.order <= 8);
            filtered.forEach(obj => obj.description == "postal code" ? setNameToPostal(obj, loc.city == "" ? loc.principalSubdivision : loc.city) : null);

            if (filtered.length == 0)
            {
                if (filtered.length == 1)
                {
                    needsWiki = false;
                    return infos[0].name + ": " + infos[0].description;
                }
                else if (filtered.length == 2)
                {
                    needsWiki = false;
                    return infos[1].name + ": " + infos[1].description;
                }
                else
                {
                    needsWiki = false;
                    return "nothing interesting...";
                }
            }

            let red = filtered.reduce((prev, curr) => curr.name.replace(" ", "%20") + "|" + prev, "");
            red = red.slice(0, red.length - 1)
            return red
        }
    })

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

        let pages = result.query.pages;

        if (-1 in pages) delete pages[-1]
        if (-2 in pages) delete pages[-2]

        let keys = Object.keys(pages);
        if (keys.length == 0) return null

        let k = keys[keys.length - 1];
        let fact = pages[k];
        if (fact == null) return null

        let reduced = fact.extract;
        while (reduced.endsWith("may refer to:\n\n"))
        {
            delete pages[k]

            keys = Object.keys(pages);
            k = keys[keys.length - 1];

            fact = pages[k];
            if (fact == null) return null

            reduced = fact.extract;
            if (reduced == null) return null
        }

        if (reduced.length > MaximumFactMessageLength)
        {
            let paragraphs = reduced.split(". ")
            let i = 0
            reduced = paragraphs.length != 0 ? "" : reduced

            while (i < paragraphs.length && reduced.length <= MaximumFactMessageLength)
            {
                reduced = reduced + ". " + paragraphs[i]
                i++;
            }

            // TO-DO: Add "read more" button
            //reduced = reduced.slice(0,MaximumFactMessageLength) + "..."
        }

        last_fact.link = "https://en.wikipedia.org/?curid=" + fact.pageid;
        return fact.title + ": " + reduced;
    });
}

let needsWiki = true;

function SetDisplayFact()
{
    getTitlesFromLocation()
        .then(titles => {
        if (needsWiki)
        {
            getFactFromTitles(titles).then(fact => {
                if (fact == null)
                {
                    fact = titles.name + ": " + titles.description
                }

                last_fact.text = fact;
                document.getElementById("location-fact").innerHTML = getLastFactInnerHtml() + "<br>" + getLastFactLinkHtml();
            })
        }
        else
        {
            needsWiki = true;
            last_fact.text = titles;
            last_fact.link = "<link_not_provided>";
            document.getElementById("location-fact").innerHTML = getLastFactInnerHtml() + "<br>" + getLastFactLinkHtml();
        }
    })
}

function getLastFactLinkHtml()
{
    return last_fact.link == "<link_not_provided>"
        ? ""
        : `<br><u><a href="${last_fact.link}"; style="color: white"><i><h2>Source Page</h2></i><a/></u>`;
}

function getLastFactInnerHtml()
{
    let text = last_fact.text.split(". ").reduce((prev, curr) => prev + "<br>" + curr);
    return `<br><i><h2>Fact</h2></i>${text}`;
}

function factAttempt1(newDiv1) {
    if(document.getElementById("location-fact") == null && document.getElementsByClassName("round-result_distanceDescription__13lR1").length == 1 && location.pathname.startsWith("/game/")) {
        newDiv1 = document.createElement("div")
        document.getElementsByClassName("round-result_distanceDescription__13lR1")[0].appendChild(newDiv1);
        newDiv1.innerHTML = `<div id="location-fact" style="text-align:center">${getLastFactInnerHtml()}</div>`;
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
