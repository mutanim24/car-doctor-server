const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors())
app.use(express.json())

// car_doctor
// prwlpyrtctY6WGLW



const uri = `mongodb+srv://${process.env.CAR_USER}:${process.env.CAR_PASS}@cluster0.z12trsh.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const verifyJwt = (req, res, next) => {
    const authorization = req.headers.authorization;
    if(!authorization){
        return res.status(401).send({error: true, message: 'unauthorize access'})
    }
    const token = authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decode) => {
        if(error){
            return res.status(401).send({error: true, message: 'unauthorize access'})
        }
        req.decoded = decode;
        next();
    })
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        

        const servicesCollection = client.db("carDoctor").collection("services");
        const bookCollection = client.db("carDoctor").collection("booking");

        app.get('/services', async (req, res) => {
            const cursor = servicesCollection.find();
            const result = await cursor.toArray();
            res.send(result)
        })

        // booking
        app.get('/book/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await servicesCollection.findOne(query);
            res.send(result);
        })

        app.get('/booking', verifyJwt, async (req, res) => {
            const decoded = req.decoded;
            console.log('after verify')
            if(decoded.email !== req.query.email){
                return res.status(403).send({error : 1, message: 'forbidden access'})
            }
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await bookCollection.find(query).toArray();
            res.send(result);
        })

        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const result = await bookCollection.insertOne(booking);
            res.send(result);

        })

        app.patch('/booking/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(req.body);
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    status: 'confirmed',
                }
            }
            const result = await bookCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        app.delete('/booking/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await bookCollection.deleteOne(query);
            res.send(result);
        })

        // jwk authorization
        app.post('/jwk', (req, res) => {
            const user = req.body;
            console.log(user)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({token})
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
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})