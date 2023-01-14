const togglePoints = function(event){
    if(event.target.id === 'apply_points'){
        const points = document.querySelectorAll('input[name=points]');
        if(event.target.checked){
            points.forEach(point => point.disabled = false)
        }
        else{
            points.forEach(point => point.disabled = true)
        }

    }
   
};
const toggleRanking = function(event){
        if(event.target.id === 'apply_ranking' || event.target.id === 'apply_points'){
            const ranks = document.querySelectorAll('select[name=rankings]');
            const pointsPermit = document.getElementById('apply_points');
            const ranksPermit = document.getElementById('apply_ranking');
            if(pointsPermit.checked){
                ranks.forEach(rank => rank.disabled = false)
                ranksPermit.checked = true
            }
            else if(ranksPermit.checked){
                ranks.forEach(rank => rank.disabled = false)
            }
            else{
                ranks.forEach(rank => rank.disabled = true)
            }
        }
        return
};

const form = document.querySelector('form');
form.addEventListener('click',toggleRanking);
form.addEventListener('click',togglePoints);