const term = new Terminal();
term.open(document.getElementById('terminal'));

const socket = new WebSocket('wss://lavish-vitality-production.up.railway.app');

let inputBuffer = '';

term.onData(data => {
  // If user pressed Enter
  if (data === '\r') {
    socket.send(inputBuffer);
    term.writeln(''); // move to next line
    inputBuffer = '';
  } else if (data === '\u007F') {
    // Handle Backspace
    if (inputBuffer.length > 0) {
      inputBuffer = inputBuffer.slice(0, -1);
      term.write('\b \b'); // visually remove character
    }
  } else {
    inputBuffer += data;
    term.write(data); // Local echo
  }
});

socket.onmessage = function (event) {
  term.writeln(event.data); // Display server messages
};
