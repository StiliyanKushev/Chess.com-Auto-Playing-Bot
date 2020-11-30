function startOnce() {
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
    var activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, {"message": "start once"});
   });
}

function startOnceNoAutoMove() {
  chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
  var activeTab = tabs[0];
  chrome.tabs.sendMessage(activeTab.id, {"message": "start once no auto"});
 });
}

function speedrun() {
  chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
  var activeTab = tabs[0];
  chrome.tabs.sendMessage(activeTab.id, {"message": "speedrun"});
 });
}

document.addEventListener("DOMContentLoaded", function() {
  document.getElementById("btn1").addEventListener("click", startOnce);
  document.getElementById("btn2").addEventListener("click", speedrun);
  document.getElementById("btn3").addEventListener("click", startOnceNoAutoMove);
});