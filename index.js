const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
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
    app.get('/getalltest', async(req, res)=>{
            const result = await testCollection.find().toArray()
            res.send(result)

    })




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
