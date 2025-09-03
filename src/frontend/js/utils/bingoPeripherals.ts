import type { Board } from '../../interfaces/bingotypes.js';

function alertWin(winner: number) {
  if (winner >= 0) {
    if (document.hasFocus()) {
      animateWin(winner);
    } else {
      window.addEventListener(
        'focus',
        () => {
          animateWin(winner);
        },
        { once: true },
      );
    }
  } else if (winner === -2) {
    animateDraw();
  }
  const refreshButton = document.getElementById(
    'refreshBoard',
  )! as HTMLButtonElement;
  refreshButton.disabled = true;
}

const crownImage = document.getElementById('crown') as HTMLImageElement;
function animateWin(winner: number, jsConfetti: any = null) {
  if (jsConfetti) {
    jsConfetti.addConfetti({
      confettiRadius: 10,
      confettiNumber: 500,
    });
  }
  let targetPlayerImage = document.getElementById(
    `p${winner + 1}Avatar`,
  ) as HTMLImageElement;
  targetPlayerImage.classList.add('winner');
  targetPlayerImage.before(crownImage);
  crownImage.style.left = -crownImage.width / 4 + 'px';
  crownImage.style.top = -crownImage.height / 4 + 'px';
  crownImage.style.opacity = '1';
  crownImage.style.scale = '1';
}

const drawImage = document.getElementById('draw') as HTMLImageElement;
function animateDraw() {
  drawImage.style.opacity = '1';
  drawImage.style.scale = '1';
}

const overlayLeft = document.getElementById('overlay-left')!;
const overlayRight = document.getElementById('overlay-right')!;
function introBlock() {
  overlayLeft.hidden = false;
  overlayRight.hidden = false;
  overlayLeft.style.animation = 'overlay-left-anim-in 0.5s ease-out forwards';
  overlayRight.style.animation = 'overlay-right-anim-in 0.5s ease-out forwards';
}
function introReveal() {
  overlayLeft.style.animation = 'overlay-left-anim-out 0.5s ease-out forwards';
  overlayRight.style.animation =
    'overlay-right-anim-out 0.5s ease-out forwards';
}

const infoTime = document.getElementById('infoTime')!;
function updateTimer(board: Board | null, timerTimer: NodeJS.Timeout) {
  if (!board) {
    return;
  }
  if (board.isBoardCompleted) {
    const diff = board.endTime.getTime() - board.startTime.getTime();
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const displayHours = String(hours).padStart(2, '0');
    const displayMinutes = String(minutes).padStart(2, '0');
    const displaySeconds = String(seconds).padStart(2, '0');

    infoTime.textContent =
      'Time: ' + displayHours + ':' + displayMinutes + ':' + displaySeconds;
    timerTimer.close();
  }
  const now = new Date();
  const diff = now.getTime() - board.startTime.getTime();

  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const displayHours = String(hours).padStart(2, '0');
  const displayMinutes = String(minutes).padStart(2, '0');
  const displaySeconds = String(seconds).padStart(2, '0');

  infoTime.textContent =
    'Time: ' + displayHours + ':' + displayMinutes + ':' + displaySeconds;
}

export { alertWin, introBlock, introReveal, updateTimer };
