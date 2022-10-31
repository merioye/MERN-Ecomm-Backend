const onlineUsers = {};

const socketManager = (io, socket) => {
    socket.on("newConnection", (user) => {
        if (user.userRole === "admin") onlineUsers[user.userRole] = socket.id;
        else onlineUsers[user.userId] = socket.id;
        io.emit("onlineUsers", onlineUsers);
    });

    socket.on("newOrderNotification", ({ newOrder, notification, userId }) => {
        io.to(onlineUsers[userId]).emit("newOrderNotification", {
            newOrder,
            notification,
        });
    });

    socket.on("orderStatusUpdate", ({ updatedOrder, userId }) => {
        io.to(onlineUsers[userId]).emit("orderStatusUpdate", updatedOrder);
    });

    socket.on(
        "newMessage",
        ({ newMessage, updatedConversation, userId, senderName }) => {
            io.to(onlineUsers[userId]).emit("newMessage", {
                newMessage,
                updatedConversation,
                senderName,
            });
        }
    );

    socket.on("disconnect", () => {
        for (let userId in onlineUsers) {
            if (onlineUsers[userId] === socket.id) {
                delete onlineUsers[userId];
                break;
            }
        }
        io.emit("onlineUsers", onlineUsers);
    });
};

module.exports = socketManager;
