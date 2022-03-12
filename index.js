"use strict";
//Modules
const WebSocket = require("ws");
const canvas = require("canvas");
const Fs = require("fs");
//--settings--///////////////////////////////////
const pixelsx = 80;
const pixelsy = 80;
const pixelsx1 = 80;
const pixelsy1 = 87;
const botCount = 1;
let bots = [];
const imagedir = "./calc.png";
const wsurl = "ws://ourworldofpixels.com/:443";
const httpurl = "https://ourworldofpixels.com";
const pos = [-32, -48];
const timestart = 100;
const wolfMove = true
//--------------------------------------------------------------------------------//

const charset = " .0123456789+-*/";
const charPos = [
    [5, 6],
    [12, 6],
    [18, 6],
    [24, 6],
    [30, 6],
    [36, 6],
    [42, 6],
    [48, 6],
    [54, 6],
    [5, 14],
    [12, 14],
    [18, 14],
    [24, 14],
    [30, 14],
    [36, 14],
    [42, 14],
    [48, 14],
    [54, 14]
];
let display = [
    " ", " ", " ", " ", " ", " ", " ", " ", " ",
    " ", " ", " ", " ", " ", " ", " ", " ", " "
];

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function calculate() {
    let result = NaN;
    let v1 = parseFloat(display.slice(0, 9).join("")) || 0;
    let v2 = parseFloat(display.slice(10).join("")) || 0;
    if (display[9] == "+") {
        if (v1 == 999 && v2 == 999) {
            result = 99999999
        } else {
            result = v1 + v2;
        }
    } else if (display[9] == "-") {
        result = v1 - v2;
    } else if (display[9] == "*") {
        result = v1 * v2;
    } else if (display[9] == "/") {
        if (v2 === 0) {
            result = 0;
        } else {
            result = v1 / v2;
        }
    }
    if (!isNaN(result)) {
        result = result.toString();
        if (result.startsWith("-")) {
            result = result.slice(1);
            setChar(0, 13);
        }
        for (let i = 1; i < 9; i++) {
            setChar(i, charset.indexOf(result.charAt(i - 1)));
        }
    }
}

function type(sign) {
    //console.log(sign + ' ' + charset.indexOf(sign))
    if (sign == "c") {
        for (let i = 0; i < display.length; i++) {
            setChar(i, 0);
        }
    } else if (sign == "+" || sign == "-" || sign == "*" || sign == "/") {
        calculate();
        for (let i = 10; i < 18; i++) {
            setChar(i, 0);
        }
        setChar(9, charset.indexOf(sign));
    } else if (sign == "=") {
        calculate();
        for (let i = 9; i < 18; i++) {
            setChar(i, 0);
        }
    } else {
        if (display[9] == " ") {
            for (let i = 1; i < 9; i++) {
                if (display[i] == " ") {
                    setChar(i, charset.indexOf(sign));
                    break;
                }
                if (display[i] == "." && sign == ".") {
                    break;
                }
            }
        } else {
            for (let i = 10; i < 18; i++) {
                if (display[i] == " ") {
                    setChar(i, charset.indexOf(sign));
                    break;
                }
                if (display[i] == "." && sign == ".") {
                    break;
                }
            }
        }
    }
}

let timeout = 0;
//let buttons = [];

let buttons = [{ // 1
        x: 5,
        y: 24,
        w: 11,
        h: 11,
        char: "1"
    },
    { // 2
        x: 17,
        y: 24,
        w: 11,
        h: 11,
        char: "2"
    },
    { // 3
        x: 29,
        y: 24,
        w: 11,
        h: 11,
        char: "3"
    },
    { // 4
        x: 5,
        y: 36,
        w: 11,
        h: 11,
        char: "4"
    },
    { // 5
        x: 17,
        y: 36,
        w: 11,
        h: 11,
        char: "5"
    },
    { // 6
        x: 29,
        y: 36,
        w: 11,
        h: 11,
        char: "6"
    },
    { // 7
        x: 5,
        y: 48,
        w: 11,
        h: 11,
        char: "7"
    },
    { // 8
        x: 17,
        y: 48,
        w: 11,
        h: 11,
        char: "8"
    },
    { // 9
        x: 29,
        y: 48,
        w: 11,
        h: 11,
        char: "9"
    },
    { // .
        x: 5,
        y: 60,
        w: 11,
        h: 11,
        char: "."
    },
    { // 0
        x: 17,
        y: 60,
        w: 11,
        h: 11,
        char: "0"
    },
    { // =
        x: 29,
        y: 60,
        w: 11,
        h: 11,
        char: "="
    },
    { // c
        x: 43,
        y: 24,
        w: 15,
        h: 7,
        char: "c"
    },
    { // +
        x: 43,
        y: 32,
        w: 15,
        h: 9,
        char: "+"
    },
    { // -
        x: 43,
        y: 42,
        w: 15,
        h: 9,
        char: "-"
    },
    { // *
        x: 43,
        y: 52,
        w: 15,
        h: 9,
        char: "*"
    },
    { // /
        x: 43,
        y: 62,
        w: 15,
        h: 9,
        char: "/"
    }
];

let calc = new canvas.createCanvas(pixelsx1, pixelsy1);
let ctx = calc.getContext("2d");
let calcData;
Fs.readFile(imagedir, function(err, squid) {
    if (err) throw err;
    let img = new canvas.Image();
    img.src = squid;
    ctx.drawImage(img, 0, 0);
    calcData = ctx.getImageData(0, 0, pixelsx1, pixelsy1).data;
});

var owopBot;
var fSf = 0;
var connect = function() {
    for(let i = 0; i < botCount; i++){
        let bot = new WebSocket(wsurl, {
            origin: httpurl
        });
        bot.on("open", function() {
            bots.push(bot);
        });
        bot.on("message", async function(data) {
    
            var xte = 10000
            var yte = 10000
            if (typeof data != "string") {
                switch (data.readUInt8(0)) {
                    case 0: // Get id
                        sendMove(62499999, 62499999);
                        setInterval(function() {
                            sendMove(62499999, 62499999)
                        }, 10);
                        setTimeout(starting, 1)
                        break;
                    case 1: // Get all cursors, tile updates, disconnects
                        var off = 2 + data.readUInt8(1) * 16;
                        // Tile updates
                        for (let j = data.readUInt16LE(off); j--;) {
                            let px = data.readInt32LE(2 + off + j * 11);
                            let py = data.readInt32LE(2 + off + j * 11 + 4);
                            let r = data.readUInt8(2 + off + j * 11 + 8);
                            let g = data.readUInt8(2 + off + j * 11 + 9);
                            let b = data.readUInt8(2 + off + j * 11 + 10);
    
                            if (px >= pos[0] && px < pos[0] + pixelsx && py >= pos[1] && py < pos[1] + pixelsy) {
                                function startput() {
                                    redraw(px, py, [r, g, b]);
                                    let buffer = new Buffer(12);
                                    buffer.writeInt32LE(xte * 16, 0);
                                    buffer.writeInt32LE(yte * 16, 4);
                                    buffer.writeUInt8(0, 8);
                                    buffer.writeUInt8(0, 9);
                                    buffer.writeUInt8(0, 10);
                                    buffer.writeUInt8(0, 11);
                                    //owopBot.send(buffer);
                                    //proxy1.send(buffer);
                                    //proxy2.send(buffer);
                                }
                                setTimeout(startput, (j * 10) + timestart);
                                //console.log(j)
                            }
                        }
    
                        break;
                    case 2: // Get chunk
                        let x = data.readInt32LE(1);
                        let y = data.readInt32LE(5);
                        let yset = 0;
                        let xset = 0;
                        let x1set = 0;
                        if ((x + 1) * 16 >= pos[0] && x * 16 < pos[0] + pixelsx && (y + 1) * 16 >= pos[1] && y * 16 < pos[1] + pixelsy) {
                            for (let yy = y * 16; yy < (y + 1) * 16; yy += 1) {
                                if (yset > 1) {
                                    yset = 0;
                                }
                                yset++;
                                for (let xx = x * 16; xx < (x + 1) * 16; xx += 2) {
                                    if (xx >= pos[0] && xx < pos[0] + pixelsx && yy >= pos[1] && yy < pos[1] + pixelsy) {
                                        //function startput() {
                                        //function startput1(xx1,yy1) {
                                        redraw(xx, yy);
                                        let buffer = new Buffer(12);
                                        buffer.writeInt32LE(xte * 16, 0);
                                        buffer.writeInt32LE(yte * 16, 4);
                                        buffer.writeUInt8(0, 8);
                                        buffer.writeUInt8(0, 9);
                                        buffer.writeUInt8(0, 10);
                                        buffer.writeUInt8(0, 11);
                                        //owopBot.send(buffer);
                                        //proxy1.send(buffer);
                                        //proxy2.send(buffer);
                                        //}
                                        if (x1set > 10) {
                                            x1set = 0;
                                        }
                                        x1set++;
                                        //setTimeout(() => {startput1(xx,yy)}, 0)
                                        //}
                                        fSf += timestart;
                                        //await sleep(fSf)
                                        //setTimeout(startput, fSf);
                                        //console.log(xx + ' ' + yy + ' ' + x + ' ' + y + ' ' + yset)
                                    }
                                }
                            }
                        }
                        //fSf=0;
                        if ((x + 1) * 16 >= pos[0] && x * 16 < pos[0] + pixelsx && (y + 1) * 16 >= pos[1] && y * 16 < pos[1] + pixelsy) {
                            for (let yy = y * 16; yy < (y + 1) * 16; yy += 2) {
                                if (yset > 1) {
                                    yset = 0;
                                }
                                yset++;
                                for (let xx = x * 16; xx < (x + 1) * 16; xx += 1) {
                                    if (xx >= pos[0] && xx < pos[0] + pixelsx && yy >= pos[1] && yy < pos[1] + pixelsy) {
                                        //function startput() {
                                        //function startput1(xx1,yy1) {
                                        redraw(xx, yy);
                                        let buffer = new Buffer(12);
                                        buffer.writeInt32LE(xte * 16, 0);
                                        buffer.writeInt32LE(yte * 16, 4);
                                        buffer.writeUInt8(0, 8);
                                        buffer.writeUInt8(0, 9);
                                        buffer.writeUInt8(0, 10);
                                        buffer.writeUInt8(0, 11);
                                        //owopBot.send(buffer);
                                        //proxy1.send(buffer);
                                        //proxy2.send(buffer);
                                        //}
                                        if (x1set > 10) {
                                            x1set = 0;
                                        }
                                        x1set++;
                                        //setTimeout(() => {startput1(xx,yy)}, 0)
                                        //}
                                        fSf += timestart;
                                        //await sleep(fSf)
                                        //setTimeout(startput, fSf);
                                        //console.log(xx + ' ' + yy + ' ' + x + ' ' + y + ' ' + yset)
                                    }
                                }
                            }
                        }
                        fSf = 0;
                        if ((x + 1) * 16 >= pos[0] && x * 16 < pos[0] + pixelsx && (y + 1) * 16 >= pos[1] && y * 16 < pos[1] + pixelsy) {
                            for (let yy = y * 16; yy < (y + 1) * 16; yy++) {
                                if (yset > 1) {
                                    yset = 0;
                                }
                                yset++;
                                for (let xx = x * 16; xx < (x + 1) * 16; xx++) {
                                    if (xx >= pos[0] && xx < pos[0] + pixelsx && yy >= pos[1] && yy < pos[1] + pixelsy) {
                                        //function startput() {
                                        //function startput1(xx1,yy1) {
                                        redraw(xx, yy);
                                        let buffer = new Buffer(12);
                                        buffer.writeInt32LE(xte * 16, 0);
                                        buffer.writeInt32LE(yte * 16, 4);
                                        buffer.writeUInt8(0, 8);
                                        buffer.writeUInt8(0, 9);
                                        buffer.writeUInt8(0, 10);
                                        buffer.writeUInt8(0, 11);
                                        //owopBot.send(buffer);
                                        //proxy1.send(buffer);
                                        //proxy2.send(buffer);
                                        //}
                                        if (x1set > 10) {
                                            x1set = 0;
                                        }
                                        x1set++;
                                        //setTimeout(() => {startput1(xx,yy)}, 0)
                                        //}
                                        fSf += timestart;
                                        await sleep()
                                        //setTimeout(startput, fSf*yset);
                                        //console.log(xx + ' ' + yy + ' ' + x + ' ' + y + ' ' + yset)
                                    }
                                }
                            }
                        }
                        break;
                    case 3: // Teleport
                        break;
                    case 4: // Get admin
    
                        let xset1 = 0;
                        let yset1 = 0;
                        for (let y = pos[1]; y < pos[1] + pixelsy; y += 1) {
                            if (yset1 > 1) {
                                yset1 = 0;
                            }
                            yset1++;
                            for (let x = pos[0]; x < pos[0] + pixelsx; x += 2) {
                                if (xset1 > 5) {
                                    xset1 = 0;
                                }
                                xset1++;
                                //function startput() {
                                //function startput1(x1,y1) {
                                redraw(x, y);
                                //owopBot.send(buffer);
                                //proxy1.send(buffer);
                                //proxy2.send(buffer);
                                //}
                                //setTimeout(() => {startput1(x,y)}, 0)
                                //}
                                fSf += 0.1;
                                await sleep()
                                //setTimeout(startput, fSf*xset1);
                                //console.log(x + y)
                            }
                        }
                        fSf = 0;
                        for (let y = pos[1]; y < pos[1] + pixelsy; y += 2) {
                            if (yset1 > 1) {
                                yset1 = 0;
                            }
                            yset1++;
                            for (let x = pos[0]; x < pos[0] + pixelsx; x += 1) {
                                if (xset1 > 5) {
                                    xset1 = 0;
                                }
                                xset1++;
                                //function startput() {
                                //function startput1(x1,y1) {
                                redraw(x, y);
                                //owopBot.send(buffer);
                                //proxy1.send(buffer);
                                //proxy2.send(buffer);
                                //}
                                //setTimeout(() => {startput1(x,y)}, 0)
                                //}
                                fSf += 0.1;
                                await sleep()
                                //setTimeout(startput, fSf*xset1);
                                //console.log(x + y)
                            }
                        }
                        fSf = 0;
                        for (let y = pos[1] + 1; y < pos[1] + pixelsy; y += 2) {
                            if (yset1 > 1) {
                                yset1 = 0;
                            }
                            yset1++;
                            for (let x = pos[0] + 1; x < pos[0] + pixelsx; x += 2) {
                                if (xset1 > 5) {
                                    xset1 = 0;
                                }
                                xset1++;
                                //function startput() {
                                //function startput1(x1,y1) {
                                //if(((calcData[index] != color[0] || calcData[index + 1] != color[1] || calcData[index + 2] != color[2]))) return;
                                redraw(x, y);
                                //owopBot.send(buffer);
                                //proxy1.send(buffer);
                                //proxy2.send(buffer);
                                //}
                                //setTimeout(() => {startput1(x,y)}, 0)
                                //}
                                fSf += 0.1;
                                await sleep()
                                //setTimeout(startput, fSf*xset1);
                                //console.log(x + y)
                            }
                        }
                        break;
                    case 5: // Captcha
                        
                    case 6:
                }
            }
        });
        bot.on("error", function(e) {
            console.log("proxy 0 error!!!"+e);
            //setTimeout(proxy5, 1);
        });
        bot.on("close", function() {
            console.log("owop close!!!");
            setTimeout(connect, 1);
        });
    };
};
connect();

function sendMove(x, y) {
    if (wolfMove == true){
        bots[0].send(new Buffer([-255, 500, 500, 500, -255, 2551, 255, 255, 1, 0, 0, 0]));
    }
}

function infnX(t) {
    let x = (Math.cos(t * 2) - 1) / 2;
    if (Math.abs(t * 2) % (4 * Math.PI) > 2 * Math.PI) return -x;
    else return x;
}

function infnY(t) {
    return Math.sin(t * 2) / 2;
}
var i0 = 0;
var i1 = 120;
var i2 = 240;
var speeds = 0.003; // 0.15 by default
async function starting() {
    i0 = i0 + speeds;
    i1 = i1 + speeds;
    i2 = i2 + speeds;
    fSf = 0;
    setTimeout(starting, 100)
}
var limited = 0;
/*async function starts() {
  var sleepseted = 20;
  if(limited > 12) return;
  limited++;
    setTimeout(starts, 500);
    for(let i = 0; i < 66; i++) {
      if(owopBot.readyState == 0) return;
      var buffer = new Buffer(11);
      buffer.writeInt32LE(15+ i, 0);
      buffer.writeInt32LE(31, 4);
      buffer.writeUInt8(255, 8);
      buffer.writeUInt8(255, 9);
      buffer.writeUInt8(255, 10);
      owopBot.send(buffer);
      await sleep(sleepseted)
      buffer = new Buffer(11);
      buffer.writeInt32LE(15+ i, 0);
      buffer.writeInt32LE(31, 4);
      buffer.writeUInt8(0, 8);
      buffer.writeUInt8(0, 9);
      buffer.writeUInt8(0, 10);
      owopBot.send(buffer);
    }
    for(let i = 0; i < 82; i++) {
      if(owopBot.readyState == 0) return;
      var buffer = new Buffer(11);
      buffer.writeInt32LE(80, 0);
      buffer.writeInt32LE(31+ i, 4);
      buffer.writeUInt8(255, 8);
      buffer.writeUInt8(255, 9);
      buffer.writeUInt8(255, 10);
      owopBot.send(buffer);
      await sleep(sleepseted)
      buffer = new Buffer(11);
      buffer.writeInt32LE(80, 0);
      buffer.writeInt32LE(31+ i, 4);
      buffer.writeUInt8(0, 8);
      buffer.writeUInt8(0, 9);
      buffer.writeUInt8(0, 10);
      owopBot.send(buffer);
    }
    for(let i = 0; i < 66; i++) {
      if(owopBot.readyState == 0) return;
      var buffer = new Buffer(11);
      buffer.writeInt32LE(80 - i, 0);
      buffer.writeInt32LE(112, 4);
      buffer.writeUInt8(255, 8);
      buffer.writeUInt8(255, 9);
      buffer.writeUInt8(255, 10);
      owopBot.send(buffer);
      await sleep(sleepseted)
      buffer = new Buffer(11);
      buffer.writeInt32LE(80 - i, 0);
      buffer.writeInt32LE(112, 4);
      buffer.writeUInt8(0, 8);
      buffer.writeUInt8(0, 9);
      buffer.writeUInt8(0, 10);
      owopBot.send(buffer);
    }
    for(let i = 0; i < 82; i++) {
      if(owopBot.readyState == 0) return;
      var buffer = new Buffer(11);
      buffer.writeInt32LE(15, 0);
      buffer.writeInt32LE(112 - i, 4);
      buffer.writeUInt8(255, 8);
      buffer.writeUInt8(255, 9);
      buffer.writeUInt8(255, 10);
      owopBot.send(buffer);
      await sleep(sleepseted)
      buffer = new Buffer(11);
      buffer.writeInt32LE(15, 0);
      buffer.writeInt32LE(112 - i, 4);
      buffer.writeUInt8(0, 8);
      buffer.writeUInt8(0, 9);
      buffer.writeUInt8(0, 10);
      owopBot.send(buffer);
    }
    limited--;
    //console.log(limited)
    startagain();
}*/

//setTimeout(starts, 1);

function startagain() {
    if (limited == 1) setTimeout(starting, 1);
}

var x = 7;
var y = 5;

function random(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function setChar(index, id) {
    if (charset[id] != display[index]) {
        display[index] = charset[id];
        ctx.drawImage(
            calc,
            id * 5,
            80,
            5,
            7,
            charPos[index][0],
            charPos[index][1],
            5,
            7
        );
        calcData = ctx.getImageData(0, 0, pixelsx1, pixelsy1).data;
        for (let y = charPos[index][1]; y < charPos[index][1] + 7; y++) {
            for (let x = charPos[index][0]; x < charPos[index][0] + 5; x++) {
                function wait() {
                    redraw(pos[0] + x, pos[1] + y);
                }
                fSf += 2;
                setTimeout(wait, random(10, 500))
            }
        }
    }
}
var pressed = 0;
var pixelsspam = 0;
setInterval(() => {
    if (pixelsspam < 0) return pixelsspam = 0;
    pixelsspam -= 1000;
}, 1000)
async function redraw(x, y, color) {
    if (pixelsspam > 1000) {
        function pasteagain() {
            redraw(x, y, color)
        }
        setTimeout(pasteagain, 100);
        return;
    } else {
        pixelsspam += 0.2;
    }
    if (pressed > 10) {
        pressed = 0;
        //console.log(pressed)
    }
    pressed++;
    let index = ((y - pos[1]) * pixelsx + ((x - pos[0]) % pixelsx)) * 4;

    //console.log('placing')
    if (calcData[index + 3] == 255 && (!color || (calcData[index] != color[0] || calcData[index + 1] != color[1] || calcData[index + 2] != color[2]))) {
        let buffer = new Buffer(12);
        buffer.writeInt32LE(x * 16, 0);
        buffer.writeInt32LE(y * 16, 4);
        buffer.writeUInt8(0, 8);
        buffer.writeUInt8(0, 9);
        buffer.writeUInt8(0, 10);
        buffer.writeUInt8(0, 11);
        for(let i in bots) bots[i].send(buffer);
        //console.log(buffer);
        buffer = new Buffer(11);
        buffer.writeInt32LE(x, 0);
        buffer.writeInt32LE(y, 4);
        buffer.writeUInt8(calcData[index], 8);
        buffer.writeUInt8(calcData[index + 1], 9);
        buffer.writeUInt8(calcData[index + 2], 10);
        for(let i in bots) bots[i].send(buffer);
        //console.log(buffer);
        if (color) {
            if (Date.now() - timeout > 300) {
                for (let i = 0; i < buttons.length; i++) {
                    let b = buttons[i];
                    if (x >= pos[0] + b.x && x < pos[0] + b.x + b.w && y >= pos[1] + b.y && y < pos[1] + b.y + b.h) {
                        type(buttons[i].char);
                        timeout = Date.now();
                        break;
                    }
                }
            }
        }
    }
}
