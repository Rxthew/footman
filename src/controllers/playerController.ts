
import { Request, Response, NextFunction } from 'express';
import { attributesPlaceholders, renderers, synchroniseAttributes, transactionWrapper } from './helpers';
import Player from '../models/player';
import { Transaction } from 'sequelize';

let seePlayerAttributes = attributesPlaceholders.seePlayer
const seePlayerRenderer = renderers.seePlayer
let seePlayerResults = {
      firstName: '',
      lastName: '',
      nationality: '',
      teamName: ''
}


const seePlayerCb = async function (t:Transaction): Promise<void>{

      const seePlayerQuery = async function(){
            const player = await Player.findOne({
                  where: {
                        firstName: seePlayerAttributes.firstName,
                        lastName: seePlayerAttributes.lastName,
                        nationality: seePlayerAttributes.nationality
                  },
                  transaction: t
                  });
            const team = await player?.getTeam()
            return {
                  player,
                  team
            }

      }

      const results = await seePlayerQuery()
      
      const populateSeePlayerResults = function(){
            if(results.player && results.team){
                  Object.assign(seePlayerResults, results.player, {teamName : results.team.name})
                  
            }
            else{
                  const err = new Error('Query returned invalid data.')
                  throw err

            }
      }

      try {
           populateSeePlayerResults()
      }
      catch(err){
            console.log(err)
      }
 
      return  
    
  };

export const seePlayer = async function(req: Request, res: Response, next: NextFunction){

      const nominalAttributes = synchroniseAttributes()
      nominalAttributes.getSeePlayerAttributes(req,next)

      await transactionWrapper(seePlayerCb)
      seePlayerRenderer(res,seePlayerResults)
      
      return 
}




  
  