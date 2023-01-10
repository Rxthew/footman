
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { attributesPlaceholders, preFormCreateCompetitionResults, postFormCreateCompetitionResults, postFormUpdateCompetitionResults, queryHelpers, renderers, resetPlaceholderAttributes, resultsGenerator, 
seeCompetitionResults, syncAttributes, transactionWrapper, validators, preFormUpdateCompetitionResults } from './helpers';
import Competition from '../models/competition';
import  Team, {TeamModel} from '../models/team';
import { Transaction } from 'sequelize';
import '../models/concerns/_runModels';


let seeCompetitionAttributes = function(){
      const resetSeeCompetition = resetPlaceholderAttributes(attributesPlaceholders.seeCompetition);
      return {
            seeCompetition: attributesPlaceholders.seeCompetition,
            reset: resetSeeCompetition
      }
      
};

const preFormCreateCompetitionRenderer = renderers.preFormCreateCompetition;
const preFormUpdateCompetitionRenderer = renderers.preFormUpdateCompetition;
const seeCompetitionRenderer = renderers.seeCompetition;

const submitCompetitionValidator = validators().postFormCompetition;

let preFormCreateCompetitionResults: preFormCreateCompetitionResults = resultsGenerator().preFormCreateCompetition;
let postFormCreateCompetitionResults: postFormCreateCompetitionResults = resultsGenerator().postFormCreateCompetition;
let preFormUpdateCompetitionResults: preFormUpdateCompetitionResults = resultsGenerator().preFormUpdateCompetition;
let postFormUpdateCompetitionResults: postFormUpdateCompetitionResults = resultsGenerator().postFormUpdateCompetition;
let seeCompetitionResults: seeCompetitionResults = resultsGenerator().seeCompetition;

const seeCompetitionCb = async function (t:Transaction): Promise<void>{
      
      const seeCompetitionQuery = async function(){ 
            const attributes = seeCompetitionAttributes().seeCompetition;
            const competition = await Competition.findOne({
                  where: {
                        name: attributes.name,
                        code: attributes.code
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
                  const err = new Error('Query returned invalid data.');
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

      const attributes = syncAttributes();
      attributes.getSeeCompetitionAttributes(req,next);
      
      await transactionWrapper(seeCompetitionCb).catch(function(error:Error){
            throw error
        });

      seeCompetitionRenderer(res,seeCompetitionResults);

      seeCompetitionAttributes().reset();
      seeCompetitionResults = resultsGenerator().seeCompetition;
      
      return 
};

const preFormCreateCompetitionCb = async function(t:Transaction):Promise<void>{

      const getAllTeams = queryHelpers.getAllTeams;
      const getAllTeamNames = queryHelpers.getAllTeamNames;

      const results = await getAllTeams(t).catch(function(error:Error){
            throw error
        });
      

      const populatePreFormCreateCompetition = function(){
            if(results){
                  const teamNames = getAllTeamNames(results);
                  Object.assign(preFormCreateCompetitionResults,{teams: teamNames});
            }
            else{
                  const err = new Error('Query returned invalid data.')
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

      const nextTeamTemplate = async function(season:string,teamName:string){
            const nextTeam = await Team.findOne({
                  where: {
                        name: teamName
                  },
                  include: {
                        model: Competition,
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
            return nextTeam
      }

      const allSeasons = async function(){

            return await queryHelpers.generateAllSeasons(t).catch(function(err){
                  throw(err)
            });
      
      }

      const seasons = await allSeasons().catch(function(err){
            throw(err);
      });


      const getRelevantTeams = async function(){

            let teamPromises:((() => Promise<TeamModel|null>)[])[] = [];
            const teamNames = postFormCreateCompetitionResults.chosenTeams;
            if(teamNames && teamNames.length > 0){
                  for(let season of seasons){
                        let seasonTeams:(() => Promise<TeamModel | null>)[] = []
                        for(let teamName of teamNames){
                              const nextPromise = async function(){
                                   return await nextTeamTemplate(season,teamName).catch(function(err:Error){
                                       throw err;
                                    })
                                    
                               } 
                        seasonTeams = [...seasonTeams, nextPromise]
                        }
                        teamPromises = [...teamPromises, seasonTeams]
                  }
            }    
            return teamPromises 
      };
            
            
      const createCompetitions = async function(){

            const competitionParameters = {...postFormCreateCompetitionResults};
            Object.assign(competitionParameters, {chosenCompetitions: undefined});
            
            const promiseArrays = await getRelevantTeams().catch(function(err:Error){
                  throw err;
            }); 
            const relevantTeams = promiseArrays.map(async function(teamPromises){
                  await Promise.all(teamPromises).catch(function(err:Error){
                        throw err;
                  })
            });
            
            for (let teamSet of relevantTeams){
                  const newCompetition = await Competition.create(
                        {...competitionParameters},
                        {transaction: t}
                  ).catch(function(err:Error){
                        throw err
                  })

                  await (newCompetition as any).setCompetitions(teamSet, {transaction: t}).catch(function(err:Error){
                        throw err
                  })
            }
      }

      const applyRanking = async function(){
            if(postFormCreateCompetitionResults.ranking){
                  const latestCompetition = await Competition.findOne({
                        where: {
                              name: postFormCreateCompetitionResults.name
                        },
                        include: [{
                              model: Team,
                              where: {
                                    attributes: {
                                          season: seasons[seasons.length - 1]
                                    }
                              }
                        }],
                        transaction: t
                  }).catch(function(err:Error){throw err})

                 const chosenTeams = postFormCreateCompetitionResults.chosenTeams

                 const teams:any[] = await (latestCompetition as any).getTeams({joinTableAttributes: ['ranking']},{transaction: t}).catch(function(err:Error){throw err})
                 teams.forEach(team => team['TeamsCompetitions'].set('ranking', chosenTeams?.indexOf(team.getDataValue('name'))))
            }

      }


      await createCompetitions().catch(function(err:Error){
            throw err;
      })
      await applyRanking().catch(function(err:Error){
            throw err;
      })

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

      submitCompetitionValidator();
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
                  Object.assign(preFormUpdateCompetitionResults,{teams: teamNames});
            }
            else{
                  const err = new Error('Query returned invalid data.')
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
      const attributes = syncAttributes();
      attributes.getSeeCompetitionAttributes(req,next);

      await transactionWrapper(preFormUpdateCompetitionCb).catch(function(error:Error){throw error});
      preFormUpdateCompetitionRenderer(res,preFormUpdateCompetitionResults);

      seeCompetitionAttributes().reset();
      preFormUpdateCompetitionResults = resultsGenerator().preFormUpdateCompetition;
};


const postFormUpdateCompetitionCb = async function(t:Transaction):Promise<void>{

      const nextTeamTemplate = async function(season:string,teamName:string){
            const nextTeam = await Team.findOne({
                  where: {
                        name: teamName
                  },
                  include: {
                        model: Competition,
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
            return nextTeam
      }

      const allSeasons = async function(){

            return await queryHelpers.generateAllSeasons(t).catch(function(err){
                  throw(err)
            });
      
      }

      const seasons = await allSeasons().catch(function(err){
            throw(err);
      });


      const getRelevantTeams = async function(){

            let teamPromises:((() => Promise<TeamModel|null>)[])[] = [];
            const teamNames = postFormUpdateCompetitionResults.chosenTeams;
            if(teamNames && teamNames.length > 0){
                  for(let season of seasons){
                        let seasonTeams:(() => Promise<TeamModel | null>)[] = []
                        for(let teamName of teamNames){
                              const nextPromise = async function(){
                                   return await nextTeamTemplate(season,teamName).catch(function(err:Error){
                                       throw err;
                                    })
                                    
                               } 
                        seasonTeams = [...seasonTeams, nextPromise]
                        }
                        teamPromises = [...teamPromises, seasonTeams]
                  }
            }    
            return teamPromises 
      };
            
            
      const updateCompetitions = async function(){

            const competitionParameters = {...postFormCreateCompetitionResults};
            Object.assign(competitionParameters, {chosenCompetitions: undefined});
            
            const promiseArrays = await getRelevantTeams().catch(function(err:Error){
                  throw err;
            }); 
            const relevantTeams = promiseArrays.map(async function(teamPromises){
                  await Promise.all(teamPromises).catch(function(err:Error){
                        throw err;
                  })
            });

            let seasonsIndex = 0;
            for (let teamSet of relevantTeams){
                  const updatedCompetition = await Competition.findOne(
                        {
                        where: {name: competitionParameters.name},
                        include: [{
                              model: Team,
                              where: {
                                    season: seasons[seasonsIndex]
                              }
                        }],
                        transaction: t
                        }
                  ).catch(function(err:Error){
                        throw err
                  })

                  updatedCompetition?.set({...competitionParameters});

                  await (updatedCompetition as any).setTeams(teamSet, {transaction: t}).catch(function(err:Error){
                        throw err
                  });

                  await updatedCompetition?.save().catch(function(err:Error){
                        throw err
                  });

                  seasonsIndex++;
            }
      }

      const applyRanking = async function(){
            if(postFormCreateCompetitionResults.ranking){
                  const latestCompetition = await Competition.findOne({
                        where: {
                              name: postFormCreateCompetitionResults.name
                        },
                        include: [{
                              model: Team,
                              where: {
                                    attributes: {
                                          season: seasons[seasons.length - 1]
                                    }
                              }
                        }],
                        transaction: t
                  }).catch(function(err:Error){throw err})

                 const chosenTeams = postFormCreateCompetitionResults.chosenTeams

                 const teams:any[] = await (latestCompetition as any).getTeams({joinTableAttributes: ['ranking']},{transaction: t}).catch(function(err:Error){throw err})
                 teams.forEach(team => team['TeamsCompetitions'].set('ranking', chosenTeams?.indexOf(team.getDataValue('name'))))
            }

      }

      await updateCompetitions().catch(function(err:Error){
            throw err;
      })
      await applyRanking().catch(function(err:Error){
            throw err;
      })

};

export const postFormUpdateCompetition = async function(req:Request,res:Response,next:NextFunction):Promise<void>{

      submitCompetitionValidator();
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






  
  