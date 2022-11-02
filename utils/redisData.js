const BrandModel = require("../models/brand");
const ProductModel = require("../models/product");
const CategoryModel = require("../models/category");
const ProductDto = require("../dtos/product");
const BrandDto = require("../dtos/brand");
const CategoryDto = require("../dtos/category");
const redisService = require("./redisService");

class RedisData {
    getBrands = async () => {
        try {
            let brandsData = await redisService.getAllValuesFromList("brands");
            if (!Boolean(brandsData.length)) {
                const dbBrands = await BrandModel.find({});
                for (let dbBrand of dbBrands) {
                    const transformedBrand = new BrandDto(dbBrand);
                    await redisService.pushValueToList(
                        "brands",
                        transformedBrand
                    );
                }
                brandsData = await redisService.getAllValuesFromList("brands");
            }
            return brandsData;
        } catch (e) {
            throw e;
        }
    };

    getCategories = async () => {
        try {
            let categoriesData = await redisService.getAllValuesFromList(
                "categories"
            );
            if (!Boolean(categoriesData.length)) {
                const dbCategories = await CategoryModel.find({});
                for (let dbCategory of dbCategories) {
                    const transformedCategory = new CategoryDto(dbCategory);
                    await redisService.pushValueToList(
                        "categories",
                        transformedCategory
                    );
                }
                categoriesData = await redisService.getAllValuesFromList(
                    "categories"
                );
            }
            return categoriesData;
        } catch (e) {
            throw e;
        }
    };

    getProducts = async () => {
        try {
            let productsData = await redisService.getAllValuesFromList(
                "products"
            );
            if (!Boolean(productsData.length)) {
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
                productsData = await redisService.getAllValuesFromList(
                    "products"
                );
            }
            return productsData;
        } catch (e) {
            throw e;
        }
    };
}

module.exports = new RedisData();
