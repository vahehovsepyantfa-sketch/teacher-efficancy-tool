require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/dbConfig');

const authRoutes = require('./routes/authRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const ldmRoutes = require('./routes/ldmRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Teacher Efficancy Tool API is running...' });
});

app.use('/api/auth', authRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/ldm', ldmRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Սերվերը հաջողությամբ միացավ պորտ ${PORT}-ին`);
});
