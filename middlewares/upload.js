const multer = require("multer");

const storageEngine = multer.diskStorage({});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image")) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

module.exports = multer({
    storage: storageEngine,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 },
});
