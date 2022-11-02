const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const UserModel = require("../models/user");
const userService = require("../utils/userService");
const UserDto = require("../dtos/user");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID;
const FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET;

// this function is called immediately after the user is logged in using google/facebook (means the user chooses an account to login with)
const authUser = async (request, accessToken, refreshToken, profile, done) => {
    try {
        if (!profile.emails[0]) {
            return done(null, {
                error: true,
                errorText: `Facebook id's created using phone no cannot be used to login here, please choose another method to login`,
            });
        }

        const user = await UserModel.findOne({
            email: profile.emails[0].value,
        }).populate("address");
        if (user && user.method !== profile.provider) {
            const method =
                user.method === "custom" ? "email & password" : user.method;
            // user already exists and created from other login methods ( means cannot use same email for different login methods(facebook, google, custom) so, throw an error)
            return done(null, {
                error: true,
                errorText: `Same email has been already used to login with ${method}, please select a different email OR login with ${method}`,
            });
        }

        // if user already present with the same email & same login method, then do not create new user instead return that one
        if (user) {
            const transformedUser = new UserDto(user);
            return done(null, transformedUser);
        }

        const newUser = await userService.saveUserInDB({
            method: profile.provider,
            name: profile.displayName,
            email: profile.emails[0].value,
            avatar: profile.photos[0].value,
        });

        const transformedUser = new UserDto(newUser);
        done(null, transformedUser);
    } catch (e) {
        console.log(e);
        return done(null, {
            error: true,
            errorText: "Something went wrong, please try again",
        });
    }
};

passport.use(
    new GoogleStrategy(
        {
            clientID: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
            callbackURL: `${process.env.SERVER_APP_URL}/api/login/google/callback`,
            passReqToCallback: true,
        },
        authUser
    )
);

passport.use(
    new FacebookStrategy(
        {
            clientID: FACEBOOK_CLIENT_ID,
            clientSecret: FACEBOOK_CLIENT_SECRET,
            callbackURL: `${process.env.SERVER_APP_URL}/api/login/facebook/callback`,
            profileFields: ["id", "displayName", "photos", "emails"],
            passReqToCallback: true,
        },
        authUser
    )
);
