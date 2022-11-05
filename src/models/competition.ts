import { DataTypes} from "sequelize";
import { sequelize } from "../app";
import Team from "./team";
import TeamsCompetitions from "./teamscompetitions";


const Competition = sequelize.define('Competition',{
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    
})


Competition.belongsToMany(Team,{through: TeamsCompetitions})

export default Competition