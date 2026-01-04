const socket = io();
const localVideo = document.getElementById('localVideo');
const celebrateBtn = document.getElementById('celebrateBtn');
let peerConnections = {};

// Config for STUN servers
const config = {
    iceServers: [
        {
            urls: 'stun:stun.l.google.com:19302'
        }
    ]
};

// Request permissions - Simplified to VIDEO ONLY first to avoid audio conflicts
// Audio is often the cause of "AbortError" if another app (Discord/Teams) is using the mic.
const startCamera = () => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
            console.log("Camera access granted");
            localVideo.srcObject = stream;
            // IMPORTANT: Mute local video to prevent feedback/echo
            localVideo.muted = true;
            socket.emit('broadcaster');
        })
        .catch(error => {
            console.error("Camera error:", error);
            if (error.name === 'NotAllowedError') {
                alert("Camera access was denied. Please check your browser address bar permissions.");
            } else if (error.name === 'NotFoundError') {
                alert("No camera found.");
            } else if (error.name === 'NotReadableError' || error.name === 'AbortError') {
                alert("Hardware Error: Camera/Mic is in use. \n1. Close Discord/Teams/Zoom.\n2. Click 'Celebrate' to try again.");
            } else {
                alert("Error: " + error.name);
            }
        });
};

// Start immediately
startCamera();

celebrateBtn.addEventListener('click', () => {
    console.log("Retry triggered by user");
    startCamera();
});

socket.on('watcher', id => {
    const peerConnection = new RTCPeerConnection(config);
    peerConnections[id] = peerConnection;

    let stream = localVideo.srcObject;
    if (!stream) {
        console.warn("Stream not ready yet. Ignoring watcher request.");
        return;
    }
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit('candidate', id, event.candidate);
        }
    };

    peerConnection.createOffer()
        .then(sdp => peerConnection.setLocalDescription(sdp))
        .then(() => {
            socket.emit('offer', id, peerConnection.localDescription);
        });
});

socket.on('answer', (id, description) => {
    peerConnections[id].setRemoteDescription(description);
});

socket.on('candidate', (id, candidate) => {
    peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on('disconnectPeer', id => {
    if (peerConnections[id]) {
        peerConnections[id].close();
        delete peerConnections[id];
    }
});

window.onunload = window.onbeforeunload = () => {
    socket.close();
};
