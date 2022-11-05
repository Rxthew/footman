import { DataTypes} from "sequelize";
import { sequelize } from "../app";
import Competition from "./competition";
import Team  from "./team";


const TeamsCompetitions = sequelize.define('TeamsCompetitions',{
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false
    },
    team_id: {
        type: DataTypes.UUID,
        references: {
            model: Team,
            key: 'id'
        },
        allowNull: false        
    },
    competition_id: {
        type: DataTypes.UUID,
        references: {
            model: Competition,
            key: 'id'
        },
        allowNull: false        
    },
    points: {
        type: DataTypes.INTEGER
    },
    season: {
        type: DataTypes.STRING,
        allowNull: false
           
    }

})


export default TeamsCompetitions