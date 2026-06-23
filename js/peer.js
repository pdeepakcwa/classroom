/* ==========================================================
   PEERJS ENGINE
   Teacher <-> Student
   Whiteboard Sync
   Notebook Sync
   Hand Raise
========================================================== */

let peer = null;
let connection = null;

let isTeacher = false;

let peerId = null;
let remotePeerId = null;

/* ==========================================================
   UI HELPERS
========================================================== */

function setStatus(text) {

    const el =
        document.getElementById(
            "connectionStatus"
        );

    if(el){
        el.textContent = text;
    }

}

function setRoomId(text){

    const el =
        document.getElementById(
            "roomId"
        );

    if(el){
        el.textContent = text;
    }

}

function setMode(text){

    const el =
        document.getElementById(
            "modeBadge"
        );

    if(el){
        el.textContent = text;
    }

}

/* ==========================================================
   HOST CLASSROOM
========================================================== */

function hostClassroom() {

    isTeacher = true;

    setMode("Teacher");

    peer = new Peer(
        "class-" +
        Math.random()
            .toString(36)
            .substring(2,8)
    );
    setupVideoListener();
    peer.on(
        "open",
        (id)=>{

            peerId = id;

            setRoomId(id);

            setStatus(
                "Waiting Student..."
            );

            console.log(
                "Teacher Room:",
                id
            );

        }
    );

    peer.on(
        "connection",
        (conn)=>{

            connection = conn;

            remotePeerId =
                conn.peer;

            setupConnection();

            setStatus(
                "Student Connected"
            );

            sendFullNotebook();

        }
    );

}

/* ==========================================================
   JOIN CLASSROOM
========================================================== */

function joinClassroom(roomId){

    if(!roomId){
        alert(
            "Enter Room ID"
        );
        return;
    }

    isTeacher = false;

    setMode("Student");

    peer = new Peer();
    setupVideoListener();
    peer.on(
        "open",
        (id)=>{

            peerId = id;

            connection =
                peer.connect(roomId);

            connection.on(
                "open",
                ()=>{

                    remotePeerId =
                        roomId;

                    setupConnection();

                    setStatus(
                        "Connected"
                    );

                }
            );

        }
    );

}

/* ==========================================================
   CONNECTION SETUP
========================================================== */

function setupConnection(){

    if(!connection)
        return;

    connection.on(
        "data",
        handleIncomingData
    );

    connection.on(
        "close",
        ()=>{

            setStatus(
                "Disconnected"
            );

            console.log(
                "Connection Closed"
            );

        }
    );

    connection.on(
        "error",
        (err)=>{

            console.error(err);

            setStatus(
                "Error"
            );

        }
    );

}

/* ==========================================================
   SEND
========================================================== */

function sendWhiteboardData(
    payload
){

    if(
        !connection ||
        !connection.open
    ){
        return;
    }

    connection.send(payload);

}

/* ==========================================================
   RECEIVE
========================================================== */

function handleIncomingData(
    payload
){

    if(!payload)
        return;

    console.log(
        "RX:",
        payload.type
    );

    switch(payload.type){

        case "canvas-sync":

            if(
                typeof loadRemoteCanvas
                === "function"
            ){

                loadRemoteCanvas(
                    payload.canvas
                );

            }

        break;
        case "pdf-page":

    if(
        typeof receivePdfPage
        === "function"
    ){

        receivePdfPage(
            payload.page
        );

    }

break;
        case "page-sync":

            if(
                typeof receiveNotebookPage
                === "function"
            ){

                receiveNotebookPage(
                    payload
                );

            }

        break;

        case "full-notebook":

            if(
                typeof importNotebook
                === "function"
            ){

                importNotebook(
                    payload.data
                );

            }

        break;

        case "hand-raise":

            showHandRaisePopup();

        break;

        case "student-message":

            alert(
                payload.message
            );

        break;

    }

}

/* ==========================================================
   SEND NOTEBOOK
========================================================== */

function sendFullNotebook(){

    if(
        !connection ||
        !connection.open
    ){
        return;
    }

    if(
        typeof exportNotebook
        !== "function"
    ){
        return;
    }

    connection.send({

        type:
        "full-notebook",

        data:
        exportNotebook()

    });

}

/* ==========================================================
   HAND RAISE
========================================================== */

function raiseHand(){

    if(
        !connection ||
        !connection.open
    ){
        return;
    }

    connection.send({

        type:
        "hand-raise",

        timestamp:
        Date.now()

    });

}

/* ==========================================================
   POPUP
========================================================== */

function showHandRaisePopup(){

    const popup =
        document.getElementById(
            "handPopup"
        );

    if(!popup)
        return;

    popup.classList.remove(
        "hidden"
    );

    setTimeout(
        ()=>{

            popup.classList.add(
                "hidden"
            );

        },
        4000
    );

}

/* ==========================================================
   REQUEST CURRENT STATE
========================================================== */

function requestNotebookSync(){

    if(
        !connection ||
        !connection.open
    ){
        return;
    }

    connection.send({

        type:
        "request-sync"

    });

}

/* ==========================================================
   AUTO REPLY TO SYNC
========================================================== */

function attachTeacherSyncHandler(){

    if(
        !connection
    ) return;

    connection.on(
        "data",
        (payload)=>{

            if(
                payload.type ===
                "request-sync"
            ){

                sendFullNotebook();

            }

        }
    );

}

/* ==========================================================
   DISCONNECT
========================================================== */

function disconnectPeer(){

    try{

        if(connection){

            connection.close();

        }

        if(peer){

            peer.destroy();

        }

        setStatus(
            "Disconnected"
        );

    }
    catch(err){

        console.error(err);

    }

}

/* ==========================================================
   EVENTS
========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    ()=>{

        document
        .getElementById(
            "hostRoomBtn"
        )
        ?.addEventListener(
            "click",
            ()=>{

                hostClassroom();

                document
                .getElementById(
                    "connectModal"
                )
                ?.classList.add(
                    "hidden"
                );

            }
        );

        document
        .getElementById(
            "joinRoomBtn"
        )
        ?.addEventListener(
            "click",
            ()=>{

                const roomId =
                    document
                    .getElementById(
                        "joinRoomInput"
                    )
                    .value
                    .trim();

                joinClassroom(
                    roomId
                );

                document
                .getElementById(
                    "connectModal"
                )
                ?.classList.add(
                    "hidden"
                );

            }
        );

        document
        .getElementById(
            "raiseHandBtn"
        )
        ?.addEventListener(
            "click",
            raiseHand
        );

    }
); 
