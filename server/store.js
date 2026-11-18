import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import mongoose from 'mongoose'

const STORE_DIR = process.env.VERCEL
  ? '/tmp/.data'
  : path.resolve(process.cwd(), '.data')
const STORE_PATH = path.join(STORE_DIR, 'portfolio-store.json')

export const SEED_PROJECTS = [
  {
    _id: '665000000000000000000002',
    title: 'CodeMind AI',
    subtitle: 'AI Codebase Understanding Assistant',
    status: 'In Progress',
    description:
      'AI codebase assistant with FastAPI & Gemini citation validation.',
    techStack: ['Python', 'FastAPI', 'Gemini API', 'Repository Parsing', 'RAG'],
    githubUrl: '',
    liveUrl: '',
    imageUrl: '',
    featured: true,
    order: 1,
    createdAt: '2026-05-02T10:00:00.000Z',
  },
  {
    _id: '665000000000000000000001',
    title: 'FixOnWay',
    subtitle: 'Roadside Assistance & Mechanic Discovery',
    status: 'Completed',
    description:
      'On-demand roadside assistance connecting drivers with verified mechanics.',
    techStack: ['Flutter', 'Dart', 'Node.js', 'Express.js', 'MongoDB Atlas', 'JWT', 'OpenStreetMap'],
    githubUrl: '',
    liveUrl: '',
    imageUrl: '',
    featured: true,
    order: 2,
    createdAt: '2026-05-01T10:00:00.000Z',
  },
  {
    _id: '665000000000000000000003',
    title: 'SentiMart',
    subtitle: 'Multi-Seller Marketplace & Review Analytics',
    status: 'In Progress',
    description:
      'Multi-vendor marketplace with automated NLP review sentiment scoring.',
    techStack: ['React', 'Tailwind CSS', 'Node.js', 'Express', 'MongoDB', 'FastAPI'],
    githubUrl: '',
    liveUrl: '',
    imageUrl: '',
    featured: true,
    order: 3,
    createdAt: '2026-05-03T10:00:00.000Z',
  },
  {
    _id: '665000000000000000000007',
    title: 'SketchBoard',
    subtitle: 'Collaborative Architecture & Design Whiteboard',
    status: 'In Progress',
    description:
      'Real-time collaborative canvas for system architecture & sketching.',
    techStack: ['React', 'Node.js', 'Express', 'HTML5 Canvas', 'WebSockets', 'Tailwind CSS'],
    githubUrl: '',
    liveUrl: '',
    imageUrl: '',
    featured: true,
    order: 4,
    createdAt: '2026-05-07T10:00:00.000Z',
  },
  {
    _id: '665000000000000000000004',
    title: 'TruthPulse',
    subtitle: 'Fake News & Sentiment Analytics',
    status: 'Completed',
    description:
      'Public sentiment & fake-news analytics across 200K+ news & tweets.',
    techStack: ['React', 'Node.js', 'Express', 'Python', 'NLTK', 'VADER', 'TextBlob', 'MongoDB', 'Recharts'],
    githubUrl: 'https://github.com/mansoorKhan39/truthpulse',
    liveUrl: 'https://truthpulse-aymd.vercel.app',
    imageUrl: '',
    featured: true,
    order: 4,
    createdAt: '2026-05-04T10:00:00.000Z',
  },
  {
    _id: '665000000000000000000005',
    title: 'Exclusive E-Commerce',
    subtitle: 'Full-Stack MERN Commerce Platform',
    status: 'Completed',
    description:
      'Full-stack MERN storefront with JWT/OAuth security and RBAC.',
    techStack: ['MongoDB', 'Express', 'React', 'Node.js', 'JWT', 'Google OAuth', 'Docker'],
    githubUrl: 'https://github.com/mansoorKhan39/Exclusive-Ecommerce',
    liveUrl: 'https://exclusive-ecommerce-maah.vercel.app',
    imageUrl: '',
    featured: true,
    order: 5,
    createdAt: '2026-05-05T10:00:00.000Z',
  },
  {
    _id: '665000000000000000000006',
    title: 'DataSK / Data Analysis Work',
    subtitle: 'EDA & Statistical Visualization Notebooks',
    status: 'Verified Notebooks & Analysis',
    description:
      'Exploratory data analysis & statistical visualization in Python & Pandas.',
    techStack: ['Python', 'NumPy', 'Pandas', 'Matplotlib', 'Seaborn', 'Jupyter Notebook'],
    githubUrl: '',
    liveUrl: '',
    imageUrl: '',
    featured: false,
    order: 6,
    createdAt: '2026-05-06T10:00:00.000Z',
  },
]

export function isMongoConnected() {
  return mongoose.connection.readyState === 1
}

export function createObjectId() {
  return crypto.randomBytes(12).toString('hex')
}

function ensureStore() {
  if (!fs.existsSync(STORE_DIR)) {
    fs.mkdirSync(STORE_DIR, { recursive: true })
  }
  if (!fs.existsSync(STORE_PATH)) {
    const initial = {
      projects: SEED_PROJECTS,
      messages: [],
      visit: { count: 0, visitors: [] },
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), 'utf8')
  }
}

export function readLocalStore() {
  ensureStore()
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf8')
    const parsed = JSON.parse(raw)
    return {
      projects: Array.isArray(parsed.projects) ? parsed.projects : SEED_PROJECTS,
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      visit: parsed.visit && typeof parsed.visit.count === 'number'
        ? { count: parsed.visit.count, visitors: Array.isArray(parsed.visit.visitors) ? parsed.visit.visitors : [] }
        : { count: 0, visitors: [] },
    }
  } catch {
    return { projects: SEED_PROJECTS, messages: [], visit: { count: 0, visitors: [] } }
  }
}

export function writeLocalStore(data) {
  ensureStore()
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf8')
}
