import { CompetitionModel } from '../../models/competition';
import { PlayerModel } from '../../models/player';
import { TeamModel } from '../../models/team';


interface resultsGeneratorType {
    preFormCreateCompetition: preFormCreateCompetitionResults,
    postFormCreateCompetition: postFormCreateCompetitionResults,  
    preFormUpdateCompetition: preFormUpdateCompetitionResults,
    postFormUpdateCompetition: postFormUpdateCompetitionResults,
    seeCompetition: seeCompetitionResults,
    seePlayer: seePlayerResults,
    preFormCreatePlayer: preFormCreatePlayerResults,
    postFormCreatePlayer: postFormCreatePlayerResults,
    preFormUpdatePlayer: preFormUpdatePlayerResults,
    seeTeam: seeTeamResults,
    preFormCreateTeam: preFormCreateTeamResults,
    postFormCreateTeam: postFormCreateTeamResults,
    preFormUpdateTeam: preFormUpdateTeamResults,
    postFormUpdateTeam: postFormUpdateTeamResults,
    
    
}

export interface seePlayerResults {
    firstName: string,
    lastName: string,
    nationality: string, 
    teamName?: string,
    age: number,
    position: string,
    goals?: number,
    assists?: number,
    speed?: number,
    strength?: number,
    attack?: number,
    defense?: number,
    goalkeeping?: number,
    intelligence?: number,
    technique?: number,
    code?: number
    

}

export interface seeTeamResults {
    name: string
    players?: PlayerModel[]
    competitions?: CompetitionModel[]
    code?: number
}

export interface seeCompetitionResults {
    name: string,
    teams?: TeamModel[],
    code?: number
}

export interface preFormCreatePlayerResults {
    teams: string[],
    seasons: string[],
    errors?: {[index: string]: string | number},
    team?: string,
    season?: string
    
}

export interface preFormCreateCompetitionResults {
    teams: string[],
    seasons: string[],
    errors?: {[index: string]: string | number},
    chosenTeams?: string[],
    ranking?: boolean,
    points?: {[index: string]: number},
    season?: string
}

export interface preFormCreateTeamResults {
    competitions: string[],
    seasons: string[],
    errors?: {[index: string]: string | number},
    chosenCompetitions?: string[],
    season?: string
    
}

export interface postFormCreatePlayerResults {
    firstName: string,
    lastName: string,
    nationality: string,
    age: number,
    position: string,
    goals?: number,
    assists?: number,
    speed?: number,
    strength?: number,
    attack?: number, 
    defense?: number,
    goalkeeping?: number,
    intelligence?: number,
    technique?: number,
    team?: string,
    season?: string,
    code?: number
    
}

export interface postFormCreateCompetitionResults {
    name: string,
    chosenTeams?: string[],
    ranking?: boolean,
    points?: {[index: string]: number},
    season?: string,
    
}

export interface postFormCreateTeamResults {
    name: string,
    chosenCompetitions?: string[],
    season?: string
}

export interface preFormUpdatePlayerResults extends seePlayerResults, preFormCreatePlayerResults {};
export interface postFormUpdatePlayerResults extends postFormCreatePlayerResults {};
export interface preFormUpdateTeamResults extends preFormCreateTeamResults {
    name: string,
};
export interface postFormUpdateTeamResults extends postFormCreateTeamResults {
    code?: number
};
export interface preFormUpdateCompetitionResults extends preFormCreateCompetitionResults {
    name: string,
};
export interface postFormUpdateCompetitionResults extends postFormCreateCompetitionResults {
    code?: number
};

export const resultsGenerator : () => resultsGeneratorType = function(){
    return {
        preFormCreateCompetition: {
            teams: [],
            seasons: []
        },
        postFormCreateCompetition: {
            name: ''
        },
        preFormUpdateCompetition: {
            name: '',
            teams: [],
            seasons: []

        },
        postFormUpdateCompetition: {
            name: ''
        },
        seeCompetition: {
            name: ''

        },
        seePlayer : {
            firstName: '',
            lastName: '',
            code: undefined,
            nationality: '',
            position: '',
            age: 15
        },
        preFormCreatePlayer: {
            teams: [],
            seasons: [],     
        },
        postFormCreatePlayer:  {
            firstName: '',
            lastName: '',
            nationality: '',
            age: 15,
            position: '',
      },
        preFormUpdatePlayer: {
            firstName: '',
            lastName: '',
            code: undefined,
            nationality: '',
            position: '',
            age: 15,
            teams: [],
            seasons: []
        },
        seeTeam: {
            name: ''
        },
        preFormCreateTeam: {
            competitions: [],
            seasons: []
        },
        postFormCreateTeam: {
            name: '',
        },
        preFormUpdateTeam: {
            name: '',
            competitions: [],
            seasons: []
        },
        postFormUpdateTeam: {
            name: ''
        }
        
    }
}
