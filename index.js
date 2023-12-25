const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken');
const app = express()
const port = process.env.PORT || 5000;




app.use(cors({
  origin: [
    'http://localhost:5173',
  ],
  credentials: true
}))
app.use(express.json());




const uri = `mongodb+srv://${process.env.DATABASE_LOCAL_USERNAME}:${process.env.DATABASE_LOCAL_PASSWORD}@cluster0.6egtgqe.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const userCollection = client.db("parcelManagementDB").collection("users");
    const bookingCollection = client.db("parcelManagementDB").collection("bookings");
    const paymentCollection = client.db("parcelManagementDB").collection("payments");



    app.post('/api/v1/users/bookings',async (req,res)=>{

      const data = req.body;
      // console.log(data);
      const result = await bookingCollection.insertOne(data);
      res.send(result);
    })

    app.get('/api/v1/users/bookings/:email',async (req,res)=>{
const email = req.params.email;
const query = {email:email}
            const result = await bookingCollection.find(query).toArray();
            console.log(result)
      res.send(result);
    })
   



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
app.get('/', (req, res) => {
  res.send('Parcel management server is running')
})

app.listen(port, () => {
  console.log(`server is running on port: ${port}`);
})