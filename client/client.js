console.log("Chess bot client loaded.");
let moves = [];
let movesContainer;
const USERNAME = "pesho1234";

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if( request.message === "start once") {
            run(true);
        }
        else if(request.message === "speedrun"){
            run();
        }
        else if(request.message === "start once no auto"){
            run(true,true);
        }
    }
);

const myClock = () => {
    let users = document.getElementsByClassName("user-tagline-username")
    let myIndex = 0;
    if(users[1].textContent == USERNAME) myIndex = 1;
    let myClock = users[myIndex].parentElement.parentElement.parentElement.getElementsByClassName("clock-component")[0]
    
    return myClock;
}

const isMyMove = () => {
    if(myClock().classList.contains("clock-playerTurn")) return true;
    return false;
}

const movesEvent = (e) => {
    let newMoves = getMoves();

    if(newMoves.length !== moves.length){
        moves = newMoves;
        if(isMyMove()) makeMove();
    }
}

const movesEventNoAuto = (e) => {
    let newMoves = getMoves();

    if(newMoves.length !== moves.length){
        moves = newMoves;
        if(isMyMove()) makeMove(true);
    }
}

function movesEventCreator(dontAutoPlay){
    if(dontAutoPlay){
        return movesEventNoAuto;
    }
    
    return movesEvent;
}

function getMoves(){
    let arr = [];
    let divs = document.getElementsByClassName("vertical-move-list-column");
    for(let div of divs){
        // if its not a player move
        if(div.classList.length > 1) continue;
        if(div.textContent.trim().match(/[0-9]+-[0-9]+/g) !== null) {
            break;
        }
        arr.push(div.textContent.trim());
    }

    return arr;
}

function makeMove(dontPlayMove){
    console.log('fetching move');
    let [mins,secs] = myClock().textContent.split(":").map(Number)
    let secondsLeft = (mins * 60) + secs;
    console.log('current time in seconds: ', secondsLeft)
    fetch('https://localhost:80/getMove', {
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({
            board: moves,
            time: secondsLeft,
        })
    }).then(function (res) {
        return res.json()
    }).then((res) => {
        console.log(res);

        if(dontPlayMove){
            return;
        }

        let moves = res;
        let sq1 = moves[0] + moves[1];
        let sq2 = moves[2] + moves[3];

        let el = document.getElementsByClassName("coordinates inside inside-coords")[0];
        let ba = el.getBoundingClientRect();
        let sq = document.getElementsByClassName("piece")[0];

        let sqSize = sq.clientWidth; // same as height

        let startX = ba.x;
        let startY = ba.y + 100;

        let sq1Pos = squareToPos(sq1,sqSize,startX,startY)
        let sq2Pos = squareToPos(sq2,sqSize,startX,startY)

        let waitingTime = 0;

        let startingTime = getStartingTime()

        // stopSlowing down if we have 1 min left
        if(startingTime === 60) { waitingTime = 0; console.log("less then a min. Think fast!") }

        // play fast first 10 sec
        else if(secondsLeft > startingTime - 10) { waitingTime = getRandomTimeBetween(500,1300); console.log("fast play first moves") }

        // slow down until I have 33% of the starting time on the clock
        else if(secondsLeft > startingTime * 0.3) { waitingTime = getRandomTimeBetween(3000,11000); console.log("play slower in mid game") }

        setTimeout(() => {
            fetch('https://localhost:80/makeMove', {
                headers: {
                'Content-Type': 'application/json'
                },
                method: 'POST',
                body: JSON.stringify({
                    sq1Pos,
                    sq2Pos
                })
            }).then(() => {})
        }, waitingTime)
    })
}

function getStartingTime(){
    let all = document.getElementsByClassName("chat-message-component");
    all = [...all].filter(e => e.textContent.indexOf("NEW GAME") >= 0);
    let e = all[all.length - 1];

    if(!e) {
        console.log("[!] cannot get starting time")
        return 0;
    }

    let text = e.textContent;
    let rx = /(\([0-9] \| [0-9]\))|(\([0-9]+ min\))/g;
    let format = text.match(rx)[0];

    // has additional time on move
    if(format.indexOf("|") >= 0){
        let [mins,secs] = format.slice(1,-1).split(" | ").map(Number)
        return secondsLeft = (mins * 60) + secs;
    }
    // is a normal game with not added time
    else {
        let mins = Number(format.slice(1,-1).split(" ")[0])
        return secondsLeft = (mins * 60);
    }
}

function getRandomTimeBetween(min,max){
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function squareToPos(s,sqSize,startX,startY){
    let letter = s[0].charCodeAt() - 97;
    let number = Number(s[1]);

    // if white then turn around numbers
    if(number === 8) number = 1;
    else if(number === 7) number = 2;
    else if(number === 6) number = 3;
    else if(number === 5) number = 4;
    else if(number === 4) number = 5;
    else if(number === 3) number = 6;
    else if(number === 2) number = 7;
    else if(number === 1) number = 8;

    number--;

    return [(letter * sqSize) + startX + (sqSize / 2),(number * sqSize) + startY + (sqSize / 2)];
}

function startNewGame(){
    try{
        movesContainer.removeEventListener("DOMNodeInserted", movesEvent)
        movesContainer.removeEventListener("DOMNodeInserted", movesEventNoAuto)
    } catch(e) {}

    setTimeout(() => {
        let newGameBtn = document.getElementsByClassName("game-over-play-component")[0].children[1].getBoundingClientRect();
        let x = newGameBtn.x + newGameBtn.width / 2;
        let y = newGameBtn.y + newGameBtn.height / 2;        
        y += 100;

        console.log("clicking new game");

        fetch('https://localhost:80/click', {
                headers: {
                'Content-Type': 'application/json'
                },
                method: 'POST',
                body: JSON.stringify({
                    x,
                    y
                })
            }).then(function (res) {
                    let waitForNewGame = setInterval(() => {
                        let loading = document.getElementsByClassName("seeking-animation-component")[0];
                        if(loading === undefined){
                            // the game has started
                            setTimeout(() => { run() },1500);
                            clearInterval(waitForNewGame);
                        }
                    }, 2000)
            })
    },  500)
}

function run(runOneTimeOnly, dontAutoMove){
    console.log("register event listener")
    movesContainer = document.getElementsByClassName("vertical-move-list-component")[0].children[0];
    movesContainer.addEventListener("DOMNodeInserted", movesEventCreator(dontAutoMove))

    console.log("is my move?", isMyMove())

    if(isMyMove()){
        moves = getMoves();
        makeMove(dontAutoMove);
    }

    let checkForEndGame = setInterval(function () {
        let endGameBtns = document.getElementsByClassName("game-over-button-component")[0];
        if(endGameBtns !== undefined){
            if(!runOneTimeOnly){
                startNewGame();
            }
            clearInterval(checkForEndGame);
        }
    }, 1000)
}
