"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postFormUpdatePlayer = exports.preFormUpdatePlayer = exports.postFormCreatePlayer = exports.preFormCreatePlayer = exports.seePlayer = void 0;
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
const { preFormCreatePlayerRenderer, preFormUpdatePlayerRenderer, seePlayerRenderer } = renderers;
const { submitPlayerValidator } = validators;
let seePlayerResults = resultsGenerator.seePlayer();
let preFormCreatePlayerResults = resultsGenerator.preFormCreatePlayer();
let postFormCreatePlayerResults = resultsGenerator.postFormCreatePlayer();
let preFormUpdatePlayerResults = resultsGenerator.preFormUpdatePlayer();
let postFormUpdatePlayerResults = resultsGenerator.postFormCreatePlayer();
const transactionWrapper = queryHelpers.transactionWrapper;
const seePlayerCb = async function (t) {
    const seePlayerQuery = async function () {
        const parameters = (0, parameters_1.playerParameterPlaceholder)().parameters;
        const player = await player_1.default.findOne({
            where: {
                firstName: parameters.firstName,
                lastName: parameters.lastName,
                code: parameters.code
            },
            transaction: t
        }).catch(function (error) {
            throw error;
        });
        const team = await player?.getTeam().catch(function (error) {
            throw error;
        });
        return {
            player,
            team
        };
    };
    const results = await seePlayerQuery().catch(function (error) {
        throw error;
    });
    const populateSeePlayerResults = function () {
        if (results.player) {
            Object.assign(seePlayerResults, results.player.get());
            if (results.team) {
                Object.assign(seePlayerResults, { team: results.team.getDataValue('name') });
            }
            ;
        }
        else {
            const err = new Error('Query regarding player viewing returned invalid data.');
            throw err;
        }
    };
    try {
        populateSeePlayerResults();
    }
    catch (err) {
        console.log(err);
        const newErr = new Error('Query regarding player viewing returned invalid data.');
        throw newErr;
    }
    return;
};
const seePlayer = async function (req, res, next) {
    (0, parameters_1.assessPlayerParameters)(req, next);
    await transactionWrapper(seePlayerCb, next).catch(function (error) {
        next(error);
    });
    seePlayerRenderer(res, seePlayerResults);
    (0, parameters_1.playerParameterPlaceholder)().reset();
    seePlayerResults = resultsGenerator.seePlayer();
    return;
};
exports.seePlayer = seePlayer;
const preFormCreatePlayerCb = async function (t) {
    const { getAllTeams, getAllTeamsWithCompetitions, getAllTeamNames, getAllSeasons } = queryHelpers;
    const results = await getAllTeams(t).catch(function (error) {
        throw error;
    });
    const populatePreFormCreatePlayer = function () {
        if (results) {
            const associatedTeams = getAllTeamsWithCompetitions(results);
            const teams = getAllTeamNames(associatedTeams);
            const seasons = getAllSeasons(results, 'team');
            Object.assign(preFormCreatePlayerResults, { teams: teams }, { seasons: seasons });
        }
        else {
            const err = new Error('Query regarding player creation returned invalid data.');
            throw err;
        }
    };
    try {
        populatePreFormCreatePlayer();
    }
    catch (err) {
        console.log(err);
        const newErr = new Error('Query regarding player creation returned invalid data.');
        throw newErr;
    }
    return;
};
const preFormCreatePlayer = async function (req, res, next) {
    await transactionWrapper(preFormCreatePlayerCb, next).catch(function (error) {
        next(error);
    });
    preFormCreatePlayerRenderer(res, preFormCreatePlayerResults);
    preFormCreatePlayerResults = resultsGenerator.preFormCreatePlayer();
    return;
};
exports.preFormCreatePlayer = preFormCreatePlayer;
const postFormCreatePlayerCb = async function (t) {
    const getTeam = async function () {
        const team = await team_1.default.findOne({
            where: {
                name: postFormCreatePlayerResults.team,
            },
            include: {
                model: competition_1.default,
                required: true,
                through: {
                    where: {
                        season: postFormCreatePlayerResults.season
                    }
                }
            },
            transaction: t
        }).catch(function (error) {
            throw error;
        });
        return team;
    };
    const createPlayer = async function () {
        const playerParameters = { ...postFormCreatePlayerResults };
        Object.assign(playerParameters, { team: undefined }, { season: undefined });
        const newPlayer = await player_1.default.create({
            ...playerParameters
        }, { transaction: t }).catch(function (error) {
            throw error;
        });
        if (postFormCreatePlayerResults.team && postFormCreatePlayerResults.season) {
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
exports.postFormCreatePlayer = [...submitPlayerValidator(), async function (req, res, next) {
        const goToPlayerPage = async function () {
            try {
                const latestCode = await player_1.default.max('code').catch(function (error) {
                    throw error;
                });
                const firstName = postFormCreatePlayerResults.firstName;
                const lastName = postFormCreatePlayerResults.lastName;
                res.redirect(`/player/${firstName}.${lastName}.${latestCode}`);
            }
            catch (err) {
                if (err) {
                    console.log(err);
                    return next(err);
                }
            }
        };
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            await transactionWrapper(preFormCreatePlayerCb, next).catch(function (error) {
                next(error);
            });
            Object.assign(preFormCreatePlayerResults, { errors: errors.mapped() }, req.body);
            preFormCreatePlayerRenderer(res, preFormCreatePlayerResults);
        }
        else {
            Object.assign(postFormCreatePlayerResults, req.body);
            await transactionWrapper(postFormCreatePlayerCb, next).catch(function (error) {
                next(error);
            });
            await goToPlayerPage().catch(function (error) {
                next(error);
            });
        }
        preFormCreatePlayerResults = resultsGenerator.preFormCreatePlayer();
        postFormCreatePlayerResults = resultsGenerator.postFormCreatePlayer();
    }];
const preFormUpdatePlayerCb = async function (t) {
    const { getAllTeams, getAllTeamsWithCompetitions, getAllTeamNames, getAllSeasons, getTeamSeason } = queryHelpers;
    const allTeams = await getAllTeams(t).catch(function (error) {
        throw error;
    });
    const allAssociatedTeams = getAllTeamsWithCompetitions(allTeams);
    const updatePlayerQuery = async function () {
        const parameters = (0, parameters_1.playerParameterPlaceholder)().parameters;
        const player = await player_1.default.findOne({
            where: {
                firstName: parameters.firstName,
                lastName: parameters.lastName,
                code: parameters.code
            },
            transaction: t
        }).catch(function (error) {
            throw error;
        });
        const team = await player?.getTeam({
            include: [
                {
                    model: competition_1.default,
                    through: { attributes: ['season'] }
                }
            ]
        }).catch(function (error) {
            throw error;
        });
        const teams = getAllTeamNames(allAssociatedTeams);
        const seasons = getAllSeasons(allTeams, 'team');
        const season = team && team.competitions ? getTeamSeason(team.competitions) : undefined;
        return {
            player,
            team,
            teams,
            seasons,
            season
        };
    };
    const results = await updatePlayerQuery().catch(function (error) {
        throw error;
    });
    const populatePreFormUpdatePlayer = function () {
        if (results.player && results.teams && results.seasons) {
            Object.assign(preFormUpdatePlayerResults, results.player.get(), { teams: results.teams }, { seasons: results.seasons });
            if (results.team && results.season) {
                Object.assign(preFormUpdatePlayerResults, { team: results.team.getDataValue('name') }, { season: results.season });
            }
        }
        else {
            const err = new Error('Query regarding player update returned invalid data.');
            throw err;
        }
    };
    try {
        populatePreFormUpdatePlayer();
    }
    catch (err) {
        console.log(err);
        const newErr = new Error('Query regarding player update returned invalid data.');
        throw newErr;
    }
    return;
};
const preFormUpdatePlayer = async function (req, res, next) {
    (0, parameters_1.assessPlayerParameters)(req, next);
    await transactionWrapper(preFormUpdatePlayerCb, next).catch(function (error) {
        next(error);
    });
    preFormUpdatePlayerRenderer(res, preFormUpdatePlayerResults);
    (0, parameters_1.playerParameterPlaceholder)().reset();
    preFormUpdatePlayerResults = resultsGenerator.preFormUpdatePlayer();
    return;
};
exports.preFormUpdatePlayer = preFormUpdatePlayer;
const postFormUpdatePlayerCb = async function (t) {
    const getTeam = async function () {
        const team = await team_1.default.findOne({
            where: {
                name: postFormCreatePlayerResults.team,
            },
            include: {
                model: competition_1.default,
                required: true,
                through: {
                    where: {
                        season: postFormCreatePlayerResults.season
                    }
                }
            },
            transaction: t
        }).catch(function (error) {
            throw error;
        });
        return team;
    };
    const updatePlayer = async function () {
        const playerParameters = { ...postFormUpdatePlayerResults };
        Object.assign(playerParameters, { team: undefined }, { season: undefined });
        const updatedPlayer = await player_1.default.update({
            ...playerParameters
        }, { where: { code: postFormUpdatePlayerResults.code }, transaction: t }).catch(function (error) {
            throw error;
        });
        if (postFormUpdatePlayerResults.team && postFormUpdatePlayerResults.season) {
            const team = await getTeam().catch(function (error) {
                throw error;
            });
            await updatedPlayer.setTeam(team, { transaction: t }).catch(function (error) {
                throw error;
            });
        }
        else {
            await updatedPlayer.setTeam(null, { transaction: t }).catch(function (error) {
                throw error;
            });
        }
    };
    await updatePlayer().catch(function (err) {
        throw err;
    });
};
exports.postFormUpdatePlayer = [...submitPlayerValidator(), async function (req, res, next) {
        (0, parameters_1.assessPlayerParameters)(req, next);
        Object.assign(postFormUpdatePlayerResults, { code: req.params.code });
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            await transactionWrapper(preFormUpdatePlayerCb, next).catch(function (error) {
                next(error);
            });
            Object.assign(preFormUpdatePlayerResults, req.body, { errors: errors.mapped() });
            preFormUpdatePlayerRenderer(res, preFormUpdatePlayerResults);
        }
        else {
            Object.assign(postFormUpdatePlayerResults, req.body);
            await transactionWrapper(postFormUpdatePlayerCb, next).catch(function (error) {
                next(error);
            });
            const { firstName, lastName, code } = postFormUpdatePlayerResults;
            res.redirect(`/player/${firstName}.${lastName}.${code}`);
        }
        (0, parameters_1.playerParameterPlaceholder)().reset();
        preFormUpdatePlayerResults = resultsGenerator.preFormUpdatePlayer();
        postFormUpdatePlayerResults = resultsGenerator.postFormCreatePlayer();
    }];
