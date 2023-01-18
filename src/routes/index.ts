import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { postFormCreateCompetition, postFormUpdateCompetition, preFormCreateCompetition, preFormUpdateCompetition, seeCompetition } from '../controllers/competitionController';
import { postFormCreatePlayer, postFormUpdatePlayer, preFormCreatePlayer, preFormUpdatePlayer, seePlayer } from '../controllers/playerController';
import { postFormCreateTeam, postFormUpdateTeam, preFormCreateTeam, preFormUpdateTeam, seeTeam } from '../controllers/teamController';
const router = express.Router();

router.get('/', function(req: Request, res: Response, next: NextFunction) {
  res.render('index', { title: 'Express' });
});

router.get('/competitions/new', preFormCreateCompetition);
router.get('/competitions/:name.:code/edit', preFormUpdateCompetition);
router.get('/competitions/:name.:code', seeCompetition);
router.post('/competitions', postFormCreateCompetition);
router.put('/competitions/:name.:code', postFormUpdateCompetition);

router.get('/player/new', preFormCreatePlayer);
router.get('/player/:firstName.:lastName.:code/edit', preFormUpdatePlayer);
router.get('/player/:firstName.:lastName.:code', seePlayer);
router.post('/player', postFormCreatePlayer);
router.put('/player/:firstName.:lastName.:code', postFormUpdatePlayer);

router.get('/team/new', preFormCreateTeam);
router.get('/team/:name.:code/edit', preFormUpdateTeam);
router.get('/team/:name.:code', seeTeam);
router.post('/team', postFormCreateTeam);
router.put('/team/:name.:code', postFormUpdateTeam);




export default router
