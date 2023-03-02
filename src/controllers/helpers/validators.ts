import { Request } from 'express';
import { body } from 'express-validator';
import { Op } from 'sequelize';
import { sequentialRankings } from './misc';
import  Competition  from '../../models/competition';
import  Team  from '../../models/team';


const _arrayCheck = function(value: string | string[]){
    return !value || Array.isArray(value) ? value : [value]
};

const _checkDuplicate = function(finderFunction:(ref: string, req:Request, vals:string[])=>Promise<void>, reference:string, keysArray:string[]){
    return body(reference).custom( async function(reference, {req}){ 
        return await finderFunction(reference, req as Request, keysArray).catch(function(err:Error){throw err}) 
        }
    )

};

const _cleanEmptyInputs = function(value: string | string[] ){
    if(Array.isArray(value) && value.every(element => element === '')){
        return undefined
    }
    return value === '' ? undefined : value 
};


const _cleanNullTeamChoice = function(teamValue:string, req: Request){
    if(teamValue === 'None'){
        req.body.season ? req.body.season = undefined : false;
        return undefined
    }
    return teamValue

};

const _finderFunctions = {
    duplicateCreateCompetition: async function(reference:string, req:Request, keysArray: string[]){
        const chosenName = reference;
        const [chosenSeason] = keysArray.map(key => req.body[key]);
        if(chosenSeason){
            const duplicate = await Competition.findOne({
                where: {
                    name: chosenName,
                },
                include: [{
                    model: Team,
                    required: true,
                    through: {
                        where: {
                            season: chosenSeason
                        }
                    }
                    
                }]
            }).catch(function(err:Error){throw err})

            return duplicate ? Promise.reject('There appears to be a duplicate for this. Try a different season or name')  : Promise.resolve() 
        }
        else{
            return Promise.resolve()
        }

    },
    duplicateUpdateCompetition: async function(reference:string, req:Request, keysArray: string[]){
        const chosenName = reference;
        const [code,chosenSeason] =  keysArray.map(key => req.body[key]);
        if(code && chosenSeason){
            const duplicate = await Competition.findOne({
                where: {
                    name: chosenName,
                    code: {
                        [Op.not]: code
                    }
                },
                include: [{
                    model: Team,
                    through: {
                        where: {
                            season: chosenSeason
                        }
                    }
                    
                }]
            }).catch(function(err:Error){throw err})

            return duplicate ? Promise.reject('There appears to be a duplicate for this. Try a different season or name')  : Promise.resolve() 
        }
        else{
            return Promise.resolve()
        }
         
    },

    duplicateCreateTeam: async function(reference:string, req:Request, keysArray: string[]){
        const chosenName = reference;
        const [chosenSeason] =  keysArray.map(key => req.body[key]);
        if(chosenSeason){
            const duplicate = await Team.findOne({
                where: {
                    name: chosenName,
                },
                include: [{
                    model: Competition,
                    required: true,
                    through: {
                        where: {
                            season: chosenSeason
                        }
                    }
                    
                }]
            }).catch(function(err:Error){throw err})

            return duplicate ? Promise.reject('There appears to be a duplicate for this. Try a different season or name')  : Promise.resolve() 
        }
        else{
            return Promise.resolve()
        }
        
    },

    duplicateUpdateTeam: async function(reference:string, req:Request, keysArray: string[]){
        const chosenName = reference;
        const [code,chosenSeason] = keysArray.map(key => req.body[key])
        if(code && chosenSeason){
            const duplicate = await Team.findOne({
                where: {
                    name: chosenName,
                    code: {
                        [Op.not]: code
                    }
                },
                include: [{
                    model: Competition,
                    required: true,
                    through: {
                        where: {
                            season: chosenSeason
                        }
                    }
                }]
            }).catch(function(err:Error){throw err})

            return duplicate ? Promise.reject('There appears to be a duplicate for this. Try a different season or name')  : Promise.resolve() 
        }
        else{
            return Promise.resolve()
        }

    }
};

const _sanitiseString = function(stringsArray: string[], person:boolean=false){
    let sanitisers = stringsArray.map(val => person ? 
        body(val, `${val} must not be empty.`)
        .trim()
        .isAlpha(undefined, {ignore: ' -'})
        .withMessage(`Characters in the this field must be a word with letters from the alphabet (or it can include a hyphen).`)
        .isLength({min: 2})
        .withMessage(`${val} must be at least two characters long`)
        .escape()
        : body(val, `${val} must not be empty.`)
        .trim()
        .isAlphanumeric(undefined, {ignore: ' -'})
        .withMessage(`Characters in the ${val} field must be a word with letters from the alphabet (or it can include a hyphen) or otherwise a number.`)
        .isLength({min: 2})
        .withMessage(`${val} must be at least two characters long`)
        .escape()
    )
    return sanitisers
};


const _teamSeasonCheck = async function(reference:string,req:Request,keysArray: string[]){
    const givenName = reference;
    const [chosenSeason] = keysArray.map(key => req.body[key]);
    const team = await Team.findOne({
        where: {
            name: givenName
        },
        include: [{
            model: Competition,
            required: true,
            through: {
                where: {
                    season: chosenSeason
                }
            }
            
        }],
    }).catch(function(error:Error){
        throw error
    })
    
    return team ? Promise.resolve() : Promise.reject('Sorry, there is no team registered with that name for the season you chose.'+
     ' You can either create the team for that season by assigning it to a competition and come back, or choose a different team for this player.')

};


const _uniqueRankings = function(valuesArray: string[] | undefined){ 
    if(valuesArray){
        const rankings = valuesArray.map(value => parseInt(value));
        const unique = Array.from(new Set(rankings));
        if(rankings.length !== unique.length){
            throw new Error('There appear to be duplicate rankings. Please choose unique rankings only.')
        }
    }
    return true


};



const _validateAge = function(age:string){
     return body(age,'Age must not be empty')
     .trim()
     .isNumeric()
     .withMessage('Age must be a number')

};

const _validateEmptyInput = function(values: string[]){
    if(Array.isArray(values) && values.some(value => value === '')){
        throw new Error('There appear to be some empty fields. Please fill them out with valid values before submission')
    }
    return true
}

const _validateNoneTeamName = function(name:string){
    if(name === 'None'){
        throw new Error('None is a reserved name for players with no team. Please choose another.')
    }
    return true
};

export const submitPlayerValidator = () => {
    const requiredValues = ['firstName', 'lastName'];
    return [
    ..._sanitiseString(requiredValues, true),
    _validateAge('age'),
    body(['goals','assists','speed','strength','attack','defense','goalkeeping','intelligence','technique','team','season','code']).customSanitizer(_cleanEmptyInputs),
    body('team').customSanitizer(function(value, {req}){
        return (req.body.team ? _cleanNullTeamChoice(value,req as Request): false)
    }),
    body('team').custom(async function(reference, {req}){
       return (req.body.team && req.body.season) ? await _teamSeasonCheck(reference, req as Request, ['season']).catch(function(err){throw err}) : await Promise.resolve()}) 
    ]
};

export const createTeamValidator = () => {
    return [
    ..._sanitiseString(['name']),
    body('name').custom(_validateNoneTeamName),
    body(['chosenCompetitions','season']).customSanitizer(_cleanEmptyInputs),
    body(['chosenCompetitions']).customSanitizer(_arrayCheck),
    _checkDuplicate(_finderFunctions.duplicateCreateTeam,'name',['season'])
    ]
};

export const updateTeamValidator = () => {
    return [
    ..._sanitiseString(['name']),
    body('name').custom(_validateNoneTeamName),
    body(['chosenCompetitions','season']).customSanitizer(_cleanEmptyInputs),
    body(['chosenCompetitions']).customSanitizer(_arrayCheck),
    _checkDuplicate(_finderFunctions.duplicateUpdateTeam,'name',['code','season']),
    ]
};


export const createCompetitionValidator = () => {
    return [
    ..._sanitiseString(['name']),
    _checkDuplicate(_finderFunctions.duplicateCreateCompetition,'name',['season']),
    body(['chosenTeams','points','rankings','season']).customSanitizer(_cleanEmptyInputs),
    body(['chosenTeams','points','rankings']).customSanitizer(_arrayCheck),
    body('points').custom(_validateEmptyInput),
    body('rankings').custom(_uniqueRankings),
    body('rankings').customSanitizer(sequentialRankings),
    ]
};


export const updateCompetitionValidator = () => {
    return [
    ..._sanitiseString(['name']),
    _checkDuplicate(_finderFunctions.duplicateUpdateCompetition,'name',['code','season']),
    body(['chosenTeams','points','rankings','season']).customSanitizer(_cleanEmptyInputs),
    body(['chosenTeams','points','rankings']).customSanitizer(_arrayCheck),
    body('points').custom(_validateEmptyInput),
    body('rankings').custom(_uniqueRankings),
    body('rankings').customSanitizer(sequentialRankings),
    ]
}

