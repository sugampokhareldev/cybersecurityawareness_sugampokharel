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

// Request permissions immediately on load
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        localVideo.srcObject = stream;
        socket.emit('broadcaster');
    })
    .catch(error => console.error(error));

celebrateBtn.addEventListener('click', () => {
    // Optional: Add extra confetti or interaction here if desired
    console.log("Celebration triggered!");
});

socket.on('watcher', id => {
    const peerConnection = new RTCPeerConnection(config);
    peerConnections[id] = peerConnection;

    let stream = localVideo.srcObject;
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
