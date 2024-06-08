const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hv89ofo.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const bannerCollection = client.db("LastDB").collection("banners");
    const testCollection = client.db("LastDB").collection("tests");
    const reserveCollcetion = client.db("LastDB").collection("reserve");

    app.post("/setbanner", async (req, res) => {
      const bannerData = req.body;
      try {
        const result = await bannerCollection.insertOne(bannerData);
        res.send(result);
      } catch (error) {
        console.error("Error inserting banner:", error);
        res.status(500).send({ message: error.message });
      }
    });

    app.get("/getbanner", async (req, res) => {
      try {
        const result = await bannerCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching banners:", error);
        res.status(500).send({ message: error.message });
      }
    });

    app.put("/updateisactive/:id", async (req, res) => {
      const id = req.params.id;
      try {
        await bannerCollection.updateMany({}, { $set: { isActive: false } });
        const result = await bannerCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { isActive: true } }
        );

        if (result.matchedCount === 0) {
          res.status(404).send("Document ami  pai ni ");
        } else {
          res.status(200).send("Document updated successfully Alhamdulillah");
        }
      } catch (error) {
        console.error("Error updating banner:", error);
        res.status(500).send({ message: error.message });
      }
    });

    app.get("/getactivebanner", async (req, res) => {
      try {
        const result = await bannerCollection.findOne({ isActive: true });
        if (result) {
          res.send(result);
        } else {
          res
            .status(404)
            .send({ message: "No active banner found no probleme " });
        }
      } catch (error) {
        console.error("Error fetching active banner try agin:", error);
        res.status(500).send({
          message: "An error occurred while fetching the active banner",
        });
      }
    });
    //   post test data
    app.post("/posttestdata", async (req, res) => {
      const testData = req.body;
      const result = await testCollection.insertOne(testData);
      res.send(result);
    });

    // get all test
    app.get("/getalltest", async (req, res) => {
      const result = await testCollection.find().toArray();
      res.send(result);
    });
    // gettest data
    app.get("/gettest/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await testCollection.findOne(query);
      res.send(result);
    });

    // update test  single data

    app.patch("/updatetest/:id", async (req, res) => {
      console.log("update method is now hitting");
      const id = req.params.id;
      const updateTestInfo = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          testname: updateTestInfo.testname,
          testdetails: updateTestInfo.testdetails,
          testprice: updateTestInfo.testprice,
          bannerimg: updateTestInfo.bannerimg,
          slotsnumber: updateTestInfo.slotsnumber,
          date: updateTestInfo.date,
        },
      };

      const result = await testCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // user deshboard all croud operation in here
    app.delete("/deleteuserappoinment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await reserveCollcetion.deleteMany(query);
      res.send(result);
    });

    app.get("/gettestall", async (req, res) => {
      try {
        const today = new Date();
        // const previousDate = today.setDate(today.getDate() - 1);
        const newISODate = new Date(today).toISOString();

        let query = {
          date: { $gte: newISODate },
        };

        const result = await testCollection.find(query).toArray();

        res.send(result);
      } catch (error) {
        res.status(500).send(error.toString());
      }
    });

    app.get("/datequery", async (req, res) => {
              const result = await testCollection.find().toArray();
              res.send(result)
    });

 
 
  

    //delete test data
    app.delete("/deletetest/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await testCollection.deleteOne(query);
      res.send(result);
    });

    // post reserve data
    app.post("/reservepost", async (req, res) => {
      const reservedata = req.body;
      const result = await reserveCollcetion.insertOne(reservedata);
      res.send(result);
    });

    // get reserve data
    app.get("/getreserve", async (req, res) => {
      const result = await reserveCollcetion.find().toArray();
      res.send(result);
    });

    // getusertestresutl 
    app.get('/getusertestresult/:email', async(req, res)=>{
            const email= req.params.email;
            const query = {userEmail: email};
            const result = await reserveCollcetion.find(query).toArray()
            res.send(result)
    })

    // add new key
    app.patch("/updateField/:id", async (req, res) => {
      const { id } = req.params;
      const { link } = req.body;

      try {
        const updateResult = await reserveCollcetion.updateOne(
          { _id: new ObjectId(id) },
          { $set: { testResult: link } }
        );

        if (updateResult.matchedCount === 0) {
          return res.status(404).send(" i not found your documnet ");
        }

        if (updateResult.modifiedCount > 0) {
          const statusUpdateResult = await reserveCollcetion.updateOne(
            { _id: new ObjectId(id) },
            { $set: { reportStatus: "delivered" } }
          );

          if (statusUpdateResult.modifiedCount > 0) {
            return res
              .status(200)
              .send(
                "alhamdulillah feild and report status updated successfully "
              );
          } else {
            return res
              .status(500)
              .send("Field added but report status update failed");
          }
        } else {
          return res.status(500).send("Field addition failed");
        }
      } catch (err) {
        console.error("Error updating document", err);
        res.status(500).send("Internal Server Error");
      }
    });
    // delete reseve data
    app.delete("/deletereseve/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await reserveCollcetion.deleteOne(query);
      res.send(result);
    });

    // alhamdulillah payment intent start
    app.post("/create-payment-intent", async (req, res) => {
      const price = req.body.price;
      const priceInCent = parseFloat(price) * 100;
      if (!price || priceInCent < 1) return;

      const { client_secret } = await stripe.paymentIntents.create({
        amount: priceInCent,
        currency: "usd",

        automatic_payment_methods: {
          enabled: true,
        },
      });
      // send client secret as response
      res.send({ clientSecret: client_secret });
    });

    // decrement any data this is very importent

    app.put("/decrementslots/:id", async (req, res) => {
      const id = req.params.id;

      const result = await testCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $inc: { slotsnumber: -1 } }
      );
      res.send(result);
    });
    // app get
    app.get("/serchbydate", async (req, res) => {
      const date = req.body;
      const query = { date: date };
      const result = await reserveCollcetion.find(query).toArray();
      res.send(result);
    });

    // get user uppcomming appoinment data

    app.get("/getuserreserve/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const result = await reserveCollcetion.find(query).toArray();
      res.send(result);
    });

    // post reserve data

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    app.listen(port, () => {
      console.log(`Your port is running on ${port}`);
    });
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("alhamdulillah my assignment 12 is now running alhamdulillah");
});
