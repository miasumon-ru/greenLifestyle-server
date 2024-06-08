
const express = require('express')
const app =  express()
require('dotenv').config()
const cors = require('cors')

const port = process.env.PORT || 5000


// middleware

app.use(cors())
app.use(express.json())


// creating initial server

app.get('/', async(req, res)=> {
    res.send('Assignment twelve is running')
})

app.listen(port , ()=> {
    console.log(`assignment twelve is running on server ${port}`)
})