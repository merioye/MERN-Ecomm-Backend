require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const dbConnection = require("./utils/dbConnection");
const errorHandler = require("./middlewares/errorHandler");
const socketManager = require("./socketManager");
require("./config/passport");

const port = process.env.PORT || 8000;
const corsOptions = {
    origin: process.env.CLIENT_APP_URL,
    credentials: true,
    optionSuccessStatus: 200,
};

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, corsOptions);
dbConnection();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors(corsOptions));

// routes
app.use("/api", require("./routes"));
// error handler middleware
app.use(errorHandler);

httpServer.listen(port, () => {
    console.log(`Server is listening at port ${port}`);
});

// socket
io.on("connection", (socket) => {
    socketManager(io, socket);
});
