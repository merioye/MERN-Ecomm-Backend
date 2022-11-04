const ReviewModel = require("../models/review");
const ProductModel = require("../models/product");
const OrderModel = require("../models/order");
const createError = require("../utils/error");
const ProductDto = require("../dtos/product");
const redisService = require("../utils/redisService");
const getPaginationCount = require("../utils/getPaginationCount");

class ReviewController {
    addReview = async (req, res, next) => {
        try {
            const { _id } = req.userData;
            const { productId, rating, text } = req.body;
            if (!productId || !rating || !text)
                return next(createError(400, "All fields are required"));

            const order = await OrderModel.findOne({
                $and: [
                    { user: _id },
                    { "items.product._id": productId },
                    { status: "delivered" },
                ],
            });
            if (!order) {
                return res.status(403).json({
                    message:
                        "You can't post review, bcz you have not purchased this product",
                });
            }

            const review = await ReviewModel.findOneAndUpdate(
                {
                    $and: [{ product: productId }, { reviewAuthor: _id }],
                },
                {
                    $set: {
                        text,
                        rating,
                        product: productId,
                        reviewAuthor: _id,
                    },
                },
                { upsert: true, new: true }
            )
                .populate("reviewAuthor", "name avatar")
                .populate("product", "name images");

            const updatedProduct = await ProductModel.findByIdAndUpdate(
                { _id: productId },
                { $addToSet: { reviews: review._id } },
                { new: true }
            ).populate({
                path: "reviews",
                populate: {
                    path: "reviewAuthor",
                    select: { name: 1, avatar: 1 },
                },
            });

            const transformedProduct = new ProductDto(updatedProduct);
            await redisService.updateValueInList(
                "products",
                transformedProduct
            );
            await redisService.setValue(
                `product_${productId}`,
                transformedProduct
            );

            await redisService.pushValueToList("reviews", review);

            res.status(201).json({
                message: "Your review has been posted successfully",
                review,
            });
        } catch (err) {
            next(err);
        }
    };

    getReviews = async (req, res, next) => {
        try {
            const { page, search } = req.query;
            if (!page && !search)
                return next(
                    createError(400, "Page no or search string is required")
                );

            const { toSkip, toFetch } = getPaginationCount(page);

            let reviewsData;
            if (search) {
                reviewsData =
                    await redisService.getReviewsByProductNameFromList(
                        "reviews",
                        toSkip,
                        toFetch,
                        search
                    );
            } else {
                reviewsData = await redisService.getValuesFromList(
                    "reviews",
                    toSkip,
                    toFetch
                );
            }

            if (!reviewsData.values.length && reviewsData.totalCount === 0) {
                const dbReviews = await ReviewModel.find({})
                    .populate("reviewAuthor", "name avatar")
                    .populate("product", "name images");

                for (let dbReview of dbReviews) {
                    await redisService.pushValueToList("reviews", dbReview);
                }

                if (search) {
                    reviewsData =
                        await redisService.getReviewsByProductNameFromList(
                            "reviews",
                            toSkip,
                            toFetch,
                            search
                        );
                } else {
                    reviewsData = await redisService.getValuesFromList(
                        "reviews",
                        toSkip,
                        toFetch
                    );
                }
            }

            res.status(200).json({
                result: reviewsData.values,
                totalCount: search
                    ? reviewsData.matchedCount
                    : reviewsData.totalCount,
            });
        } catch (err) {
            next(err);
        }
    };

    deleteReview = async (req, res, next) => {
        try {
            const { reviewId } = req.params;

            const deletedReview = await ReviewModel.findByIdAndDelete({
                _id: reviewId,
            })
                .populate("reviewAuthor", "name avatar")
                .populate("product", "name images");

            const updatedProduct = await ProductModel.findByIdAndUpdate(
                {
                    _id: deletedReview.product._id,
                },
                { $pull: { reviews: deletedReview._id } },
                { new: true }
            ).populate({
                path: "reviews",
                populate: {
                    path: "reviewAuthor",
                    select: { name: 1, avatar: 1 },
                },
            });

            const transformedProduct = new ProductDto(updatedProduct);
            await redisService.updateValueInList(
                "products",
                transformedProduct
            );
            await redisService.setValue(
                `product_${updatedProduct._id}`,
                transformedProduct
            );
            await redisService.removeValueFromList("reviews", deletedReview);

            res.status(200).json({
                message: "Review has been deleted successfully",
            });
        } catch (err) {
            next(err);
        }
    };
}

module.exports = new ReviewController();
