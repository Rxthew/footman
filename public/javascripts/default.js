const addLinks = document.querySelector('.addLinks');
addLinks.addEventListener('click', function(event){
    if(event.target.classList.contains('Add')){
        const reveal = document.querySelector('.revealAddLinks');
        if(reveal){
            reveal.classList.toggle('hideAddLinks',true);
            reveal.classList.toggle('revealAddLinks',false);
        }
        else{
            const hide = document.querySelector('.hideAddLinks');
            hide.classList.toggle('revealAddLinks',true);
            hide.classList.toggle('hideAddLinks',false);
        }
    }
})