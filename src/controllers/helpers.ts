import { NextFunction, Request, Response } from 'express'
import { body } from 'express-validator'
import { Op, Transaction } from 'sequelize'
import { CompetitionModel } from '../models/competition'
import { sequelize } from '../models/concerns/initdb'
import Competition from '../models/competition'
import { PlayerModel } from '../models/player'
import  Team, { TeamModel } from '../models/team'


interface resultsGeneratorType {
    preFormCreateCompetition: preFormCreateCompetitionResults,
    postFormCreateCompetition: postFormCreateCompetitionResults,  
    preFormUpdateCompetition: preFormUpdateCompetitionResults,
    postFormUpdateCompetition: postFormUpdateCompetitionResults,
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
    ranking?: boolean
    points?: {[index: string]: number}
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
    chosenTeams?: string[],
    ranking?: boolean,
    points?: {[index: string]: number},
    season?: string,
    
}

export interface postFormCreateTeamResults {
    name: string,
    chosenCompetitions?: string[],
    season?: string
}

export interface preFormUpdatePlayerResults extends seePlayerResults, preFormCreatePlayerResults {};
export interface postFormUpdatePlayerResults extends postFormCreatePlayerResults {};
export interface preFormUpdateTeamResults extends preFormCreateTeamResults {
    name: string,
};
export interface postFormUpdateTeamResults extends postFormCreateTeamResults {
    code?: number
};
export interface preFormUpdateCompetitionResults extends preFormCreateCompetitionResults {
    name: string,
};
export interface postFormUpdateCompetitionResults extends postFormCreateCompetitionResults {
    code?: number
};


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

    getDissociatedCompetition: async function(t:Transaction,givenName:string){
        const competitions = Competition.findAll({
            where: {
                name: givenName
            },
            include: [{
                model: Team,
                through: {
                    attributes: ['season']
                }
            }],
            transaction: t
        }).catch(function(error:Error){throw error})

        const dissociated = (await competitions).filter(competition => (competition as any).countTeams() === 0)
        return dissociated.length > 0 ? dissociated[0] : null

    },

    getDissociatedTeam: async function(t:Transaction, givenName: string){
        const teams = await Team.findAll({
            where: {
                name: givenName
            },
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

        const dissociated = teams.filter(team => (team as any).countCompetitions() === 0)
        return dissociated.length > 0 ? dissociated[0] : null

    },

    getCompetitionBySeason: async function(t: Transaction, givenName:string, chosenSeason:string){
        const competition = await Competition.findOne({
            where: {
                name: givenName
            },
            include: [{
                model: Team,
                where: {
                    season: chosenSeason
                }
            }],
            transaction: t
        }).catch(function(error:Error){
            throw error
        })

        return competition

    },

    getTeamBySeason: async function(t:Transaction, givenName: string, chosenSeason: string){
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
            transaction: t

        }).catch(function(error:Error){
            throw error
        })

        return team

    },

    getAllTeamsWithCompetitions : function(results: TeamModel[]){
        const teams = results.filter(team =>  (team as any).countCompetitions() > 0);
        return teams
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

    getSeasons: function(){
        return ['2021/22']
    },

    nextCompetitionTemplate: async function(t:Transaction, givenName:string, season:string){
        const nextCompetition = await this.getCompetitionBySeason(t,givenName,season).catch(function(err:Error){throw err});
        if(nextCompetition){
            return nextCompetition
        }
        const nextDissociatedCompetition = await this.getDissociatedCompetition(t,givenName).catch(function(err:Error){throw err});
        if(nextDissociatedCompetition){
            return nextDissociatedCompetition
        }
        else{
            return await Competition.create({name: givenName}).catch(function(err:Error){throw err});
        }

    },

    nextTeamTemplate: async function(t: Transaction,givenName: string, season: string){
        const nextTeam = await this.getTeamBySeason(t,givenName,season).catch(function(err:Error){throw err});
            if(nextTeam){
                  return nextTeam
            }
            const nextDissociatedTeam = await this.getDissociatedTeam(t,givenName).catch(function(err:Error){throw err});
            if(nextDissociatedTeam){
                  return nextDissociatedTeam
            }
            else{
                  return await Team.create({name: givenName},{transaction:t}).catch(function(err:Error){throw err});
            }

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

    },

    generateAllSeasons: async function(t:Transaction){
        const getAllCompetitions = queryHelpers.getAllCompetitions;
            const getAllTeams = queryHelpers.getAllTeams;
            const seasonsGenerator = this.seasonsGenerator;
            

            const competitions = await getAllCompetitions(t).catch(function(error:Error){
                  throw error
              });
            const teams = await getAllTeams(t).catch(function(error:Error){
                  throw error
              });

            if(competitions || teams){
                  return seasonsGenerator(competitions, teams)
            }
            else{
                  const error = new Error('Query requesting seasons did not return valid data.')
                  throw(error)
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

export const resultsGenerator : () => resultsGeneratorType = function(){
    return {
        preFormCreateCompetition: {
            teams: []
        },
        postFormCreateCompetition: {
            name: ''
        },
        preFormUpdateCompetition: {
            name: '',
            teams: []

        },
        postFormUpdateCompetition: {
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
    }

    const _checkDuplicate = async function(finderFunction:(valuesArray:string[])=>Promise<void>, valuesArray:string[]){
        body(valuesArray).custom(
            finderFunction
        )

    }

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
        
        return team ? Promise.resolve() : Promise.reject('Sorry, there is no team registered with that name for the season you chose. You can either create the team for that season and come back or choose a different team for this player.')


    }

    const _sanitiseString = function(stringsArray: string[]){
        stringsArray.forEach(val => 
            body(val, `${val} must not be empty.`)
            .trim()
            .isLength({min: 2})
            .escape()
        )
    }

    return {
        postFormPlayer: (teamSeason: boolean) => {
            const requiredValues = ['firstName', 'lastName', 'age', 'nationality', 'position']
            _sanitiseString(requiredValues);
            teamSeason ? body(['team','season']).custom(_teamSeasonCheck) : teamSeason
        },
        postFormCreateTeam: () => {
            _sanitiseString(['name'])
            _checkDuplicate(_finderFunctions.duplicateCreateTeam,['name','season'])
        },
        postFormUpdateTeam: () => {
            _sanitiseString(['name'])
            _checkDuplicate(_finderFunctions.duplicateUpdateTeam,['name','season'])
        },
        postFormCreateCompetition: () => {
            _sanitiseString(['name'])
            _checkDuplicate(_finderFunctions.duplicateCreateCompetition,['name','season'])
        },
        postFormUpdateCompetition: () => {
            _sanitiseString(['name'])
            _checkDuplicate(_finderFunctions.duplicateUpdateCompetition,['name','code','season'])
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
