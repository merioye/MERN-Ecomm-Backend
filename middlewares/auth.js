const tokenService = require("../utils/tokenService");

const authMiddleware = async (req, res, next) => {
    try {
        const { accessToken } = req.cookies;
        if (!accessToken) {
            return res.status(401).json({
                message: "Please login first",
            });
        }

        const userData = await tokenService.verifyAccessToken(accessToken, res);
        req.userData = userData;
        next();
    } catch (e) {
        console.log(e);
        throw new Error();
    }
};

module.exports = authMiddleware;
