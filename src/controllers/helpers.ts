import { NextFunction, Request, Response } from 'express'
import { body } from 'express-validator'
import { Transaction } from 'sequelize'
import { CompetitionModel } from '../models/competition'
import { sequelize } from '../models/concerns/initdb'
import Competition from '../models/competition'
import { PlayerModel } from '../models/player'
import  Team, { TeamModel } from '../models/team'


interface resultsGeneratorType {
    seePlayer: seePlayerResults,
    preFormCreatePlayer: preFormCreatePlayerResults,
    postFormCreatePlayer: postFormCreatePlayerResults,
    preFormUpdatePlayer: preFormUpdatePlayerResults,
    
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

export interface preFormUpdatePlayerResults extends seePlayerResults, preFormCreatePlayerResults {};
export interface postFormUpdatePlayerResults extends postFormCreatePlayerResults {};


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

    getAllTeams : async function(t:Transaction){
        const teams = await Team.findAll({
              include: [{
                    model: Competition,
                    through: {
                          attributes: ['season']
                    }
              }],
              transaction: t
        })
        return teams
    },

    getAllTeamNames : function(results: TeamModel[]){
        const names = results.filter(team => team.getDataValue('name'))
        const uniqueNames = Array.from(new Set(names))
        return uniqueNames
  },

    getAllSeasons : function(results: TeamModel[]){
        const competitions = results.filter(team => team.competitions).flat(); 
        const seasons = (competitions as any[]).map(competition => competition['TeamsCompetitions'].get('season')); 
        const uniqueSeasons = Array.from(new Set(seasons));
        return uniqueSeasons
  }
}


export const renderers = {
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

    seeTeam: function(res: Response, results: seeTeamResults){
           res.render('seeTeam',{
            name: results.name,
            players: results.players,
            competitions: results.competitions

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
            errors: results.errors

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
    
}

export const resultsGenerator : () => resultsGeneratorType = function(){
    return {
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
        const result = await sequelize.transaction(callback)
        
    }
    catch (error){
        console.log(error)
        
    }

}
