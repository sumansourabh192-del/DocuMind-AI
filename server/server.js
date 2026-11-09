 const express = require('express');
const cors = require('cors');
 require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const connectDB = require('./db');
const uploadRoutes = require('./routes/upload');
const chatRoutes = require('./routes/chat');

const app = express();

app.use(cors());
app.use(express.json());

// PDF upload route
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Enterprise PDF Chatbot API is running!'
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
