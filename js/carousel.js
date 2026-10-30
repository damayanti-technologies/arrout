(function(){var c=document.querySelector('.modes-grid-container');if(!c)return;
var cards=[].slice.call(c.children),dots=[].slice.call(document.querySelectorAll('.home-dots i'));
function upd(){var mid=c.scrollLeft+c.clientWidth/2,b=0,bd=1e9;cards.forEach(function(el,i){var d=Math.abs(el.offsetLeft+el.offsetWidth/2-mid);if(d<bd){bd=d;b=i}});dots.forEach(function(x,i){x.classList.toggle('on',i===b)})}
c.addEventListener('scroll',upd,{passive:true});
dots.forEach(function(x,i){x.addEventListener('click',function(){cards[i].scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'})})});
})();
