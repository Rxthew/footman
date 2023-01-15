import { CompetitionModel } from '../../models/competition';
import { PlayerModel } from '../../models/player';
import { TeamModel } from '../../models/team';


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
    firstName?: string,
    lastName?: string,
    nationality?: string,
    age?: number,
    position?: string,
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
    season?: string
    
}

export interface preFormCreateCompetitionResults {
    teams: string[],
    seasons: string[],
    name?: string,
    errors?: {[index: string]: string | number},
    chosenTeams?: string[],
    rankings?: number[],
    points?: {[index: string]: number},
    season?: string
}

export interface preFormCreateTeamResults {
    competitions: string[],
    seasons: string[],
    name?: string,
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
    rankings?: number[],
    points?: {[index: string]: number},
    season?: string,
    
}

export interface postFormCreateTeamResults {
    name: string,
    chosenCompetitions?: string[],
    season?: string
}

export interface preFormUpdatePlayerResults extends preFormCreatePlayerResults {
    firstName: string,
    lastName: string,
    nationality: string,
    age: number,
    position: string,
    code?: number
};
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

export const preFormCreateCompetition = function():preFormCreateCompetitionResults{
    return {
        teams: [],
        seasons: []

    }
};

export const postFormCreateCompetition = function():postFormCreateCompetitionResults{
    return {
        name: ''
    }
};

export const preFormUpdateCompetition = function():preFormUpdateCompetitionResults{
    return {
        name: '',
        teams: [],
        seasons: []

    }

};

export const postFormUpdateCompetition = function():postFormUpdateCompetitionResults{
    return {
        name: '',
    }

};

export const seeCompetition = function():seeCompetitionResults{
    return {
        name: '',
    }

};

export const preFormCreatePlayer = function():preFormCreatePlayerResults{
    return {
        teams: [],
        seasons: [],     
    }
    
};

export const postFormCreatePlayer = function():postFormCreatePlayerResults{
    return {
        firstName: '',
        lastName: '',
        nationality: '',
        age: 15,
        position: '',
  }

};

export const preFormUpdatePlayer = function():preFormUpdatePlayerResults{
    return {
        firstName: '',
        lastName: '',
        code: undefined,
        nationality: '',
        position: '',
        age: 15,
        teams: [],
        seasons: []
    }
     
};

export const postFormUpdatePlayer = function():postFormUpdatePlayerResults{
    return {
        firstName: '',
        lastName: '',
        nationality: '',
        age: 15,
        position: '',
  }

};

export const seePlayer = function():seePlayerResults{
    return {
        firstName: '',
        lastName: '',
        code: undefined,
        nationality: '',
        position: '',
        age: 15
    }

};

export const preFormCreateTeam = function():preFormCreateTeamResults{
    return {
        competitions: [],
        seasons: []
    }

};

export const postFormCreateTeam = function():postFormCreateTeamResults{
    return {
        name: ''
    }

};

export const preFormUpdateTeam = function():preFormUpdateTeamResults{
    return {
        name: '',
        competitions: [],
        seasons: []
    }

};

export const postFormUpdateTeam = function():postFormUpdateTeamResults{
    return {
        name: ''
    }

};

export const seeTeam = function():seeTeamResults{
    return {
        name: ''
    }

};



