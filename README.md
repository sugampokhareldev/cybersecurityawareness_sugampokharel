# WebRTC Camera Awareness Demo

A cybersecurity awareness demonstration showing how browser camera permissions and WebRTC can be used to stream video to a remote dashboard.

## 🚨 Educational Purpose Only
This tool is designed for educational purposes to demonstrate how easily camera access can be misused if permissions are blindly granted. **Do not use this for malicious tracking or surveillance.**

## Features
- **User Side ("Victim")**: A visually appealing "Happy New Year 2026" greeting card that requests camera access immediately upon loading.
- **Admin Side ("Attacker")**: A protected dashboard that views live streams from all active users.
- **WebRTC & Socket.IO**: Real-time peer-to-peer video streaming.

## Tech Stack
- **Frontend**: HTML5, CSS3 (Glassmorphism), Vanilla JS
- **Backend**: Node.js, Express, Socket.IO
- **Real-Time**: WebRTC

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   node server.js
   ```

4. Access the application:
   - **User View**: [http://localhost:3000](http://localhost:3000)
   - **Admin View**: [http://localhost:3000/admin](http://localhost:3000/admin) (Password: `admin2026`)

## License
MIT
