import { Response } from 'express';
import { preFormCreateCompetitionResults, preFormUpdateCompetitionResults, seeCompetitionResults, 
         preFormCreatePlayerResults, preFormUpdatePlayerResults, seePlayerResults,
         preFormCreateTeamResults, preFormUpdateTeamResults, seeTeamResults
} from "./results";


export const renderers = {

    preFormCreateCompetition: function(res:Response, results: preFormCreateCompetitionResults){
        res.render('createCompetition',{
            errors: results.errors,
            teams: results.teams,
            chosenTeams: results.chosenTeams,


        })

    },

    preFormUpdateCompetition: function(res:Response, results: preFormUpdateCompetitionResults){
        res.render('updateCompetition',{
            name: results.name,
            errors: results.errors,
            teams: results.teams,
            chosenTeams: results.chosenTeams,
            ranking: results.ranking


        })

    },
    
    seeCompetition: function(res:Response, results: seeCompetitionResults){
        res.render('seeCompetition',{
            name: results.name,
            teams: results.teams
        })
    },

    preFormCreatePlayer: function(res: Response, results: preFormCreatePlayerResults){
        res.render('createPlayer', {
            teams: results.teams,
            seasons: results.seasons,
            errors: results.errors,
            team: results.team,
            season: results.season

        })
    },

    preFormUpdatePlayer: function(res: Response, results: preFormUpdatePlayerResults){
        res.render('updatePlayer',{
            firstName: results.firstName,
            lastName: results.lastName,
            teamName: results.teamName,
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
    },

    seePlayer: function(res:Response, results: seePlayerResults){
        res.render('seePlayer', {
            name: results.firstName + ' ' + results.lastName,
            teamName: results.teamName,
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

        })
    },

    preFormCreateTeam: function(res: Response, results: preFormCreateTeamResults){
        res.render('createTeam',{
            competitions: results.competitions,
            errors: results.errors,
            chosenCompetitions: results.chosenCompetitions,
            

        })
    },

    preFormUpdateTeam: function(res: Response, results: preFormUpdateTeamResults){
        res.render('updateTeam',{
            name: results.name,
            competitions: results.competitions,
            errors: results.errors,
            chosenCompetitions: results.chosenCompetitions,
            

        })
    },

    seeTeam: function(res: Response, results: seeTeamResults){
        res.render('seeTeam',{
         name: results.name,
         players: results.players,
         competitions: results.competitions

        })

    },
    
}