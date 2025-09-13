import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    title: {
        type: String, 
        required: [true, 'Project title is required'],
        trim: true,
        minlength: [3, 'Title must be at least 3 characters long']
    },
    description: {
        type: String,
        required: [true, 'Project description is required'],
        trim: true
    },
    isGroup: {
        type: Boolean,
        required: true
    },
    repoUrl: {
        type: String,
        default: null,
        validate: {
            validator: (v) => {
                if (v === null) return true; //allow null value
                return /(https?:\/\/[^\s]+)/.test(v); //validation url
            },
            message: props => `${props.value} is not valid URL!`
        }
    },
    liveDemoUrl: {
        type: String,
        default: null,
        validate: {
            validator: (v) => {
                if (v === null) return true; //allow nul value
                return /(https?:\/\/[^\s]+)/.test(v); //validation url
            },
            message: props => `${props.value} is not valid URL!`
        }
    },
    imageUrl: {
        type: String,
        required: false //opsional
    },
    projectUrl: {
        type: String,
        required: true
    },
    tags: [String],
    members: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
        role: {
            type: String,
            required: true
        },
        joinedAt: {
            type: Date,
            required: true
        }
    }],
    stats: {
        likesCount: {
            type: Number,
            default: 0
        },
        commentsCount: {
            type: Number,
            default: 0
        },
        savesCount: {
            type: Number,
            default: 0
        }
    },
    status: {
        type: String,
        enum: ['ongoing', 'completed', 'archived'],
        default: 'ongoing'
    }
}, {
    timestamps: true
});

//create text index for search project
projectSchema.index({title: 'text', description: 'text', tags: 'text'});

const Project = mongoose.model('Project', projectSchema);

export default Project;