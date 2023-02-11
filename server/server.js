/* eslint-env es6 */
const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const { pbkdf2, timingSafeEqual, randomBytes } = require('crypto');

const port = process.env.PORT || 8080;
const dir = __dirname + "/fini8";
const mongoURI = 'mongodb://advanced_login_program:q3zXflirw4V%40W9U1AU%23%5ED4%253@dono-01.danbot.host:1473/';

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

app.get('/', (req, res) => res.sendFile(dir + '/index.html'));
app.get('/login', (req, res) => res.sendFile(dir + '/index.html'));
app.get('/404', (req, res) => res.sendFile(dir + '/index.html'));
app.get('/favicon.ico', (req, res) => res.sendFile(dir + '/favicon.ico'));

app.post('/handle_data', async (req, res) => {
    if (req.body["type"] === "login") {
        if (!req.body.hasOwnProperty("data") || !["email", "pswd"].every(key => req.body["data"].hasOwnProperty(key))) {
            res.status(200).json({status: 400, message: "Bad Request"});
            return;
        }
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
                if (timingSafeEqual(Buffer.from(user["pswd"]["hash"], 'hex'), derivedKey)) res.status(200).json({status: 200, accepted: true});
                else res.status(200).json({status: 401, accepted: false, message: "Invalid Credentials"});
            });
        } else {
            res.status(200).json({status: 401, accepted: false, message: "Invalid Credentials"});
        }
    } else if (req.body["type"] === "register") {
        if (!req.body.hasOwnProperty("data") || !["email", "pswd"].every(key => req.body["data"].hasOwnProperty(key))) {
            res.status(200).json({status: 400, message: "Bad Request"});
            return;
        }
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
                await mongoClient.db("Website").collection('Users').insertOne({email: req.body["data"]["email"], pswd: {hash: derivedKey.toString('hex'), salt: salt}});
                await mongoClient.close();
                res.status(200).json({status: 201, accepted: true, message: "Account Created Successfully"});
            });
        }
    } else {
        await res.status(200).json({status: 405, accepted: false, message: "Data Handling Method Not Allowed"});
    }
})

app.use('/staticAssets', express.static(dir));
app.use('/assets', express.static(dir + "/assets"));

app.use((req, res, next) => res.status(404).redirect("404"));

app.listen(port, () => console.log('Server running on port ' + port))