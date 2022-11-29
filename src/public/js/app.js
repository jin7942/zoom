const socket = io();

const myFace = document.getElementById('myFace');
const muteBtn = document.getElementById('mute');
const cameraBtn = document.getElementById('camera');
const camerasSelect = document.getElementById('cameras');
const call = document.getElementById('call');

call.hidden = true;

let mystream;
let muted = false;
let cameraOff = false;
let roomName;

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
});

// Welcome form

const welcome = document.getElementById('welcome');
const welcomeForm = welcome.querySelector('form');

const startMedia = () => {
    welcome.hidden = true;
    call.hidden = false;
    getMedia();
};

welcomeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = welcomeForm.querySelector('input');
    socket.emit('join_room', input.value, startMedia);
    roomName = input.value;
    input.value = '';
});

// Socket Code

socket.on('welcome', () => {
    console.log('someone joined');
});
