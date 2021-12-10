# GeoGuessr Scripts
- A collection of personal scripts for GeoGuessr
## Wiki Summary
- Display wiki and nearby famous/touristy place information about the location you get at the end of a round. Works with classic 5-round games and country/state streaks
- Install with greasyfork: https://greasyfork.org/en/scripts/436842-wiki-summary
- Raw script data: https://raw.githubusercontent.com/semihM/GeoGuessrScripts/main/WikiSummary/userscript.js
- Uses 2 free API's to work.  (first api key at step 3 can be replaced with "country streaks" script api key if you already have that)
- Follow these steps to get it working:
  + Install Tampermonkey browser extension (for chrome: https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)

  + Create a new script from extension settings and paste the raw script data. Keep this window open.

  + Get your first free API key from https://www.bigdatacloud.com/ and replace first ENTER_API_KEY with your key (used for getting geographical data) 

  + Get your second free API key from https://opentripmap.io/ and replace second ENTER_API_KEY with your key (used for finding famous locations around) 

  + You can change some settings (you can't miss it) if you want. Then save the script with CTRL+S

  + You are good to go, script should be enabled in geoguessr.com

- Script should be able to auto-update itself if installed correctly.
- Although there is a slight hassle with the current setup, that is the restoration of settings between updates. It is done by manually copy pasting a prompted message after an update was installed.
