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
const DEBUG = process.env.DEBUG === "true" || false;

const app = express();
const mongoClient = new MongoClient(process.env.MONGODB_URI);
const emailService = nodeMailer.createTransport({
    service: 'gmail', auth: {user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS}
});

app.use(bodyParser.json());
app.use((req, res, next) => {
    if (DEBUG) {
        const dateTime = new Date();
        let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
        ip = ip.substr(0, 7) == "::ffff:" ? ip.substr(7) : ip;
        console.log(
            "[ " + ("0" + dateTime.getDate()).slice(-2) + "/" + ("0" + (dateTime.getMonth() + 1)).slice(-2) + "/" + dateTime.getFullYear() +
            "-" + dateTime.getHours() + ":" + dateTime.getMinutes() + ":" + dateTime.getSeconds() + " ]( " + ip + " ) " + req.protocol + " " + req.method + " " + req.url
            + (JSON.stringify(req.body) === "{}" ? "" : (" {body: " + JSON.stringify(req.body)) + "}")
        );
    }
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if (req.method === 'OPTIONS') return res.status(200).json({});
    next();
});

indexRoutes.forEach(route => app.get(route, (req, res) => res.sendFile(dir + '/index.html')));
app.get('/verify', (req, res) => res.sendFile(dir + '/index.html'));

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
        return res.status(200).json({status: 400, accepted: false, message: "Bad Request"});
    }
    if (req.body["type"] === "login") {
        try {
            await mongoClient.connect();
        } catch (error) {
            console.error('Error: MongoDB connection refused');
            return res.status(200).json({status: 503, accepted: false, message: "Internal Service Unavailable"});
        }
        const user = await mongoClient.db("Website").collection('Users').findOne({email: req.body["data"]["email"]});
        await mongoClient.close();
        if (user === null) return res.status(200).json({status: 401, accepted: false, message: "Invalid Credentials" });
        else if (user["email"] === req.body["data"]["email"]) {
            pbkdf2(req.body["data"]["pswd"], user["pswd"]["salt"], 1000000, 32, 'sha256', (err, derivedKey) => {
                if (timingSafeEqual(Buffer.from(user["pswd"]["hash"], 'hex'), derivedKey)) return res.status(200).json({status: 200, accepted: true, userData: user});
                else return res.status(200).json({status: 401, accepted: false, message: "Invalid Credentials"});
            });
        } else return res.status(200).json({status: 401, accepted: false, message: "Invalid Credentials"});
    } else if (req.body["type"] === "register") {
        try {
            await mongoClient.connect();
        } catch (error) {
            console.error('Error: MongoDB connection refused');
            return res.status(200).json({status: 503, accepted: false, message: "Internal Service Unavailable"});
        }
        const user = await mongoClient.db("Website").collection('Users').findOne({email: req.body["data"]["email"]});
        await mongoClient.close();
        if (user !== null) return res.status(200).json({status: 409, accepted: false, message: "Account With Given Credentials Already Exists"});
        else {
            try {
                await mongoClient.connect();
            } catch (error) {
                console.error('Error: MongoDB connection refused');
                return res.status(200).json({status: 503, accepted: false, message: "Internal Service Unavailable"});
            }
            const salt = randomBytes(Math.ceil(8)).toString('hex').slice(0, 16);
            await pbkdf2(req.body["data"]["pswd"], salt, 1000000, 32, 'sha256', async (err, derivedKey) => {
                const userData = {
                    email: req.body["data"]["email"],
                    pswd: {
                        hash: derivedKey.toString('hex'),
                        salt: salt
                    },
                    emailVerified: false,
                    activeVerification: null
                }
                await mongoClient.db("Website").collection('Users').insertOne(userData);
                await mongoClient.close();
                return res.status(200).json({status: 201, accepted: true, userData: userData});
            });
        }
    } else return res.status(200).json({status: 405, accepted: false, message: "Type Not Allowed"});
})

app.post('/email', async (req, res) => {
    if (req.body["type"] === "verification" && (
        !req.body.hasOwnProperty("email") ||
        typeof req.body["email"] !== "string"
    )) return res.status(200).json({status: 400, accepted: false, message: "Bad Request"});
    if (req.body["type"] === "verification") {
        try {
            await mongoClient.connect();
        } catch (error) {
            console.error('Error: MongoDB connection refused');
            return res.status(200).json({status: 503, accepted: false, message: "Internal Service Unavailable"});
        }
        const user = await mongoClient.db("Website").collection('Users').findOne({email: req.body["email"]});
        await mongoClient.close();
        if (user === null) return res.status(200).json({status: 401, accepted: false, message: "Invalid Credentials"});
        if (user["emailVerified"] === true) return res.status(200).json({status: 409, accepted: false, message: "Email Already Verified"});
        if (user["activeVerification"] !== null) {
            const verifyLink = process.env.HTTP_MODE + "://" + WEBSITE + "/verify?token=" + user["activeVerification"]["id"];
            emailService.sendMail({
                from: "fini8",
                to: user["email"],
                subject: "Confirm your account for fini8",
                html: emailTemplate(WEBSITE, verifyLink, verifyLink, user["activeVerification"]["code"], process.env.SUPPORT_EMAIL)
            }, (err, data) => {
                if(err) {
                    console.log('Email Error: ' + err);
                    return res.status(200).json({status: 500, accepted: false, message: "Internal Server Error"});
                } else return res.status(200).json({status: 200, accepted: true, message: "Email Verification Sent"});
            });
        } else {
            try {
                await mongoClient.connect();
            } catch (error) {
                console.error('Error: MongoDB connection refused');
                return res.status(200).json({status: 503, accepted: false, message: "Internal Service Unavailable"});
            }
            let id, code
            let dataExists = true
            while(dataExists) {
                id = randomBytes(8).toString('hex')
                code = String(Math.floor(100000 + Math.random() * 900000))
                dataExists = (await mongoClient.db("Website").collection('Users').findOne({
                    $or: [
                        {"activeVerification.id": id},
                        {"activeVerification.code": code}
                    ]
                })) !== null
            }
            await mongoClient.db("Website").collection('Users').updateOne(
                {email: user["email"]},
                {$set: {activeVerification: {id: id, code: code}}},
                (err, doc) => {
                    if (err) {
                        console.error('Error: MongoDB document update refused');
                        return res.status(200).json({status: 500, accepted: false, message: "Internal Service Unavailable"});
                    }
                    const verifyLink = process.env.HTTP_MODE + "://" + WEBSITE + "/verify?token=" + id;
                    emailService.sendMail({
                        from: "fini8",
                        to: user["email"],
                        subject: "Confirm your account for fini8",
                        html: emailTemplate(WEBSITE, verifyLink, verifyLink, code.split("").map(Number), process.env.SUPPORT_EMAIL)
                    }, (err, data) => {
                        if(err) {
                            console.log('Email Error: ' + err);
                            return res.status(200).json({status: 500, accepted: false, message: "Internal Server Error"});
                        } else return res.status(200).json({status: 200, accepted: true, message: "Email Verification Sent"});
                    });
                }
            );
        }
    } else return res.status(200).json({status: 405, accepted: false, message: "Type Not Allowed"});
})

app.use('/staticAssets', express.static(dir));
app.use('/assets', express.static(dir + "/assets"));

app.use((req, res) => res.status(404).redirect("/404"));

app.listen(port, () => console.log('Server running on port ' + port))