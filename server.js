const mysql = require('mysql2');
const express = require('express');

const app = express();

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

app.get('/', function (req, res) {
    connection.query({sql: "SELECT * FROM sehirler"}, (err, results) => {
        if(err) res.send(err);
        else res.send(results);
    });
  });
  
app.listen(3000);