import express from "express";
import {
  populateDatabaseWithDummyData,
  seeHomepage,
} from "../controllers/indexController";
import {
  competitionIndexData,
  deleteCompetition,
  postFormCreateCompetition,
  postFormUpdateCompetition,
  preFormCreateCompetition,
  preFormUpdateCompetition,
  seeCompetition,
  seeCompetitionIndex,
  setIndexDataCache,
} from "../controllers/competitionController";
import {
  deletePlayer,
  postFormCreatePlayer,
  postFormUpdatePlayer,
  preFormCreatePlayer,
  preFormUpdatePlayer,
  seePlayer,
} from "../controllers/playerController";
import {
  deleteTeam,
  postFormCreateTeam,
  postFormUpdateTeam,
  preFormCreateTeam,
  preFormUpdateTeam,
  seeTeam,
} from "../controllers/teamController";

const router = express.Router();

router.use("/", populateDatabaseWithDummyData);
router.get("/", seeHomepage);
router.use("/competition/data", setIndexDataCache);

router.delete("/competition/:name.:code", deleteCompetition);
router.get("/competition/new", preFormCreateCompetition);
router.get("/competition/:name.:code/edit", preFormUpdateCompetition);
router.get("/competition/:name.:code", seeCompetition);
router.get(/competition\/data/, competitionIndexData);
router.get("/competition/index", seeCompetitionIndex);
router.post("/competition/new", postFormCreateCompetition);
router.put("/competition/:name.:code/edit", postFormUpdateCompetition);

router.delete("/player/:firstName.:lastName.:code", deletePlayer);
router.get("/player/new", preFormCreatePlayer);
router.get("/player/:firstName.:lastName.:code/edit", preFormUpdatePlayer);
router.get("/player/:firstName.:lastName.:code", seePlayer);
router.post("/player/new", postFormCreatePlayer);
router.put("/player/:firstName.:lastName.:code/edit", postFormUpdatePlayer);

router.delete("/team/:name.:code", deleteTeam);
router.get("/team/new", preFormCreateTeam);
router.get("/team/:name.:code/edit", preFormUpdateTeam);
router.get("/team/:name.:code", seeTeam);
router.post("/team/new", postFormCreateTeam);
router.put("/team/:name.:code/edit", postFormUpdateTeam);

export default router;
