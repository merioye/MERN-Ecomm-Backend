class UserDto{
    _id;
    method;
    name;
    email;
    phone;
    avatar;
    role;
    address;
    createdAt;

    constructor(user){
        this._id = user._id;
        this.method = user.method;
        this.name = user.name;
        this.email = user.email ? user.email : '';
        this.phone = user.phone ? user.phone : '';
        this.avatar = user.avatar ? user.avatar : '';
        this.role = user.role;
        this.address = user.address ? user.address : '';
        this.createdAt = user.createdAt;
    }
}

module.exports = UserDto;


/*
=> Dto stands for data transfer object which is basically used to tranform the data. In this 'UserDto'
   case we are transforming User data which is being received in constructor
=> Transform means add, remove or update certain values(fields) basically modifying the data
=> In our case, the data which is passed in constructor contains fields _id,name,email,password,
   createdAt,updatedAt,__v but we are returing the transformed data which contains only _id,name,
   email, createdAt fields.
=> when an object of this class is created, we pass the original data to the constructor but the
   object will only contain properties which we have written in the class/contructor
*/