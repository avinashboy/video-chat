const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
  debug: true
});

let connectUser = []
const port = process.env.PORT || 3333
const { v4: uuidV4 } = require('uuid')

app.use('/peerjs', peerServer);
app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
})

io.on('connection', (socket) => {
  socket.on('join-room', (roomId, userId, cName) => {
    console.log('userId:', userId)
    console.log('roomId:', roomId)
    socket.join(roomId)
    logInfo(cName, 'add')
    socket.to(roomId).broadcast.emit("user-connected", userId, connectUser)
    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('user-disconnected', userId)
    })
  })

  socket.on('checkUserIsJoin', (roomId) => {
    console.log('roomId fff:', roomId)
    console.log('connectUser fff:', connectUser)
    socket.emit('checkUserIsJoin', connectUser)
  })

  socket.on('user-disconnected', (userId, roomId, cName) => {
    logInfo(cName, 'sub')
    socket.to(roomId).broadcast.emit('user-disconnected', userId, connectUser)
    console.log('connectUser:', connectUser)
  })
})


async function logInfo(name, method) {
  if (method === 'add') {
    return await connectUser.push(name)
  }

  if (method === 'sub') {
    const index = connectUser.indexOf(name);
    if (index > -1) await connectUser.splice(index, 1)
  }
}

server.listen(port, () => { console.log("server is running", port) })