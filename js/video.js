/* ==========================================================
   VIDEO ENGINE
   Teacher ↔ Student Video + Screen Share
========================================================== */

let localStream = null;
let currentCall = null;

const localVideo =
    document.getElementById(
        "localVideo"
    );

const remoteVideo =
    document.getElementById(
        "remoteVideo"
    );

/* ==========================================================
   SHOW PANEL
========================================================== */

function showVideoPanel() {

    const panel =
        document.getElementById(
            "videoPanel"
        );

    if(panel){
        panel.classList.remove(
            "hidden"
        );
    }

}

function hideVideoPanel() {

    const panel =
        document.getElementById(
            "videoPanel"
        );

    if(panel){
        panel.classList.add(
            "hidden"
        );
    }

}

/* ==========================================================
   CAMERA
========================================================== */

async function startCamera() {

    try {

        localStream =
            await navigator
            .mediaDevices
            .getUserMedia({

                video: true,

                audio: true

            });

        localVideo.srcObject =
            localStream;

        showVideoPanel();

        return localStream;

    }
    catch(err) {

        console.error(err);

        alert(
            "Unable to access camera."
        );

        return null;

    }

}

/* ==========================================================
   STOP CAMERA
========================================================== */

function stopCamera() {

    if(!localStream)
        return;

    localStream
        .getTracks()
        .forEach(track => {

            track.stop();

        });

    localVideo.srcObject = null;

    localStream = null;

}

/* ==========================================================
   CALL PEER
========================================================== */

async function startVideoCall() {

    if(
        !peer ||
        !remotePeerId
    ) {

        alert(
            "Connect to a classroom first."
        );

        return;

    }

    const stream =
        await startCamera();

    if(!stream)
        return;

    currentCall =
        peer.call(
            remotePeerId,
            stream
        );

    currentCall.on(
        "stream",
        remoteStream => {

            remoteVideo.srcObject =
                remoteStream;

            showVideoPanel();

        }
    );

    currentCall.on(
        "close",
        ()=>{

            remoteVideo.srcObject =
                null;

        }
    );

}

/* ==========================================================
   ANSWER CALL
========================================================== */

function setupVideoListener() {

    if(!peer)
        return;

    peer.on(
        "call",
        async call => {

            const stream =
                await startCamera();

            if(!stream)
                return;

            currentCall = call;

            call.answer(stream);

            call.on(
                "stream",
                remoteStream => {

                    remoteVideo.srcObject =
                        remoteStream;

                    showVideoPanel();

                }
            );

            call.on(
                "close",
                ()=>{

                    remoteVideo.srcObject =
                        null;

                }
            );

        }
    );

}

/* ==========================================================
   SCREEN SHARE
========================================================== */

async function startScreenShare() {

    try {

        const screenStream =
            await navigator
            .mediaDevices
            .getDisplayMedia({

                video: true,

                audio: false

            });

        const screenTrack =
            screenStream
            .getVideoTracks()[0];

        localVideo.srcObject =
            screenStream;

        if(
            currentCall &&
            currentCall.peerConnection
        ) {

            const sender =
                currentCall
                .peerConnection
                .getSenders()
                .find(
                    s =>
                    s.track &&
                    s.track.kind ===
                    "video"
                );

            if(sender){

                sender.replaceTrack(
                    screenTrack
                );

            }

        }

        screenTrack.onended =
            async ()=>{

                const cam =
                    await navigator
                    .mediaDevices
                    .getUserMedia({

                        video:true,
                        audio:true

                    });

                localStream = cam;

                localVideo.srcObject =
                    cam;

                const camTrack =
                    cam.getVideoTracks()[0];

                if(
                    currentCall &&
                    currentCall.peerConnection
                ) {

                    const sender =
                        currentCall
                        .peerConnection
                        .getSenders()
                        .find(
                            s =>
                            s.track &&
                            s.track.kind ===
                            "video"
                        );

                    if(sender){

                        sender.replaceTrack(
                            camTrack
                        );

                    }

                }

            };

    }
    catch(err){

        console.error(err);

    }

}

/* ==========================================================
   END CALL
========================================================== */

function endVideoCall() {

    try {

        if(currentCall){

            currentCall.close();

            currentCall = null;

        }

        stopCamera();

        remoteVideo.srcObject =
            null;

        hideVideoPanel();

    }
    catch(err){

        console.error(err);

    }

}

/* ==========================================================
   MUTE AUDIO
========================================================== */

function toggleMute() {

    if(!localStream)
        return;

    localStream
        .getAudioTracks()
        .forEach(track => {

            track.enabled =
                !track.enabled;

        });

}

/* ==========================================================
   CAMERA ON/OFF
========================================================== */

function toggleCamera() {

    if(!localStream)
        return;

    localStream
        .getVideoTracks()
        .forEach(track => {

            track.enabled =
                !track.enabled;

        });

}

/* ==========================================================
   MOBILE BUTTONS
========================================================== */

function attachMobileVideoButtons(){

    document
    .getElementById(
        "mobileVideo"
    )
    ?.addEventListener(
        "click",
        startVideoCall
    );

}

/* ==========================================================
   INIT
========================================================== */

function initVideo(){

    attachMobileVideoButtons();

}

/* ==========================================================
   EVENTS
========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    ()=>{

        initVideo();

        document
        .getElementById(
            "videoBtn"
        )
        ?.addEventListener(
            "click",
            startVideoCall
        );

    }
); 
