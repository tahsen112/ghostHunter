const canva = document.getElementById(`game`);
const ctx = canva.getContext(`2d`);
const drawCanva = document.getElementById(`draw`);
const drawCtx = drawCanva.getContext(`2d`);
const isMobile = /Mobi|Android/i.test(navigator.userAgent);
const minGhostSpeed = 0.3;


// ============= displays
let gameDisplay = document.getElementById(`game-display`);
let menuDispaly = document.getElementById(`menu`);
let roundDisplay = document.getElementById(`round-display`);
let tutorialDisplay = document.getElementById(`tutorial`);
let handFingerDisplay = document.getElementById(`hand-finger`);
let highestScoreDisplay = document.getElementById(`highest-score`);

// ============= highest score & local storage
let highestScore = 0;
if (localStorage.highestScore) {
    highestScore = JSON.parse(localStorage.highestScore);
    highestScoreDisplay.style.display = `block`;
    highestScoreDisplay.innerText = `Highest score: ${highestScore}`;
}

// ============= bools
ctx.imageSmoothingEnabled = false;
let isGhostMove = false;
let canPlayerDraw = false;
let isDown = false;
let isTimerOn = false;
let isSecondGhostSimilar = false;
let isFirstTime = true;


// ============= canva size
const backGroundWidth = 736;
const backGroundHeight = 420;

canva.width = backGroundWidth;
canva.height = backGroundHeight;
drawCanva.width = backGroundWidth;
drawCanva.height = backGroundHeight;

if (window.innerWidth <= 650) {
    if (window.innerHeight <= backGroundWidth && window.innerWidth <= backGroundHeight) {
        let width = window.innerWidth;
        let height = window.innerHeight;

        canva.width = height;
        canva.height = width;

        drawCanva.width = height;
        drawCanva.height = width;

    }
    else if (window.innerHeight <= backGroundWidth) {

        let height = window.innerHeight;

        canva.width = height;
        drawCanva.width = height;
    }
    else {
        let width = window.innerWidth;

        canva.height = width;
        drawCanva.height = width;
    }
}

// ============= directions & variabls
let right = 'right';
let left = 'left';
let down = 'down';
let up = 'up';

let firstX;
let firstY;
let timer;
let currentShape;
let ghosts = [];

let dir = [];
let points = [];
let lineColor = `white`;
let lastX;
let lastY;
let lineX;
let lineY;
let xAccuracy = 30;  // it mean the long of the drawn line to count it as a line
let yAccuracy = -30; // (line long should be >30 or <-30 in this case)

let lastPoint;
let lastAngle;
let dir2 = [];

let frameDuration = 100; // ms
let lastTime = 0;
let animeSpeed = 2;
let yDir = 1; // 1 or -1
const picSize = 64;
const centerX = canva.width /2 -30;
const centerY = canva.height /2 -30;
let CY = centerY;

let hearts = 5;
let roundNum = 0;
let score = 0;
let phase = 1;

let gameMode = 'menu';
const modes = {
    menu: 'menu',
    free: 'free',
    story: 'story'
}


// ============= images
let xLine = new Image();
xLine.src = `./imgs/xLine.png`;

let yLine = new Image();
yLine.src = `./imgs/yLine.png`;

let chevUp = new Image();
chevUp.src = `./imgs/chevUp.png`;

let chevDown = new Image();
chevDown.src = `./imgs/chevDown.png`

let chevRight = new Image();
chevRight.src = `./imgs/chevRight.png`;

let chevLeft = new Image();
chevLeft.src = `./imgs/chevLeft.png`;

let ghostImg = new Image();
ghostImg.src = `./imgs/ghost.png`;

let playerImg = new Image();
playerImg.src = `./imgs/magic.png`;

let heartImg = new Image();
heartImg.src = `./imgs/heart.png`;

// ============= audios
let ghostPop1 = new Audio(`./audios/ghostPop1.mp3`);
let ghostPop2 = new Audio(`./audios/ghostPop2.mp3`);
let ghostPop3 = new Audio(`./audios/ghostPop3.mp3`);
let lastSound;

// ============= rounds
let round = {
        speed: 0.5,
        dSpeed: 0,
        wavesNum: 1,
        ghostsNum: 1,
        roundShapes: [`|`, `—`],
        minShapes: 2,
        maxShapes: 2,
        fastGhostOnWave: [],
        isSemitry: false
    };
// note: speed here is like an extra speed on the ghosts speed, it's not mean the actual speed
// note: dSpeed means the decreasing speed when you draw a ghost shape
// note: roundShapes means the avabile shapes in this level, all shapes: [`—`, `|`, `<`, `>`, `V`, `^`, `Z`] 



// ============= font
ctx.font = `30px "Oswald", sans-serif`;
ctx.fillStyle = `red`;

drawCtx.strokeStyle = lineColor;



canva.addEventListener(`pointerdown`, function(e){
    isDown = true;
    firstX = e.offsetX;
    firstY = e.offsetY;

});


canva.addEventListener(`pointerup`, (e) => {
    isDown = false;
    lastAngle = null;
    lastPoint = null;
    dir2 = [];
    points = [];
    lineColor = `white`;
    drawCtx.strokeStyle = lineColor;
    lineX = 0;
    lineY = 0;
    if (!isTimerOn) {
        timer = setTimeout(() => {
            drawCtx.clearRect(0, 0, canva.width, canva.height);
            isTimerOn = false;
        }, 150);
    }
    else{
        clearTimeout(timer);
    }

    setTimeout(() => {
        lastX = 0;
        lastY = 0;
        if (dir.length > 0) {
            console.log(dir)
            console.log(currentShape);
            let res = dir.filter((v, i) => v !== dir[i -1]);

            if (currentShape !== undefined) {
                checkShape(currentShape);
            }
            else if (getDrawnShape(res) !== null) {
                checkShape(getDrawnShape(res));
            }

            currentShape = undefined;
        }
        dir = [];

        if (ghosts.length == 0 && remainingWaves > 0) {
            remainingWaves--;
            loadRound();
            checkFastGhost();
        }
    }, 20);
});




canva.addEventListener(`pointermove`, (e) => {
    e.preventDefault();

    if(isDown && canPlayerDraw){
        clearTimeout(timer);

        if (!lineX) {
            lineX = e.offsetX;
            lineY = e.offsetY;
        }
        // paint a smooth line when pointer move 
        drawCtx.beginPath();
        drawCtx.moveTo(lineX, lineY);
        drawCtx.lineTo(e.offsetX, e.offsetY);
        drawCtx.lineWidth = 15;
        drawCtx.lineCap = "round";
        drawCtx.stroke();

        lineX = e.offsetX;
        lineY = e.offsetY;

        points.push({x: lineX, y: lineY});
        

        let shape = getAngleDir(e.offsetX, e.offsetY);

        if (currentShape) changeLineColor();

        if (shape) {
            dir = dir2;
            return;
        }

        timer = setTimeout(() => {
            if (!shape) {
                
                if (lastX) {
                    resultX = e.offsetX - lastX;
                    resultY = e.offsetY - lastY;
                }
                else{
                    resultX = e.offsetX - firstX;
                    resultY = e.offsetY - firstY;
                }
    
                resultX = Math.round(resultX);
                resultY = Math.round(resultY);

                if (resultX > xAccuracy) {
                    dir.push(left);
                }
                else if(resultX < -xAccuracy){
                    dir.push(right);
                }
                if (resultY > -yAccuracy) {
                    dir.push(down);
                }
                else if(resultY < yAccuracy){
                    dir.push(up);
                }

                lastX = Math.round(e.offsetX);
                lastY = Math.round(e.offsetY);

            }
        }, 15);
    }
}, {passive: false});


function changeLineColor(){
    if (currentShape == '—') {
        lineColor = `#DC3F76`;
    }
    else if (currentShape == '|') {
        lineColor = `#4DA6FF`;
    }
    else if (currentShape == '^') {
        lineColor = `#3CA370`;
    }
    else if (currentShape == 'V') {
        lineColor = `#FFD013`;
    }
    else if (currentShape == '<') {
        lineColor = `#E36956`;
    }
    else if (currentShape == '>') {
        lineColor = `#E356D7`;
    }
    
    drawCtx.strokeStyle = lineColor;
    drawCtx.beginPath();
    
    for (let i = 0; i < points.length; i++) {
        let p = points[i];

        if (i == 0) {
            drawCtx.moveTo(p.x, p.y);
        }
        else {
            drawCtx.lineTo(p.x, p.y);
        }
    }

    drawCtx.stroke();
}


function randomNum(min, max){
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// create shapes for the ghosts
function createShapes(i){
    if (isFirstTime) {
        ghosts[0].shapes = [`|`, `—`];
    }
    else {
        let avabileShapes = round.roundShapes;
        if (avabileShapes == undefined || avabileShapes.length == 0) avabileShapes = [`—`, `|`, `<`, `>`, `V`, `^`];

        for (let s = 0; s < ghosts[i].shapesNum; s++) {
            let randShape = randomNum(0, avabileShapes.length - 1);
            ghosts[i].shapes.push(avabileShapes[randShape]);
        }
        return ghosts[i].shapes;
    }
    
}


// create ghost inside ghosts array
function createGhost(ghostNum, type){
    ghostNum == undefined ? ghostNum = 1: ghostNum;
    type == undefined ? type = `ghost`: type;
    if (type !== `ghost` && type !== `fast ghost`) {
        type = `ghost`;
    }

    if (type ==`ghost`) {
        let min = round.minShapes;
        let max = round.maxShapes;
        if (min > max) {
            let u = min;
            min = max;
            max = u;
        }
     
        for (let i = 0; i < ghostNum; i++) {
            let ghostPos = getGhostPos();
            let randShapeNum = randomNum(min, max);
            if (ghostNum == 1) ghostPos = {x: canva.width + 50, y: canva.height / 2}
            ghosts.push({shapesNum: randShapeNum, shapes: [], x: ghostPos.x, y: ghostPos.y, ghostType: type, speed: 0.6});
            createShapes(i);
            ghosts[i].speed += round.speed; // get extra speed from level speed
        }
        
        if (round.isSemitry) {
            let ghosts2 = structuredClone(ghosts);
            for (let i = 0; i < ghosts2.length; i++) {
                let ghostPos = getGhostPos();
                ghosts2[i].x = ghostPos.x;
                ghosts2[i].y = ghostPos.y;
            }
            ghosts = ghosts.concat(ghosts2);
            round.isSemitry = false;
        }

    }
    else if (type == `fast ghost`) {
        let ghostPos = getGhostPos();
        let index = ghosts.length;
        let randomSpeed = [1.4, 1.6, 2][randomNum(0, 2)];
        ghosts.push({shapesNum: 1, shapes: [], x: ghostPos.x, y: ghostPos.y, ghostType: type, speed: randomSpeed});
        createShapes(index);
    }
}

// give every ghost a postion (x, y)
function getGhostPos(){
    
    let x;
    let y = Math.round(Math.random() * canva.height);
    let rightLeft = [canva.width, 0];
    let randNum = randomNum(0, 1);
    lastGhost = ghosts[ghosts.length - 1];

    if (lastGhost) {
        if (lastGhost.x >= canva.width) {
            x = randomNum(-80, -40);
            return {x, y};
        }
        else if (lastGhost.x <= 0) {
            x = Math.round(canva.width + randomNum(40, 80));
            return {x, y};
        }
    }
    if(rightLeft[randNum] == canva.width) x = Math.round(canva.width + randomNum(40, 80));
    else if(rightLeft[randNum] == 0) x = randomNum(-80, -40);

    return {x, y};
}

// create func thats get the drawn shape ✔
// and then create another func thats loop on the ghosts shapes and checking if the drawn shape 
// is equal to the last shape on the ghost if so remove the last shape for the ghost ✔

const shapesSet = {
    // lines shape:
    xLine: ['—',
        ['left'],
        ['right']
    ],
    yLine: ['|',
        ['down'],
        ['up']
    ],
    // ⚡ shapes:
        // [coming soon]


    // ^ shapes:
    chevDown: ['^',
        ['up', 'left', 'down'],
        ['left', 'up', 'down'],
        ['left', 'up', 'left', 'down'],
        ['up', 'left', 'down', 'left'],
        ['up', 'right', 'down'],
        ['right', 'up', 'down'],
        ['right', 'up', 'right', 'down'],
        ['up', 'right', 'down', 'right'],
        ['up', 'left', 'up', 'left', 'down'],
        ['up', 'left', 'up', 'left', 'down', 'left'],
        ['up', 'left', 'up', 'left', 'down', 'left', 'down'],
        ['up', 'left', 'up', 'down', 'left', 'down'],
        ['up', 'left', 'down', 'left', 'up'],
        ['up', 'right', 'up', 'right', 'down'],
        ['up', 'right', 'up', 'right', 'down', 'right'],
        ['up', 'right', 'up', 'right', 'down', 'right', 'down'],
        ['up', 'right', 'up', 'down', 'right', 'down'],
        ['up', 'right', 'down', 'right', 'up'],
        ['up', 'left', 'up', 'down'],
        ['up', 'right', 'up', 'down'],
        ['up', 'down', 'left'],
        ['up', 'down', 'right'],
        ['up', 'left'],
        ['up', 'right'],
        ['up', 'down']
    ],
    // V shapes:
    chevUp: ['V',
        ['down', 'right', 'up'],
        ['right', 'down', 'up'],
        ['right', 'down', 'right', 'up'],
        ['down', 'right', 'up', 'right'],
        ['down', 'left', 'up'],
        ['left', 'down', 'up'],
        ['left', 'down', 'left', 'up'],
        ['down', 'left', 'up', 'left'],
        ['down', 'left', 'down', 'left', 'up'],
        ['down', 'left', 'down', 'left', 'up', 'left'],
        ['down', 'left', 'down', 'left', 'up', 'left', 'up'],
        ['down', 'left', 'down', 'up', 'left', 'up'],
        ['down', 'left', 'up', 'left', 'down'],
        ['down', 'right', 'down', 'right', 'up'],
        ['down', 'right', 'down', 'right', 'up', 'right'],
        ['down', 'right', 'down', 'right', 'up', 'right', 'up'],
        ['down', 'right', 'down', 'up', 'right', 'up'],
        ['down', 'right', 'up', 'right', 'down'],
        ['down', 'up', 'left'],
        ['down', 'up', 'right'],
        ['down', 'left', 'down', 'up'],
        ['down', 'right', 'down', 'up'],
        ['down', 'left'],
        ['down', 'right'],
        ['down', 'up']
    ],
    // < shapes:
    chevLeft: ['<',
        ['right', 'left', 'down', 'left'],
        ['right', 'left', 'up', 'left'],
        ['right', 'down', 'left', 'down'],
        ['right', 'down', 'right', 'down', 'left'],
        ['right', 'up', 'right', 'up', 'left'],
        ['right', 'down', 'left'],
        ['right', 'left', 'down'],
        ['right', 'up', 'left', 'up'],
        ['right', 'up', 'left'],
        ['right', 'left', 'up'],
        ['right', 'down', 'left', 'down', 'left'],
        ['right', 'down', 'left', 'down', 'left', 'down'],
        ['right', 'down', 'right', 'down', 'left', 'down', 'left', 'down'],
        ['right', 'down'],
        ['right', 'up', 'left', 'up', 'left'],
        ['right', 'up', 'left', 'up', 'left', 'up'],
        ['right', 'up', 'right', 'up', 'left', 'up', 'left', 'up'],
        ['right', 'up'],
        ['right', 'left'],
        ['down', 'left', 'down'],
        ['up', 'left', 'up']
    ],
    // > shapes:
    chevRight: ['>',
        ['left', 'right', 'up', 'right'],
        ['left', 'right', 'up', 'right'],
        ['left', 'down', 'right', 'down'],
        ['left', 'down', 'left', 'down', 'right'],
        ['left', 'up', 'left', 'up', 'right'],
        ['left', 'down', 'right'],
        ['left', 'right', 'down'],
        ['left', 'up', 'right', 'up'],
        ['left', 'up', 'right'],
        ['left', 'right', 'up'],
        ['left', 'down', 'right', 'down', 'right'],
        ['left', 'down', 'right', 'down', 'right', 'down'],
        ['left', 'down', 'left', 'down', 'right', 'down', 'right', 'down'],
        ['left', 'down'],
        ['left', 'up', 'right', 'up', 'right'],
        ['left', 'up', 'right', 'up', 'right', 'up'],
        ['left', 'up', 'left', 'up', 'right', 'up', 'right', 'up'],
        ['left', 'up'],
        ['left', 'right']
        ['down', 'right', 'down'],
        ['up', 'right', 'up']
    ]
}
// ['right', 'down', 'left', 'down', 'right', 'down']
function getDrawnShape(d){
    d = String(d);
    for(let key in shapesSet){
        for (let i = 1; i < shapesSet[key].length; i++) {
            if (d == shapesSet[key][i]) {
                return shapesSet[key][0];
            }
        }
    }
    return null;
}


function checkShape(shape){
    if (shape) {

        isSecondGhostSimilar = false;
        for (let i = 0; i < ghosts.length; i++) {
            let lastShape = ghosts[i].shapes[ghosts[i].shapesNum - 1];
            if (lastShape == shape) {
                if (!isSecondGhostSimilar) playGhostShapeSound(i, shape);
                if (isFirstTime) changeFingerAnime();
                score += 10;
                saveHighestScore();

                ghosts[i].shapes.splice(-1, 1);
                ghosts[i].shapesNum -= 1;
                if (ghosts[i].shapesNum == 0) {
                    score += 15;
                    saveHighestScore();
                    ghosts.splice(i, 1);
                    i -= 1;
                    giveHeart();
                    if (isFirstTime) hideTutorial();
                }
                else if(ghosts[i].speed - round.dSpeed >= minGhostSpeed) {
                    ghosts[i].speed -= round.dSpeed;
                }
            }
        }
    }
}


function playGhostShapeSound(i, shape){
    let randomSound = [ghostPop1, ghostPop2, ghostPop3];
    if (lastSound) {
        randomSound = randomSound.filter(item => item !== lastSound)[randomNum(0, 1)];
    }
    else {
        randomSound = randomSound[randomNum(0, 2)];
    }

    randomSound.volume = 0.2;
    randomSound.play();
    lastSound = randomSound;

    checkSecondGhost(i, shape);
}

function checkSecondGhost(index, shape){
    if (ghosts[index + 1] !== undefined) {
        for (let i = index + 1; i < ghosts.length; i++) {
            let lastShape = ghosts[i].shapes[ghosts[i].shapesNum - 1];
            if (lastShape == shape) {
                isSecondGhostSimilar = true;
            }
        }
    }
    
}


function hideTutorial(){
    if (isFirstTime) {
        isFirstTime = false;

        setTimeout(() => {
            tutorialDisplay.style.opacity = 0;
            handFingerDisplay.style.opacity = 0;
        }, 2000);

        setTimeout(() => {
            tutorialDisplay.style.display = `none`;
            handFingerDisplay.style.display = `none`;
        }, 3500);

    }
    
}

function changeFingerAnime(){
    handFingerDisplay.style.animationName = `fingerY`;
}


//      <------------------------------------>

function getAngleDir(x, y){
    if (!lastPoint) {
        lastPoint = {x, y};
        return;
    }

    let dx = x - lastPoint.x;
    let dy = y - lastPoint.y;

    // ignore the small moves
    if(Math.hypot(dx, dy) < 5) return;

    let angle = Math.atan2(dy, dx);

    lastPoint = {x, y};
    if (lastAngle == undefined || Math.abs(angle - lastAngle) > Math.PI / 4) {
        // convert angle to direction and push it in dir2 array
        // dir2.push(angleToDir(angle));
        angleToDir(angle);
        // save last angle
        lastAngle = angle;
        // put the two array togther and see if they make a shape
        let res = dir2.concat(dir);
        res = res.filter((v, i) => v !== res[i -1]);
        let drawnShape = getDrawnShape(res);
        
        if (drawnShape !== null) {
            currentShape = drawnShape;
        }
        else {
            // check if dir make a shape then check dir2 
            res = dir.filter((v, i) => v !== dir[i -1]);
            drawnShape = getDrawnShape(res);
            if (drawnShape !== null) {
                currentShape = drawnShape;
            }
            res = dir2.filter((v, i) => v !== dir2[i -1]);
            drawnShape = getDrawnShape(res);
            if (drawnShape !== null) {
                currentShape = drawnShape;
            }
            return getDrawnShape(res);
        }
    }

}

// make it do more than one direction by removing (return)
function angleToDir(angle){
    let deg = angle * 180 / Math.PI;

    if (deg >= -45 && deg < 45) {
        dir2.push(left);
    }
    else if (deg >= 135 || deg < -135) {
        dir2.push(right);
    }
    if (deg >= 45 && deg < 135) {
        dir2.push(down)
    }
    else if (deg >= -135 && deg < -45) {
        dir2.push(up)
    }
}

function drawShapeOnGhost(){
    let size = (picSize + 20) / 2;
    let gap = 25;

    for (let i = 0; i < ghosts.length; i++) {
        
        let centerX = ghosts[i].x + size / 2;
        let centerY = ghosts[i].y - size / 2;

        convertShapes(i, gap, centerX, centerY);
    }
}




function convertShapes(i, gap, centerX, centerY){
    let count = ghosts[i].shapesNum;
    let imgWidth = 23;
    let space = gap;
    let totalWidth = (count * imgWidth) + (count - 1) * space;
    let startX = (centerX - totalWidth / 2) + ((totalWidth / 2) / 2) - 5;
    
    let shape;
    gap = 0;
    centerY -= 5;
    for (let s = 0; s < ghosts[i].shapes.length; s++) {
            shape = ghosts[i].shapes[s];
            let x = startX;
            let y = centerY;

            if (shape == `—`) {
                ctx.drawImage(xLine, x + gap, y, imgWidth, imgWidth);
            }
            else if (shape == `|`) {
                ctx.drawImage(yLine, x + gap, y, imgWidth, 23);
            }
            else if (shape == `<`) {
                ctx.drawImage(chevRight, x + gap, y, imgWidth, imgWidth);
            }
            else if (shape == `>`) {
                ctx.drawImage(chevLeft, x + gap, y, imgWidth, imgWidth);
            }
            else if (shape == `V`) {
                ctx.drawImage(chevDown, x + gap, y, imgWidth, imgWidth);
            }
            else if (shape == `^`) {
                ctx.drawImage(chevUp, x + gap, y, imgWidth, imgWidth);
            }

            gap += space;
        }
    
}



function drawPlayer(playerImg){

    ctx.drawImage(playerImg, centerX - 25, CY - 30, picSize, picSize);
}

function drawGhost(){
    
    for (let i = 0; i < ghosts.length; i++) {
        ctx.drawImage(ghostImg, ghosts[i].x - 18, ghosts[i].y - 18, picSize + 15, picSize + 15);
    }
}



function moveGhost(){
    if (!isGhostMove) return;

    let distance;
    let dx;
    let dy;

    for (let i = 0; i < ghosts.length; i++) {
        dx = centerX - ghosts[i].x;
        dy = centerY - ghosts[i].y;

        distance = Math.hypot(dx, dy);
        if (distance > 35) {
            ghosts[i].x += (dx / distance) * ghosts[i].speed;
            ghosts[i].y += (dy / distance) * ghosts[i].speed;
        }
        else{
            let ghostPos = getGhostPos();
            ghosts[i].x = ghostPos.x;
            ghosts[i].y = ghostPos.y;
            hearts--;
            if (hearts == 0) showMainMenu();
        }

    }

}


function draw(time){
    if (gameMode == modes.free) {
        
        ctx.clearRect(0, 0, canva.width, canva.height)
        moveGhost();
        drawGhost();
        drawShapeOnGhost();
        drawPlayer(playerImg);
        drawHearts();
        showRoundAndScore();
    
        if (time - lastTime > frameDuration) {
            CY += animeSpeed * yDir;
            if (CY > centerY + 8 || CY < centerY - 2) {
                yDir *= -1;
            }
            lastTime = time;
        }
        
    }

    requestAnimationFrame(draw);
}
draw();



let remainingWaves = round.wavesNum;

function loadRound(){
    if (remainingWaves > 0) {
        ghosts = [];
        let gn = round.ghostsNum;
        
        gn > 10 ? gn = 10 : gn;
        if (gn == 1) {
            createGhost(gn);
        }
        else {
            createGhost(randomNum(Math.round(gn / 1.5), gn));
        }
        
    }
    else{
        roundNum += 1;
        showRoundChange();
        changeRound();
    }
} 

loadRound();

function changeRound(){

    createNewRound();
    loadRound();
}

function createNewRound(){
    if (phase == 1) {

        round.speed = Number((Math.random() * 0.3).toFixed(1));
        round.dSpeed = [0.025, 0.05, 0.075][randomNum(0, 2)];
        round.wavesNum = randomNum(3, 4);
        round.ghostsNum = randomNum(2, 3);
        round.roundShapes = [`—`, `|`];
        round.minShapes = randomNum(1, 2);
        round.maxShapes = randomNum(2, 3);
        if (roundNum >= 3) {
            phase++;
        }
    }

    else if (phase == 2) {
        round.speed = Number((Math.random() * 0.4).toFixed(1));
        round.dSpeed = [0.025, 0.05][randomNum(0, 1)];
        round.wavesNum = randomNum(3, 5);
        // if speed is bigger than 0 create 3-4 ghosts
        round.speed > 0.1 ? round.ghostsNum = randomNum(3, 4) : round.ghostsNum = randomNum(4, 5);
        round.roundShapes = [[`—`, `|`, `<`, `>`], [`—`, `|`, `V`, `^`]][[randomNum(0, 1)]];
        round.minShapes = randomNum(2, 3);
        round.maxShapes = randomNum(3, 4);
        // if player reach round 4 make fast ghosts
        roundNum >= 4 ? round.fastGhostOnWave = createWaves4FastGhost(): 0;
        // if ghosts is more than 4 do not make semitry
        round.ghostsNum >= 4 ? round.isSemitry = false : round.isSemitry = [false, true][randomNum(0, 1)];
        if (roundNum >= 6) {
            phase++;
        }
    }
    else if (phase == 3) {
        round.speed = Number((Math.random() * (0.5 - 0.2) + 0.2).toFixed(1)); // 0.2 - 0.5
        round.dSpeed = [0.05, 0.075][randomNum(0, 1)];
        round.wavesNum = randomNum(4, 6);
        round.ghostsNum = randomNum(4, 6);
        round.roundShapes = [`—`, `|`, `<`, `>`, `V`, `^`];
        round.minShapes = randomNum(2, 3);
        round.maxShapes = randomNum(3, 5);
        round.fastGhostOnWave = createWaves4FastGhost();
        round.isSemitry = [false, true][randomNum(0, 1)];
    }

    remainingWaves = round.wavesNum;
}

function createWaves4FastGhost(){
    const randomChoice = [false, true];
    let result= [];
    if (randomChoice[randomNum(0, 1)]) {
        for (let i = 0; i < round.wavesNum; i++) {
            if (randomChoice[randomNum(0, 1)]) result.push(i + 1);
        }
    }
    
    return result;
}


function drawHearts(){
    let gap = 0; // 35
    let rightSide = 30;
    let topSide = 20;
    let heartSize = 40;
        
    for (let i = 0; i < hearts; i++) {
        ctx.drawImage(heartImg, rightSide + gap, topSide, heartSize, heartSize);
        gap += 35;
    }
}

function giveHeart(){
    if (hearts < 5) {
        let pHearts = [``, ``, `h`, ``, ``, ``, `h`, ``, `h`, ``]; // 40%
        let h = pHearts[randomNum(0, pHearts.length - 1)];
        if (h == `h`) {
            hearts++;
        }
    }
}

function checkFastGhost(){
    // if current wave have fast ghost then create one fast ghost
    if (round.fastGhostOnWave.includes(remainingWaves)) {
        createGhost(1, `fast ghost`);
    }
}


function showRoundAndScore(){
    let roundText = `round ${String(roundNum)}`;
    let textWidth = ctx.measureText(roundText).width;
    let right = (canva.width - 30) - textWidth;
    let top = 50;
    // show round:
    ctx.fillText(roundText, right, top);
    // show score:
    ctx.fillText(String(score), right, top + 40);
}


function showRoundChange(){
    roundDisplay.innerText = `Round ${roundNum}`
    isGhostMove = false;
    canPlayerDraw = false;
    roundDisplay.style.opacity = 1;
    setTimeout(() => {
        isGhostMove = true;
        canPlayerDraw = true;
        roundDisplay.style.opacity = 0;
    }, 1500);
}

function startGame(){
    gameMode = modes.free;
    isGhostMove = true;
    isFirstTime == true ? canPlayerDraw = false : canPlayerDraw = true;
    menuDispaly.style.display = `none`;
    gameDisplay.style.display = `grid`;
    
    setTimeout(() => {
        tutorialDisplay.style.opacity = 1;
        handFingerDisplay.style.opacity = 1;
    }, 1000);

    setTimeout(() => {
        if (isFirstTime) {
            isGhostMove = false;
            canPlayerDraw = true;
        }
    }, 4000);
}


function showMainMenu(){
    gameMode = modes.menu;
    menuDispaly.style.display = `flex`;
    highestScoreDisplay.style.display = `block`;
    gameDisplay.style.display = `none`;
    
    saveHighestScore();
    highestScoreDisplay.innerText = `Highest score: ${highestScore}`;
    resetGame();
}

function resetGame(){
    phase = 1;
    score = 0;
    roundNum = 1;
    hearts = 5;
    createNewRound();
    loadRound();
}

function saveHighestScore(){
    if (score > highestScore) {
        highestScore = score;
        localStorage.highestScore = JSON.stringify(score);
    }
}
