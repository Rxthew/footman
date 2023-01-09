import { DataTypes, InferAttributes, InferCreationAttributes, Model} from "sequelize";
import {sequelize } from "./concerns/initdb";
import { TeamModel } from "./team";


export interface CompetitionModel extends Model<InferAttributes<CompetitionModel>,InferCreationAttributes<CompetitionModel>>{
    id: string | undefined,
    name: string,
    code?: number,
    teams?: TeamModel[];
    
}

const Competition = sequelize.define<CompetitionModel>('competition',{
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    code: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false
    },
   
    
}, {
    tableName: 'competitions'
})


export default Competition

