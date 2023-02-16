import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import axios from 'axios';
import { getCompetitionParameters, competitionParameterPlaceholder } from './helpers/parameters';
import * as misc from './helpers/misc';
import * as queryHelpers from './helpers/queries';
import * as renderers  from './helpers/renderers';
import * as resultsGenerator from './helpers/results';
import * as validators from './helpers/validators';
import Competition from '../models/competition';
import  Team, {TeamModel} from '../models/team';
import { Transaction } from 'sequelize';
import '../models/concerns/_runModels';




const { 
      hashIndexData, 
      readHashedIndexData, 
      readIndexData,
      sendCompetitionSignals,
      writeHashedIndexData, 
      writeIndexData
} = misc;
const { 
      preFormCreateCompetitionRenderer,
      preFormUpdateCompetitionRenderer, 
      seeCompetitionRenderer,
      seeCompetitionIndexRenderer,

} = renderers;

const { createCompetitionValidator, updateCompetitionValidator } = validators;

let competitionDataResults: resultsGenerator.competitionDataResults | null = null;
let preFormCreateCompetitionResults: resultsGenerator.preFormCreateCompetitionResults | null = null;
let postFormCreateCompetitionResults: resultsGenerator.postFormCreateCompetitionResults | null | undefined =  null;
let preFormUpdateCompetitionResults: resultsGenerator.preFormUpdateCompetitionResults | null = null;
let postFormUpdateCompetitionResults: resultsGenerator.postFormUpdateCompetitionResults | null = null;
let seeCompetitionResults: resultsGenerator.seeCompetitionResults | null = null;
let seeCompetitionIndexResults: resultsGenerator.seeCompetitionIndexResults | null = null;

const transactionWrapper = queryHelpers.transactionWrapper; 

const competitionIndexSignal = async function(req:Request, res:Response, next: NextFunction){
      
      const newIndexData = async function(){

            const generateData = async function(){  
                  await transactionWrapper(competitionIndexDataCb,next).catch((err:Error)=>{throw err});
                  writeIndexData(competitionDataResults)
            };
            
            const nullifyData = function(){
                  competitionDataResults = null;
            };

            await generateData();
            nullifyData()
      };

      const eventObject = {'competitionIndex': newIndexData};
      await sendCompetitionSignals(eventObject,'competitionIndex',undefined);
      next();

}


const competitionIndexDataCb = async function(t:Transaction){
   
    const competitionIndexDataQuery = async function(){
          
          const {getAllCompetitions, getAllCompetitionUrlParams,getCompetitionSeason} = queryHelpers;

          const allCompetitions = await getAllCompetitions(t).catch((err:Error)=>{throw err});
          const associatedCompetitionsPromises = allCompetitions && allCompetitions.length > 0 ? allCompetitions.map(competition => async () =>  await (competition as any).countTeams({transaction: t})) : [];
          const teamsCount = associatedCompetitionsPromises.length > 0 ? await Promise.all(associatedCompetitionsPromises.map(promise => promise())).catch((err:Error) => {throw err}) : associatedCompetitionsPromises;
          const associatedCompetitions =  allCompetitions.filter((c,index) => teamsCount[index] > 0 );

          const teamsPromises = associatedCompetitions.map(competition => async () =>  await (competition as any).getTeams({transaction: t}));
          const teamsSets = teamsPromises.length > 0 ? await Promise.all(teamsPromises.map(promise => promise())).catch((err:Error) => {throw err}) : teamsPromises;

          const seasons = teamsSets.map(set => getCompetitionSeason((set as any)));
          const names = associatedCompetitions && associatedCompetitions.length > 0 ? associatedCompetitions.map(competition => competition.getDataValue('name')) : [];
          const urls = getAllCompetitionUrlParams(associatedCompetitions,['name','code']);


          let competitionData: {[index:string]: {name: string, url: string}[]} = {};

          if(names.every(name => !!name) && urls.every(url => !!url) && seasons.every(season => !!season)){

            const sortDetails = function(seasonName:string){
                  let namesCopy: string[] | null = [...names]
                  namesCopy.sort();                 
                  competitionData[seasonName].sort(function(x,y){
                        return (namesCopy as string[]).indexOf(x['name']) < (namesCopy as string[]).indexOf(y['name']) ? -1 : 1
                  });
                  namesCopy = null;
            };   

            const compileCompetitionData = function(){
                  if(seasons.length > 0){
                        seasons.forEach((seasonName,index)=> {
                              if(!Object.prototype.hasOwnProperty.call(competitionData,seasonName as string)){
                                    competitionData[seasonName as string] = [];
                              }
                              competitionData[seasonName as string] = [...competitionData[seasonName as string], {
                              name: names[index],
                              url: urls[index]
                              }]
                              sortDetails(seasonName as string)                              
                        });
                  }
                  
            };

            compileCompetitionData();
          }
          
          return competitionData
    };

    const results = await competitionIndexDataQuery().catch((err:Error)=> {throw err});
    if(results){
            competitionDataResults = resultsGenerator.competitionData();
            Object.assign(competitionDataResults, results);
    }    

};


export const competitionIndexData = async function(req:Request, res:Response, next:NextFunction){
      
      await transactionWrapper(competitionIndexDataCb,next).catch(function(err:Error){throw err});

      res.json(
            competitionDataResults
      );

      competitionDataResults = null;

      return

};

const deleteCompetitionCb = async function(t:Transaction):Promise<void>{

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

      await competition?.destroy().catch(function(error:Error){
            throw error
            });
}

export const deleteCompetition = [  

      async function(req:Request,res:Response,next:NextFunction):Promise<void>{

      getCompetitionParameters(req,next);

      await transactionWrapper(deleteCompetitionCb,next).catch(function(error:Error){
            next(error)
        });

      },

      competitionIndexSignal,

      async (req:Request,res:Response, next:NextFunction) => {

            const goToHomePage = function(){
                  res.redirect('index');
            }
      
            goToHomePage()
            competitionParameterPlaceholder().reset(); 
      
      }

]


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
            const teams = await (competition as any)?.getTeams({joinTableAttributes: ['season','points','ranking'], transaction: t}).catch(function(error:Error){
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
                  seeCompetitionResults = resultsGenerator.seeCompetition(); 
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

      if(seeCompetitionResults){
            seeCompetitionRenderer(res,seeCompetitionResults);
      }

      competitionParameterPlaceholder().reset();
      seeCompetitionResults = null;
      
      return 
};

const seeCompetitionIndexCb =  async function(t:Transaction){

      const competitionIndexDataProcessor = function(currentData: resultsGenerator.competitionDataResults){

            const generateSeasons = function(){
                  const seasons = Object.keys(currentData);
                  return seasons
            };

            const generateCompetitionDetails = function(){
                  const seasons = generateSeasons();
                  const latestSeason = seasons[seasons.length -1];
                  const latestCompetitions = currentData[latestSeason];
                  return {[latestSeason]: latestCompetitions}

            };

            const nullifyIndexData = function(){
                  writeIndexData(null);
            };

            const generateHashes = function(){
                  const hashed = hashIndexData(currentData);
                  writeHashedIndexData(hashed)
            }

            generateHashes();
            

            const data = {
                  seasons: generateSeasons(),
                  competitionDetails: generateCompetitionDetails(),
                  hashes: readHashedIndexData()
            };

            nullifyIndexData();
            return data
      };

      const abortFetch = function(controller:AbortController){
           const controllerAbort = function(){controller.abort()}
           setTimeout(controllerAbort,10000)
           return 
      };

      const getCachedData = async function(latestHash:string){
            try{
                  const controller = new AbortController();
                  const api = axios.create({
                        baseURL: 'http://127.0.0.1:3000',
                        signal: controller.signal
                  });
                  const cachedData = await api.get(`/competition/data/${latestHash}`);
                  const data = cachedData.data;
                  abortFetch(controller);
                  return data
            }
            catch(err){
                  throw err
            };

      };

      const newCompetitionIndexData = async function(){

            const generateData = async function(){
                  await competitionIndexDataCb(t).catch((err:Error)=>{throw err});
                  writeIndexData(competitionDataResults)

            };
            
            const nullifyData = function(){
                  competitionDataResults = null;
            };

            await generateData();
            const data = competitionIndexDataProcessor(competitionDataResults as resultsGenerator.competitionDataResults);
            nullifyData();

            return data
      };



      const passCurrentData = async function(currentHashes:{[index:string]:string}){
            const seasons = Object.keys(currentHashes).sort();
            const latestSeason = seasons[seasons.length - 1];
            const latestHash = currentHashes[latestSeason];
            const cachedData = await getCachedData(latestHash);
            const currentData = {[latestSeason]: cachedData[latestSeason]};
            return {
                  seasons: seasons,
                  competitionDetails: currentData,
                  hashes: currentHashes,

            }

      };     


      const seeCompetitionIndexQuery = async function(){
            
            const currentData = readIndexData();
            const currentHashes = readHashedIndexData();

            switch(true){
                  case !!(currentData): return competitionIndexDataProcessor(currentData);
                  case !!(currentHashes): return await passCurrentData(currentHashes);
                  default: return await newCompetitionIndexData();
            }
            
      };
      const results = await seeCompetitionIndexQuery()

      const populateSeeCompetitionIndexResults = function(){
            if(results.competitionDetails || results.hashes){
                  seeCompetitionIndexResults = resultsGenerator.seeCompetitionIndex() 
                  Object.assign(seeCompetitionIndexResults, {competitionDetails: results.competitionDetails}, {seasons: results.seasons}, {hashes: results.hashes});
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


      if(seeCompetitionIndexResults){
            seeCompetitionIndexRenderer(res,seeCompetitionIndexResults);
      }
      
      seeCompetitionIndexResults = null;
      
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
                  Object.assign((preFormCreateCompetitionResults as resultsGenerator.preFormCreateCompetitionResults),{teams: teamNames}, {seasons: getSeasons()});
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
      
      preFormCreateCompetitionResults = resultsGenerator.preFormCreateCompetition();
      await transactionWrapper(preFormCreateCompetitionCb,next).catch(function(error:Error){
            next(error)
        });
      if(preFormCreateCompetitionResults){
            preFormCreateCompetitionRenderer(res, preFormCreateCompetitionResults);
      }
      preFormCreateCompetitionResults = null;
};

const postFormCreateCompetitionCb = async function(t:Transaction){

      const {applyPoints, applyRanking, nextTeamTemplate} = queryHelpers;
        
      const getRelevantTeams = async function(){

            let teamPromises:(() => Promise<TeamModel|null>)[] = [];
            const teamNames = (postFormCreateCompetitionResults as resultsGenerator.postFormCreateCompetitionResults).chosenTeams;
            const chosenSeason = (postFormCreateCompetitionResults as resultsGenerator.postFormCreateCompetitionResults).season;
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
            const newCompetition = await Competition.create({...(postFormCreateCompetitionResults as resultsGenerator.postFormCreateCompetitionResults)}, {transaction: t}).catch(function(err:Error){throw err});
            return newCompetition
            
      }

      const createCompetition = async function(){
            const competitionParameters = {...(postFormCreateCompetitionResults as resultsGenerator.postFormCreateCompetitionResults)};
            Object.assign(competitionParameters, {chosenCompetitions: undefined});
            const chosenSeason = (postFormCreateCompetitionResults as resultsGenerator.postFormCreateCompetitionResults).season;

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
      await applyPoints(latestCompetition, (postFormCreateCompetitionResults as resultsGenerator.postFormCreateCompetitionResults),t).catch(function(err:Error){
            throw err;
      });
      await applyRanking(latestCompetition,(postFormCreateCompetitionResults as resultsGenerator.postFormCreateCompetitionResults),t).catch(function(err:Error){
            throw err;
      });

};

export const postFormCreateCompetition = [...createCompetitionValidator(), 
      
      async function(req:Request, res:Response, next:NextFunction):Promise<void>{
      postFormCreateCompetitionResults = resultsGenerator.postFormCreateCompetition();
      preFormCreateCompetitionResults = resultsGenerator.preFormCreateCompetition();

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

            next()
            return  
      }

      preFormCreateCompetitionResults = null;
      postFormCreateCompetitionResults = null;

      },

      competitionIndexSignal,

      async (req:Request,res:Response, next:NextFunction) => {

            const goToCompetitionPage = async function(){
                  try {
                        const latestCode = await Competition.max('code').catch(function(error:Error){
                              throw error
                        });
                        const competitionName = (postFormCreateCompetitionResults as resultsGenerator.postFormCreateCompetitionResults).name;
                        
                        res.redirect(`/competition/${competitionName}.${latestCode}`)
                  }
                  catch(err){
                        if(err){
                              console.log(err)
                              return next(err)
                        }
                  }
            }

            await goToCompetitionPage().catch(function(error:Error){
                  next(error) 
            })

            preFormCreateCompetitionResults = null;
            postFormCreateCompetitionResults = null;
      }
]

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
            
            const competitionTeams = competition ? await (competition as any).getTeams({joinTableAttributes: ['season', 'ranking', 'points'], transaction: t})
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
                  Object.assign((preFormUpdateCompetitionResults as resultsGenerator.preFormUpdateCompetitionResults), results.competition.get(),{teams: results.teamNames}, {season: results.givenSeason}, 
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
      preFormUpdateCompetitionResults = resultsGenerator.preFormUpdateCompetition();

      await transactionWrapper(preFormUpdateCompetitionCb,next).catch(function(error:Error){next(error)});
      if(preFormUpdateCompetitionResults){
            preFormUpdateCompetitionRenderer(res,preFormUpdateCompetitionResults);
      };
      
      competitionParameterPlaceholder().reset();
      preFormUpdateCompetitionResults = null;
};


const postFormUpdateCompetitionCb = async function(t:Transaction):Promise<void>{

      const {applyPoints, applyRanking,nextTeamTemplate} = queryHelpers;
      postFormUpdateCompetitionResults = postFormUpdateCompetitionResults as resultsGenerator.postFormUpdateCompetitionResults
      

      const getRelevantTeams = async function(){

            let teamPromises:(() => Promise<TeamModel|null>)[] = [];
            const teamNames = (postFormUpdateCompetitionResults as resultsGenerator.postFormUpdateCompetitionResults).chosenTeams;
            const chosenSeason = (postFormUpdateCompetitionResults as resultsGenerator.postFormUpdateCompetitionResults).season;
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

            const chosenSeason = (postFormUpdateCompetitionResults as resultsGenerator.postFormUpdateCompetitionResults).season;

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

            if((postFormUpdateCompetitionResults as resultsGenerator.postFormUpdateCompetitionResults).chosenTeams && (postFormUpdateCompetitionResults as resultsGenerator.postFormUpdateCompetitionResults).season){
                  await (updatedCompetition as any).setTeams(relevantTeams, {transaction: t, through: {season: chosenSeason}}).catch(function(err:Error){
                        throw err
                  });      
            }
            else{
                  await (updatedCompetition as any).setTeams(null, {transaction: t}).catch(function(error:Error){
                        throw error
                  })
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

export const postFormUpdateCompetition = [...updateCompetitionValidator(), 
      
      async function(req:Request,res:Response,next:NextFunction):Promise<void>{

            getCompetitionParameters(req,next);
            const errors = validationResult(req);
            preFormUpdateCompetitionResults = resultsGenerator.preFormUpdateCompetition();
            postFormUpdateCompetitionResults = resultsGenerator.postFormUpdateCompetition();

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

                  next();
                  return


            }

            competitionParameterPlaceholder().reset();
            preFormUpdateCompetitionResults = null;
            postFormUpdateCompetitionResults = null;

      },

      competitionIndexSignal,

      async (req:Request,res:Response, next:NextFunction) => {

            const goToCompetitionPage = function(){
                  const [name,code] = [(postFormUpdateCompetitionResults as resultsGenerator.postFormUpdateCompetitionResults).name, req.params.code];
                  res.redirect(`/competition/${name}.${code}`);
            }

            goToCompetitionPage()

            competitionParameterPlaceholder().reset(); 
            preFormCreateCompetitionResults = null;
            postFormCreateCompetitionResults = null;
      }

];



export const setIndexDataCache = function(req:Request,res:Response,next:NextFunction){
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
      next();

};







  
  