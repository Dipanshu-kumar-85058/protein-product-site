gsap.registerPlugin(ScrollTrigger);

/* ══ SPOTLIGHT ══ */
const spotlight = document.getElementById('spotlight');
let mouseX=0, mouseY=0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX; mouseY = e.clientY;
  gsap.to(spotlight, {x:mouseX, y:mouseY, duration:0.18, ease:'power2.out'});
});

/* ══ NAV SCROLL ══ */
ScrollTrigger.create({
  start:'top -60',
  onUpdate:s=>document.getElementById('mainNav').classList.toggle('scrolled',s.progress>0)
});

/* ══ DNA HERO CANVAS ══ */
(function(){
  const canvas = document.getElementById('dnaCanvas');
  const ctx = canvas.getContext('2d');
  function resize(){canvas.width=window.innerWidth;canvas.height=window.innerHeight;}
  resize();
  window.addEventListener('resize',resize);
  let t=0;
  const strands=3;
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(let s=0;s<strands;s++){
      const xOffset = canvas.width*(0.15+s*0.35);
      const amplitude=40+s*8;
      const speed=0.018+s*0.006;
      const numPoints=Math.ceil(canvas.height/18);
      // strand 1
      ctx.beginPath();
      for(let i=0;i<=numPoints;i++){
        const y=i*18;
        const x=xOffset+Math.sin(i*0.22+t*speed*60+s*2.1)*amplitude;
        i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
      }
      ctx.strokeStyle=`rgba(204,17,17,${0.12-s*0.02})`;
      ctx.lineWidth=1;ctx.stroke();
      // strand 2
      ctx.beginPath();
      for(let i=0;i<=numPoints;i++){
        const y=i*18;
        const x=xOffset+Math.sin(i*0.22+t*speed*60+s*2.1+Math.PI)*amplitude;
        i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
      }
      ctx.strokeStyle=`rgba(80,80,80,${0.1-s*0.02})`;
      ctx.lineWidth=1;ctx.stroke();
      // rungs
      for(let i=0;i<=numPoints;i+=3){
        const y=i*18;
        const x1=xOffset+Math.sin(i*0.22+t*speed*60+s*2.1)*amplitude;
        const x2=xOffset+Math.sin(i*0.22+t*speed*60+s*2.1+Math.PI)*amplitude;
        const phase=(i*0.22+t*speed*60+s*2.1)%(Math.PI*2);
        const alpha=Math.max(0,Math.sin(phase))*0.35;
        ctx.beginPath();ctx.moveTo(x1,y);ctx.lineTo(x2,y);
        ctx.strokeStyle=`rgba(204,17,17,${alpha})`;
        ctx.lineWidth=1;ctx.stroke();
        // dots
        [x1,x2].forEach(x=>{
          ctx.beginPath();ctx.arc(x,y,2,0,Math.PI*2);
          ctx.fillStyle=`rgba(229,34,34,${alpha*1.5})`;
          ctx.fill();
        });
      }
    }
    t+=0.016;
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ══ MOLECULE CANVAS (3D rotating amino network) ══ */
(function(){
  const canvas = document.getElementById('molCanvas');
  const ctx = canvas.getContext('2d');
  
  // Set dimensions dynamically based on CSS
  let W = canvas.offsetWidth;
  let H = canvas.offsetHeight || 600;
  canvas.width = W; 
  canvas.height = H;

  // Handle window resizing
  window.addEventListener('resize', () => {
    W = canvas.offsetWidth;
    H = canvas.offsetHeight || 600;
    canvas.width = W;
    canvas.height = H;
  });

  const nodes = [];
  const edges = [];
  const N = 22; // Added a few more nodes for the bigger space

  // Spread the nodes out more to fit the 600px canvas
  for(let i=0; i<N; i++){
    nodes.push({
      x: (Math.random() - 0.5) * 240, 
      y: (Math.random() - 0.5) * 240,
      z: (Math.random() - 0.5) * 240,
      r: Math.random() * 4 + 2, // Slightly larger nodes
      label: ['Leu','Ile','Val','Glu','Lys','Thr','Phe','Arg','His','Trp'][i%10]
    });
  }
  for(let i=0; i<N; i++) {
    for(let j=i+1; j<N; j++) {
      if(Math.random() < 0.12) edges.push([i,j]);
    }
  }

  let angleY = 0, angleX = 0.3;
  let targetAngleY = 0, targetAngleX = 0.3;
  let isHovering = false;
  const fov = 400; // Increased field of view for bigger canvas

  // Mouse interactivity
  canvas.addEventListener('mousemove', (e) => {
    isHovering = true;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Map mouse position to rotation angles
    targetAngleY = ((mouseX / W) - 0.5) * Math.PI * 2;
    targetAngleX = ((mouseY / H) - 0.5) * Math.PI;
  });

  canvas.addEventListener('mouseleave', () => {
    isHovering = false;
  });

  function project(x, y, z){
    const cosY = Math.cos(angleY), sinY = Math.sin(angleY);
    const cosX = Math.cos(angleX), sinX = Math.sin(angleX);
    
    let rx = x * cosY + z * sinY;
    let rz = -x * sinY + z * cosY;
    let ry = y * cosX - rz * sinX;
    rz = y * sinX + rz * cosX;
    
    const s = fov / (fov + rz + 200);
    return { px: (W/2) + rx * s, py: (H/2) + ry * s, s, z: rz };
  }

  function draw(){
    ctx.clearRect(0, 0, W, H);
    
    // Smoothly interpolate angles
    if (isHovering) {
      angleY += (targetAngleY - angleY) * 0.08;
      angleX += (targetAngleX - angleX) * 0.08;
    } else {
      angleY += 0.005; // Auto-rotate when not hovering
      angleX += (0.3 - angleX) * 0.05; // Slowly return to default tilt
    }

    // Draw edges
    edges.forEach(([a,b])=>{
      const A = project(nodes[a].x, nodes[a].y, nodes[a].z);
      const B = project(nodes[b].x, nodes[b].y, nodes[b].z);
      const alpha = Math.max(0.04, 0.18 * (A.s + B.s) / 2);
      ctx.beginPath(); ctx.moveTo(A.px, A.py); ctx.lineTo(B.px, B.py);
      ctx.strokeStyle = `rgba(204,17,17,${alpha})`; ctx.lineWidth = 1; ctx.stroke();
    });

    // Draw nodes
    const sorted = [...nodes.map((n,i)=>({...n,i}))].sort((a,b)=>{
      return project(a.x, a.y, a.z).z - project(b.x, b.y, b.z).z;
    });
    
    sorted.forEach(n=>{
      const {px, py, s} = project(n.x, n.y, n.z);
      const r = n.r * s * 1.8;
      const alpha = Math.max(0.3, s * 0.9);
      const grad = ctx.createRadialGradient(px, py, 0, px, py, r*2);
      
      grad.addColorStop(0, `rgba(229,34,34,${alpha})`);
      grad.addColorStop(1, `rgba(204,17,17,0)`);
      
      ctx.beginPath(); ctx.arc(px, py, r*2, 0, Math.PI*2);
      ctx.fillStyle = grad; ctx.fill();
      
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(229,34,34,${alpha})`; ctx.fill();
      
      if(r > 3){
        ctx.fillStyle = `rgba(255,255,255,${alpha*0.6})`;
        ctx.font = `${Math.round(10*s)}px Share Tech Mono,monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(n.label, px, py - r*1.5);
      }
    });
    
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ══ HERO ANIMATIONS ══ */
const heroTL=gsap.timeline({delay:0.4});
heroTL
  .to('.hero-tag',{opacity:1,y:0,duration:0.6,ease:'power2.out'},{})
  .to('.line-inner',{y:'0%',duration:1.0,stagger:0.14,ease:'power4.out'},'-=0.3')
  .to('.hero-divider-line',{opacity:1,duration:0.8,stagger:0.1,ease:'power2.out'},'-=0.4')
  .to('.hero-divider-label',{opacity:1,duration:0.5,ease:'power2.out'},'-=0.5')
  .to('.hero-sub',{opacity:1,duration:0.7,ease:'power2.out'},'-=0.3')
  .to('.hero-actions',{opacity:1,duration:0.5,ease:'power2.out'},'-=0.3')
  .to('#scrollIndicator',{opacity:1,duration:0.4},'-=0.1');

/* ══ STATS ══ */
gsap.to('.stat-item',{
  y:0,opacity:1,stagger:0.1,duration:0.7,ease:'power3.out',
  scrollTrigger:{trigger:'#stats',start:'top 82%'}
});

/* ══ FEATURE CARDS — 3D scroll-in ══ */
['#fc1','#fc2','#fc3'].forEach((sel,i)=>{
  gsap.to(sel,{
    y:0,opacity:1,rotateX:0,duration:0.9,ease:'power3.out',
    delay:i*0.15,
    scrollTrigger:{trigger:sel,start:'top 84%'}
  });
  // 3D mouse tilt
  const card=document.querySelector(sel);
  card.addEventListener('mousemove',e=>{
    const r=card.getBoundingClientRect();
    const cx=r.left+r.width/2,cy=r.top+r.height/2;
    const dx=(e.clientX-cx)/r.width*2;
    const dy=(e.clientY-cy)/r.height*2;
    gsap.to(card,{rotateY:dx*10,rotateX:-dy*6,scale:1.02,duration:0.3,ease:'power2.out',transformOrigin:'center center',transformPerspective:800});
    // spotlight inside card
    const mx=((e.clientX-r.left)/r.width*100)+'%';
    const my=((e.clientY-r.top)/r.height*100)+'%';
    card.style.setProperty('--mx',mx);
    card.style.setProperty('--my',my);
  });
  card.addEventListener('mouseleave',()=>{
    gsap.to(card,{rotateY:0,rotateX:0,scale:1,duration:0.5,ease:'elastic.out(1,0.7)'});
  });
});

/* Animate bars when in view */
document.querySelectorAll('.fc-bar-fill').forEach(bar=>{
  ScrollTrigger.create({
    trigger:bar,start:'top 90%',once:true,
    onEnter:()=>{bar.style.width=bar.dataset.width+'%';}
  });
});

/* ══ MOLECULE SECTION PARALLAX ══ */
gsap.from('#molCanvas',{
  x:-80,opacity:0,duration:1,ease:'power3.out',
  scrollTrigger:{trigger:'#molecule',start:'top 72%'}
});
gsap.from('.mol-content>*',{
  y:30,opacity:0,stagger:0.1,duration:0.7,ease:'power2.out',
  scrollTrigger:{trigger:'.mol-content',start:'top 72%'}
});

/* ══ TIMELINE PINNED HORIZONTAL ══ */
const track=document.getElementById('timelineTrack');
gsap.to(track,{
  x:()=>-(track.scrollWidth-track.parentElement.clientWidth+200),
  ease:'none',
  scrollTrigger:{
    trigger:'#timeline',start:'top top',
    end:()=>`+=${track.scrollWidth}`,
    scrub:1.2,pin:true,anticipatePin:1,
    onUpdate:s=>{
      const max=-(track.scrollWidth-track.parentElement.clientWidth+200);
      track._cx=max*s.progress;
    }
  }
});

/* ══ PRODUCT 3D TILT ══ */
const p3d=document.getElementById('product3d');
gsap.from(p3d,{
  x:-60,opacity:0,duration:1,ease:'power3.out',
  scrollTrigger:{trigger:'#product',start:'top 70%'}
});
gsap.from('.product-content>*',{
  y:30,opacity:0,stagger:0.1,duration:0.7,ease:'power2.out',
  scrollTrigger:{trigger:'.product-content',start:'top 72%'}
});
const pwrap=document.querySelector('.product-3d-wrap');
pwrap.addEventListener('mousemove',e=>{
  const r=pwrap.getBoundingClientRect();
  const dx=(e.clientX-r.left-r.width/2)/r.width*2;
  const dy=(e.clientY-r.top-r.height/2)/r.height*2;
  gsap.to(p3d,{rotateY:dx*20,rotateX:-dy*12,duration:0.4,ease:'power2.out',transformPerspective:1000});
});
pwrap.addEventListener('mouseleave',()=>{
  gsap.to(p3d,{rotateY:0,rotateX:0,duration:0.8,ease:'elastic.out(1,0.6)'});
});

/* ══ CONTACT ══ */
gsap.from('.contact-inner>*',{
  y:40,opacity:0,stagger:0.1,duration:0.7,ease:'power2.out',
  scrollTrigger:{trigger:'#contact',start:'top 75%'}
});

/* ══ FORM SUBMIT ══ */
function handleSubmit(e){
  e.preventDefault();
  const btn=e.target.querySelector('.btn-submit');
  const orig=btn.textContent;
  btn.textContent='Transmission Sent ✓';
  btn.style.background='#1a6b3a';
  setTimeout(()=>{btn.textContent=orig;btn.style.background='';e.target.reset();},3200);
}

/* ══ PARALLAX HERO on scroll ══ */
gsap.to('.hero-content',{
  y:-60,ease:'none',
  scrollTrigger:{trigger:'#hero',start:'top top',end:'bottom top',scrub:true}
});