import express from 'express';
import { seeHomepage } from '../controllers/indexController';
import { postFormCreateCompetition, postFormUpdateCompetition, preFormCreateCompetition, preFormUpdateCompetition, seeCompetition, seeCompetitionIndex } from '../controllers/competitionController';
import { postFormCreatePlayer, postFormUpdatePlayer, preFormCreatePlayer, preFormUpdatePlayer, seePlayer } from '../controllers/playerController';
import { postFormCreateTeam, postFormUpdateTeam, preFormCreateTeam, preFormUpdateTeam, seeTeam } from '../controllers/teamController';
const router = express.Router();

router.get('/', seeHomepage);

router.get('/competition/new', preFormCreateCompetition);
router.get('/competition/:name.:code/edit', preFormUpdateCompetition);
router.get('/competition/:name.:code', seeCompetition);
router.get('/competition/index',seeCompetitionIndex)
router.post('/competition/new', postFormCreateCompetition);
router.put('/competition/:name.:code/edit', postFormUpdateCompetition);

router.get('/player/new', preFormCreatePlayer);
router.get('/player/:firstName.:lastName.:code/edit', preFormUpdatePlayer);
router.get('/player/:firstName.:lastName.:code', seePlayer);
router.post('/player', postFormCreatePlayer);
router.put('/player/:firstName.:lastName.:code/edit', postFormUpdatePlayer);

router.get('/team/new', preFormCreateTeam);
router.get('/team/:name.:code/edit', preFormUpdateTeam);
router.get('/team/:name.:code', seeTeam);
router.post('/team/new', postFormCreateTeam);
router.put('/team/:name.:code/edit', postFormUpdateTeam);


export default router
