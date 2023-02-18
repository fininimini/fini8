/* eslint-env es6 */
const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const { pbkdf2, timingSafeEqual, randomBytes } = require('crypto');
const dotEnv = require('dotenv').config({path: __dirname + '/.env'});
const emailTemplate = require('./emailTemplate.js');
const nodeMailer = require('nodemailer');

const port = process.env.PORT || 8080;
const dir = __dirname + "/fini8";
const indexRoutes = ['/', '/login', '/404'];
const credentailsMinLength = {email: 6, pswd: 6};
const WEBSITE = "fini8.eu";

const app = express();
const mongoClient = new MongoClient(process.env.MONGODB_URI);
const emailService = nodeMailer.createTransport({
    service: 'gmail', auth: {user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS}
});

app.use(bodyParser.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if (req.method === 'OPTIONS') {
        return res.status(200).json({});
    }
    next();
});

indexRoutes.forEach(route => app.get(route, (req, res) => res.sendFile(dir + '/index.html')));

app.get('/favicon.ico', (req, res) => res.sendFile(dir + '/favicon.ico'));

app.post('/handle_data', async (req, res) => {
    if ((req.body["type"] === "login" || req.body["type"] === "register") && (
        !req.body.hasOwnProperty("data") ||
        !["email", "pswd"].every(key => req.body["data"].hasOwnProperty(key)) ||
        req.body["type"] === "register" && (
            req.body["data"]["email"].length < credentailsMinLength.email ||
            req.body["data"]["pswd"].length < credentailsMinLength.pswd
        )
    )) {
        res.status(200).json({status: 400, accepted: false, message: "Bad Request"});
        return;
    }
    if (req.body["type"] === "login") {
        try {
            await mongoClient.connect();
        } catch (error) {
            console.error('Error: MongoDB connection refused');
            res.status(200).json({status: 503, accepted: false, message: "Internal Service Unavailable"});
            return;
        }
        const user = await mongoClient.db("Website").collection('Users').findOne({email: req.body["data"]["email"]});
        await mongoClient.close();
        if (user === null) {
            res.status(200).json({status: 401, accepted: false, message: "Invalid Credentials" });
        } else if (user["email"] === req.body["data"]["email"]) {
            pbkdf2(req.body["data"]["pswd"], user["pswd"]["salt"], 1000000, 32, 'sha256', (err, derivedKey) => {
                if (timingSafeEqual(Buffer.from(user["pswd"]["hash"], 'hex'), derivedKey)) res.status(200).json({status: 200, accepted: true, userData: user});
                else res.status(200).json({status: 401, accepted: false, message: "Invalid Credentials"});
            });
        } else {
            res.status(200).json({status: 401, accepted: false, message: "Invalid Credentials"});
        }
    } else if (req.body["type"] === "register") {
        try {
            await mongoClient.connect();
        } catch (error) {
            console.error('Error: MongoDB connection refused');
            res.status(200).json({status: 503, accepted: false, message: "Internal Service Unavailable"});
            return;
        }
        const user = await mongoClient.db("Website").collection('Users').findOne({email: req.body["data"]["email"]});
        await mongoClient.close();
        if (user !== null) {
            res.status(200).json({status: 409, accepted: false, message: "Account With Given Credentials Already Exists"});
        } else {
            try {
                await mongoClient.connect();
            } catch (error) {
                console.error('Error: MongoDB connection refused');
                res.status(200).json({status: 503, accepted: false, message: "Internal Service Unavailable"});
                return;
            }
            const salt = randomBytes(Math.ceil(8)).toString('hex').slice(0, 16);
            await pbkdf2(req.body["data"]["pswd"], salt, 1000000, 32, 'sha256', async (err, derivedKey) => {
                const userData = {
                    email: req.body["data"]["email"],
                    pswd: {
                        hash: derivedKey.toString('hex'),
                        salt: salt
                    },
                    emailVerified: false
                }
                await mongoClient.db("Website").collection('Users').insertOne(userData);
                await mongoClient.close();
                res.status(200).json({status: 201, accepted: true, userData: userData});
            });
        }
    } else {
        await res.status(200).json({status: 405, accepted: false, message: "Type Not Allowed"});
    }
})

app.post('/email', async (req, res) => {
    if (req.body["type"] === "verification" && (
        !req.body.hasOwnProperty("email") ||
        typeof req.body["email"] !== "string"
    )) {
        res.status(200).json({status: 400, accepted: false, message: "Bad Request"});
        return;
    }
    try {
        await mongoClient.connect();
    } catch (error) {
        console.error('Error: MongoDB connection refused');
        res.status(200).json({status: 503, accepted: false, message: "Internal Service Unavailable"});
        return;
    }
    const user = await mongoClient.db("Website").collection('Users').findOne({email: req.body["email"]});
    await mongoClient.close();
    if (user === null) {
        res.status(200).json({status: 401, accepted: false, message: "Invalid Credentials"});
        return;
    }
    if (user["emailVerified"] === true) {
        res.status(200).json({status: 409, accepted: false, message: "Email Already Verified"});
        return;
    }
    if (req.body["type"] === "verification") {
        const code = Math.floor(100000 + Math.random() * 900000)
        const verifyLink = process.env.HTTP_MODE + "://" + WEBSITE + "/verify?token=" + randomBytes(8).toString('hex');
        emailService.sendMail({from: "fini8", to: req.body["email"], subject: "Confirm your account for fini8", html: emailTemplate(WEBSITE, verifyLink, verifyLink, String(code).split("").map(Number), process.env.SUPPORT_EMAIL)
        }, (err, data) => {
            if(err) {
                console.log('Email Error: ' + err);
                res.status(200).json({status: 500, accepted: false, message: "Internal Server Error"});
            } else res.status(200).json({status: 200, accepted: true, message: "Email Verification Sent"});
        });
    } else {
        res.status(200).json({status: 405, accepted: false, message: "Type Not Allowed"});
    }
})

app.use('/staticAssets', express.static(dir));
app.use('/assets', express.static(dir + "/assets"));

app.use((req, res) => res.status(404).redirect("/404"));

app.listen(port, () => console.log('Server running on port ' + port))