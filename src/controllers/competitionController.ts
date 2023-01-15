
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { assessCompetitionParameters, competitionParameterPlaceholder } from './helpers/parameters';
import * as queryHelpers from './helpers/queries';
import * as renderers  from './helpers/renderers';
import * as resultsGenerator from './helpers/results';
import * as validators from './helpers/validators';
import Competition, { CompetitionModel } from '../models/competition';
import  Team, {TeamModel} from '../models/team';
import { Transaction } from 'sequelize';
import '../models/concerns/_runModels';

const preFormCreateCompetitionRenderer = renderers.preFormCreateCompetition;
const preFormUpdateCompetitionRenderer = renderers.preFormUpdateCompetition;
const seeCompetitionRenderer = renderers.seeCompetition;

const createCompetitionValidator = validators.postFormCreateCompetition;
const updateCompetitionValidator = validators.postFormUpdateCompetition;

let preFormCreateCompetitionResults = resultsGenerator.preFormCreateCompetition();
let postFormCreateCompetitionResults = resultsGenerator.postFormCreateCompetition();
let preFormUpdateCompetitionResults = resultsGenerator.preFormUpdateCompetition();
let postFormUpdateCompetitionResults = resultsGenerator.postFormUpdateCompetition();
let seeCompetitionResults = resultsGenerator.seeCompetition();
const transactionWrapper = queryHelpers.transactionWrapper;

const seeCompetitionCb = async function (t:Transaction): Promise<void>{
      
      const seeCompetitionQuery = async function(){
            const parameters = competitionParameterPlaceholder().parameters; 
            const competition = await Competition.findOne({
                  where: {
                        name: parameters.name,
                        code: parameters.code
                  },
                  transaction: t
                  }).catch(function(error:Error){
                        throw error
                    });
            const teams = await (competition as any)?.getTeams({joinTableAttributes: ['season','points','ranking']}).catch(function(error:Error){
                  throw error
              });
            return {
                  competition,
                  teams,
            }

      };
      const results = await seeCompetitionQuery().catch(function(error:Error){
            throw error
      });
      
      const populateSeeCompetitionResults = function(){
            if(results.competition && results.teams){ 
                  Object.assign(seeCompetitionResults, results.competition.get(), {teams: results.teams.get()});   
            }
            else{
                  const err = new Error('Query regarding competition viewing returned invalid data.');
                  throw err;

            }
      }

      try {
           populateSeeCompetitionResults()
      }
      catch(err){
            console.log(err)
      }
 
      return  
    
  };

export const seeCompetition = async function(req: Request, res: Response, next: NextFunction):Promise<void>{

      assessCompetitionParameters(req,next);
      
      await transactionWrapper(seeCompetitionCb).catch(function(error:Error){
            throw error
        });

      seeCompetitionRenderer(res,seeCompetitionResults);

      competitionParameterPlaceholder().reset();
      seeCompetitionResults = resultsGenerator.seeCompetition();
      
      return 
};

const preFormCreateCompetitionCb = async function(t:Transaction):Promise<void>{

      const getAllTeams = queryHelpers.getAllTeams;
      const getAllTeamNames = queryHelpers.getAllTeamNames;
      const getSeasons = queryHelpers.getSeasons;

      const results = await getAllTeams(t).catch(function(error:Error){
            throw error
        });
      

      const populatePreFormCreateCompetition = function(){
            if(results){
                  const teamNames = getAllTeamNames(results);
                  Object.assign(preFormCreateCompetitionResults,{teams: teamNames}, {seasons: getSeasons()});
            }
            else{
                  const err = new Error('Query regarding competition creation returned invalid data.')
                  throw err

            }  
      }

      try {
            populatePreFormCreateCompetition()
       }
       catch(err){
             console.log(err)
       }
  
       return 
};

export const preFormCreateCompetition = async function(req: Request, res: Response, next: NextFunction):Promise<void>{

      await transactionWrapper(preFormCreateCompetitionCb).catch(function(error:Error){
            throw error
        });
      preFormCreateCompetitionRenderer(res, preFormCreateCompetitionResults);
      preFormCreateCompetitionResults = resultsGenerator.preFormCreateCompetition();
};

const postFormCreateCompetitionCb = async function(t:Transaction){

      const nextTeamTemplate = async function(givenName:string, season:string){
            return queryHelpers.nextTeamTemplate(t,givenName, season)
      }
      

      const getRelevantTeams = async function(){

            let teamPromises:(() => Promise<TeamModel|null>)[] = [];
            const teamNames = postFormCreateCompetitionResults.chosenTeams;
            const chosenSeason = postFormCreateCompetitionResults.season;
            if(teamNames && teamNames.length > 0 && chosenSeason){
                  for(let teamName of teamNames){
                        const nextPromise = async function(){
                              return await nextTeamTemplate(teamName,chosenSeason).catch(function(err:Error){
                                    throw err;
                              })     
                        } 

                  teamPromises = [...teamPromises, nextPromise]
                  }
                  
                  
            }    
            return teamPromises 
      }


      const createDissociatedCompetition = async function(){
            const newCompetition = await Competition.create({...postFormCreateCompetitionResults}, {transaction: t}).catch(function(err:Error){throw err});
            return newCompetition
            
      }

      const createCompetition = async function(){
            const competitionParameters = {...postFormCreateCompetitionResults};
            Object.assign(competitionParameters, {chosenCompetitions: undefined});
            const chosenSeason = postFormCreateCompetitionResults.season;

            const teamPromises = await getRelevantTeams().catch(function(err:Error){
                  throw err;
            });

            if(teamPromises.length === 0){
                  return await createDissociatedCompetition()
            }
             
            const relevantTeams = await Promise.all(teamPromises).catch(function(err:Error){throw err});

            
            const newCompetition = await Competition.create(
                  {...competitionParameters},
                  {transaction: t}
            ).catch(function(err:Error){
                  throw err
            });

            await (newCompetition as any).setTeams(relevantTeams, {transaction: t, through: {season: chosenSeason}}).catch(function(err:Error){
                  throw err
            });

            return newCompetition
      }

      const applyPoints = async function(latestCompetition: CompetitionModel){
            if(postFormCreateCompetitionResults.points && postFormCreateCompetitionResults.chosenTeams){

                  const generateTeamsPoints = function(){
                        let teamsPoints: {[index:string]:number} = {};
                        const chosenTeams = postFormUpdateCompetitionResults.chosenTeams;
                        const chosenPoints = postFormUpdateCompetitionResults.points;
                        if(chosenTeams && chosenPoints){
                              chosenTeams.forEach((team,index)=>{
                                    Object.assign(teamsPoints, {[team]: chosenPoints[index]})
                              })
                            return teamsPoints
                        }
                  };

                  const teamsPoints = generateTeamsPoints()

                  const harmoniseRanking = function(){

                        if(postFormCreateCompetitionResults.chosenTeams && teamsPoints){
                              let rankedTeams = [...postFormCreateCompetitionResults.chosenTeams];

                              rankedTeams?.sort(function(x,y){
                                    return teamsPoints[x] > teamsPoints[y] ? -1 : 1
                              });

                              Object.assign(postFormCreateCompetitionResults, {chosenTeams: rankedTeams})
                        }
                        else{
                              const err = new Error('Cannot harmoise ranking because chosen teams are not available')
                              throw err
                        }
                       
                  }

                  const inputPoints = async function(){
                        if(teamsPoints){
                              const teams:any[] = await (latestCompetition as any).getTeams({joinTableAttributes: ['points']},{transaction: t}).catch(function(err:Error){throw err});
                              teams.forEach(team => team['TeamsCompetitions'].set('points', teamsPoints[team.getDataValue('name')]))
                              return
                        }
                        else{
                              throw Error('Something went wrong when querying chosen teams or their corresponding points. Please check your internet connection and try again.')
                        }
                        

                  };

                  harmoniseRanking();
                  await inputPoints().catch(function(err:Error){throw err})
                 
            }
      };

      const applyRanking = async function(latestCompetition: CompetitionModel){
            if(postFormCreateCompetitionResults.rankings){
                 const chosenTeams = postFormCreateCompetitionResults.chosenTeams
                 if(!postFormCreateCompetitionResults.points && chosenTeams){
                     let rankings = postFormCreateCompetitionResults.rankings;
                     let rankedTeams:string[] = [...chosenTeams];
                     rankedTeams.sort(function(x,y){
                           return rankings[rankedTeams.indexOf(x)] < rankings[rankedTeams.indexOf(y)] ? -1 : 1
                     })
                     Object.assign(postFormCreateCompetitionResults, {chosenTeams: rankedTeams})
                 }
                 const teams:any[] = await (latestCompetition as any).getTeams({joinTableAttributes: ['ranking']},{transaction: t}).catch(function(err:Error){throw err})
                 teams.forEach(team => team['TeamsCompetitions'].set('ranking', chosenTeams?.indexOf(team.getDataValue('name')) ? chosenTeams.indexOf(team.getDataValue('name')) + 1 : null))
            }

      };



      const latestCompetition = await createCompetition().catch(function(err:Error){
            throw err;
      });
      await applyPoints(latestCompetition).catch(function(err:Error){
            throw err;
      });
      await applyRanking(latestCompetition).catch(function(err:Error){
            throw err;
      });

};

export const postFormCreateCompetition = async function(req:Request, res:Response, next:NextFunction):Promise<void>{

      const goToCompetitionPage = async function(){
            try{
            const latestCode = await Competition.max('code').catch(function(error:Error){
                  throw error
              });
            const competitionName = postFormCreateCompetitionResults.name;
            
            res.redirect(`/competition/${competitionName}_${latestCode}`)
            }
            catch(err){
                  if(err){
                        console.log(err)
                        return next(err)
                  }
            }
      }
                
      createCompetitionValidator();
      const errors = validationResult(req);

      if(!errors.isEmpty()){
            await transactionWrapper(preFormCreateCompetitionCb).catch(function(error:Error){
                  throw error
              });
            Object.assign(preFormCreateCompetitionResults, {errors: errors.mapped()},  {chosenTeams: req.body.chosenCompetitions});
            preFormCreateCompetitionRenderer(res, preFormCreateCompetitionResults);
      }
      else{
            Object.assign(postFormCreateCompetitionResults, req.body);
            await transactionWrapper(postFormCreateCompetitionCb).catch(function(error:Error){
                  throw error
              });
            await goToCompetitionPage().catch(function(error:Error){
                  throw error
              }) 
            
      }

      preFormCreateCompetitionResults = resultsGenerator.preFormCreateCompetition();
      postFormCreateCompetitionResults = resultsGenerator.postFormCreateCompetition();

};

const preFormUpdateCompetitionCb = async function(t:Transaction):Promise<void>{

      const getAllTeams = queryHelpers.getAllTeams;
      const getAllTeamNames = queryHelpers.getAllTeamNames;
      const getSeasons = queryHelpers.getSeasons;

      const results = await getAllTeams(t).catch(function(error:Error){
            throw error
        });

      const competitionTeams = await (Competition as any).getTeams({joinTableAttributes: ['season, ranking, points']}).catch(function(error:Error){
            throw error
      });

      const getChosenTeams = function():string[] | undefined{
            if(competitionTeams && competitionTeams.length > 0){
                  return (competitionTeams as any[]).map(team => team.getDataValue('name'));
            }
      };

      const getSeason = function():string | undefined{
            if(competitionTeams && competitionTeams.length > 0){
                  return competitionTeams[0]['TeamsCompetitions'].get('season') ? competitionTeams[0]['TeamsCompetitions'].getDataValue('season') : undefined
            }
      };

      const getRankings = function():number[] | undefined{
            if(competitionTeams && competitionTeams.length > 0){
                  const rankings = (competitionTeams as any[]).map(team => team['TeamsCompetitions'].getDataValue('ranking'));
                  return rankings.some(rank => rank === null || rank === undefined) ? undefined : rankings
            }

      };

      const getPoints = function():number[] | undefined{
            if(competitionTeams && competitionTeams.length > 0){
                  const points = (competitionTeams as any[]).map(team => team['TeamsCompetitions'].getDataValue('points'));
                  return points.some(value => value === null || value === undefined) ? undefined : points;
            }

      };

      const populatePreFormUpdateCompetition = function(){
            if(results){
                  const teamNames = getAllTeamNames(results);
                  if(competitionTeams && competitionTeams.length > 0){
                        const chosen = getChosenTeams();
                        Object.assign(preFormUpdateCompetitionResults, {chosenTeams: chosen}, {season: getSeason()}, {rankings: getRankings()}, {points: getPoints()});
                        if(chosen){
                              teamNames.filter(teamName => !chosen.includes(teamName))
                        }
                        
                  }
                  Object.assign(preFormUpdateCompetitionResults,{teams: teamNames}, {seasons: getSeasons()});
            }
            else{
                  const err = new Error('Query regarding competition update returned invalid data.')
                  throw err

            }  
      }

      try {
            populatePreFormUpdateCompetition()
       }
       catch(err){
             console.log(err)
       }
  
       return 

};

export const preFormUpdateCompetition = async function(req:Request, res:Response, next:NextFunction):Promise<void>{
      assessCompetitionParameters(req,next);

      await transactionWrapper(preFormUpdateCompetitionCb).catch(function(error:Error){throw error});
      preFormUpdateCompetitionRenderer(res,preFormUpdateCompetitionResults);

      competitionParameterPlaceholder().reset();
      preFormUpdateCompetitionResults = resultsGenerator.preFormUpdateCompetition();
};


const postFormUpdateCompetitionCb = async function(t:Transaction):Promise<void>{


      const nextTeamTemplate = async function(givenName:string, season:string){
            return queryHelpers.nextTeamTemplate(t,givenName, season)
      }
      

      const getRelevantTeams = async function(){

            let teamPromises:(() => Promise<TeamModel|null>)[] = [];
            const teamNames = postFormUpdateCompetitionResults.chosenTeams;
            const chosenSeason = postFormUpdateCompetitionResults.season;
            if(teamNames && teamNames.length > 0 && chosenSeason){
                  for(let teamName of teamNames){
                        const nextPromise = async function(){
                              return await nextTeamTemplate(teamName,chosenSeason).catch(function(err:Error){
                                    throw err;
                              })     
                        } 

                  teamPromises = [...teamPromises, nextPromise]
                  }
                  
                  
            }    
            return teamPromises 
      }


      const updateCompetition = async function(){

            const competitionParameters = {...postFormUpdateCompetitionResults};
            Object.assign(competitionParameters, {chosenCompetitions: undefined});

            const chosenSeason = postFormUpdateCompetitionResults.season;

            const teamPromises = await getRelevantTeams().catch(function(err:Error){
                  throw err;
            });

            const relevantTeams = teamPromises.length > 0 ?  await Promise.all(teamPromises).catch(function(err:Error){throw err}) : teamPromises;

            const updatedCompetition = await Competition.findOne({
                  where: {
                        name: competitionParameters.name,
                        code: competitionParameters.code
                  },
                  include: [{
                        model: Team
                  }],
                  transaction: t
            }).catch(function(err:Error){
                  throw err
            })

            updatedCompetition?.set({...competitionParameters});

            if(postFormUpdateCompetitionResults.chosenTeams && postFormUpdateCompetitionResults.season){
                  await (updatedCompetition as any).setTeams(relevantTeams, {transaction: t, through: {season: chosenSeason}}).catch(function(err:Error){
                        throw err
                  });      
            }

            await updatedCompetition?.save().catch(function(err:Error){
                  throw err
            });

            return updatedCompetition

      }
            
      const applyPoints = async function(latestCompetition: CompetitionModel){
            if(postFormUpdateCompetitionResults.points && postFormUpdateCompetitionResults.chosenTeams){
                  
                  const generateTeamsPoints = function(){
                        let teamsPoints: {[index:string]:number} = {};
                        const chosenTeams = postFormUpdateCompetitionResults.chosenTeams;
                        const chosenPoints = postFormUpdateCompetitionResults.points;
                        if(chosenTeams && chosenPoints){
                              chosenTeams.forEach((team,index)=>{
                                    Object.assign(teamsPoints, {[team]: chosenPoints[index]})
                              })
                            return teamsPoints
                        }
                  };

                  const teamsPoints = generateTeamsPoints();

                  const harmoniseRanking = function(){
                        if(postFormUpdateCompetitionResults.chosenTeams && teamsPoints){
                              let rankedTeams = [...postFormUpdateCompetitionResults.chosenTeams];

                              rankedTeams?.sort(function(x,y){
                                    return teamsPoints[x] > teamsPoints[y] ? -1 : 1
                              });

                              Object.assign(postFormUpdateCompetitionResults, {chosenTeams: rankedTeams})
                        }
                        else{
                              const err = new Error('Cannot harmoise ranking because chosen teams are not available')
                              throw err
                        }
                       
                  };

                  const inputPoints = async function(){
                        if(teamsPoints){
                              const teams:any[] = await (latestCompetition as any).getTeams({joinTableAttributes: ['points']},{transaction: t}).catch(function(err:Error){throw err});
                              teams.forEach(team => team['TeamsCompetitions'].set('points', teamsPoints[team.getDataValue('name')]))
                              return
                        }
                        else{
                              throw Error('Something went wrong when querying chosen teams or their corresponding points. Please check your internet connection and try again.')
                        }
                        

                  };

                  harmoniseRanking();
                  await inputPoints().catch(function(err:Error){throw err})
                 
            }
      };

      const applyRanking = async function(latestCompetition: CompetitionModel){
            if(postFormUpdateCompetitionResults.rankings){
                 const chosenTeams = postFormUpdateCompetitionResults.chosenTeams
                 if(!postFormUpdateCompetitionResults.points && chosenTeams){
                  const rankings = postFormUpdateCompetitionResults.rankings;
                  let rankedTeams:string[] = [...chosenTeams];
                  rankedTeams.sort(function(x,y){
                        return rankings[rankedTeams.indexOf(x)] < rankings[rankedTeams.indexOf(y)] ? -1 : 1
                  })
                  Object.assign(postFormUpdateCompetitionResults, {chosenTeams: rankedTeams})
              }

                 const teams:any[] = await (latestCompetition as any).getTeams({joinTableAttributes: ['ranking']},{transaction: t}).catch(function(err:Error){throw err})
                 teams.forEach(team => team['TeamsCompetitions'].set('ranking', chosenTeams?.indexOf(team.getDataValue('name')) ? chosenTeams.indexOf(team.getDataValue('name')) + 1 : null))
            }

      };

      const latestCompetition = await updateCompetition().catch(function(err:Error){
            throw err;
      });
      latestCompetition ? await applyPoints(latestCompetition).catch(function(err:Error){
            throw err;
      }) : false;
      latestCompetition ? await applyRanking(latestCompetition).catch(function(err:Error){
            throw err;
      }): false;

};

export const postFormUpdateCompetition = async function(req:Request,res:Response,next:NextFunction):Promise<void>{

      postFormUpdateCompetitionResults.season ? Object.assign(postFormUpdateCompetitionResults, {code: req.params.code}) : false;
      updateCompetitionValidator();
      const errors = validationResult(req);

      if(!errors.isEmpty()){

            await transactionWrapper(preFormUpdateCompetitionCb).catch(function(err){
                  throw err
            });
            Object.assign(preFormUpdateCompetitionResults, req.body, {errors: errors.mapped()});
            preFormUpdateCompetitionRenderer(res,preFormUpdateCompetitionResults);       

      }
      else{
            Object.assign(postFormUpdateCompetitionResults, req.body);
            await transactionWrapper(postFormUpdateCompetitionCb).catch(function(error:Error){
                  throw error
              });
            const [name,code] = [postFormUpdateCompetitionResults.name, req.params.code];
            res.redirect(`/team/${name}_${code}`);

      }

      preFormUpdateCompetitionResults = resultsGenerator.preFormUpdateCompetition();
      postFormUpdateCompetitionResults = resultsGenerator.postFormUpdateCompetition();

}






  
  