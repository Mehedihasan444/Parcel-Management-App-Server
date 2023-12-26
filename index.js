const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());

const uri = `mongodb+srv://${process.env.DATABASE_LOCAL_USERNAME}:${process.env.DATABASE_LOCAL_PASSWORD}@cluster0.6egtgqe.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const userCollection = client.db("parcelManagementDB").collection("users");
    const bookingCollection = client.db("parcelManagementDB").collection("bookings");
    const paymentCollection = client.db("parcelManagementDB").collection("payments");

    // user related api
    app.post("/api/v1/users", async (req, res) => {
      const user = req.body;
      // insert email if user doesnt exists:
      // you can do this many ways (1. email unique, 2. upsert 3. simple checking)
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists", insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    app.get("/api/v1/users/admin", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });
    app.get("/api/v1/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await userCollection.findOne(query);
      res.send(result);
    });
    app.patch("/api/v1/users/:email", async (req, res) => {
      const email = req.params.email;
      const data = req.body;
      const filter = { email: email };
      if (!data.role) {
      const updatedDoc = {
        $set: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          image: data.image,
        },
      };
      }
      const updatedDoc = {
        $set: {
          role: data.role,
        },
      };
      
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // user booking related api
    app.post("/api/v1/users/bookings", async (req, res) => {
      const data = req.body;
      // console.log(data);
      const result = await bookingCollection.insertOne(data);
      res.send(result);
    });

    app.get("/api/v1/users/admin/bookings", async (req, res) => {
      const result = await bookingCollection.find().toArray();
      console.log(result);
      res.send(result);
    });
    app.get("/api/v1/users/bookings/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await bookingCollection.find(query).toArray();
      // console.log(result)
      res.send(result);
    });
    app.delete("/api/v1/users/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      // console.log(result)
      res.send(result);
    });
    app.patch("/api/v1/users/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id)};
      const updatedDoc = {
        $set: {
         status:'On The Way'
        },
      };
      const result = await bookingCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });



    // admin related api
    app.get("/api/v1/admin/deliveryMens", async (req, res) => {
      const query={role: 'deliveryMen'}
      const result = await userCollection.find(query).toArray();
      console.log(result);
      res.send(result);
    });



    // DeliveryMen related api
    app.get("/api/v1/deliveryMen/deliveryList/:email", async (req, res) => {
     
    
    });
    app.get("/api/v1/deliveryMen/delivery/reviews/:email", async (req, res) => {
     
    
    });
    app.delete("/api/v1/deliveryMen/deliveryList/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
     
    
    });




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
app.get("/", (req, res) => {
  res.send("Parcel management server is running");
});

app.listen(port, () => {
  console.log(`server is running on port: ${port}`);
});
