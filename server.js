const mysql = require('mysql2');
const express = require('express');
const ejs = require('ejs');
const bodyParser = require("body-parser");
const session = require('express-session');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config()

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//TODO: adjust buttons to correctly direct the customer, item adding in shop, address city, district... , delete expired cookie cart,
// database check ( normalization... ), composite key oluyormus... (bookmark a bak.), script for validating email and phonenumber, dynamically update the page.
// change stock_quantity when order is complete.

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
    password: process.env.DATABASE_PASSWORD
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
    console.log(typeof(selectedProductID));

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
    connection.query({sql: `SELECT products.image as image, CONCAT(brands.brand, ' ', products.model) as product, products.price as price, cart_items.quantity as quantity, cart_items.total as total, products.product_id as product_id FROM ((products JOIN brands ON products.brand_id=brands.brand_id) JOIN cart_items ON products.product_id=cart_items.product_id) WHERE cart_id='${req.cookies.cart_id}'`}, (err, cartItems) => {
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
}).post((req, res) => {
    //mysql automatically parses string to int to prevent complications, so the productID will be a int whether parsing it to int or not.
    const productID = parseInt(req.body.productID);
    const updatedQuantity = parseInt(req.body.updatedQuantity);
    const submitClicked = req.body.submitClicked;
    const selectedProductPrice = parseInt(req.body.selectedProductPrice);
    if(req.cookies.cart_id){
        if(submitClicked === 'plusButton' || submitClicked === 'minusButton'){
            connection.query({sql: `SELECT stock_quantity FROM products WHERE product_id=${productID}`}, (err, arr) => {
                if(err){
                    console.log(err);
                }else{
                    const stockQuantity = arr[0].stock_quantity;
                    if(updatedQuantity === 0) {
                        connection.query({sql: `DELETE FROM cart_items WHERE cart_id='${req.cookies.cart_id}' AND product_id=${productID}`}, (err, arr) => {
                            if(err) {
                                console.log(err);
                            }else{
                                console.log('successfully deleted from cart, quantity = 0');
                                res.redirect('/cart');
                            }
                        });
                    }else if(updatedQuantity <= stockQuantity){
                        connection.query({sql: `UPDATE cart_items SET quantity=${updatedQuantity}, total=${updatedQuantity * selectedProductPrice} WHERE cart_id='${req.cookies.cart_id}' AND product_id=${productID}`}, (err, arr) => {
                            if(err){
                                console.log(err);
                            }else{
                                console.log('successfully updated the cart.');
                                res.redirect('/cart');
                            }
                        });
                    }else{
                        console.log('cant exceed stock.')
                        res.redirect('/cart');
                    }
                }
            });
        }else if(submitClicked === 'deleteButton'){
            connection.query({sql: `DELETE FROM cart_items WHERE cart_id='${req.cookies.cart_id}' AND product_id=${productID}`}, (err, arr) => {
                if(err) {
                    console.log(err);
                }else{
                    console.log('successfully deleted from cart.');
                    res.redirect('/cart');
                }
            });
        }
    }
    else{
        res.redirect('/cart');
    }
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
}).post((req, res) => {
    //customer -> address -> orders -> ordersproducts (order_id cant be primary in ordersproducts, use a loop to insert multiple times. )
    if(req.cookies.cart_id){
        const first_name = req.body.c_fname;
        const last_name = req.body.c_lname;
        const email = req.body.c_email_address;
        const phone_number = req.body.c_phone;
        const city = req.body.c_city;
        const district = req.body.c_district;
        const neighborhood = req.body.c_neighborhood;
        const address = req.body.c_address;
        // console.log(c_fname, c_lname, c_email_address, c_phone, c_city, c_district, c_neighborhood, c_address);
        connection.query({sql: `INSERT INTO customers (first_name, last_name, email, phone_number) VALUES ('${first_name}', '${last_name}', '${email}', '${phone_number}')`}, (err, arr) => {
            if(err) {
                console.log(err);
            }else{
                console.log('inserted successfully to customers.');
                connection.query({sql: `SELECT LAST_INSERT_ID() INTO @last_customer_id`}, (err, arr) => {
                    if(err){
                        console.log(err);
                    }else{
                        console.log('last customer id is saved to last_customer_id variable.');
                        connection.query({sql: `INSERT INTO addresses (customer_id, city, district, neighborhood, address) 
                        VALUES(LAST_INSERT_ID(),'${city}', '${district}', '${neighborhood}', '${address}')`}, (err, arr) => {
                            if(err){
                                console.log(err);
                            }else{
                                console.log(`inserted successfully to address.`);
                                connection.query({sql: `INSERT INTO orders (customer_id, total_quantity, total_price, order_date)
                                VALUES (@last_customer_id, (SELECT SUM(quantity) FROM cart_items WHERE cart_id='${req.cookies.cart_id}'), (SELECT SUM(total) FROM cart_items WHERE cart_id='${req.cookies.cart_id}'), CURRENT_DATE())`}, (err, arr) => {
                                    if(err){
                                        console.log(err);
                                    }else{
                                        console.log('inserted successfully to orders');
                                        connection.query({sql: `SELECT LAST_INSERT_ID() INTO @last_order_id`}, (err, arr) => {
                                            if(err){
                                                console.log(err);
                                            }else{
                                                console.log('last order id is saved to last_order_id variable.');
                                                connection.query({sql: `SELECT product_id, quantity, total FROM cart_items WHERE cart_id='${req.cookies.cart_id}'`}, (err, arr) => {
                                                    if(err){
                                                        console.log(err);
                                                    }else{
                                                        arr.forEach(e => {
                                                            connection.query({sql: `INSERT INTO ordersproducts (order_id, product_id, quantity, total)
                                                            VALUES (@last_order_id, ${e.product_id}, ${e.quantity}, ${e.total})`}, (err, arr) => {
                                                                if(err){
                                                                    console.log(err);
                                                                }else{
                                                                    console.log('inserted to orderproducts successfully.');
                                                                    connection.query({sql: `UPDATE products as p1 JOIN products as p2 ON p1.product_id=p2.product_id SET p1.stock_quantity=(p2.stock_quantity - ${e.quantity}) WHERE p1.product_id=${e.product_id}`}, (err, arr) => {
                                                                        if(err){
                                                                            console.log(err);
                                                                        }else{
                                                                            console.log('stock quantity updated on products table.');
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        });
                                                        connection.query({sql: `DELETE FROM cart_items WHERE cart_id='${req.cookies.cart_id}'`}, (err, arr) => {
                                                            if(err){
                                                                console.log(err);
                                                            }else{
                                                                console.log('cart_id with corresponding cookie successfully deleted.');
                                                                res.redirect('/thankyou');
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        })
                    }
                });
            }
        });
    }else{
        res.redirect('/');
    }
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