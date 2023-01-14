import { body } from 'express-validator';
import { Op } from 'sequelize';
import  Competition  from '../../models/competition';
import  Team  from '../../models/team';


const _finderFunctions = {
    duplicateCreateCompetition: async function(valuesArray:string[]){
        const [chosenName, chosenSeason] = valuesArray;
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
    duplicateUpdateCompetition: async function(valuesArray: string[]){
        const [chosenName,code,chosenSeason] = valuesArray;
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

    duplicateCreateTeam: async function(valuesArray: string[]){
        const [chosenName, chosenSeason] = valuesArray;
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

    duplicateUpdateTeam: async function(valuesArray: string[]){
        const [chosenName,code,chosenSeason] = valuesArray;
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


const _checkDuplicate = async function(finderFunction:(valuesArray:string[])=>Promise<void>, valuesArray:string[]){
    body(valuesArray).custom(
        finderFunction
    )

};

const _teamSeasonCheck = async function(valuesArray: string[]){
    const [givenName, chosenSeason] = valuesArray;
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
    
    return team ? Promise.resolve() : Promise.reject('Sorry, there is no team registered w//ith that name for the season you chose.'+
     ' You can either create the team for that season and come back or choose a different team for this player.')

};

const _uniqueRankings = function(valuesArray: string[]){ 
    body(valuesArray).custom(function(){
        const rankings = valuesArray.map(value => parseInt(value));
        const unique = Array.from(new Set(rankings));
        if(rankings.length !== unique.length){
            throw new Error('There appear to be duplicate rankings. Please choose unique rankings only.')
        }
        return true
    })
};

const _sequentialRankings = function(valuesArray: string[]){
    body(valuesArray).customSanitizer(function(){
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
        
    })
};
    

const _sanitiseString = function(stringsArray: string[]){
    stringsArray.forEach(val => 
        body(val, `${val} must not be empty.`)
        .trim()
        .isLength({min: 2})
        .escape()
    )
};

export const postFormPlayer = (teamSeason: boolean) => {
    const requiredValues = ['firstName', 'lastName', 'age', 'nationality', 'position'];
    _sanitiseString(requiredValues);
    teamSeason ? body(['team','season']).custom(_teamSeasonCheck) : teamSeason;
};

export const postFormCreateTeam = () => {
    _sanitiseString(['name']);
    _checkDuplicate(_finderFunctions.duplicateCreateTeam,['name','season']);
};

export const postFormUpdateTeam = () => {
    _sanitiseString(['name']);
    _checkDuplicate(_finderFunctions.duplicateUpdateTeam,['name','season']);
};

export const postFormCreateCompetition = () => {
    _sanitiseString(['name']);
    _checkDuplicate(_finderFunctions.duplicateCreateCompetition,['name','season']);
    _uniqueRankings(['rankings']);
    _sequentialRankings(['rankings']);
};

export const postFormUpdateCompetition = () => {
    _sanitiseString(['name']);
    _checkDuplicate(_finderFunctions.duplicateUpdateCompetition,['name','code','season']);
    _uniqueRankings(['rankings']);
    _sequentialRankings(['rankings']);
}
