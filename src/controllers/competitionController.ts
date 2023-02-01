import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { getCompetitionParameters, competitionParameterPlaceholder } from './helpers/parameters';
import * as queryHelpers from './helpers/queries';
import * as renderers  from './helpers/renderers';
import * as resultsGenerator from './helpers/results';
import * as validators from './helpers/validators';
import Competition from '../models/competition';
import  Team, {TeamModel} from '../models/team';
import { Transaction } from 'sequelize';
import '../models/concerns/_runModels';

const { 
      preFormCreateCompetitionRenderer,
      preFormUpdateCompetitionRenderer, 
      seeCompetitionRenderer,
      seeCompetitionIndexRenderer,

} = renderers;

const { createCompetitionValidator, updateCompetitionValidator } = validators;

let preFormCreateCompetitionResults = resultsGenerator.preFormCreateCompetition();
let postFormCreateCompetitionResults = resultsGenerator.postFormCreateCompetition();
let preFormUpdateCompetitionResults = resultsGenerator.preFormUpdateCompetition();
let postFormUpdateCompetitionResults = resultsGenerator.postFormUpdateCompetition();
let seeCompetitionResults = resultsGenerator.seeCompetition();
let seeCompetitionIndexResults = resultsGenerator.seeCompetitionIndex();
const transactionWrapper = queryHelpers.transactionWrapper;


const seeCompetitionCb = async function (t:Transaction): Promise<void>{

      const sortCompetitionData = function(teams:string[], teamUrls:string[], rankings: number[] | undefined,points: number[] | undefined){
            if(rankings && rankings.length > 0){
                  teams.sort(function(x,y){
                        return rankings[teams.indexOf(x)] > rankings[teams.indexOf(y)] ? 1 : -1
                  });
                  teamUrls.sort(function(x,y){
                        return rankings[teamUrls.indexOf(x)] > rankings[teamUrls.indexOf(y)] ? 1 : -1
                  });
                  rankings.sort(function(x,y){
                        return x > y ? 1 : -1
                  });
                  if(points && points.length > 0){
                        points.sort(function(x,y){
                              return x < y ? 1 : -1
                        });

                  }
            }
            else{
                  teams.sort();
            }

      }
      
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

      const competitionTeams = results.teams;

      const getChosenTeams = queryHelpers.getAllTeamNames;
      const getSeason = queryHelpers.getCompetitionSeason;

      const {getPoints, getRankings, getAllTeamUrlParams} = queryHelpers;

      let chosenTeams = getChosenTeams(competitionTeams);
      let teamRankings = getRankings(competitionTeams);
      let teamPoints = getPoints(competitionTeams);
      let urls = getAllTeamUrlParams(competitionTeams, ['name','code']);
      sortCompetitionData(chosenTeams,urls,teamRankings, teamPoints);

      const populateSeeCompetitionResults = function(){
            if(results.competition && results.teams){ 
                  Object.assign(seeCompetitionResults, results.competition.get(), {teams: chosenTeams}, {season: getSeason(competitionTeams)}, {rankings: teamRankings}, {points: teamPoints}, {teamUrls: urls});

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
            console.log(err);
            const newErr = new Error('Query regarding competition viewing returned invalid data.');
            throw newErr
            
      }
 
      return  
    
  };

export const seeCompetition = async function(req: Request, res: Response, next: NextFunction):Promise<void>{

      getCompetitionParameters(req,next);
      
      await transactionWrapper(seeCompetitionCb,next).catch(function(error:Error){
            next(error)
        });

      seeCompetitionRenderer(res,seeCompetitionResults);

      competitionParameterPlaceholder().reset();
      seeCompetitionResults = resultsGenerator.seeCompetition();
      
      return 
};

const seeCompetitionIndexCb = async function(t:Transaction){

      const seeCompetitionIndexQuery = async function(){
            const {getAllCompetitions, getAllCompetitionNames, getAllCompetitionUrlParams, getAllSeasons} = queryHelpers;

            const allCompetitions = await getAllCompetitions(t).catch((err:Error)=>{throw err});
            const allCompetitionPromises = allCompetitions.map(competition => async()=> {return await (competition as any).countTeams({transaction: t})})
            const teamsCount = await Promise.all(allCompetitionPromises.map(promise => promise())).catch((err:Error)=> {throw err})            
            const associatedCompetitions = allCompetitions && allCompetitions.length > 0 ? allCompetitions.filter((c,index) => teamsCount[index] > 0) : []
           
            const seasons = getAllSeasons(associatedCompetitions, 'competition');
            const latestSeason = seasons[seasons.length - 1];
            const latestCompetitions = associatedCompetitions.filter(competition => (competition as any)['teams'][0]['TeamsCompetitions'].getDataValue('season') === latestSeason)

            const names = getAllCompetitionNames(latestCompetitions);
            const urls = getAllCompetitionUrlParams(latestCompetitions,['name','code']);


            let competitionDetails: {[index:string]: {name: string, url: string}[]} = {[latestSeason]: []};

            if(names.every(name => !!name) && urls.every(url => !!url) && latestSeason){

                  const compileCompetitionDetails = function(){
                        names.forEach((compName,index)=> {
                              competitionDetails[latestSeason] = [...competitionDetails[latestSeason], {name: compName, url: urls[index]}]
                        });
                  }

                  const sortDetails = function(){
                        names.sort();                 
                        competitionDetails[latestSeason].sort(function(x,y){
                              return names.indexOf(x['name']) < names.indexOf(y['name']) ? -1 : 1
                        })
                  }

                  compileCompetitionDetails();
                  sortDetails()
                  
            }
            
            return {
                  competitionDetails,
                  seasons
            }
      };

      const results = await seeCompetitionIndexQuery()

      const populateSeeCompetitionIndexResults = function(){
            if(results.competitionDetails && results.seasons){ 
                  Object.assign(seeCompetitionIndexResults, {competitionDetails: results.competitionDetails}, {seasons: results.seasons});

            }
            else{
                  const err = new Error('Query regarding competition index viewing returned invalid data.');
                  throw err;

            }
      }

      try {
           populateSeeCompetitionIndexResults()
      }
      catch(err){
            console.log(err);
            const newErr = new Error('Query regarding competition index viewing returned invalid data.');
            throw newErr
            
      }


};

export const seeCompetitionIndex = async function(req:Request, res:Response, next: NextFunction):Promise<void>{

      await transactionWrapper(seeCompetitionIndexCb, next).catch(function(error:Error){
            next(error)
        });

      seeCompetitionIndexRenderer(res,seeCompetitionIndexResults);
      seeCompetitionIndexResults = resultsGenerator.seeCompetitionIndex();
      
      return

};

const preFormCreateCompetitionCb = async function(t:Transaction):Promise<void>{

      const {getAllTeams,getSeasons, getAllTeamNames} = queryHelpers;

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
             console.log(err);
             const newErr = new Error('Query regarding competition creation returned invalid data.');
             throw newErr
       }
  
       return 
};

export const preFormCreateCompetition = async function(req: Request, res: Response, next: NextFunction):Promise<void>{

      await transactionWrapper(preFormCreateCompetitionCb,next).catch(function(error:Error){
            next(error)
        });
      preFormCreateCompetitionRenderer(res, preFormCreateCompetitionResults);
      preFormCreateCompetitionResults = resultsGenerator.preFormCreateCompetition();
};

const postFormCreateCompetitionCb = async function(t:Transaction){

      
      const {applyPoints, applyRanking, nextTeamTemplate} = queryHelpers;
        
      const getRelevantTeams = async function(){

            let teamPromises:(() => Promise<TeamModel|null>)[] = [];
            const teamNames = postFormCreateCompetitionResults.chosenTeams;
            const chosenSeason = postFormCreateCompetitionResults.season;
            if(teamNames && teamNames.length > 0 && chosenSeason){
                  for(let teamName of teamNames){
                        const nextPromise = async function(){
                              return await nextTeamTemplate(t,teamName,chosenSeason).catch(function(err:Error){
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
             
            const relevantTeams = await Promise.all(teamPromises.map(teamPromise => teamPromise())).catch(function(err:Error){throw err});

            
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


      const latestCompetition = await createCompetition().catch(function(err:Error){
            throw err;
      });
      await applyPoints(latestCompetition, postFormCreateCompetitionResults,t).catch(function(err:Error){
            throw err;
      });
      await applyRanking(latestCompetition,postFormCreateCompetitionResults,t).catch(function(err:Error){
            throw err;
      });

};

export const postFormCreateCompetition = [...createCompetitionValidator(), async function(req:Request, res:Response, next:NextFunction):Promise<void>{

      const goToCompetitionPage = async function(){
            try{
            const latestCode = await Competition.max('code').catch(function(error:Error){
                  throw error
              });
            const competitionName = postFormCreateCompetitionResults.name;
            
            res.redirect(`/competition/${competitionName}.${latestCode}`)
            }
            catch(err){
                  if(err){
                        console.log(err)
                        return next(err)
                  }
            }
      }
                
      const errors = validationResult(req);

      if(!errors.isEmpty()){
            await transactionWrapper(preFormCreateCompetitionCb,next).catch(function(error:Error){
                  next(error) 
              });
            Object.assign(preFormCreateCompetitionResults, {errors: errors.mapped()}, req.body);
            preFormCreateCompetitionRenderer(res, preFormCreateCompetitionResults);
      }
      else{
            Object.assign(postFormCreateCompetitionResults, req.body);
            await transactionWrapper(postFormCreateCompetitionCb,next).catch(function(error:Error){
                  next(error)
              });
            await goToCompetitionPage().catch(function(error:Error){
                  next(error) 
              }) 
            
      }

      preFormCreateCompetitionResults = resultsGenerator.preFormCreateCompetition();
      postFormCreateCompetitionResults = resultsGenerator.postFormCreateCompetition();

}]

const preFormUpdateCompetitionCb = async function(t:Transaction):Promise<void>{

      const {getAllTeams, getAllTeamNames, getSeasons} = queryHelpers;
      const getSeason = queryHelpers.getCompetitionSeason;
      const {getPoints, getRankings} = queryHelpers;

      const updateCompetitionQuery = async function(){

            const parameters = competitionParameterPlaceholder().parameters;

            const teams = await getAllTeams(t).catch(function(error:Error){
                  throw error
              });

            let teamNames =  getAllTeamNames(teams);

            const competition = await Competition.findOne({
                  where: {
                        name: parameters.name,
                        code: parameters.code
                  },
                  transaction: t
                  }).catch(function(error:Error){
                        throw error
                    });
            
            const competitionTeams = competition ? await (competition as any).getTeams({joinTableAttributes: ['season', 'ranking', 'points']})
                                    .catch(function(error:Error){
                                          throw error
                                    }) : []

            const chosenTeams = getAllTeamNames(competitionTeams);

            
            const givenSeason = competitionTeams.length > 0 ? getSeason(competitionTeams) : undefined;
            const givenRankings = competitionTeams.length > 0 ? getRankings(competitionTeams) : undefined;
            const givenPoints = competitionTeams.length > 0 ? getPoints(competitionTeams) : undefined;
            return {
                  competition,
                  chosenTeams,
                  givenPoints,
                  givenRankings,
                  givenSeason,
                  teamNames,
            }
      }

      const results = await updateCompetitionQuery().catch(function(error:Error){
            throw error
        });


      const populatePreFormUpdateCompetition = function(){
            if(results.competition){
                  Object.assign(preFormUpdateCompetitionResults, results.competition.get(),{teams: results.teamNames}, {season: results.givenSeason}, 
                  {chosenTeams: results.chosenTeams}, {seasons: getSeasons()}, {rankings: results.givenRankings}, {points: results.givenPoints});
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
             console.log(err);
             const newErr = new Error('Query regarding competition update returned invalid data.');
             throw newErr
       }
  
       return 

};

export const preFormUpdateCompetition = async function(req:Request, res:Response, next:NextFunction):Promise<void>{
      getCompetitionParameters(req,next);

      await transactionWrapper(preFormUpdateCompetitionCb,next).catch(function(error:Error){next(error)});
      preFormUpdateCompetitionRenderer(res,preFormUpdateCompetitionResults);
   

      competitionParameterPlaceholder().reset();
      preFormUpdateCompetitionResults = resultsGenerator.preFormUpdateCompetition();
};


const postFormUpdateCompetitionCb = async function(t:Transaction):Promise<void>{

      const {applyPoints, applyRanking,nextTeamTemplate} = queryHelpers;

      const getRelevantTeams = async function(){

            let teamPromises:(() => Promise<TeamModel|null>)[] = [];
            const teamNames = postFormUpdateCompetitionResults.chosenTeams;
            const chosenSeason = postFormUpdateCompetitionResults.season;
            if(teamNames && teamNames.length > 0 && chosenSeason){
                  for(let teamName of teamNames){
                        const nextPromise = async function(){
                              return await nextTeamTemplate(t,teamName,chosenSeason).catch(function(err:Error){
                                    throw err;
                              })     
                        } 

                  teamPromises = [...teamPromises, nextPromise]
                  }
                  
                  
            }    
            return teamPromises 
      }


      const updateCompetition = async function(){

            const previousParameters = competitionParameterPlaceholder().parameters;
            const competitionParameters = {...postFormUpdateCompetitionResults};
            Object.assign(competitionParameters, {chosenCompetitions: undefined});

            const chosenSeason = postFormUpdateCompetitionResults.season;

            const teamPromises = await getRelevantTeams().catch(function(err:Error){
                  throw err;
            });

            const relevantTeams = teamPromises.length > 0 ?  await Promise.all(teamPromises.map(teamPromise => teamPromise())).catch(function(err:Error){throw err}) : teamPromises;

            const updatedCompetition = await Competition.findOne({
                  where: {
                        name: previousParameters.name,
                        code: previousParameters.code
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

            await updatedCompetition?.save({transaction: t}).catch(function(err:Error){
                  throw err
            });

            return updatedCompetition

      }
            


      const latestCompetition = await updateCompetition().catch(function(err:Error){
            throw err;
      });
      latestCompetition ? await applyPoints(latestCompetition, postFormUpdateCompetitionResults,t).catch(function(err:Error){
            throw err;
      }) : false;
      latestCompetition ? await applyRanking(latestCompetition, postFormUpdateCompetitionResults,t).catch(function(err:Error){
            throw err;
      }): false;

};

export const postFormUpdateCompetition = [...updateCompetitionValidator(), async function(req:Request,res:Response,next:NextFunction):Promise<void>{

      getCompetitionParameters(req,next);
      const errors = validationResult(req);

      if(!errors.isEmpty()){

            await transactionWrapper(preFormUpdateCompetitionCb, next).catch(function(err){
                  next(err)
            });
            Object.assign(preFormUpdateCompetitionResults, req.body, {errors: errors.mapped()});
            preFormUpdateCompetitionRenderer(res,preFormUpdateCompetitionResults);       

      }
      else{
            Object.assign(postFormUpdateCompetitionResults, req.body);
            await transactionWrapper(postFormUpdateCompetitionCb, next).catch(function(error:Error){
                  next(error)
                  
              });
            const [name,code] = [postFormUpdateCompetitionResults.name, req.params.code];
            res.redirect(`/competition/${name}.${code}`);

      }

      competitionParameterPlaceholder().reset()
      preFormUpdateCompetitionResults = resultsGenerator.preFormUpdateCompetition();
      postFormUpdateCompetitionResults = resultsGenerator.postFormUpdateCompetition();

}];






  
  