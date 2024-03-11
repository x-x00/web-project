const mysql = require('mysql2');
const express = require('express');
const ejs = require('ejs');
const bodyParser = require("body-parser");
const session = require('express-session');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// app.use(session({
//     secret: 'mysecretkey',
//     resave: false,
//     saveUninitialized: true,
//     cookie: { maxAge: 600000 } // session timeout of 600 seconds
//   }));

app.use(cookieParser());

const connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    database: "phonedb",
    user: "root",
    password: "1234"
});

connection.connect((err) => {
    if(err) console.log("an error occured while connecting to database: \n" + err);
    else console.log("connected to database successfully.");
});

app.route('/').get((req, res) => {
    connection.query({sql: `SELECT products.product_id as id, CONCAT(brands.brand, ' ', products.model) as title, CONCAT(products.price, ' TL') as price, products.image FROM brands JOIN products ON brands.brand_id=products.brand_id`}, (err, products) => {
        if(err) console.log(err);
        else res.render('shop', {products: products});
    });
    if(!req.cookies.cart_id){
        //implement something to delete cart_items having an expired cookie.
        const cookie = uuidv4();
        res.cookie('cart_id', cookie, {expires: new Date(Date.now() + 100000)}); // 100 seconds, 1 minute and 40 seconds.
    }
    
}).post((req, res) => {
    const selectedProductID = req.body.selectedProductID;
    const selectedProductPrice = parseInt(req.body.selectedProductPrice);

    connection.query({sql: `SELECT cart_id FROM cart_items`}, (err, arr) => {
        let isCustomerExists = false;
        let isProductExistsForThatCustomer = false;
        //hepsi if(req.cookies.cart_id) nin ic kismina koyulabilir.
        for (let i = 0; i < arr.length; i++) {
            // console.log(arr[i].cart_id);
            if(arr[i].cart_id === req.cookies.cart_id) {
                isCustomerExists = true;
                break;
            } 
        };
        if(isCustomerExists){
            // console.log(`product id: ${selectedProductID}`);
            connection.query({sql: `SELECT product_id FROM cart_items WHERE cart_id='${req.cookies.cart_id}'`}, (err, arr) => {
                for (let i = 0; i < arr.length; i++) {
                    // console.log(arr[i].product_id);
                    if(arr[i].product_id == selectedProductID) {
                        isProductExistsForThatCustomer = true;
                        break;
                    } 
                };
                if(isProductExistsForThatCustomer){
                    connection.query({sql: `SELECT products.stock_quantity as stockQuantity, cart_items.quantity as cartQuantity FROM products JOIN cart_items ON products.product_id=cart_items.product_id WHERE cart_items.cart_id='${req.cookies.cart_id}' AND cart_items.product_id=${selectedProductID}`}, (err, arr) => {
                        let cartQuantity = arr[0].cartQuantity;
                        const stockQuantity = arr[0].stockQuantity;
                        if(cartQuantity < stockQuantity){
                            connection.query({sql: `UPDATE cart_items SET quantity=${++cartQuantity}, total=${cartQuantity * selectedProductPrice} WHERE cart_id='${req.cookies.cart_id}' AND product_id=${selectedProductID}`}, (err, arr) => {
                                if(err) console.log(err);
                                else console.log('updated successfully.')
                            });
                        }else{
                            console.log('Cant exceed stock.');
                        }
                    });
                }else{
                    connection.query({sql: `INSERT INTO cart_items (cart_id, product_id, quantity, total) VALUES ('${req.cookies.cart_id}', ${selectedProductID}, 1, ${selectedProductPrice})`}, (err, arr) => {
                        if(err) console.log(err);
                        else console.log('inserted successfully.')
                    });
                }
            });
        }else{
            connection.query({sql: `INSERT INTO cart_items (cart_id, product_id, quantity, total) VALUES ('${req.cookies.cart_id}', ${selectedProductID}, 1, ${selectedProductPrice})`}, (err, arr) => {
                if(err) console.log(err);
                else console.log('inserted successfully.');
            });
        }
    });
});

app.route('/cart').get((req, res) => {
    connection.query({sql: `SELECT products.image as image, CONCAT(brands.brand, ' ', products.model) as product, products.price as price, cart_items.quantity as quantity, cart_items.total as total FROM ((products JOIN brands ON products.brand_id=brands.brand_id) JOIN cart_items ON products.product_id=cart_items.product_id) WHERE cart_id='${req.cookies.cart_id}'`}, (err, cartItems) => {
        if(err) {
            console.log(err);
        }
        else {
            connection.query({sql: `SELECT CONCAT(SUM(total), ' ', 'TL') as total_price FROM cart_items WHERE cart_id='${req.cookies.cart_id}'`}, (err, totalPrice) => {
                if(err) console.log(err);
                else res.render('cart', {cartItems: cartItems, totalPrice: totalPrice[0].total_price});
            });
        }
    });
    // console.log(req.cookies.cart_id);
});

app.route('/checkout').get((req, res) => {
    connection.query({sql: `SELECT CONCAT(brands.brand, ' ', products.model) as product, cart_items.quantity as quantity, cart_items.total as total FROM ((products JOIN brands ON products.brand_id=brands.brand_id) JOIN cart_items ON products.product_id=cart_items.product_id) WHERE cart_id='${req.cookies.cart_id}'`}, (err, cartItems) => {
        if(err) {
            console.log(err);
        }
        else {
            connection.query({sql: `SELECT CONCAT(SUM(total), ' ', 'TL') as total_price FROM cart_items WHERE cart_id='${req.cookies.cart_id}'`}, (err, totalPrice) => {
                if(err) console.log(err);
                else res.render('checkout', {cartItems: cartItems, totalPrice: totalPrice[0].total_price});
            });
        }
    });
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


  // if(!req.cookies.cart_id){
    //         var i = 1;
    //         connection.query({sql: `SELECT cart_item_id FROM cart_items`}, (err, arr) => {
    //         if(err){
    //             console.log(err);
    //         }
    //         else{
    //             for (let index = 0; index < arr.length; index++) {
    //                 if(arr.includes(i)) i++;
    //             }
    //         }
    //     });
    // }