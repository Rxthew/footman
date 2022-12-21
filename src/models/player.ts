import { DataTypes, BelongsToGetAssociationMixin, InferAttributes, InferCreationAttributes, Model} from "sequelize";
import { sequelize } from "./concerns/initdb";
import { TeamModel } from "./team";


export interface PlayerModel extends Model<InferAttributes<PlayerModel>,InferCreationAttributes<PlayerModel>>{
    id?: string,
    firstName: string,
    lastName: string,
    nationality: string,
    age: number,
    position: string,
    goals: number | null,
    assists: number | null,
    speed: number | null,
    strength: number | null,
    attack: number | null, 
    defense: number | null,
    goalkeeping: number | null,
    intelligence: number | null,
    technique: number | null,
    code: number
    team?: {
        name: string,
        competitions: {name: string}[]
    }
    
    getTeam: BelongsToGetAssociationMixin<TeamModel>
}

const Player = sequelize.define<PlayerModel>('player',{
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    nationality: {
        type: DataTypes.STRING,
        allowNull: false
    },
    age: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    position: {
        type: DataTypes.STRING,
        allowNull: false
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
    code: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false
    }  
    
}, {
    tableName: 'players'
})


export default Player

