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
exports.postFormUpdateCompetition = exports.preFormUpdateCompetition = exports.postFormCreateCompetition = exports.preFormCreateCompetition = exports.seeCompetitionIndex = exports.seeCompetition = void 0;
const express_validator_1 = require("express-validator");
const parameters_1 = require("./helpers/parameters");
const queryHelpers = __importStar(require("./helpers/queries"));
const renderers = __importStar(require("./helpers/renderers"));
const resultsGenerator = __importStar(require("./helpers/results"));
const validators = __importStar(require("./helpers/validators"));
const competition_1 = __importDefault(require("../models/competition"));
const team_1 = __importDefault(require("../models/team"));
require("../models/concerns/_runModels");
const { preFormCreateCompetitionRenderer, preFormUpdateCompetitionRenderer, seeCompetitionRenderer, seeCompetitionIndexRenderer, } = renderers;
const { createCompetitionValidator, updateCompetitionValidator } = validators;
let preFormCreateCompetitionResults = resultsGenerator.preFormCreateCompetition();
let postFormCreateCompetitionResults = resultsGenerator.postFormCreateCompetition();
let preFormUpdateCompetitionResults = resultsGenerator.preFormUpdateCompetition();
let postFormUpdateCompetitionResults = resultsGenerator.postFormUpdateCompetition();
let seeCompetitionResults = resultsGenerator.seeCompetition();
let seeCompetitionIndexResults = resultsGenerator.seeCompetitionIndex();
const transactionWrapper = queryHelpers.transactionWrapper;
const seeCompetitionCb = async function (t) {
    const sortCompetitionData = function (teams, teamUrls, rankings, points) {
        if (rankings && rankings.length > 0) {
            teams.sort(function (x, y) {
                return rankings[teams.indexOf(x)] > rankings[teams.indexOf(y)] ? 1 : -1;
            });
            teamUrls.sort(function (x, y) {
                return rankings[teamUrls.indexOf(x)] > rankings[teamUrls.indexOf(y)] ? 1 : -1;
            });
            rankings.sort(function (x, y) {
                return x > y ? 1 : -1;
            });
            if (points && points.length > 0) {
                points.sort(function (x, y) {
                    return x < y ? 1 : -1;
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
        const teams = await competition?.getTeams({ joinTableAttributes: ['season', 'points', 'ranking'], transaction: t }).catch(function (error) {
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
    const { getPoints, getRankings, getAllTeamUrlParams } = queryHelpers;
    let chosenTeams = getChosenTeams(competitionTeams);
    let teamRankings = getRankings(competitionTeams);
    let teamPoints = getPoints(competitionTeams);
    let urls = getAllTeamUrlParams(competitionTeams, ['name', 'code']);
    sortCompetitionData(chosenTeams, urls, teamRankings, teamPoints);
    const populateSeeCompetitionResults = function () {
        if (results.competition && results.teams) {
            Object.assign(seeCompetitionResults, results.competition.get(), { teams: chosenTeams }, { season: getSeason(competitionTeams) }, { rankings: teamRankings }, { points: teamPoints }, { teamUrls: urls });
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
        const newErr = new Error('Query regarding competition viewing returned invalid data.');
        throw newErr;
    }
    return;
};
const seeCompetition = async function (req, res, next) {
    (0, parameters_1.getCompetitionParameters)(req, next);
    await transactionWrapper(seeCompetitionCb, next).catch(function (error) {
        next(error);
    });
    seeCompetitionRenderer(res, seeCompetitionResults);
    (0, parameters_1.competitionParameterPlaceholder)().reset();
    seeCompetitionResults = resultsGenerator.seeCompetition();
    return;
};
exports.seeCompetition = seeCompetition;
const seeCompetitionIndexCb = async function (t) {
    const seeCompetitionIndexQuery = async function () {
        const { getAllCompetitions, getAllCompetitionNames, getAllCompetitionUrlParams, getAllSeasons } = queryHelpers;
        const allCompetitions = await getAllCompetitions(t).catch((err) => { throw err; });
        const allCompetitionPromises = allCompetitions.map(competition => async () => { return await competition.countTeams({ transaction: t }); });
        const teamsCount = await Promise.all(allCompetitionPromises.map(promise => promise())).catch((err) => { throw err; });
        const associatedCompetitions = allCompetitions && allCompetitions.length > 0 ? allCompetitions.filter((c, index) => teamsCount[index] > 0) : [];
        const seasons = getAllSeasons(associatedCompetitions, 'competition');
        const latestSeason = seasons[seasons.length - 1];
        const latestCompetitions = associatedCompetitions.filter(competition => competition['teams'][0]['TeamsCompetitions'].getDataValue('season') === latestSeason);
        const names = getAllCompetitionNames(latestCompetitions);
        const urls = getAllCompetitionUrlParams(latestCompetitions, ['name', 'code']);
        let competitionDetails = { [latestSeason]: [] };
        if (names.every(name => !!name) && urls.every(url => !!url) && latestSeason) {
            const compileCompetitionDetails = function () {
                names.forEach((compName, index) => {
                    competitionDetails[latestSeason] = [...competitionDetails[latestSeason], { name: compName, url: urls[index] }];
                });
            };
            const sortDetails = function () {
                names.sort();
                competitionDetails[latestSeason].sort(function (x, y) {
                    return names.indexOf(x['name']) < names.indexOf(y['name']) ? -1 : 1;
                });
            };
            compileCompetitionDetails();
            sortDetails();
        }
        return {
            competitionDetails,
            seasons
        };
    };
    const results = await seeCompetitionIndexQuery();
    const populateSeeCompetitionIndexResults = function () {
        if (results.competitionDetails && results.seasons) {
            Object.assign(seeCompetitionIndexResults, { competitionDetails: results.competitionDetails }, { seasons: results.seasons });
        }
        else {
            const err = new Error('Query regarding competition index viewing returned invalid data.');
            throw err;
        }
    };
    try {
        populateSeeCompetitionIndexResults();
    }
    catch (err) {
        console.log(err);
        const newErr = new Error('Query regarding competition index viewing returned invalid data.');
        throw newErr;
    }
};
const seeCompetitionIndex = async function (req, res, next) {
    await transactionWrapper(seeCompetitionIndexCb, next).catch(function (error) {
        next(error);
    });
    seeCompetitionIndexRenderer(res, seeCompetitionIndexResults);
    seeCompetitionIndexResults = resultsGenerator.seeCompetitionIndex();
    return;
};
exports.seeCompetitionIndex = seeCompetitionIndex;
const preFormCreateCompetitionCb = async function (t) {
    const { getAllTeams, getSeasons, getAllTeamNames } = queryHelpers;
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
        const newErr = new Error('Query regarding competition creation returned invalid data.');
        throw newErr;
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
    const { applyPoints, applyRanking, nextTeamTemplate } = queryHelpers;
    const getRelevantTeams = async function () {
        let teamPromises = [];
        const teamNames = postFormCreateCompetitionResults.chosenTeams;
        const chosenSeason = postFormCreateCompetitionResults.season;
        if (teamNames && teamNames.length > 0 && chosenSeason) {
            for (let teamName of teamNames) {
                const nextPromise = async function () {
                    return await nextTeamTemplate(t, teamName, chosenSeason).catch(function (err) {
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
        const relevantTeams = await Promise.all(teamPromises.map(teamPromise => teamPromise())).catch(function (err) { throw err; });
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
exports.postFormCreateCompetition = [...createCompetitionValidator(), async function (req, res, next) {
        const goToCompetitionPage = async function () {
            try {
                const latestCode = await competition_1.default.max('code').catch(function (error) {
                    throw error;
                });
                const competitionName = postFormCreateCompetitionResults.name;
                res.redirect(`/competition/${competitionName}.${latestCode}`);
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
            await transactionWrapper(preFormCreateCompetitionCb, next).catch(function (error) {
                next(error);
            });
            Object.assign(preFormCreateCompetitionResults, { errors: errors.mapped() }, req.body);
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
    }];
const preFormUpdateCompetitionCb = async function (t) {
    const { getAllTeams, getAllTeamNames, getSeasons } = queryHelpers;
    const getSeason = queryHelpers.getCompetitionSeason;
    const { getPoints, getRankings } = queryHelpers;
    const updateCompetitionQuery = async function () {
        const parameters = (0, parameters_1.competitionParameterPlaceholder)().parameters;
        const teams = await getAllTeams(t).catch(function (error) {
            throw error;
        });
        let teamNames = getAllTeamNames(teams);
        const competition = await competition_1.default.findOne({
            where: {
                name: parameters.name,
                code: parameters.code
            },
            transaction: t
        }).catch(function (error) {
            throw error;
        });
        const competitionTeams = competition ? await competition.getTeams({ joinTableAttributes: ['season', 'ranking', 'points'], transaction: t })
            .catch(function (error) {
            throw error;
        }) : [];
        const chosenTeams = getAllTeamNames(competitionTeams);
        const givenSeason = competitionTeams.length > 0 ? getSeason(competitionTeams) : undefined;
        const givenRankings = competitionTeams.length > 0 ? getRankings(competitionTeams) : undefined;
        const givenPoints = competitionTeams.length > 0 ? getPoints(competitionTeams) : undefined;
        return {
            competition,
            chosenTeams,
            givenPoints,
            givenRankings,
            givenSeason,
            teamNames,
        };
    };
    const results = await updateCompetitionQuery().catch(function (error) {
        throw error;
    });
    const populatePreFormUpdateCompetition = function () {
        if (results.competition) {
            Object.assign(preFormUpdateCompetitionResults, results.competition.get(), { teams: results.teamNames }, { season: results.givenSeason }, { chosenTeams: results.chosenTeams }, { seasons: getSeasons() }, { rankings: results.givenRankings }, { points: results.givenPoints });
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
        const newErr = new Error('Query regarding competition update returned invalid data.');
        throw newErr;
    }
    return;
};
const preFormUpdateCompetition = async function (req, res, next) {
    (0, parameters_1.getCompetitionParameters)(req, next);
    await transactionWrapper(preFormUpdateCompetitionCb, next).catch(function (error) { next(error); });
    preFormUpdateCompetitionRenderer(res, preFormUpdateCompetitionResults);
    (0, parameters_1.competitionParameterPlaceholder)().reset();
    preFormUpdateCompetitionResults = resultsGenerator.preFormUpdateCompetition();
};
exports.preFormUpdateCompetition = preFormUpdateCompetition;
const postFormUpdateCompetitionCb = async function (t) {
    const { applyPoints, applyRanking, nextTeamTemplate } = queryHelpers;
    const getRelevantTeams = async function () {
        let teamPromises = [];
        const teamNames = postFormUpdateCompetitionResults.chosenTeams;
        const chosenSeason = postFormUpdateCompetitionResults.season;
        if (teamNames && teamNames.length > 0 && chosenSeason) {
            for (let teamName of teamNames) {
                const nextPromise = async function () {
                    return await nextTeamTemplate(t, teamName, chosenSeason).catch(function (err) {
                        throw err;
                    });
                };
                teamPromises = [...teamPromises, nextPromise];
            }
        }
        return teamPromises;
    };
    const updateCompetition = async function () {
        const previousParameters = (0, parameters_1.competitionParameterPlaceholder)().parameters;
        const competitionParameters = { ...postFormUpdateCompetitionResults };
        Object.assign(competitionParameters, { chosenCompetitions: undefined });
        const chosenSeason = postFormUpdateCompetitionResults.season;
        const teamPromises = await getRelevantTeams().catch(function (err) {
            throw err;
        });
        const relevantTeams = teamPromises.length > 0 ? await Promise.all(teamPromises.map(teamPromise => teamPromise())).catch(function (err) { throw err; }) : teamPromises;
        const updatedCompetition = await competition_1.default.findOne({
            where: {
                name: previousParameters.name,
                code: previousParameters.code
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
        else {
            await updatedCompetition.setTeams(null, { transaction: t }).catch(function (error) {
                throw error;
            });
        }
        await updatedCompetition?.save({ transaction: t }).catch(function (err) {
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
exports.postFormUpdateCompetition = [...updateCompetitionValidator(), async function (req, res, next) {
        (0, parameters_1.getCompetitionParameters)(req, next);
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
            res.redirect(`/competition/${name}.${code}`);
        }
        (0, parameters_1.competitionParameterPlaceholder)().reset();
        preFormUpdateCompetitionResults = resultsGenerator.preFormUpdateCompetition();
        postFormUpdateCompetitionResults = resultsGenerator.postFormUpdateCompetition();
    }];
