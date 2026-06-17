require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/dbConfig');

const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Միանում ենք MongoDB տվյալների բազային
connectDB();

app.get('/', (req, res) => {
    res.status(200).json({ message: 'Teacher Efficancy Tool API is running...' });
});

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Սերվերը հաջողությամբ միացավ պորտ ${PORT}-ին`);
});
