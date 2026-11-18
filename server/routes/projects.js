import express from 'express'
import Project from '../models/Project.js'
import auth from '../middleware/auth.js'
import { createObjectId, isMongoConnected, readLocalStore, writeLocalStore } from '../store.js'

const router = express.Router()

function normalizeProjectPayload(body = {}, isUpdate = false) {
  const payload = {}
  if (body.title !== undefined) payload.title = String(body.title).trim()
  if (body.subtitle !== undefined) payload.subtitle = String(body.subtitle).trim()
  else if (!isUpdate) payload.subtitle = ''

  if (body.status !== undefined) payload.status = String(body.status).trim() || 'Completed'
  else if (!isUpdate) payload.status = 'Completed'

  if (body.description !== undefined) payload.description = String(body.description).trim()
  if (body.techStack !== undefined) {
    payload.techStack = Array.isArray(body.techStack)
      ? body.techStack.map((t) => String(t).trim()).filter(Boolean)
      : String(body.techStack)
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
  } else if (!isUpdate) {
    payload.techStack = []
  }
  if (body.githubUrl !== undefined) payload.githubUrl = String(body.githubUrl).trim()
  else if (!isUpdate) payload.githubUrl = ''

  if (body.liveUrl !== undefined) payload.liveUrl = String(body.liveUrl).trim()
  else if (!isUpdate) payload.liveUrl = ''

  if (body.imageUrl !== undefined) payload.imageUrl = String(body.imageUrl).trim()
  else if (!isUpdate) payload.imageUrl = ''

  if (body.featured !== undefined) payload.featured = Boolean(body.featured)
  else if (!isUpdate) payload.featured = false

  if (body.order !== undefined) payload.order = Number(body.order) || 0
  else if (!isUpdate) payload.order = 0

  return payload
}

function sortProjects(list) {
  return [...list].sort((a, b) => {
    const orderDiff = (a.order || 0) - (b.order || 0)
    if (orderDiff !== 0) return orderDiff
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  })
}

// GET /api/projects — public
router.get('/', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const projects = await Project.find().sort({ order: 1, createdAt: -1 })
      return res.json(projects)
    }
    const store = readLocalStore()
    return res.json(sortProjects(store.projects))
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

// GET /api/projects/:id — public
router.get('/:id', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const project = await Project.findById(req.params.id)
      if (!project) return res.status(404).json({ message: 'Project not found' })
      return res.json(project)
    }
    const store = readLocalStore()
    const project = store.projects.find((p) => p._id === req.params.id)
    if (!project) return res.status(404).json({ message: 'Project not found' })
    return res.json(project)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

// POST /api/projects — admin only
router.post('/', auth, async (req, res) => {
  try {
    const payload = normalizeProjectPayload(req.body, false)
    if (!payload.title || !payload.description) {
      return res.status(400).json({ message: 'Title and description are required' })
    }

    if (isMongoConnected()) {
      const project = new Project(payload)
      const saved = await project.save()
      return res.status(201).json(saved)
    }

    const store = readLocalStore()
    const now = new Date().toISOString()
    const created = {
      _id: createObjectId(),
      ...payload,
      createdAt: now,
      updatedAt: now,
    }
    store.projects.push(created)
    writeLocalStore(store)
    return res.status(201).json(created)
  } catch (err) {
    return res.status(400).json({ message: err.message })
  }
})

// PUT /api/projects/:id — admin only
router.put('/:id', auth, async (req, res) => {
  try {
    const payload = normalizeProjectPayload(req.body, true)

    if (isMongoConnected()) {
      const updated = await Project.findByIdAndUpdate(req.params.id, payload, {
        new: true,
        runValidators: true,
      })
      if (!updated) return res.status(404).json({ message: 'Project not found' })
      return res.json(updated)
    }

    const store = readLocalStore()
    const idx = store.projects.findIndex((p) => p._id === req.params.id)
    if (idx === -1) return res.status(404).json({ message: 'Project not found' })
    store.projects[idx] = {
      ...store.projects[idx],
      ...payload,
      updatedAt: new Date().toISOString(),
    }
    writeLocalStore(store)
    return res.json(store.projects[idx])
  } catch (err) {
    return res.status(400).json({ message: err.message })
  }
})

// DELETE /api/projects/:id — admin only
router.delete('/:id', auth, async (req, res) => {
  try {
    if (isMongoConnected()) {
      const deleted = await Project.findByIdAndDelete(req.params.id)
      if (!deleted) return res.status(404).json({ message: 'Project not found' })
      return res.json({ message: 'Project deleted' })
    }

    const store = readLocalStore()
    const exists = store.projects.some((p) => p._id === req.params.id)
    if (!exists) return res.status(404).json({ message: 'Project not found' })
    store.projects = store.projects.filter((p) => p._id !== req.params.id)
    writeLocalStore(store)
    return res.json({ message: 'Project deleted' })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

export default router
