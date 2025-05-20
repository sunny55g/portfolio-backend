require("dotenv").config();

const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const app = express();
const port = process.env.PORT || 3010;
dotenv.config();
// Middleware
app.use(cors({
  origin: 'https://harsh-suthar-portfolio.netlify.app/',
  methods: ['GET', 'POST'],
})); // Allow all origins

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('./'));  // Serve static files from the current directory

// MongoDB Connection
mongoose.connect('mongodb+srv://harshsuthar5656:sunny_55g@newapi.rxlryp4.mongodb.net/contactFormDB?retryWrites=true&w=majority', {

})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Define schema for contact form data
const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  timestamp: { type: Date, default: Date.now }
});

const Contact = mongoose.model('datas', contactSchema);

// Serve the HTML file
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'index.html'));
// });

// Handle form submissions
// app.post('/api/contact', async (req, res) => {
//   const { name, email, message } = req.body;

//   const newContact = new Contact({
//     name,
//     email,
//     message
//   });

//   try {
//     await newContact.save();
//     console.log('Contact saved to database');
//     res.status(200).json({ message: 'Message sent successfully!' });
//   } catch (error) {
//     console.error('Error saving contact:', error);
//     res.status(500).json({ message: 'Failed to send message.' });
//   }
// });
app.post("/api/contact", async (req, res) => {
  const { name, email, message } = req.body;
  console.log("Received:", req.body);
   try {
    await Contact.create({ name, email, message });
    res.status(201).json({ success: true });
  } catch (err) {
    console.error("Error saving contact:", err);
    res.status(500).json({ success: false, error: "Database error" });
  }
});

// Start the server
// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
    .catch((err) => {
    console.error('MongoDB connection failed:', err);
  });

// mongoose.connect(process.env.MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
// .then(() => console.log("✅ MongoDB Connected"))
// .catch(err => console.error("❌ MongoDB Error:", err));



