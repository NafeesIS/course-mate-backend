import express from 'express';
import { TeamMemberControllers } from './team.controller';

const router = express.Router();

router.post('/createTeamMember', TeamMemberControllers.createTeamMember);
router.get('/getTeamMembers', TeamMemberControllers.getTeamMembers);

export const TeamMemberRoutes = router;
