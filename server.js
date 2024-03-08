const mysql = require('mysql2');

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


