const auth = require('./auth');
const express = require("express");
const app = express();
const socket = require('socket.io')

app.use('/', auth)
console.log('Listening on 8888');

// Creates the server on port 8888
const server = app.listen(8888);

// Creates the socket on that server
var io = socket(server);

// Holds the state of the app
// on the back end
let state = {
  paused: false,
  next: [],
  previous: [],
}

// Tells the clients to toggle playback
let togglePlayback = (data) => {
  io.emit('togglePlayback', data)
}

// Finds the next song and adds the 
// current song to the previous array
let next = (currentSong) => {
  if (state.next.length !== 0) {
    state.previous.unshift(currentSong);
    io.emit('next', state.next[0]);
    state.next.splice(0,1);
    modifyQueue(state.next);
  }
}

// Finds the song previous to the 
// current song and then adds the
// current song the the next array
let previous = (currentSong) => {
  if (state.previous.length !== 0) {
    state.next.unshift(currentSong);
    io.emit('previous', state.previous[0]);
    state.previous.splice(0,1);
    modifyQueue(state.next);
  }
}

// Passes in the new queue and tells
// the client to update the queue
let modifyQueue = (queue) => {
  io.emit('modifyQueue', queue)
}

// Creates the socket when a 
// new connection is made
io.on('connection', (socket) => {
  console.log("MADE A CONNECTION")

  // Called when the user toggles playback
  socket.on('togglePlayback', (data) => {
    state.paused = !data;
    togglePlayback(state.paused);
  })

  // Called when the user requests the next song
  socket.on('next', (currentSong) => {
    next(currentSong);
  })

  // Called when the user requests the previous song
  socket.on('previous', (currentSong) => {
    previous(currentSong);
  })

  // Called when the user wants to add a song to the queue
  socket.on('addToQueue', (song) => {
    state.next.push(song);
    modifyQueue(state.next);
  })

  // Called when the user wants to remove a song from the queue
  socket.on('removeFromQueue', (removedSong) => {
    for(let song of state.next) {
      if (song.uri === removedSong.uri) {
        state.next.splice(state.next.indexOf(song), 1);
      }
    }
    modifyQueue(state.next);
  })
})

