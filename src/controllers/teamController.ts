
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { attributesPlaceholders, postFormCreateTeamResults, preFormCreateTeamResults, preFormUpdateTeamResults, postFormUpdateTeamResults, queryHelpers, renderers, resetPlaceholderAttributes, resultsGenerator, 
seeTeamResults, syncAttributes, transactionWrapper, validators } from './helpers';
import  Team from '../models/team';
import { Transaction } from 'sequelize';
import '../models/concerns/_runModels';
import Competition, { CompetitionModel } from '../models/competition';


let seeTeamAttributes = function(){
      const resetSeeTeam = resetPlaceholderAttributes(attributesPlaceholders.seeTeam)
      return {
            seeTeam: attributesPlaceholders.seeTeam,
            reset: resetSeeTeam
      }
};

const preFormCreateTeamRenderer = renderers.preFormCreateTeam;
const preFormUpdateTeamRenderer = renderers.preFormUpdateTeam;
const seeTeamRenderer = renderers.seeTeam;

const submitTeamValidator = validators().postFormTeam;


let preFormCreateTeamResults:preFormCreateTeamResults = resultsGenerator().preFormCreateTeam;
let postFormCreateTeamResults: postFormCreateTeamResults = resultsGenerator().postFormCreateTeam;
let preFormUpdateTeamResults: preFormUpdateTeamResults = resultsGenerator().preFormUpdateTeam;
let postFormUpdateTeamResults: postFormUpdateTeamResults = resultsGenerator().postFormUpdateTeam;
let seeTeamResults: seeTeamResults = resultsGenerator().seeTeam;

const seeTeamCb = async function (t:Transaction): Promise<void>{
      
      const seeTeamQuery = async function(){ 
            const attributes = seeTeamAttributes().seeTeam
            const team = await Team.findOne({
                  where: {
                        name: attributes.name,
                        code: attributes.code
                  },
                  transaction: t
                  }).catch(function(error:Error){
                        throw error
                    });
            const players = await (team as any)?.getPlayers().catch(function(error:Error){
                  throw error
              }) 
            const competitions = await (team as any)?.getCompetitions({joinTableAttributes: ['season','points','ranking']}).catch(function(error:Error){
                  throw error
              })
            return {
                  team,
                  players,
                  competitions,
            }

      }
      const results = await seeTeamQuery().catch(function(error:Error){
            throw error
        })
      
      const populateSeeTeamResults = function(){
            if(results.team && results.players && results.competitions ){ 
                  Object.assign(seeTeamResults, results.team.get(), {players: results.players.get()}, {competitions: results.competitions.get()});   
            }
            else{
                  const err = new Error('Query returned invalid data.')
                  throw err

            }
      }

      try {
           populateSeeTeamResults()
      }
      catch(err){
            console.log(err)
      }
 
      return  
    
  };

export const seeTeam = async function(req: Request, res: Response, next: NextFunction){

      const attributes = syncAttributes();
      attributes.getSeeTeamAttributes(req,next);
      
      await transactionWrapper(seeTeamCb).catch(function(error:Error){
            throw error
        });
      seeTeamRenderer(res,seeTeamResults);

      seeTeamAttributes().reset();
      seeTeamResults = resultsGenerator().seeTeam;
      
      return 
}

const preFormCreateTeamCb = async function(t: Transaction){

      const getAllCompetitions = queryHelpers.getAllCompetitions;
      const getAllCompetitionNames = queryHelpers.getAllCompetitionNames;
      const results = await getAllCompetitions(t).catch(function(error:Error){
            throw error
        });
      

      const populatePreFormCreateTeam = function(){
            if(results){
                  const competitions = getAllCompetitionNames(results);
                  Object.assign(preFormCreateTeamResults,{competitions: competitions});
            }
            else{
                  const err = new Error('Query returned invalid data.')
                  throw err

            }  
      }

      try {
            populatePreFormCreateTeam()
       }
       catch(err){
             console.log(err)
       }
  
       return  

}

export const preFormCreateTeam = async function(req: Request, res: Response, next: NextFunction):Promise<void>{

      await transactionWrapper(preFormCreateTeamCb).catch(function(error:Error){
            throw error
        });
      preFormCreateTeamRenderer(res, preFormCreateTeamResults);
      preFormCreateTeamResults = resultsGenerator().preFormCreateTeam;

}

const postFormCreateTeamCb = async function(t:Transaction){


     const nextCompetitionTemplate = async function(season:string,competitionName:string){
            const nextCompetition = await Competition.findOne({
                  where: {
                        name: competitionName
                  },
                  include: {
                        model: Team,
                        through: {
                              where: {
                                    season: season
                              }
                        }

                  },
                  transaction: t
            }).catch(function(error:Error){
                  throw error
              })
            return nextCompetition
      }

      const allSeasons = async function(){

            return await queryHelpers.generateAllSeasons(t).catch(function(err){
                  throw(err)
            });
      
      }

      const getRelevantCompetitions = async function(){

            const seasons = await allSeasons().catch(function(err){
                  throw(err);
            });
           
            let competitionPromises:((() => Promise<CompetitionModel|null>)[])[] = [];
            const competitionNames = postFormCreateTeamResults.chosenCompetitions;
            if(competitionNames && competitionNames.length > 0){
                  for(let season of seasons){
                        let seasonCompetitions:(() => Promise<CompetitionModel | null>)[] = []
                        for(let compName of competitionNames){
                              const nextPromise = async function(){
                                   return await nextCompetitionTemplate(season,compName).catch(function(err:Error){
                                       throw err;
                                    })
                                    
                               } 
                        seasonCompetitions = [...seasonCompetitions, nextPromise]
                        }
                        competitionPromises = [...competitionPromises, seasonCompetitions]
                  }
            }    
            return competitionPromises 
      };
            
            
      const createTeams = async function(){

            const teamParameters = {...postFormCreateTeamResults};
            Object.assign(teamParameters, {chosenCompetitions: undefined});
            
            const promiseArrays = await getRelevantCompetitions().catch(function(err:Error){
                  throw err;
            }); 
            const relevantCompetitions = promiseArrays.map(async function(competitionPromises){
                  await Promise.all(competitionPromises).catch(function(err:Error){
                        throw err;
                  })
            });
            
            for (let competitionSet of relevantCompetitions){
                  const newTeam = await Team.create(
                        {...teamParameters},
                        {transaction: t}
                  ).catch(function(err:Error){
                        throw err
                  })

                  await (newTeam as any).setCompetitions(competitionSet, {transaction: t}).catch(function(err:Error){
                        throw err
                  })
            }
      }

      await createTeams().catch(function(err:Error){
            throw err;
      })

}

export const postFormCreateTeam = async function(req: Request, res: Response, next: NextFunction):Promise<void>{
      
      const goToTeamPage = async function(){
            try{
            const latestCode = await Team.max('code').catch(function(error:Error){
                  throw error
              });
            const teamName = postFormCreateTeamResults.name;
            
            res.redirect(`/team/${teamName}_${latestCode}`)
            }
            catch(err){
                  if(err){
                        console.log(err)
                        return next(err)
                  }
            }
      }

      submitTeamValidator();
      const errors = validationResult(req);

      if(!errors.isEmpty()){
            await transactionWrapper(preFormCreateTeamCb).catch(function(error:Error){
                  throw error
              });
            Object.assign(preFormCreateTeamResults, {errors: errors.mapped()},  {chosenCompetitions: req.body.chosenCompetitions});
            preFormCreateTeamRenderer(res, preFormCreateTeamResults);
      }
      else{
            Object.assign(postFormCreateTeamResults, req.body);
            await transactionWrapper(postFormCreateTeamCb).catch(function(error:Error){
                  throw error
              });
            await goToTeamPage().catch(function(error:Error){
                  throw error
              }) 
            
      }

      preFormCreateTeamResults = resultsGenerator().preFormCreateTeam;
      postFormCreateTeamResults = resultsGenerator().postFormCreateTeam;

}

const preFormUpdateTeamCb = async function(t: Transaction){

      const getAllCompetitions = queryHelpers.getAllCompetitions;
      const getAllCompetitionNames = queryHelpers.getAllCompetitionNames;
      const results = await getAllCompetitions(t).catch(function(error:Error){
            throw error
        });
      
      const teamCompetitions = await (Team as any).getCompetitions().catch(function(error:Error){
            throw error
      })
      

      const populatePreFormUpdateTeam = function(){
            if(results){
                  const attributes = seeTeamAttributes().seeTeam;
                  const competitions = getAllCompetitionNames(results);
                  if(teamCompetitions && teamCompetitions.length > 0){
                        const chosen = (teamCompetitions as any[]).map(comp => comp.getDataValue('name'))
                        Object.assign(preFormUpdateTeamResults, {chosenCompetitions: chosen})
                        competitions.filter(comp => !chosen.includes(comp))
                  }
                  Object.assign(preFormUpdateTeamResults,{competitions: competitions}, {name: attributes.name});
            }
            else{
                  const err = new Error('Query returned invalid data.')
                  throw err

            }  
      }

      try {
            populatePreFormUpdateTeam()
       }
       catch(err){
             console.log(err)
       }
  
       return 

}

export const preFormUpdateTeam = async function(req: Request, res: Response, next: NextFunction):Promise<void>{
      const attributes = syncAttributes();
      attributes.getSeeTeamAttributes(req,next);

      await transactionWrapper(preFormUpdateTeamCb).catch(function(error:Error){
            throw error
        }); 
      preFormUpdateTeamRenderer(res,preFormUpdateTeamResults);
      seeTeamAttributes().reset()
      preFormUpdateTeamResults = resultsGenerator().preFormUpdateTeam;
      
      return
}

const postFormUpdateTeamCb = async function(t:Transaction){
      
      const nextCompetitionTemplate = async function(season:string,competitionName:string){
            const nextCompetition = await Competition.findOne({
                  where: {
                        name: competitionName
                  },
                  include: {
                        model: Team,
                        through: {
                              where: {
                                    season: season
                              }
                        }

                  },
                  transaction: t
            }).catch(function(error:Error){
                  throw error
              })
            return nextCompetition
      }

      const allSeasons = async function(){

            return await queryHelpers.generateAllSeasons(t).catch(function(err){
                  throw(err)
            });
      
      }

      const seasons = await allSeasons().catch(function(err){
            throw(err);
      });

      const getRelevantCompetitions = async function(){
           
            let competitionPromises:((() => Promise<CompetitionModel|null>)[])[] = [];
            const competitionNames = postFormUpdateTeamResults.chosenCompetitions;
            if(competitionNames && competitionNames.length > 0){
                  for(let season of seasons){
                        let seasonCompetitions:(() => Promise<CompetitionModel | null>)[] = []
                        for(let compName of competitionNames){
                              const nextPromise = async function(){
                                   return await nextCompetitionTemplate(season,compName).catch(function(err:Error){
                                       throw err;
                                    })
                                    
                               } 
                        seasonCompetitions = [...seasonCompetitions, nextPromise]
                        }
                        competitionPromises = [...competitionPromises, seasonCompetitions]
                  }
            }    
            return competitionPromises 
      };

      const updateTeams = async function(){

            const teamParameters = {...postFormUpdateTeamResults};
            Object.assign(teamParameters, {chosenCompetitions: undefined});
            
            const promiseArrays = await getRelevantCompetitions().catch(function(err:Error){
                  throw err;
            }); 
            const relevantCompetitions = promiseArrays.map(async function(competitionPromises){
                  await Promise.all(competitionPromises).catch(function(err:Error){
                        throw err;
                  })
            });

            let seasonsIndex = 0; 
            for (let competitionSet of relevantCompetitions){
                  const updatedTeam = await Team.findOne(
                        {where: {
                              name: teamParameters.name
                        },
                        include: {
                              model: Competition,
                              through: {
                                    where: {
                                          season: seasons[seasonsIndex]
                                    }
                              }
                        },
                        transaction: t}

                  ).catch(function(err:Error){
                        throw err
                  });

                  updatedTeam?.set({...teamParameters});

                  await (updatedTeam as any).setCompetitions(competitionSet, {transaction: t}).catch(function(err:Error){
                        throw err
                  });

                  await updatedTeam?.save().catch(function(err:Error){
                        throw err
                  });

                  seasonsIndex++;
            }
      }

      await updateTeams().catch(function(err:Error){
            throw err;
      })
     
}

export const postFormUpdateTeam = async function(req: Request, res: Response, next: NextFunction):Promise<void>{

      submitTeamValidator();
      const errors = validationResult(req);

      if(!errors.isEmpty()){

            await transactionWrapper(preFormUpdateTeamCb).catch(function(err){
                  throw err
            });
            Object.assign(preFormUpdateTeamResults, req.body, {errors: errors.mapped()});
            preFormUpdateTeamRenderer(res,preFormUpdateTeamResults);       

      }
      else{
            Object.assign(postFormUpdateTeamResults, req.body);
            await transactionWrapper(postFormUpdateTeamCb).catch(function(error:Error){
                  throw error
              });
            const [name,code] = [postFormUpdateTeamResults.name, req.params.code];
            res.redirect(`/team/${name}_${code}`);

      }

      preFormUpdateTeamResults = resultsGenerator().preFormUpdateTeam;
      postFormUpdateTeamResults = resultsGenerator().postFormUpdateTeam;
}






  
  