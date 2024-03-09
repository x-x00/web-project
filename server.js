const mysql = require('mysql2');
const express = require('express');
const ejs = require('ejs');
const bodyParser = require("body-parser");

const app = express();

app.set('view engine', 'ejs');

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

app.route('/').get((req, res) => {
    res.render('shop');
});

app.route('/cart').get((req, res) => {
    res.render('cart');
});

app.route('/checkout').get((req, res) => {
    res.render('checkout');
});

app.route('/thankyou').get((req, res) => {
    res.render('thankyou');
});


  
app.listen(3000, '', (err) => {
    if(err) console.log(err);
    else console.log("Listening on port 3000.");
});

// app.route('/').get((req, res) =>{
  //     connection.query({sql: "SELECT * FROM gonderiler"}, (err, results) => {
  //         if(err) console.log(err);
  //         else res.render("main", {test: results});
  //     });
  // }).post((req, res) => {
  //     const newCityCode = parseInt(req.body.newCityCode);
  //     const newCity = String(req.body.newCity);
  //     connection.query({sql: `INSERT INTO sehirler (sehir_kodu, sehir_adi) VALUES (${newCityCode}, '${newCity}')`}, (err, results) => {
  //         if(err) console.log(err);
  //         else console.log('saved to sehirler table on mydb2.');
  //     });
  // });
