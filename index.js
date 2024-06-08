
const express = require('express')
const app = express()
require('dotenv').config()
const cors = require('cors')

const port = process.env.PORT || 5000

// 2QeH9UkVq61CnU4A
// GreenLifeStyle


// middleware

app.use(cors())
app.use(express.json())



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.k8vw6eq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

        const apartmentsCollection = client.db('GreenLifeStyle').collection('apartments')
        const agreementsCollection = client.db('GreenLifeStyle').collection('agreements')

        // get the all apartments data

        app.get('/apartments', async(req, res)=> {

            const result = await apartmentsCollection.find().toArray()

            res.send(result)

        })

        // get the one apartment data by id

        app.get('/apartments/:id', async(req, res)=> {

            const id = req.params.id

            const query = {_id : new ObjectId(id)}

            const result = await apartmentsCollection.findOne(query)

            res.send(result)

        })

        // insert the user information with apartment details

        app.post('/agreements', async(req, res)=> {

            const agreement = req.body

            // checking the apartment available or not 

            const query = {apartmentNo : agreement.apartmentNo}
            const isExist = await agreementsCollection.findOne(query)

            if(isExist){
                return res.send({message : true})
            }

            // insert the agreement after checking the availability of the apartment

            const result = await agreementsCollection.insertOne(agreement)
           
            res.send(result)

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



// creating initial server

app.get('/', async (req, res) => {
    res.send('Assignment twelve is running')
})

app.listen(port, () => {
    console.log(`assignment twelve is running on server ${port}`)
})