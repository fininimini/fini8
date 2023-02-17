/* eslint-env es6 */
const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const { pbkdf2, timingSafeEqual, randomBytes } = require('crypto');

const port = process.env.PORT || 8080;
const dir = __dirname + "/fini8";
const mongoURI = '***REMOVED***';
const indexRoutes = ['/', '/login', '/404'];
const credentailsMinLength = {email: 6, pswd: 6};

const app = express();
const mongoClient = new MongoClient(mongoURI);

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
        if (user === null || user["validUser"] === false) {
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
                    emailVerified: false,
                    validUser: true
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

app.post('/email', (req, res) => {
    if (req.body["type"] === "verification") {
        res.status(200).json({status: 200, accepted: true, message: "Email Verification Sent"});
    } else {
        res.status(200).json({status: 405, accepted: false, message: "Type Not Allowed"});
    }
})

app.use('/staticAssets', express.static(dir));
app.use('/assets', express.static(dir + "/assets"));

app.use((req, res) => res.status(404).redirect("404"));

app.listen(port, () => console.log('Server running on port ' + port))