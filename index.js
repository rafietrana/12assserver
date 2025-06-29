const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://my-ass-12-1aa68.web.app",
      "https://my-ass-12-1aa68.firebaseapp.com",
    ],
  })
);
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
    const bannerCollection = client.db("LastDB").collection("banners");
    const testCollection = client.db("LastDB").collection("tests");
    const reserveCollcetion = client.db("LastDB").collection("reserve");
    const userCollection = client.db("LastDB").collection("users");
    const productCollection = client.db("LastDB").collection("productData");
    const paymentCollection = client
      .db("LastDB")
      .collection("paymentInformation");
    // jwt start
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCES_TOKEN_SECRET, {
        expiresIn: "45h",
      });
      res.send({ token });
    });

    // this is middleware

    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res
          .status(401)
          .send({ message: "i not fond token unothorize access" });
      }

      const toekenId = req.headers.authorization.split(" ")[1];
      jwt.verify(toekenId, process.env.ACCES_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res
            .status(401)
            .send({ message: "I cannot verify your code unothorized Access" });
        }
        req.decoded = decoded;
        next();
      });
    };
    const verifyEmail = (req, res, next) => {
      const email = req.params.email || req.body.email || req.query.email;

      if (req.decoded.email !== email)
        return res
          .status(403)
          .send({ message: "Forbidden access Your Email Is Not Valid" });

      next();
    };

    app.post("/setbanner", async (req, res) => {
      const bannerData = req.body;
      try {
        const result = await bannerCollection.insertOne(bannerData);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    app.get("/getbanner", verifyToken, verifyEmail, async (req, res) => {
      try {
        const result = await bannerCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    // post Product data  on mongodb

    app.post("/postProducts", async (req, res) => {
      const productData = req?.body;
      try {
        const result = await productCollection.insertOne(productData);
        res.send(result);
      } catch (error) {
        res
          .status(500)
          .send({ message: `i have found an error this error is:${error}` });
      }
    });

    // get productdata on mongodb
    app.get("/getProducts", async (req, res) => {
      try {
        const result = await productCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send(error);
      }
    });

    // getOne Product Data from mongodb

    app.get("/getOneProduct/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await productCollection.findOne(query);

        if (!result) {
          return res.status(404).send({ message: "Product not found" });
        }

        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Server error", error: error.message });
      }
    });

    // update product stock quality when data sucessfully pay

    app.patch("/updateProductStock", async (req, res) => {
      const { productId, quantity } = req.body;
      if (!productId || !quantity) {
        return res
          .status(400)
          .send({ success: false, message: "Missing productId or quantity" });
      }

      try {
        const query = { _id: new ObjectId(productId) };

        const updateDoc = { $inc: { stock: -parseInt(quantity) } };

        const result = await productCollection.updateOne(query, updateDoc);

        res.send(result);
      } catch (err) {
        // $&

        res.status(500).send({
          success: false,
          message: "Internal server error",
          error: err.message,
        });
      }
    });

    // post clintInformation after sucessfully pay payment

    app.post("/postPaymentInformation", async (req, res) => {
      const { clientInformationData } = req.body;
      // $&

      const result = await paymentCollection.insertOne(clientInformationData);
      // $&

      res.send(result);
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
      const result = await reserveCollcetion.deleteOne(query);
      res.send(result);
    });

    app.get("/gettestall", verifyToken, verifyEmail, async (req, res) => {
      try {
        const page = parseInt(req.query.page) || 0;
        const size = parseInt(req.query.size) || 2;

        const totalDocuments = await testCollection.countDocuments();
        const tests = await testCollection
          .find()
          .skip(page * size)
          .limit(size)
          .toArray();

        res.send({ totalDocuments, tests });
      } catch (error) {
        res.status(500).send(error.toString());
      }
    });

    app.get("/datequery", async (req, res) => {
      const result = await testCollection.find().toArray();
      res.send(result);
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
    app.get("/getusertestresult/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const result = await reserveCollcetion.find(query).toArray();
      res.send(result);
    });

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
    // increment
    app.put("/incrementcount/:id", async (req, res) => {
      const id = req.params.id;
      const result = await testCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $inc: { count: 1 } }
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

    // increment Count
    app.put("/incrementcount");

    // get user uppcomming appoinment data

    app.get("/getuserreserve/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const result = await reserveCollcetion.find(query).toArray();
      res.send(result);
    });

    // post userinforamtion

    app.post("/postuserinfo", async (req, res) => {
      const singupInfo = req.body;
      const result = await userCollection.insertOne(singupInfo);
      res.send(result);
    });

    app.get(
      "/getuserinfo/:email",
      verifyToken,
      verifyEmail,
      async (req, res) => {
        const email = req.params.email;
        const query = { email: email };
        const result = await userCollection.findOne(query);
        res.send(result);
      }
    );
    // UpdateUserInfomation
    app.put("/updateuserinfo/:id", async (req, res) => {
      const id = req.params.id;
      const userData = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          name: userData.name,
          Image: userData.image,
          upozilla: userData.upozilla,
          district: userData.district,
          bloodGroup: userData.bloodGroup,
          district: userData.district,
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // get sort fetured date
    app.get("/getsortfeturedid", async (req, res) => {
      const items = await testCollection.find({ count: { $gt: 0 } }).toArray();
      const sortedItems = items.sort((a, b) => b.count - a.count);
      res.send(sortedItems);
    });

    // getalluser
    app.get("/getalluser", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });
    // get single user

    app.get("/getsingleuser/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    // blocked user
    app.put("/blockuser/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await userCollection.updateOne(filter, {
        $set: { userStatus: "blocked" },
      });
      res.send(result);
    });
    // blocked user
    app.put("/unBlockuser/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await userCollection.updateOne(filter, {
        $set: { userStatus: "active" },
      });
      res.send(result);
    });

    app.get("/userdetails/:userId", async (req, res) => {
      const id = req.params.userId;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.findOne(query);
      res.send(result);
    });
    // gettestdata
    app.get("/testdetails/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const result = await reserveCollcetion.find(query).toArray();
      res.send(result);
    });

    // serchreservation by email

    app.get("/searchbyemail/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const result = await reserveCollcetion.find(query).toArray();
      res.send(result);
    });
    // Check user admin
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;

      const query = { email: email };
      const user = await userCollection.findOne(query);

      let admin = false;

      if (user && user?.role === "admin") {
        admin = true;
      }

      res.send({ admin });
    });

    app.get("/getloginuser/:email", async (req, res) => {
      const email = req.params.email;

      const query = { email: email };
      const result = await userCollection.findOne(query);
      res.send(result);
    });
    // Pagination

    app.get("/productscount", async (req, res) => {
      const count = await testCollection.estimatedDocumentCount();
      res.send({ count });
    });

    app.patch("/makeadmin/:id", async (req, res) => {
      const id = req.params.id;
      const fillter = { _id: new ObjectId(id) };
      const result = await userCollection.updateOne(fillter, {
        $set: { role: "admin" },
      });
      res.send(result);
    });

    app.get("/singlereserve/:testid", async (req, res) => {
      const testids = req.params.testid;
      const query = { testId: testids };
      const result = await reserveCollcetion.find(query).toArray();
      res.send(result);
    });

    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    app.listen(port, () => {
      // $&
    });
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("alhamdulillah my assignment 12 is now running alhamdulillah");
});
