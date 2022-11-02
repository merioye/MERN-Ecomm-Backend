const mongoose = require("mongoose");
// _id will be userId
const wishlistSchema = new mongoose.Schema({
    products: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
        },
    ],
});

module.exports = mongoose.model("Wishlist", wishlistSchema);
