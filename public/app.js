const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const peers = {}
const myPeer = new Peer(undefined, {
  config: {
    iceServers: [
      {
        url: "turn:stun.wblare.com:3478",
        username: "mike",
        credential: "mike7777777",
      },
    ],
  },
  host: "/",
  port: "443",
  secure: true,
});)

const cName = makeid(5)
console.log('cName:', cName)
// const myPeer = new Peer()
const myVideo = document.createElement('video')
myVideo.muted = true
let currentStream, peerId, listIsNull = true;
let videoStreamButton = audioStreamButton = closeStreamButton = null;
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  addVideoStream(myVideo, stream, "own")
  currentStream = stream
  myPeer.on('call', call => {
    call.answer(stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream, "stream")
    })
  })

  socket.on('user-connected', (userId, cName) => {
    checkArrayLen(cName)
    console.log('userId:', userId)
    // user is joining
    setTimeout(() => {
      // user joined
      connectToNewUser(userId, stream)
    }, 3000)
  })
},
  err => console.log(err))

socket.on('user-disconnected', (userId, cName) => {
  checkArrayLen(cName)
  console.log('userId close:', userId)
  if (peers[userId]) peers[userId].close(), console.log("working on closeing")
})

socket.on('checkUserIsJoin', cName => {
  console.log('cName:', cName)
  checkArrayLen(cName)
})

myPeer.on('open', id => {
  console.log('id:', id)
  peerId = id
  console.log('ROOM_ID:', ROOM_ID)
  socket.emit('join-room', ROOM_ID, id, cName)

})

function connectToNewUser(userId, stream) {
  console.log('userId connected id:', userId)
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream, "stream")
  })
  call.on('close', () => {
    video.remove()
  })
  console.log('call coonnected:', call)
  peers[userId] = call
}

function addVideoStream(video, stream, data) {
  console.log('data:', data)
  if (data === 'own') {
    console.log("data own")
    let button_grp = document.createElement('div')
    button_grp.setAttribute('class', 'buttons_grp')
    button_grp.innerHTML = `
    <div class="btn-group" role="group" aria-label="Basic example">
      <button type="button" class="btn btn-primary" id="mutedButton"><i class="fas fa-microphone"></i></button>
      <button type="button" class="btn btn-primary" id="videoButton"><i class="fas fa-video"></i></button>
      <button type="button" class="btn btn-primary" id="closeButton"><i class="fas fa-times"></i></button>
    </div>
    `
    $('#muteVideoButton').append(button_grp)
    audioStreamButton = document.getElementById('mutedButton')
    videoStreamButton = document.getElementById('videoButton')
    closeStreamButton = document.getElementById('closeButton')
    bsaicAll()
  }
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  // video.onplaying = function () {
  //   alert("The video is now playing");
  // }
  videoGrid.append(video)



}

setInterval(() => {
  document.getElementById('demo').innerHTML = $('video').length
  if (listIsNull) checkUserList()
}, 2000)


function bsaicAll() {
  if (videoStreamButton !== null) videoStreamButton.addEventListener('click', playStop), console.log("okay")

  if (audioStreamButton !== null) audioStreamButton.addEventListener('click', muteUnmute)

  if (closeStreamButton !== null) closeStreamButton.addEventListener('click', () => { stopMediaTracks(currentStream) })
}

function stopMediaTracks(stream) {
  stream.getTracks().forEach(track => {
    track.stop();
  });
  $('#videoWindows').empty()
  socket.emit("user-disconnected", peerId, ROOM_ID, cName)
}

function muteUnmute() {
  const enabled = currentStream.getAudioTracks()[0].enabled;
  if (enabled) return currentStream.getAudioTracks()[0].enabled = false, setUnmuteButton();
  setMuteButton(), currentStream.getAudioTracks()[0].enabled = true;
}

function playStop() {
  let enabled = currentStream.getVideoTracks()[0].enabled;
  if (enabled) return currentStream.getVideoTracks()[0].enabled = false, setPlayVideo();
  setStopVideo(), currentStream.getVideoTracks()[0].enabled = true;
}

const setMuteButton = () => {
  return document.getElementById('mutedButton').innerHTML = `<i class="fas fa-microphone"></i>`;
}

const setUnmuteButton = () => {
  return document.getElementById('mutedButton').innerHTML = `<i class="unmute fas fa-microphone-slash"></i>`;
}

const setStopVideo = () => {
  return document.getElementById('videoButton').innerHTML = `<i class="fas fa-video"></i>`;
}

const setPlayVideo = () => {
  return document.getElementById('videoButton').innerHTML = `<i class="stop fas fa-video-slash"></i>`;
}

function makeid(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function checkArrayLen(connectUser) {
  console.log('connectUser:', connectUser)
  try {
    let listUser = ''
    connectUser.forEach(element => {
      listUser += `&nbsp;${element}&nbsp;`
    });
    document.getElementById('userList').innerHTML = "In call : " + listUser
  } catch (error) {
    console.warn(error)
  }
}

function checkUserList() {
  let userList = $('#userList').text()
  console.log('userList:', userList)
  if (!userList) {
    console.log("hjhgklfj")
    socket.emit("checkUserIsJoin", ROOM_ID)
    listIsNull = false
  }
}

// function addVideoStream(video, stream, data) {
//   let div = document.createElement('div')
//   console.log('data:', data)
//   video.srcObject = stream
//   video.addEventListener('loadedmetadata', () => {
//     video.play()
//   })
//   div.append(video)
//   if (data === 'own') {
//     let button_grp = document.createElement('div')
//     button_grp.setAttribute('class', 'buttons_grp')
//     button_grp.innerHTML = `
//     <div class="btn-group" role="group" aria-label="Basic example">
//       <button type="button" class="btn btn-primary" id="mutedButton"><i class="fas fa-microphone"></i></button>
//       <button type="button" class="btn btn-primary" id="videoButton"><i class="fas fa-video"></i></button>
//       <button type="button" class="btn btn-primary" id="closeButton"><i class="fas fa-times"></i></button>
//     </div>
//     `
//     div.append(button_grp)
//     videoGrid.append(div)
//     audioStreamButton = document.getElementById('mutedButton')
//     console.log('audioStreamButton:', audioStreamButton)
//     videoStreamButton = document.getElementById('videoButton')
//     console.log('videoStreamButton:', videoStreamButton)
//     closeStreamButton = document.getElementById('closeButton')
//     bsaicAll()
//   }
//   console.log($(div).html())
//   var isEmpty = $(div).html() === ""
//   console.log('isEmpty:', isEmpty)
//   if (!isEmpty) videoGrid.append(div), console.log(videoGrid)

// }
