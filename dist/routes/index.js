"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const indexController_1 = require("../controllers/indexController");
const competitionController_1 = require("../controllers/competitionController");
const playerController_1 = require("../controllers/playerController");
const teamController_1 = require("../controllers/teamController");
const router = express_1.default.Router();
router.use("/", indexController_1.populateDatabaseWithDummyData);
router.get("/", indexController_1.seeHomepage);
router.delete(
  "/competition/:name.:code",
  competitionController_1.deleteCompetition
);
router.get(
  "/competition/new",
  competitionController_1.preFormCreateCompetition
);
router.get(
  "/competition/:name.:code/edit",
  competitionController_1.preFormUpdateCompetition
);
router.get("/competition/:name.:code", competitionController_1.seeCompetition);
router.get(/competition\/data/, competitionController_1.competitionIndexData);
router.get("/competition/index", competitionController_1.seeCompetitionIndex);
router.post(
  "/competition/new",
  competitionController_1.postFormCreateCompetition
);
router.put(
  "/competition/:name.:code/edit",
  competitionController_1.postFormUpdateCompetition
);
router.delete(
  "/player/:firstName.:lastName.:code",
  playerController_1.deletePlayer
);
router.get("/player/new", playerController_1.preFormCreatePlayer);
router.get(
  "/player/:firstName.:lastName.:code/edit",
  playerController_1.preFormUpdatePlayer
);
router.get("/player/:firstName.:lastName.:code", playerController_1.seePlayer);
router.post("/player/new", playerController_1.postFormCreatePlayer);
router.put(
  "/player/:firstName.:lastName.:code/edit",
  playerController_1.postFormUpdatePlayer
);
router.delete("/team/:name.:code", teamController_1.deleteTeam);
router.get("/team/new", teamController_1.preFormCreateTeam);
router.get("/team/:name.:code/edit", teamController_1.preFormUpdateTeam);
router.get("/team/:name.:code", teamController_1.seeTeam);
router.post("/team/new", teamController_1.postFormCreateTeam);
router.put("/team/:name.:code/edit", teamController_1.postFormUpdateTeam);
exports.default = router;
