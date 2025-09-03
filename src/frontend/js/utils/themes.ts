const themes = ['light', 'dark'];

function toggleTheme() {
  let themeIndex = themes.indexOf(localStorage.getItem('theme') || '');
  themeIndex = themeIndex === -1 ? 0 : themeIndex;

  localStorage.setItem('theme', themes[(themeIndex + 1) % themes.length]);
}

function applyTheme() {
  document.documentElement.dataset.theme = localStorage.getItem('theme') || '';
}

function attachThemeToggle() {
  const darkModeToggle = document.getElementById('darkModeToggle')!;
  darkModeToggle.onclick = async () => {
    toggleTheme();
    applyTheme();
  };
}

function createThemeToggle() {
  let themeButton = document.createElement('template');
  themeButton.innerHTML = `<button id="darkModeToggle">
      <div id="darkModeIcon">
        <span class="ray"></span>
        <span class="ray"></span>
        <span class="ray"></span>
        <span class="ray"></span>
        <span class="ray"></span>
        <span class="ray"></span>
        <span class="ray"></span>
        <span class="ray"></span>
      </div>
    </button>`;
  document.body.prepend(themeButton.content.firstChild!);

  attachThemeToggle();
}

export default createThemeToggle;
