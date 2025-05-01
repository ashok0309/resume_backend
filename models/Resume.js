const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  phone: String,
  education: [
    {
      institution: String,
      degree: String,
      year: String,
    }
  ],
  experience: [
    {
      company: String,
      role: String,
      duration: String,
    }
  ],
  skills: [String],
  theme: {
    font: String,
    color: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Resume', ResumeSchema);
