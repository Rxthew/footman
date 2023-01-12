
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { assessCompetitionParameters, competitionParameterPlaceholder } from './helpers/parameters';
import { preFormCreateCompetitionResults, postFormCreateCompetitionResults, postFormUpdateCompetitionResults, queryHelpers, renderers, resultsGenerator, 
seeCompetitionResults, transactionWrapper, validators, preFormUpdateCompetitionResults } from './helpers';
import Competition, { CompetitionModel } from '../models/competition';
import  Team, {TeamModel} from '../models/team';
import { Transaction } from 'sequelize';
import '../models/concerns/_runModels';


const preFormCreateCompetitionRenderer = renderers.preFormCreateCompetition;
const preFormUpdateCompetitionRenderer = renderers.preFormUpdateCompetition;
const seeCompetitionRenderer = renderers.seeCompetition;

const createCompetitionValidator = validators().postFormCreateCompetition;
const updateCompetitionValidator = validators().postFormUpdateCompetition;

let preFormCreateCompetitionResults: preFormCreateCompetitionResults = resultsGenerator().preFormCreateCompetition;
let postFormCreateCompetitionResults: postFormCreateCompetitionResults = resultsGenerator().postFormCreateCompetition;
let preFormUpdateCompetitionResults: preFormUpdateCompetitionResults = resultsGenerator().preFormUpdateCompetition;
let postFormUpdateCompetitionResults: postFormUpdateCompetitionResults = resultsGenerator().postFormUpdateCompetition;
let seeCompetitionResults: seeCompetitionResults = resultsGenerator().seeCompetition;

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
      seeCompetitionResults = resultsGenerator().seeCompetition;
      
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
      preFormCreateCompetitionResults = resultsGenerator().preFormCreateCompetition;
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
            if(postFormCreateCompetitionResults.points){
                  const teamsPoints = postFormCreateCompetitionResults.points;

                  const harmoniseRanking = function(){
                        postFormCreateCompetitionResults.ranking = true;

                        if(postFormCreateCompetitionResults.chosenTeams){
                              let rankedTeams = [...postFormCreateCompetitionResults.chosenTeams];

                              rankedTeams?.sort(function(x,y){
                                    return teamsPoints[x] - teamsPoints[y]
                              });

                              Object.assign(postFormCreateCompetitionResults, {chosenTeams: rankedTeams})
                        }
                        else{
                              const err = new Error('Cannot harmoise ranking because chosen teams are not available')
                              throw err
                        }
                       
                  }

                  const inputPoints = async function(){
                        const teams:any[] = await (latestCompetition as any).getTeams({joinTableAttributes: ['points']},{transaction: t}).catch(function(err:Error){throw err});
                        teams.forEach(team => team['TeamsCompetitions'].set('points', teamsPoints[team.getDataValue('name')]))
                        return

                  }

                  harmoniseRanking();
                  await inputPoints().catch(function(err:Error){throw err})
                 
            }
      };

      const applyRanking = async function(latestCompetition: CompetitionModel){
            if(postFormCreateCompetitionResults.ranking){
                 const chosenTeams = postFormCreateCompetitionResults.chosenTeams

                 const teams:any[] = await (latestCompetition as any).getTeams({joinTableAttributes: ['ranking']},{transaction: t}).catch(function(err:Error){throw err})
                 teams.forEach(team => team['TeamsCompetitions'].set('ranking', chosenTeams?.indexOf(team.getDataValue('name'))))
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

      preFormCreateCompetitionResults = resultsGenerator().preFormCreateCompetition;
      postFormCreateCompetitionResults = resultsGenerator().postFormCreateCompetition;

};

const preFormUpdateCompetitionCb = async function(t:Transaction):Promise<void>{

      const getAllTeams = queryHelpers.getAllTeams;
      const getAllTeamNames = queryHelpers.getAllTeamNames;
      const getSeasons = queryHelpers.getSeasons;

      const results = await getAllTeams(t).catch(function(error:Error){
            throw error
        });

      const competitionTeams = await (Competition as any).getTeams().catch(function(error:Error){
            throw error
      })
      
      const populatePreFormUpdateCompetition = function(){
            if(results){
                  const teamNames = getAllTeamNames(results);
                  if(competitionTeams && competitionTeams.length > 0){
                        const chosen = (competitionTeams as any[]).map(team => team.getDataValue('name'));
                        Object.assign(preFormUpdateCompetitionResults, {chosenTeams: chosen});
                        teamNames.filter(teamName => !chosen.includes(teamName))
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
      preFormUpdateCompetitionResults = resultsGenerator().preFormUpdateCompetition;
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
            if(postFormUpdateCompetitionResults.points){
                  const teamsPoints = postFormUpdateCompetitionResults.points;

                  const harmoniseRanking = function(){
                        postFormUpdateCompetitionResults.ranking = true;

                        if(postFormUpdateCompetitionResults.chosenTeams){
                              let rankedTeams = [...postFormUpdateCompetitionResults.chosenTeams];

                              rankedTeams?.sort(function(x,y){
                                    return teamsPoints[x] - teamsPoints[y]
                              });

                              Object.assign(postFormUpdateCompetitionResults, {chosenTeams: rankedTeams})
                        }
                        else{
                              const err = new Error('Cannot harmoise ranking because chosen teams are not available')
                              throw err
                        }
                       
                  }

                  const inputPoints = async function(){
                        const teams:any[] = await (latestCompetition as any).getTeams({joinTableAttributes: ['points']},{transaction: t}).catch(function(err:Error){throw err});
                        teams.forEach(team => team['TeamsCompetitions'].set('points', teamsPoints[team.getDataValue('name')]))
                        return

                  }

                  harmoniseRanking();
                  await inputPoints().catch(function(err:Error){throw err})
                 
            }
      };

      const applyRanking = async function(latestCompetition: CompetitionModel){
            if(postFormUpdateCompetitionResults.ranking){
                 const chosenTeams = postFormUpdateCompetitionResults.chosenTeams

                 const teams:any[] = await (latestCompetition as any).getTeams({joinTableAttributes: ['ranking']},{transaction: t}).catch(function(err:Error){throw err})
                 teams.forEach(team => team['TeamsCompetitions'].set('ranking', chosenTeams?.indexOf(team.getDataValue('name'))))
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

      preFormUpdateCompetitionResults = resultsGenerator().preFormUpdateCompetition;
      postFormUpdateCompetitionResults = resultsGenerator().postFormUpdateCompetition;

}






  
  