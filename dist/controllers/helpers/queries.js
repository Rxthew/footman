"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionWrapper = exports.nextTeamTemplate = exports.nextCompetitionTemplate = exports.getTeamSeason = exports.getSeasons = exports.getTeamBySeason = exports.getRankings = exports.getPoints = exports.getPlayerBySeason = exports.getFeaturedTeamUrls = exports.getFeaturedPlayerUrls = exports.getFeaturedCompetitionUrls = exports.getDissociatedTeam = exports.getDissociatedCompetition = exports.getCompetitionSeason = exports.getCompetitionBySeason = exports.getAllTeamsWithCompetitions = exports.getAllTeams = exports.getAllTeamUrlParams = exports.getAllTeamNames = exports.getAllSeasons = exports.getAllPlayerUrlParams = exports.getAllCompetitionUrlParams = exports.getAllCompetitions = exports.getAllCompetitionNames = exports.applyRanking = exports.applyPoints = void 0;
const competition_1 = __importDefault(require("../../models/competition"));
const initdb_1 = require("../../models/concerns/initdb");
const player_1 = __importDefault(require("../../models/player"));
const team_1 = __importDefault(require("../../models/team"));
const applyPoints = async function (latestCompetition, results, t) {
    if (results.chosenTeams && Array.isArray(results.chosenTeams) && results.chosenTeams.length > 0) {
        const generateTeamsPoints = function () {
            if (results.points) {
                let teamsPoints = {};
                const chosenTeams = results.chosenTeams;
                const chosenPoints = results.points;
                if (chosenTeams) {
                    chosenTeams.forEach((team, index) => {
                        Object.assign(teamsPoints, { [team]: chosenPoints[index] });
                    });
                    return teamsPoints;
                }
            }
            return;
        };
        let teamsPoints = generateTeamsPoints();
        const harmoniseRanking = function () {
            if (results.chosenTeams && teamsPoints && results.rankings && results.points) {
                let rankedTeams = [...results.chosenTeams];
                rankedTeams?.sort(function (x, y) {
                    if (teamsPoints) {
                        return teamsPoints[x] > teamsPoints[y] ? -1 : 1;
                    }
                    return -1;
                });
                let newRankings = [...results.rankings];
                newRankings.sort(function (x, y) {
                    return x > y ? 1 : -1;
                });
                let newPoints = [...results.points];
                newPoints?.sort(function (x, y) {
                    return x > y ? -1 : 1;
                });
                Object.assign(results, { chosenTeams: rankedTeams }, { rankings: newRankings }, { points: newPoints });
                teamsPoints = generateTeamsPoints();
            }
            return;
        };
        const updateTeamsCompetitions = async function (team, teamPoints) {
            const teamName = team.getDataValue('name');
            const teamsCompetitions = team.getDataValue('TeamsCompetitions');
            const points = teamPoints ? teamPoints[teamName] : null;
            teamsCompetitions.set('points', points);
            await teamsCompetitions.save({ transaction: t }).catch(function (err) { throw err; });
            return;
        };
        const inputPoints = async function () {
            const teams = await latestCompetition.getTeams({ transaction: t }).catch(function (err) { throw err; });
            let updatePromises = [];
            teams.forEach((team) => updatePromises = [...updatePromises, async () => await updateTeamsCompetitions(team, teamsPoints)]);
            updatePromises.length > 0 ? await Promise.all(updatePromises.map(updateTeam => updateTeam())).catch(function (err) { throw err; }) : updatePromises;
        };
        harmoniseRanking();
        await inputPoints().catch(function (err) { throw err; });
    }
};
exports.applyPoints = applyPoints;
const applyRanking = async function (latestCompetition, results, t) {
    const updateTeamsCompetitions = async function (team, chosenArray) {
        const _rankSetter = function (teamName) {
            const _validIndex = function (index) {
                return index > -1 ? index + 1 : null;
            };
            if (chosenArray && Array.isArray(chosenArray) && results.rankings) {
                const index = chosenArray.indexOf(teamName);
                const rank = _validIndex(index);
                return rank;
            }
            return null;
        };
        const teamsCompetitions = team.getDataValue('TeamsCompetitions');
        const teamName = team.getDataValue('name');
        teamsCompetitions.set('ranking', _rankSetter(teamName));
        await teamsCompetitions.save({ transaction: t }).catch(function (err) { throw err; });
    };
    const updateRankings = async function () {
        let chosenTeams = results.chosenTeams;
        if (results.rankings && chosenTeams) {
            const rankings = results.rankings;
            let rankedTeams = [...chosenTeams];
            rankedTeams.sort(function (x, y) {
                return rankings[rankedTeams.indexOf(x)] < rankings[rankedTeams.indexOf(y)] ? -1 : 1;
            });
            Object.assign(results, { chosenTeams: rankedTeams });
            chosenTeams = results.chosenTeams;
        }
        const teams = await latestCompetition.getTeams({ transaction: t }).catch(function (err) { throw err; });
        let updatePromises = [];
        teams.length > 0 ? teams.forEach((team) => updatePromises = [...updatePromises, async () => await updateTeamsCompetitions(team, chosenTeams).catch(function (err) { throw err; })]) : teams;
        updatePromises.length > 0 ? await Promise.all(updatePromises.map(updateTeam => updateTeam())).catch(function (err) { throw err; }) : updatePromises;
    };
    await updateRankings().catch(function (err) { throw err; });
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
const getAllCompetitionUrlParams = function (results, params) {
    if (results && results.length > 0) {
        try {
            const generateCompetitionUrl = function (competition) {
                const values = params.map(param => competition.getDataValue(param)?.toString());
                if (values.some(value => value === 'undefined' || value === 'null' || value === 'NaN')) {
                    throw Error('Something went wrong when fetching querying details for competition links.');
                }
                let url = '';
                values.forEach(value => value ? url = url.concat('.', value) : value);
                url = url.slice(1);
                return url;
            };
            const urls = results.map(competition => generateCompetitionUrl(competition)).filter(obj => obj !== undefined);
            return urls;
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }
    return [];
};
exports.getAllCompetitionUrlParams = getAllCompetitionUrlParams;
const getAllPlayerUrlParams = function (results, params) {
    if (results && results.length > 0) {
        try {
            const generatePlayerUrl = function (player) {
                const values = params.map(param => player.getDataValue(param)?.toString());
                if (values.some(value => value === 'undefined' || value === 'null' || value === 'NaN')) {
                    throw Error('Something went wrong when fetching querying details for player links.');
                }
                let url = '';
                values.forEach(value => value ? url = url.concat('.', value) : value);
                url = url.slice(1);
                return url;
            };
            const urls = results.map(player => generatePlayerUrl(player)).filter(obj => obj !== undefined);
            return urls;
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }
    return [];
};
exports.getAllPlayerUrlParams = getAllPlayerUrlParams;
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
const getAllTeamUrlParams = function (results, params) {
    if (results && results.length > 0) {
        try {
            const generateTeamUrl = function (team) {
                const values = params.map(param => team.getDataValue(param)?.toString());
                if (values.some(value => value === 'undefined' || value === 'null' || value === 'NaN')) {
                    throw Error('Something went wrong when fetching querying details for team links.');
                }
                let url = '';
                values.forEach(value => value ? url = url.concat('.', value) : value);
                url = url.slice(1);
                return url;
            };
            const urls = results.map(team => generateTeamUrl(team)).filter(obj => obj !== undefined);
            return urls;
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }
    return [];
};
exports.getAllTeamUrlParams = getAllTeamUrlParams;
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
const getAllTeamsWithCompetitions = async function (t, results) {
    if (results && results.length > 0) {
        const teamPromises = results.map(team => { return async () => await team.countCompetitions({ transaction: t }); });
        const competitionCounts = await Promise.all(teamPromises.map(promise => promise())).catch((err) => { throw err; });
        const teams = results.filter((t, index) => competitionCounts[index] > 0);
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
                required: true,
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
    const competitions = await competition_1.default.findAll({
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
    const competitionPromises = competitions && competitions.length > 0 ? competitions.map(competition => async () => { return await competition.countTeams({ transaction: t }); }) : [];
    const teamsCount = competitionPromises.length > 0 ? await Promise.all(competitionPromises.map(promise => promise())).catch((err) => { throw err; }) : competitionPromises;
    const dissociated = competitions.filter((c, index) => teamsCount[index] === 0);
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
    const teamPromises = teams && teams.length > 0 ? teams.map(team => async () => { return await team.countCompetitions({ transaction: t }); }) : [];
    const competitionsCount = teamPromises.length > 0 ? await Promise.all(teamPromises.map(promise => promise())).catch((err) => { throw err; }) : teamPromises;
    const dissociated = teams.filter((t, index) => competitionsCount[index] === 0);
    return dissociated.length > 0 ? dissociated[0] : null;
};
exports.getDissociatedTeam = getDissociatedTeam;
const getFeaturedCompetitionUrls = async function (t, competitionNames) {
    const seasons = (0, exports.getSeasons)();
    const latestSeason = seasons[seasons.length - 1];
    const competitionPromises = competitionNames.map(name => async () => await (0, exports.getCompetitionBySeason)(t, name, latestSeason).catch((err) => { throw err; }));
    const competitions = await Promise.all(competitionPromises.map(competitionPromise => competitionPromise())).catch((err) => { throw err; });
    const urls = competitions.some(comp => comp === null) ? [] : (0, exports.getAllCompetitionUrlParams)(competitions, ['name', 'code']);
    return urls;
};
exports.getFeaturedCompetitionUrls = getFeaturedCompetitionUrls;
const getFeaturedPlayerUrls = async function (t, playerNames) {
    const seasons = (0, exports.getSeasons)();
    const latestSeason = seasons[seasons.length - 1];
    const playerPromises = playerNames.map(names => async () => await (0, exports.getPlayerBySeason)(t, names[0], names[1], latestSeason).catch((err) => { throw err; }));
    const players = await Promise.all(playerPromises.map(playerPromise => playerPromise().catch((err) => { throw err; })));
    const urls = players.some(player => player === null) ? [] : (0, exports.getAllPlayerUrlParams)(players, ['firstName', 'lastName', 'code']);
    return urls;
};
exports.getFeaturedPlayerUrls = getFeaturedPlayerUrls;
const getFeaturedTeamUrls = async function (t, teamNames) {
    const seasons = (0, exports.getSeasons)();
    const latestSeason = seasons[seasons.length - 1];
    const teamPromises = teamNames.map(name => async () => await (0, exports.getTeamBySeason)(t, name, latestSeason).catch((err) => { throw err; }));
    const teams = await Promise.all(teamPromises.map(teamPromise => teamPromise().catch((err) => { throw err; })));
    const urls = teams.some(team => team === null) ? [] : (0, exports.getAllTeamUrlParams)(teams, ['name', 'code']);
    return urls;
};
exports.getFeaturedTeamUrls = getFeaturedTeamUrls;
const getPlayerBySeason = async function (t, givenFirstName, givenLastName, chosenSeason) {
    const player = await player_1.default.findOne({
        where: {
            firstName: givenFirstName,
            lastName: givenLastName
        },
        include: [{
                model: team_1.default,
                required: true,
                include: [{
                        model: competition_1.default,
                        required: true,
                        through: {
                            where: {
                                season: chosenSeason
                            }
                        }
                    }]
            }],
        transaction: t
    }).catch((err) => { throw err; });
    return player;
};
exports.getPlayerBySeason = getPlayerBySeason;
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
                required: true,
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
    return ['2020/21', '2021/22'];
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
