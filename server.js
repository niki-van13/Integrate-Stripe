require('dotenv').config();
constfs = require("fs")
const express = require('express')
const stripe = require('stripe')(process.env.SUPER_SECRET_KEY);
const endpointSecret = process.env.WEBHOOK_SEC;
const port =  process.env.PORT
//const ports =  process.env.PORTS
const hostname = process.env.YOUR_DOMAIN
const app = express()
var http = require('http')
const https = require('https')
const fs = require('fs')




var httpServer = http.createServer(app);
//var httpsServer = https.createServer(credentials, app)



app.use('/', express.static('./client'))
app.use(express.json())

app.set('view engine','ejs')

app.get('/client/assets',function(req,res) {

    fs.readFile('data.json',function(error,data) {
        
        if(error) {
            
            res.status(500).end()
            
        }else {
            res.send(JSON.parse(data))
            console.log(data)
      }
    })
  })



// create a new costumer 
app.post("/create-customer",async (req, res) => {
  
   try {
		let email = req.body.email
		console.log(email)
		let existingCustomers = await stripe.customers.list({email : email});
		let newCustomer = ""
		if(existingCustomers.data.length){
		const custumerId = existingCustomers.data[0].id
		console.log("User Exits ID:"+ custumerId)
		res.status(200).json(custumerId);
		}else{
			let customer =  await stripe.customers.create({
				email: req.body.email,
				name: req.body.name,
				phone: req.body.phone,
			});
			newCustomer = customer.id
			console.log("New Customer ID:" + newCustomer)
			res.status(200).json(newCustomer);
			}
			
	}catch (err){
		res.status(404).json(err)
		console.log(err)
	}
})



// create checkout-session
  app.post("/create-checkout-session", async (req, res) => {
    let payedItems = req.body.cart;
	let  itemsToPay = [];
      payedItems.forEach((item) => {
      
      let items = {
        price_data: {
          currency: "sek",
          product_data: {
            name: item.title,
            description: item.description,          
           
          },
          unit_amount: item.price * 100
        },
        quantity: 1, 

      };
      itemsToPay.push(items);     
 });


const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: itemsToPay,
        customer: req.body.customerId,
        mode: "payment",
        submit_type: 'pay',
        success_url: "http://" + hostname + ":" + port + "/success?session_id={CHECKOUT_SESSION_ID}",
		cancel_url:  "http://" + hostname + ":" + port + "/cancel.html",
      });
	  console.log(session)
      res.status(200).json(session.id);
});

app.get("/orderlist", (req, res) => {
  
  let tojson = []
	const rdata = fs.readFileSync('client/db/orders.json','utf8');
		tojson = JSON.parse(rdata)
		
  try {
    res.json(tojson)
  } catch (err) {
    res.status(500).json(err.message)
  }
})

app.get('/success', async (req, res) => {
  const session = await stripe.checkout.sessions.retrieve(req.query.session_id, {
    expand: ['line_items'],
  });
  const customer = session.customer_details.name

  res.send(`
  <!DOCTYPE html>
<html>
<head>
  <title>TechStore</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header>
    <h1 onclick="createUIFromLoadedItemsData()">TechStore</h1>
      <span id="counter"></span> <i class="techstore-check" aria-hidden="true"></i>
    </a>
  </header>
 <mainS>
    <section>
      <h4>

        Thanks for your order!
		<h1>
		${customer} 
        </h1>
      </h4>
        <h4>
          <a href="index.html">Click here to return to store</a> 

        </h4>      
    </section>
  </mainS>

  
</body>
</html>
  `);



  
  var order  = []
  //console.log(session.line_items)
  var orders  = []
	order = {
	  payment_intent: session.payment_intent,
	  email: session.customer_details.email,
	  name: session.customer_details.name,
	  phone:session.customer_details.phone,
	  country:session.customer_details.address.country,
	  currency:session.currency,
	  total:session.amount_total
	  
	}
	let itemText =""
	let itemCount = 0
	session.line_items.data.forEach((data) => {
	 itemText  +=  session.line_items.data[itemCount].description + " Qt:" + session.line_items.data[itemCount].quantity + " / "
	 itemCount++
	
	});
	 order.itemDetails = itemText
	 console.log(order)
	 let data = JSON.stringify(order)
	 
	//check if file exist
	if (!fs.existsSync('client/db/orders.json')) {
		//create new file if not exist
		fs.closeSync(fs.openSync('client/db/orders.json', 'w'));
	}	
	var searchID = 0
	let tojson = []
	const rdata = fs.readFileSync('client/db/orders.json','utf8');
		tojson = JSON.parse(rdata)		
	//if page refreshed etc..
	tojson.forEach(post => {
		if(post.payment_intent.includes(order.payment_intent))
		{searchID = 1 }
	});
	if (searchID) {
	console.log("Order already added..")
	}else {
	tojson.push(order)
	let toraw = JSON.stringify(tojson)	
	fs.writeFileSync("client/db/orders.json", toraw)
	console.log("New Order added")
	}
		
});



app.post('/webhook', express.raw({type: 'application/json'}), (request, response) => {
  let event = request.body;
  console.log(endpointSecret)
  // Only verify the event if you have an endpoint secret defined.
  // Otherwise use the basic event deserialized with JSON.parse
  if (endpointSecret) {
    // Get the signature sent by Stripe
    const signature = request.headers['stripe-signature'];
    try {
      event = stripe.webhooks.constructEvent(
        request.body,
        signature,
        endpointSecret
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`, err.message);
      return response.sendStatus(400);
    }
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
      // Then define and call a method to handle the successful payment intent.
      // handlePaymentIntentSucceeded(paymentIntent);
      break;
    case 'payment_method.attached':
      const paymentMethod = event.data.object;
      // Then define and call a method to handle the successful attachment of a PaymentMethod.
      // handlePaymentMethodAttached(paymentMethod);
      break;
	case 'payment_intent.payment_failed':
      intent = event.data.object;
      const message = intent.last_payment_error && intent.last_payment_error.message;
      console.log('Failed:', intent.id, message);
      break;
    default:
      // Unexpected event type
      console.log(`Unhandled event type ${event.type}.`);
  }
  response.send();
});    

httpServer.listen(port);
//httpsServer.listen(ports);
console.log(`Server running at http:// ${hostname} ${port}`);



