const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Անունը պարտադիր է'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email-ը պարտադիր է'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Գաղտնաբառը պարտադիր է'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'ldm', 'teacher'],
      default: 'teacher',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
