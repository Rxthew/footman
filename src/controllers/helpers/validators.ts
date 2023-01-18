import { Request } from 'express';
import { body } from 'express-validator';
import { Op } from 'sequelize';
import  Competition  from '../../models/competition';
import  Team  from '../../models/team';


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
                    where: {
                        season: chosenSeason
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
                    where: {
                        season: chosenSeason
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
                    where: {
                        season: chosenSeason
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
                    where: {
                        season: chosenSeason
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


const _checkDuplicate = function(finderFunction:(ref: string, req:Request, vals:string[])=>Promise<void>, reference:string, keysArray:string[]){
    return body(reference).custom( async function(reference, {req}){ 
        return await finderFunction(reference, req as Request, keysArray).catch(function(err:Error){throw err}) 
        }
    )

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
            where: {
                season: chosenSeason
            }
        }],
    }).catch(function(error:Error){
        throw error
    })
    
    return team ? Promise.resolve() : Promise.reject('Sorry, there is no team registered with that name for the season you chose.'+
     ' You can either create the team for that season and come back or choose a different team for this player.')

};

const _uniqueRankings = function(valuesArray: string[] | undefined){ 
    if(valuesArray){
        const rankings = valuesArray.map(value => parseInt(value));
        const unique = Array.from(new Set(rankings));
        if(rankings.length !== unique.length){
            throw new Error('There appear to be duplicate rankings. Please choose unique rankings only.')
        }
        return true
    }

};

const _sequentialRankings = function(valuesArray: string[] | undefined){
    if(valuesArray){
        const rankings = valuesArray.map(value => parseInt(value));
        if(rankings.some(value => value > rankings.length)){

            const mapOldToNewValues = function(){
                const rankChange = new Map();
                const orderedRankings = [...rankings].sort(function(x,y){
                    return x > y ? 1 : -1
                });
                for(let largest = rankings.length; largest > 0; largest--){
                    rankChange.set(orderedRankings.pop(),largest)
                }
                return rankChange
            };
            
            const produceNewRankings = function(valuesMap: Map<number,number>){
                let newRankings:(number | undefined)[] = [];
                for(let index = 0;index < rankings.length;index++){
                    newRankings = [...newRankings, valuesMap.get(rankings[index])]
                } 
                const newStringRanks = newRankings.map(ranking => ranking?.toString())
                return newStringRanks
            };

            const oldToNewValuesMap = mapOldToNewValues();
            return produceNewRankings(oldToNewValuesMap);
            
        }

    }
    
    
};
    

const _sanitiseString = function(stringsArray: string[], person:boolean=false){
    let sanitisers = stringsArray.map(val => person ? 
        body(val, `${val} must not be empty.`)
        .trim()
        .isAlpha(undefined, {ignore: ' -'})
        .withMessage(`Characters in the ${val} field must be a word with letters from the alphabet (or it can include a hyphen).`)
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

const _cleanEmptyInputs = function(value: string ){
    return value === '' ? undefined : value 
};

const _validateAge = function(age:string){
     return body(age,'Age must not be empty')
     .trim()
     .isNumeric()
     .withMessage('Age must be a number')

}

export const submitPlayerValidator = () => {
    const requiredValues = ['firstName', 'lastName'];
    return [
    ..._sanitiseString(requiredValues, true),
    body(['goals','assists','speed','strength','attack','defense','goalkeeping','intelligence','technique','team','season','code']).customSanitizer(_cleanEmptyInputs),
    body('team').custom(async function(reference, {req}){
       return (req.body.team && req.body.season) ? await _teamSeasonCheck(reference, req as Request, ['season']).catch(function(err){throw err}) : await Promise.resolve()}) 
    ]
};

export const createTeamValidator = () => {
    return [
    ..._sanitiseString(['name']),
    _validateAge('age'),
    body(['chosenCompetitions','season']).customSanitizer(_cleanEmptyInputs),
    _checkDuplicate(_finderFunctions.duplicateCreateTeam,'name',['season'])
    ]
};

export const updateTeamValidator = () => {
    return [
    ..._sanitiseString(['name']),
    body(['chosenCompetitions','season']).customSanitizer(_cleanEmptyInputs),
    _checkDuplicate(_finderFunctions.duplicateUpdateTeam,'name',['code','season']),
    ]
};


export const createCompetitionValidator = () => {
    return [
    ..._sanitiseString(['name']),
    _checkDuplicate(_finderFunctions.duplicateCreateCompetition,'name',['season']),
    body(['chosenTeams','points','rankings','season']).customSanitizer(_cleanEmptyInputs),
    body('rankings').custom(_uniqueRankings),
    body('rankings').customSanitizer(_sequentialRankings),
    ]
};




export const updateCompetitionValidator = () => {
    return [
    ..._sanitiseString(['name']),
    _checkDuplicate(_finderFunctions.duplicateUpdateCompetition,'name',['code','season']),
    body(['chosenTeams','points','rankings','season']).customSanitizer(_cleanEmptyInputs),
    body('rankings').custom(_uniqueRankings),
    body('rankings').customSanitizer(_sequentialRankings),
    ]
}

