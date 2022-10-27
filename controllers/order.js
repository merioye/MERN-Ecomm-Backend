const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);
const OrderModel = require("../models/order");
const CartModel = require("../models/cart");
const OrderNotificationModel = require("../models/orderNotification");
const ProductModel = require("../models/product");
const createError = require("../utils/error");
const redisService = require("../utils/redisService");
const getPaginationCount = require("../utils/getPaginationCount");
const ProductDto = require("../dtos/product");

class OrderController {
    placeOrder = async (req, res, next) => {
        try {
            if (!req.body) return next(createError(400, "Data not provided"));
            const { _id } = req.userData;
            const {
                paymentMethod,
                items,
                discountAmount,
                amountToCharge,
                note,
                stripeToken,
            } = req.body;

            const order = new OrderModel({
                user: _id,
                paymentMethod,
                items,
                discountAmount,
                amountToCharge,
                note,
            });

            if (paymentMethod === "card") {
                await stripe.charges.create({
                    amount: amountToCharge * 100,
                    currency: "usd",
                    source: stripeToken.id,
                    description: `Order Id: ${order._id}`,
                });
                order.paymentReceived = true;
            }

            const newOrder = await order.save();
            await newOrder.populate({
                path: "user",
                select: "name phone address createdAt",
                populate: { path: "address", model: "Address" },
            });
            await redisService.pushValueToList("orders", newOrder);
            await redisService.setValue(`order_${newOrder._id}`, newOrder);
            await CartModel.deleteOne({ _id });

            // creating order notification
            const orderNotification = new OrderNotificationModel({
                _id: newOrder._id,
                customerName: newOrder.user.name,
            });
            const savedOrderNotification = await orderNotification.save();

            res.status(200).json({
                message: "Order placed successfully",
                newOrder,
                orderNotification: savedOrderNotification,
            });
        } catch (err) {
            next(err);
        }
    };

    getUserPageOrders = async (req, res, next) => {
        try {
            const { _id } = req.userData;
            const { page } = req.query;
            if (!page) return next(createError(400, "Page no is required"));

            const { toSkip, toFetch } = getPaginationCount(page);

            let ordersData = await redisService.getOrdersByUserIdFromList(
                "orders",
                _id,
                toSkip,
                toFetch
            );
            if (!ordersData.values.length && ordersData.totalCount === 0) {
                const dbOrders = await OrderModel.find({ user: _id }).populate({
                    path: "user",
                    select: "name phone address createdAt",
                    populate: { path: "address", model: "Address" },
                });
                for (let dbOrder of dbOrders) {
                    await redisService.pushValueToList("orders", dbOrder);
                }
                ordersData = await redisService.getOrdersByUserIdFromList(
                    "orders",
                    _id,
                    toSkip,
                    toFetch
                );
            }

            res.status(200).json({
                orders: ordersData.matchedCount ? ordersData.values : [],
                totalCount: ordersData.matchedCount,
            });
        } catch (err) {
            next(err);
        }
    };

    getAdminPageOrders = async (req, res, next) => {
        try {
            const { page, search } = req.query;
            if (!page && !search)
                return next(
                    createError(400, "Page no or search string is required")
                );

            const { toSkip, toFetch } = getPaginationCount(page);

            let ordersData = await redisService.getValuesFromList(
                "orders",
                toSkip,
                toFetch,
                search
            );
            if (!ordersData.values.length && ordersData.totalCount === 0) {
                const dbOrders = await OrderModel.find({}).populate({
                    path: "user",
                    select: "name phone address createdAt",
                    populate: { path: "address", model: "Address" },
                });
                for (let dbOrder of dbOrders) {
                    await redisService.pushValueToList("orders", dbOrder);
                }
                ordersData = await redisService.getValuesFromList(
                    "orders",
                    toSkip,
                    toFetch,
                    search
                );
            }

            res.status(200).json({
                result: ordersData.values,
                totalCount: search
                    ? ordersData.matchedCount
                    : ordersData.totalCount,
            });
        } catch (err) {
            next(err);
        }
    };

    getSingleOrder = async (req, res, next) => {
        try {
            const { role } = req.userData;
            const { orderId } = req.params;

            let order = await redisService.getValue(`order_${orderId}`);
            if (!order) {
                order = await OrderModel.findById({ _id: orderId }).populate({
                    path: "user",
                    select: "name phone address createdAt",
                    populate: { path: "address", model: "Address" },
                });
                if (!order)
                    return next(
                        createError(
                            404,
                            "There is no such order with the provided Order Id"
                        )
                    );

                await redisService.setValue(`order_${orderId}`, order);
            }

            // order notification will be deleted from db when the notification if viewed by admin
            if (role === "admin" && !order.notificationViewed) {
                await OrderNotificationModel.deleteOne({ _id: orderId });
                await OrderModel.updateOne(
                    { _id: orderId },
                    { $set: { notificationViewed: true } }
                );
                await redisService.updateValueInList("orders", {
                    ...order,
                    notificationViewed: true,
                });
                await redisService.setValue(`order_${orderId}`, {
                    ...order,
                    notificationViewed: true,
                });
            }

            res.status(200).json({
                result: order,
            });
        } catch (err) {
            next(err);
        }
    };

    updateOrderStatus = async (req, res, next) => {
        try {
            const { orderId } = req.params;
            const { orderStatus } = req.body;
            if (!orderStatus)
                return next(createError(400, "Order status is missing"));

            const updatedOrder = await OrderModel.findByIdAndUpdate(
                { _id: orderId },
                { $set: { status: orderStatus } },
                { new: true }
            ).populate({
                path: "user",
                select: "name phone address createdAt",
                populate: { path: "address", model: "Address" },
            });

            await redisService.updateValueInList("orders", updatedOrder);
            await redisService.setValue(`order_${orderId}`, updatedOrder);

            if (orderStatus === "delivered") {
                for (let item of updatedOrder.items) {
                    const updatedProduct = await ProductModel.findByIdAndUpdate(
                        { _id: item.product._id },
                        { $inc: { stock: -1 * item.quantity } },
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
                        `product_${item.product._id}`,
                        transformedProduct
                    );
                }
            }

            res.status(200).json({
                updatedOrder,
            });
        } catch (err) {
            next(err);
        }
    };

    getOrderNotifications = async (req, res, next) => {
        try {
            const orderNotifications = await OrderNotificationModel.find(
                {}
            ).sort({ createdAt: -1 });

            res.status(200).json({
                orderNotifications,
            });
        } catch (err) {
            next(err);
        }
    };
}

module.exports = new OrderController();
