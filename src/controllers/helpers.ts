import { NextFunction, Request, Response } from 'express'
import { body } from 'express-validator'
import { Transaction } from 'sequelize'
import { CompetitionModel } from '../models/competition'
import { sequelize } from '../models/concerns/initdb'
import Competition from '../models/competition'
import { PlayerModel } from '../models/player'
import  Team, { TeamModel } from '../models/team'


interface resultsGeneratorType {
    preFormCreateCompetition: preFormCreateCompetitionResults,
    postFormCreateCompetition: postFormCreateCompetitionResults,  
    seeCompetition: seeCompetitionResults,
    seePlayer: seePlayerResults,
    preFormCreatePlayer: preFormCreatePlayerResults,
    postFormCreatePlayer: postFormCreatePlayerResults,
    preFormUpdatePlayer: preFormUpdatePlayerResults,
    seeTeam: seeTeamResults,
    preFormCreateTeam: preFormCreateTeamResults,
    postFormCreateTeam: postFormCreateTeamResults,
    preFormUpdateTeam: preFormUpdateTeamResults,
    postFormUpdateTeam: postFormUpdateTeamResults,
    
    
}

export interface seePlayerResults {
    firstName: string,
    lastName: string,
    nationality: string, 
    teamName?: string,
    age: number,
    position: string,
    goals?: number,
    assists?: number,
    speed?: number,
    strength?: number,
    attack?: number,
    defense?: number,
    goalkeeping?: number,
    intelligence?: number,
    technique?: number,
    code?: number
    

}

export interface seeTeamResults {
    name: string
    players?: PlayerModel[]
    competitions?: CompetitionModel[]
    code?: number
}

export interface seeCompetitionResults {
    name: string,
    teams?: TeamModel[],
    code?: number
}

export interface preFormCreatePlayerResults {
    teams: string[],
    seasons: string[],
    errors?: {[index: string]: string | number},
    team?: string,
    season?: string
    
}

export interface preFormCreateCompetitionResults {
    teams: string[],
    errors?: {[index: string]: string | number},
    chosenTeams?: string[],
}

export interface preFormCreateTeamResults {
    competitions: string[],
    errors?: {[index: string]: string | number},
    chosenCompetitions?: string[],
    
}

export interface postFormCreatePlayerResults {
    firstName: string,
    lastName: string,
    nationality: string,
    age: number,
    position: string,
    goals?: number,
    assists?: number,
    speed?: number,
    strength?: number,
    attack?: number, 
    defense?: number,
    goalkeeping?: number,
    intelligence?: number,
    technique?: number,
    team?: string,
    season?: string,
    code?: number
    
}

export interface postFormCreateCompetitionResults {
    name: string,
    chosenTeams?: string[]
    ranking?: boolean
}

export interface postFormCreateTeamResults {
    name: string,
    chosenCompetitions?: string[]
}

export interface preFormUpdatePlayerResults extends seePlayerResults, preFormCreatePlayerResults {};
export interface postFormUpdatePlayerResults extends postFormCreatePlayerResults {};
export interface preFormUpdateTeamResults extends preFormCreateTeamResults {
    name: string,
};
export interface postFormUpdateTeamResults extends postFormCreateTeamResults {};


interface attributePlaceholderType {
    seePlayer : {
        firstName: string,
        lastName: string,
        code?: number
        [index: string] : string | number | undefined 
    },
    seeTeam: {
        name: string,
        code?: number,
        [index: string] : string | number | undefined 
    },
    seeCompetition: {
        name: string,
        code?: number,
        [index: string] : string | number | undefined 
    },
    
    
   
}

export let attributesPlaceholders: attributePlaceholderType = { 
    seePlayer : {
        firstName: '',
        lastName: '',
        code: undefined
        
    },
    seeTeam: {
        name: '',
        code: undefined
    },
    seeCompetition: {
        name: '',
        code: undefined
    },
    
    

}

type placeholderKey = keyof attributePlaceholderType


export const queryHelpers = {
    getAllCompetitions: async function(t:Transaction){
        const competitions = await Competition.findAll({
            include: [{
                model: Team,
                through: {
                    attributes: ['season']
                }
            }],
            transaction: t
        }).catch(function(error:Error){
            throw error
        })
        return competitions
        

    },

    getAllCompetitionNames: function(results: CompetitionModel[]){
        const names = results.filter(competition => competition.getDataValue('name'))
        const uniqueNames = Array.from(new Set(names))
        return uniqueNames

    },

    getAllTeams : async function(t:Transaction){
        const teams = await Team.findAll({
              include: [{
                    model: Competition,
                    through: {
                          attributes: ['season']
                    }
              }],
              transaction: t
        }).catch(function(error:Error){
            throw error
        })
        return teams
    },

    getAllTeamNames : function(results: TeamModel[]){
        const names = results.filter(team => team.getDataValue('name'))
        const uniqueNames = Array.from(new Set(names))
        return uniqueNames
  },

    getAllSeasons : function(results: TeamModel[] | CompetitionModel[], input: 'team' | 'competition'){

        const orderSeasons = function(seasons:string[]){
            const years = seasons.map(season => parseInt(season.slice(0,4)));
            seasons.sort(function(x,y){
                return years[seasons.indexOf(x)] - years[seasons.indexOf(y)]

            })
            return seasons

        }
        
        const getThroughTeams = function(res: TeamModel[]){
            const competitions = res.map(team => team.competitions).flat(); 
            const seasons = (competitions as any[]).map(competition => competition['TeamsCompetitions'].get('season')); 
            const uniqueSeasons = Array.from(new Set(seasons));
            return orderSeasons(uniqueSeasons)
        }

        const getThroughCompetitions = function(res: CompetitionModel[]){
            const teams = res.map(comp => comp.teams).flat(); 
            const seasons = (teams as any[]).map(team => team['TeamsCompetitions'].get('season')); 
            const uniqueSeasons = Array.from(new Set(seasons));
            return orderSeasons(uniqueSeasons)
        }

        switch(input){
            case 'team': return getThroughTeams(results as TeamModel[]);
            case 'competition': return getThroughCompetitions(results as CompetitionModel[]);
        }
        
  },

    seasonsGenerator: function(competitions: CompetitionModel[], teams: TeamModel[]){
        if(competitions && competitions.length > 0){
            return this.getAllSeasons(competitions, 'competition')
        }
        else if(teams && teams.length>0){
            return this.getAllSeasons(teams, 'team')
        }
        else{
            return ['2021/22']
        }

    }

    
}


export const renderers = {

    preFormCreateCompetition: function(res:Response, results: preFormCreateCompetitionResults){
        res.render('createCompetition',{
            errors: results.errors,
            teams: results.teams,
            chosenTeams: results.chosenTeams,


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

export const resultsGenerator : () => resultsGeneratorType = function(){
    return {
        preFormCreateCompetition: {
            teams: []
        },
        postFormCreateCompetition: {
            name: ''
        },
        seeCompetition: {
            name: ''

        },
        seePlayer : {
            firstName: '',
            lastName: '',
            code: undefined,
            nationality: '',
            position: '',
            age: 15
        },
        preFormCreatePlayer: {
            teams: [],
            seasons: [],     
        },
        postFormCreatePlayer:  {
            firstName: '',
            lastName: '',
            nationality: '',
            age: 15,
            position: '',
      },
        preFormUpdatePlayer: {
            firstName: '',
            lastName: '',
            code: undefined,
            nationality: '',
            position: '',
            age: 15,
            teams: [],
            seasons: []
        },
        seeTeam: {
            name: ''
        },
        preFormCreateTeam: {
            competitions: [],
        },
        postFormCreateTeam: {
            name: '',
        },
        preFormUpdateTeam: {
            name: '',
            competitions: []
        },
        postFormUpdateTeam: {
            name: ''
        }
        
    }
}

export const validators = function(){

    const _sanitiseString = function(stringsArray: string[]){
        stringsArray.forEach(val => 
            body(val, `${val} must not be empty.`)
            .trim()
            .isLength({min: 2})
            .escape()
        )
    }

    return {
        postFormPlayer: () => {
            const requiredValues = ['firstName', 'lastName', 'age', 'nationality', 'position']
            _sanitiseString(requiredValues);
        },
        postFormTeam: () => {
            _sanitiseString(['name'])
        },
        postFormCompetition: () => {
            _sanitiseString(['name'])
        }

    }

}

export const resetPlaceholderAttributes = function<T extends {}>(obj:T){
    const placeholders = Object.assign({},obj);
    const resetAttributes = function(){
        Object.assign(obj, placeholders) 
    }
    return resetAttributes
}

export const syncAttributes = function(){

    const _emptyResultHandler = function(value: string | number | undefined): Error | null{
        const error = new Error('Something went wrong when fetching the requested details.');
        const throwError = () => { throw error }
        return value === '' || value === undefined ? throwError() : null
    }

    const _assessRequestParameters = function(req: Request, next: NextFunction, placeholderProperty:placeholderKey): void{
        try {
            if(Object.prototype.hasOwnProperty.call(attributesPlaceholders, placeholderProperty)){           
                let attributes: attributePlaceholderType[placeholderKey] = Object.assign({},attributesPlaceholders[placeholderProperty ])                     
                for(let name of Object.keys(attributes)){
                    attributes[name] = req.params[name] ? req.params[name] : attributes[name]
                    _emptyResultHandler(typeof attributes[name] === undefined ? attributes[name] : attributes[name]?.toString())                       
                }
                Object.assign(attributesPlaceholders, {[placeholderProperty]: attributes})
            }
        }
        catch(error){
            console.log(error)
            next(error)
        }


    }

    return {
        getSeePlayerAttributes: function(req: Request, next: NextFunction): void{
            _assessRequestParameters(req, next, 'seePlayer')
        },
        getSeeTeamAttributes: function(req: Request, next:NextFunction): void{
            _assessRequestParameters(req, next, 'seeTeam')
        },
        getSeeCompetitionAttributes: function(req: Request, next: NextFunction): void{
            _assessRequestParameters(req,next,'seeCompetition')

        }
    }
    
}


export const transactionWrapper = async function(callback: (t:Transaction) => Promise<void>){
    try {
        const result = await sequelize.transaction(callback).catch(function(error:Error){
            throw error
        })
        
    }
    catch (error){
        console.log(error)
        
    }

}
