import mongoose from 'mongoose'

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true, default: '' },
    status: { type: String, trim: true, default: 'Completed' },
    description: { type: String, required: true },
    techStack: [{ type: String, trim: true }],
    githubUrl: { type: String, trim: true, default: '' },
    liveUrl: { type: String, trim: true, default: '' },
    imageUrl: { type: String, trim: true, default: '' },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export default mongoose.models.Project || mongoose.model('Project', projectSchema)
