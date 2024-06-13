
const express = require('express')
const app = express()

require('dotenv').config()

const cors = require('cors')

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
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
        const paymentsCollection = client.db('GreenLifeStyle').collection('payments')
        const announcementsCollection = client.db('GreenLifeStyle').collection('annoncements')
        const usersCollection = client.db('GreenLifeStyle').collection('users')
        const acceptedAgreementsCollection = client.db('GreenLifeStyle').collection('acceptedAgreements')


        // users

        app.post('/users', async (req, res) => {
            const user = req.body

            // checking already Exist or not

            const email = user?.email

            const query = {
                email: email
            }

            const isExist = await usersCollection.findOne(query)

            // do not insert the user if already exists in the database

            if (isExist) {

                return res.send({ message: 'Already exists in the database' })
            }

            // otherwise insert the user

            const result = await usersCollection.insertOne(user)

            res.send(result)
        })

        // checking role

        app.get('/users/:email', async (req, res) => {

            const email = req.params.email
            console.log(email)

            const query = { email: email }

            const isExist = await usersCollection.findOne(query)

            console.log(isExist)

            if (!isExist) {
                return
            }

            const role = isExist.role




            //    if the role is admin

            if (role === 'admin') {

                const inquiry = { role: 'member' }

                const members = await usersCollection.find(inquiry).toArray()

                return res.send({ role, members })
            }

            res.send({ role })


        })

        // remove the membership

        app.patch('/users/:email', async (req, res) => {

            const email = req.params.email

            const role = req.body.status

            console.log('email:', email, 'role :', role)


            // const query = { _id: new ObjectId(id) }
            
            const query = {
                email : email
            }

            console.log(query)

            const updateDoc = {
                $set: {
                    role: role
                }
            };

            const result = await usersCollection.updateOne(query, updateDoc)


            res.send(result)


        })


        // get the all apartments data

        app.get('/apartments', async (req, res) => {

            const page = parseInt(req.query.page)
            const size = parseInt(req.query.size)

            const result = await apartmentsCollection
                .find()
                .skip(page * size)
                .limit(size)
                .toArray()

            res.send(result)

        })



        // get the one apartment data by id

        app.get('/apartments/:id', async (req, res) => {

            const id = req.params.id

            const query = { _id: new ObjectId(id) }

            const result = await apartmentsCollection.findOne(query)

            res.send(result)

        })

        // insert the user information with apartment details

        app.post('/agreements/:email', async (req, res) => {

            const agreement = req.body
            const email = req.params.email

            // checking the apartment available or not 

            const query = { userEmail: email }
            const isExist = await agreementsCollection.findOne(query)

            if (isExist) {
                return res.send({ message: true })
            }

            // insert the agreement after checking the availability of the apartment

            const result = await agreementsCollection.insertOne(agreement)

            res.send(result)

        })


        // get the agreement

        app.get('/agreementsAll/:email', async (req, res) => {
            const email = req.params.email
            const query = { userEmail: email }

            const result = await agreementsCollection.findOne(query)

            res.send(result)



        })

        // agreements all

        app.get('/agreements', async (req, res) => {

            const result = await agreementsCollection.find().toArray()

            res.send(result)

        })

        // patch the agreements info

        app.patch('/agreements/:email', async (req, res) => {

            const email = req.params.email

            const status = req.body.status

            console.log('email:', email, 'role :', status)


            // const query = { _id: new ObjectId(id) }

            const query = {
                userEmail : email
            }

            console.log(query)

            const updateDoc = {
                $set: {
                    status : status
                }
            };

            const result = await agreementsCollection.updateOne(query, updateDoc)


            res.send(result)


        })

        // accepted agreements

        app.post('/acceptedAgreements', async(req,res)=> {
            const acceptedAgreement = req.body
            const result = await acceptedAgreementsCollection.insertOne(acceptedAgreement)

            res.send(result)
        })
        // accepted agreements

        app.get('/acceptedAgreements/:email', async(req, res) => {

            const email = req.params.email
            const query = {userEmail : email}
            
            const result = await acceptedAgreementsCollection.findOne(query)

            res.send(result)
        })

        // deleted the requested agreement after accepted or rejected

        app.delete('/agreements/:email', async(req, res)=> {

            const email = req.params.email
            const query = {userEmail : email}

            const result = await agreementsCollection.deleteOne(query)

            res.send(result)
            
        })






        //    announcement related api

        app.post('/announcements', async (req, res) => {

            const announcement = req.body
            const result = await announcementsCollection.insertOne(announcement)

            res.send(result)
        })

        app.get('/announcements', async (req, res) => {

            const result = await announcementsCollection.find().toArray()

            res.send(result)
        })


        // pagination related api
        app.get("/apartmentsCount", async (req, res) => {

            const count = await apartmentsCollection.estimatedDocumentCount()
            res.send({ count })
        })

        // payment intent

        app.post('/create-payment-intent', async (req, res) => {

            const { price } = req.body
            const amount = parseInt(price * 100)


            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            })


            res.send({
                clientSecret: paymentIntent.client_secret
            })



        })

        // payment save

        app.post('/payments', async (req, res) => {

            const payment = req.body

            const paymentResult = await paymentsCollection.insertOne(payment)

            // carefully delete each item from the cart

            //   const query = {
            //     _id : {
            //       $in : payment.cartId.map(id => new ObjectId(id) )
            //     }
            //   }

            //   const deleteResult = await cartCollection.deleteMany(query)

            res.send(paymentResult)


        })


        // get the all payments api

        app.get('/payments/:email', async (req, res) => {

            const email = req.params.email

            const query = { email: email }

            const result = await paymentsCollection.find(query).toArray()

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