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
    const reviewCollection = client.db("parcelManagementDB").collection("reviews");
    const paymentCollection = client.db("parcelManagementDB").collection("payments");




    // jwt related api
    app.post('/api/v1/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.send({ token });
    })

    // middlewares 
    const verifyToken = (req, res, next) => {
      // console.log('inside verify token', req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
      })
    }

    // use verify admin after verifyToken
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }






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
    app.post("/api/v1/users/reviews", async (req, res) => {
      const user = req.body;
      console.log(user)
      const result = await reviewCollection.insertOne(user);
      res.send(result);
    });
    app.patch("/api/v1/users/:email", async (req, res) => {
      const email = req.params.email;
      const data = req.body;
      const filter = { email: email };
      const updatedDoc = {
        $set: {
          role: data.role,
        },
      };

      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });
    app.put("/api/v1/users/updateProfile/:email", async (req, res) => {
      const email = req.params.email;
      const data = req.body;
      const filter = { email: email };
      const options = { upsert: true }
     
        const updatedDoc = {
          $set: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            image: data.image,
          },
        };
    
   

      const result = await userCollection.updateOne(filter, updatedDoc,options);
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
      // console.log(result);
      res.send(result);
    }); ///---------------
    app.get("/api/v1/users/bookings/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await bookingCollection.find(query).toArray();
      // console.log(result)
      res.send(result);
    });
    app.get("/api/v1/users/booking/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.findOne(query);
      //console.log(result);
      res.send(result);
    });
    app.patch("/api/v1/users/bookings/assign/deliveryMen/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const filter = { _id:new ObjectId(id) };
      // const options = {upsert:true };
      const updatedDoc = {
        $set: {
          status: "On The Way",
          deliveryMenID: data.selectedDeliveryMen,
          approximateDeliveryDate:data.approximateDeliveryDate
        },
      };
      const result = await bookingCollection.updateOne(filter, updatedDoc);
      console.log(id,result)
      res.send(result);
    });
    app.delete("/api/v1/users/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      // console.log(result)
      res.send(result);
    });
    
    app.patch("/api/v1/users/updateBooking/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          phone: data?.phone,
          parcelType: data?.parcelType,
          receiverName: data?.receiverName,
          weight: data?.weight,
          receiverPhone: data?.receiverPhone,
          deliveryAddressLatitude: data?.deliveryAddressLatitude,
          deliveryAddressLongitude: data?.deliveryAddressLongitude,
          requestedDeliveryDate: data?.requestedDeliveryDate,
          bookingDate: data?.bookingDate,
          price: data?.price,
        },
      };
      const result = await bookingCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // admin related api
    app.get("/api/v1/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { 
        email: email,
        role: "admin"
       };
      const result = await userCollection.findOne(query);
      //console.log(result);
      if (result) {
        res.send({admin:true});
        
      }
      else {
        res.send({admin:false});
      }
      // res.send(result);
    });
app.get('/api/v1/admin/users/collection', async (req, res) => {
  const query = { role: "user" };
  const result = await userCollection.find(query).toArray();
  //console.log(result);
  res.send(result);
})
   

    // DeliveryMen related api
    app.get("/api/v1/deliveryMen/:email", async (req, res) => {
      const email = req.params.email;
      const query = { 
        email: email,
        role: "deliveryMen"
       };
      const result = await userCollection.findOne(query);
      //console.log(result);
      if (result) {
        res.send({deliveryMen:true});
        
      }
      else {
        res.send({deliveryMen:false});
      }
      // res.send(result);
    });
    app.get("/api/v1/users/admin/deliveryMens", async (req, res) => {
      const query = { role: "deliveryMen" };
      const result = await userCollection.find(query).toArray();
      //console.log(result);
      res.send(result);
    });
    app.get("/api/v1/users/deliveryMen/deliveryList/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id)
      const query = {  deliveryMenID:id,status:'On The Way' };
      const result = await bookingCollection.find(query).toArray();
      // console.log(result)
      res.send(result);
    });
    app.get("/api/v1/deliveryMen/delivery/count/:id",async (req, res) => {
        const id = req.params.id;
        const query = {
          deliveryMenID: id,
        status:'delivered'
        };
        const result = await bookingCollection.find(query).toArray();
        // console.log(result)
        res.send(result);
      }
    );
    app.patch("/api/v1/deliveryMen/deliveryList/cancel/deliver/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: data.status,
        },
      };
      const result = await bookingCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })
    app.get("/api/v1/delivery/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { deliveryMenID: id };
      const result = await reviewCollection.find(query).toArray();
      res.send(result);
    });
     //working
app.patch("/api/v1/deliveryMen/reviews/average/:id",async (req, res) => {
  const id = req.params.id;
  const data = req.body;
  const filter = { _id: new ObjectId(id),
  role:'deliveryMen' 
  };
  const updatedDoc = {
    $set: {
      avgRating: data.rating,
    },
  };
  const result = await userCollection.updateOne(filter, updatedDoc);
  res.send(result);
})
app.patch("/api/v1/deliveryMen/parcel/delivered/:id",async (req, res) => {
  const id = req.params.id;
  const data = req.body;
  const filter = { _id: new ObjectId(id),
  role:'deliveryMen' 
  };
  const updatedDoc = {
    $set: {
      parcelDelivered: data.parcelDelivered,
    },
  };
  const result = await userCollection.updateOne(filter, updatedDoc);
  res.send(result);
})


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
