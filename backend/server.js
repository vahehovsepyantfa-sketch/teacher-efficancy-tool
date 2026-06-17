require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

app.use(cors());
app.use(express.json());

// Միանում ենք MongoDB տվյալների բազային
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB-ն հաջողությամբ միացավ!'))
  .catch((err) => console.log('❌ MongoDB միանալու սխալ:', err));

app.get('/', (req, res) => {
    res.status(200).json({ message: 'Teacher Efficancy Tool API is running...' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Սերվերը հաջողությամբ միացավ պորտ ${PORT}-ին`);
});