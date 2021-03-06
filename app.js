// start with node app.js

const feathers = require('@feathersjs/feathers');
const socketio = require('@feathersjs/socketio');
const mqtt = require('mqtt');
const config = require('../Config13318/config.json');

// A messages service that allows to create new
// and return all existing messages
class MessageService {
  constructor() {
    this.messages = [];
  }

  async find() {
    // Just return all our messages
    return this.messages;
  }

  async create(data) {
    // The new message is the data merged with a unique identifier
    // using the messages length since it changes whenever we add one
    const message = {
      id: this.messages.length,
      text: data.text,
    };

    // Add new message to the list
    this.messages.push(message);

    return message;
  }
}

// Initialize a Feathers app
const app = feathers();
// Configure Socket.io real-time APIs
app.configure(socketio());
// Register an in-memory messages service
app.use('/messages', new MessageService());
// Register a nicer error handler than the default Express one
//app.use(express.errorHandler());

// Add any new real-time connection to the `everybody` channel
app.on('connection', connection => app.channel('everybody').join(connection));
// Publish all events to the `everybody` channel
app.publish(data => app.channel('everybody'));

// Start the server
app
  .listen(config.KepSock13318Port)
  .on('listening', () =>
    console.log(`KepSock13318 server listening on ${config.KepSock13318Port}`),
  );

// For good measure let's create a message
// So our API doesn't look so empty
app.service('messages').create({
  text: 'Hello world from the server',
});

let mqttClient = mqtt.connect(config.MQTT);

mqttClient.on('connect', function() {
  mqttClient.subscribe('Kep13318', function(err) {
    if (!err) {
      console.log('KepSock13318 subscribed to: Kep13318');
    }
  });
});
// message is a buffer
mqttClient.on('message', function(topic, message) {
  const p = JSON.parse(message.toString()); // payload is a buffer
  let msg = `${p.TransDate}, Work Center: ${p.WorkCenter},${p.NodeId},${p.Cycle_Counter_Shift_SL}`;
  console.log(msg);
  app.service('messages').create({
    text: msg,
  });
});
