import { io } from './server/server.js';
import * as repl from "repl";
import * as app from './app';

console.log(app);

const replServer = repl.start({
  prompt: "SocketIO> ",
});

replServer.context.io = io;
console.log("You can now interact with the server from the REPL...");