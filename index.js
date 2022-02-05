require("dotenv").config();
const express = require("express");
const cors = require('cors');
const { MongoClient, ObjectId } = require("mongodb");

const router = express.Router('');
const app = express();

app.use(express.json());
app.use(cors());
app.use('/api/clients', router);

const clientPromise = MongoClient.connect(process.env.DB_URI, {
  useUnifiedTopology: true,
  maxPoolSize: 10,
});

router.use(async (req, res, next) => {
  try {
    const client = await clientPromise;
    req.db = client.db("Clients");

    next();
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res) => {
  try {
    const db = req.db;
    const clients = await db.collection("clients").find().toArray();

    if (req.query.search) {
      const search = req.query.search.trim().toLowerCase();

      const clientsList = clients.filter(client => [
        client.name,
        client.surname,
        client.lastName,
        ...client.contacts.map(({ value }) => value)
      ]
        .some(str => str.toLowerCase().includes(search))
      );

      res.send(clientsList);
      return;
    };

    res.send(clients);
  } catch (error) {
    console.log(error);
  }
});

router.post("/", async (req, res) => {
  try {
    const data = req.body;
    const db = req.db;

    data.createdAt = new Date().toISOString();
    data.updatedAt = new Date().toISOString();

    await db.collection("clients").insertOne(data);
  } catch (error) {
    console.log(error);
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { name, surname, lastName, contacts } = req.body;
    const db = req.db;

    await db.collection("clients").updateOne(
      { _id: ObjectId(req.params.id) },
      {
        $set: {
          name,
          surname,
          lastName,
          contacts,
          updatedAt: new Date().toISOString()
        },
      }
    );
  } catch (error) {
    console.log(error);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const db = req.db;

    db.collection("clients").deleteOne({ _id : ObjectId(req.params.id) });
  } catch (error) {
    console.log(error);
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`  Listening on http://localhost:${port}`);
});
