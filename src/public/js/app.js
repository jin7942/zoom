const socket = io();

const welcome = document.querySelector('#welcome');
const form = welcome.querySelector('form');
const room = document.querySelector('#room');

room.hidden = true;

let roomName;

const handleRoomSubmit = (e) => {
    e.preventDefault();
    const roomNameInput = form.querySelector('#roomName');
    const nicknameInput = form.querySelector('#nickname');

    socket.emit('enter_room', roomNameInput.value, nicknameInput.value, showRoom);
    roomName = roomNameInput.value;
    roomNameInput.value = '';
};

const handleMessageSubmit = (e) => {
    e.preventDefault();
    const input = room.querySelector('#msg input');
    const value = input.value;
    socket.emit('new_message', input.value, roomName, () => {
        addMessage(`You: ${value}`);
    });
    input.value = '';
};

const addMessage = (msg) => {
    const ul = room.querySelector('ul');
    const li = document.createElement('li');
    li.innerText = msg;
    ul.appendChild(li);
};

const showRoom = () => {
    welcome.hidden = true;
    room.hidden = false;
    const h3 = room.querySelector('h3');
    h3.innerText = `Room ${roomName}`;
    const msgForm = room.querySelector('#msg');
    msgForm.addEventListener('submit', handleMessageSubmit);
};

form.addEventListener('submit', handleRoomSubmit);

socket.on('welcome', (user) => {
    addMessage(`${user} arrived`);
});

socket.on('bye', (left) => {
    addMessage(`${left} left..`);
});

socket.on('new_message', addMessage);

socket.on('room_change', (rooms) => {
    const roomList = welcome.querySelector('ul');
    roomList.innerHTML = '';
    if (rooms.length === 0) {
        return;
    }
    rooms.forEach((room) => {
        const li = document.createElement('li');
        li.innerText = room;
        roomList.append(li);
    });
});
