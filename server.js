const mysql = require('mysql2');
const express = require('express');
const ejs = require('ejs');
const bodyParser = require("body-parser");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    database: "mydb2",
    user: "root",
    password: "1234"
});

connection.connect((err) => {
    if(err) console.log("an error occured while connecting to database: \n" + err);
    else console.log("connected to database successfully.");
});

// app.get('/', function (req, res) {
//     connection.query({sql: "SELECT * FROM sehirler"}, (err, results) => {
//         if(err) res.send(err);
//         else res.send(results);
//     });
//   });

app.route('/').get((req, res) =>{
    connection.query({sql: "SELECT * FROM gonderiler"}, (err, results) => {
        if(err) res.send(err);
        else res.render("main", {test: results});
    });
}).post((req, res) => {
    const newCityCode = parseInt(req.body.newCityCode);
    const newCity = String(req.body.newCity);
    connection.query({sql: `INSERT INTO sehirler (sehir_kodu, sehir_adi) VALUES (${newCityCode}, '${newCity}')`}, (err, results) => {
        if(err) res.send(err);
        else console.log('saves to sehirler table on mydb2.');
    });
});
  
app.listen(3000);