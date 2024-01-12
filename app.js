const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const webPush = require("web-push");
const bodyParser = require("body-parser");
const webPushEncryption = require("web-push-encryption");
const PushNotifications = require("node-pushnotifications");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Set up web-push with your VAPID keys
// const vapidKeys = webPush.generateVAPIDKeys();

// console.log('Public Key:', vapidKeys.publicKey);
// console.log('Private Key:', vapidKeys.privateKey);
const vapidKeys = {
  publicKey:
    "BNvHmjN5vvY8P4ZMfVU4dwRfA43K6wAXwInDcwIP_c991ra2S0alPEVUqcQB3gN7nF6GvYJMuXjmxSpqftF9zJs",
  privateKey: "SVfst852zhCP0di7CyHGc2AfPDz3ylrnnHJjNLc50xI",
};

// Serve the 'public' directory as the root
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader("Access-Control-Allow-Origin", "*");
  
    // Request methods you wish to allow
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, OPTIONS, PUT, PATCH, DELETE"
    );
  
    // Request headers you wish to allow
    res.setHeader("Access-Control-Allow-Headers", "*");
  
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader("Access-Control-Allow-Credentials", true);
  
    // Pass to next layer of middleware
    next();
  });
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", (socket) => {
  console.log("A user connected");

  // Set a user nickname for the first time
  if (!socket.nickname) {
    // Generate a unique ID for the user
    socket.nickname = `User${Date.now()}`;
    socket.emit("requestNickname");
  }

  // Send the user's ID and nickname to the client
  socket.emit("setUserInfo", { id: socket.id, nickname: socket.nickname });

  // Listen for nickname response
  socket.on("setNickname", (nickname) => {
    socket.nickname = nickname;

    // Send the updated nickname to the client
    io.emit("updateNickname", socket.id, nickname);

    // Broadcast a message that the user joined the chat
    io.emit("chat message", {
      sender: "Server",
      message: `${nickname} joined the chat`,
    });
  });

  // Listen for messages
  socket.on("chat message", (msg) => {
    // Send messages as JSON with sender's ID
    io.emit("chat message", {
      senderId: socket.id,
      sender: socket.nickname,
      message: msg,
    });

    // Pass the correct message object to sendPushNotifications
    // sendPushNotifications({
    //   sender: socket.nickname,
    //   message: msg,
    // });
  });
  socket.on("setPushSubscription", (pushSubscription) => {
    socket.pushSubscription = pushSubscription;
    console.log(`Push subscription set for ${socket.nickname}`);
  });

  // Listen for disconnection
  socket.on("disconnect", () => {
    console.log(`${socket.nickname} disconnected`);
    io.emit("chat message", {
      sender: "Server",
      message: `${socket.nickname} left the chat`,
    });
  });
});
app.post("/subscribe", (req, res) => {
    // Get pushSubscription object
    const subscription = req.body;
    console.log(subscription);
    const settings = {
      web: {
        vapidDetails: {
          subject: "mailto:hi@heinsoe.com", // REPLACE_WITH_YOUR_EMAIL
          publicKey: vapidKeys.privateKey,
          privateKey: vapidKeys.privateKey,
        },
        gcmAPIKey: "gcmkey",
        TTL: 2419200,
        contentEncoding: "aes128gcm",
        headers: {},
      },
      isAlwaysUseFCM: false,
    };
  
    // Send 201 - resource created
    const push = new PushNotifications(settings);
  
    // Create payload
    const payload = { title: "Notification FROM TTTSSSSSSSS" };
    push.send(subscription, payload, (err, result) => {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
      }
    });
  });
  
server.listen(80, () => {
  console.log("Server is running on port 80");
});
