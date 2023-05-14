const validator = require('validator');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        validate(value) {
            if (value.length < 2) {
                throw new Error('Name must be more than 2 letter')
            }
        }
    },
    email: {
        type: String,
        required: true,
        trim: true,
        validate(value) {
            if (!/\S+@\S+\.\S+/.test(value)) {
                throw new Error('Email does not match the expression');
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minLength: 6,
        validate(value) {
            if (value.length < 6) {
                throw new Error('Password must be more than 6 letter')
            }
        }
    },
    token: {
        type: String,
    },
});
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    delete user.token;
    return user;
};
userSchema.methods.generateAuthToken = async function () {
    const user = this;
    const token = jwt.sign({_id: user._id.toString()}, process.env.JWT_SECRET_USER);
    user.token = token;
    await user.save();
    return token;
};
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email});
        if (!user) {
            const err = new Error('Unable to login, user is not found');
            err.code = 404;
            throw err;
        }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        const err = new Error('Unable to login, incorrect password');
        err.code = 404;
        throw err;
    }
    return user;
};
userSchema.pre('save', async function (next) {
    const user = this;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    next();
});
const User = mongoose.model('User', userSchema);
module.exports = User;
