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
exports.postFormUpdateTeam = exports.preFormUpdateTeam = exports.postFormCreateTeam = exports.preFormCreateTeam = exports.seeTeam = void 0;
const express_validator_1 = require("express-validator");
const parameters_1 = require("./helpers/parameters");
const queryHelpers = __importStar(require("./helpers/queries"));
const renderers = __importStar(require("./helpers/renderers"));
const resultsGenerator = __importStar(require("./helpers/results"));
const validators = __importStar(require("./helpers/validators"));
const team_1 = __importDefault(require("../models/team"));
require("../models/concerns/_runModels");
const competition_1 = __importDefault(require("../models/competition"));
const preFormCreateTeamRenderer = renderers.preFormCreateTeam;
const preFormUpdateTeamRenderer = renderers.preFormUpdateTeam;
const seeTeamRenderer = renderers.seeTeam;
const createTeamValidator = validators.postFormCreateTeam;
const updateTeamValidator = validators.postFormUpdateTeam;
let preFormCreateTeamResults = resultsGenerator.preFormCreateTeam();
let postFormCreateTeamResults = resultsGenerator.postFormCreateTeam();
let preFormUpdateTeamResults = resultsGenerator.preFormUpdateTeam();
let postFormUpdateTeamResults = resultsGenerator.postFormUpdateTeam();
let seeTeamResults = resultsGenerator.seeTeam();
const transactionWrapper = queryHelpers.transactionWrapper;
const seeTeamCb = async function (t) {
    const getCompetitionNames = queryHelpers.getAllCompetitionNames;
    const seeTeamQuery = async function () {
        const parameters = (0, parameters_1.teamParameterPlaceholder)().parameters;
        const team = await team_1.default.findOne({
            where: {
                name: parameters.name,
                code: parameters.code
            },
            transaction: t
        }).catch(function (error) {
            throw error;
        });
        const playersResults = await team?.getPlayers().catch(function (error) {
            throw error;
        });
        const competitionsResults = await team?.getCompetitions({ joinTableAttributes: ['season', 'points', 'ranking'] }).catch(function (error) {
            throw error;
        });
        let competitions = competitionsResults && competitionsResults.length > 0 ? getCompetitionNames(competitionsResults) : competitionsResults;
        let players = playersResults && playersResults.length > 0 ? playersResults.map(player => `${player.getDataValue('firstName')} ${player.getDataValue('lastName')}`) : playersResults;
        competitions = competitions && competitions.length > 0 ? competitions.sort() : competitions;
        players = players && players.length > 0 ? players.sort() : players;
        return {
            team,
            players,
            competitions,
        };
    };
    const results = await seeTeamQuery().catch(function (error) {
        throw error;
    });
    const populateSeeTeamResults = function () {
        if (results.team && results.players && results.competitions) {
            Object.assign(seeTeamResults, results.team.get(), { players: results.players }, { competitions: results.competitions });
        }
        else {
            const err = new Error('Query regarding team viewing returned invalid data.');
            throw err;
        }
    };
    try {
        populateSeeTeamResults();
    }
    catch (err) {
        console.log(err);
    }
    return;
};
const seeTeam = async function (req, res, next) {
    (0, parameters_1.assessTeamParameters)(req, next);
    await transactionWrapper(seeTeamCb).catch(function (error) {
        throw error;
    });
    seeTeamRenderer(res, seeTeamResults);
    (0, parameters_1.teamParameterPlaceholder)().reset();
    seeTeamResults = resultsGenerator.seeTeam();
    return;
};
exports.seeTeam = seeTeam;
const preFormCreateTeamCb = async function (t) {
    const getAllCompetitions = queryHelpers.getAllCompetitions;
    const getAllCompetitionNames = queryHelpers.getAllCompetitionNames;
    const getAllSeasons = queryHelpers.getSeasons;
    const results = await getAllCompetitions(t).catch(function (error) {
        throw error;
    });
    const populatePreFormCreateTeam = function () {
        if (results) {
            const competitions = getAllCompetitionNames(results);
            Object.assign(preFormCreateTeamResults, { competitions: competitions }, { seasons: getAllSeasons() });
        }
        else {
            const err = new Error('Query regarding team creation returned invalid data.');
            throw err;
        }
    };
    try {
        populatePreFormCreateTeam();
    }
    catch (err) {
        console.log(err);
    }
    return;
};
const preFormCreateTeam = async function (req, res, next) {
    await transactionWrapper(preFormCreateTeamCb).catch(function (error) {
        throw error;
    });
    preFormCreateTeamRenderer(res, preFormCreateTeamResults);
    preFormCreateTeamResults = resultsGenerator.preFormCreateTeam();
};
exports.preFormCreateTeam = preFormCreateTeam;
const postFormCreateTeamCb = async function (t) {
    const nextCompetitionTemplate = async function (givenName, season) {
        return queryHelpers.nextCompetitionTemplate(t, givenName, season);
    };
    const getRelevantCompetitions = async function () {
        let competitionPromises = [];
        const competitionNames = postFormCreateTeamResults.chosenCompetitions;
        const chosenSeason = postFormCreateTeamResults.season;
        if (competitionNames && competitionNames.length > 0 && chosenSeason) {
            for (let compName of competitionNames) {
                const nextPromise = async function () {
                    return await nextCompetitionTemplate(compName, chosenSeason).catch(function (err) {
                        throw err;
                    });
                };
                competitionPromises = [...competitionPromises, nextPromise];
            }
        }
        return competitionPromises;
    };
    const createDissociatedTeam = async function () {
        const newTeam = await team_1.default.create({ ...postFormCreateTeamResults }, { transaction: t }).catch(function (err) { throw err; });
        return newTeam;
    };
    const createTeam = async function () {
        const teamParameters = { ...postFormCreateTeamResults };
        Object.assign(teamParameters, { chosenCompetitions: undefined });
        const chosenSeason = postFormCreateTeamResults.season;
        const competitionPromises = await getRelevantCompetitions().catch(function (err) { throw err; });
        if (competitionPromises.length === 0) {
            return await createDissociatedTeam();
        }
        const relevantCompetitions = await Promise.all(competitionPromises).catch(function (err) { throw err; });
        const newTeam = await team_1.default.create({ ...teamParameters }, { transaction: t }).catch(function (err) { throw err; });
        await newTeam.setCompetitions(relevantCompetitions, { transaction: t, through: { season: chosenSeason } }).catch(function (err) {
            throw err;
        });
    };
    await createTeam().catch(function (err) {
        throw err;
    });
};
const postFormCreateTeam = async function (req, res, next) {
    const goToTeamPage = async function () {
        try {
            const latestCode = await team_1.default.max('code').catch(function (error) {
                throw error;
            });
            const teamName = postFormCreateTeamResults.name;
            res.redirect(`/team/${teamName}_${latestCode}`);
        }
        catch (err) {
            if (err) {
                console.log(err);
                return next(err);
            }
        }
    };
    createTeamValidator();
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        await transactionWrapper(preFormCreateTeamCb).catch(function (error) {
            throw error;
        });
        Object.assign(preFormCreateTeamResults, { errors: errors.mapped() }, { chosenCompetitions: req.body.chosenCompetitions });
        preFormCreateTeamRenderer(res, preFormCreateTeamResults);
    }
    else {
        Object.assign(postFormCreateTeamResults, req.body);
        await transactionWrapper(postFormCreateTeamCb).catch(function (error) {
            throw error;
        });
        await goToTeamPage().catch(function (error) {
            throw error;
        });
    }
    preFormCreateTeamResults = resultsGenerator.preFormCreateTeam();
    postFormCreateTeamResults = resultsGenerator.postFormCreateTeam();
};
exports.postFormCreateTeam = postFormCreateTeam;
const preFormUpdateTeamCb = async function (t) {
    const getAllCompetitions = queryHelpers.getAllCompetitions;
    const getAllCompetitionNames = queryHelpers.getAllCompetitionNames;
    const getSeasons = queryHelpers.getSeasons;
    const results = await getAllCompetitions(t).catch(function (error) {
        throw error;
    });
    const teamCompetitions = await team_1.default.getCompetitions().catch(function (error) {
        throw error;
    });
    const populatePreFormUpdateTeam = function () {
        if (results) {
            const parameters = (0, parameters_1.teamParameterPlaceholder)().parameters;
            const competitions = getAllCompetitionNames(results);
            if (teamCompetitions && teamCompetitions.length > 0) {
                const chosen = teamCompetitions.map(comp => comp.getDataValue('name'));
                Object.assign(preFormUpdateTeamResults, { chosenCompetitions: chosen });
                competitions.filter(comp => !chosen.includes(comp));
            }
            Object.assign(preFormUpdateTeamResults, { competitions: competitions }, { name: parameters.name }, { seasons: getSeasons() });
        }
        else {
            const err = new Error('Query regarding team update returned invalid data.');
            throw err;
        }
    };
    try {
        populatePreFormUpdateTeam();
    }
    catch (err) {
        console.log(err);
    }
    return;
};
const preFormUpdateTeam = async function (req, res, next) {
    (0, parameters_1.assessTeamParameters)(req, next);
    await transactionWrapper(preFormUpdateTeamCb).catch(function (error) {
        throw error;
    });
    preFormUpdateTeamRenderer(res, preFormUpdateTeamResults);
    (0, parameters_1.teamParameterPlaceholder)().reset();
    preFormUpdateTeamResults = resultsGenerator.preFormUpdateTeam();
    return;
};
exports.preFormUpdateTeam = preFormUpdateTeam;
const postFormUpdateTeamCb = async function (t) {
    const nextCompetitionTemplate = async function (givenName, season) {
        return queryHelpers.nextCompetitionTemplate(t, givenName, season);
    };
    const getRelevantCompetitions = async function () {
        let competitionPromises = [];
        const competitionNames = postFormUpdateTeamResults.chosenCompetitions;
        const chosenSeason = postFormUpdateTeamResults.season;
        if (competitionNames && competitionNames.length > 0 && chosenSeason) {
            for (let compName of competitionNames) {
                const nextPromise = async function () {
                    return await nextCompetitionTemplate(compName, chosenSeason).catch(function (err) {
                        throw err;
                    });
                };
                competitionPromises = [...competitionPromises, nextPromise];
            }
        }
        return competitionPromises;
    };
    const updateTeam = async function () {
        const teamParameters = { ...postFormUpdateTeamResults };
        Object.assign(teamParameters, { chosenCompetitions: undefined });
        const chosenSeason = postFormUpdateTeamResults.season;
        const competitionPromises = await getRelevantCompetitions().catch(function (err) {
            throw err;
        });
        const relevantCompetitions = competitionPromises.length > 0 ? await Promise.all(competitionPromises).catch(function (err) { throw err; }) : competitionPromises;
        const updatedTeam = await team_1.default.findOne({
            where: {
                name: teamParameters.name,
                code: teamParameters.code
            },
            include: [{
                    model: competition_1.default,
                }],
            transaction: t
        }).catch(function (err) { throw err; });
        updatedTeam?.set({ ...teamParameters });
        if (postFormUpdateTeamResults.chosenCompetitions && postFormUpdateTeamResults.season) {
            await updatedTeam.setCompetitions(relevantCompetitions, { transaction: t, through: { season: chosenSeason } }).catch(function (err) { throw err; });
        }
        await updatedTeam?.save().catch(function (err) {
            throw err;
        });
    };
    await updateTeam().catch(function (err) {
        throw err;
    });
};
const postFormUpdateTeam = async function (req, res, next) {
    postFormUpdateTeamResults.season ? Object.assign(postFormUpdateTeamResults, { code: req.params.code }) : false;
    updateTeamValidator();
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        await transactionWrapper(preFormUpdateTeamCb).catch(function (err) {
            throw err;
        });
        Object.assign(preFormUpdateTeamResults, req.body, { errors: errors.mapped() });
        preFormUpdateTeamRenderer(res, preFormUpdateTeamResults);
    }
    else {
        Object.assign(postFormUpdateTeamResults, req.body);
        await transactionWrapper(postFormUpdateTeamCb).catch(function (error) {
            throw error;
        });
        const [name, code] = [postFormUpdateTeamResults.name, req.params.code];
        res.redirect(`/team/${name}_${code}`);
    }
    preFormUpdateTeamResults = resultsGenerator.preFormUpdateTeam();
    postFormUpdateTeamResults = resultsGenerator.postFormUpdateTeam();
};
exports.postFormUpdateTeam = postFormUpdateTeam;
