"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postFormUpdateCompetition = exports.postFormCreateCompetition = exports.postFormUpdateTeam = exports.postFormCreateTeam = exports.postFormPlayer = void 0;
const express_validator_1 = require("express-validator");
const sequelize_1 = require("sequelize");
const competition_1 = __importDefault(require("../../models/competition"));
const team_1 = __importDefault(require("../../models/team"));
const _finderFunctions = {
    duplicateCreateCompetition: async function (valuesArray) {
        const [chosenName, chosenSeason] = valuesArray;
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
    duplicateUpdateCompetition: async function (valuesArray) {
        const [chosenName, code, chosenSeason] = valuesArray;
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
    duplicateCreateTeam: async function (valuesArray) {
        const [chosenName, chosenSeason] = valuesArray;
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
    duplicateUpdateTeam: async function (valuesArray) {
        const [chosenName, code, chosenSeason] = valuesArray;
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
const _checkDuplicate = async function (finderFunction, valuesArray) {
    (0, express_validator_1.body)(valuesArray).custom(finderFunction);
};
const _teamSeasonCheck = async function (valuesArray) {
    const [givenName, chosenSeason] = valuesArray;
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
    (0, express_validator_1.body)(valuesArray).custom(function () {
        const rankings = valuesArray.map(value => parseInt(value));
        const unique = Array.from(new Set(rankings));
        if (rankings.length !== unique.length) {
            throw new Error('There appear to be duplicate rankings. Please choose unique rankings only.');
        }
        return true;
    });
};
const _sequentialRankings = function (valuesArray) {
    (0, express_validator_1.body)(valuesArray).customSanitizer(function () {
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
    });
};
const _sanitiseString = function (stringsArray) {
    stringsArray.forEach(val => (0, express_validator_1.body)(val, `${val} must not be empty.`)
        .trim()
        .isLength({ min: 2 })
        .escape());
};
const postFormPlayer = (teamSeason) => {
    const requiredValues = ['firstName', 'lastName', 'age', 'nationality', 'position'];
    _sanitiseString(requiredValues);
    teamSeason ? (0, express_validator_1.body)(['team', 'season']).custom(_teamSeasonCheck) : teamSeason;
};
exports.postFormPlayer = postFormPlayer;
const postFormCreateTeam = () => {
    _sanitiseString(['name']);
    _checkDuplicate(_finderFunctions.duplicateCreateTeam, ['name', 'season']);
};
exports.postFormCreateTeam = postFormCreateTeam;
const postFormUpdateTeam = () => {
    _sanitiseString(['name']);
    _checkDuplicate(_finderFunctions.duplicateUpdateTeam, ['name', 'season']);
};
exports.postFormUpdateTeam = postFormUpdateTeam;
const postFormCreateCompetition = () => {
    _sanitiseString(['name']);
    _checkDuplicate(_finderFunctions.duplicateCreateCompetition, ['name', 'season']);
    _uniqueRankings(['rankings']);
    _sequentialRankings(['rankings']);
};
exports.postFormCreateCompetition = postFormCreateCompetition;
const postFormUpdateCompetition = () => {
    _sanitiseString(['name']);
    _checkDuplicate(_finderFunctions.duplicateUpdateCompetition, ['name', 'code', 'season']);
    _uniqueRankings(['rankings']);
    _sequentialRankings(['rankings']);
};
exports.postFormUpdateCompetition = postFormUpdateCompetition;
