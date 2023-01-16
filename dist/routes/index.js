"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const competitionController_1 = require("../controllers/competitionController");
const playerController_1 = require("../controllers/playerController");
const teamController_1 = require("../controllers/teamController");
const router = express_1.default.Router();
router.get('/', function (req, res, next) {
    res.render('index', { title: 'Express' });
});
router.get('/competitions/new', competitionController_1.preFormCreateCompetition);
router.get('/competitions/:name_:code/edit', competitionController_1.preFormUpdateCompetition);
router.get('/competitions/:name_:code', competitionController_1.seeCompetition);
router.post('/competitions', competitionController_1.postFormCreateCompetition);
router.put('/competitions/:name_:code', competitionController_1.postFormUpdateCompetition);
router.get('/player/new', playerController_1.preFormCreatePlayer);
router.get('/player/:firstName_:lastName_:code/edit', playerController_1.preFormUpdatePlayer);
router.get('/player/:firstName_:lastName_:code', playerController_1.seePlayer);
router.post('/player', playerController_1.postFormCreatePlayer);
router.put('/player/:firstName_:lastName_:code', playerController_1.postFormUpdatePlayer);
router.get('/team/new', teamController_1.preFormCreateTeam);
router.get('/team/:name_:code/edit', teamController_1.preFormUpdateTeam);
router.get('/team/:name_:code', teamController_1.seeTeam);
router.post('/team', teamController_1.postFormCreateTeam);
router.put('/team/:name_:code', teamController_1.postFormUpdateTeam);
exports.default = router;
