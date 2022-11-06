import { DataTypes, InferAttributes, InferCreationAttributes, Model} from "sequelize";
import { sequelize } from "../app";
import Team from "./team";

interface PlayerModel extends Model<InferAttributes<PlayerModel>,InferCreationAttributes<PlayerModel>>{
    id: string,
    name: string,
    age: number | null,
    position: string | null,
    goals: number | null,
    assists: number | null,
    speed: number | null,
    strength: number | null,
    attack: number | null, 
    defense: number | null,
    goalkeeping: number | null,
    intelligence: number | null,
    technique: number | null
}

const Player = sequelize.define<PlayerModel>('Player',{
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false
        
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    age: {
        type: DataTypes.INTEGER
    },
    position: {
        type: DataTypes.STRING
    },
    goals: {
        type: DataTypes.INTEGER
    },
    assists: {
        type: DataTypes.INTEGER
    },
    speed: {
        type: DataTypes.INTEGER
    },
    strength: {
        type: DataTypes.INTEGER
    },
    attack: {
        type: DataTypes.INTEGER
    },
    defense: {
        type: DataTypes.INTEGER
    },
    goalkeeping: {
        type: DataTypes.INTEGER
    },
    intelligence: {
        type: DataTypes.INTEGER
    },
    technique: {
        type: DataTypes.INTEGER
    },  
    
}, {
    tableName: 'Players'
})

Player.belongsTo(Team)

export default Player