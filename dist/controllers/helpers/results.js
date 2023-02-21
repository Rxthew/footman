"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seeTeam = exports.postFormUpdateTeam = exports.preFormUpdateTeam = exports.postFormCreateTeam = exports.preFormCreateTeam = exports.seePlayer = exports.postFormUpdatePlayer = exports.preFormUpdatePlayer = exports.postFormCreatePlayer = exports.preFormCreatePlayer = exports.seeCompetitionIndex = exports.seeCompetition = exports.postFormUpdateCompetition = exports.preFormUpdateCompetition = exports.postFormCreateCompetition = exports.preFormCreateCompetition = exports.seeHomepage = exports.competitionData = void 0;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
const competitionData = function () {
    return {};
};
exports.competitionData = competitionData;
const seeHomepage = function () {
    return {
        featuredCompetitions: [],
        featuredPlayers: [],
        featuredTeams: [],
        freeCompetitions: [],
        freePlayers: [],
        freeTeams: []
    };
};
exports.seeHomepage = seeHomepage;
const preFormCreateCompetition = function () {
    return {
        teams: [],
        seasons: []
    };
};
exports.preFormCreateCompetition = preFormCreateCompetition;
const postFormCreateCompetition = function () {
    return {
        name: ''
    };
};
exports.postFormCreateCompetition = postFormCreateCompetition;
const preFormUpdateCompetition = function () {
    return {
        name: '',
        teams: [],
        seasons: []
    };
};
exports.preFormUpdateCompetition = preFormUpdateCompetition;
const postFormUpdateCompetition = function () {
    return {
        name: '',
    };
};
exports.postFormUpdateCompetition = postFormUpdateCompetition;
const seeCompetition = function () {
    return {
        name: '',
    };
};
exports.seeCompetition = seeCompetition;
const seeCompetitionIndex = function () {
    return {
        competitionDetails: {},
        hashes: {},
        seasons: []
    };
};
exports.seeCompetitionIndex = seeCompetitionIndex;
const preFormCreatePlayer = function () {
    return {
        teams: [],
        seasons: [],
    };
};
exports.preFormCreatePlayer = preFormCreatePlayer;
const postFormCreatePlayer = function () {
    return {
        firstName: '',
        lastName: '',
        nationality: '',
        age: 15,
        position: '',
    };
};
exports.postFormCreatePlayer = postFormCreatePlayer;
const preFormUpdatePlayer = function () {
    return {
        firstName: '',
        lastName: '',
        nationality: '',
        position: '',
        age: 15,
        teams: [],
        seasons: []
    };
};
exports.preFormUpdatePlayer = preFormUpdatePlayer;
const postFormUpdatePlayer = function () {
    return {
        firstName: '',
        lastName: '',
        nationality: '',
        age: 15,
        position: '',
    };
};
exports.postFormUpdatePlayer = postFormUpdatePlayer;
const seePlayer = function () {
    return {
        firstName: '',
        lastName: '',
        nationality: '',
        position: '',
        age: 15
    };
};
exports.seePlayer = seePlayer;
const preFormCreateTeam = function () {
    return {
        competitions: [],
        seasons: []
    };
};
exports.preFormCreateTeam = preFormCreateTeam;
const postFormCreateTeam = function () {
    return {
        name: ''
    };
};
exports.postFormCreateTeam = postFormCreateTeam;
const preFormUpdateTeam = function () {
    return {
        name: '',
        competitions: [],
        seasons: []
    };
};
exports.preFormUpdateTeam = preFormUpdateTeam;
const postFormUpdateTeam = function () {
    return {
        name: ''
    };
};
exports.postFormUpdateTeam = postFormUpdateTeam;
const seeTeam = function () {
    return {
        name: ''
    };
};
exports.seeTeam = seeTeam;
