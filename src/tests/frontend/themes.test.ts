import { expect, it, describe, beforeEach } from 'vitest';
import createThemeToggle from '../../frontend/js/utils/themes.ts';

describe('theme toggle button', () => {
  beforeEach(async () => {
    document.body.innerHTML = '';
    localStorage.clear();
  });

  it('creates theme toggle button', () => {
    createThemeToggle();
    let darkModeToggle = document.getElementById(
      'darkModeToggle',
    ) as HTMLButtonElement;

    expect(darkModeToggle).not.toBeNull();
  });

  describe('initially unset theme', () => {
    it('toggles theme on click', async () => {
      createThemeToggle();
      let darkModeToggle = document.getElementById(
        'darkModeToggle',
      ) as HTMLButtonElement;
      darkModeToggle.click();

      expect(localStorage.getItem('theme')).toBe('dark');
      expect(document.documentElement.dataset.theme).toBe('dark');
    });

    it('toggles theme twice on two clicks', async () => {
      createThemeToggle();
      let darkModeToggle = document.getElementById(
        'darkModeToggle',
      ) as HTMLButtonElement;
      darkModeToggle.click();
      darkModeToggle.click();

      expect(localStorage.getItem('theme')).toBe('light');
      expect(document.documentElement.dataset.theme).toBe('light');
    });

    it('toggles theme thrice on three clicks', async () => {
      createThemeToggle();
      let darkModeToggle = document.getElementById(
        'darkModeToggle',
      ) as HTMLButtonElement;
      darkModeToggle.click();
      darkModeToggle.click();
      darkModeToggle.click();

      expect(localStorage.getItem('theme')).toBe('dark');
      expect(document.documentElement.dataset.theme).toBe('dark');
    });
  });

  describe('initially light theme', () => {
    beforeEach(() => {
      localStorage.setItem('theme', 'light');
    });
    it('toggles theme on click', async () => {
      createThemeToggle();
      let darkModeToggle = document.getElementById(
        'darkModeToggle',
      ) as HTMLButtonElement;
      darkModeToggle.click();

      expect(localStorage.getItem('theme')).toBe('dark');
      expect(document.documentElement.dataset.theme).toBe('dark');
    });

    it('toggles theme twice on two clicks', async () => {
      createThemeToggle();
      let darkModeToggle = document.getElementById(
        'darkModeToggle',
      ) as HTMLButtonElement;
      darkModeToggle.click();
      darkModeToggle.click();

      expect(localStorage.getItem('theme')).toBe('light');
      expect(document.documentElement.dataset.theme).toBe('light');
    });

    it('toggles theme thrice on three clicks', async () => {
      createThemeToggle();
      let darkModeToggle = document.getElementById(
        'darkModeToggle',
      ) as HTMLButtonElement;
      darkModeToggle.click();
      darkModeToggle.click();
      darkModeToggle.click();

      expect(localStorage.getItem('theme')).toBe('dark');
      expect(document.documentElement.dataset.theme).toBe('dark');
    });
  });

  describe('initially dark theme', () => {
    beforeEach(() => {
      localStorage.setItem('theme', 'dark');
    });
    it('toggles theme on click', async () => {
      createThemeToggle();
      let darkModeToggle = document.getElementById(
        'darkModeToggle',
      ) as HTMLButtonElement;
      darkModeToggle.click();

      expect(localStorage.getItem('theme')).toBe('light');
      expect(document.documentElement.dataset.theme).toBe('light');
    });

    it('toggles theme twice on two clicks', async () => {
      createThemeToggle();
      let darkModeToggle = document.getElementById(
        'darkModeToggle',
      ) as HTMLButtonElement;
      darkModeToggle.click();
      darkModeToggle.click();

      expect(localStorage.getItem('theme')).toBe('dark');
      expect(document.documentElement.dataset.theme).toBe('dark');
    });

    it('toggles theme thrice on three clicks', async () => {
      createThemeToggle();
      let darkModeToggle = document.getElementById(
        'darkModeToggle',
      ) as HTMLButtonElement;
      darkModeToggle.click();
      darkModeToggle.click();
      darkModeToggle.click();

      expect(localStorage.getItem('theme')).toBe('light');
      expect(document.documentElement.dataset.theme).toBe('light');
    });
  });
});
