import * as queryHelpers from './helpers/queries';
import * as resultsGenerator from './helpers/results'; 
import { Request, Response, NextFunction } from 'express';
import { Transaction } from 'sequelize';
import { seeHomepageRenderer } from './helpers/renderers';

let seeHomepageResults = resultsGenerator.seeHomepage();
const { transactionWrapper} = queryHelpers;

const seeHomepageCb = async function(t:Transaction){

    const seeHomepageQuery = async function(){
        const { getAllCompetitionUrlParams, getAllPlayerUrlParams, getAllTeamUrlParams,
              getFeaturedCompetitionUrls, getFeaturedPlayerUrls, getFeaturedTeamUrls,  
              getAllDissociatedCompetitions, getAllDissociatedPlayers, getAllDissociatedTeams,} = queryHelpers;

        const getFeaturedUrls = async function(){
            const featuredCompetitionNames = ['English Premier League'];
            const featuredPlayerNames = [ ['Kevin', 'De Bruyne'] ];
            const featuredTeamNames = ['Manchester City'];
    
            const featuredCompetitionsUrls = await getFeaturedCompetitionUrls(t,featuredCompetitionNames).catch((err:Error) => {throw err});
            const featuredPlayersUrls = await getFeaturedPlayerUrls(t,featuredPlayerNames).catch((err:Error) => {throw err});
            const featuredTeamsUrls = await getFeaturedTeamUrls(t, featuredTeamNames).catch((err:Error) => {throw err});
    
            let featuredCompetitions: {name: string, url:string}[] = [];
            let featuredPlayers: {names: string[], url:string}[] = [];
            let featuredTeams: {name: string, url:string}[] =[];
    
            featuredCompetitionsUrls && featuredCompetitionNames.length === featuredCompetitionsUrls.length ? featuredCompetitionNames.forEach((competitionName,index) => {
                featuredCompetitions = [...featuredCompetitions, {name: competitionName, url: featuredCompetitionsUrls[index]}]
            }) : featuredCompetitions;
    
            featuredPlayersUrls && featuredPlayerNames.length === featuredPlayersUrls.length ? featuredPlayerNames.forEach((playerNames,index) => {
                featuredPlayers = [...featuredPlayers, {names: playerNames, url: featuredPlayersUrls[index]}]
            }) : featuredPlayers;
    
            featuredTeamsUrls && featuredTeamNames.length === featuredTeamsUrls.length ? featuredTeamNames.forEach((teamName,index) => {
                featuredTeams = [...featuredTeams, {name: teamName, url: featuredTeamsUrls[index]}]
            }): featuredTeams;

            return {
                featuredCompetitions,
                featuredPlayers,
                featuredTeams
                
            }

        };

        const getDissociatedUrls = async function(){
            const freeCompetitionModels = await getAllDissociatedCompetitions(t).catch((err:Error) => {throw err});
            const freePlayerModels = await getAllDissociatedPlayers(t).catch((err:Error) => {throw err});
            const freeTeamModels = await getAllDissociatedTeams(t).catch((err:Error) => {throw err});

            const competitionNames = freeCompetitionModels.map(competition => competition.getDataValue('name'));
            const playerNames = freePlayerModels.map(player => [player.getDataValue('firstName'), player.getDataValue('lastName')]);
            const teamNames = freeTeamModels.map(team => team.getDataValue('name'));

            const competitionUrls = getAllCompetitionUrlParams(freeCompetitionModels,['name','code']);
            const playerUrls = getAllPlayerUrlParams(freePlayerModels,['firstName','lastName','code']);
            const teamUrls = getAllTeamUrlParams(freeTeamModels,['name','code']);
            
            let freeCompetitions: {name: string, url:string}[] = [];
            let freePlayers: {names: string[], url:string}[] = [];
            let freeTeams: {name: string, url:string}[] =[];
    
            competitionNames.length === competitionUrls.length ? competitionNames.forEach((competitionName,index) => {
            freeCompetitions = [...freeCompetitions, {name: competitionName, url: competitionUrls[index]}]
            }) : freeCompetitions;
    
            playerNames.length === playerUrls.length ? playerNames.forEach((allNames,index) => {
                freePlayers = [...freePlayers, {names: allNames, url: playerUrls[index]}]
            }) : freePlayers;
    
            teamNames.length === teamUrls.length ? teamNames.forEach((teamName,index) => {
                freeTeams = [...freeTeams, {name: teamName, url: teamUrls[index]}]
            }): freeTeams;

            return {
                freeCompetitions,
                freePlayers,
                freeTeams
            }


        }  

        return {
            ...await getFeaturedUrls(),
            ...await getDissociatedUrls()
        }
        

    }

    const results = await seeHomepageQuery().catch((err:Error)=>{throw err});

    const populateSeeHomepageResults = function(){
        if(results.featuredCompetitions && results.featuredPlayers && results.featuredTeams){ 
              Object.assign(seeHomepageResults, {featuredCompetitions: results.featuredCompetitions}, {featuredPlayers: results.featuredPlayers},{featuredTeams: results.featuredTeams},
                            {freeCompetitions: results.freeCompetitions, freePlayers: results.freePlayers, freeTeams: results.freeTeams}
                );

        }
        else{
              const err = new Error('Query regarding homepage returned invalid data.');
              throw err;

        }
  }

  try {
       populateSeeHomepageResults()
  }
  catch(err){
        console.log(err);
        const newErr = new Error('Query regarding homepage returned invalid data.');
        throw newErr
        
  }

  return 


};

export const seeHomepage = async function(req:Request,res:Response,next:NextFunction){

    await transactionWrapper(seeHomepageCb,next).catch(function(error:Error){
        next(error)
    });

    if(seeHomepageResults){
        seeHomepageRenderer(res,seeHomepageResults);
    }
    seeHomepageResults = resultsGenerator.seeHomepage();

}