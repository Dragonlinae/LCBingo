const darkModeToggle = document.getElementById('darkModeToggle')!;
darkModeToggle.onclick = async () => {
  let isDark = localStorage.getItem('theme') === 'dark';
  if (isDark) {
    localStorage.setItem('theme', 'light');
  } else {
    localStorage.setItem('theme', 'dark');
  }
  applyTheme();
};
function applyTheme() {
  let isDark = localStorage.getItem('theme') === 'dark';
  if (isDark) {
    document.documentElement.dataset.theme = 'dark';
  } else {
    document.documentElement.dataset.theme = 'light';
  }
}
applyTheme(); // Initial theme set
