import Project from '../../models/project/Project.js';
import User from '../../models/user/User.js';

//get project by username
const getProjectsByUsername = async (req, res) => {
    try {
        const { username } = req.params;

        //find user by username
        const user = await User.findOne({ username }).select('_id');
        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'User not found'
            });
        }

        //Take all projects related to user ID
        const projects = await Project.find({ ownerId: user._id }).lean();
        res.status(200).json({
            status: 'success',
            message: `${username}'s project was found`,
            data: projects
        });
    } catch (err) {
        res.status(500).json({
            status: 'fail',
            message: err.message
        });
    }
}

//get projects based on tags searched by users
const getProjectsByTag = async (req, res) => {
    try {
        const { tagname } = req.params;
        const projects = await Project.find({ tags: tagname }).lean();

        if (!projects || projects.length === 0) {
            return res.status(404).json({
                status: 'fail',
                message: 'Project not found'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Projects found',
            data: projects
        });
    } catch (err) {
        res.status(500).json({
            status: 'fail',
            message: err.message
        });
    }
}

//search projects
const searchProjects = async (req, res) => {
    try {
        const { q } = req.query;

        //Keywords are needed, so that users can search for projects.
        if (!q) {
            return res.status(400).json({
                status: 'fail',
                message: 'Search query is required'
            });
        }
        
        //using regex to search for a fragment of a word
        const searchPattern = new RegExp(q, 'i');

        const projects = await Project.find({
            $or: [
                {title: {$regex: searchPattern}},
                {description: {$regex: searchPattern}},
                {tags: {$regex: searchPattern}}
            ]
        }).lean();

        if (!projects || projects.length === 0) {
            return res.status(404).json({
                status: 'fail',
                message: 'Project not found'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Project found',
            data: projects
        });
    } catch (err) {
        res.status(500).json({
            status: 'fail',
            message: err.message
        });
    }
}

export { getProjectsByUsername, getProjectsByTag, searchProjects };