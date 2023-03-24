/* eslint-disable @typescript-eslint/no-explicit-any */

import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import {
  getTeamParameters,
  teamParameterPlaceholder,
} from "./helpers/parameters";
import * as queryHelpers from "./helpers/queries";
import * as renderers from "./helpers/renderers";
import * as resultsGenerator from "./helpers/results";
import * as validators from "./helpers/validators";
import Team from "../models/team";
import { Transaction } from "sequelize";
import "../models/concerns/_runModels";
import Competition, { CompetitionModel } from "../models/competition";
import { competitionIndexSignal } from "./competitionController";

const {
  preFormCreateTeamRenderer,
  preFormUpdateTeamRenderer,
  seeTeamRenderer,
} = renderers;

const { createTeamValidator, updateTeamValidator } = validators;

let preFormCreateTeamResults: resultsGenerator.preFormCreateTeamResults | null =
  null;
let postFormCreateTeamResults: resultsGenerator.postFormCreateTeamResults | null =
  null;
let preFormUpdateTeamResults: resultsGenerator.preFormUpdateTeamResults | null =
  null;
let postFormUpdateTeamResults: resultsGenerator.postFormUpdateTeamResults | null =
  null;
let seeTeamResults: resultsGenerator.seeTeamResults | null = null;
const transactionWrapper = queryHelpers.transactionWrapper;

const storeTeamCompetitions = async function (
  req: Request,
  _res: Response,
  next: NextFunction
) {
  getTeamParameters(req, next);
  const storeTeamCompetitionsCb = async function (t: Transaction) {
    const parameters = teamParameterPlaceholder().parameters;
    const team = await Team.findOne({
      where: {
        name: parameters.name,
        code: parameters.code,
      },
      include: [
        {
          model: Competition,
        },
      ],
      transaction: t,
    }).catch(function (error: Error) {
      throw error;
    });
    const competitions = await (team as any)
      .getCompetitions({ transaction: t })
      .catch(function (error: Error) {
        throw error;
      });
    Object.assign(req.body, { currentCompetitions: competitions });
  };

  await transactionWrapper(storeTeamCompetitionsCb, next).catch(function (
    error: Error
  ) {
    next(error);
  });

  teamParameterPlaceholder().reset();
  next();
};

const teamCompetitionIndexSignal = async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  const checkTeamCompetitionsCounts = async function (
    comps: CompetitionModel[]
  ): Promise<boolean> {
    let counts: number[] = [];
    const checkTeamCompetitionsCountsCb = async function (t: Transaction) {
      const teamPromises = comps.map((comp) => {
        return async () => await (comp as any).countTeams({ transaction: t });
      });
      const teamCounts = await Promise.all(
        teamPromises.map((promise) => promise())
      ).catch((err: Error) => {
        throw err;
      });
      counts = [...teamCounts];
    };
    await transactionWrapper(checkTeamCompetitionsCountsCb, next).catch(
      function (error: Error) {
        next(error);
      }
    );
    if (req.body.currentCompetitions) {
      return counts.some((count) => count === 0);
    } else {
      return counts.some((count) => count === 1);
    }
  };

  const compileChosenCompetitions = async function () {
    const chosenCompetitions: CompetitionModel[] = [];
    const compileChosenCompetitionsCb = async function (t: Transaction) {
      const newestTeam = await Team.findOne({
        order: [["code", "DESC"]],
        include: [
          {
            model: Competition,
          },
        ],
        transaction: t,
      }).catch(function (error: Error) {
        throw error;
      });
      const competitions = await (newestTeam as any)
        .getCompetitions({ transaction: t })
        .catch(function (error: Error) {
          throw error;
        });
      Object.assign(chosenCompetitions, competitions);
    };
    await transactionWrapper(compileChosenCompetitionsCb, next).catch(function (
      error: Error
    ) {
      next(error);
    });
    return chosenCompetitions;
  };

  const competitionsReference = req.body.currentCompetitions
    ? req.body.currentCompetitions
    : await compileChosenCompetitions();
  if (
    competitionsReference.length === 0 ||
    !(await checkTeamCompetitionsCounts(competitionsReference))
  ) {
    delete req.body.currentCompetitions;
    next();
  } else {
    delete req.body.currentCompetitions;
    competitionIndexSignal(req, res, next);
  }
};

const deleteTeamCb = async function (t: Transaction): Promise<void> {
  const parameters = teamParameterPlaceholder().parameters;

  const team = await Team.findOne({
    where: {
      name: parameters.name,
      code: parameters.code,
    },
    transaction: t,
  }).catch(function (error: Error) {
    throw error;
  });

  await team?.destroy().catch(function (error: Error) {
    throw error;
  });
};

export const deleteTeam = [
  storeTeamCompetitions,
  async function (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    getTeamParameters(req, next);

    await transactionWrapper(deleteTeamCb, next).catch(function (error: Error) {
      next(error);
    });
    next();
  },
  teamCompetitionIndexSignal,
  (req: Request, res: Response) => {
    const goToHomePage = function () {
      res.redirect("/");
    };

    goToHomePage();
    teamParameterPlaceholder().reset();
  },
];

const seeTeamCb = async function (t: Transaction): Promise<void> {
  const {
    getAllCompetitionNames,
    getAllCompetitionUrlParams,
    getAllPlayerUrlParams,
  } = queryHelpers;

  const seeTeamQuery = async function () {
    const sortTeamData = function (arrayData: any[] | undefined) {
      arrayData && arrayData.length > 0 ? arrayData.sort() : arrayData;
    };

    const parameters = teamParameterPlaceholder().parameters;
    const team = await Team.findOne({
      where: {
        name: parameters.name,
        code: parameters.code,
      },
      transaction: t,
    }).catch(function (error: Error) {
      throw error;
    });
    const playersResults = await (team as any)
      ?.getPlayers({ transaction: t })
      .catch(function (error: Error) {
        throw error;
      });
    const competitionsResults = await (team as any)
      ?.getCompetitions(
        { joinTableAttributes: ["season", "points", "ranking"] },
        { transaction: t }
      )
      .catch(function (error: Error) {
        throw error;
      });
    const competitions =
      competitionsResults && competitionsResults.length > 0
        ? getAllCompetitionNames(competitionsResults)
        : competitionsResults;
    const players =
      playersResults && playersResults.length > 0
        ? (playersResults as any[]).map(
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
  const results = await seeTeamQuery().catch(function (error: Error) {
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

export const seeTeam = async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  getTeamParameters(req, next);

  await transactionWrapper(seeTeamCb, next).catch(function (error: Error) {
    next(error);
  });
  if (seeTeamResults) {
    seeTeamRenderer(res, seeTeamResults);
  }

  teamParameterPlaceholder().reset();
  seeTeamResults = null;

  return;
};

const preFormCreateTeamCb = async function (t: Transaction) {
  const { getAllCompetitions, getAllCompetitionNames } = queryHelpers;
  const getAllSeasons = queryHelpers.getSeasons;
  const results = await getAllCompetitions(t).catch(function (error: Error) {
    throw error;
  });

  const populatePreFormCreateTeam = function () {
    if (results) {
      const competitions = getAllCompetitionNames(results);
      Object.assign(
        preFormCreateTeamResults as resultsGenerator.preFormCreateTeamResults,
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

export const preFormCreateTeam = async function (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  preFormCreateTeamResults = resultsGenerator.preFormCreateTeam();
  await transactionWrapper(preFormCreateTeamCb, next).catch(function (
    error: Error
  ) {
    next(error);
  });
  if (preFormCreateTeamResults) {
    preFormCreateTeamRenderer(res, preFormCreateTeamResults);
  }
  preFormCreateTeamResults = null;
};

const postFormCreateTeamCb = async function (t: Transaction) {
  const { nextCompetitionTemplate } = queryHelpers;

  const getRelevantCompetitions = async function () {
    let competitionPromises: (() => Promise<CompetitionModel | null>)[] = [];
    const competitionNames = (
      postFormCreateTeamResults as resultsGenerator.postFormCreateTeamResults
    ).chosenCompetitions;
    const chosenSeason = (
      postFormCreateTeamResults as resultsGenerator.postFormCreateTeamResults
    ).season;
    if (competitionNames && competitionNames.length > 0 && chosenSeason) {
      for (const compName of competitionNames) {
        const nextPromise = async function () {
          return await nextCompetitionTemplate(t, compName, chosenSeason).catch(
            function (err: Error) {
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
    const newTeam = await Team.create(
      {
        ...(postFormCreateTeamResults as resultsGenerator.postFormCreateTeamResults),
      },
      { transaction: t }
    ).catch(function (err: Error) {
      throw err;
    });
    return newTeam;
  };

  const createTeam = async function () {
    const teamParameters = {
      ...(postFormCreateTeamResults as resultsGenerator.postFormCreateTeamResults),
    };
    Object.assign(teamParameters, { chosenCompetitions: undefined });
    const chosenSeason = (
      postFormCreateTeamResults as resultsGenerator.postFormCreateTeamResults
    ).season;

    const competitionPromises = await getRelevantCompetitions().catch(function (
      err: Error
    ) {
      throw err;
    });

    if (competitionPromises.length === 0) {
      return await createDissociatedTeam();
    }

    const relevantCompetitions = await Promise.all(
      competitionPromises.map((competitionPromise) => competitionPromise())
    ).catch(function (err: Error) {
      throw err;
    });

    const newTeam = await Team.create(
      { ...teamParameters },
      { transaction: t }
    ).catch(function (err: Error) {
      throw err;
    });

    await (newTeam as any)
      .setCompetitions(relevantCompetitions, {
        transaction: t,
        through: { season: chosenSeason },
      })
      .catch(function (err: Error) {
        throw err;
      });
  };

  await createTeam().catch(function (err: Error) {
    throw err;
  });
};

export const postFormCreateTeam = [
  ...createTeamValidator(),
  async function (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    postFormCreateTeamResults = resultsGenerator.postFormCreateTeam();
    preFormCreateTeamResults = resultsGenerator.preFormCreateTeam();

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      await transactionWrapper(preFormCreateTeamCb, next).catch(function (
        error: Error
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
        error: Error
      ) {
        next(error);
      });
      next();
    }
  },
  teamCompetitionIndexSignal,
  async (_req: Request, res: Response, next: NextFunction) => {
    const goToTeamPage = async function () {
      try {
        const latestCode = await Team.max("code").catch(function (
          error: Error
        ) {
          throw error;
        });
        const teamName = (
          postFormCreateTeamResults as resultsGenerator.postFormCreateTeamResults
        ).name;

        res.redirect(`/team/${teamName}.${latestCode}`);
      } catch (err) {
        if (err) {
          console.log(err);
          return next(err);
        }
      }
    };

    await goToTeamPage().catch(function (error: Error) {
      next(error);
    });

    preFormCreateTeamResults = null;
    postFormCreateTeamResults = null;
  },
];

const preFormUpdateTeamCb = async function (t: Transaction) {
  const { getAllCompetitions, getAllCompetitionNames, getTeamSeason } =
    queryHelpers;
  const getSeasons = queryHelpers.getSeasons;

  const updateTeamQuery = async function () {
    const parameters = teamParameterPlaceholder().parameters;

    const competitions = await getAllCompetitions(t).catch(function (
      error: Error
    ) {
      throw error;
    });

    const competitionNames = getAllCompetitionNames(competitions);

    const team = await Team.findOne({
      where: {
        name: parameters.name,
        code: parameters.code,
      },
      transaction: t,
    }).catch(function (error: Error) {
      throw error;
    });

    const teamCompetitions = team
      ? await (team as any)
          .getCompetitions({ transaction: t })
          .catch(function (error: Error) {
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

  const results = await updateTeamQuery().catch(function (error: Error) {
    throw error;
  });

  const populatePreFormUpdateTeam = function () {
    if (results.team) {
      Object.assign(
        preFormUpdateTeamResults as resultsGenerator.preFormUpdateTeamResults,
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

export const preFormUpdateTeam = async function (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  getTeamParameters(req, next);
  preFormUpdateTeamResults = resultsGenerator.preFormUpdateTeam();

  await transactionWrapper(preFormUpdateTeamCb, next).catch(function (
    error: Error
  ) {
    next(error);
  });
  if (preFormUpdateTeamResults) {
    preFormUpdateTeamRenderer(res, preFormUpdateTeamResults);
  }
  teamParameterPlaceholder().reset();
  preFormUpdateTeamResults = null;

  return;
};

const postFormUpdateTeamCb = async function (t: Transaction) {
  const { nextCompetitionTemplate } = queryHelpers;

  const getRelevantCompetitions = async function () {
    let competitionPromises: (() => Promise<CompetitionModel | null>)[] = [];
    const competitionNames = (
      postFormUpdateTeamResults as resultsGenerator.postFormUpdateTeamResults
    ).chosenCompetitions;
    const chosenSeason = (
      postFormUpdateTeamResults as resultsGenerator.postFormUpdateTeamResults
    ).season;
    if (competitionNames && competitionNames.length > 0 && chosenSeason) {
      for (const compName of competitionNames) {
        const nextPromise = async function () {
          return await nextCompetitionTemplate(t, compName, chosenSeason).catch(
            function (err: Error) {
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
    const previousParameters = teamParameterPlaceholder().parameters;
    const teamParameters = { ...postFormUpdateTeamResults };
    Object.assign(teamParameters, { chosenCompetitions: undefined });
    const chosenSeason = (
      postFormUpdateTeamResults as resultsGenerator.postFormUpdateTeamResults
    ).season;

    const competitionPromises = await getRelevantCompetitions().catch(function (
      err: Error
    ) {
      throw err;
    });

    const relevantCompetitions =
      competitionPromises.length > 0
        ? await Promise.all(
            competitionPromises.map((competitionPromise) =>
              competitionPromise()
            )
          ).catch(function (err: Error) {
            throw err;
          })
        : competitionPromises;

    const updatedTeam = await Team.findOne({
      where: {
        name: previousParameters.name,
        code: previousParameters.code,
      },
      include: [
        {
          model: Competition,
        },
      ],
      transaction: t,
    }).catch(function (err: Error) {
      throw err;
    });

    updatedTeam?.set({ ...teamParameters });
    postFormUpdateTeamResults =
      postFormUpdateTeamResults as resultsGenerator.postFormUpdateTeamResults;

    if (
      postFormUpdateTeamResults.chosenCompetitions &&
      postFormUpdateTeamResults.season
    ) {
      await (updatedTeam as any)
        .setCompetitions(relevantCompetitions, {
          transaction: t,
          through: { season: chosenSeason },
        })
        .catch(function (err: Error) {
          throw err;
        });
    } else {
      await (updatedTeam as any)
        .setCompetitions(null, { transaction: t })
        .catch(function (error: Error) {
          throw error;
        });
    }

    await updatedTeam?.save().catch(function (err: Error) {
      throw err;
    });
  };

  await updateTeam().catch(function (err: Error) {
    throw err;
  });
};

export const postFormUpdateTeam = [
  ...updateTeamValidator(),
  storeTeamCompetitions,
  async function (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    postFormUpdateTeamResults = resultsGenerator.postFormUpdateTeam();
    preFormUpdateTeamResults = resultsGenerator.preFormUpdateTeam();
    getTeamParameters(req, next);
    const errors = validationResult(req);
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

      teamParameterPlaceholder().reset();
      preFormUpdateTeamResults = null;
      postFormUpdateTeamResults = null;
    } else {
      Object.assign(
        postFormUpdateTeamResults as resultsGenerator.postFormUpdateTeamResults,
        requestBody
      );
      await transactionWrapper(postFormUpdateTeamCb, next).catch(function (
        error: Error
      ) {
        next(error);
      });
      next();
    }
  },
  teamCompetitionIndexSignal,
  async function (req: Request, res: Response): Promise<void> {
    const [name, code] = [
      (postFormUpdateTeamResults as resultsGenerator.postFormUpdateTeamResults)
        .name,
      req.params.code,
    ];

    teamParameterPlaceholder().reset();
    preFormUpdateTeamResults = null;
    postFormUpdateTeamResults = null;
    res.redirect(`/team/${name}.${code}`);
  },
];
