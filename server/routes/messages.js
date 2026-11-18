import express from 'express'
import Message from '../models/Message.js'
import auth from '../middleware/auth.js'
import { createObjectId, isMongoConnected, readLocalStore, writeLocalStore } from '../store.js'

const router = express.Router()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// POST /api/messages — public (contact form)
router.post('/', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim()
    const email = String(req.body?.email || '').trim().toLowerCase()
    const subject = String(req.body?.subject || '').trim()
    const message = String(req.body?.message || '').trim()

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email and message are required' })
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' })
    }

    if (isMongoConnected()) {
      const msg = new Message({ name, email, subject, message })
      const saved = await msg.save()
      return res.status(201).json({ message: 'Message sent successfully', id: saved._id })
    }

    const store = readLocalStore()
    const now = new Date().toISOString()
    const saved = {
      _id: createObjectId(),
      name,
      email,
      subject,
      message,
      read: false,
      createdAt: now,
      updatedAt: now,
    }
    store.messages.unshift(saved)
    writeLocalStore(store)
    return res.status(201).json({ message: 'Message sent successfully', id: saved._id })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

// GET /api/messages — admin only
router.get('/', auth, async (req, res) => {
  try {
    if (isMongoConnected()) {
      const messages = await Message.find().sort({ createdAt: -1 })
      return res.json(messages)
    }
    const store = readLocalStore()
    const sorted = [...store.messages].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    return res.json(sorted)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

// PATCH /api/messages/:id/read — admin only
router.patch('/:id/read', auth, async (req, res) => {
  try {
    if (isMongoConnected()) {
      const updated = await Message.findByIdAndUpdate(
        req.params.id,
        { read: true },
        { new: true }
      )
      if (!updated) return res.status(404).json({ message: 'Message not found' })
      return res.json(updated)
    }

    const store = readLocalStore()
    const idx = store.messages.findIndex((m) => m._id === req.params.id)
    if (idx === -1) return res.status(404).json({ message: 'Message not found' })
    store.messages[idx] = {
      ...store.messages[idx],
      read: true,
      updatedAt: new Date().toISOString(),
    }
    writeLocalStore(store)
    return res.json(store.messages[idx])
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

// DELETE /api/messages/:id — admin only
router.delete('/:id', auth, async (req, res) => {
  try {
    if (isMongoConnected()) {
      const deleted = await Message.findByIdAndDelete(req.params.id)
      if (!deleted) return res.status(404).json({ message: 'Message not found' })
      return res.json({ message: 'Message deleted' })
    }

    const store = readLocalStore()
    const exists = store.messages.some((m) => m._id === req.params.id)
    if (!exists) return res.status(404).json({ message: 'Message not found' })
    store.messages = store.messages.filter((m) => m._id !== req.params.id)
    writeLocalStore(store)
    return res.json({ message: 'Message deleted' })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

export default router
