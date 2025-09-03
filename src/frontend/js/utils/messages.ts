function addMessage(
  name: string,
  msg: string,
  msgContainer: HTMLElement,
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
  msgContainer.appendChild(item);
  msgContainer.scrollTop = msgContainer.scrollHeight;
}

export default addMessage;
