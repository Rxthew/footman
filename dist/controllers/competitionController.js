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
exports.postFormUpdateCompetition = exports.preFormUpdateCompetition = exports.postFormCreateCompetition = exports.preFormCreateCompetition = exports.seeCompetition = void 0;
const express_validator_1 = require("express-validator");
const parameters_1 = require("./helpers/parameters");
const queryHelpers = __importStar(require("./helpers/queries"));
const renderers = __importStar(require("./helpers/renderers"));
const resultsGenerator = __importStar(require("./helpers/results"));
const validators = __importStar(require("./helpers/validators"));
const competition_1 = __importDefault(require("../models/competition"));
const team_1 = __importDefault(require("../models/team"));
require("../models/concerns/_runModels");
const preFormCreateCompetitionRenderer = renderers.preFormCreateCompetition;
const preFormUpdateCompetitionRenderer = renderers.preFormUpdateCompetition;
const seeCompetitionRenderer = renderers.seeCompetition;
const createCompetitionValidator = validators.postFormCreateCompetition;
const updateCompetitionValidator = validators.postFormUpdateCompetition;
let preFormCreateCompetitionResults = resultsGenerator.preFormCreateCompetition();
let postFormCreateCompetitionResults = resultsGenerator.postFormCreateCompetition();
let preFormUpdateCompetitionResults = resultsGenerator.preFormUpdateCompetition();
let postFormUpdateCompetitionResults = resultsGenerator.postFormUpdateCompetition();
let seeCompetitionResults = resultsGenerator.seeCompetition();
const transactionWrapper = queryHelpers.transactionWrapper;
const seeCompetitionCb = async function (t) {
    const sortCompetitionData = function (teams, rankings, points) {
        if (rankings && rankings.length > 0) {
            teams.sort(function (x, y) {
                return rankings[teams.indexOf(x)] > rankings[teams.indexOf(y)] ? 1 : -1;
            });
            rankings.sort(function (x, y) {
                return x > y ? 1 : -1;
            });
            if (points && points.length > 0) {
                points.sort(function (x, y) {
                    return rankings[points.indexOf(x)] > rankings[points.indexOf(y)] ? 1 : -1;
                });
            }
        }
        else {
            teams.sort();
        }
    };
    const seeCompetitionQuery = async function () {
        const parameters = (0, parameters_1.competitionParameterPlaceholder)().parameters;
        const competition = await competition_1.default.findOne({
            where: {
                name: parameters.name,
                code: parameters.code
            },
            transaction: t
        }).catch(function (error) {
            throw error;
        });
        const teams = await competition?.getTeams({ joinTableAttributes: ['season', 'points', 'ranking'] }).catch(function (error) {
            throw error;
        });
        return {
            competition,
            teams,
        };
    };
    const results = await seeCompetitionQuery().catch(function (error) {
        throw error;
    });
    const competitionTeams = results.teams;
    const getChosenTeams = queryHelpers.getAllTeamNames;
    const getSeason = queryHelpers.getCompetitionSeason;
    const getPoints = queryHelpers.getPoints;
    const getRankings = queryHelpers.getRankings;
    let chosenTeams = getChosenTeams(competitionTeams);
    let teamRankings = getRankings(competitionTeams);
    let teamPoints = getPoints(competitionTeams);
    sortCompetitionData(chosenTeams, teamRankings, teamPoints);
    const populateSeeCompetitionResults = function () {
        if (results.competition && results.teams) {
            Object.assign(seeCompetitionResults, results.competition.get(), { teams: chosenTeams }, { season: getSeason(competitionTeams) }, { rankings: teamRankings }, { points: teamPoints });
        }
        else {
            const err = new Error('Query regarding competition viewing returned invalid data.');
            throw err;
        }
    };
    try {
        populateSeeCompetitionResults();
    }
    catch (err) {
        console.log(err);
    }
    return;
};
const seeCompetition = async function (req, res, next) {
    (0, parameters_1.assessCompetitionParameters)(req, next);
    await transactionWrapper(seeCompetitionCb, next).catch(function (error) {
        next(error);
    });
    seeCompetitionRenderer(res, seeCompetitionResults);
    (0, parameters_1.competitionParameterPlaceholder)().reset();
    seeCompetitionResults = resultsGenerator.seeCompetition();
    return;
};
exports.seeCompetition = seeCompetition;
const preFormCreateCompetitionCb = async function (t) {
    const getAllTeams = queryHelpers.getAllTeams;
    const getAllTeamNames = queryHelpers.getAllTeamNames;
    const getSeasons = queryHelpers.getSeasons;
    const results = await getAllTeams(t).catch(function (error) {
        throw error;
    });
    const populatePreFormCreateCompetition = function () {
        if (results) {
            const teamNames = getAllTeamNames(results);
            Object.assign(preFormCreateCompetitionResults, { teams: teamNames }, { seasons: getSeasons() });
        }
        else {
            const err = new Error('Query regarding competition creation returned invalid data.');
            throw err;
        }
    };
    try {
        populatePreFormCreateCompetition();
    }
    catch (err) {
        console.log(err);
    }
    return;
};
const preFormCreateCompetition = async function (req, res, next) {
    await transactionWrapper(preFormCreateCompetitionCb, next).catch(function (error) {
        next(error);
    });
    preFormCreateCompetitionRenderer(res, preFormCreateCompetitionResults);
    preFormCreateCompetitionResults = resultsGenerator.preFormCreateCompetition();
};
exports.preFormCreateCompetition = preFormCreateCompetition;
const postFormCreateCompetitionCb = async function (t) {
    const applyPoints = queryHelpers.applyPoints;
    const applyRanking = queryHelpers.applyRanking;
    const nextTeamTemplate = async function (givenName, season) {
        return queryHelpers.nextTeamTemplate(t, givenName, season);
    };
    const getRelevantTeams = async function () {
        let teamPromises = [];
        const teamNames = postFormCreateCompetitionResults.chosenTeams;
        const chosenSeason = postFormCreateCompetitionResults.season;
        if (teamNames && teamNames.length > 0 && chosenSeason) {
            for (let teamName of teamNames) {
                const nextPromise = async function () {
                    return await nextTeamTemplate(teamName, chosenSeason).catch(function (err) {
                        throw err;
                    });
                };
                teamPromises = [...teamPromises, nextPromise];
            }
        }
        return teamPromises;
    };
    const createDissociatedCompetition = async function () {
        const newCompetition = await competition_1.default.create({ ...postFormCreateCompetitionResults }, { transaction: t }).catch(function (err) { throw err; });
        return newCompetition;
    };
    const createCompetition = async function () {
        const competitionParameters = { ...postFormCreateCompetitionResults };
        Object.assign(competitionParameters, { chosenCompetitions: undefined });
        const chosenSeason = postFormCreateCompetitionResults.season;
        const teamPromises = await getRelevantTeams().catch(function (err) {
            throw err;
        });
        if (teamPromises.length === 0) {
            return await createDissociatedCompetition();
        }
        const relevantTeams = await Promise.all(teamPromises).catch(function (err) { throw err; });
        const newCompetition = await competition_1.default.create({ ...competitionParameters }, { transaction: t }).catch(function (err) {
            throw err;
        });
        await newCompetition.setTeams(relevantTeams, { transaction: t, through: { season: chosenSeason } }).catch(function (err) {
            throw err;
        });
        return newCompetition;
    };
    const latestCompetition = await createCompetition().catch(function (err) {
        throw err;
    });
    await applyPoints(latestCompetition, postFormCreateCompetitionResults, t).catch(function (err) {
        throw err;
    });
    await applyRanking(latestCompetition, postFormCreateCompetitionResults, t).catch(function (err) {
        throw err;
    });
};
const postFormCreateCompetition = async function (req, res, next) {
    const goToCompetitionPage = async function () {
        try {
            const latestCode = await competition_1.default.max('code').catch(function (error) {
                throw error;
            });
            const competitionName = postFormCreateCompetitionResults.name;
            res.redirect(`/competition/${competitionName}_${latestCode}`);
        }
        catch (err) {
            if (err) {
                console.log(err);
                return next(err);
            }
        }
    };
    createCompetitionValidator();
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        await transactionWrapper(preFormCreateCompetitionCb, next).catch(function (error) {
            next(error);
        });
        Object.assign(preFormCreateCompetitionResults, { errors: errors.mapped() }, { chosenTeams: req.body.chosenCompetitions });
        preFormCreateCompetitionRenderer(res, preFormCreateCompetitionResults);
    }
    else {
        Object.assign(postFormCreateCompetitionResults, req.body);
        await transactionWrapper(postFormCreateCompetitionCb, next).catch(function (error) {
            next(error);
        });
        await goToCompetitionPage().catch(function (error) {
            next(error);
        });
    }
    preFormCreateCompetitionResults = resultsGenerator.preFormCreateCompetition();
    postFormCreateCompetitionResults = resultsGenerator.postFormCreateCompetition();
};
exports.postFormCreateCompetition = postFormCreateCompetition;
const preFormUpdateCompetitionCb = async function (t) {
    const getAllTeams = queryHelpers.getAllTeams;
    const getAllTeamNames = queryHelpers.getAllTeamNames;
    const getSeasons = queryHelpers.getSeasons;
    const results = await getAllTeams(t).catch(function (error) {
        throw error;
    });
    const competitionTeams = await competition_1.default.getTeams({ joinTableAttributes: ['season, ranking, points'] }).catch(function (error) {
        throw error;
    });
    const getChosenTeams = queryHelpers.getAllTeamNames;
    const getSeason = queryHelpers.getCompetitionSeason;
    const getPoints = queryHelpers.getPoints;
    const getRankings = queryHelpers.getRankings;
    const populatePreFormUpdateCompetition = function () {
        if (results) {
            const teamNames = getAllTeamNames(results);
            if (competitionTeams && competitionTeams.length > 0) {
                const chosen = getChosenTeams(competitionTeams);
                Object.assign(preFormUpdateCompetitionResults, { chosenTeams: chosen }, { season: getSeason(competitionTeams) }, { rankings: getRankings(competitionTeams) }, { points: getPoints(competitionTeams) });
                if (chosen) {
                    teamNames.filter(teamName => !chosen.includes(teamName));
                }
            }
            Object.assign(preFormUpdateCompetitionResults, { teams: teamNames }, { seasons: getSeasons() });
        }
        else {
            const err = new Error('Query regarding competition update returned invalid data.');
            throw err;
        }
    };
    try {
        populatePreFormUpdateCompetition();
    }
    catch (err) {
        console.log(err);
    }
    return;
};
const preFormUpdateCompetition = async function (req, res, next) {
    (0, parameters_1.assessCompetitionParameters)(req, next);
    await transactionWrapper(preFormUpdateCompetitionCb, next).catch(function (error) { next(error); });
    preFormUpdateCompetitionRenderer(res, preFormUpdateCompetitionResults);
    (0, parameters_1.competitionParameterPlaceholder)().reset();
    preFormUpdateCompetitionResults = resultsGenerator.preFormUpdateCompetition();
};
exports.preFormUpdateCompetition = preFormUpdateCompetition;
const postFormUpdateCompetitionCb = async function (t) {
    const applyPoints = queryHelpers.applyPoints;
    const applyRanking = queryHelpers.applyRanking;
    const nextTeamTemplate = async function (givenName, season) {
        return queryHelpers.nextTeamTemplate(t, givenName, season);
    };
    const getRelevantTeams = async function () {
        let teamPromises = [];
        const teamNames = postFormUpdateCompetitionResults.chosenTeams;
        const chosenSeason = postFormUpdateCompetitionResults.season;
        if (teamNames && teamNames.length > 0 && chosenSeason) {
            for (let teamName of teamNames) {
                const nextPromise = async function () {
                    return await nextTeamTemplate(teamName, chosenSeason).catch(function (err) {
                        throw err;
                    });
                };
                teamPromises = [...teamPromises, nextPromise];
            }
        }
        return teamPromises;
    };
    const updateCompetition = async function () {
        const competitionParameters = { ...postFormUpdateCompetitionResults };
        Object.assign(competitionParameters, { chosenCompetitions: undefined });
        const chosenSeason = postFormUpdateCompetitionResults.season;
        const teamPromises = await getRelevantTeams().catch(function (err) {
            throw err;
        });
        const relevantTeams = teamPromises.length > 0 ? await Promise.all(teamPromises).catch(function (err) { throw err; }) : teamPromises;
        const updatedCompetition = await competition_1.default.findOne({
            where: {
                name: competitionParameters.name,
                code: competitionParameters.code
            },
            include: [{
                    model: team_1.default
                }],
            transaction: t
        }).catch(function (err) {
            throw err;
        });
        updatedCompetition?.set({ ...competitionParameters });
        if (postFormUpdateCompetitionResults.chosenTeams && postFormUpdateCompetitionResults.season) {
            await updatedCompetition.setTeams(relevantTeams, { transaction: t, through: { season: chosenSeason } }).catch(function (err) {
                throw err;
            });
        }
        await updatedCompetition?.save().catch(function (err) {
            throw err;
        });
        return updatedCompetition;
    };
    const latestCompetition = await updateCompetition().catch(function (err) {
        throw err;
    });
    latestCompetition ? await applyPoints(latestCompetition, postFormUpdateCompetitionResults, t).catch(function (err) {
        throw err;
    }) : false;
    latestCompetition ? await applyRanking(latestCompetition, postFormUpdateCompetitionResults, t).catch(function (err) {
        throw err;
    }) : false;
};
const postFormUpdateCompetition = async function (req, res, next) {
    postFormUpdateCompetitionResults.season ? Object.assign(postFormUpdateCompetitionResults, { code: req.params.code }) : false;
    updateCompetitionValidator();
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        await transactionWrapper(preFormUpdateCompetitionCb, next).catch(function (err) {
            next(err);
        });
        Object.assign(preFormUpdateCompetitionResults, req.body, { errors: errors.mapped() });
        preFormUpdateCompetitionRenderer(res, preFormUpdateCompetitionResults);
    }
    else {
        Object.assign(postFormUpdateCompetitionResults, req.body);
        await transactionWrapper(postFormUpdateCompetitionCb, next).catch(function (error) {
            next(error);
        });
        const [name, code] = [postFormUpdateCompetitionResults.name, req.params.code];
        res.redirect(`/team/${name}_${code}`);
    }
    preFormUpdateCompetitionResults = resultsGenerator.preFormUpdateCompetition();
    postFormUpdateCompetitionResults = resultsGenerator.postFormUpdateCompetition();
};
exports.postFormUpdateCompetition = postFormUpdateCompetition;
