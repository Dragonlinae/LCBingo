// npx ts-node

import { io } from './src/server/socket'

io.of("/game").to(room).emit('update square', 2, 0, 100);