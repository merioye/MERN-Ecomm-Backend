const BrandModel = require("../models/brand");
const UserModel = require("../models/user");
const ProductModel = require("../models/product");
const CategoryModel = require("../models/category");
const ReviewModel = require("../models/review");
const CouponModel = require("../models/coupon");
const OrderModel = require("../models/order");
const cloudinary = require("../config/cloudinary");
const redisService = require("../utils/redisService");
const UserDto = require("../dtos/user");
const BrandDto = require("../dtos/brand");
const CategoryDto = require("../dtos/category");
const ProductDto = require("../dtos/product");
const createError = require("../utils/error");
const getPaginationCount = require("../utils/getPaginationCount");

class DashboardController {
    createBrand = async (req, res, next) => {
        try {
            if (!req.file || !req.body.name)
                return next(createError(400, "All fields are required"));

            const alreadyPresent = await BrandModel.findOne({
                name: req.body.name,
            });
            if (alreadyPresent)
                return next(createError(400, "Brand already exists"));

            const result = await cloudinary.uploader.upload(req.file.path);

            const newBrand = new BrandModel({
                name: req.body.name,
                cloudinaryId: result.public_id,
                logoUrl: result.secure_url,
            });
            const brand = await newBrand.save();

            const transformedBrand = new BrandDto(brand);
            await redisService.pushValueToList("brands", transformedBrand);
            await redisService.setValue(`brand_${brand._id}`, transformedBrand);

            res.status(201).json({
                message: "Brand has been created successfully",
            });
        } catch (err) {
            next(err);
        }
    };

    getBrands = async (req, res, next) => {
        try {
            const { page, search } = req.query;
            if (!page && !search)
                return next(
                    createError(400, "Page no or search string is required")
                );

            const { toSkip, toFetch } = getPaginationCount(page);

            let brandsData = await redisService.getValuesFromList(
                "brands",
                toSkip,
                toFetch,
                search
            );
            if (!brandsData.values.length && brandsData.totalCount === 0) {
                const dbBrands = await BrandModel.find({});
                for (let dbBrand of dbBrands) {
                    const transformedBrand = new BrandDto(dbBrand);
                    await redisService.pushValueToList(
                        "brands",
                        transformedBrand
                    );
                }
                brandsData = await redisService.getValuesFromList(
                    "brands",
                    toSkip,
                    toFetch,
                    search
                );
            }

            res.status(200).json({
                result: brandsData.values,
                totalCount: search
                    ? brandsData.matchedCount
                    : brandsData.totalCount,
            });
        } catch (err) {
            next(err);
        }
    };

    getAllBrands = async (_, res, next) => {
        try {
            let brands = await redisService.getAllValuesFromList("brands");
            if (!brands || !brands.length) {
                const dbBrands = await BrandModel.find({});
                for (let dbBrand of dbBrands) {
                    const transformedBrand = new BrandDto(dbBrand);
                    await redisService.pushValueToList(
                        "brands",
                        transformedBrand
                    );
                }
                brands = await redisService.getAllValuesFromList("brands");
            }

            res.status(200).json({
                result: brands,
            });
        } catch (err) {
            next(err);
        }
    };

    getSingleBrand = async (req, res, next) => {
        try {
            const { brandId } = req.params;
            let brand = await redisService.getValue(`brand_${brandId}`);
            if (!brand) {
                brand = await BrandModel.findById({ _id: brandId });
                if (!brand)
                    return next(
                        createError(
                            404,
                            "There is no such brand with the provided Brand Id"
                        )
                    );

                brand = new BrandDto(brand);
                await redisService.setValue(`brand_${brandId}`, brand);
            }

            res.status(200).json({
                result: brand,
            });
        } catch (err) {
            next(err);
        }
    };

    updateBrand = async (req, res, next) => {
        try {
            const { brandId } = req.params;

            const { name, isFeatured } = req.body;
            if (!name && !String(isFeatured) && !req.file)
                return next(
                    createError(400, "Please provide any data to update")
                );

            const dataToUpdate = { ...req.body };
            if (req.file) {
                const result = await cloudinary.uploader.upload(req.file.path);
                dataToUpdate.cloudinaryId = result.public_id;
                dataToUpdate.logoUrl = result.secure_url;
            }

            const obseleteBrand = await BrandModel.findByIdAndUpdate(
                { _id: brandId },
                { $set: dataToUpdate }
            );
            if (req.file) {
                await cloudinary.uploader.destroy(obseleteBrand.cloudinaryId);
            }

            const updatedBrand = await BrandModel.findById({ _id: brandId });

            const transformedBrand = new BrandDto(updatedBrand);
            await redisService.updateValueInList("brands", transformedBrand);
            await redisService.setValue(`brand_${brandId}`, transformedBrand);

            res.status(200).json({
                updatedBrand: transformedBrand,
            });
        } catch (err) {
            next(err);
        }
    };

    deleteBrand = async (req, res, next) => {
        try {
            const { brandId } = req.params;

            const deletedBrand = await BrandModel.findByIdAndDelete({
                _id: brandId,
            });

            await cloudinary.uploader.destroy(deletedBrand.cloudinaryId);

            const transformedBrand = new BrandDto(deletedBrand);
            await redisService.removeValueFromList("brands", transformedBrand);
            await redisService.deleteKey(`brand_${brandId}`);

            res.status(200).json({
                message: "Brand has been deleted successfully",
            });
        } catch (err) {
            next(err);
        }
    };

    createCategory = async (req, res, next) => {
        try {
            if (!req.file || !req.body.name)
                return next(createError(400, "All fields are required"));

            const alreadyPresent = await CategoryModel.findOne({
                name: req.body.name,
            });
            if (alreadyPresent)
                return next(createError(400, "Category already exists"));

            const result = await cloudinary.uploader.upload(req.file.path);

            const newCategory = new CategoryModel({
                name: req.body.name,
                cloudinaryId: result.public_id,
                logoUrl: result.secure_url,
            });
            const category = await newCategory.save();

            const transformedCategory = new CategoryDto(category);
            await redisService.pushValueToList(
                "categories",
                transformedCategory
            );
            await redisService.setValue(
                `category_${category._id}`,
                transformedCategory
            );

            res.status(201).json({
                message: "Category has been created successfully",
            });
        } catch (err) {
            next(err);
        }
    };

    getCategories = async (req, res, next) => {
        try {
            const { page, search } = req.query;
            if (!page && !search)
                return next(
                    createError(400, "Page no or search string is required")
                );

            const { toSkip, toFetch } = getPaginationCount(page);

            let categoriesData = await redisService.getValuesFromList(
                "categories",
                toSkip,
                toFetch,
                search
            );
            if (
                !categoriesData.values.length &&
                categoriesData.totalCount === 0
            ) {
                const dbCategories = await CategoryModel.find({});
                for (let dbCategory of dbCategories) {
                    const transformedCategory = new CategoryDto(dbCategory);
                    await redisService.pushValueToList(
                        "categories",
                        transformedCategory
                    );
                }
                categoriesData = await redisService.getValuesFromList(
                    "categories",
                    toSkip,
                    toFetch,
                    search
                );
            }

            res.status(200).json({
                result: categoriesData.values,
                totalCount: search
                    ? categoriesData.matchedCount
                    : categoriesData.totalCount,
            });
        } catch (err) {
            next(err);
        }
    };

    getAllCategories = async (_, res, next) => {
        try {
            let categories = await redisService.getAllValuesFromList(
                "categories"
            );
            if (!categories || !categories.length) {
                const dbCategories = await CategoryModel.find({});
                for (let dbCategory of dbCategories) {
                    const transformedCategory = new CategoryDto(dbCategory);
                    await redisService.pushValueToList(
                        "categories",
                        transformedCategory
                    );
                }
                categories = await redisService.getAllValuesFromList(
                    "categories"
                );
            }

            res.status(200).json({
                result: categories,
            });
        } catch (err) {
            next(err);
        }
    };

    getSingleCategory = async (req, res, next) => {
        try {
            const { categoryId } = req.params;
            let category = await redisService.getValue(
                `category_${categoryId}`
            );
            if (!category) {
                category = await CategoryModel.findById({ _id: categoryId });
                if (!category)
                    return next(
                        createError(
                            404,
                            "There is no such category with the provided Category Id"
                        )
                    );

                category = new CategoryDto(category);
                await redisService.setValue(`category_${categoryId}`, category);
            }

            res.status(200).json({
                result: category,
            });
        } catch (err) {
            next(err);
        }
    };

    updateCategory = async (req, res, next) => {
        try {
            const { categoryId } = req.params;

            const { name, isPublished } = req.body;
            if (!name && !String(isPublished) && !req.file)
                return next(
                    createError(400, "Please provide any data to update")
                );

            const dataToUpdate = { ...req.body };
            if (req.file) {
                const result = await cloudinary.uploader.upload(req.file.path);
                dataToUpdate.cloudinaryId = result.public_id;
                dataToUpdate.logoUrl = result.secure_url;
            }

            const obseleteCategory = await CategoryModel.findByIdAndUpdate(
                { _id: categoryId },
                { $set: dataToUpdate }
            );
            if (req.file) {
                await cloudinary.uploader.destroy(
                    obseleteCategory.cloudinaryId
                );
            }

            const updatedCategory = await CategoryModel.findById({
                _id: categoryId,
            });

            const transformedCategory = new CategoryDto(updatedCategory);
            await redisService.updateValueInList(
                "categories",
                transformedCategory
            );
            await redisService.setValue(
                `category_${categoryId}`,
                transformedCategory
            );

            res.status(200).json({
                updatedCategory: transformedCategory,
            });
        } catch (err) {
            next(err);
        }
    };

    deleteCategory = async (req, res, next) => {
        try {
            const { categoryId } = req.params;

            const deletedCategory = await CategoryModel.findByIdAndDelete({
                _id: categoryId,
            });

            await cloudinary.uploader.destroy(deletedCategory.cloudinaryId);

            const transformedCategory = new CategoryDto(deletedCategory);
            await redisService.removeValueFromList(
                "categories",
                transformedCategory
            );
            await redisService.deleteKey(`category_${categoryId}`);

            res.status(200).json({
                message: "Category has been deleted successfully",
            });
        } catch (err) {
            next(err);
        }
    };

    getUsers = async (req, res, next) => {
        try {
            const { page, search } = req.query;
            if (!page && !search)
                return next(
                    createError(400, "Page no or search string is required")
                );

            const { toSkip, toFetch } = getPaginationCount(page);

            let usersData = await redisService.getValuesFromList(
                "users",
                toSkip,
                toFetch,
                search
            );
            if (!usersData.values.length && usersData.totalCount === 0) {
                const dbUsers = await UserModel.find({});
                for (let dbUser of dbUsers) {
                    const transformedUser = new UserDto(dbUser);
                    await redisService.pushValueToList(
                        "users",
                        transformedUser,
                        true
                    );
                }
                usersData = await redisService.getValuesFromList(
                    "users",
                    toSkip,
                    toFetch,
                    search
                );
            }

            const usersNoOfOrders = {};
            for (let user of usersData.values) {
                const count = await OrderModel.find({ user: user._id }).count();
                usersNoOfOrders[user._id] = count;
            }

            res.status(200).json({
                result: {
                    users: usersData.values,
                    noOfOrders: usersNoOfOrders,
                },
                totalCount: search
                    ? usersData.matchedCount
                    : usersData.totalCount,
            });
        } catch (err) {
            next(err);
        }
    };

    toggleUserRole = async (req, res, next) => {
        try {
            const { userId } = req.params;
            const { role } = req.body;
            if (role !== "admin" && role !== "user")
                return next(createError(400, "Invalid role provided"));

            const updatedUser = await UserModel.findByIdAndUpdate(
                { _id: userId },
                { $set: { role: role } },
                { new: true }
            );

            const transformedUser = new UserDto(updatedUser);
            await redisService.updateValueInList("users", transformedUser);
            await redisService.setValue(`user_${userId}`, transformedUser);

            res.status(200).json({
                updatedUser: transformedUser,
            });
        } catch (err) {
            next(err);
        }
    };

    deleteUser = async (req, res, next) => {
        try {
            const { userId } = req.params;

            const deletedUser = await UserModel.findByIdAndDelete({
                _id: userId,
            });

            if (deletedUser.method === "custom" && deletedUser.cloudinaryId) {
                await cloudinary.uploader.destroy(deletedUser.cloudinaryId);
            }

            const transformedUser = new UserDto(deletedUser);
            await redisService.removeValueFromList("users", transformedUser);
            await redisService.deleteKey(`user_${userId}`);

            res.status(200).json({
                message: "User has been deleted successfully",
            });
        } catch (err) {
            next(err);
        }
    };

    createProduct = async (req, res, next) => {
        try {
            const images = req.files;
            const {
                name,
                category,
                desc,
                stock,
                brand,
                regularPrice,
                salePrice,
            } = req.body;
            if (
                !name ||
                !category ||
                !desc ||
                !stock ||
                !brand ||
                !regularPrice ||
                !salePrice ||
                !images
            )
                return next(createError(400, "All fields are required"));

            const isAlreadyPresent = await ProductModel.findOne({ name: name });
            if (isAlreadyPresent)
                return next(
                    createError(
                        400,
                        "Product already exists with the provided name"
                    )
                );

            const imagesResponsePromise = images.map((img) =>
                cloudinary.uploader.upload(img.path)
            );
            const imagesResponse = await Promise.all(imagesResponsePromise);
            const result = imagesResponse.map((imgRes) => {
                return {
                    cloudinaryId: imgRes.public_id,
                    imageUrl: imgRes.secure_url,
                };
            });

            const newProduct = new ProductModel({
                ...req.body,
                images: result,
            });
            const product = await newProduct.save();

            const transformedProduct = new ProductDto(product);
            await redisService.pushValueToList("products", transformedProduct);
            await redisService.setValue(
                `product_${product._id}`,
                transformedProduct
            );

            res.status(201).json({
                message: "Product has been created successfully",
            });
        } catch (err) {
            next(err);
        }
    };

    getProducts = async (req, res, next) => {
        try {
            const { page, search } = req.query;
            if (!page && !search)
                return next(
                    createError(400, "Page no or search string is required")
                );

            const { toSkip, toFetch } = getPaginationCount(page);

            let productsData = await redisService.getValuesFromList(
                "products",
                toSkip,
                toFetch,
                search
            );
            if (!productsData.values.length && productsData.totalCount === 0) {
                const dbProducts = await ProductModel.find({}).populate({
                    path: "reviews",
                    populate: {
                        path: "reviewAuthor",
                        select: { name: 1, avatar: 1 },
                    },
                });
                for (let dbProduct of dbProducts) {
                    const transformedProduct = new ProductDto(dbProduct);
                    await redisService.pushValueToList(
                        "products",
                        transformedProduct
                    );
                }
                productsData = await redisService.getValuesFromList(
                    "products",
                    toSkip,
                    toFetch,
                    search
                );
            }

            res.status(200).json({
                result: productsData.values,
                totalCount: search
                    ? productsData.matchedCount
                    : productsData.totalCount,
            });
        } catch (err) {
            next(err);
        }
    };

    getSingleProduct = async (req, res, next) => {
        try {
            const { productId } = req.params;
            let product = await redisService.getValue(`product_${productId}`);
            if (!product) {
                product = await ProductModel.findById({
                    _id: productId,
                }).populate({
                    path: "reviews",
                    populate: {
                        path: "reviewAuthor",
                        select: { name: 1, avatar: 1 },
                    },
                });
                if (!product)
                    return next(
                        createError(
                            404,
                            "There is no such product with the provided Product Id"
                        )
                    );

                product = new ProductDto(product);
                await redisService.setValue(`product_${productId}`, product);
            }

            res.status(200).json({
                result: product,
            });
        } catch (err) {
            next(err);
        }
    };

    updateProduct = async (req, res, next) => {
        try {
            const { productId } = req.params;
            const images = req.files;

            const {
                name,
                category,
                desc,
                stock,
                brand,
                regularPrice,
                salePrice,
                isFeatured,
                isOnSale,
            } = req.body;
            if (
                !name &&
                !category &&
                !desc &&
                !stock &&
                !brand &&
                !regularPrice &&
                !salePrice &&
                !String(isFeatured) &&
                !String(isOnSale) &&
                !images
            )
                return next(
                    createError(400, "Please provide any data to update")
                );

            const dataToUpdate = { ...req.body };
            if (images && images.length) {
                const imagesResponsePromise = images.map((img) =>
                    cloudinary.uploader.upload(img.path)
                );
                const imagesResponse = await Promise.all(imagesResponsePromise);
                const result = imagesResponse.map((imgRes) => {
                    return {
                        cloudinaryId: imgRes.public_id,
                        imageUrl: imgRes.secure_url,
                    };
                });
                dataToUpdate.images = result;
            }

            const obseleteProduct = await ProductModel.findByIdAndUpdate(
                { _id: productId },
                { $set: dataToUpdate }
            );
            if (images && images.length) {
                for (let img of obseleteProduct.images) {
                    await cloudinary.uploader.destroy(img.cloudinaryId);
                }
            }

            const updatedProduct = await ProductModel.findById({
                _id: productId,
            }).populate({
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

            res.status(200).json({
                updatedProduct: transformedProduct,
            });
        } catch (err) {
            next(err);
        }
    };

    deleteProduct = async (req, res, next) => {
        try {
            const { productId } = req.params;

            const deletedProduct = await ProductModel.findByIdAndDelete({
                _id: productId,
            }).populate({
                path: "reviews",
                populate: {
                    path: "reviewAuthor",
                    select: { name: 1, avatar: 1 },
                },
            });

            for (let img of deletedProduct.images) {
                await cloudinary.uploader.destroy(img.cloudinaryId);
            }

            for (let review of deletedProduct.reviews) {
                await ReviewModel.findByIdAndDelete({ _id: review._id });
            }

            const transformedProduct = new ProductDto(deletedProduct);
            await redisService.removeValueFromList(
                "products",
                transformedProduct
            );
            await redisService.deleteKey(`product_${productId}`);

            res.status(200).json({
                message: "Product has been deleted successfully",
            });
        } catch (err) {
            next(err);
        }
    };

    createCoupon = async (req, res, next) => {
        try {
            const {
                name,
                couponCode,
                validity,
                discountPercentage,
                minimumAmount,
            } = req.body;
            if (
                !req.file ||
                !name ||
                !couponCode ||
                !validity ||
                !discountPercentage ||
                !minimumAmount
            )
                return next(createError(400, "All fields are required"));

            const alreadyPresent = await CouponModel.findOne({
                $or: [{ name }, { couponCode }],
            });
            if (alreadyPresent)
                return next(createError(400, "Coupon already exists"));

            const result = await cloudinary.uploader.upload(req.file.path);

            const newCoupon = new CouponModel({
                ...req.body,
                cloudinaryId: result.public_id,
                bannerUrl: result.secure_url,
            });
            const coupon = await newCoupon.save();

            await redisService.pushValueToList("coupons", coupon);
            await redisService.setValue(`coupon_${coupon._id}`, coupon);

            res.status(201).json({
                message: "Coupon has been created successfully",
            });
        } catch (err) {
            next(err);
        }
    };

    getCoupons = async (req, res, next) => {
        try {
            const { page, search } = req.query;
            if (!page && !search)
                return next(
                    createError(400, "Page no or search string is required")
                );

            const { toSkip, toFetch } = getPaginationCount(page);

            let couponsData = await redisService.getValuesFromList(
                "coupons",
                toSkip,
                toFetch,
                search
            );
            if (!couponsData.values.length && couponsData.totalCount === 0) {
                const dbCoupons = await CouponModel.find({});
                for (let dbCoupon of dbCoupons) {
                    await redisService.pushValueToList("coupons", dbCoupon);
                }
                couponsData = await redisService.getValuesFromList(
                    "coupons",
                    toSkip,
                    toFetch,
                    search
                );
            }

            res.status(200).json({
                result: couponsData.values,
                totalCount: search
                    ? couponsData.matchedCount
                    : couponsData.totalCount,
            });
        } catch (err) {
            next(err);
        }
    };

    getSingleCoupon = async (req, res, next) => {
        try {
            const { couponId } = req.params;
            let coupon = await redisService.getValue(`coupon_${couponId}`);
            if (!coupon) {
                coupon = await CouponModel.findById({ _id: couponId });
                if (!coupon)
                    return next(
                        createError(
                            404,
                            "There is no such coupon with the provided Coupon Id"
                        )
                    );

                await redisService.setValue(`coupon_${couponId}`, coupon);
            }

            res.status(200).json({
                result: coupon,
            });
        } catch (err) {
            next(err);
        }
    };

    updateCoupon = async (req, res, next) => {
        try {
            const { couponId } = req.params;

            const {
                name,
                couponCode,
                validity,
                discountPercentage,
                minimumAmount,
            } = req.body;
            if (
                !name &&
                !couponCode &&
                !validity &&
                !discountPercentage &&
                !minimumAmount &&
                !req.file
            )
                return next(
                    createError(400, "Please provide any data to update")
                );

            const dataToUpdate = { ...req.body };
            if (req.file) {
                const result = await cloudinary.uploader.upload(req.file.path);
                dataToUpdate.cloudinaryId = result.public_id;
                dataToUpdate.bannerUrl = result.secure_url;
            }

            const obseleteCoupon = await CouponModel.findByIdAndUpdate(
                { _id: couponId },
                { $set: dataToUpdate }
            );
            if (req.file) {
                await cloudinary.uploader.destroy(obseleteCoupon.cloudinaryId);
            }

            const updatedCoupon = await CouponModel.findById({ _id: couponId });

            await redisService.updateValueInList("coupons", updatedCoupon);
            await redisService.setValue(`coupon_${couponId}`, updatedCoupon);

            res.status(200).json({
                updatedCoupon,
            });
        } catch (err) {
            next(err);
        }
    };

    deleteCoupon = async (req, res, next) => {
        try {
            const { couponId } = req.params;

            const deletedCoupon = await CouponModel.findByIdAndDelete({
                _id: couponId,
            });

            await cloudinary.uploader.destroy(deletedCoupon.cloudinaryId);

            await redisService.removeValueFromList("coupons", deletedCoupon);
            await redisService.deleteKey(`coupon_${couponId}`);

            res.status(200).json({
                message: "Coupon has been deleted successfully",
            });
        } catch (err) {
            next(err);
        }
    };

    getDashboardData = async (req, res, next) => {
        try {
            const orders = await OrderModel.find({});

            let todayOrdersAmount = 0,
                monthOrdersAmount = 0,
                totalOrdersAmount = 0,
                totalOrdersCount = 0,
                pendingOrdersCount = 0,
                processingOrdersCount = 0,
                deliveredOrdersCount = 0,
                sales = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            for (let order of orders) {
                // calculating orders count
                totalOrdersCount++;
                if (order.status === "pending") pendingOrdersCount++;
                if (order.status === "processing") processingOrdersCount++;
                if (order.status === "delivered") deliveredOrdersCount++;

                if (order.status === "cancelled") continue;

                // calculating orders amount
                if (
                    new Date(order.createdAt).getDate() === new Date().getDate()
                ) {
                    todayOrdersAmount += order.amountToCharge - 5;
                }
                if (
                    new Date(order.createdAt) >=
                    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                ) {
                    monthOrdersAmount += order.amountToCharge - 5;
                }
                totalOrdersAmount += order.amountToCharge - 5;

                // calculating sales data
                const date = new Date(order.createdAt);
                if (date.getFullYear() !== new Date().getFullYear()) {
                    return;
                }
                sales[date.getMonth()] =
                    sales[date.getMonth()] + order.amountToCharge - 5;
            }

            const topRevenueProducts = await OrderModel.aggregate([
                { $match: { status: { $ne: "cancelled" } } },
                { $unwind: "$items" },
                {
                    $group: {
                        _id: "$items.product._id",
                        name: { $first: "$items.product.name" },
                        salesAmount: {
                            $sum: {
                                $multiply: [
                                    "$items.quantity",
                                    {
                                        $cond: {
                                            if: "$items.product.isOnSale",
                                            then: "$items.product.salePrice",
                                            else: "$items.product.regularPrice",
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
                { $limit: 4 },
            ]);
            const topRevenueProductNames = topRevenueProducts.map(
                (p) => p.name
            );
            const topRevenueProductAmount = topRevenueProducts.map(
                (p) => p.salesAmount
            );

            res.status(200).json({
                result: {
                    todayOrdersAmount,
                    monthOrdersAmount,
                    totalOrdersAmount,
                    totalOrdersCount,
                    pendingOrdersCount,
                    processingOrdersCount,
                    deliveredOrdersCount,
                    sales,
                    topRevenueProducts: {
                        topRevenueProductNames,
                        topRevenueProductAmount,
                    },
                },
                totalCount: 0,
            });
        } catch (err) {
            next(err);
        }
    };
}

module.exports = new DashboardController();
