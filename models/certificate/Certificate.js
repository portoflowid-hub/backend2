import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Certificate name is required'],
        trim: true
    },
    issuer: {
        type: String,
        required: [true, 'Issuer name is required'],
        trim: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fileUrl: {
        type: String,
        required: [true, 'File URL is required'],
        trim: true
    },
    issueDate: {
        type: Date,
        required: [true, 'Issue date is required']
    },
    credentialID: {
        type: String,
        trim: true
    }
},{
    timestamps: true
});

const Certificate = mongoose.model('Certificate', certificateSchema);

export default Certificate;