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
Object.defineProperty(exports, "__esModule", { value: true });
exports.seeHomepage = void 0;
const queryHelpers = __importStar(require("./helpers/queries"));
const resultsGenerator = __importStar(require("./helpers/results"));
const renderers_1 = require("./helpers/renderers");
let seeHomepageResults = resultsGenerator.seeHomepage();
const { transactionWrapper } = queryHelpers;
const seeHomepageCb = async function (t) {
    const seeHomepageQuery = async function () {
        const { getAllCompetitionUrlParams, getAllPlayerUrlParams, getAllTeamUrlParams, getFeaturedCompetitionUrls, getFeaturedPlayerUrls, getFeaturedTeamUrls, getAllDissociatedCompetitions, getAllDissociatedPlayers, getAllDissociatedTeams, } = queryHelpers;
        const getFeaturedUrls = async function () {
            const featuredCompetitionNames = ['English Premier League'];
            const featuredPlayerNames = [['Kevin', 'De Bruyne']];
            const featuredTeamNames = ['Manchester City'];
            const featuredCompetitionsUrls = await getFeaturedCompetitionUrls(t, featuredCompetitionNames).catch((err) => { throw err; });
            const featuredPlayersUrls = await getFeaturedPlayerUrls(t, featuredPlayerNames).catch((err) => { throw err; });
            const featuredTeamsUrls = await getFeaturedTeamUrls(t, featuredTeamNames).catch((err) => { throw err; });
            let featuredCompetitions = [];
            let featuredPlayers = [];
            let featuredTeams = [];
            featuredCompetitionsUrls && featuredCompetitionNames.length === featuredCompetitionsUrls.length ? featuredCompetitionNames.forEach((competitionName, index) => {
                featuredCompetitions = [...featuredCompetitions, { name: competitionName, url: featuredCompetitionsUrls[index] }];
            }) : featuredCompetitions;
            featuredPlayersUrls && featuredPlayerNames.length === featuredPlayersUrls.length ? featuredPlayerNames.forEach((playerNames, index) => {
                featuredPlayers = [...featuredPlayers, { names: playerNames, url: featuredPlayersUrls[index] }];
            }) : featuredPlayers;
            featuredTeamsUrls && featuredTeamNames.length === featuredTeamsUrls.length ? featuredTeamNames.forEach((teamName, index) => {
                featuredTeams = [...featuredTeams, { name: teamName, url: featuredTeamsUrls[index] }];
            }) : featuredTeams;
            return {
                featuredCompetitions,
                featuredPlayers,
                featuredTeams
            };
        };
        const getDissociatedUrls = async function () {
            const freeCompetitionModels = await getAllDissociatedCompetitions(t).catch((err) => { throw err; });
            const freePlayerModels = await getAllDissociatedPlayers(t).catch((err) => { throw err; });
            const freeTeamModels = await getAllDissociatedTeams(t).catch((err) => { throw err; });
            const competitionNames = freeCompetitionModels.map(competition => competition.getDataValue('name'));
            const playerNames = freePlayerModels.map(player => [player.getDataValue('firstName'), player.getDataValue('lastName')]);
            const teamNames = freeTeamModels.map(team => team.getDataValue('name'));
            const competitionUrls = getAllCompetitionUrlParams(freeCompetitionModels, ['name', 'code']);
            const playerUrls = getAllPlayerUrlParams(freePlayerModels, ['firstName', 'lastName', 'code']);
            const teamUrls = getAllTeamUrlParams(freeTeamModels, ['name', 'code']);
            let freeCompetitions = [];
            let freePlayers = [];
            let freeTeams = [];
            competitionNames.length === competitionUrls.length ? competitionNames.forEach((competitionName, index) => {
                freeCompetitions = [...freeCompetitions, { name: competitionName, url: competitionUrls[index] }];
            }) : freeCompetitions;
            playerNames.length === playerUrls.length ? playerNames.forEach((allNames, index) => {
                freePlayers = [...freePlayers, { names: allNames, url: playerUrls[index] }];
            }) : freePlayers;
            teamNames.length === teamUrls.length ? teamNames.forEach((teamName, index) => {
                freeTeams = [...freeTeams, { name: teamName, url: teamUrls[index] }];
            }) : freeTeams;
            return {
                freeCompetitions,
                freePlayers,
                freeTeams
            };
        };
        return {
            ...await getFeaturedUrls(),
            ...await getDissociatedUrls()
        };
    };
    const results = await seeHomepageQuery().catch((err) => { throw err; });
    console.log('____________________________________________________');
    console.log(results);
    console.log('____________________________________________________');
    const populateSeeHomepageResults = function () {
        if (results.featuredCompetitions && results.featuredPlayers && results.featuredTeams) {
            Object.assign(seeHomepageResults, { featuredCompetitions: results.featuredCompetitions }, { featuredPlayers: results.featuredPlayers }, { featuredTeams: results.featuredTeams }, { freeCompetitions: results.freeCompetitions, freePlayers: results.freePlayers, freeTeams: results.freeTeams });
        }
        else {
            const err = new Error('Query regarding homepage returned invalid data.');
            throw err;
        }
    };
    try {
        populateSeeHomepageResults();
    }
    catch (err) {
        console.log(err);
        const newErr = new Error('Query regarding homepage returned invalid data.');
        throw newErr;
    }
    return;
};
const seeHomepage = async function (req, res, next) {
    await transactionWrapper(seeHomepageCb, next).catch(function (error) {
        next(error);
    });
    if (seeHomepageResults) {
        (0, renderers_1.seeHomepageRenderer)(res, seeHomepageResults);
    }
    seeHomepageResults = resultsGenerator.seeHomepage();
};
exports.seeHomepage = seeHomepage;
