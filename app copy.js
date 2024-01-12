const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const webPush = require("web-push");
const webPushEncryption = require("web-push-encryption");

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
webPush.setVapidDetails(
  "mailto:hi@heinsoe.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Serve the 'public' directory as the root
app.use(express.static("public"));

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
    sendPushNotifications({
      sender: socket.nickname,
      message: msg,
    });
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

function sendPushNotifications(message) {
  const connectedSockets = Object.values(io.sockets.sockets);
  console.log({connectedSockets})
  connectedSockets.forEach((socket) => {
    if (socket.pushSubscription) {
      console.log({ notiSenting: message });
      webPush
        .sendNotification(socket.pushSubscription, JSON.stringify(message))
        .then(() => console.log("Push notification sent successfully"))
        .catch((error) =>
          console.error("Error sending push notification:", error)
        );
    }
  });
}

server.listen(80, () => {
  console.log("Server is running on port 80");
});
