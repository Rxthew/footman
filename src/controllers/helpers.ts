import { NextFunction, Request, Response } from 'express'
import { Transaction } from 'sequelize'
import { sequelize } from '../models/concerns/initdb'



export interface seePlayerResults {
    firstName: string,
    lastName: string,
    nationality: string, 
    teamName: string,
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
    

}


interface attributePlaceholderType {
    seePlayer : {
        firstName: string,
        lastName: string,
        nationality: string
        [index: string] : string | number | undefined 
    },
   
}

export let attributesPlaceholders: attributePlaceholderType = { 
    seePlayer : {
        firstName: '',
        lastName: '',
        nationality: ''
        
    },

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
    }
}

export const syncAttributes = function(){

    const _emptyStringHandler = function(value: string | undefined): Error | null{
        const error = new Error('Something went wrong when fetching the details.');
        const throwError = () => { throw error }
        return value === '' || value === undefined ? throwError() : null
    }

    const _assessRequestParameters = function(req: Request, next: NextFunction, placeholderProperty:placeholderKey): void{
        try {
            if(Object.prototype.hasOwnProperty.call(attributesPlaceholders, placeholderProperty)){           
                let attributes: attributePlaceholderType[placeholderKey] = Object.assign({},attributesPlaceholders[placeholderProperty ])                     
                for(let name of Object.keys(attributes)){
                    attributes[name] = req.params[name] ? req.params[name] : ''
                    _emptyStringHandler(attributes[name]?.toString())                       
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
