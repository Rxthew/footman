import { Transaction } from 'sequelize'
import Competition, { CompetitionModel } from '../../models/competition';
import { sequelize } from '../../models/concerns/initdb';
import Team, { TeamModel } from '../../models/team';



export const getAllCompetitionNames = function(results: CompetitionModel[]){
    const names = results.filter(competition => competition.getDataValue('name'))
    const uniqueNames = Array.from(new Set(names))
    return uniqueNames

};

export const getAllCompetitions = async function(t:Transaction){
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
        

};

export const getAllSeasons = function(results: TeamModel[] | CompetitionModel[], input: 'team' | 'competition'){

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
    
};

 export const getAllTeamNames = function(results: TeamModel[]){
    const names = results.map(team => team.getDataValue('name'))
    const uniqueNames = Array.from(new Set(names))
    return uniqueNames
};

 export const  getAllTeams = async function(t:Transaction){
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
};

 export const getAllTeamsWithCompetitions = function(results: TeamModel[]){
    const teams = results.filter(team =>  (team as any).countCompetitions() > 0);
    return teams
};

 export const getCompetitionBySeason = async function(t: Transaction, givenName:string, chosenSeason:string){
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

};

export const getCompetitionSeason = function(competitionTeams:TeamModel[]):string | undefined{
    if(competitionTeams && competitionTeams.length > 0){
          return (competitionTeams as any)[0]['TeamsCompetitions'].get('season') ? (competitionTeams as any)[0]['TeamsCompetitions'].getDataValue('season') : undefined
    }
};


export const getDissociatedCompetition = async function(t:Transaction,givenName:string){
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

};

export const getDissociatedTeam = async function(t:Transaction, givenName: string){
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

};

export const getPoints = function(competitionTeams:TeamModel[]):number[] | undefined{
    if(competitionTeams && competitionTeams.length > 0){
          const points = (competitionTeams as any[]).map(team => team['TeamsCompetitions'].getDataValue('points'));
          return points.some(value => value === null || value === undefined) ? undefined : points;
    }

};

export const getRankings = function(competitionTeams:TeamModel[]):number[] | undefined{
    if(competitionTeams && competitionTeams.length > 0){
          const rankings = (competitionTeams as any[]).map(team => team['TeamsCompetitions'].getDataValue('ranking'));
          return rankings.some(rank => rank === null || rank === undefined) ? undefined : rankings
    }

};


export const getTeamBySeason = async function(t:Transaction, givenName: string, chosenSeason: string){
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

};


export const getSeasons = function(){
        return ['2021/22']
};

export const nextCompetitionTemplate = async function(t:Transaction, givenName:string, season:string){
        const nextCompetition = await getCompetitionBySeason(t,givenName,season).catch(function(err:Error){throw err});
        if(nextCompetition){
            return nextCompetition
        }
        const nextDissociatedCompetition = await getDissociatedCompetition(t,givenName).catch(function(err:Error){throw err});
        if(nextDissociatedCompetition){
            return nextDissociatedCompetition
        }
        else{
            return await Competition.create({name: givenName}).catch(function(err:Error){throw err});
        }

};

export const  nextTeamTemplate = async function(t: Transaction,givenName: string, season: string){
        const nextTeam = await getTeamBySeason(t,givenName,season).catch(function(err:Error){throw err});
            if(nextTeam){
                    return nextTeam
            }
            const nextDissociatedTeam = await getDissociatedTeam(t,givenName).catch(function(err:Error){throw err});
            if(nextDissociatedTeam){
                    return nextDissociatedTeam
            }
            else{
                    return await Team.create({name: givenName},{transaction:t}).catch(function(err:Error){throw err});
            }

};


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