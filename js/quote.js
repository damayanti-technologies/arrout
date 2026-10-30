(function(){
var q=["Can you solve this puzzle?","Think you can clear every arrow?","Bet you can't finish this level!","Ready to test your brain?","One tap at a time. Can you do it?","Can you beat the next level?","Only the sharpest minds escape!","Let's see how clever you are!","Every arrow has a way out. Find it!","Dare to try one more puzzle?"];
var el=document.getElementById('home-quote');if(!el)return;
var last=-1;try{last=parseInt(localStorage.getItem('arrout_last_quote'),10);}catch(e){}
var i;do{i=Math.floor(Math.random()*q.length);}while(i===last&&q.length>1);
try{localStorage.setItem('arrout_last_quote',String(i));}catch(e){}
el.textContent=q[i];
})();
