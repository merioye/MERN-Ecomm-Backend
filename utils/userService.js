const UserModel = require('../models/user');

class UserService{
    saveUserInDB = async (user)=>{
        try{
            const newUser = new UserModel(user);
            await newUser.save();
            return newUser;
        }catch(e){
            console.log(e);
            throw new Error();
        }
    }
}

module.exports = new UserService;