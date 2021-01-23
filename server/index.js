const express = require('express');
const mongoose = require('mongoose');
const Pusher = require("pusher");
const Message = require('../DBMessage');

const app = express();
const port = process.env.port || 5000;

const pusher = new Pusher({
  appId: "1103692",
  key: "3250be1b1b89a09ad65a",
  secret: "649922af9bc8c6636714",
  cluster: "ap2",
  useTLS: true
});

const moongoseCred = `mongodb+srv://admin:UCsvJkKJZL6sNLXd@cluster0.uj8ox.mongodb.net/whatsappdb?retryWrites=true&w=majority`
mongoose.connect(moongoseCred, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
})


const db = mongoose.connection;
db.once('open', () => {
  const msgCollection = db.collection('messagecontents');
  const changeStream = msgCollection.watch();
  changeStream.on('change', change => {
    if (change.operationType === 'insert') {
      const messageDetails = change.fullDocument;
      pusher.trigger('messages', 'inserted', {
        name: messageDetails.name,
        message: messageDetails.message,
        timeStamp: messageDetails.timeStamp,
        received: messageDetails.received,
      })
    } else {
      console.log('Error on Pusher');
    }
  })
})

app.use(express.json());
app.use(function (req, res, next) {
  var allowedOrigins = ['http://localhost:3000', 'https://whatsapp-clone-1f80b.web.app/'];
  var origin = req.headers.origin;
  if(allowedOrigins.indexOf(origin) > -1 || true){
      res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});
app.get("/", (req,res) => res.status(200).send("hello world"));
app.listen(port, () => console.log("perfect"));

app.post('/messages/new', (req,res) =>  {
  const dbMessage = req.body;
  console.log(dbMessage)
  Message.create(dbMessage, (err,data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(`new message created: \n${data}`);
    }
  })
})

app.get('/messages/sync', (req,res) =>  {
  Message.find((err,data) => {
    console.log(data)
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  })
})