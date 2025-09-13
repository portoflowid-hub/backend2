import Project from "../../models/project/Project.js";
import ProjectLike from "../../models/project/ProjectLike.js";
import ProjectComment from "../../models/project/ProjectComment.js";
import ProjectSaved from "../../models/project/ProjectSaved.js";
import mongoose from "mongoose";
import {uploadToS3} from '../../services/storageService.js';

//create project by user
const createProject = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                status: "fail",
                message: "Unauthorized: user not found in request",
            });
        }

        const { title, description, isGroup, repoUrl, liveDemoUrl, projectUrl, tags, members } = req.body;
        const ownerId = req.user.id;

        //check whether the project is exist
        const existingProject = await Project.findOne({title});
        if (existingProject) {
            return res.status(409).json({
                status: 'fail',
                message: 'Project already exist'
            });
        }

        const projectData = {
            title,
            description,
            isGroup,
            repoUrl,
            liveDemoUrl,
            projectUrl,
            tags,
            members,
            ownerId
        };

        //parse string json for array tags and members
        if (members) {
            try {
                const parsedMembers = JSON.parse(members);
                projectData.members = parsedMembers.map(member => ({
                    ...member,
                    joinedAt: new Date()
                }));
            } catch (err) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Invalid members data format'
                });
            }
        }

        if (tags) {
            try {
                projectData.tags = JSON.parse(tags);
            } catch (err) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Invalid tags data format'
                });
            }
        }

        //if there are any images uploaded, add them to the project data
        if (req.file) {
            const imageUrl = await uploadToS3(req.file.buffer, req.file.mimetype);
            projectData.imageUrl = imageUrl
        }
        
        const newProject = await Project.create(projectData);

        res.status(201).json({
            status: "success",
            message: "The project has been successfully created",
            data: newProject
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err.message,
        });
    }
}

//get all my projects
const getMyProjects = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skipIndex = (page -1) * limit;

        const totalProjects = await Project.countDocuments({ownerId: req.user.id});
        const projects = await Project.find({ownerId: req.user.id})
            .sort({createdAt: -1})
            .limit(limit)
            .skip(skipIndex)
            .lean();

        res.status(200).json({
            status: 'success',
            message: 'Successfully displaying all my projects',
            data: projects,
            pagination: {
                totalProjects,
                currentPage: page,
                totalPages: Math.ceil(totalProjects / limit)
            }
        });
    } catch (err) {
        res.status(500).json({
        status: "fail",
        message: err.message
        });
    }
}

//get user project by id
const getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await Project.findOne({ _id: id, ownerId: req.user.id });

        if (!project) {
            return res.status(404).json({
                status: "fail",
                message: "Project not found",
            });
        }

        res.status(200).json({
            status: "success",
            message: "Project found",
            data: project
        });
    } catch (err) {
        res.status(500).json({
            status: "fail",
            message: err.message
        });
    }
}

//update project by id
const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const updatedProject = await Project.findOneAndUpdate(
            { _id: id, ownerId: req.user.id },
            updates,
            { new: true, runValidators: true }
        );

        if (!updatedProject) {
            return res.status(404).json({
                status: "fail",
                message: "Project not found",
            });
        }

        res.status(200).json({
            status: "success",
            message: "Successfully updated the project",
            data: updatedProject,
        });
    } catch (err) {
        res.status(500).json({
            status: "fail",
            message: err.message,
        });
    }
}

//delete project by id
const deleteProject = async (req, res) => {
    const { projectId } = req.params;

    //starting session for database transaction
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        //delete main project documment
        const deletedProject = await Project.findByIdAndDelete(projectId, {
        session,
        });

        if (!deletedProject) {
        await session.abortTransaction();
        return res.status(404).json({
            status: "fail",
            message: "Project not found",
        });
        }

        //delete all likes, comments, and saves that related with projectId
        await ProjectLike.deleteMany({ projectId }, { session });
        await ProjectComment.deleteMany({ projectId }, { session });
        await ProjectSaved.deleteMany({ projectId }, { session });

        await session.commitTransaction();

        res.status(200).json({
            statu: "success",
            message: "Project and all related data have been successfully deleted",
        });
    } catch (err) {
        await session.abortTransaction();
        res.status(500).json({
            status: "fail",
            message: "Failed to delete project",
            error: err.message
        });
    } finally {
        session.endSession();
    }
}

//upload project image
const uploadImage = async (req, res) => {
    const {projectId} = req.params;
    const currentUserId = req.user.id;

    try {
        const project = await Project.findById(projectId);
        if (!project || project.ownerId.toString() !== currentUserId) {
            return res.status(403).json({
                status: 'fail',
                message: 'Forbidden: You do not have permission to upload thumbnail for this project.'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                status: 'fail',
                message: 'Image file is required'
            });
        }

        const imageUrl = await uploadToS3(req.file.buffer, req.file.mimetype);

        const updatedProject = await Project.findByIdAndUpdate(
            projectId,
            {
                $set: {
                    imageUrl: imageUrl
                }
            },
            {new: true}
        );

        res.status(200).json({
            status: 'success',
            message: 'Project thumbnail updated successfully',
            data: updatedProject
        });
    } catch (err) {
        res.status(500).json({
            status: 'fail',
            message: 'Failed to upload project thumbnail',
            error: err.message
        });
    }
}

export {
    createProject,
    getMyProjects,
    updateProject,
    deleteProject,
    getProjectById,
    uploadImage
};
