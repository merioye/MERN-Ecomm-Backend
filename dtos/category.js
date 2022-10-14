class CategoryDto{
    _id;
    name;
    logoUrl;
    isPublished;
    createdAt;

    constructor(category){
        this._id = category._id;
        this.name = category.name;
        this.logoUrl = category.logoUrl;
        this.isPublished = category.isPublished;
        this.createdAt = category.createdAt;
    }
}

module.exports = CategoryDto;