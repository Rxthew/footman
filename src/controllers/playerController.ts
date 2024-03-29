/* eslint-disable @typescript-eslint/no-explicit-any */

import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import {
  getPlayerParameters,
  playerParameterPlaceholder,
} from "./helpers/parameters";
import * as queryHelpers from "./helpers/queries";
import * as renderers from "./helpers/renderers";
import * as validators from "./helpers/validators";
import * as resultsGenerator from "./helpers/results";
import Player from "../models/player";
import { Transaction } from "sequelize";
import Team from "../models/team";
import "../models/concerns/_runModels";
import Competition from "../models/competition";

const {
  preFormCreatePlayerRenderer,
  preFormUpdatePlayerRenderer,
  seePlayerRenderer,
} = renderers;

const { submitPlayerValidator } = validators;

let seePlayerResults: resultsGenerator.seePlayerResults | null = null;
let preFormCreatePlayerResults: resultsGenerator.preFormCreatePlayerResults | null =
  null;
let postFormCreatePlayerResults: resultsGenerator.postFormCreatePlayerResults | null =
  null;
let preFormUpdatePlayerResults: resultsGenerator.preFormUpdatePlayerResults | null =
  null;
let postFormUpdatePlayerResults: resultsGenerator.postFormUpdatePlayerResults | null =
  null;
const transactionWrapper = queryHelpers.transactionWrapper;

const deletePlayerCb = async function (t: Transaction): Promise<void> {
  const parameters = playerParameterPlaceholder().parameters;

  const player = await Player.findOne({
    where: {
      firstName: parameters.firstName,
      lastName: parameters.lastName,
      code: parameters.code,
    },
    transaction: t,
  }).catch(function (error: Error) {
    throw error;
  });

  await player?.destroy().catch(function (error: Error) {
    throw error;
  });
};

export const deletePlayer = async function (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  getPlayerParameters(req, next);

  await transactionWrapper(deletePlayerCb, next).catch(function (error: Error) {
    next(error);
  });

  const goToHomePage = function () {
    res.redirect("/");
  };

  goToHomePage();
  playerParameterPlaceholder().reset();
};

const seePlayerCb = async function (t: Transaction): Promise<void> {
  const seePlayerQuery = async function () {
    const parameters = playerParameterPlaceholder().parameters;
    const player = await Player.findOne({
      where: {
        firstName: parameters.firstName,
        lastName: parameters.lastName,
        code: parameters.code,
      },
      transaction: t,
    }).catch(function (error: Error) {
      throw error;
    });
    const team = await (player as any)
      ?.getTeam({ transaction: t })
      .catch(function (error: Error) {
        throw error;
      });
    return {
      player,
      team,
    };
  };
  const results = await seePlayerQuery().catch(function (error: Error) {
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

export const seePlayer = async function (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  getPlayerParameters(req, next);

  await transactionWrapper(seePlayerCb, next).catch(function (error: Error) {
    next(error);
  });
  if (seePlayerResults) {
    seePlayerRenderer(res, seePlayerResults);
  }

  playerParameterPlaceholder().reset();
  seePlayerResults = null;

  return;
};

const preFormCreatePlayerCb = async function (t: Transaction): Promise<void> {
  const {
    getAllTeams,
    getAllTeamsWithCompetitions,
    getAllTeamNames,
    getAllSeasons,
  } = queryHelpers;

  const results = await getAllTeams(t).catch(function (error: Error) {
    throw error;
  });

  const populatePreFormCreatePlayer = async function () {
    if (results) {
      const associatedTeams = await getAllTeamsWithCompetitions(t, results);
      const teams = getAllTeamNames(associatedTeams);
      const seasons = getAllSeasons(results, "team");
      Object.assign(
        preFormCreatePlayerResults as resultsGenerator.preFormCreatePlayerResults,
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

export const preFormCreatePlayer = async function (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  preFormCreatePlayerResults = resultsGenerator.preFormCreatePlayer();
  await transactionWrapper(preFormCreatePlayerCb, next).catch(function (
    error: Error
  ) {
    next(error);
  });
  if (preFormCreatePlayerResults) {
    preFormCreatePlayerRenderer(res, preFormCreatePlayerResults);
  }
  preFormCreatePlayerResults = null;

  return;
};

const postFormCreatePlayerCb = async function (t: Transaction): Promise<void> {
  const getTeam = async function () {
    postFormCreatePlayerResults =
      postFormCreatePlayerResults as resultsGenerator.postFormCreatePlayerResults;
    const team = await Team.findOne({
      where: {
        name: postFormCreatePlayerResults.team,
      },
      include: {
        model: Competition,
        required: true,
        through: {
          where: {
            season: postFormCreatePlayerResults.season,
          },
        },
      },
      transaction: t,
    }).catch(function (error: Error) {
      throw error;
    });

    return team;
  };

  const createPlayer = async function () {
    postFormCreatePlayerResults =
      postFormCreatePlayerResults as resultsGenerator.postFormCreatePlayerResults;
    const playerParameters = { ...postFormCreatePlayerResults };
    Object.assign(playerParameters, { team: undefined }, { season: undefined });

    const newPlayer = await Player.create(
      {
        ...playerParameters,
      },
      { transaction: t }
    ).catch(function (error: Error) {
      throw error;
    });

    if (
      postFormCreatePlayerResults.team &&
      postFormCreatePlayerResults.season
    ) {
      const team = await getTeam().catch(function (error: Error) {
        throw error;
      });
      await (newPlayer as any)
        .setTeam(team, { transaction: t })
        .catch(function (error: Error) {
          throw error;
        });
    }
  };

  await createPlayer().catch(function (err: Error) {
    throw err;
  });
};

export const postFormCreatePlayer = [
  ...submitPlayerValidator(),
  async function (req: Request, res: Response, next: NextFunction) {
    const goToPlayerPage = async function () {
      postFormCreatePlayerResults =
        postFormCreatePlayerResults as resultsGenerator.postFormCreatePlayerResults;
      try {
        const latestCode = await Player.max("code").catch(function (
          error: Error
        ) {
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

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      preFormCreatePlayerResults = resultsGenerator.preFormCreatePlayer();
      await transactionWrapper(preFormCreatePlayerCb, next).catch(function (
        error: Error
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
        error: Error
      ) {
        next(error);
      });
      await goToPlayerPage().catch(function (error: Error) {
        next(error);
      });
    }

    preFormCreatePlayerResults = null;
    postFormCreatePlayerResults = null;
  },
];

const preFormUpdatePlayerCb = async function (t: Transaction) {
  const {
    getAllTeams,
    getAllTeamsWithCompetitions,
    getAllTeamNames,
    getAllSeasons,
    getTeamSeason,
  } = queryHelpers;

  const allTeams = await getAllTeams(t).catch(function (error: Error) {
    throw error;
  });

  const allAssociatedTeams = await getAllTeamsWithCompetitions(t, allTeams);

  const updatePlayerQuery = async function () {
    const parameters = playerParameterPlaceholder().parameters;
    const player = await Player.findOne({
      where: {
        firstName: parameters.firstName,
        lastName: parameters.lastName,
        code: parameters.code,
      },
      transaction: t,
    }).catch(function (error: Error) {
      throw error;
    });
    const team = await (player as any)
      ?.getTeam({
        include: [
          {
            model: Competition,
            through: { attributes: ["season"] },
          },
        ],
        transaction: t,
      })
      .catch(function (error: Error) {
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
  const results = await updatePlayerQuery().catch(function (error: Error) {
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

export const preFormUpdatePlayer = async function (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  getPlayerParameters(req, next);
  preFormUpdatePlayerResults = resultsGenerator.preFormUpdatePlayer();

  await transactionWrapper(preFormUpdatePlayerCb, next).catch(function (
    error: Error
  ) {
    next(error);
  });
  if (preFormUpdatePlayerResults) {
    preFormUpdatePlayerRenderer(res, preFormUpdatePlayerResults);
  }

  playerParameterPlaceholder().reset();
  preFormUpdatePlayerResults = null;

  return;
};

const postFormUpdatePlayerCb = async function (t: Transaction): Promise<void> {
  const getTeam = async function () {
    postFormUpdatePlayerResults =
      postFormUpdatePlayerResults as resultsGenerator.postFormUpdatePlayerResults;
    const team = await Team.findOne({
      where: {
        name: postFormUpdatePlayerResults.team,
      },
      include: {
        model: Competition,
        required: true,
        through: {
          where: {
            season: postFormUpdatePlayerResults.season,
          },
        },
      },
      transaction: t,
    }).catch(function (error: Error) {
      throw error;
    });

    return team;
  };

  const getPlayer = async function () {
    postFormUpdatePlayerResults =
      postFormUpdatePlayerResults as resultsGenerator.postFormUpdatePlayerResults;
    const { firstName, lastName, code } = postFormUpdatePlayerResults;
    const player = await Player.findOne({
      where: {
        firstName: firstName,
        lastName: lastName,
        code: code,
      },
      transaction: t,
    }).catch(function (error: Error) {
      throw error;
    });

    return player;
  };

  const updatePlayer = async function () {
    postFormUpdatePlayerResults =
      postFormUpdatePlayerResults as resultsGenerator.postFormUpdatePlayerResults;
    const playerParameters = { ...postFormUpdatePlayerResults };
    Object.assign(playerParameters, { team: undefined }, { season: undefined });
    await Player.update(
      {
        ...playerParameters,
      },
      { where: { code: postFormUpdatePlayerResults.code }, transaction: t }
    ).catch(function (error: Error) {
      throw error;
    });
    const updatedPlayer = await getPlayer().catch(function (error: Error) {
      throw error;
    });

    if (
      postFormUpdatePlayerResults.team &&
      postFormUpdatePlayerResults.season
    ) {
      const team = await getTeam().catch(function (error: Error) {
        throw error;
      });
      await (updatedPlayer as any)
        .setTeam(team, { transaction: t })
        .catch(function (error: Error) {
          throw error;
        });
    } else {
      await (updatedPlayer as any)
        .setTeam(null, { transaction: t })
        .catch(function (error: Error) {
          throw error;
        });
    }
  };

  await updatePlayer().catch(function (err) {
    throw err;
  });
};

export const postFormUpdatePlayer = [
  ...submitPlayerValidator(),
  async function (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    postFormUpdatePlayerResults = resultsGenerator.postFormUpdatePlayer();
    preFormUpdatePlayerResults = resultsGenerator.preFormUpdatePlayer();
    getPlayerParameters(req, next);
    Object.assign(postFormUpdatePlayerResults, { code: req.params.code });

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      await transactionWrapper(preFormUpdatePlayerCb, next).catch(function (
        error: Error
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
        error: Error
      ) {
        next(error);
      });
      const { firstName, lastName, code } = postFormUpdatePlayerResults;
      res.redirect(`/player/${firstName}.${lastName}.${code}`);
    }

    playerParameterPlaceholder().reset();
    preFormUpdatePlayerResults = null;
    postFormUpdatePlayerResults = null;
  },
];
