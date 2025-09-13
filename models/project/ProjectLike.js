import mongoose from 'mongoose';

const projectLikeSchema = new mongoose.Schema({
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
    likedAt: {
        type: Date,
        required: true,
        default: Date.now
    }
});

const   ProjectLike = mongoose.model('ProjectLike', projectLikeSchema);

export default ProjectLike;