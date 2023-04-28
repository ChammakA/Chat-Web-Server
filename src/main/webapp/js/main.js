let ws;

let sprite;
let spriteSheet = new Image();
spriteSheet.src = "images/furretwalk.png";
let intervalSubtract = 0;
let freq = 0;

function getRooms() {
    let getURL = "https://localhost:8080/WSChatServer-1.0-SNAPSHOT/chat-servlet"
    fetch(getURL, {
        method: 'GET',
        headers: {
            'Accept': 'text/plain',
        },
    })
        .then(response => response.text())
    console.log(response);
}


function newRoom() {
    // calling the ChatServlet to retrieve a new room ID
    let callURL = "http://localhost:8080/WSChatServer-1.0-SNAPSHOT/chat-servlet";
    // console.log("working");
    fetch(callURL, {
        method: 'GET',
        headers: {
            'Accept': 'text/plain',
        },
    })
        .then(response => response.text())
        .then(response => addRoomToList(response)); // add room and enter with the code

}

function joinRoom() {
    const roomCode = document.getElementById("room-code").value;
    if (roomCode == "" || roomCode == null) {
        void (0);
    } else { enterRoom(roomCode); }

}
function enterRoom(code) {
    clearChat();
    // create the web socket
    console.log("Connecting to ws://localhost:8080/WSChatServer-1.0-SNAPSHOT/ws/" + code);
    ws = new WebSocket("ws://localhost:8080/WSChatServer-1.0-SNAPSHOT/ws/" + code);

    // parse messages received from the server and update the UI accordingly
    ws.onmessage = function(event) {
        console.log(event.data);

        // parsing the server's message as json
        let message = JSON.parse(event.data);
        console.log(message);

        switch (message.type) {
            case "chat":
                document.getElementById("log").innerHTML += "<p class=\"chatmsg\">" + message.message + "</p>";
                break;
            case "history":
                for (let i = 0; i < message.messages.length; i++)
                    document.getElementById("log").innerHTML += "<p class=\"chatmsg\">" + message.messages[i] + "</p>";
                break;
            case "image":
                document.getElementById("log").innerHTML += "<img class=\"chatimg\" src=\"" + message.message + "\" />";
                break;
            case "usercount":
                let userCountList = JSON.parse(message.message);
                let totalUsers = userCountList[0];
                document.getElementById("total-users").innerText = "Total Users: " + totalUsers;
                let roomUsers = userCountList[1];
                let roomCount = document.getElementById("usersInRoom");
                roomCount.innerText = "Participants: " + roomUsers;

                let usernameList = message.usernames;
                let userList = document.getElementById("userList");
                userList.innerHTML = "";
                for (let i = 0; i < usernameList.length; i++) {
                    let newUser = document.createElement("li");
                    newUser.id = usernameList[i];
                    newUser.innerHTML = usernameList[i];
                    userList.append(newUser);
                }
                break;
        }
    }

    document.getElementById("roomCode").innerHTML = code;
    document.getElementById("log").value = "[" + timestamp() + "] " + "Entered Room: " + code + "\n";
}
function addRoomToList(id) {
    let roomList = document.getElementById("roomList");
    roomList.innerHTML = "";
    let rooms = id.substr(5);
    let amountOfRooms = rooms.substr(2, 1);
    let roomLists = rooms.substr(4, rooms.length - 7);
    for (let i = 0; i < amountOfRooms; i++) {
        let nRoom = document.createElement("li");
        nRoom.id = roomLists.substr(i * 7, 5);
        nRoom.innerHTML = roomLists.substr(i * 7, 5);
        nRoom.onclick = function() {enterRoom(roomLists.substr(i * 7, 5)); };
        roomList.append(nRoom);
    }
    code = id.substr(0, 5);
    console.log('ROOM AMOUNT: ' + amountOfRooms);
    console.log('LIST: ' + roomLists);
    enterRoom(code);
}

document.getElementById("input").addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
        msgEnter()
    }
});

function msgEnter() {
    let request;
    let val = document.getElementById("input").value;
    if (val.substr(0, 5) == "https") {
        request = { "type": "image", "message": val };
    } else {
        request = { "type": "chat", "message": val };
    }
    if(freq <= 72) {
        freq += 8;
    }
    ws.send(JSON.stringify(request));
    document.getElementById("input").value = "";
}

function clearChat() {
    freq = 0;
    intervalSubtract = 0;
    document.getElementById("log").innerHTML = "";
}

function timestamp() {
    var d = new Date(), minutes = d.getMinutes();
    if (minutes < 10) minutes = '0' + minutes;
    return d.getHours() + ':' + minutes;
}

window.onload = function() {
    canvas = document.getElementById("myCanvas");
    context = canvas.getContext("2d");
    sprite = new GameObject(spriteSheet, 0, 0, 400, 47, 100, 5);
    loop();
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}
function update() {
    sprite.update();
}

function draw() {
    context.clearRect(0,0,canvas.width, canvas.height);
    sprite.draw(context);
}
function GameObject(sheet, x, y, w, h, interval, n) {
    this.sheet = spriteSheet;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.interval = interval;
    this.n = n;

    this.frameIndex = 0;

    this.lastUpdate = Date.now();

    this.update = function() {
        if(Date.now() - this.lastUpdate >= this.interval-intervalSubtract) {
            this.frameIndex++;
            if(this.frameIndex >= n) {
                this.frameIndex = 0;
            }
            this.lastUpdate = Date.now();
        }
    }

    this.draw = function(context) {
        context.drawImage(this.sheet,
            this.frameIndex*this.w/this.n,
            0,
            this.w/this.n,
            this.h,
            x,
            y,
            this.w/this.n,
            this.h);
    }
}

function messageFrequency() {
    setInterval(function() {
        if(freq > 0) {
            freq--;
        }
        if(freq == 0) {
            intervalSubtract = 0;
        } else if(freq <= 5) {
            intervalSubtract = 10;
        } else if(freq <= 10) {
            intervalSubtract = 20;
        } else if(freq <= 15) {
            intervalSubtract = 30;
        } else if(freq <= 20) {
            intervalSubtract = 40;
        } else if(freq <= 25) {
            intervalSubtract = 50;
        } else if(freq <= 30) {
            intervalSubtract = 60;
        } else if(freq <= 35) {
            intervalSubtract = 70;
        } else {
            intervalSubtract = 80;
        }
    }, 100);
}

messageFrequency();
