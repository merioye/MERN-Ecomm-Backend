class BrandDto {
    _id;
    name;
    logoUrl;
    isFeatured;
    createdAt;

    constructor(brand) {
        this._id = brand._id;
        this.name = brand.name;
        this.logoUrl = brand.logoUrl;
        this.isFeatured = brand.isFeatured;
        this.createdAt = brand.createdAt;
    }
}

module.exports = BrandDto;
