import Project from '../../models/project/Project.js';
import ProjectLike from '../../models/project/ProjectLike.js';
import ProjectSaved from '../../models/project/ProjectSaved.js';

//Taking on all projects that users like
const getLikedProjects = async (req, res) => {
    const userId = req.user.id;

    try {
        // Take all documents liked by the user
        const likedProject = await ProjectLike.find({userId}).lean();
        const projectIds = likedProject.map(like => like.projectId);

        // Get project details from the projects collection
        const projects = await Project.find({_id: {$in: projectIds}}).lean();

        res.status(200).json({
            status: 'success',
            message: 'Successfully retrieved liked projects',
            data: projects
        });
    } catch (err) {
        res.status(500).json({
            status: 'fail',
            message: err.message
        });
    }
}

// Retrieve all projects saved by the user
const getSavedProjects = async (req, res) => {
    const userId = req.user.id;

    try {
        // Take all documents saved by the user
        const savedProjects = await ProjectSaved.find({userId}).lean();
        const projectIds = savedProjects.map(save => save.projectId);

       // Get project details from the projects collection
        const projects = await Project.find({_id: {$in: projectIds}}).lean();

        res.status(200).json({
            status: 'success',
            message: 'Successfully retrieved saved projects',
            data: projects
        });
    } catch (err) {
        res.status(500).json({
            status: 'fail',
            message: err.message
        });
    }
}

export {getLikedProjects, getSavedProjects};