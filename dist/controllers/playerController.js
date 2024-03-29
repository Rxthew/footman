"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }
    : function (o, v) {
        o["default"] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod)
        if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
          __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.postFormUpdatePlayer =
  exports.preFormUpdatePlayer =
  exports.postFormCreatePlayer =
  exports.preFormCreatePlayer =
  exports.seePlayer =
  exports.deletePlayer =
    void 0;
const express_validator_1 = require("express-validator");
const parameters_1 = require("./helpers/parameters");
const queryHelpers = __importStar(require("./helpers/queries"));
const renderers = __importStar(require("./helpers/renderers"));
const validators = __importStar(require("./helpers/validators"));
const resultsGenerator = __importStar(require("./helpers/results"));
const player_1 = __importDefault(require("../models/player"));
const team_1 = __importDefault(require("../models/team"));
require("../models/concerns/_runModels");
const competition_1 = __importDefault(require("../models/competition"));
const {
  preFormCreatePlayerRenderer,
  preFormUpdatePlayerRenderer,
  seePlayerRenderer,
} = renderers;
const { submitPlayerValidator } = validators;
let seePlayerResults = null;
let preFormCreatePlayerResults = null;
let postFormCreatePlayerResults = null;
let preFormUpdatePlayerResults = null;
let postFormUpdatePlayerResults = null;
const transactionWrapper = queryHelpers.transactionWrapper;
const deletePlayerCb = async function (t) {
  const parameters = (0, parameters_1.playerParameterPlaceholder)().parameters;
  const player = await player_1.default
    .findOne({
      where: {
        firstName: parameters.firstName,
        lastName: parameters.lastName,
        code: parameters.code,
      },
      transaction: t,
    })
    .catch(function (error) {
      throw error;
    });
  await player?.destroy().catch(function (error) {
    throw error;
  });
};
const deletePlayer = async function (req, res, next) {
  (0, parameters_1.getPlayerParameters)(req, next);
  await transactionWrapper(deletePlayerCb, next).catch(function (error) {
    next(error);
  });
  const goToHomePage = function () {
    res.redirect("/");
  };
  goToHomePage();
  (0, parameters_1.playerParameterPlaceholder)().reset();
};
exports.deletePlayer = deletePlayer;
const seePlayerCb = async function (t) {
  const seePlayerQuery = async function () {
    const parameters = (0, parameters_1.playerParameterPlaceholder)()
      .parameters;
    const player = await player_1.default
      .findOne({
        where: {
          firstName: parameters.firstName,
          lastName: parameters.lastName,
          code: parameters.code,
        },
        transaction: t,
      })
      .catch(function (error) {
        throw error;
      });
    const team = await player
      ?.getTeam({ transaction: t })
      .catch(function (error) {
        throw error;
      });
    return {
      player,
      team,
    };
  };
  const results = await seePlayerQuery().catch(function (error) {
    throw error;
  });
  const populateSeePlayerResults = function () {
    if (results.player) {
      seePlayerResults = resultsGenerator.seePlayer();
      Object.assign(seePlayerResults, results.player.get());
      if (results.team) {
        const url = queryHelpers.getAllTeamUrlParams(
          [results.team],
          ["name", "code"]
        )[0];
        Object.assign(
          seePlayerResults,
          { team: results.team.getDataValue("name") },
          { teamUrl: url }
        );
      }
    } else {
      const err = new Error(
        "Query regarding player viewing returned invalid data."
      );
      throw err;
    }
  };
  try {
    populateSeePlayerResults();
  } catch (err) {
    console.log(err);
    const newErr = new Error(
      "Query regarding player viewing returned invalid data."
    );
    throw newErr;
  }
  return;
};
const seePlayer = async function (req, res, next) {
  (0, parameters_1.getPlayerParameters)(req, next);
  await transactionWrapper(seePlayerCb, next).catch(function (error) {
    next(error);
  });
  if (seePlayerResults) {
    seePlayerRenderer(res, seePlayerResults);
  }
  (0, parameters_1.playerParameterPlaceholder)().reset();
  seePlayerResults = null;
  return;
};
exports.seePlayer = seePlayer;
const preFormCreatePlayerCb = async function (t) {
  const {
    getAllTeams,
    getAllTeamsWithCompetitions,
    getAllTeamNames,
    getAllSeasons,
  } = queryHelpers;
  const results = await getAllTeams(t).catch(function (error) {
    throw error;
  });
  const populatePreFormCreatePlayer = async function () {
    if (results) {
      const associatedTeams = await getAllTeamsWithCompetitions(t, results);
      const teams = getAllTeamNames(associatedTeams);
      const seasons = getAllSeasons(results, "team");
      Object.assign(
        preFormCreatePlayerResults,
        { teams: teams },
        { seasons: seasons }
      );
    } else {
      const err = new Error(
        "Query regarding player creation returned invalid data."
      );
      throw err;
    }
  };
  try {
    await populatePreFormCreatePlayer();
  } catch (err) {
    console.log(err);
    const newErr = new Error(
      "Query regarding player creation returned invalid data."
    );
    throw newErr;
  }
  return;
};
const preFormCreatePlayer = async function (req, res, next) {
  preFormCreatePlayerResults = resultsGenerator.preFormCreatePlayer();
  await transactionWrapper(preFormCreatePlayerCb, next).catch(function (error) {
    next(error);
  });
  if (preFormCreatePlayerResults) {
    preFormCreatePlayerRenderer(res, preFormCreatePlayerResults);
  }
  preFormCreatePlayerResults = null;
  return;
};
exports.preFormCreatePlayer = preFormCreatePlayer;
const postFormCreatePlayerCb = async function (t) {
  const getTeam = async function () {
    postFormCreatePlayerResults = postFormCreatePlayerResults;
    const team = await team_1.default
      .findOne({
        where: {
          name: postFormCreatePlayerResults.team,
        },
        include: {
          model: competition_1.default,
          required: true,
          through: {
            where: {
              season: postFormCreatePlayerResults.season,
            },
          },
        },
        transaction: t,
      })
      .catch(function (error) {
        throw error;
      });
    return team;
  };
  const createPlayer = async function () {
    postFormCreatePlayerResults = postFormCreatePlayerResults;
    const playerParameters = { ...postFormCreatePlayerResults };
    Object.assign(playerParameters, { team: undefined }, { season: undefined });
    const newPlayer = await player_1.default
      .create(
        {
          ...playerParameters,
        },
        { transaction: t }
      )
      .catch(function (error) {
        throw error;
      });
    if (
      postFormCreatePlayerResults.team &&
      postFormCreatePlayerResults.season
    ) {
      const team = await getTeam().catch(function (error) {
        throw error;
      });
      await newPlayer.setTeam(team, { transaction: t }).catch(function (error) {
        throw error;
      });
    }
  };
  await createPlayer().catch(function (err) {
    throw err;
  });
};
exports.postFormCreatePlayer = [
  ...submitPlayerValidator(),
  async function (req, res, next) {
    const goToPlayerPage = async function () {
      postFormCreatePlayerResults = postFormCreatePlayerResults;
      try {
        const latestCode = await player_1.default
          .max("code")
          .catch(function (error) {
            throw error;
          });
        const firstName = postFormCreatePlayerResults.firstName;
        const lastName = postFormCreatePlayerResults.lastName;
        res.redirect(`/player/${firstName}.${lastName}.${latestCode}`);
      } catch (err) {
        if (err) {
          console.log(err);
          return next(err);
        }
      }
    };
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
      preFormCreatePlayerResults = resultsGenerator.preFormCreatePlayer();
      await transactionWrapper(preFormCreatePlayerCb, next).catch(function (
        error
      ) {
        next(error);
      });
      Object.assign(
        preFormCreatePlayerResults,
        { errors: errors.mapped() },
        req.body
      );
      preFormCreatePlayerRenderer(res, preFormCreatePlayerResults);
    } else {
      postFormCreatePlayerResults = resultsGenerator.postFormCreatePlayer();
      Object.assign(postFormCreatePlayerResults, req.body);
      await transactionWrapper(postFormCreatePlayerCb, next).catch(function (
        error
      ) {
        next(error);
      });
      await goToPlayerPage().catch(function (error) {
        next(error);
      });
    }
    preFormCreatePlayerResults = null;
    postFormCreatePlayerResults = null;
  },
];
const preFormUpdatePlayerCb = async function (t) {
  const {
    getAllTeams,
    getAllTeamsWithCompetitions,
    getAllTeamNames,
    getAllSeasons,
    getTeamSeason,
  } = queryHelpers;
  const allTeams = await getAllTeams(t).catch(function (error) {
    throw error;
  });
  const allAssociatedTeams = await getAllTeamsWithCompetitions(t, allTeams);
  const updatePlayerQuery = async function () {
    const parameters = (0, parameters_1.playerParameterPlaceholder)()
      .parameters;
    const player = await player_1.default
      .findOne({
        where: {
          firstName: parameters.firstName,
          lastName: parameters.lastName,
          code: parameters.code,
        },
        transaction: t,
      })
      .catch(function (error) {
        throw error;
      });
    const team = await player
      ?.getTeam({
        include: [
          {
            model: competition_1.default,
            through: { attributes: ["season"] },
          },
        ],
        transaction: t,
      })
      .catch(function (error) {
        throw error;
      });
    const teams = getAllTeamNames(allAssociatedTeams);
    const seasons = getAllSeasons(allTeams, "team");
    const season =
      team && team.competitions ? getTeamSeason(team.competitions) : undefined;
    return {
      player,
      team,
      teams,
      seasons,
      season,
    };
  };
  const results = await updatePlayerQuery().catch(function (error) {
    throw error;
  });
  const populatePreFormUpdatePlayer = function () {
    if (results.player && results.teams && results.seasons) {
      preFormUpdatePlayerResults = resultsGenerator.preFormUpdatePlayer();
      Object.assign(
        preFormUpdatePlayerResults,
        results.player.get(),
        { teams: results.teams },
        { seasons: results.seasons }
      );
      if (results.team && results.season) {
        Object.assign(
          preFormUpdatePlayerResults,
          { team: results.team.getDataValue("name") },
          { season: results.season }
        );
      }
    } else {
      const err = new Error(
        "Query regarding player update returned invalid data."
      );
      throw err;
    }
  };
  try {
    populatePreFormUpdatePlayer();
  } catch (err) {
    console.log(err);
    const newErr = new Error(
      "Query regarding player update returned invalid data."
    );
    throw newErr;
  }
  return;
};
const preFormUpdatePlayer = async function (req, res, next) {
  (0, parameters_1.getPlayerParameters)(req, next);
  preFormUpdatePlayerResults = resultsGenerator.preFormUpdatePlayer();
  await transactionWrapper(preFormUpdatePlayerCb, next).catch(function (error) {
    next(error);
  });
  if (preFormUpdatePlayerResults) {
    preFormUpdatePlayerRenderer(res, preFormUpdatePlayerResults);
  }
  (0, parameters_1.playerParameterPlaceholder)().reset();
  preFormUpdatePlayerResults = null;
  return;
};
exports.preFormUpdatePlayer = preFormUpdatePlayer;
const postFormUpdatePlayerCb = async function (t) {
  const getTeam = async function () {
    postFormUpdatePlayerResults = postFormUpdatePlayerResults;
    const team = await team_1.default
      .findOne({
        where: {
          name: postFormUpdatePlayerResults.team,
        },
        include: {
          model: competition_1.default,
          required: true,
          through: {
            where: {
              season: postFormUpdatePlayerResults.season,
            },
          },
        },
        transaction: t,
      })
      .catch(function (error) {
        throw error;
      });
    return team;
  };
  const getPlayer = async function () {
    postFormUpdatePlayerResults = postFormUpdatePlayerResults;
    const { firstName, lastName, code } = postFormUpdatePlayerResults;
    const player = await player_1.default
      .findOne({
        where: {
          firstName: firstName,
          lastName: lastName,
          code: code,
        },
        transaction: t,
      })
      .catch(function (error) {
        throw error;
      });
    return player;
  };
  const updatePlayer = async function () {
    postFormUpdatePlayerResults = postFormUpdatePlayerResults;
    const playerParameters = { ...postFormUpdatePlayerResults };
    Object.assign(playerParameters, { team: undefined }, { season: undefined });
    await player_1.default
      .update(
        {
          ...playerParameters,
        },
        { where: { code: postFormUpdatePlayerResults.code }, transaction: t }
      )
      .catch(function (error) {
        throw error;
      });
    const updatedPlayer = await getPlayer().catch(function (error) {
      throw error;
    });
    if (
      postFormUpdatePlayerResults.team &&
      postFormUpdatePlayerResults.season
    ) {
      const team = await getTeam().catch(function (error) {
        throw error;
      });
      await updatedPlayer
        .setTeam(team, { transaction: t })
        .catch(function (error) {
          throw error;
        });
    } else {
      await updatedPlayer
        .setTeam(null, { transaction: t })
        .catch(function (error) {
          throw error;
        });
    }
  };
  await updatePlayer().catch(function (err) {
    throw err;
  });
};
exports.postFormUpdatePlayer = [
  ...submitPlayerValidator(),
  async function (req, res, next) {
    postFormUpdatePlayerResults = resultsGenerator.postFormUpdatePlayer();
    preFormUpdatePlayerResults = resultsGenerator.preFormUpdatePlayer();
    (0, parameters_1.getPlayerParameters)(req, next);
    Object.assign(postFormUpdatePlayerResults, { code: req.params.code });
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
      await transactionWrapper(preFormUpdatePlayerCb, next).catch(function (
        error
      ) {
        next(error);
      });
      Object.assign(preFormUpdatePlayerResults, req.body, {
        errors: errors.mapped(),
      });
      preFormUpdatePlayerRenderer(res, preFormUpdatePlayerResults);
    } else {
      Object.assign(postFormUpdatePlayerResults, req.body);
      await transactionWrapper(postFormUpdatePlayerCb, next).catch(function (
        error
      ) {
        next(error);
      });
      const { firstName, lastName, code } = postFormUpdatePlayerResults;
      res.redirect(`/player/${firstName}.${lastName}.${code}`);
    }
    (0, parameters_1.playerParameterPlaceholder)().reset();
    preFormUpdatePlayerResults = null;
    postFormUpdatePlayerResults = null;
  },
];
