import express from 'express';
import {
    createProject, 
    getMyProjects, 
    updateProject, 
    deleteProject, 
    getProjectById,
    uploadImage
} from '../controller/project/projectController.js';

import {
    likeProject,
    unlikeProject,
    saveProject,
    unsaveProject,
    addComment,
    deleteComment,
    getProjectComments 
} from '../controller/project/projectInteractionController.js';

import { getProjectsByUsername, getProjectsByTag, searchProjects } from '../controller/project/projectQueryController.js';
import {removeMemberProject, updateMemberRole, addMemberProject} from '../controller/project/projectMemberController.js';
import { getLikedProjects, getSavedProjects } from '../controller/project/userProjectController.js';
import verifyToken from '../middleware/auth.js';
import multer from 'multer';

const projectRouter = express.Router();
const upload = multer({storage: multer.memoryStorage()});

//create project (user must log in)
projectRouter.post('/api/createProject', verifyToken, upload.single('image'), createProject);

//get all my projects
projectRouter.get('/api/getProjects', verifyToken, getMyProjects);

//get project by project id (just owner)
projectRouter.get('/api/getProject/:id', verifyToken, getProjectById);

//get projects by username (public)
projectRouter.get('/api/getProjectsByUsername/:username', getProjectsByUsername);

//get projects by tag (public)
projectRouter.get('/api/getProjectsByTag/:tagname', getProjectsByTag);

//update project by id(owner)
projectRouter.put('/api/project/:id', verifyToken, updateProject);

//delete project by id (owner)
projectRouter.delete('/api/project/:projectId', verifyToken, deleteProject);

//search project (public)
projectRouter.get('/api/searchProjects', searchProjects);

//like, unlike projects, and get all projects that liked by user
projectRouter.post('/api/projects/:projectId/like', verifyToken, likeProject);
projectRouter.delete('/api/projects/:projectId/like', verifyToken, unlikeProject);
projectRouter.get('/api/projects/likes', verifyToken, getLikedProjects);

//save, unsave prjects, and get all projects that saved by user
projectRouter.post('/api/projects/:projectId/save', verifyToken, saveProject);
projectRouter.delete('/api/projects/:projectId/save', verifyToken, unsaveProject);
projectRouter.get('/api/projects/saves', verifyToken, getSavedProjects);

//add comment, delete comment, and get all comments on project
projectRouter.post('/api/projects/:projectId/comment', verifyToken, addComment);
projectRouter.delete('/api/comments/:commentId', verifyToken, deleteComment);
projectRouter.get('/api/projects/:projectId/comments', getProjectComments);

//add, remove, and update members by owner project
projectRouter.post('/api/projects/:projectId/members', verifyToken, addMemberProject);
projectRouter.delete('/api/projects/:projectId/members', verifyToken, removeMemberProject);
projectRouter.patch('/api/projects/:projectId/members/role', verifyToken, updateMemberRole);

//upload project image
projectRouter.put('/api/projects/:projectId/thumbnail', verifyToken, upload.single('image'), uploadImage);

export default projectRouter;