const socket = io();
let peerConnections = {};

const loginOverlay = document.getElementById('loginOverlay');
const dashboard = document.getElementById('dashboard');
const adminPasswordInput = document.getElementById('adminPassword');
const loginBtn = document.getElementById('loginBtn');
const errorMsg = document.getElementById('errorMsg');
const streamsContainer = document.getElementById('streamsContainer');

const ADMIN_TOKEN = "admin2026"; // Simple awareness demo token

// Login Logic
function checkAuth() {
    const storedToken = localStorage.getItem('admin_token');
    if (storedToken === ADMIN_TOKEN) {
        console.log("Auto-authenticating from localStorage");
        showDashboard();
    }
}

function showDashboard() {
    loginOverlay.style.display = 'none';
    dashboard.style.display = 'block';
    console.log("Showing dashboard, emitting 'watcher'");
    socket.emit('watcher'); // Announce presence as admin
}

loginBtn.addEventListener('click', () => {
    if (adminPasswordInput.value === ADMIN_TOKEN) {
        localStorage.setItem('admin_token', ADMIN_TOKEN);
        showDashboard();
    } else {
        errorMsg.style.display = 'block';
    }
});

// Check auth on load
checkAuth();

// Config for STUN servers
const config = {
    iceServers: [
        {
            urls: 'stun:stun.l.google.com:19302'
        }
    ]
};

// Listen for broadcasters
socket.on('broadcaster', () => {
    console.log("New broadcaster detected, broadcasting presence");
    // If a new broadcaster joins, re-announce watcher to trigger their connection
    socket.emit('watcher');
});

socket.on('offer', (id, description) => {
    console.log(`Received offer from ${id}`);

    // Prevent duplicates: close existing connection if any
    if (peerConnections[id]) {
        peerConnections[id].close();
    }

    const peerConnection = new RTCPeerConnection(config);
    peerConnections[id] = peerConnection;

    // Check if video element already exists
    let videoContainer = document.getElementById(`container-${id}`);
    if (videoContainer) {
        // Remove old container to ensure fresh state
        videoContainer.remove();
    }

    // Create Video Element
    videoContainer = document.createElement('div');
    videoContainer.className = 'video-card';
    videoContainer.id = `container-${id}`;

    let video = document.createElement('video');
    video.id = `video-${id}`;
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true; // IMPORTANT: Muted allows autoplay in most browsers

    let info = document.createElement('div');
    info.className = 'video-info';
    info.innerHTML = `<span>ID: ${id}</span><span style="color:red">REC</span>`;

    videoContainer.appendChild(video);
    videoContainer.appendChild(info);
    streamsContainer.appendChild(videoContainer);

    // Handle Stream
    peerConnection.ontrack = event => {
        console.log(`Received track from ${id}`);
        video.srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit('candidate', id, event.candidate);
        }
    };

    peerConnection.setRemoteDescription(description)
        .then(() => peerConnection.createAnswer())
        .then(sdp => peerConnection.setLocalDescription(sdp))
        .then(() => {
            socket.emit('answer', id, peerConnection.localDescription);
        });
});

socket.on('candidate', (id, candidate) => {
    if (peerConnections[id]) {
        peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
    }
});

socket.on('disconnectPeer', id => {
    console.log(`Peer disconnected: ${id}`);
    if (peerConnections[id]) {
        peerConnections[id].close();
        delete peerConnections[id];
        const container = document.getElementById(`container-${id}`);
        if (container) {
            container.remove();
        }
    }
});

socket.on('connect', () => {
    console.log("Connected to socket server");
});
