import { Transaction } from 'sequelize'
import Competition, { CompetitionModel } from '../../models/competition';
import { sequelize } from '../../models/concerns/initdb';
import Team, { TeamModel } from '../../models/team';


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