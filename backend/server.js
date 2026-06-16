require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Միջնաշերտեր (Middlewares)՝ հարցումները ճիշտ կարդալու համար
app.use(cors());
app.use(express.json());

// Պարզ ստուգման երթուղի (համոզվելու համար, որ ամեն ինչ աշխատում է)
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Teacher Efficancy Tool API is running...' });
});

// Պորտի կարգավորում (հարմարեցված է Render.com-ում անխափան տեղակայելու համար)
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Սերվերը հաջողությամբ միացավ պորտ ${PORT}-ին`);
});
