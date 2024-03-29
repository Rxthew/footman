/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction } from 'express';
import { Transaction } from 'sequelize'
import Competition, { CompetitionModel } from '../../models/competition';
import { sequelize } from '../../models/concerns/initdb';
import Player, { PlayerModel } from '../../models/player';
import Team, { TeamModel } from '../../models/team';
import { postFormCreateCompetitionResults, postFormUpdateCompetitionResults } from './results';


export const applyPoints = async function(latestCompetition: CompetitionModel, results: postFormCreateCompetitionResults | postFormUpdateCompetitionResults, t: Transaction){
    if(results.chosenTeams && Array.isArray(results.chosenTeams) && results.chosenTeams.length > 0){
          
          const generateTeamsPoints = function(){
                if(results.points){
                    const teamsPoints: {[index:string]:number} = {};
                    const chosenTeams = results.chosenTeams;
                    const chosenPoints = results.points;
                    if(chosenTeams){
                        chosenTeams.forEach((team,index)=>{
                                Object.assign(teamsPoints, {[team]: chosenPoints[index]})
                        })
                        return teamsPoints
                    }
                }
                return
                
          };

          let teamsPoints = generateTeamsPoints();

          const harmoniseRanking = function(){
                if(results.chosenTeams && teamsPoints && results.rankings && results.points){
                     
                      const rankedTeams = [...results.chosenTeams];

                        rankedTeams?.sort(function(x,y){
                            if(teamsPoints){
                                return teamsPoints[x] > teamsPoints[y] ? -1 : 1
                            }
                            return -1            
                      })

                      const newRankings = [...results.rankings];
                      newRankings.sort(function(x,y){
                        return x > y ? 1 : -1
                  });
                      

                      const newPoints = [...results.points];
    
                      newPoints?.sort(function(x,y){
                            return x > y ? -1 : 1
                      });
                      

                      Object.assign(results, {chosenTeams: rankedTeams}, {rankings: newRankings}, {points: newPoints});
                      teamsPoints = generateTeamsPoints();
                }
                return
               
          };

          const updateTeamsCompetitions = async function(team:any,teamPoints:{[index:string]:number} | undefined){
                const teamName = team.getDataValue('name');
                const teamsCompetitions = team.getDataValue('TeamsCompetitions');
                const points = teamPoints ? teamPoints[teamName] : null;
                teamsCompetitions.set('points',points);

                await teamsCompetitions.save({transaction: t}).catch(function(err:Error){throw err})
                return
          };

          const inputPoints = async function(){
               const teams:any[] = await (latestCompetition as any).getTeams({transaction: t}).catch(function(err:Error){throw err});
                let updatePromises:any[] = [];      
                teams.forEach( (team) => updatePromises = [ ...updatePromises, async() => await updateTeamsCompetitions(team, teamsPoints) ])
                updatePromises.length > 0 ? await Promise.all(updatePromises.map(updateTeam => updateTeam())).catch(function(err:Error){throw err}) : updatePromises
          };

          
          harmoniseRanking();
          await inputPoints().catch(function(err:Error){throw err})
         
    }
};

export const applyRanking = async function(latestCompetition: CompetitionModel, results: postFormCreateCompetitionResults | postFormUpdateCompetitionResults, t: Transaction){

    const updateTeamsCompetitions = async function(team: any, chosenArray:string[] | undefined){

        const _rankSetter = function(teamName: string){

            const _validIndex = function(index:number){
                return index > -1 ? index + 1 : null
    
            }
            if(chosenArray && Array.isArray(chosenArray) && results.rankings){
                const index = chosenArray.indexOf(teamName);
                const rank = _validIndex(index);
                return rank
            }
            return null
        }


        const teamsCompetitions = team.getDataValue('TeamsCompetitions');
        const teamName = team.getDataValue('name');
        teamsCompetitions.set('ranking',_rankSetter(teamName));

        await teamsCompetitions.save({transaction: t}).catch(function(err:Error){throw err});

    };

    const updateRankings = async function(){ 
        let chosenTeams = results.chosenTeams
        if(results.rankings && chosenTeams){
            const rankings = results.rankings;
            const rankedTeams:string[] = [...chosenTeams];
            rankedTeams.sort(function(x,y){
                    return rankings[rankedTeams.indexOf(x)] < rankings[rankedTeams.indexOf(y)] ? -1 : 1
            });
            Object.assign(results, {chosenTeams: rankedTeams});
            chosenTeams = results.chosenTeams;
        }
        const teams:any[] = await (latestCompetition as any).getTeams({transaction: t}).catch(function(err:Error){throw err})
        let updatePromises:any[] = []
        teams.length > 0 ? teams.forEach((team) => updatePromises = [...updatePromises, async () => await updateTeamsCompetitions(team,chosenTeams).catch(function(err:Error){throw err})]) : teams
        updatePromises.length > 0 ? await Promise.all(updatePromises.map(updateTeam => updateTeam())).catch(function(err:Error){throw err}) : updatePromises

        
         
    };

    await updateRankings().catch(function(err:Error){throw err})


};


export const getAllCompetitionNames = function(results: CompetitionModel[]){
    if(results && results.length > 0){
        const names =  results.map(competition => competition.getDataValue('name')) 
        const uniqueNames =  Array.from(new Set(names))
        return uniqueNames
    }
    return []
    

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

export const getAllCompetitionUrlParams = function(results: CompetitionModel[], params: ('name' | 'code' )[]){
    if(results && results.length > 0){
        try{
            const generateCompetitionUrl = function(competition:CompetitionModel){
                const values = params.map(param => competition.getDataValue(param)?.toString());

                if(values.some(value => value === 'undefined' || value === 'null' || value === 'NaN')){
                    throw Error('Something went wrong when fetching querying details for competition links.')
                }

                let url = '';
                values.forEach(value => value ? url = url.concat('.',value) : value);
                url = url.slice(1,);
                
                return url
            }
    
            const urls = results.map(competition => generateCompetitionUrl(competition)).filter(obj => obj !== undefined)
            return urls

        }
        catch(err){
            console.log(err);
            throw err
        }
        
    }
    return []
};

export const getAllDissociatedCompetitions = async function(t:Transaction){
    const competitions = await Competition.findAll({
        include: [{
            model: Team,
            through: {
                attributes: ['season']
            }
        }],
        transaction: t
    }).catch(function(error:Error){throw error})

    const competitionPromises = competitions && competitions.length > 0 ? competitions.map(competition => async() => {return await (competition as any).countTeams({transaction: t})}) : []
    const teamsCount = competitionPromises.length > 0 ? await Promise.all(competitionPromises.map(promise => promise())).catch((err:Error)=> {throw err}) : competitionPromises 

    const dissociated =  competitions.filter((c,index) => teamsCount[index] === 0)
    return dissociated

};

export const getAllDissociatedPlayers = async function(t:Transaction){
    const players = await Player.findAll({
        include: [{
            model: Team
        }],
        transaction: t
    }).catch(function(error:Error){throw error})

    const playerPromises = players && players.length > 0 ? players.map(player => async() => {return await (player as any).getTeam({transaction: t})}) : [];
    const playersAssociationStatus = playerPromises.length > 0 ? await Promise.all(playerPromises.map(promise => promise())).catch((err:Error)=> {throw err}) : playerPromises;

    const dissociated =  players.filter((c,index) => playersAssociationStatus[index] === null);
    return dissociated

};



export const getAllDissociatedTeams = async function(t:Transaction){
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

    const teamPromises = teams && teams.length > 0 ? teams.map(team => async()=>{return await (team as any).countCompetitions({transaction: t})}) : [];
    const competitionsCount = teamPromises.length > 0 ? await Promise.all(teamPromises.map(promise => promise())).catch((err:Error)=> {throw err}) : teamPromises

    const dissociated = teams.filter((t,index)=> competitionsCount[index] === 0)
    return dissociated

};


export const getAllPlayerUrlParams = function(results: PlayerModel[], params: ('firstName' | 'lastName' | 'code' )[]){

    if(results && results.length > 0){
        try{
            const generatePlayerUrl = function(player:PlayerModel){
                const values = params.map(param => player.getDataValue(param)?.toString());

                if(values.some(value => value === 'undefined' || value === 'null' || value === 'NaN')){
                    throw Error('Something went wrong when fetching querying details for player links.')
                }

                let url = '';
                values.forEach(value => value ? url = url.concat('.',value) : value);
                url = url.slice(1,);
                
                return url
            }
    
            const urls = results.map(player => generatePlayerUrl(player)).filter(obj => obj !== undefined)
            return urls

        }
        catch(err){
            console.log(err);
            throw err
        }
        
    }
    return []
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
        const competitions =  res && res.length > 0 ? res.map(team => team.competitions).flat() : res; 
        const seasons = competitions && competitions.length > 0 ? (competitions as any[]).map(competition => competition['TeamsCompetitions'].get('season')) : competitions; 
        const uniqueSeasons = seasons ? Array.from(new Set(seasons)) : [];
        return orderSeasons(uniqueSeasons)
    }

    const getThroughCompetitions = function(res: CompetitionModel[]){
        const teams = res && res.length > 0 ? res.map(comp => comp.teams).flat() : res; 
        const seasons = teams && teams.length > 0 ? (teams as any[]).map(team => team['TeamsCompetitions'].get('season')): teams; 
        const uniqueSeasons = seasons ? Array.from(new Set(seasons)) : [];
        return orderSeasons(uniqueSeasons)
    }

    switch(input){
        case 'team': return getThroughTeams(results as TeamModel[]);
        case 'competition': return getThroughCompetitions(results as CompetitionModel[]);
    }
    
};

 export const getAllTeamNames = function(results: TeamModel[]){
    if(results && results.length > 0){
        const names = results.map(team => team.getDataValue('name'));
        const uniqueNames = Array.from(new Set(names));
        return uniqueNames
    }
    return []
    
};

export const getAllTeamUrlParams = function(results: TeamModel[], params: ('name' | 'code' )[]){
    if(results && results.length > 0){
        try{
            const generateTeamUrl = function(team:TeamModel){
                const values = params.map(param => team.getDataValue(param)?.toString());
                if(values.some(value => value === 'undefined' || value === 'null' || value === 'NaN')){
                    throw Error('Something went wrong when fetching querying details for team links.')
                }

                let url = '';
                values.forEach(value => value ? url = url.concat('.',value) : value)
                url = url.slice(1,)
                
                return url
            }
    
            const urls = results.map(team => generateTeamUrl(team)).filter(obj => obj !== undefined)
            return urls

        }
        catch(err){
            console.log(err);
            throw err
        }
        
    }
    return []
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

 export const getAllTeamsWithCompetitions = async function(t:Transaction,results: TeamModel[]){
    if(results && results.length > 0){
        const teamPromises = results.map(team => {return async() => await (team as any).countCompetitions({transaction: t})})
        const competitionCounts = await Promise.all(teamPromises.map(promise => promise())).catch((err:Error)=>{throw err})
        const teams = results.filter((t,index) => competitionCounts[index] > 0);
        return teams
    }
    return []
    
};

 export const getCompetitionBySeason = async function(t: Transaction, givenName:string, chosenSeason:string){
    const competition = await Competition.findOne({
        where: {
            name: givenName
        },
        include: [{
            model: Team,
            required: true,
            through: {
                where: {
                    season: chosenSeason
                }
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
        const competitions = await Competition.findAll({
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

            const competitionPromises = competitions && competitions.length > 0 ? competitions.map(competition => async() => {return await (competition as any).countTeams({transaction: t})}) : []
            const teamsCount = competitionPromises.length > 0 ? await Promise.all(competitionPromises.map(promise => promise())).catch((err:Error)=> {throw err}) : competitionPromises 

        const dissociated =  competitions.filter((c,index) => teamsCount[index] === 0)
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

        const teamPromises = teams && teams.length > 0 ? teams.map(team => async()=>{return await (team as any).countCompetitions({transaction: t})}) : [];
        const competitionsCount = teamPromises.length > 0 ? await Promise.all(teamPromises.map(promise => promise())).catch((err:Error)=> {throw err}) : teamPromises

        const dissociated = teams.filter((t,index)=> competitionsCount[index] === 0)
        return dissociated.length > 0 ? dissociated[0] : null

};

export const getFeaturedCompetitionUrls = async function(t:Transaction, competitionNames: string[]){
    const seasons = getSeasons();
    const latestSeason = seasons[seasons.length - 1];

    const competitionPromises = competitionNames.map(name => async () => await getCompetitionBySeason(t,name,latestSeason).catch((err:Error) => {throw err}));
    const competitions = await Promise.all(competitionPromises.map(competitionPromise => competitionPromise())).catch((err:Error) => {throw err});
    const urls = competitions.some(comp => comp === null) ? [] : getAllCompetitionUrlParams(competitions as CompetitionModel[], ['name','code'])
    return urls

};

export const getFeaturedPlayerUrls = async function(t:Transaction, playerNames: string[][]){
    const seasons = getSeasons();
    const latestSeason = seasons[seasons.length - 1];

    const playerPromises = playerNames.map(names => async () => await getPlayerBySeason(t,names[0],names[1],latestSeason).catch((err:Error) => {throw err}));
    const players = await Promise.all(playerPromises.map(playerPromise => playerPromise().catch((err:Error) => {throw err})));
    const urls = players.some(player => player === null) ? [] : getAllPlayerUrlParams(players as PlayerModel[], ['firstName','lastName','code']);
    return urls

};

export const getFeaturedTeamUrls = async function(t:Transaction, teamNames: string[]){
    const seasons = getSeasons();
    const latestSeason = seasons[seasons.length - 1];

    const teamPromises  = teamNames.map(name => async () => await getTeamBySeason(t,name,latestSeason).catch((err:Error) => {throw err}));
    const teams = await Promise.all(teamPromises.map(teamPromise => teamPromise().catch((err:Error) => {throw err})));
    const urls = teams.some(team => team === null) ? [] : getAllTeamUrlParams(teams as TeamModel[], ['name','code'])
    return urls

};

export const getPlayerBySeason = async function(t:Transaction, givenFirstName: string, givenLastName: string, chosenSeason: string){
    const player = await Player.findOne({
        where: {
            firstName: givenFirstName,
            lastName: givenLastName
        },
        include: [{
            model: Team,
            required: true,
            include: [{
                model: Competition,
                required: true,
                through: {
                    where: {
                        season: chosenSeason
                    }
                }
                
            }]
        }],
        transaction: t
    }).catch((err:Error)=> {throw err});

    return player
    
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
                required: true,
                through: {
                    where: {
                        season: chosenSeason
                }            
            }
            }],
            transaction: t

        }).catch(function(error:Error){
            throw error
        })

        return team

};


export const getSeasons = function(){
        return ['2020/21','2021/22']
};

export const getTeamSeason = function(teamsCompetitions:CompetitionModel[]):string | undefined{
    if(teamsCompetitions && teamsCompetitions.length > 0){
          return (teamsCompetitions as any)[0]['TeamsCompetitions'].get('season') ? (teamsCompetitions as any)[0]['TeamsCompetitions'].getDataValue('season') : undefined
    }
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


 export const transactionWrapper = async function(callback: (t:Transaction) => Promise<void>, next:NextFunction){
    try {
         await sequelize.transaction(callback).catch(function(error:Error){
            throw error
        })
        
    }
    catch (error){
        next(error)
        console.log(error)
        
    }

}