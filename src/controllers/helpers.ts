import { NextFunction, Request, Response } from 'express'
import { rmSync } from 'fs'
import { Transaction } from 'sequelize'
import { CompetitionModel } from '../models/competition'
import { sequelize } from '../models/concerns/initdb'
import { PlayerModel } from '../models/player'
import { TeamModel } from '../models/team'



export interface seePlayerResults {
    firstName: string,
    lastName: string,
    nationality?: string, 
    teamName?: string,
    age?: number,
    position?: string,
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
    }
    seeCompetition: {
        name: string,
        code?: number,
        [index: string] : string | number | undefined 
    }
   
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
    }

}

type placeholderKey = keyof attributePlaceholderType


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
    }
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
