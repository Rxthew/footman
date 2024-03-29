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
exports.postFormUpdateTeam =
  exports.preFormUpdateTeam =
  exports.postFormCreateTeam =
  exports.preFormCreateTeam =
  exports.seeTeam =
  exports.deleteTeam =
    void 0;
const express_validator_1 = require("express-validator");
const parameters_1 = require("./helpers/parameters");
const queryHelpers = __importStar(require("./helpers/queries"));
const renderers = __importStar(require("./helpers/renderers"));
const resultsGenerator = __importStar(require("./helpers/results"));
const validators = __importStar(require("./helpers/validators"));
const team_1 = __importDefault(require("../models/team"));
require("../models/concerns/_runModels");
const competition_1 = __importDefault(require("../models/competition"));
const competitionController_1 = require("./competitionController");
const {
  preFormCreateTeamRenderer,
  preFormUpdateTeamRenderer,
  seeTeamRenderer,
} = renderers;
const { createTeamValidator, updateTeamValidator } = validators;
let preFormCreateTeamResults = null;
let postFormCreateTeamResults = null;
let preFormUpdateTeamResults = null;
let postFormUpdateTeamResults = null;
let seeTeamResults = null;
const transactionWrapper = queryHelpers.transactionWrapper;
const storeTeamCompetitions = async function (req, _res, next) {
  (0, parameters_1.getTeamParameters)(req, next);
  const storeTeamCompetitionsCb = async function (t) {
    const parameters = (0, parameters_1.teamParameterPlaceholder)().parameters;
    const team = await team_1.default
      .findOne({
        where: {
          name: parameters.name,
          code: parameters.code,
        },
        include: [
          {
            model: competition_1.default,
          },
        ],
        transaction: t,
      })
      .catch(function (error) {
        throw error;
      });
    const competitions = await team
      .getCompetitions({ transaction: t })
      .catch(function (error) {
        throw error;
      });
    Object.assign(req.body, { currentCompetitions: competitions });
  };
  await transactionWrapper(storeTeamCompetitionsCb, next).catch(function (
    error
  ) {
    next(error);
  });
  (0, parameters_1.teamParameterPlaceholder)().reset();
  next();
};
const teamCompetitionIndexSignal = async function (req, res, next) {
  const checkTeamCompetitionsCounts = async function (comps) {
    let counts = [];
    const checkTeamCompetitionsCountsCb = async function (t) {
      const teamPromises = comps.map((comp) => {
        return async () => await comp.countTeams({ transaction: t });
      });
      const teamCounts = await Promise.all(
        teamPromises.map((promise) => promise())
      ).catch((err) => {
        throw err;
      });
      counts = [...teamCounts];
    };
    await transactionWrapper(checkTeamCompetitionsCountsCb, next).catch(
      function (error) {
        next(error);
      }
    );
    return {
      current: counts.some((count) => count === 0),
      chosen: counts.some((count) => count === 1),
    };
  };
  const compileChosenCompetitions = async function () {
    const chosenCompetitions = [];
    const compileCreateChosenCompetitionsCb = async function (t) {
      const newestTeam = await team_1.default
        .findOne({
          order: [["code", "DESC"]],
          include: [
            {
              model: competition_1.default,
            },
          ],
          transaction: t,
        })
        .catch(function (error) {
          throw error;
        });
      const competitions = await newestTeam
        .getCompetitions({ transaction: t })
        .catch(function (error) {
          throw error;
        });
      Object.assign(chosenCompetitions, competitions);
    };
    const compileUpdateChosenCompetitionsCb = async function (t) {
      const parameters = (0, parameters_1.teamParameterPlaceholder)()
        .parameters;
      const updatedTeam = await team_1.default
        .findOne({
          where: {
            name: parameters.name,
            code: parameters.code,
          },
          include: [
            {
              model: competition_1.default,
            },
          ],
          transaction: t,
        })
        .catch(function (error) {
          throw error;
        });
      const competitions = await updatedTeam
        .getCompetitions({ transaction: t })
        .catch(function (error) {
          throw error;
        });
      Object.assign(chosenCompetitions, competitions);
    };
    if (req.body.currentCompetitions) {
      (0, parameters_1.getTeamParameters)(req, next);
      await transactionWrapper(compileUpdateChosenCompetitionsCb, next).catch(
        function (error) {
          next(error);
        }
      );
      (0, parameters_1.teamParameterPlaceholder)().reset();
    } else {
      await transactionWrapper(compileCreateChosenCompetitionsCb, next).catch(
        function (error) {
          next(error);
        }
      );
    }
    return chosenCompetitions;
  };
  const current = req.body.currentCompetitions;
  const chosen = req.body.chosenCompetitions
    ? await compileChosenCompetitions()
    : req.body.chosenCompetitions;
  const createSignal = async function () {
    if (
      chosen.length === 0 ||
      !(await checkTeamCompetitionsCounts(chosen)).chosen
    ) {
      next();
    } else {
      (0, competitionController_1.competitionIndexSignal)(req, res, next);
    }
  };
  const deleteSignal = async function () {
    if (
      current.length === 0 ||
      !(await checkTeamCompetitionsCounts(current)).current
    ) {
      delete req.body.currentCompetitions;
      next();
    } else {
      delete req.body.currentCompetitions;
      (0, competitionController_1.competitionIndexSignal)(req, res, next);
    }
  };
  const updateSignal = async function () {
    if (
      (current.length === 0 && chosen.length === 0) ||
      (!(await checkTeamCompetitionsCounts(chosen)).chosen &&
        !(await checkTeamCompetitionsCounts(current)).current)
    ) {
      delete req.body.currentCompetitions;
      next();
    } else {
      delete req.body.currentCompetitions;
      (0, competitionController_1.competitionIndexSignal)(req, res, next);
    }
  };
  switch (true) {
    case !!current && !!chosen:
      await updateSignal();
      break;
    case !!current:
      await deleteSignal();
      break;
    case !!chosen:
      await createSignal();
      break;
    default:
      (() => {
        delete req.body.currentCompetitions;
        next();
      })();
  }
};
const deleteTeamCb = async function (t) {
  const parameters = (0, parameters_1.teamParameterPlaceholder)().parameters;
  const team = await team_1.default
    .findOne({
      where: {
        name: parameters.name,
        code: parameters.code,
      },
      transaction: t,
    })
    .catch(function (error) {
      throw error;
    });
  await team?.destroy().catch(function (error) {
    throw error;
  });
};
exports.deleteTeam = [
  storeTeamCompetitions,
  async function (req, res, next) {
    (0, parameters_1.getTeamParameters)(req, next);
    await transactionWrapper(deleteTeamCb, next).catch(function (error) {
      next(error);
    });
    next();
  },
  teamCompetitionIndexSignal,
  (req, res) => {
    const goToHomePage = function () {
      res.redirect("/");
    };
    goToHomePage();
    (0, parameters_1.teamParameterPlaceholder)().reset();
  },
];
const seeTeamCb = async function (t) {
  const {
    getAllCompetitionNames,
    getAllCompetitionUrlParams,
    getAllPlayerUrlParams,
  } = queryHelpers;
  const seeTeamQuery = async function () {
    const sortTeamData = function (arrayData) {
      arrayData && arrayData.length > 0 ? arrayData.sort() : arrayData;
    };
    const parameters = (0, parameters_1.teamParameterPlaceholder)().parameters;
    const team = await team_1.default
      .findOne({
        where: {
          name: parameters.name,
          code: parameters.code,
        },
        transaction: t,
      })
      .catch(function (error) {
        throw error;
      });
    const playersResults = await team
      ?.getPlayers({ transaction: t })
      .catch(function (error) {
        throw error;
      });
    const competitionsResults = await team
      ?.getCompetitions(
        { joinTableAttributes: ["season", "points", "ranking"] },
        { transaction: t }
      )
      .catch(function (error) {
        throw error;
      });
    const competitions =
      competitionsResults && competitionsResults.length > 0
        ? getAllCompetitionNames(competitionsResults)
        : competitionsResults;
    const players =
      playersResults && playersResults.length > 0
        ? playersResults.map(
            (player) =>
              `${player.getDataValue("firstName")} ${player.getDataValue(
                "lastName"
              )}`
          )
        : playersResults;
    const competitionUrls =
      competitionsResults && competitionsResults.length > 0
        ? getAllCompetitionUrlParams(competitionsResults, ["name", "code"])
        : competitionsResults;
    const playerUrls =
      playersResults && playersResults.length > 0
        ? getAllPlayerUrlParams(playersResults, [
            "firstName",
            "lastName",
            "code",
          ])
        : competitionsResults;
    const sortedData = [competitions, players, competitionUrls, playerUrls];
    sortedData.map((data) => sortTeamData(data));
    return {
      team,
      players,
      competitions,
      competitionUrls,
      playerUrls,
    };
  };
  const results = await seeTeamQuery().catch(function (error) {
    throw error;
  });
  const populateSeeTeamResults = function () {
    if (results.team && results.players && results.competitions) {
      seeTeamResults = resultsGenerator.seeTeam();
      Object.assign(
        seeTeamResults,
        results.team.get(),
        { players: results.players },
        { competitions: results.competitions },
        { competitionUrls: results.competitionUrls },
        { playerUrls: results.playerUrls }
      );
    } else {
      const err = new Error(
        "Query regarding team viewing returned invalid data."
      );
      throw err;
    }
  };
  try {
    populateSeeTeamResults();
  } catch (err) {
    console.log(err);
    const newErr = new Error(
      "Query regarding team viewing returned invalid data."
    );
    throw newErr;
  }
  return;
};
const seeTeam = async function (req, res, next) {
  (0, parameters_1.getTeamParameters)(req, next);
  await transactionWrapper(seeTeamCb, next).catch(function (error) {
    next(error);
  });
  if (seeTeamResults) {
    seeTeamRenderer(res, seeTeamResults);
  }
  (0, parameters_1.teamParameterPlaceholder)().reset();
  seeTeamResults = null;
  return;
};
exports.seeTeam = seeTeam;
const preFormCreateTeamCb = async function (t) {
  const { getAllCompetitions, getAllCompetitionNames } = queryHelpers;
  const getAllSeasons = queryHelpers.getSeasons;
  const results = await getAllCompetitions(t).catch(function (error) {
    throw error;
  });
  const populatePreFormCreateTeam = function () {
    if (results) {
      const competitions = getAllCompetitionNames(results);
      Object.assign(
        preFormCreateTeamResults,
        { competitions: competitions },
        { seasons: getAllSeasons() }
      );
    } else {
      const err = new Error(
        "Query regarding team creation returned invalid data."
      );
      throw err;
    }
  };
  try {
    populatePreFormCreateTeam();
  } catch (err) {
    console.log(err);
    const newErr = new Error(
      "Query regarding team creation returned invalid data."
    );
    throw newErr;
  }
  return;
};
const preFormCreateTeam = async function (req, res, next) {
  preFormCreateTeamResults = resultsGenerator.preFormCreateTeam();
  await transactionWrapper(preFormCreateTeamCb, next).catch(function (error) {
    next(error);
  });
  if (preFormCreateTeamResults) {
    preFormCreateTeamRenderer(res, preFormCreateTeamResults);
  }
  preFormCreateTeamResults = null;
};
exports.preFormCreateTeam = preFormCreateTeam;
const postFormCreateTeamCb = async function (t) {
  const { nextCompetitionTemplate } = queryHelpers;
  const getRelevantCompetitions = async function () {
    let competitionPromises = [];
    const competitionNames = postFormCreateTeamResults.chosenCompetitions;
    const chosenSeason = postFormCreateTeamResults.season;
    if (competitionNames && competitionNames.length > 0 && chosenSeason) {
      for (const compName of competitionNames) {
        const nextPromise = async function () {
          return await nextCompetitionTemplate(t, compName, chosenSeason).catch(
            function (err) {
              throw err;
            }
          );
        };
        competitionPromises = [...competitionPromises, nextPromise];
      }
    }
    return competitionPromises;
  };
  const createDissociatedTeam = async function () {
    const newTeam = await team_1.default
      .create(
        {
          ...postFormCreateTeamResults,
        },
        { transaction: t }
      )
      .catch(function (err) {
        throw err;
      });
    return newTeam;
  };
  const createTeam = async function () {
    const teamParameters = {
      ...postFormCreateTeamResults,
    };
    Object.assign(teamParameters, { chosenCompetitions: undefined });
    const chosenSeason = postFormCreateTeamResults.season;
    const competitionPromises = await getRelevantCompetitions().catch(function (
      err
    ) {
      throw err;
    });
    if (competitionPromises.length === 0) {
      return await createDissociatedTeam();
    }
    const relevantCompetitions = await Promise.all(
      competitionPromises.map((competitionPromise) => competitionPromise())
    ).catch(function (err) {
      throw err;
    });
    const newTeam = await team_1.default
      .create({ ...teamParameters }, { transaction: t })
      .catch(function (err) {
        throw err;
      });
    await newTeam
      .setCompetitions(relevantCompetitions, {
        transaction: t,
        through: { season: chosenSeason },
      })
      .catch(function (err) {
        throw err;
      });
  };
  await createTeam().catch(function (err) {
    throw err;
  });
};
exports.postFormCreateTeam = [
  ...createTeamValidator(),
  async function (req, res, next) {
    postFormCreateTeamResults = resultsGenerator.postFormCreateTeam();
    preFormCreateTeamResults = resultsGenerator.preFormCreateTeam();
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
      await transactionWrapper(preFormCreateTeamCb, next).catch(function (
        error
      ) {
        next(error);
      });
      Object.assign(
        preFormCreateTeamResults,
        { errors: errors.mapped() },
        req.body
      );
      preFormCreateTeamRenderer(res, preFormCreateTeamResults);
      preFormCreateTeamResults = null;
      postFormCreateTeamResults = null;
    } else {
      Object.assign(postFormCreateTeamResults, req.body);
      await transactionWrapper(postFormCreateTeamCb, next).catch(function (
        error
      ) {
        next(error);
      });
      next();
    }
  },
  teamCompetitionIndexSignal,
  async (_req, res, next) => {
    const goToTeamPage = async function () {
      try {
        const latestCode = await team_1.default
          .max("code")
          .catch(function (error) {
            throw error;
          });
        const teamName = postFormCreateTeamResults.name;
        res.redirect(`/team/${teamName}.${latestCode}`);
      } catch (err) {
        if (err) {
          console.log(err);
          return next(err);
        }
      }
    };
    await goToTeamPage().catch(function (error) {
      next(error);
    });
    preFormCreateTeamResults = null;
    postFormCreateTeamResults = null;
  },
];
const preFormUpdateTeamCb = async function (t) {
  const { getAllCompetitions, getAllCompetitionNames, getTeamSeason } =
    queryHelpers;
  const getSeasons = queryHelpers.getSeasons;
  const updateTeamQuery = async function () {
    const parameters = (0, parameters_1.teamParameterPlaceholder)().parameters;
    const competitions = await getAllCompetitions(t).catch(function (error) {
      throw error;
    });
    const competitionNames = getAllCompetitionNames(competitions);
    const team = await team_1.default
      .findOne({
        where: {
          name: parameters.name,
          code: parameters.code,
        },
        transaction: t,
      })
      .catch(function (error) {
        throw error;
      });
    const teamCompetitions = team
      ? await team.getCompetitions({ transaction: t }).catch(function (error) {
          throw error;
        })
      : [];
    const chosenCompetitions = getAllCompetitionNames(teamCompetitions);
    const season = getTeamSeason(teamCompetitions);
    return {
      chosenCompetitions,
      competitionNames,
      season,
      team,
    };
  };
  const results = await updateTeamQuery().catch(function (error) {
    throw error;
  });
  const populatePreFormUpdateTeam = function () {
    if (results.team) {
      Object.assign(
        preFormUpdateTeamResults,
        results.team.get(),
        { competitions: results.competitionNames },
        { chosenCompetitions: results.chosenCompetitions },
        { season: results.season },
        { seasons: getSeasons() }
      );
    } else {
      const err = new Error(
        "Query regarding team update returned invalid data."
      );
      throw err;
    }
  };
  try {
    populatePreFormUpdateTeam();
  } catch (err) {
    console.log(err);
    const newErr = new Error(
      "Query regarding team update returned invalid data."
    );
    throw newErr;
  }
  return;
};
const preFormUpdateTeam = async function (req, res, next) {
  (0, parameters_1.getTeamParameters)(req, next);
  preFormUpdateTeamResults = resultsGenerator.preFormUpdateTeam();
  await transactionWrapper(preFormUpdateTeamCb, next).catch(function (error) {
    next(error);
  });
  if (preFormUpdateTeamResults) {
    preFormUpdateTeamRenderer(res, preFormUpdateTeamResults);
  }
  (0, parameters_1.teamParameterPlaceholder)().reset();
  preFormUpdateTeamResults = null;
  return;
};
exports.preFormUpdateTeam = preFormUpdateTeam;
const postFormUpdateTeamCb = async function (t) {
  const { nextCompetitionTemplate } = queryHelpers;
  const getRelevantCompetitions = async function () {
    let competitionPromises = [];
    const competitionNames = postFormUpdateTeamResults.chosenCompetitions;
    const chosenSeason = postFormUpdateTeamResults.season;
    if (competitionNames && competitionNames.length > 0 && chosenSeason) {
      for (const compName of competitionNames) {
        const nextPromise = async function () {
          return await nextCompetitionTemplate(t, compName, chosenSeason).catch(
            function (err) {
              throw err;
            }
          );
        };
        competitionPromises = [...competitionPromises, nextPromise];
      }
    }
    return competitionPromises;
  };
  const updateTeam = async function () {
    const previousParameters = (0, parameters_1.teamParameterPlaceholder)()
      .parameters;
    const teamParameters = { ...postFormUpdateTeamResults };
    Object.assign(teamParameters, { chosenCompetitions: undefined });
    const chosenSeason = postFormUpdateTeamResults.season;
    const competitionPromises = await getRelevantCompetitions().catch(function (
      err
    ) {
      throw err;
    });
    const relevantCompetitions =
      competitionPromises.length > 0
        ? await Promise.all(
            competitionPromises.map((competitionPromise) =>
              competitionPromise()
            )
          ).catch(function (err) {
            throw err;
          })
        : competitionPromises;
    const updatedTeam = await team_1.default
      .findOne({
        where: {
          name: previousParameters.name,
          code: previousParameters.code,
        },
        include: [
          {
            model: competition_1.default,
          },
        ],
        transaction: t,
      })
      .catch(function (err) {
        throw err;
      });
    updatedTeam?.set({ ...teamParameters });
    postFormUpdateTeamResults = postFormUpdateTeamResults;
    if (
      postFormUpdateTeamResults.chosenCompetitions &&
      postFormUpdateTeamResults.season
    ) {
      await updatedTeam
        .setCompetitions(relevantCompetitions, {
          transaction: t,
          through: { season: chosenSeason },
        })
        .catch(function (err) {
          throw err;
        });
    } else {
      await updatedTeam
        .setCompetitions(null, { transaction: t })
        .catch(function (error) {
          throw error;
        });
    }
    await updatedTeam?.save().catch(function (err) {
      throw err;
    });
  };
  await updateTeam().catch(function (err) {
    throw err;
  });
};
exports.postFormUpdateTeam = [
  ...updateTeamValidator(),
  storeTeamCompetitions,
  async function (req, res, next) {
    postFormUpdateTeamResults = resultsGenerator.postFormUpdateTeam();
    preFormUpdateTeamResults = resultsGenerator.preFormUpdateTeam();
    (0, parameters_1.getTeamParameters)(req, next);
    const errors = (0, express_validator_1.validationResult)(req);
    const requestBody = Object.assign({}, req.body);
    delete requestBody.currentCompetitions;
    if (!errors.isEmpty()) {
      await transactionWrapper(preFormUpdateTeamCb, next).catch(function (err) {
        next(err);
      });
      Object.assign(preFormUpdateTeamResults, requestBody, {
        errors: errors.mapped(),
      });
      preFormUpdateTeamRenderer(res, preFormUpdateTeamResults);
      (0, parameters_1.teamParameterPlaceholder)().reset();
      preFormUpdateTeamResults = null;
      postFormUpdateTeamResults = null;
    } else {
      Object.assign(postFormUpdateTeamResults, requestBody);
      await transactionWrapper(postFormUpdateTeamCb, next).catch(function (
        error
      ) {
        next(error);
      });
      next();
    }
  },
  teamCompetitionIndexSignal,
  async function (req, res) {
    const [name, code] = [postFormUpdateTeamResults.name, req.params.code];
    (0, parameters_1.teamParameterPlaceholder)().reset();
    preFormUpdateTeamResults = null;
    postFormUpdateTeamResults = null;
    res.redirect(`/team/${name}.${code}`);
  },
];
