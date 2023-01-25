const express = require('express');
const app = express();
const port = process.env.PORT || 8080;


app.get('/', function(req, res) {
    res.sendFile(__dirname + '/fini8/' + 'index.html');
});
app.get('/login', function(req, res) {
    res.sendFile(__dirname + '/fini8/' + 'index.html');
});
app.get('/login', function(req, res) {
    res.sendFile(__dirname + '/fini8/' + 'index.html');
});
app.use('/src', express.static(__dirname + '/fini8/'));


app.listen(port, function () {
    console.log(`Server running on port ${port}`);
});