class ProductDto{
    _id;
    name;
    category;
    images;
    desc;
    stock;
    brand;
    regularPrice;
    salePrice;
    isFeatured;
    isOnSale;
    reviews;
    createdAt;

    constructor(product){
        this._id = product._id;
        this.name = product.name;
        this.category = product.category;
        this.images = product.images;
        this.desc = product.desc;
        this.stock = product.stock;
        this.brand = product.brand;
        this.regularPrice = product.regularPrice;
        this.salePrice = product.salePrice;
        this.isFeatured = product.isFeatured;
        this.isOnSale = product.isOnSale;
        this.reviews = product.reviews;
        this.createdAt = product.createdAt;
    }
}

module.exports = ProductDto;