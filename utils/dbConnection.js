const mongoose = require("mongoose");

const dbConnection = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("DB connected");
    } catch (e) {
        console.log(e);
    }
};

module.exports = dbConnection;
