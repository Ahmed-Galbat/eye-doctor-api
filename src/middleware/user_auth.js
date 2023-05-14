const jwt = require('jsonwebtoken');
const User = require('../models/user');
const userAuth = async (req, res, next) => {
    try {
        const token = req.header('authorization').replace('Bearer ', '');
        const decode = jwt.verify(token, process.env.JWT_SECRET_USER);
        const user = await User.findOne({_id: decode._id, 'token': token});
        if (!user) {
            throw new Error('Not authorized');
        }
        req.token = token;
        req.user = user;
        next();
    } catch (e) {
        res.status(401).send({
            status: false,
            message: [
                'Not authorized',
            ],
        });
    }
};
module.exports = userAuth;