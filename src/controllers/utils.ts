import { NextFunction, Request, Response } from 'express'
import { Transaction } from 'sequelize'
import { sequelize } from '../app'

export interface seePlayerResults {
    firstName: string,
    lastName: string,
    nationality: string,
    teamName: string
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
    technique?: number

}

export const attributesPlaceholders = {
    seePlayer : {
        firstName: '',
        lastName: '',
        nationality: '',
    }
}

export const renderers = {
    seePlayer: function(res:Response, results: seePlayerResults){
        res.render('seePlayer', {
            name: results.firstName + '' + results.lastName,
            teamName: results.teamName,
            nationailty: results.nationality,
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

export const synchroniseAttributes = function(){
    return {
        getSeePlayerAttributes: function(req: Request, next: NextFunction){
            try {
            attributesPlaceholders.seePlayer = {
                firstName: req.params.firstName ? req.params.firstName : '',
                lastName: req.params.lastName ? req.params.lastName : '',
                nationality: req.params.nationality ? req.params.nationality : ''
            }}
            catch(error){
                console.log(error)
                next(error)
            }
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