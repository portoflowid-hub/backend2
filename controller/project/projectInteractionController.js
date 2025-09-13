import ProjectLike from '../../models/project/ProjectLike.js';
import ProjectComment from '../../models/project/ProjectComment.js';
import ProjectSaved from '../../models/project/ProjectSaved.js';
import Project from '../../models/project/Project.js';

//like project (public)
const likeProject = async (req, res) => {
    const {projectId} = req.params;
    const userId = req.user.id;

    try {
        //check wheter the user has already liked it
        const existingLike = await ProjectLike.findOne({projectId, userId});
        if (existingLike) {
            return res.status(409).json({
                status: 'fail',
                message: 'Project already liked by this user'
            });
        }

        //create new documment like
        await ProjectLike.create({projectId, userId});

        //add the number of likes to the project documment
        await Project.findByIdAndUpdate(projectId, {$inc: {'stats.likesCount': 1}});

        res.status(200).json({
            status: 'success',
            message: 'Project liked successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'fail',
            message: 'Failed to like project',
            error: err.message
        });
    }
}

//unlike project (public)
const unlikeProject = async (req, res) => {
    const {projectId} = req.params;
    const userId = req.user.id;

    try {
        const result = await ProjectLike.deleteOne({projectId, userId});

        if (result.deletedCount === 0) {
            return res.status(404).json({
                status: 'fail',
                message: 'Project like not found'
            });
        }

        //reduce the number of likes in the project
        await Project.findByIdAndUpdate(projectId, {$inc: {'stats.likesCount': -1}})

        res.status(200).json({
            status: 'success',
            message: 'Successfully unliked project'
        });
    } catch (err) {
        res.status(500).json({
            status: 'fail',
            message: 'Failed to unlike project',
            error: err.message
        });
    }
}

//save project (public)
const saveProject = async (req, res) => {
    const {projectId} = req.params;
    const userId = req.user.id;

    try {
        //check if public has already save the project
        const existingSave = await ProjectSaved.findOne({projectId, userId});
        if (existingSave) {
            return res.status(409).json({
                status: 'fail',
                message: 'Project already saved by this user'
            });
        }

        await ProjectSaved.create({projectId, userId});
        await Project.findByIdAndUpdate(projectId, {$inc: {'stats.savesCount': 1}});

        res.status(200).json({
            status: 'success',
            message: 'Project saved successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'fail',
            message: 'Failed to saved project',
            error: err.message
        });
    }
}

//unsave project (public)
const unsaveProject = async (req, res) => {
    const {projectId} = req.params;
    const userId = req.user.id;

    try {
        //check wheter the user has already saved it
        const result = await ProjectSaved.deleteOne({projectId, userId});
        if (result.deletedCount === 0) {
            return res.status(404).json({
                status: 'fail',
                message: 'Project saved not found'
            });
        }

        await Project.findByIdAndUpdate(projectId, {$inc: {'stats.savesCount': -1}});

        res.status(200).json({
            status: 'success',
            message: 'Project unsaved successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'fail',
            message: 'Failed to unsaved project',
            error: err.message
        });
    }
}

//for public comment the project
const addComment = async (req, res) => {
    const {projectId} = req.params;
    const {commentText, parentCommentId} = req.body;
    const userId = req.user.id;

    try {
        //create comment on the project
        const comment = new ProjectComment({
            projectId,
            userId,
            commentText,
            parentCommentId: parentCommentId || null
        });

        //save comment to database
        await comment.save();

        //update the count of comment to stats project
        await Project.findByIdAndUpdate(projectId, {$inc: {'stats.commentsCount': 1}});

        res.status(201).json({
            status: 'success',
            message: 'Comment added successfully',
            data: comment,
        });
    } catch (err) {
        res.status(500).json({
            status: 'fail',
            message: 'Failed to added comment',
            error: err.message
        });
    }
}

//delete comment on the project (public)
const deleteComment = async (req, res) => {
    const {commentId} = req.params;

    try {
        const deletedComment = await ProjectComment.findByIdAndDelete(commentId);

        if (!deletedComment) {
            return res.status(404).json({
                status: 'fail',
                message: 'Project comment not found'
            });
        }

        //update the comment count on the stats project
        await Project.findByIdAndUpdate(deletedComment.projectId, {$inc: {'stats.commentsCount': -1}});

        res.status(200).json({
            status: 'success',
            message: 'Comment deleted successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'fail',
            message: 'Failed to delete comment',
            error: err.message
        });
    }
}

//get all comments
const getProjectComments = async (req, res) => {
    const {projectId} = req.params;
    
    try {
        const comments = await ProjectComment.find({projectId}).lean();

        if (!comments || comments.length === 0) {
            return res.status(404).json({
                status: 'fail',
                message: 'No comments found for this project'
            });
        }

        //create map to access based comment id
        const commentMap = new Map();
        comments.forEach(comment => {
            commentMap.set(comment._id.toString(), {...comment, replies: []});
        });

        const organizedComments = [];

        //loop to organize comment
        commentMap.forEach(comment => {
            if (comment.parentCommentId) {
                const parent = commentMap.get(comment.parentCommentId.toString());
                if (parent) {
                    parent.replies.push(comment);
                }
            } else {
                organizedComments.push(comment);
            }
        });

        // Filter out replies from the main list if you want a clean parent array
        const finalComments = organizedComments.filter(comment => !comment.parentComentId);

        res.status(200).json({
            status: 'success',
            message: 'Comments found',
            data: finalComments
        });
    } catch (err) {
        res.status(500).json({
            status: 'fail',
            message: 'Failed to retrieve comments',
            error: err.message
        });
    }
}


export {likeProject, unlikeProject, saveProject, unsaveProject, addComment, deleteComment, getProjectComments};