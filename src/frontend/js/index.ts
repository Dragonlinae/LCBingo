import type { Socket } from 'socket.io-client';

declare var io: (url: string | undefined) => Socket;

const socket: Socket = io('/');
const chatForm = document.getElementById('chat')!;
const chatInput = document.getElementById('chatInput')! as HTMLInputElement;
const username = document.getElementById('username')! as HTMLInputElement;
const messages = document.getElementById('messages')!;
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (chatInput.value) {
    if (username.textContent) {
      socket.emit('chat message', chatInput.value, username.textContent);
      chatInput.value = '';
    } else {
      addMessage('SYSTEM', 'Please set username first', true);
    }
  }
});

const profileSetting = document.getElementById('profileSetting')!;
const usernameInput = document.getElementById(
  'chatUsername',
)! as HTMLInputElement;
profileSetting.addEventListener('submit', (e) => {
  e.preventDefault();
  if (usernameInput.value) {
    username.textContent = usernameInput.value;
  }
});

const gameSetting = document.getElementById('gameSetting')!;
const p1Name = document.getElementById('p1Name')! as HTMLInputElement;
const p2Name = document.getElementById('p2Name')! as HTMLInputElement;
const boardSize = document.getElementById('sizeOption') as HTMLInputElement;
const freeOnly = document.getElementById('freeOption') as HTMLInputElement;
const category = document.getElementById('categoryOption') as HTMLInputElement;
const difficulty = document
  .getElementById('difficulty')!
  .getElementsByTagName('input');
const winCondition = document.getElementById(
  'winCondOption',
) as HTMLInputElement;
const announceOption = document.getElementById(
  'announceOption',
) as HTMLInputElement;
const submitButton = document.getElementById(
  'gameSettingSubmit',
) as HTMLButtonElement;
gameSetting.addEventListener('submit', (e) => {
  e.preventDefault();

  const difficulties = Array.from(difficulty)
    .filter((el) => el.checked)
    .map((el) => el.value);

  console.log(difficulties);
  if (difficulties.length == 0) {
    addMessage('SYSTEM', 'Must select a difficulty', true);
    return;
  }

  if (!(p1Name.value && p2Name.value)) {
    addMessage('SYSTEM', 'Missing Leetcode username of players', true);
    return;
  }

  submitButton.disabled = true;
  socket.emit(
    'create game',
    p1Name.value,
    p2Name.value,
    boardSize.value,
    freeOnly.checked,
    category.value,
    difficulties,
    winCondition.value,
    announceOption.checked,
  );
});

function addMessage(
  name: string,
  msg: string,
  isSystem: boolean = false,
  hyperlink: string | null = null,
) {
  const item = document.createElement('li');
  if (isSystem) {
    item.classList.add('system-message');
  }
  item.textContent = name + ': ' + msg;
  if (hyperlink) {
    item.onclick = () => {
      window.location.href = hyperlink;
    };
    item.style.cursor = 'pointer';
    item.style.textDecoration = 'underline';
  }
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
}

socket.on('chat message', (msg, name) => {
  addMessage(name, msg);
});

socket.on('system message', (msg) => {
  addMessage('SYSTEM', msg, true);
});

socket.on('game announce', (p1Name, p2Name, roomId) => {
  addMessage(
    'GAME ANNOUNCEMENT',
    `${p1Name} vs ${p2Name}. Click to join!`,
    true,
    `/game?roomId=${roomId}`,
  );
});

socket.on('nav', (targetURL) => {
  window.location.href = targetURL;
});
