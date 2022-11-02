const jwt = require("jsonwebtoken");
const RefreshTokenModel = require("../models/refreshToken");

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

class TokenService {
    generateTokens = async (user) => {
        try {
            const accessToken = await jwt.sign(user, accessTokenSecret, {
                expiresIn: "1d",
            });
            const refreshToken = await jwt.sign(user, refreshTokenSecret, {
                expiresIn: "1y",
            });
            return { accessToken, refreshToken };
        } catch (e) {
            console.log(e);
            throw new Error();
        }
    };

    verifyAccessToken = async (token, res) => {
        try {
            return await jwt.verify(token, accessTokenSecret);
        } catch (e) {
            console.log(e);
            return res.status(401).json({
                message: "Invalid token",
            });
        }
    };

    verifyRefreshToken = async (token, res) => {
        try {
            return await jwt.verify(token, refreshTokenSecret);
        } catch (e) {
            console.log(e);
            return res.status(401).json({
                message: "Invalid token",
            });
        }
    };

    saveRefreshTokenInDB = async (refreshToken) => {
        try {
            const newRefreshToken = new RefreshTokenModel(refreshToken);
            await newRefreshToken.save();
        } catch (e) {
            console.log(e);
            throw new Error();
        }
    };

    setTokenInCookies = (res, tokenName, token, expiry) => {
        res.cookie(tokenName, token, {
            expires: new Date(Date.now() + expiry),
            httpOnly: true,
        });
    };
}

module.exports = new TokenService();
