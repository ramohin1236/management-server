const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const port =process.env.PORT || 8000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

// middleware
app.use(cors())
app.use(express.json())




const sendMailWithPDF = async (emailData, email, pdfBuffer) => {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASSWORD,
        },
      });
  
      const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: emailData.subject,
        html: `<p>${emailData.message}</p>`,
        attachments: [{
          filename: 'information.pdf',
          content: pdfBuffer,
          contentType: 'application/pdf',
        }],
      };
  
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent:', info.response);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };


const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASSWORD}@cluster0.vjcdyry.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

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

    const informatinCollection =client.db('Managment').collection('user-info')


// post a user contact informaation
app.post('/contact', async (req, res) => {
    try {
      const contact = req.body;
      
      const result = await informatinCollection.insertOne(contact);
      
      // Generate PDF content
      const pdfDoc = new PDFDocument();
      pdfDoc.text(`Message Id: ${result?.insertedId}, User Name: ${contact.name}, User Mobile: ${contact.number}, User Message: ${contact.message}`);
      const pdfBuffer = await new Promise((resolve) => {
        const buffers = [];
        pdfDoc.on('data', (chunk) => buffers.push(chunk));
        pdfDoc.on('end', () => resolve(Buffer.concat(buffers)));
        pdfDoc.end();
      });
  
      // Send email with PDF attachment
      await sendMailWithPDF(
        {
          subject: 'A New Information Comes here!',
          message: `Message Id: ${result?.insertedId}, User Name: ${contact.name}`,
        },
        contact.email,
        pdfBuffer
      );
  
      res.status(201).json({ message: "Contact information inserted successfully", data: result.ops });
    } catch (error) {
      console.error("Error inserting contact information:", error);
      res.status(500).json({ error: "Failed to insert contact information" });
    }
  });


// get all user contact information
 
  app.get('/contact', async (req, res) => {
    try{
        const query = {}
    const cursor = informatinCollection.find(query)
    const users = await cursor.toArray()
    res.send(users)
    }
    catch (error) {
      
        res.status(500).json({ error: "Failed to get contact information" });
    }
  })

//   delete a user information
app.delete('/contact/:id',  async (req, res) => {
   try{
    const id = req.params.id
    const query = { _id: new ObjectId(id) }
    const result = await informatinCollection.deleteOne(query)
    res.send(result)
   } catch (error) {
      
    res.status(500).json({ error: "Failed to delete informtation" });
}
  })














    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
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