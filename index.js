
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


        // get all agreements

        app.get('/agreementsAll/:email', async(req, res)=> {
            const email  = req.params.email
            const query = { userEmail : email}

            const result = await agreementsCollection.findOne(query)

            res.send(result)



        })

            // checking role

            app.get('/agreements/:email', async(req, res)=> {

                const email = req.params.email
                console.log(email)

                const query = {userEmail : email}

                const isExist = await agreementsCollection.findOne(query)

                console.log(isExist)

                if(!isExist){
                    return
                }

                const role = isExist.role


                //    if the role is admin

                if(role === 'admin'){

                    const inquiry = {role :'member'}
                    const options = {            
                        // Include only the `title` and `imdb` fields in the returned document
                        projection: { userEmail: 1, userName: 1},
                      };
                  
                    const members = await agreementsCollection.find(inquiry, options).toArray()

                   return res.send({role, members})
                }

                res.send({role})


            })

            // remove the membership

           app.patch('/agreements/:id', async(req, res)=> {

            const id = req.params.id

            const role = req.body.status

            const query = {_id : new ObjectId(id)}

            const updateDoc = {
                $set: {
                  role : role
                }
              };

              const result = await agreementsCollection.updateOne(query, updateDoc)

              res.send(result)


           })


        // pagination related api
        app.get("/apartmentsCount", async (req, res) => {

            const count = await apartmentsCollection.estimatedDocumentCount()
            res.send({count} )
        })

         // payment intent

    app.post('/create-payment-intent', async(req, res) => {

        const {price} = req.body
        const amount = parseInt(price * 100)
  

        const paymentIntent = await stripe.paymentIntents.create({
          amount : amount,
          currency : 'usd',
          payment_method_types : ['card']
        })
  
  
        res.send({
          clientSecret: paymentIntent.client_secret
        })
  
  
         
      })

       // payment save

    app.post('/payments', async(req, res)=> {

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

    app.get('/payments/:email', async(req, res)=> {

        const email = req.params.email
  
        const query = { email : email}
  
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