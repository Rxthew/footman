"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCompetitionValidator = exports.createCompetitionValidator = exports.updateTeamValidator = exports.createTeamValidator = exports.submitPlayerValidator = void 0;
const express_validator_1 = require("express-validator");
const sequelize_1 = require("sequelize");
const competition_1 = __importDefault(require("../../models/competition"));
const team_1 = __importDefault(require("../../models/team"));
const _finderFunctions = {
    duplicateCreateCompetition: async function (reference, req, keysArray) {
        const chosenName = reference;
        const [chosenSeason] = keysArray.map(key => req.body[key]);
        if (chosenSeason) {
            const duplicate = await competition_1.default.findOne({
                where: {
                    name: chosenName,
                },
                include: [{
                        model: team_1.default,
                        where: {
                            season: chosenSeason
                        }
                    }]
            }).catch(function (err) { throw err; });
            return duplicate ? Promise.reject('There appears to be a duplicate for this. Try a different season or name') : Promise.resolve();
        }
        else {
            return Promise.resolve();
        }
    },
    duplicateUpdateCompetition: async function (reference, req, keysArray) {
        const chosenName = reference;
        const [code, chosenSeason] = keysArray.map(key => req.body[key]);
        if (code && chosenSeason) {
            const duplicate = await competition_1.default.findOne({
                where: {
                    name: chosenName,
                    code: {
                        [sequelize_1.Op.not]: code
                    }
                },
                include: [{
                        model: team_1.default,
                        where: {
                            season: chosenSeason
                        }
                    }]
            }).catch(function (err) { throw err; });
            return duplicate ? Promise.reject('There appears to be a duplicate for this. Try a different season or name') : Promise.resolve();
        }
        else {
            return Promise.resolve();
        }
    },
    duplicateCreateTeam: async function (reference, req, keysArray) {
        const chosenName = reference;
        const [chosenSeason] = keysArray.map(key => req.body[key]);
        if (chosenSeason) {
            const duplicate = await team_1.default.findOne({
                where: {
                    name: chosenName,
                },
                include: [{
                        model: competition_1.default,
                        where: {
                            season: chosenSeason
                        }
                    }]
            }).catch(function (err) { throw err; });
            return duplicate ? Promise.reject('There appears to be a duplicate for this. Try a different season or name') : Promise.resolve();
        }
        else {
            return Promise.resolve();
        }
    },
    duplicateUpdateTeam: async function (reference, req, keysArray) {
        const chosenName = reference;
        const [code, chosenSeason] = keysArray.map(key => req.body[key]);
        if (code && chosenSeason) {
            const duplicate = await team_1.default.findOne({
                where: {
                    name: chosenName,
                    code: {
                        [sequelize_1.Op.not]: code
                    }
                },
                include: [{
                        model: competition_1.default,
                        where: {
                            season: chosenSeason
                        }
                    }]
            }).catch(function (err) { throw err; });
            return duplicate ? Promise.reject('There appears to be a duplicate for this. Try a different season or name') : Promise.resolve();
        }
        else {
            return Promise.resolve();
        }
    }
};
const _checkDuplicate = function (finderFunction, reference, keysArray) {
    return (0, express_validator_1.body)(reference).custom(async function (reference, { req }) {
        return await finderFunction(reference, req, keysArray).catch(function (err) { throw err; });
    });
};
const _teamSeasonCheck = async function (reference, req, keysArray) {
    const givenName = reference;
    const [chosenSeason] = keysArray.map(key => req.body[key]);
    const team = await team_1.default.findOne({
        where: {
            name: givenName
        },
        include: [{
                model: competition_1.default,
                where: {
                    season: chosenSeason
                }
            }],
    }).catch(function (error) {
        throw error;
    });
    return team ? Promise.resolve() : Promise.reject('Sorry, there is no team registered with that name for the season you chose.' +
        ' You can either create the team for that season and come back or choose a different team for this player.');
};
const _uniqueRankings = function (valuesArray) {
    if (valuesArray) {
        const rankings = valuesArray.map(value => parseInt(value));
        const unique = Array.from(new Set(rankings));
        if (rankings.length !== unique.length) {
            throw new Error('There appear to be duplicate rankings. Please choose unique rankings only.');
        }
        return true;
    }
};
const _sequentialRankings = function (valuesArray) {
    if (valuesArray) {
        const rankings = valuesArray.map(value => parseInt(value));
        if (rankings.some(value => value > rankings.length)) {
            const mapOldToNewValues = function () {
                const rankChange = new Map();
                const orderedRankings = [...rankings].sort(function (x, y) {
                    return x > y ? 1 : -1;
                });
                for (let largest = rankings.length; largest > 0; largest--) {
                    rankChange.set(orderedRankings.pop(), largest);
                }
                return rankChange;
            };
            const produceNewRankings = function (valuesMap) {
                let newRankings = [];
                for (let index = 0; index < rankings.length; index++) {
                    newRankings = [...newRankings, valuesMap.get(rankings[index])];
                }
                const newStringRanks = newRankings.map(ranking => ranking?.toString());
                return newStringRanks;
            };
            const oldToNewValuesMap = mapOldToNewValues();
            return produceNewRankings(oldToNewValuesMap);
        }
    }
};
const _sanitiseString = function (stringsArray, person = false) {
    let sanitisers = stringsArray.map(val => person ?
        (0, express_validator_1.body)(val, `${val} must not be empty.`)
            .trim()
            .isAlpha(undefined, { ignore: ' -' })
            .withMessage(`Characters in the ${val} field must be a word with letters from the alphabet (or it can include a hyphen).`)
            .isLength({ min: 2 })
            .withMessage(`${val} must be at least two characters long`)
            .escape()
        : (0, express_validator_1.body)(val, `${val} must not be empty.`)
            .trim()
            .isAlphanumeric(undefined, { ignore: ' -' })
            .withMessage(`Characters in the ${val} field must be a word with letters from the alphabet (or it can include a hyphen) or otherwise a number.`)
            .isLength({ min: 2 })
            .withMessage(`${val} must be at least two characters long`)
            .escape());
    return sanitisers;
};
const _cleanEmptyInputs = function (value) {
    return value === '' ? undefined : value;
};
const _validateAge = function (age) {
    return (0, express_validator_1.body)(age, 'Age must not be empty')
        .trim()
        .isNumeric()
        .withMessage('Age must be a number');
};
const submitPlayerValidator = () => {
    const requiredValues = ['firstName', 'lastName'];
    return [
        ..._sanitiseString(requiredValues, true),
        (0, express_validator_1.body)(['goals', 'assists', 'speed', 'strength', 'attack', 'defense', 'goalkeeping', 'intelligence', 'technique', 'team', 'season', 'code']).customSanitizer(_cleanEmptyInputs),
        (0, express_validator_1.body)('team').custom(async function (reference, { req }) {
            return (req.body.team && req.body.season) ? await _teamSeasonCheck(reference, req, ['season']).catch(function (err) { throw err; }) : await Promise.resolve();
        })
    ];
};
exports.submitPlayerValidator = submitPlayerValidator;
const createTeamValidator = () => {
    return [
        ..._sanitiseString(['name']),
        _validateAge('age'),
        (0, express_validator_1.body)(['chosenCompetitions', 'season']).customSanitizer(_cleanEmptyInputs),
        _checkDuplicate(_finderFunctions.duplicateCreateTeam, 'name', ['season'])
    ];
};
exports.createTeamValidator = createTeamValidator;
const updateTeamValidator = () => {
    return [
        ..._sanitiseString(['name']),
        (0, express_validator_1.body)(['chosenCompetitions', 'season']).customSanitizer(_cleanEmptyInputs),
        _checkDuplicate(_finderFunctions.duplicateUpdateTeam, 'name', ['code', 'season']),
    ];
};
exports.updateTeamValidator = updateTeamValidator;
const createCompetitionValidator = () => {
    return [
        ..._sanitiseString(['name']),
        _checkDuplicate(_finderFunctions.duplicateCreateCompetition, 'name', ['season']),
        (0, express_validator_1.body)(['chosenTeams', 'points', 'rankings', 'season']).customSanitizer(_cleanEmptyInputs),
        (0, express_validator_1.body)('rankings').custom(_uniqueRankings),
        (0, express_validator_1.body)('rankings').customSanitizer(_sequentialRankings),
    ];
};
exports.createCompetitionValidator = createCompetitionValidator;
const updateCompetitionValidator = () => {
    return [
        ..._sanitiseString(['name']),
        _checkDuplicate(_finderFunctions.duplicateUpdateCompetition, 'name', ['code', 'season']),
        (0, express_validator_1.body)(['chosenTeams', 'points', 'rankings', 'season']).customSanitizer(_cleanEmptyInputs),
        (0, express_validator_1.body)('rankings').custom(_uniqueRankings),
        (0, express_validator_1.body)('rankings').customSanitizer(_sequentialRankings),
    ];
};
exports.updateCompetitionValidator = updateCompetitionValidator;
