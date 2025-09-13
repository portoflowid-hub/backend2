import Project from '../../models/project/Project.js';
import mongoose from 'mongoose';

//add member to project
const addMemberProject = async (req, res) => {
    const {projectId} = req.params;
    const {userId, role} = req.body;
    const currentUserId = req.user.id;

    try {
        //find the project and make sure the user is owner
        const project = await Project.findById(projectId);
        if (!project || project.ownerId.toString() !== currentUserId) {
            return res.status(403).json({
                status: 'fail',
                message: 'Forbidden: You do not have permission to remove members for this project'
            });
        }

        // Check whether the member is already in the project
        const isMemberExist = project.members.some(member => member.userId.toString() === userId);
        if (isMemberExist) {
            return res.status(409).json({
                status: 'fail',
                message: 'User is already a member of this project'
            });
        }

        const updatedProject = await Project.findByIdAndUpdate(
            projectId,
            {
                $push: {
                    members: {
                        userId: userId,
                        role: role || 'Developer',
                        joinedAt: new Date()
                    }
                }
            }, 
            {new: true, runValidators: true}
        );

        res.status(200).json({
            status: 'success',
            message: 'Project member added successfully',
            data: updatedProject
        });
    } catch (err) {
        res.status(500).json({
            status: 'fail',
            message: 'Failed to add member',
            error: err.message
        });
    }
}

//remove members from the project
const removeMemberProject = async (req, res) => {
    const {projectId} = req.params;
    const {userId} = req.body;
    const currentUserId = req.user.id;

    try {
        //find the project and make sure the user is owner
        const project = await Project.findById(projectId);
        if (!project || project.ownerId.toString() !== currentUserId) {
            return res.status(403).json({
                status: 'fail',
                message: 'Forbidden: You do not have permission to remove members for this project'
            });
        }

        const updatedProject = await Project.findByIdAndUpdate(
            projectId,
            {$pull: {members: {userId}}},
            {new: true, runValidators: true}
        );

        if (!updatedProject) {
            return res.status(404).json({
                status: 'fail',
                message: 'Project not found'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Project members removed successfully',
            data: updatedProject
        });
    } catch (err) {
        res.status(500).json({
            status: 'fail',
            message: 'Failed to remove members project',
            error: err.message
        });
    }
}

//update role members
const updateMemberRole = async (req, res) => {
    const {projectId} = req.params;
    const {userId, newRole} = req.body;
    const currentUserId = req.user.id;

    try {
        //find the user and make sure the user is owner
        const project = await Project.findById(projectId);
        if (!project || project.ownerId.toString() !== currentUserId) {
            return res.status(403).json({
                status: 'fail',
                message: 'Forbidden: You do not have permission to remove members for this project'
            });
        }

        const updatedProject = await Project.findByIdAndUpdate(
            {_id: projectId, 'members.userId': userId},
            {$set: {'members.$[elem].role': newRole}},
            {
                new: true, 
                runValidators: true,
                arrayFilters: [{'elem.userId': userId}]
            }
        );

        if (!updatedProject) {
            return res.status(404).json({
                status: 'fail',
                message: 'Project not found'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Project member role updated successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'fail',
            message: 'Failed to update members role',
            error: err.message
        });
    }
}

export {removeMemberProject, updateMemberRole, addMemberProject};