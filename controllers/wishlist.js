const WishlistModel = require("../models/wishlist");

class Wishlist {
    addProductToWishlist = async (req, res, next) => {
        try {
            const { _id } = req.userData;
            const { productId } = req.body;

            await WishlistModel.updateOne(
                { _id },
                { $set: { _id: _id }, $addToSet: { products: productId } },
                { upsert: true }
            );

            res.status(201).json({
                message: "Product has been added to your wishlist",
            });
        } catch (err) {
            next(err);
        }
    };

    getWishlist = async (req, res, next) => {
        try {
            const { _id } = req.userData;
            const wishlist = await WishlistModel.findOne({ _id }).populate(
                "products"
            );
            res.status(200).json({
                wishlistProducts: wishlist ? wishlist.products : [],
            });
        } catch (err) {
            next(err);
        }
    };

    removeProductFromWishlist = async (req, res, next) => {
        try {
            const { _id } = req.userData;
            const { productId } = req.body;

            await WishlistModel.updateOne(
                { _id },
                { $pull: { products: productId } }
            );

            res.status(200).json({
                message: "Product has been removed from your wishlist",
            });
        } catch (err) {
            next(err);
        }
    };
}

module.exports = new Wishlist();
