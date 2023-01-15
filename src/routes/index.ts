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
router.get('/competitions/:name_:code/edit', preFormUpdateCompetition);
router.get('/competitions/:name_:code', seeCompetition);
router.post('/competitions', postFormCreateCompetition);
router.put('/competitions/:name_:code', postFormUpdateCompetition);

router.get('/player/new', preFormCreatePlayer);
router.get('/player/:firstName_:lastName_:code/edit', preFormUpdatePlayer);
router.get('/player/:firstName_:lastName_:code', seePlayer);
router.post('/player', postFormCreatePlayer);
router.put('/player/:firstName_:lastName_:code', postFormUpdatePlayer);

router.get('/team/new', preFormCreateTeam);
router.get('/team/:name_:code/edit', preFormUpdateTeam);
router.get('/team/:name_:code', seeTeam);
router.post('/team', postFormCreateTeam);
router.put('/team/:name_:code', postFormUpdateTeam);




export default router
