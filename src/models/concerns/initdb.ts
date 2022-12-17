import * as dotenv from 'dotenv';
import { Sequelize } from 'sequelize'

dotenv.config()
const username = process.env.USERNAME;
const password = process.env.PWORD;



export const sequelize = new Sequelize(`postgres://${username}:${password}@127.0.0.1:5432/footman`,{
  hooks: {
    beforeDisconnect: (connection)=>{
      console.log(connection)
    }
  }
});



export const checkAuthentication = async function(sequelize: Sequelize){
    await sequelize.authenticate().catch((error)=>{
      console.error('Authentication has failed',error)
    })
    console.log('Authentication check complete')
}