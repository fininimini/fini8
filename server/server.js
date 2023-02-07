/* eslint-env es6 */
const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');


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
        res.header('Access-Control-Allow-Methods', 'GET, POST');
        return res.status(200).json({});
    }
    next();
});

app.get('/', (req, res) => {
    res.sendFile(dir + '/index.html');
});
app.get('/login', (req, res) => {
    res.sendFile(dir + '/index.html');
});
app.get('/404', (req, res) => {
    res.sendFile(dir + '/index.html');
});
app.get('/favicon.ico', (req, res) => {
    res.sendFile(dir + '/favicon.ico');
});

app.post('/handle_data', async (req, res) => {
    if (req.body["type"] == "login") {
        if (!req.body.hasOwnProperty("data") && !["email", "pswd"].every(key => req.body["data"].hasOwnProperty(key))) {
            res.status(400).send('Bad Request');
            return;
        }
        try {
            await mongoClient.connect();
        } catch (error) {
            console.error('Error: MongoDB connection refused');
            res.status(503).json({ error: 503, message: "Database connection failed"});
            return;
        }
        const user = await mongoClient.db("Website").collection('Users').findOne({email: req.body["data"]["email"]});
        await mongoClient.close();
        if (user === null) {
            res.json({ accepted: false, message: "Invalid credentials" });
        } else if (user["email"] === req.body["data"]["email"] && user["pswd"] === req.body["data"]["pswd"]) {
            res.json({ accepted: true });
        } else {
            res.json({ accepted: false, message: "Invalid credentials" });
        }
    } else {
        await res.status(405).send('Data Handling Method Not Allowed');
    }
})

app.use('/staticAssets', express.static(dir));
app.use('/assets', express.static(dir + "/assets"));

app.use((req, res, next) => {
    res.status(404).redirect("404")
})

app.listen(port, () => {
    console.log('Server running on port ' + port);
});
