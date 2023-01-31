express = require('express');
app = express();
port = process.env.PORT || 8080;
dir = __dirname + "/fini8"

app.get('/', function(req, res) {
    res.sendFile(dir + '/index.html');
});
app.get('/login', function(req, res) {
    res.sendFile(dir + '/index.html');
});
app.get('/404', function(req, res) {
    res.sendFile(dir + '/index.html');
});
app.get('/favicon.ico', function(req, res) {
    res.sendFile(dir + '/favicon.ico');
});
app.use('/staticAssets', express.static(dir));
app.use('/assets', express.static(dir + "/assets"));
/* eslint-env es6 */
app.use((req, res, next) => {
    res.status(404).redirect("404")
})

app.listen(port, function () {
    console.log('Server running on port ' + port);
});