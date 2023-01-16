"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seeTeam = exports.preFormUpdateTeam = exports.preFormCreateTeam = exports.seePlayer = exports.preFormUpdatePlayer = exports.preFormCreatePlayer = exports.seeCompetition = exports.preFormUpdateCompetition = exports.preFormCreateCompetition = void 0;
const preFormCreateCompetition = function (res, results) {
    res.render('createCompetition', {
        name: results.name,
        errors: results.errors,
        teams: results.teams,
        chosenTeams: results.chosenTeams,
        rankings: results.rankings,
        points: results.points,
        seasons: results.seasons,
        season: results.season
    });
};
exports.preFormCreateCompetition = preFormCreateCompetition;
const preFormUpdateCompetition = function (res, results) {
    res.render('updateCompetition', {
        name: results.name,
        errors: results.errors,
        teams: results.teams,
        chosenTeams: results.chosenTeams,
        ranking: results.rankings,
        points: results.points,
        seasons: results.seasons,
        season: results.season
    });
};
exports.preFormUpdateCompetition = preFormUpdateCompetition;
const seeCompetition = function (res, results) {
    res.render('seeCompetition', {
        name: results.name,
        teams: results.teams,
        season: results.season,
        rankings: results.rankings,
        points: results.points
    });
};
exports.seeCompetition = seeCompetition;
const preFormCreatePlayer = function (res, results) {
    res.render('createPlayer', {
        firstName: results.firstName,
        lastName: results.lastName,
        team: results.team,
        nationality: results.nationality,
        age: results.age,
        position: results.position,
        goals: results.goals,
        assists: results.assists,
        speed: results.speed,
        strength: results.strength,
        attack: results.attack,
        defense: results.defense,
        goalkeeping: results.goalkeeping,
        intelligence: results.intelligence,
        technique: results.technique,
        season: results.season,
        teams: results.teams,
        seasons: results.seasons,
        errors: results.errors
    });
};
exports.preFormCreatePlayer = preFormCreatePlayer;
const preFormUpdatePlayer = function (res, results) {
    res.render('updatePlayer', {
        firstName: results.firstName,
        lastName: results.lastName,
        team: results.team,
        nationality: results.nationality,
        age: results.age,
        position: results.position,
        goals: results.goals,
        assists: results.assists,
        speed: results.speed,
        strength: results.strength,
        attack: results.attack,
        defense: results.defense,
        goalkeeping: results.goalkeeping,
        intelligence: results.intelligence,
        technique: results.technique,
        season: results.season,
        teams: results.teams,
        seasons: results.seasons,
        errors: results.errors
    });
};
exports.preFormUpdatePlayer = preFormUpdatePlayer;
const seePlayer = function (res, results) {
    res.render('seePlayer', {
        name: results.firstName + ' ' + results.lastName,
        team: results.team,
        nationality: results.nationality,
        age: results.age,
        position: results.position,
        goals: results.goals,
        assists: results.assists,
        speed: results.speed,
        strength: results.strength,
        attack: results.attack,
        defense: results.defense,
        goalkeeping: results.goalkeeping,
        intelligence: results.intelligence,
        technique: results.technique
    });
};
exports.seePlayer = seePlayer;
const preFormCreateTeam = function (res, results) {
    res.render('createTeam', {
        name: results.name,
        competitions: results.competitions,
        seasons: results.seasons,
        season: results.season,
        errors: results.errors,
        chosenCompetitions: results.chosenCompetitions,
    });
};
exports.preFormCreateTeam = preFormCreateTeam;
const preFormUpdateTeam = function (res, results) {
    res.render('updateTeam', {
        name: results.name,
        competitions: results.competitions,
        seasons: results.seasons,
        season: results.season,
        errors: results.errors,
        chosenCompetitions: results.chosenCompetitions,
    });
};
exports.preFormUpdateTeam = preFormUpdateTeam;
const seeTeam = function (res, results) {
    res.render('seeTeam', {
        name: results.name,
        players: results.players,
        competitions: results.competitions
    });
};
exports.seeTeam = seeTeam;
