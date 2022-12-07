const socket = io();

const myFace = document.getElementById('myFace');
const muteBtn = document.getElementById('mute');
const cameraBtn = document.getElementById('camera');
const camerasSelect = document.getElementById('cameras');
const call = document.getElementById('call');
const chatInput = document.getElementById('chatInput');
const sendMsg = document.getElementById('sendMsg');
const chatList = document.getElementById('chatList');

call.hidden = true;

let mystream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;
let myDataChannel;

async function getCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((device) => device.kind === 'videoinput');
        const currentCamera = myStream.getVideoTracks()[0];

        cameras.forEach((camera) => {
            const option = document.createElement('option');
            option.value = cameras.deviceId;
            option.innerText = camera.label;
            if (currentCamera.label === camera.label) {
                option.selected = true;
            }
            camerasSelect.appendChild(option);
        });
    } catch (e) {
        console.log(e);
    }
}

async function getMedia(deviceId) {
    const initialConstrains = {
        audio: true,
        video: {
            facingMode: 'user',
        },
    };
    const cameraConstraints = {
        audio: true,
        video: {
            devicedId: {
                exact: deviceId,
            },
        },
    };
    try {
        myStream = await navigator.mediaDevices.getUserMedia(deviceId ? cameraConstraints : initialConstrains);
        myFace.srcObject = myStream;
        if (!deviceId) {
            await getCameras();
        }
    } catch (e) {
        console.log(e);
    }
}

muteBtn.addEventListener('click', () => {
    myStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
    if (!muted) {
        muteBtn.innerText = 'Unmute';
        muted = true;
    } else {
        muteBtn.innerText = 'Mute';
        muted = false;
    }
});
cameraBtn.addEventListener('click', () => {
    myStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
    if (cameraOff) {
        cameraBtn.innerText = 'Turn Camera Off';
        cameraOff = false;
    } else {
        cameraBtn.innerText = 'Turn Camera On';
        cameraOff = true;
    }
});
camerasSelect.addEventListener('change', async () => {
    await getMedia(camerasSelect.value);
    if (myPeerConnection) {
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection.getSenders().find((sender) => sender.track.kind === 'video');
        videoSender.replaceTrack(videoTrack);
    }
});

// Welcome form

const welcome = document.getElementById('welcome');
const welcomeForm = welcome.querySelector('form');

const initCall = async () => {
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
};

welcomeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = welcomeForm.querySelector('input');
    await initCall();
    socket.emit('join_room', input.value);
    roomName = input.value;
    input.value = '';
});

const createMsg = () => {
    chatInput.addEventListener('keyup', (e) => {
        if (e.keyCode == 13) {
            sendMsg.click();
        }
    });
    sendMsg.addEventListener('click', () => {
        createChatList(chatInput.value);
        myDataChannel.send(chatInput.value);
        chatInput.value = '';
    });
};

const createChatList = (msg) => {
    const li = document.createElement('li');
    li.innerText = '익명의 누군가: ' + msg;
    chatList.appendChild(li);
};

// Socket Code
socket.on('welcome', async () => {
    myDataChannel = myPeerConnection.createDataChannel('chat');
    console.log('create data channel');
    myDataChannel.addEventListener('message', (e) => {
        createChatList(e.data);
    });

    createMsg();

    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    socket.emit('offer', offer, roomName);
});

// offer
socket.on('offer', async (offer) => {
    myPeerConnection.addEventListener('datachannel', (e) => {
        myDataChannel = e.channel;
        myDataChannel.addEventListener('message', (e) => {
            createChatList(e.data);
        });
    });

    createMsg();

    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    socket.emit('answer', answer, roomName);
});
// answer
socket.on('answer', (answer) => {
    console.log('receive the offer');
    myPeerConnection.setRemoteDescription(answer);
});

socket.on('ice', (ice) => {
    console.log('recive candidate');
    myPeerConnection.addIceCandidate(ice);
});

// RTC Code

const makeConnection = () => {
    myPeerConnection = new RTCPeerConnection({
        iceServers: [
            {
                urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302', 'stun:stun3.l.google.com:19302'],
            },
        ],
    });
    myPeerConnection.addEventListener('icecandidate', (data) => {
        console.log('sent candidate');
        socket.emit('ice', data.candidate, roomName);
    });
    myPeerConnection.addEventListener('addstream', (data) => {
        const peerFace = document.getElementById('peerFace');
        peerFace.srcObject = data.stream;
    });
    myStream.getTracks().forEach((track) => myPeerConnection.addTrack(track, myStream));
};
