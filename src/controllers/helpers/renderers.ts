import { Response } from 'express';
import * as res from "./results";


export const seeHomepageRenderer = function(res: Response, results: res.seeHomepageResults){
    res.render('index', {
        featuredCompetitions: results.featuredCompetitions,
        featuredPlayers: results.featuredPlayers,
        featuredTeams: results.featuredTeams,
        freeCompetitions: results.freeCompetitions,
        freePlayers: results.freePlayers,
        freeTeams: results.freeTeams
    })

};

export const preFormCreateCompetitionRenderer = function(res:Response, results: res.preFormCreateCompetitionResults){
        res.render('createCompetition',{
            name: results.name,
            errors: results.errors,
            teams: results.teams,
            chosenTeams: results.chosenTeams,
            rankings: results.rankings,
            points: results.points,
            seasons: results.seasons,
            season: results.season


        })

};

export const preFormUpdateCompetitionRenderer = function(res:Response, results: res.preFormUpdateCompetitionResults){
        res.render('updateCompetition',{
            name: results.name,
            errors: results.errors,
            teams: results.teams,
            chosenTeams: results.chosenTeams,
            rankings: results.rankings,
            points: results.points,
            seasons: results.seasons,
            season: results.season



        })

};
    
export const seeCompetitionRenderer = function(res:Response, results: res.seeCompetitionResults){
        res.render('seeCompetition',{
            name: results.name,
            teams: results.teams,
            season: results.season,
            rankings: results.rankings,
            points: results.points,
            teamUrls: results.teamUrls
        })
};

export const seeCompetitionIndexRenderer = function(res:Response, results: res.seeCompetitionIndexResults){
        res.render('seeCompetitionIndex',{
            competitionDetails: results.competitionDetails,
            seasons: results.seasons,
            hashes: results.hashes
        })
};

export const preFormCreatePlayerRenderer = function(res: Response, results: res.preFormCreatePlayerResults){
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

        })
};

export const preFormUpdatePlayerRenderer = function(res: Response, results: res.preFormUpdatePlayerResults){
        res.render('updatePlayer',{
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

        })
};

export const seePlayerRenderer = function(res:Response, results: res.seePlayerResults){
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

        })
};

export const preFormCreateTeamRenderer = function(res: Response, results: res.preFormCreateTeamResults){
        res.render('createTeam',{
            name: results.name,
            competitions: results.competitions,
            seasons: results.seasons,
            season: results.season,
            errors: results.errors,
            chosenCompetitions: results.chosenCompetitions,
            

        })
};

export const preFormUpdateTeamRenderer = function(res: Response, results: res.preFormUpdateTeamResults){
        res.render('updateTeam',{
            name: results.name,
            competitions: results.competitions,
            seasons: results.seasons,
            season: results.season,
            errors: results.errors,
            chosenCompetitions: results.chosenCompetitions,
            

        })
};

export const seeTeamRenderer = function(res: Response, results: res.seeTeamResults){
        res.render('seeTeam',{
         name: results.name,
         players: results.players,
         playerUrls: results.playerUrls,
         competitions: results.competitions,
         competitionUrls: results.competitionUrls,


        })

    };
    