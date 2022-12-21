
import { Request, Response, NextFunction } from 'express';
import { attributesPlaceholders, renderers, seePlayerResults, syncAttributes, transactionWrapper } from './helpers';
import  Player from '../models/player';
import { Transaction } from 'sequelize';
import '../models/concerns/_runModels';



let seePlayerAttributes = function(){
      return attributesPlaceholders.seePlayer
}
const seePlayerRenderer = renderers.seePlayer
let seePlayerResults: seePlayerResults = {
      firstName: '',
      lastName: '',
      code: undefined
}


const seePlayerCb = async function (t:Transaction): Promise<void>{
      
      const seePlayerQuery = async function(){
            const attributes = seePlayerAttributes()
            const player = await Player.findOne({
                  where: {
                        firstName: attributes.firstName,
                        lastName: attributes.lastName,
                        code: attributes.code
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
            if(results.player && results.team ){ 
                  Object.assign(seePlayerResults, results.player.get(), {teamName: results.team.getDataValue('name')});                  
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

      const attributes = syncAttributes()
      attributes.getSeePlayerAttributes(req,next)
      
      await transactionWrapper(seePlayerCb)
      seePlayerRenderer(res,seePlayerResults)
      
      return 
}




  
  