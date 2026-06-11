const mongoose = require("mongoose");

const visitorSchema = new mongoose.Schema({
  ip:        { type: String, default: 'unknown' },
  country:   { type: String, default: 'Unknown' },
  city:      { type: String, default: 'Unknown' },
  device:    { type: String, default: 'unknown' },
  browser:   { type: String, default: 'unknown' },
  page:      { type: String, default: '/' },
  visitedAt: { type: Date, default: Date.now },
})

const visitSchema = new mongoose.Schema({
  count:    { type: Number, default: 0 },
  visitors: [visitorSchema],
}, { timestamps: true })

module.exports = mongoose.model("Visit", visitSchema)
