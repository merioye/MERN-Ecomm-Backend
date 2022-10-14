const _ = require('lodash');
const ProductModel = require('../models/product');
const redisService = require('../utils/redisService');
const redisData = require('../utils/redisData');
const ProductDto = require('../dtos/product');
const createError = require('../utils/error');
const getPaginationCount = require('../utils/getPaginationCount');


class ProductController{

    // method to sort products based on its product's rating
    topRatedsorter = (p1, p2) => {
        const p1AvgRating = p1.reviews.reduce((acc, review) => acc + review.rating, 0)/p1.reviews.length;
        const p2AvgRating = p2.reviews.reduce((acc, review) => acc + review.rating, 0)/p2.reviews.length;

        if(p1AvgRating > p2AvgRating) {
           return -1;
        } 
        else {
           return 1;
        }
    }

    getHomeData = async (req, res, next)=>{
        try{
            // fetching whole data
            let brandsData = await redisData.getBrands();
            let productsData = await redisData.getProducts();
            let categoriesData = await redisData.getCategories();


            // filtering data
            const featuredBrands = brandsData.filter((b)=> b.isFeatured===true ).slice(0, 8);
            const flashDealProducts = productsData.filter((p)=> p.isOnSale===true).slice(0, 8);
            const featuredProducts = productsData.filter((p)=> p.isFeatured===true).slice(0, 8);
            const newArrivalProducts = [...productsData];
            const topRatedProducts = [...productsData];
            _.orderBy(newArrivalProducts, 'createdAt', 'asc');
            topRatedProducts.sort(this.topRatedsorter);

            const allProducts = [...flashDealProducts, ...newArrivalProducts.slice(0, 8), ...topRatedProducts.slice(0, 8), ...featuredProducts];
            const moreForYouProducts = productsData.filter((p)=> !allProducts.includes(p)).slice(0, 8);  // products excluding allProducts

            // array of prices of all the products in sorted order
            const productsPrices = productsData.map((p)=> p.isOnSale ? p.salePrice : p.regularPrice );
            productsPrices.sort((p1, p2) => p1-p2);

            res.status(200).json({
                categories: categoriesData,
                productsPriceRange: { min: productsPrices[0], max: productsPrices[productsPrices.length-1] },
                featuredBrands,
                flashDealProducts,
                featuredProducts,
                moreForYouProducts,
                newArrivalProducts: newArrivalProducts.slice(0, 8),
                topRatedProducts: topRatedProducts.slice(0, 8)
            });

        }catch(err){
            next(err);
        }
    }


    getSingleProduct = async (req, res, next)=>{
        try{
            const { productId } = req.params;
            let product = await redisService.getValue(`product_${productId}`);
            if(!product){
                product = await ProductModel.findById({ _id: productId }).populate({ path: 'reviews', populate: { path: 'reviewAuthor', select: { name: 1, avatar: 1 } } });
                if(!product) return next(createError(400, 'There is no such product with the provided Product Id'));

                product = new ProductDto(product);
                await redisService.setValue(`product_${productId}`, product);
            }

            // related products
            let productsData = await redisData.getProducts();
            const relatedProducts = productsData.filter((p)=> (p.category===product.category && p._id!==product._id)).slice(0, 4)

            res.status(200).json({
                product,
                relatedProducts
            });

        }catch(err){
            next(err);
        }
    }


    getFilteredProducts = async (req, res, next)=>{
        try{

            // if(!Object.keys(req.query).length) return next(createError(400, 'No filter found'));
            
            const { category, brand, rating, price, inStock, isFeatured, topRated, onSale, productName, isBrand, sort, page } = req.query;
            
            const { toSkip, toFetch } = getPaginationCount(page);

            // if isBrand present means fetch all featured brands else fetch products and apply all other filters
            if(isBrand){
                let brandsData = await redisData.getBrands();
                const featuredBrands = brandsData.filter((brand)=> brand.isFeatured===true);
                
                return res.status(200).json({
                    categories: [],
                    brands: [],
                    productsPriceRange: {},
                    data: featuredBrands.slice(toSkip, (toSkip+toFetch)),
                    totalCount: featuredBrands.length,
                    type: 'brand'
                });
            }
            

            // fetch filtered products and all categories
            let productsData = await redisData.getProducts();
            let categoriesData = await redisData.getCategories();
            
            // all products prices in sorted order
            const productsPrices = productsData.map((p)=> p.isOnSale ? p.salePrice : p.regularPrice );
            productsPrices.sort((p1, p2) => p1-p2);



            // filtering products
            if(productName){
                productsData = productsData.filter((p)=> p.name.toLowerCase().includes(productName.toLowerCase()));
            }
            if(category){
                if(Array.isArray(category)){
                    productsData = productsData.filter((p)=> category.includes(p.category));
                }
                else{
                    productsData = productsData.filter((p)=> p.category===category);
                }
            }
            if(brand){
                if(Array.isArray(brand)){
                    productsData = productsData.filter((p)=> brand.includes(p.brand));
                }
                else{
                    productsData = productsData.filter((p)=> p.brand===brand);
                }
            }
            if(rating){
                if(Array.isArray(rating)){
                    productsData = productsData.filter((p)=>{
                        const productAverageRating = p.reviews.reduce((acc, review) => acc + review.rating, 0)/p.reviews.length;
                        return rating.includes(String(Math.trunc(productAverageRating)));
                    });
                }
                else{
                    productsData = productsData.filter((p)=>{
                        const productAverageRating = p.reviews.reduce((acc, review) => acc + review.rating, 0)/p.reviews.length;
                        return String(Math.trunc(productAverageRating))===rating;
                    });
                }
            }
            if(topRated){
                productsData.sort(this.topRatedsorter);
            }
            if(inStock){
                productsData = productsData.filter((p)=> p.stock>0);
            }
            if(isFeatured){
                productsData = productsData.filter((p)=> p.isFeatured===true);
            }
            if(onSale){
                productsData = productsData.filter((p)=> p.isOnSale===true);
            }
            if(price){
                const minAndMaxPrice = price.split('-');
                productsData = productsData.filter((p)=>{
                    if(p.isOnSale){
                        return (p.salePrice>=Number(minAndMaxPrice[0]) && p.salePrice<=Number(minAndMaxPrice[1]));
                    }
                    else{
                        return (p.regularPrice>=Number(minAndMaxPrice[0]) && p.regularPrice<=Number(minAndMaxPrice[1]));
                    }
                });
            }
            if(sort){
                if(sort==='date'){
                    _.orderBy(productsData, 'createdAt', 'desc');
                }
                else if(sort==='lth'){
                    productsData.sort((p1, p2)=>{
                        return (p1.isOnSale ? p1.salePrice : p1.regularPrice) - (p2.isOnSale ? p2.salePrice : p2.regularPrice);
                    });
                }
                else if(sort==='htl'){
                    productsData.sort((p1, p2)=>{
                        return (p2.isOnSale ? p2.salePrice : p2.regularPrice) - (p1.isOnSale ? p1.salePrice : p1.regularPrice);
                    });
                }
            }

            // all brands that are related to the products returned to user
            const filteredBrands = Array.from(new Set(productsData.map((p)=> p.brand)));

            res.status(200).json({
                categories: categoriesData,
                brands: filteredBrands,
                productsPriceRange: { min: productsPrices[0], max: productsPrices[productsPrices.length-1] },
                data: productsData.slice(toSkip, (toSkip+toFetch)),
                totalCount: productsData.length,
                type: 'product'
            });

        }catch(err){
            next(err);
        }
    }
}

module.exports = new ProductController();