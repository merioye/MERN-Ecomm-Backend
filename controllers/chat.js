const ChatModel = require("../models/chat");
const MessageModel = require("../models/message");
const UserModel = require("../models/user");

class ChatController {
    getAllChats = async (req, res, next) => {
        try {
            const { _id, role } = req.userData;

            let chats;
            if (role === "admin") {
                chats = await ChatModel.find({
                    $and: [
                        { participants: { $elemMatch: { $eq: _id } } },
                        { lastMessage: { $ne: "" } },
                    ],
                })
                    .populate("participants", "name avatar")
                    .sort({ updatedAt: -1 });
            } else {
                let chat;
                chat = await ChatModel.findOne({
                    participants: { $elemMatch: { $eq: _id } },
                }).populate("participants", "name avatar");

                if (!chat) {
                    const admin = await UserModel.findOne(
                        { role: "admin" },
                        { _id: 1 }
                    );

                    chat = await ChatModel.findOneAndUpdate(
                        {
                            participants: { $elemMatch: { $eq: _id } },
                        },
                        {
                            $set: {
                                participants: [admin._id, _id],
                                lastMessageReadBy: [_id],
                            },
                        },
                        { new: true, upsert: true }
                    ).populate("participants", "name avatar");
                }
                chats = [chat];
            }

            res.status(200).json({
                chats,
            });
        } catch (err) {
            next(err);
        }
    };

    getChatMessages = async (req, res, next) => {
        try {
            const { chatId } = req.params;

            const chat = await ChatModel.findById(
                { _id: chatId },
                { messages: 1 }
            ).populate("messages");

            res.status(200).json({
                messages: chat.messages,
            });
        } catch (err) {
            next(err);
        }
    };

    updateChat = async (req, res, next) => {
        try {
            const { chatId } = req.params;
            const message = req.body;
            const { _id } = req.userData;

            const newMessage = new MessageModel({ ...message, senderId: _id });
            await newMessage.save();

            const updatedChat = await ChatModel.findByIdAndUpdate(
                { _id: chatId },
                {
                    $set: {
                        lastMessage: newMessage.text,
                        lastMessageReadBy: [_id],
                    },
                    $push: { messages: newMessage._id },
                },
                { new: true }
            ).populate("participants", "name avatar");

            res.status(200).json({
                newMessage,
                updatedConversation: updatedChat,
            });
        } catch (err) {
            next(err);
        }
    };

    updateChatLastMessageReadBy = async (req, res, next) => {
        try {
            const { chatId } = req.params;
            const { _id } = req.userData;

            const updatedChat = await ChatModel.findByIdAndUpdate(
                { _id: chatId },
                {
                    $push: { lastMessageReadBy: _id },
                },
                { new: true }
            ).populate("participants", "name avatar");

            res.status(200).json({ updatedConversation: updatedChat });
        } catch (err) {
            next(err);
        }
    };
}

module.exports = new ChatController();
