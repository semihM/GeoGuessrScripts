# GeoGuessr Scripts
- A collection of personal scripts for GeoGuessr
- Scripts work with Tampermonkey extension. Install Tampermonkey browser extension (for chrome: https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)

## Wiki Summary
- Display wiki and nearby famous/touristy place information about the location you get at the end of a round. Works with classic 5-round games and country/state streaks
- Install with greasyfork: https://greasyfork.org/en/scripts/436842-wiki-summary
- Raw script data: https://raw.githubusercontent.com/semihM/GeoGuessrScripts/main/WikiSummary/userscript.js
- Uses 2 free API's to work.  (first api key at step 3 can be replaced with "country streaks" script api key if you already have that)
- Follow these steps to get it working:
  + Get your first free API key from https://www.bigdatacloud.com/ and replace first ENTER_API_KEY with your key (used for getting geographical data) 

  + Get your second free API key from https://opentripmap.io/ and replace second ENTER_API_KEY with your key (used for finding famous locations around) 

  + You can change some settings (you can't miss it) if you want. Then save the script with CTRL+S

  + You are good to go, script should be enabled in geoguessr.com

- Script should be able to auto-update itself if installed correctly.
- Although there is a slight hassle with the current setup, that is the restoration of settings between updates. It is done by manually copy pasting a prompted message after an update was installed.

## LatitudeGuessr
- Calculate your score from the latitude only! Guessing Greece instead of Spain won't be punishing anymore!
- Install with greasyfork: https://greasyfork.org/en/scripts/436996-latitudeguessr
- Raw script data: https://raw.githubusercontent.com/semihM/GeoGuessrScripts/main/LatitudeGuessr/userscript.js
- No API required
- Script should be able to auto-update itself if installed correctly.

## GuessPortal
- Embed streetview of your guess and the correct location to the window after a round ends
- Install with greasyfork: https://greasyfork.org/en/scripts/437407-guessportal
- Raw script data: https://raw.githubusercontent.com/semihM/GeoGuessrScripts/main/GuessPortal/userscript.js
- Google Maps API Key is required for streetview embedding. 
- Follow the instructions to get it working:
  + Go to https://console.cloud.google.com/projectselector2/google/maps-apis/credentials

  + Create a project (Name and organization doesn't matter)

  + Select the project

  + Click "Create credentials" on top and select API key.

  + The API key created dialog displays your newly created API key.

  + (OPTIONAL) Click "Edit API key" on the left and under "Application restrictions" select "HTTP referrers". Add "https://www.geoguessr.com/" under "Website restrictions" to restrict API key's use to geoguessr
 
- Script should be able to auto-update itself if installed correctly.

## GeoRadio
- Get a link to the closest radio station and start listening to some local music!
- Install with greasyfork: https://greasyfork.org/en/scripts/437489-georadio
- Raw script data: https://raw.githubusercontent.com/semihM/GeoGuessrScripts/main/GeoRadio/userscript.js
- No API required
- Script should be able to auto-update itself if installed correctly.
