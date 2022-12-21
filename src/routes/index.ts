import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { seePlayer } from '../controllers/playerController';
const router = express.Router();

/* GET home page. */
router.get('/', function(req: Request, res: Response, next: NextFunction) {
  res.render('index', { title: 'Express' });
});

router.get('/player/:firstName_:lastName_:code', seePlayer);



export default router
