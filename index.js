require('dotenv').config();
const express = require('express')
const cors = require('cors')
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY)
var bodyParser = require('body-parser')
const { MongoClient, ServerApiVersion } = require('mongodb');
const { ObjectId } = require('mongodb');
const port = 5000

const app = express()
app.use("/stripe", express.raw({ type: "*/*" }));
app.use(bodyParser.json());
app.use(cors());
app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.post("/buy", async (req, res) => {
    try {
      // Getting data from client
      let { phone, amount } = req.body;
      // Simple validation
      if (!phone || !amount)
        return res.status(400).json({ message: "Invalid data" });
      amount = parseInt(amount);
  
      // Initiate payment
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "INR",
        payment_method_types: ["card"],
        metadata: { phone, amount },
      });
      // Extracting the client secret
      const clientSecret = paymentIntent.client_secret;
      // Sending the client secret as response
      res.json({ message: "Payment initiated", clientSecret });
    } catch (err) {
      // Catch any error and send error 500 to client
      console.error(err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });
  
  // Webhook endpoint
  app.post("/stripe", async (req, res) => {
    // Get the signature from the headers
    const sig = req.headers["stripe-signature"];
  
    let event;
  
    try {
      // Check if the event is sent from Stripe or a third party
      // And parse the event
      event = await stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      // Handle what happens if the event is not from Stripe
      console.log(err);
      return res.status(400).json({ message: err.message });
    }
    // Event when a payment is initiated
    if (event.type === "payment_intent.created") {
      console.log(`${event.data.object.metadata.coin} payment initated!`);
    }
    // Event when a payment is succeeded
    if (event.type === "payment_intent.succeeded") {
      // fulfilment
      console.log(`${event.data.object.metadata.coin} payment succeeded!`);
    }
    res.json({ ok: true });
  });




const uri = "mongodb+srv://partha:1234@cluster0.evqd2jk.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
client.connect(err => {
    console.log('conn');
    const collection = client.db("tournament").collection("user");
    const matchCollection = client.db("tournament").collection("match");
    const orderCollection = client.db("tournament").collection("order");
     

    app.post('/register', (req, res) => {
        const User = req.body;
        console.log(User)
        //res.send('Hello World!')
        console.log(User)
        collection.findOne({ email: User.email }, (err, user) => {
            if (user) {
                console.log(user)
                res.send({ massage: "User Already Registered" })
            } else {
                collection.insertOne(User)

                    .then(result => {
                        console.log(result);
                        res.send({ massage: 'Successfully Registered' })
                    })
            }
        })
    })
    app.post('/login', (req, res) => {
        const { email, password } = req.body
        console.log(req.body);
        collection.findOne({ email: email }, (err, user) => {
            console.log(user)
            if (user) {
                if (password === user.password) {
                    res.send({ massage: "User Login Successfully", user: user })
                } else {
                    res.send({ massage: 'Password Not Match' })
                }
            } else {
                res.send({ massage: 'User Not Registered' })
            }
        })
    })


    //add match

    app.post('/addMatch', (req, res) => {
        const match = req.body
        matchCollection.insertOne(match)
            .then(result => {
                console.log(result);
                res.send({ massage: 'Successfully Add Match' })

            })
    })

    // add order

    app.post('/addOrder', (req, res) => {
        const order = req.body
        orderCollection.insertOne(order)
            .then(result => {
                console.log(result);
                res.send({ massage: 'Order Successfully' })

            })
    })


    //get match
    app.get("/getMatch", (req, res) => {
        matchCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    })

    //

    app.get("/getOrder", (req, res) => {
        orderCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    })

    // edit room id and pass 

    app.patch("/edit/:id",(req,res)=>{
        orderCollection.updateOne({ _id: ObjectId(req.params.id) },
        {
          $set:{roomID:req.body.roomID , roomPass: req.body.roomPass}
        })
        .then(result=>{
          res.send(result);
        })
      })

    // delete

    app.delete("/delete/:id", (req, res) => {
        console.log(req.params.id)
        matchCollection.deleteOne({ _id: ObjectId(req.params.id) })
            .then(result => {
                res.send(result)
            })
    })

    // stripe payment

    app.post('/pay', async (req , res)=>{
        try {
            const {phone} = req.body;
            if(!phone) return res.status(400).json({message:'Enter name'})
            const paymentIntent = await stripe.paymentIntents.create({
                amount: 500,
                currency:'usd',
                payment_method_types:["card"],
                metadata:{phone}
            });
            const clientSecret = paymentIntent.client_secret;
            res.json({message:'Payment initiated', clientSecret});
        } catch (error) {
            console.error(error);
            res.status(500).json({message:'Internal Error'});
        }
    })


});


app.listen(port,() => {
    console.log(`Example app listening on port ${port}`)
})