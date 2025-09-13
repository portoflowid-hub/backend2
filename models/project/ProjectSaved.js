import mongoose from 'mongoose';

const projectSavedSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Project'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    savedAt: {
        type: Date,
        required: true,
        default: Date.now
    }
});

const ProjectSaved = mongoose.model('ProjectSaved', projectSavedSchema);

export default ProjectSaved;