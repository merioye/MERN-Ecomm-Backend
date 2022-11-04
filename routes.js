const router = require("express").Router();
const passport = require("passport");
const authController = require("./controllers/auth");
const dashboardController = require("./controllers/dashboard");
const productController = require("./controllers/product");
const cartController = require("./controllers/cart");
const orderController = require("./controllers/order");
const chatController = require("./controllers/chat");
const reviewController = require("./controllers/review");
const wishlistController = require("./controllers/wishlist");
const authMiddleware = require("./middlewares/auth");
const adminAuthMiddleware = require("./middlewares/adminAuth");
const uploadMiddleware = require("./middlewares/upload");

// auth routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.get(
    "/login/google",
    passport.authenticate("google", { scope: ["email", "profile"] })
);
router.get(
    "/login/google/callback",
    passport.authenticate("google", { session: false }),
    authController.socialLogin
);
router.get(
    "/login/facebook",
    passport.authenticate("facebook", { scope: ["email"] })
);
router.get(
    "/login/facebook/callback",
    passport.authenticate("facebook", { session: false }),
    authController.socialLogin
);
router.get("/refreshToken", authController.refreshToken);
router.post("/forgotPassword", authController.forgotPassword);
router.post(
    "/resetPassword/:resetPasswordToken/:userId",
    authController.resetPassword
);
router.get("/logout", authMiddleware, authController.logout);
router.get("/users/user", authMiddleware, authController.getUser);
router.put(
    "/profiles/profile",
    authMiddleware,
    uploadMiddleware.single("image"),
    authController.updateProfile
);
router.get("/profiles/profile", authMiddleware, authController.getProfileData);

// admin routes
router.post(
    "/admin/brands",
    adminAuthMiddleware,
    uploadMiddleware.single("image"),
    dashboardController.createBrand
);
router.get("/admin/brands", adminAuthMiddleware, dashboardController.getBrands);
router.get("/brands", authMiddleware, dashboardController.getAllBrands);
router.get(
    "/admin/brands/:brandId",
    adminAuthMiddleware,
    dashboardController.getSingleBrand
);
router.put(
    "/admin/brands/:brandId",
    adminAuthMiddleware,
    uploadMiddleware.single("image"),
    dashboardController.updateBrand
);
router.delete(
    "/admin/brands/:brandId",
    adminAuthMiddleware,
    dashboardController.deleteBrand
);

router.post(
    "/admin/categories",
    adminAuthMiddleware,
    uploadMiddleware.single("image"),
    dashboardController.createCategory
);
router.get(
    "/admin/categories",
    adminAuthMiddleware,
    dashboardController.getCategories
);
router.get("/categories", authMiddleware, dashboardController.getAllCategories);
router.get(
    "/admin/categories/:categoryId",
    adminAuthMiddleware,
    dashboardController.getSingleCategory
);
router.put(
    "/admin/categories/:categoryId",
    adminAuthMiddleware,
    uploadMiddleware.single("image"),
    dashboardController.updateCategory
);
router.delete(
    "/admin/categories/:categoryId",
    adminAuthMiddleware,
    dashboardController.deleteCategory
);

router.get("/admin/users", adminAuthMiddleware, dashboardController.getUsers);
router.patch(
    "/admin/users/:userId",
    adminAuthMiddleware,
    dashboardController.toggleUserRole
);
router.delete(
    "/admin/users/:userId",
    adminAuthMiddleware,
    dashboardController.deleteUser
);

router.post(
    "/admin/products",
    adminAuthMiddleware,
    uploadMiddleware.array("image", 10),
    dashboardController.createProduct
);
router.get(
    "/admin/products",
    adminAuthMiddleware,
    dashboardController.getProducts
);
router.get(
    "/admin/products/:productId",
    adminAuthMiddleware,
    dashboardController.getSingleProduct
);
router.put(
    "/admin/products/:productId",
    adminAuthMiddleware,
    uploadMiddleware.array("image", 10),
    dashboardController.updateProduct
);
router.delete(
    "/admin/products/:productId",
    adminAuthMiddleware,
    dashboardController.deleteProduct
);

router.post(
    "/admin/coupons",
    adminAuthMiddleware,
    uploadMiddleware.single("image"),
    dashboardController.createCoupon
);
router.get(
    "/admin/coupons",
    adminAuthMiddleware,
    dashboardController.getCoupons
);
router.get(
    "/admin/coupons/:couponId",
    adminAuthMiddleware,
    dashboardController.getSingleCoupon
);
router.put(
    "/admin/coupons/:couponId",
    adminAuthMiddleware,
    uploadMiddleware.single("image"),
    dashboardController.updateCoupon
);
router.delete(
    "/admin/coupons/:couponId",
    adminAuthMiddleware,
    dashboardController.deleteCoupon
);

router.get(
    "/admin/dashboard",
    adminAuthMiddleware,
    dashboardController.getDashboardData
);

router.get(
    "/admin/orders",
    adminAuthMiddleware,
    orderController.getAdminPageOrders
);
router.get(
    "/admin/orders/:orderId",
    adminAuthMiddleware,
    orderController.getSingleOrder
);
router.patch(
    "/admin/orders/:orderId",
    adminAuthMiddleware,
    orderController.updateOrderStatus
);

router.get(
    "/admin/orderNotifications",
    adminAuthMiddleware,
    orderController.getOrderNotifications
);

router.get("/admin/reviews", adminAuthMiddleware, reviewController.getReviews);
router.delete(
    "/admin/reviews/:reviewId",
    adminAuthMiddleware,
    reviewController.deleteReview
);

// application routes
router.get("/products/home", productController.getHomeData);
router.get("/products/filtered", productController.getFilteredProducts);
router.get("/products/search", dashboardController.getProducts);
router.get("/products/:productId", productController.getSingleProduct);

router.get("/carts/cart", authMiddleware, cartController.getCart);
router.put("/carts/cart", authMiddleware, cartController.updateCart);
router.patch("/carts/cart", authMiddleware, cartController.applyCouponCode);

router.get("/checkout", authMiddleware, cartController.getCheckoutData);
router.get("/payment", authMiddleware, cartController.getPaymentPageData);

router.post("/orders", authMiddleware, orderController.placeOrder);
router.get("/orders", authMiddleware, orderController.getUserPageOrders);
router.get("/orders/:orderId", authMiddleware, orderController.getSingleOrder);

router.get("/chats", authMiddleware, chatController.getAllChats);
router.get("/chats/:chatId", authMiddleware, chatController.getChatMessages);
router.put("/chats/:chatId", authMiddleware, chatController.updateChat);
router.patch(
    "/chats/:chatId",
    authMiddleware,
    chatController.updateChatLastMessageReadBy
);

router.post(
    "/wishlists",
    authMiddleware,
    wishlistController.addProductToWishlist
);
router.get(
    "/wishlists/wishlist",
    authMiddleware,
    wishlistController.getWishlist
);
router.patch(
    "/wishlists/wishlist",
    authMiddleware,
    wishlistController.removeProductFromWishlist
);

router.post("/reviews", authMiddleware, reviewController.addReview);

module.exports = router;
