const express = require("express");
const router = express.Router();
const Visit = require("../models/Visit");

// GET /api/visits — get total count
router.get("/", async (req, res) => {
  try {
    let visit = await Visit.findOne();
    if (!visit) {
      visit = await Visit.create({ count: 0 });
    }
    res.json({ count: visit.count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/visits/track — increment count
router.post("/track", async (req, res) => {
  try {
    let visit = await Visit.findOne();
    if (!visit) {
      visit = await Visit.create({ count: 1 });
    } else {
      visit.count += 1;
      await visit.save();
    }
    res.json({ count: visit.count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
