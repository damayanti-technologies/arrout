(function(){
var c=document.querySelector('.modes-grid-container'),ph=document.querySelector('.play-fixed')||document.querySelector('.play-holder'),w=document.querySelector('.carousel-wrap');
if(!c||!ph||!w)return;
function f(){var cr=c.getBoundingClientRect(),pr=ph.getBoundingClientRect();
var d=Math.abs((pr.left+pr.width/2)-(cr.left+cr.width/2));
var t=Math.max(0,1-d/(pr.width*0.55));w.style.setProperty('--dol-o',t.toFixed(2));}
c.addEventListener('scroll',f,{passive:true});window.addEventListener('resize',f);f();setTimeout(f,300);
})();
