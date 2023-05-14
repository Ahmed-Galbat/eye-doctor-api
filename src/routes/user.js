const express = require('express');
const User = require("../models/user.js");
const userAuth = require('../middleware/user_auth');
const mongooseErrorHandling = require('mongoose-error-handler');

const router = new express.Router();

router.post('/user', async (req, res) => {
    try {
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password
        });

        await user.save();

        res.status(200).send({
            status: true,
            data: user,
        });
    } catch (e) {
        res.status(500).send({
            status: false,
            message: e.code === 11000 ? ["Duplicated Email Or Phone"] : Object.values(mongooseErrorHandling.set(e).errors),
        });
    }
});
router.post('/user/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        
        const token = await user.generateAuthToken();

        return res.send({
            status: true,
            data: {
                token: token,
            }
        });
    } catch (e) {
        res.status(500).send({
            status: false,
            message: [e.message] || Object.values(mongooseErrorHandling.set(e).errors),
        });
    }
});
router.post('/user/logout', userAuth, async (req, res) => {
    try {
        req.user.token = undefined;
        await req.user.save();
        res.send({
            status: true,
        });
    } catch (e) {
        res.status(500).send({
            status: false,
            message: [e.message] || Object.values(mongooseErrorHandling.set(e).errors),
        });
    }
});
router.get('/user/me', userAuth, async (req, res) => {
    return res.send({
        status: true,
        data: req.user,
    });
});
router.patch('/user/me', userAuth, async (req, res) => {
    try {
        req.user.name = req.body.name || req.user.name;
        req.user.email = req.body.email || req.user.email;

        if (req.body.password) {
            req.user.password = req.body.password;
        }
    
        await req.user.save();

        res.send({
            status: true,
            message: ['updated'],
        });
    } catch (e) {
        res.status(500).send({
            status: false,
            message: [e.message] || Object.values(mongooseErrorHandling.set(e).errors),
        });
    }
});

// draft
router.post('/user/me/changePassword', userAuth, async (req, res) => {
    try {
        req.user.password = req.body.newPassword;
        await req.user.save();
        return res.send({
            status: true,
            message: [
                "Password changed successfully"
            ],
            data: {
                user: req.user
            }
        });
    } catch (e) {
        res.status(500).send({
            status: false,
            message: [e.message] || Object.values(mongooseErrorHandling.set(e).errors),
        });
    }
});
router.post('/user/forgetPassword', async (req, res) => {
    try {
        const user = await User.findOne({phone: req.body.phone});
        if (!user)
            throw new Error('no user with this id');
        const code = User.generateVerificationCode(4);
        user.code = code;
        await user.save();
        sendSMS(user.phone.toString(), code.toString(), function (resCode) {
            return res.status(200).send({
                status: true,
                message: [
                    'Verification Code Sent'
                ],
                data: {
                    userId: user._id,
                }
            });
        });
    } catch (e) {
        res.status(500).send({
            status: false,
            message: [e.message] || Object.values(mongooseErrorHandling.set(e).errors),
        });
    }
});
module.exports = router;
