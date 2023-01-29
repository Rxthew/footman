"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seeTeamRenderer = exports.preFormUpdateTeamRenderer = exports.preFormCreateTeamRenderer = exports.seePlayerRenderer = exports.preFormUpdatePlayerRenderer = exports.preFormCreatePlayerRenderer = exports.seeCompetitionRenderer = exports.preFormUpdateCompetitionRenderer = exports.preFormCreateCompetitionRenderer = void 0;
const preFormCreateCompetitionRenderer = function (res, results) {
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
exports.preFormCreateCompetitionRenderer = preFormCreateCompetitionRenderer;
const preFormUpdateCompetitionRenderer = function (res, results) {
    res.render('updateCompetition', {
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
exports.preFormUpdateCompetitionRenderer = preFormUpdateCompetitionRenderer;
const seeCompetitionRenderer = function (res, results) {
    res.render('seeCompetition', {
        name: results.name,
        teams: results.teams,
        season: results.season,
        rankings: results.rankings,
        points: results.points,
        teamUrls: results.teamUrls
    });
};
exports.seeCompetitionRenderer = seeCompetitionRenderer;
const preFormCreatePlayerRenderer = function (res, results) {
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
exports.preFormCreatePlayerRenderer = preFormCreatePlayerRenderer;
const preFormUpdatePlayerRenderer = function (res, results) {
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
exports.preFormUpdatePlayerRenderer = preFormUpdatePlayerRenderer;
const seePlayerRenderer = function (res, results) {
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
        technique: results.technique,
        teamUrl: results.teamUrl
    });
};
exports.seePlayerRenderer = seePlayerRenderer;
const preFormCreateTeamRenderer = function (res, results) {
    res.render('createTeam', {
        name: results.name,
        competitions: results.competitions,
        seasons: results.seasons,
        season: results.season,
        errors: results.errors,
        chosenCompetitions: results.chosenCompetitions,
    });
};
exports.preFormCreateTeamRenderer = preFormCreateTeamRenderer;
const preFormUpdateTeamRenderer = function (res, results) {
    res.render('updateTeam', {
        name: results.name,
        competitions: results.competitions,
        seasons: results.seasons,
        season: results.season,
        errors: results.errors,
        chosenCompetitions: results.chosenCompetitions,
    });
};
exports.preFormUpdateTeamRenderer = preFormUpdateTeamRenderer;
const seeTeamRenderer = function (res, results) {
    res.render('seeTeam', {
        name: results.name,
        players: results.players,
        playerUrls: results.playerUrls,
        competitions: results.competitions,
        competitionUrls: results.competitionUrls,
    });
};
exports.seeTeamRenderer = seeTeamRenderer;
