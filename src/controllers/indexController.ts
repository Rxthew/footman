import * as queryHelpers from './helpers/queries';
import * as resultsGenerator from './helpers/results'; 
import { Request, Response, NextFunction } from 'express';
import { Transaction } from 'sequelize';
import { seeHomepageRenderer } from './helpers/renderers';

let seeHomepageResults = resultsGenerator.seeHomepage();
const { transactionWrapper} = queryHelpers;

const seeHomepageCb = async function(t:Transaction){


    const seeHomepageQuery = async function(){
        const { getFeaturedCompetitionUrls, getFeaturedPlayerUrls, getFeaturedTeamUrls} = queryHelpers;
    
        const featuredCompetitionNames = ['English Premier League'];
        const featuredPlayerNames = [ ['Kevin', 'De Bruyne'] ];
        const featuredTeamNames = ['Manchester City', 'Liverpool'];

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

    }

    const results = await seeHomepageQuery().catch((err:Error)=>{throw err});
    

    const populateSeeHomepageResults = function(){
        if(results.featuredCompetitions && results.featuredPlayers && results.featuredTeams){ 
              Object.assign(seeHomepageResults, {featuredCompetitions: results.featuredCompetitions}, {featuredPlayers: results.featuredPlayers},{featuredTeams: results.featuredTeams});

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

    
    seeHomepageRenderer(res,seeHomepageResults);
    seeHomepageResults = resultsGenerator.seeHomepage();

}