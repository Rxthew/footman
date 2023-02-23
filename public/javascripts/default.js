const toggleGold = function(){
    const path = document.querySelector('.add');
    if(document.querySelector('.revealAddLinks')){
        path.classList.toggle('gold',true);
    }
    else{
        path.classList.toggle('gold',false);
    }
}

const toggleRotate = function(){
    const path = document.querySelector('.add');
    const svg = path.parentElement;
    if(svg.classList.contains('fwdrotate')){
        svg.classList.toggle('fwdrotate',false)
        svg.classList.toggle('bckwdrotate',true)
    }
    else{
        svg.classList.toggle('bckwdrotate',false)
        svg.classList.toggle('fwdrotate',true)

    }
    

}

const addLinks = document.querySelector('.addLinks');
addLinks.addEventListener('click', function(){
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
    toggleGold()
    toggleRotate()
})
