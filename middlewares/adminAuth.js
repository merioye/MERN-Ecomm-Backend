const tokenService = require('../utils/tokenService');

const adminAuthMiddleware = async (req, res, next)=>{
    try{
        const { accessToken } = req.cookies;
        if(!accessToken){
            return res.status(401).json({
                message: 'Please login first'
            });
        }

        const userData = await tokenService.verifyAccessToken(accessToken, res);
        if(userData.role!=='admin'){
            return res.status(403).json({
                message: 'You do not have rights to access to this page'
            });
        }

        req.userData = userData;
        next();

    }catch(e){
        console.log(e);
        throw new Error();
    }
}

module.exports = adminAuthMiddleware;