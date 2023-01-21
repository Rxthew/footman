const checkCorrespondingChosenTeam = function(element, disableStatus){
    const reference = element.dataset.team;
    const chosenTeams = document.querySelectorAll('input[name=chosenTeams]')
    const referencedInput = Array.from(chosenTeams).filter(team => team.id === reference)[0];
    if(referencedInput.checked){
        element.disabled = disableStatus;
    }
    else{
        element.disabled = true;
    }
    
}

const toggleCorrespondingSelectInputs = function(event){
    if(event.target.hasAttribute('name') && event.target.getAttribute('name') === 'chosenTeams'){
        const reference = event.target.id;
        const selects = Array.from(document.querySelectorAll('select'));
        const targets = selects.length > 0 ? selects.filter(select => select.dataset.team === reference) : selects;
        if(event.target.checked){
            targets.length > 0 ? targets.forEach(target => target.disabled = false) : targets;
        }
        else{
            targets.length > 0 ? targets.forEach(target =>  target.disabled = true) : targets;
        }
    }
    return
    
}




const togglePoints = function(event){
    if(event.target.id === 'apply_points'){
        const points = document.querySelectorAll('input[name=points]');
        if(event.target.checked){
            points.forEach(point => checkCorrespondingChosenTeam(point,false))
        }
        else{
            points.forEach(point => checkCorrespondingChosenTeam(point, true))
        }

    }
   
};
const toggleRanking = function(event){
        if(event.target.id === 'apply_ranking' || event.target.id === 'apply_points'){
            const ranks = document.querySelectorAll('select[name=rankings]');
            const pointsPermit = document.getElementById('apply_points');
            const ranksPermit = document.getElementById('apply_ranking');
            if(pointsPermit.checked){
                ranks.forEach(rank => checkCorrespondingChosenTeam(rank,false))
                ranksPermit.checked = true
            }
            else if(ranksPermit.checked){
                ranks.forEach(rank => checkCorrespondingChosenTeam(rank,false))
            }
            else{
                ranks.forEach(rank => checkCorrespondingChosenTeam(rank,true))
            }
        }
        return
};

const form = document.querySelector('form');
form.addEventListener('click',toggleRanking);
form.addEventListener('click',togglePoints);
form.addEventListener('click',toggleCorrespondingSelectInputs);