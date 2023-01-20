"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionWrapper = exports.nextTeamTemplate = exports.nextCompetitionTemplate = exports.getTeamSeason = exports.getSeasons = exports.getTeamBySeason = exports.getRankings = exports.getPoints = exports.getDissociatedTeam = exports.getDissociatedCompetition = exports.getCompetitionSeason = exports.getCompetitionBySeason = exports.getAllTeamsWithCompetitions = exports.getAllTeams = exports.getAllTeamNames = exports.getAllSeasons = exports.getAllCompetitions = exports.getAllCompetitionNames = exports.applyRanking = exports.applyPoints = void 0;
const competition_1 = __importDefault(require("../../models/competition"));
const initdb_1 = require("../../models/concerns/initdb");
const team_1 = __importDefault(require("../../models/team"));
const applyPoints = async function (latestCompetition, results, t) {
    if (results.points && results.chosenTeams) {
        const generateTeamsPoints = function () {
            let teamsPoints = {};
            const chosenTeams = results.chosenTeams;
            const chosenPoints = results.points;
            if (chosenTeams && chosenPoints) {
                chosenTeams.forEach((team, index) => {
                    Object.assign(teamsPoints, { [team]: chosenPoints[index] });
                });
                return teamsPoints;
            }
        };
        const teamsPoints = generateTeamsPoints();
        const harmoniseRanking = function () {
            if (results.chosenTeams && teamsPoints) {
                let rankedTeams = [...results.chosenTeams];
                rankedTeams?.sort(function (x, y) {
                    return teamsPoints[x] > teamsPoints[y] ? -1 : 1;
                });
                Object.assign(results, { chosenTeams: rankedTeams });
            }
            else {
                const err = new Error('Cannot harmoise ranking because chosen teams are not available');
                throw err;
            }
        };
        const inputPoints = async function () {
            if (teamsPoints) {
                const teams = await latestCompetition.getTeams({ joinTableAttributes: ['points'] }, { transaction: t }).catch(function (err) { throw err; });
                teams.forEach(team => team['TeamsCompetitions'].set('points', teamsPoints[team.getDataValue('name')]));
                return;
            }
            else {
                throw Error('Something went wrong when querying chosen teams or their corresponding points. Please check your internet connection and try again.');
            }
        };
        harmoniseRanking();
        await inputPoints().catch(function (err) { throw err; });
    }
};
exports.applyPoints = applyPoints;
const applyRanking = async function (latestCompetition, results, t) {
    if (results.rankings) {
        const chosenTeams = results.chosenTeams;
        if (!results.points && chosenTeams) {
            const rankings = results.rankings;
            let rankedTeams = [...chosenTeams];
            rankedTeams.sort(function (x, y) {
                return rankings[rankedTeams.indexOf(x)] < rankings[rankedTeams.indexOf(y)] ? -1 : 1;
            });
            Object.assign(results, { chosenTeams: rankedTeams });
        }
        const teams = await latestCompetition.getTeams({ joinTableAttributes: ['ranking'] }, { transaction: t }).catch(function (err) { throw err; });
        teams.length > 0 ? teams.forEach(team => team['TeamsCompetitions'].set('ranking', chosenTeams?.indexOf(team.getDataValue('name')) ? chosenTeams.indexOf(team.getDataValue('name')) + 1 : null)) : teams;
    }
};
exports.applyRanking = applyRanking;
const getAllCompetitionNames = function (results) {
    if (results && results.length > 0) {
        const names = results.map(competition => competition.getDataValue('name'));
        const uniqueNames = Array.from(new Set(names));
        return uniqueNames;
    }
    return [];
};
exports.getAllCompetitionNames = getAllCompetitionNames;
const getAllCompetitions = async function (t) {
    const competitions = await competition_1.default.findAll({
        include: [{
                model: team_1.default,
                through: {
                    attributes: ['season']
                }
            }],
        transaction: t
    }).catch(function (error) {
        throw error;
    });
    return competitions;
};
exports.getAllCompetitions = getAllCompetitions;
const getAllSeasons = function (results, input) {
    const orderSeasons = function (seasons) {
        const years = seasons.map(season => parseInt(season.slice(0, 4)));
        seasons.sort(function (x, y) {
            return years[seasons.indexOf(x)] - years[seasons.indexOf(y)];
        });
        return seasons;
    };
    const getThroughTeams = function (res) {
        const competitions = res && res.length > 0 ? res.map(team => team.competitions).flat() : res;
        const seasons = competitions && competitions.length > 0 ? competitions.map(competition => competition['TeamsCompetitions'].get('season')) : competitions;
        const uniqueSeasons = seasons ? Array.from(new Set(seasons)) : [];
        return orderSeasons(uniqueSeasons);
    };
    const getThroughCompetitions = function (res) {
        const teams = res && res.length > 0 ? res.map(comp => comp.teams).flat() : res;
        const seasons = teams && teams.length > 0 ? teams.map(team => team['TeamsCompetitions'].get('season')) : teams;
        const uniqueSeasons = seasons ? Array.from(new Set(seasons)) : [];
        return orderSeasons(uniqueSeasons);
    };
    switch (input) {
        case 'team': return getThroughTeams(results);
        case 'competition': return getThroughCompetitions(results);
    }
};
exports.getAllSeasons = getAllSeasons;
const getAllTeamNames = function (results) {
    if (results && results.length > 0) {
        const names = results.map(team => team.getDataValue('name'));
        const uniqueNames = Array.from(new Set(names));
        return uniqueNames;
    }
    return [];
};
exports.getAllTeamNames = getAllTeamNames;
const getAllTeams = async function (t) {
    const teams = await team_1.default.findAll({
        include: [{
                model: competition_1.default,
                through: {
                    attributes: ['season']
                }
            }],
        transaction: t
    }).catch(function (error) {
        throw error;
    });
    return teams;
};
exports.getAllTeams = getAllTeams;
const getAllTeamsWithCompetitions = function (results) {
    if (results && results.length > 0) {
        const teams = results.filter(team => team.countCompetitions() > 0);
        return teams;
    }
    return [];
};
exports.getAllTeamsWithCompetitions = getAllTeamsWithCompetitions;
const getCompetitionBySeason = async function (t, givenName, chosenSeason) {
    const competition = await competition_1.default.findOne({
        where: {
            name: givenName
        },
        include: [{
                model: team_1.default,
                through: {
                    where: {
                        season: chosenSeason
                    }
                }
            }],
        transaction: t
    }).catch(function (error) {
        throw error;
    });
    return competition;
};
exports.getCompetitionBySeason = getCompetitionBySeason;
const getCompetitionSeason = function (competitionTeams) {
    if (competitionTeams && competitionTeams.length > 0) {
        return competitionTeams[0]['TeamsCompetitions'].get('season') ? competitionTeams[0]['TeamsCompetitions'].getDataValue('season') : undefined;
    }
};
exports.getCompetitionSeason = getCompetitionSeason;
const getDissociatedCompetition = async function (t, givenName) {
    const competitions = competition_1.default.findAll({
        where: {
            name: givenName
        },
        include: [{
                model: team_1.default,
                through: {
                    attributes: ['season']
                }
            }],
        transaction: t
    }).catch(function (error) { throw error; });
    const dissociated = (await competitions).filter(competition => competition.countTeams() === 0);
    return dissociated.length > 0 ? dissociated[0] : null;
};
exports.getDissociatedCompetition = getDissociatedCompetition;
const getDissociatedTeam = async function (t, givenName) {
    const teams = await team_1.default.findAll({
        where: {
            name: givenName
        },
        include: [{
                model: competition_1.default,
                through: {
                    attributes: ['season']
                }
            }],
        transaction: t
    }).catch(function (error) {
        throw error;
    });
    const dissociated = teams.filter(team => team.countCompetitions() === 0);
    return dissociated.length > 0 ? dissociated[0] : null;
};
exports.getDissociatedTeam = getDissociatedTeam;
const getPoints = function (competitionTeams) {
    if (competitionTeams && competitionTeams.length > 0) {
        const points = competitionTeams.map(team => team['TeamsCompetitions'].getDataValue('points'));
        return points.some(value => value === null || value === undefined) ? undefined : points;
    }
};
exports.getPoints = getPoints;
const getRankings = function (competitionTeams) {
    if (competitionTeams && competitionTeams.length > 0) {
        const rankings = competitionTeams.map(team => team['TeamsCompetitions'].getDataValue('ranking'));
        return rankings.some(rank => rank === null || rank === undefined) ? undefined : rankings;
    }
};
exports.getRankings = getRankings;
const getTeamBySeason = async function (t, givenName, chosenSeason) {
    const team = await team_1.default.findOne({
        where: {
            name: givenName
        },
        include: [{
                model: competition_1.default,
                through: {
                    where: {
                        season: chosenSeason
                    }
                }
            }],
        transaction: t
    }).catch(function (error) {
        throw error;
    });
    return team;
};
exports.getTeamBySeason = getTeamBySeason;
const getSeasons = function () {
    return ['2021/22'];
};
exports.getSeasons = getSeasons;
const getTeamSeason = function (teamsCompetitions) {
    if (teamsCompetitions && teamsCompetitions.length > 0) {
        return teamsCompetitions[0]['TeamsCompetitions'].get('season') ? teamsCompetitions[0]['TeamsCompetitions'].getDataValue('season') : undefined;
    }
};
exports.getTeamSeason = getTeamSeason;
const nextCompetitionTemplate = async function (t, givenName, season) {
    const nextCompetition = await (0, exports.getCompetitionBySeason)(t, givenName, season).catch(function (err) { throw err; });
    if (nextCompetition) {
        return nextCompetition;
    }
    const nextDissociatedCompetition = await (0, exports.getDissociatedCompetition)(t, givenName).catch(function (err) { throw err; });
    if (nextDissociatedCompetition) {
        return nextDissociatedCompetition;
    }
    else {
        return await competition_1.default.create({ name: givenName }).catch(function (err) { throw err; });
    }
};
exports.nextCompetitionTemplate = nextCompetitionTemplate;
const nextTeamTemplate = async function (t, givenName, season) {
    const nextTeam = await (0, exports.getTeamBySeason)(t, givenName, season).catch(function (err) { throw err; });
    if (nextTeam) {
        return nextTeam;
    }
    const nextDissociatedTeam = await (0, exports.getDissociatedTeam)(t, givenName).catch(function (err) { throw err; });
    if (nextDissociatedTeam) {
        return nextDissociatedTeam;
    }
    else {
        return await team_1.default.create({ name: givenName }, { transaction: t }).catch(function (err) { throw err; });
    }
};
exports.nextTeamTemplate = nextTeamTemplate;
const transactionWrapper = async function (callback, next) {
    try {
        const result = await initdb_1.sequelize.transaction(callback).catch(function (error) {
            throw error;
        });
    }
    catch (error) {
        next(error);
        console.log(error);
    }
};
exports.transactionWrapper = transactionWrapper;
