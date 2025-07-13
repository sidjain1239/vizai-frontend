import mongoose from 'mongoose';

// Function to get IST date
const getISTDate = () => {
    const utcDate = new Date();
    // Add 5 hours 30 minutes in milliseconds
    const istOffset = 5.5 * 60 * 60 * 1000;
    return new Date(utcDate.getTime() + istOffset);
};

const MessageSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    image: {
        type: String,
        default: "0",
    },
    messages: {
        type: Array,
        default: [],
    },
    updatedAt: {
        type: Date,
        default: getISTDate,
    },
});

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);
