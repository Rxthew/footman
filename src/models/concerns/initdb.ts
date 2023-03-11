import * as dotenv from 'dotenv';
import { Sequelize } from 'sequelize'

dotenv.config()
const username = process.env.PGUSER;
const password = process.env.PGPASSWORD;
const host = process.env.PGHOST;
const port = process.env.PGPORT;
const name = process.env.PGDATABASE
const url = process.env.DATABASE_URL || `postgres://${username}:${password}@${host}:${port}/${name}`



export const sequelize = new Sequelize(url,{
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