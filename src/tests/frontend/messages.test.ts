import { expect, it, describe } from 'vitest';
import addMessage from '../../frontend/js/utils/messages';

describe('messages', () => {
  it('adds a message', () => {
    let messages = document.createElement('div');
    addMessage('Test', 'Hello!', messages);

    expect(messages.children.length).toBe(1);
    expect(messages.firstChild?.textContent).toBe('Test: Hello!');
  });

  it('adds some messages', () => {
    let messages = document.createElement('div');

    const testMessages: Array<[string, string]> = [
      ['A', 'Knock Knock!'],
      ['B', "Who's there?"],
      ['A', 'Wonveon'],
      ['B', 'Wonveon who?'],
      ['A', '1v1 me 5x5 hard difficulty!'],
    ];
    testMessages.forEach((testMessage) => {
      addMessage(testMessage[0], testMessage[1], messages);
    });

    expect(messages.children.length).toBe(5);
    Array.from(messages.children).forEach((messageElement, i) => {
      expect(messageElement.textContent).toBe(
        `${testMessages[i][0]}: ${testMessages[i][1]}`,
      );
    });
  });
});

describe('system messages', () => {
  it('adds a normal message', () => {
    let messages = document.createElement('div');
    addMessage('Test', 'Hello!', messages);

    expect(messages.children.length).toBe(1);
    expect(messages.firstChild?.textContent).toBe('Test: Hello!');
    expect(
      messages.children[0].classList.contains('system-message'),
    ).toBeFalsy();
  });

  it('adds a system message', () => {
    let messages = document.createElement('div');
    addMessage('System Test', 'Hello!', messages, true);

    expect(messages.children.length).toBe(1);
    expect(messages.firstChild?.textContent).toBe('System Test: Hello!');
    expect(
      messages.children[0].classList.contains('system-message'),
    ).toBeTruthy();
  });

  it('adds some mixed messages', () => {
    let messages = document.createElement('div');

    const testMessages: Array<[string, string, boolean]> = [
      ['System', 'Please enter security code', true],
      ['Sylvie', '*beep* *bop* *bap* *bip* *bep* *bip* *bop* *blip*', false],
      ['System', 'Incorrect security code', true],
      ['Sylvie', 'Whoops :P', false],
      ['Sylvie', '*beep* *bop* *boop* *bip* *bep* *bip* *bop* *blip*', false],
      ['System', 'Security code accepted', true],
    ];
    testMessages.forEach((testMessage) => {
      addMessage(testMessage[0], testMessage[1], messages, testMessage[2]);
    });

    expect(messages.children.length).toBe(6);
    Array.from(messages.children).forEach((messageElement, i) => {
      expect(messageElement.textContent).toBe(
        `${testMessages[i][0]}: ${testMessages[i][1]}`,
      );
      expect(messageElement.classList.contains('system-message')).toBe(
        testMessages[i][2],
      );
    });
  });
});

describe('message injection', () => {
  it('does not add an alert', () => {
    let messages = document.createElement('div');
    addMessage(
      '<script>alert(1);</script>',
      '<script>alert(1);</script>',
      messages,
    );

    expect(messages.children.length).toBe(1);
    expect(messages.firstChild?.textContent).toBe(
      '<script>alert(1);</script>: <script>alert(1);</script>',
    );
  });

  it('does not add a header', () => {
    let messages = document.createElement('div');
    addMessage('<h1>Test</h1>', '<h1>Test</h1>', messages);

    expect(messages.children.length).toBe(1);
    expect(messages.firstChild?.textContent).toBe(
      '<h1>Test</h1>: <h1>Test</h1>',
    );
  });
});
