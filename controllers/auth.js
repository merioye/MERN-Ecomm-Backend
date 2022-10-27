const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const ObjectId = require("mongoose").Types.ObjectId;
const UserModel = require("../models/user");
const AddressModel = require("../models/address");
const RefreshTokenModel = require("../models/refreshToken");
const ResetPasswordModel = require("../models/resetPassword");
const cloudinary = require("../config/cloudinary");
const UserDto = require("../dtos/user");
const userService = require("../utils/userService");
const tokenService = require("../utils/tokenService");
const redisService = require("../utils/redisService");
const sendEmail = require("../utils/sendEmail");
const createError = require("../utils/error");

const regex = {
    name: "^[a-zA-Z]{3,}(?: [a-zA-Z]+){0,2}$",
    email: "[a-z0-9]+@[a-z]+.[a-z]{2,3}",
    password:
        "^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,20}$",
};
const checkIsValid = (value, regex) => {
    return RegExp(regex).test(value);
};
class AuthController {
    register = async (req, res, next) => {
        try {
            const { name, email, password, retypePassword } = req.body;
            if (
                !checkIsValid(name, regex.name) ||
                !checkIsValid(email, regex.email) ||
                !checkIsValid(password, regex.password) ||
                password !== retypePassword
            )
                return next(
                    createError(400, "Please fill the fields data correctly")
                );

            const user = await UserModel.findOne({ email });
            if (user) return next(createError(409, "User already exists"));

            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = await userService.saveUserInDB({
                name,
                email,
                password: hashedPassword,
            });

            const transformedUser = new UserDto(newUser);
            await redisService.pushValueToList("users", transformedUser, true);
            await redisService.setValue(
                `user_${transformedUser._id}`,
                transformedUser
            );

            res.status(201).json({
                message: "User registered successfully",
            });
        } catch (err) {
            next(err);
        }
    };

    login = async (req, res, next) => {
        try {
            const { email, password } = req.body;
            if (!email || !password)
                return next(createError(400, "All fields are required"));

            const user = await UserModel.findOne({ email }).populate("address");
            if (!user) return next(createError(401, "Invalid credentials"));

            const isMatched = await bcrypt.compare(password, user.password);
            if (!isMatched)
                return next(createError(401, "Invalid credentials"));

            const { accessToken, refreshToken } =
                await tokenService.generateTokens({
                    _id: user._id,
                    role: user.role,
                });
            await tokenService.saveRefreshTokenInDB({
                userId: user._id,
                refreshToken: refreshToken,
            });

            tokenService.setTokenInCookies(
                res,
                "accessToken",
                accessToken,
                86400000
            );
            tokenService.setTokenInCookies(
                res,
                "refreshToken",
                refreshToken,
                86400000 * 365
            );

            const transformedUser = new UserDto(user);
            res.status(200).json({
                user: transformedUser,
            });
        } catch (err) {
            next(err);
        }
    };

    socialLogin = async (req, res) => {
        let errorText = "Something went wrong, please try again!";
        try {
            if (!req.user) {
                throw new Error();
            }
            if (req.user.error) {
                errorText = req.user.errorText;
                throw new Error();
            }

            const { accessToken, refreshToken } =
                await tokenService.generateTokens({
                    _id: req.user._id,
                    role: req.user.role,
                });

            await tokenService.saveRefreshTokenInDB({
                userId: req.user._id,
                refreshToken: refreshToken,
            });

            tokenService.setTokenInCookies(
                res,
                "accessToken",
                accessToken,
                86400000
            );
            tokenService.setTokenInCookies(
                res,
                "refreshToken",
                refreshToken,
                86400000 * 365
            );

            await redisService.pushValueToList("users", req.user, true);
            await redisService.setValue(`user_${req.user._id}`, req.user);

            res.redirect("/");
        } catch (e) {
            console.log(e);
            res.redirect(`/login?error=${errorText}`);
        }
    };

    refreshToken = async (req, res, next) => {
        try {
            const { refreshToken: cookiesRefreshToken } = req.cookies;
            if (!cookiesRefreshToken)
                return next(createError(401, "Tokens have been expired"));

            const userData = await tokenService.verifyRefreshToken(
                cookiesRefreshToken,
                res
            );

            const token = await RefreshTokenModel.findOne({
                userId: userData._id,
                refreshToken: cookiesRefreshToken,
            });
            if (!token) return next(createError(401, "Invalid token"));

            const user = await UserModel.findById({ _id: userData._id });
            if (!user) return next(createError(404, "User does not exist"));

            const { accessToken, refreshToken } =
                await tokenService.generateTokens({
                    _id: userData._id,
                    role: userData.role,
                });

            await RefreshTokenModel.findByIdAndUpdate(
                { _id: token._id },
                { $set: { refreshToken: refreshToken } }
            );

            tokenService.setTokenInCookies(
                res,
                "accessToken",
                accessToken,
                86400000
            );
            tokenService.setTokenInCookies(
                res,
                "refreshToken",
                refreshToken,
                86400000 * 365
            );

            res.status(200).json({
                message: "Tokens generated successfully",
            });
        } catch (err) {
            next(err);
        }
    };

    forgotPassword = async (req, res, next) => {
        try {
            const { email } = req.body;
            if (!checkIsValid(email, regex.email))
                return next(createError(400, "Please enter a valid email"));

            const user = await UserModel.findOne({ email });
            if (!user)
                return next(
                    createError(
                        404,
                        "User does not exist with the provided email"
                    )
                );

            if (user && user.method !== "custom")
                return next(
                    createError(
                        400,
                        `This email is registered as ${user.method} login, please login with ${user.method}`
                    )
                );

            const resetPasswordToken = uuidv4().toString().replace(/-/g, "");
            const hashedToken = await bcrypt.hash(resetPasswordToken, 10);
            await ResetPasswordModel.updateOne(
                { userId: user._id },
                { $set: { userId: user._id, resetPasswordToken: hashedToken } },
                { upsert: true }
            );

            const resetPasswordLink = `${process.env.CLIENT_APP_URL}/resetpassword/${resetPasswordToken}/${user._id}`;
            await sendEmail(user.name, user.email, resetPasswordLink);

            res.status(200).json({
                message:
                    "Reset password link has been sent on your email, kindly check your email",
            });
        } catch (err) {
            next(err);
        }
    };

    resetPassword = async (req, res, next) => {
        try {
            const { resetPasswordToken, userId } = req.params;
            const { password, retypePassword } = req.body;
            if (!resetPasswordToken || !userId || !ObjectId.isValid(userId))
                return next(createError(400, "Invalid password reset link"));

            if (!password || password !== retypePassword)
                return next(createError(400, "All fields are required"));

            const token = await ResetPasswordModel.findOne({ userId });
            if (!token)
                return next(
                    createError(
                        404,
                        "It seems like reset password link is invalid OR has been expired!"
                    )
                );

            const isMatched = await bcrypt.compare(
                resetPasswordToken,
                token.resetPasswordToken
            );
            if (!isMatched)
                return next(createError(403, "Invalid reset password link"));

            const hashedPassword = await bcrypt.hash(password, 10);
            await UserModel.findByIdAndUpdate(
                { _id: userId },
                { $set: { password: hashedPassword } }
            );

            await ResetPasswordModel.findByIdAndDelete({ _id: token._id });

            res.status(200).json({
                message: "Password has been reseted successfully",
            });
        } catch (err) {
            next(err);
        }
    };

    getUser = async (req, res, next) => {
        try {
            const { _id } = req.userData;
            let user = await redisService.getValue(`user_${_id}`);
            if (!user) {
                user = await UserModel.findById({ _id: _id }).populate(
                    "address"
                );
                if (!user) return next(createError(404, "User not found"));

                user = new UserDto(user);
                await redisService.setValue(`user_${_id}`, user);
            }

            res.status(200).json({
                user,
            });
        } catch (err) {
            next(err);
        }
    };

    updateUser = async (req, res, next) => {
        try {
            const { _id } = req.userData;
            if (!req.file && !Object.keys(req.body).length)
                return next(
                    createError(400, "Please provide any data to update")
                );

            const {
                name,
                email,
                phone,
                password,
                country,
                state,
                city,
                zipCode,
                address1,
                address2,
            } = req.body;

            const dataToUpdateInUser = {};
            const dataToUpdateInUserAddress = {};

            if (name) dataToUpdateInUser.name = name;
            if (email) dataToUpdateInUser.email = email;
            if (phone) dataToUpdateInUser.phone = phone;
            if (password) {
                const hashedPassword = await bcrypt.hash(req.body.password, 10);
                dataToUpdateInUser.password = hashedPassword;
            }
            if (req.file) {
                const result = await cloudinary.uploader.upload(req.file.path);
                dataToUpdateInUser.avatar = result.secure_url;
                dataToUpdateInUser.cloudinaryId = result.public_id;
            }

            if (city) dataToUpdateInUserAddress.city = city;
            if (state) dataToUpdateInUserAddress.state = state;
            if (country) dataToUpdateInUserAddress.country = country;
            if (zipCode) dataToUpdateInUserAddress.zipCode = zipCode;
            if (address1) dataToUpdateInUserAddress.address1 = address1;
            if (address2) dataToUpdateInUserAddress.address2 = address2;

            if (Object.keys(dataToUpdateInUserAddress).length) {
                const userIdInString = String(_id);
                dataToUpdateInUserAddress.userId = userIdInString;
                const address = await AddressModel.findOneAndUpdate(
                    { userId: userIdInString },
                    { $set: dataToUpdateInUserAddress },
                    { upsert: true, new: true }
                );
                dataToUpdateInUser.address = address._id;
            }

            const user = await UserModel.findByIdAndUpdate(
                { _id },
                { $set: dataToUpdateInUser },
                { new: true }
            ).populate("address");

            const transformedUser = new UserDto(user);
            await redisService.updateValueInList("users", transformedUser);
            await redisService.setValue(
                `user_${transformedUser._id}`,
                transformedUser
            );

            res.status(200).json({
                user: transformedUser,
            });
        } catch (err) {
            next(err);
        }
    };
}

module.exports = new AuthController();
