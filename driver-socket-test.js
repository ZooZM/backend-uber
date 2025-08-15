import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("🚗 Driver connected to server");
  
  socket.emit("register", {
    userId: "6896730681fa88dcf98c6af3",
    role: "driver",
    vehicleType: "car",
    coords: [31.1234, 30.1234],
  });
});

socket.on("register:success", (data) => {
  console.log("Register success:", data);
});

socket.on("register:error", (err) => {
  console.error("Register error:", err);
});

socket.on("newTripRequest", (data) => {
  console.log("New trip request:", data);
});
