const ELEMENT_KEYS = [null, 'hotcold', 'breath', 'body', 'movement', 'community'];
const { renderers, palette } = createOriginalRenderers();

/** The caller owns localized copy; this mount owns only its decorative canvas. */
export function mountElementVisual(host, index, { reducedMotion = false } = {}) {
  const key = ELEMENT_KEYS[index];
  if (!Number.isInteger(index) || !key) {
    throw new RangeError('Element visual index must be between 1 and 5.');
  }
  const doc = host.ownerDocument;
  const win = doc.defaultView;
  const frame = doc.createElement('div');
  frame.className = 'element-visual';
  frame.setAttribute('aria-hidden', 'true');
  const canvas = doc.createElement('canvas');
  canvas.className = 'element-visual__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  frame.appendChild(canvas);
  host.appendChild(frame);
  const ctx = canvas.getContext('2d');
  if (!ctx) return { destroy() { frame.remove(); } };

  const renderer = renderers[key];
  const motion = win.matchMedia?.('(prefers-reduced-motion: reduce)');
  let destroyed = false;
  let intersecting = !win.IntersectionObserver;
  let raf = null;
  let previousTime = null;
  let elapsed = 0;
  let width = 0;
  let height = 0;
  let dpr = 0;
  let state = {};
  let needsDraw = true;

  function canDraw() {
    if (destroyed || doc.hidden || !intersecting || !frame.isConnected) return false;
    if (frame.checkVisibility) {
      if (!frame.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
    } else {
      if (!frame.getClientRects().length) return false;
      for (let node = frame; node; node = node.parentElement) {
        const style = win.getComputedStyle(node);
        if (node.hidden || style.display === 'none' || style.visibility === 'hidden' ||
            style.visibility === 'collapse' || Number(style.opacity) === 0) return false;
      }
    }
    if (!win.IntersectionObserver) {
      const rect = frame.getBoundingClientRect();
      return rect.bottom > 0 && rect.right > 0 &&
        rect.top < win.innerHeight && rect.left < win.innerWidth;
    }
    return true;
  }

  function stop() {
    if (raf !== null) win.cancelAnimationFrame(raf);
    raf = null;
    previousTime = null;
  }

  function resize() {
    const nextWidth = frame.clientWidth;
    const nextHeight = frame.clientHeight;
    const nextDpr = Math.min(win.devicePixelRatio || 1, 1.5);
    if (nextWidth <= 0 || nextHeight <= 0) return false;
    const geometryChanged = width !== nextWidth || height !== nextHeight;
    if (geometryChanged || dpr !== nextDpr) {
      width = nextWidth;
      height = nextHeight;
      dpr = nextDpr;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (geometryChanged) {
        state = {};
        renderer.init(state, width, height);
      }
      needsDraw = true;
    }
    return true;
  }

  function draw(time) {
    ctx.clearRect(0, 0, width, height);
    renderer.draw(ctx, width, height, time, state, palette);
    needsDraw = false;
  }

  function tick(timestamp) {
    raf = null;
    if (!canDraw()) { stop(); return; }
    if (reducedMotion || motion?.matches) { refresh(); return; }
    if (previousTime !== null) elapsed += Math.min(50, timestamp - previousTime) / 1000;
    previousTime = timestamp;
    draw(elapsed);
    raf = win.requestAnimationFrame(tick);
  }

  function refresh() {
    if (!canDraw() || !resize()) { stop(); return; }
    if (reducedMotion || motion?.matches) {
      stop();
      // A settled phase also gives the body network a visible signal.
      if (needsDraw) draw(4);
      return;
    }
    if (needsDraw) draw(elapsed);
    if (raf === null) raf = win.requestAnimationFrame(tick);
  }

  function onMotionChange() {
    needsDraw = true;
    refresh();
  }

  const visibilityObserver = win.IntersectionObserver
    ? new win.IntersectionObserver(entries => {
      if (destroyed) return;
      const entry = entries.find(item => item.target === frame);
      if (!entry) return;
      intersecting = entry.isIntersecting;
      refresh();
    })
    : null;
  visibilityObserver?.observe(frame);

  const resizeObserver = win.ResizeObserver ? new win.ResizeObserver(refresh) : null;
  resizeObserver?.observe(frame);

  // CSS visibility and hidden attributes need not change intersection geometry.
  const attributeObserver = win.MutationObserver ? new win.MutationObserver(refresh) : null;
  for (let node = frame; node && attributeObserver; node = node.parentElement) {
    attributeObserver.observe(node, { attributes: true, attributeFilter: ['hidden', 'class', 'style'] });
  }

  doc.addEventListener('visibilitychange', refresh);
  win.addEventListener('resize', refresh, { passive: true });
  if (!visibilityObserver) win.addEventListener('scroll', refresh, { passive: true, capture: true });
  if (motion?.addEventListener) motion.addEventListener('change', onMotionChange);
  else motion?.addListener?.(onMotionChange);
  refresh();

  return {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      stop();
      visibilityObserver?.disconnect();
      resizeObserver?.disconnect();
      attributeObserver?.disconnect();
      doc.removeEventListener('visibilitychange', refresh);
      win.removeEventListener('resize', refresh);
      if (!visibilityObserver) win.removeEventListener('scroll', refresh, true);
      if (motion?.removeEventListener) motion.removeEventListener('change', onMotionChange);
      else motion?.removeListener?.(onMotionChange);
      frame.remove();
      canvas.width = 0;
      canvas.height = 0;
      state = {};
    },
  };
}

// Original createElementFX palette and five drawing routines, without Mindset.
function createOriginalRenderers(){
    var PAL={ pink:'#ef84be', pink2:'#f7a8d4', pinkB:'#ffc2e4', green:'#8fe3b0', green2:'#b4eecb', greenB:'#d6f7e0', white:'#f3eef5' };
    function hx(h){ var n=parseInt(h.slice(1),16); return [(n>>16)&255,(n>>8)&255,n&255]; }
    function rgbaA(c,a){ return 'rgba('+c[0]+','+c[1]+','+c[2]+','+a+')'; }
    function rgba(h,a){ return rgbaA(hx(h),a); }
    function lerp(a,b,t){ return a+(b-a)*t; }
    function mix(h1,h2,t){ var a=hx(h1),b=hx(h2); return [Math.round(lerp(a[0],b[0],t)),Math.round(lerp(a[1],b[1],t)),Math.round(lerp(a[2],b[2],t))]; }
    function ease(x){ return x<0.5?2*x*x:1-Math.pow(-2*x+2,2)/2; }
    function radial(ctx,x,y,r,c0,c1){ var g=ctx.createRadialGradient(x,y,0,x,y,Math.max(1,r)); g.addColorStop(0,c0); g.addColorStop(1,c1); return g; }
    function glow(ctx,x,y,r,c,b){ ctx.save(); ctx.shadowBlur=b||0; ctx.shadowColor=c; ctx.fillStyle=c; ctx.beginPath(); ctx.arc(x,y,Math.max(0.1,r),0,6.2832); ctx.fill(); ctx.restore(); }
    function dist(a,b){ return Math.hypot(a.x-b.x,a.y-b.y); }
    function qbez(A,C,B,p){ var q=1-p; return { x:q*q*A.x+2*q*p*C.x+p*p*B.x, y:q*q*A.y+2*q*p*C.y+p*p*B.y }; }
    var R={};

    /* 1 - HOT / COLD : thermal contrast field */
    R.hotcold={ init:function(st,w,h){ st.p=[]; for(var i=0;i<72;i++){ var hot=i%2; st.p.push({hot:hot,x:hot?w*0.5+Math.random()*w*0.5:Math.random()*w*0.5,y:Math.random()*h,v:0.3+Math.random()*0.9,r:0.6+Math.random()*1.7,ph:Math.random()*6.28}); } },
      draw:function(ctx,w,h,t,st,P){
        var g=ctx.createLinearGradient(0,0,w,0); g.addColorStop(0,'#0b1611'); g.addColorStop(.5,'#0c0a14'); g.addColorStop(1,'#180b14'); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
        var sway=Math.sin(t*0.5)*0.05;
        ctx.globalCompositeOperation='lighter';
        ctx.fillStyle=radial(ctx,w*(0.24+sway),h*0.5,w*0.55,rgba(P.green,0.28),'rgba(0,0,0,0)'); ctx.fillRect(0,0,w,h);
        ctx.fillStyle=radial(ctx,w*(0.78-sway),h*0.52,w*0.55,rgba(P.pink,0.30),'rgba(0,0,0,0)'); ctx.fillRect(0,0,w,h);
        for(var i=0;i<st.p.length;i++){ var o=st.p[i];
          if(o.hot){ o.y-=o.v; o.x+=Math.sin(t*1.3+o.ph)*0.3; if(o.y<-4){o.y=h+4;o.x=w*0.5+Math.random()*w*0.5;} }
          else { o.y+=o.v*0.7; o.x+=Math.sin(t*0.9+o.ph)*0.25; if(o.y>h+4){o.y=-4;o.x=Math.random()*w*0.5;} }
          var fl=0.5+0.5*Math.sin(t*3+o.ph); ctx.globalAlpha=(o.hot?0.55:0.42)*(0.4+0.6*fl); glow(ctx,o.x,o.y,o.r,o.hot?P.pinkB:P.greenB,6); }
        ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';
        ctx.save(); ctx.lineWidth=1.4; ctx.strokeStyle=rgba(P.white,0.45); ctx.shadowBlur=14; ctx.shadowColor=rgba(P.pinkB,0.6);
        ctx.beginPath(); for(var y=0;y<=h;y+=6){ var x=w*0.5+Math.sin(y*0.03+t*1.6)*10+Math.sin(t*0.7)*8; if(y===0)ctx.moveTo(x,y); else ctx.lineTo(x,y);} ctx.stroke(); ctx.restore();
      } };

    /* 2 - BREATHWORK : diaphragm aperture, motes drawn in/out, phase ring */
    R.breath={ init:function(st,w,h){ st.m=[]; for(var i=0;i<48;i++){ st.m.push({a:Math.random()*6.283,r:Math.random(),spd:0.5+Math.random()*0.9,tw:Math.random()*6.283}); } },
      draw:function(ctx,w,h,t,st,P){
        ctx.fillStyle='#0c0a12'; ctx.fillRect(0,0,w,h);
        var cx=w/2, cy=h*0.46, base=Math.min(w,h)*0.16, T=12, ph=t%T, scale, pc;
        if(ph<4){ var k=ease(ph/4); scale=lerp(0.62,1,k); pc=k; } else if(ph<6){ scale=1; pc=1; } else { var k2=ease((ph-6)/6); scale=lerp(1,0.62,k2); pc=1-k2; }
        var col=mix(P.pink,P.green,pc), Rr=base*scale*2.4;
        ctx.globalCompositeOperation='lighter';
        ctx.fillStyle=radial(ctx,cx,cy,Rr*1.7,rgbaA(col,0.22),'rgba(0,0,0,0)'); ctx.fillRect(0,0,w,h);
        ctx.fillStyle=radial(ctx,cx,cy,Rr,rgbaA(col,0.5),'rgba(0,0,0,0)'); ctx.beginPath(); ctx.arc(cx,cy,Rr,0,6.283); ctx.fill();
        for(var i=0;i<3;i++){ var rr=Rr*(1.0+i*0.34)+Math.sin(t*1.2-i)*6; ctx.strokeStyle=rgbaA(col,0.26-i*0.07); ctx.lineWidth=1.2; ctx.beginPath(); ctx.arc(cx,cy,rr,0,6.283); ctx.stroke(); }
        for(var m=0;m<st.m.length;m++){ var o=st.m[m]; o.r+=(scale-o.r)*0.04; var rad2=Rr*(0.7+o.r*1.5), x=cx+Math.cos(o.a+t*0.1*o.spd)*rad2, y=cy+Math.sin(o.a+t*0.1*o.spd)*rad2, tw=0.4+0.6*Math.abs(Math.sin(t*2+o.tw)); ctx.globalAlpha=tw; glow(ctx,x,y,1.3,rgbaA(col,0.7),6); }
        ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';
        ctx.strokeStyle=rgbaA(col,0.7); ctx.lineWidth=2; ctx.beginPath(); ctx.arc(cx,cy,Rr*1.5,-1.5708,-1.5708+(ph/T)*6.283); ctx.stroke();
      } };

    /* 4 - BODY : nervous/fascia network, branching signal cascades */
    R.body={ init:function(st,w,h){ var n=[]; for(var i=0;i<15;i++) n.push({x:w*(0.12+0.76*Math.random()),y:h*(0.12+0.76*Math.random()),flare:0}); var E=[]; for(var i=0;i<n.length;i++){ var d=[]; for(var j=0;j<n.length;j++) if(j!==i) d.push([dist(n[i],n[j]),j]); d.sort(function(a,b){return a[0]-b[0];}); for(var k=0;k<2;k++){ var j=d[k][1], ex=false; for(var m=0;m<E.length;m++){ if((E[m].a===i&&E[m].b===j)||(E[m].a===j&&E[m].b===i)){ex=true;break;} } if(!ex) E.push({a:i,b:j,c:{x:(n[i].x+n[j].x)/2+(Math.random()-0.5)*40,y:(n[i].y+n[j].y)/2+(Math.random()-0.5)*40}}); } } st.n=n; st.e=E; st.sig=[]; st.next=0; },
      draw:function(ctx,w,h,t,st,P){
        ctx.fillStyle='#0d0a12'; ctx.fillRect(0,0,w,h);
        var n=st.n, E=st.e;
        function spawn(node,depth){ for(var i=0;i<E.length;i++){ var e=E[i]; if(e.a===node||e.b===node){ if(st.sig.length>48) break; st.sig.push({e:i,dir:e.b===node,p:0,spd:0.018+Math.random()*0.02,depth:depth}); } } }
        if(t>st.next){ st.next=t+1.3+Math.random()*1.1; var s=Math.floor(Math.random()*n.length); n[s].flare=1; spawn(s,2); }
        ctx.lineWidth=1; ctx.strokeStyle=rgba(P.green,0.15);
        for(var i=0;i<E.length;i++){ var e=E[i],A=n[e.a],B=n[e.b]; ctx.beginPath(); ctx.moveTo(A.x,A.y); ctx.quadraticCurveTo(e.c.x,e.c.y,B.x,B.y); ctx.stroke(); }
        ctx.globalCompositeOperation='lighter';
        for(var i=st.sig.length-1;i>=0;i--){ var gg=st.sig[i]; gg.p+=gg.spd; var e=E[gg.e], A=gg.dir?n[e.b]:n[e.a], B=gg.dir?n[e.a]:n[e.b], pt=qbez(A,e.c,B,Math.min(1,gg.p)); glow(ctx,pt.x,pt.y,2.2,rgba(P.pinkB,0.9),12); if(gg.p>=1){ var node=gg.dir?e.a:e.b; n[node].flare=1; if(gg.depth>0) spawn(node,gg.depth-1); st.sig.splice(i,1); } }
        for(var i=0;i<n.length;i++){ var o=n[i]; o.flare*=0.94; glow(ctx,o.x,o.y,2.3+o.flare*3,rgba(P.pink,0.5+0.5*o.flare),8+o.flare*16); if(o.flare>0.05){ ctx.strokeStyle=rgba(P.pinkB,o.flare*0.5); ctx.lineWidth=1; ctx.beginPath(); ctx.arc(o.x,o.y,(1-o.flare)*22+6,0,6.283); ctx.stroke(); } }
        ctx.globalCompositeOperation='source-over';
      } };

    /* 5 - MOVEMENT : articulated limbs cycling, motion trails */
    R.movement={ init:function(st,w,h){ st.t1=[]; st.t2=[]; },
      draw:function(ctx,w,h,t,st,P){
        ctx.fillStyle='#0a0d12'; ctx.fillRect(0,0,w,h);
        var hipx=w*0.5, hipy=h*0.30, L1=Math.min(w,h)*0.22, L2=Math.min(w,h)*0.2;
        function limb(phase){ var hip=-0.4+Math.sin(t*1.7+phase)*0.5, knee=0.95+Math.sin(t*1.7+phase+1.0)*0.7, a1=Math.PI*0.5+hip, kx=hipx+Math.cos(a1)*L1, ky=hipy+Math.sin(a1)*L1, a2=a1+knee, fx=kx+Math.cos(a2)*L2, fy=ky+Math.sin(a2)*L2; return {kx:kx,ky:ky,fx:fx,fy:fy}; }
        ctx.strokeStyle=rgba(P.green,0.16); ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(w*0.12,h*0.84); ctx.lineTo(w*0.88,h*0.84); ctx.stroke();
        var A=limb(0), B=limb(Math.PI);
        st.t1.push({x:A.fx,y:A.fy}); if(st.t1.length>32) st.t1.shift(); st.t2.push({x:B.fx,y:B.fy}); if(st.t2.length>32) st.t2.shift();
        ctx.globalCompositeOperation='lighter';
        function trail(arr,hh){ for(var i=1;i<arr.length;i++){ var a=i/arr.length; ctx.strokeStyle=rgba(hh,a*0.4); ctx.lineWidth=a*3; ctx.beginPath(); ctx.moveTo(arr[i-1].x,arr[i-1].y); ctx.lineTo(arr[i].x,arr[i].y); ctx.stroke(); } }
        function limbDraw(L,seg,joint){ ctx.strokeStyle=seg; ctx.lineWidth=4; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(hipx,hipy); ctx.lineTo(L.kx,L.ky); ctx.lineTo(L.fx,L.fy); ctx.stroke(); glow(ctx,L.kx,L.ky,3.2,joint,10); glow(ctx,L.fx,L.fy,3.6,joint,12); }
        trail(st.t1,P.pink); trail(st.t2,P.green);
        limbDraw(B,rgba(P.green,0.5),rgba(P.greenB,0.9));
        limbDraw(A,rgba(P.pink,0.72),rgba(P.pinkB,1));
        glow(ctx,hipx,hipy,4,rgba(P.white,0.8),14);
        ctx.globalCompositeOperation='source-over';
      } };

    /* 6 - COMMUNITY : coupled oscillators (Kuramoto) syncing into a bloom */
    R.community={ init:function(st,w,h){ var N=18; st.nd=[]; for(var i=0;i<N;i++){ var a=i/N*6.283, rr=Math.min(w,h)*(0.17+0.16*Math.random()); st.nd.push({x:w*0.5+Math.cos(a)*rr*1.3,y:h*0.44+Math.sin(a)*rr,th:Math.random()*6.283,w:1.3+Math.random()*0.6}); } st.K=1.1; },
      draw:function(ctx,w,h,t,st,P){
        ctx.fillStyle='#0a110d'; ctx.fillRect(0,0,w,h);
        var nd=st.nd, N=nd.length, dt=1/60, sx=0, sy=0;
        for(var i=0;i<N;i++){ sx+=Math.cos(nd[i].th); sy+=Math.sin(nd[i].th); }
        var mth=Math.atan2(sy,sx), Rord=Math.hypot(sx,sy)/N;
        for(var i=0;i<N;i++){ nd[i].th+=(nd[i].w+st.K*Rord*Math.sin(mth-nd[i].th))*dt+(Math.random()-0.5)*0.02; }
        for(var i=0;i<N;i++) for(var j=i+1;j<N;j++){ var A=nd[i],B=nd[j],dd=Math.hypot(A.x-B.x,A.y-B.y); if(dd<Math.min(w,h)*0.36){ var sc=(Math.cos(A.th-B.th)+1)/2; if(sc>0.4){ ctx.strokeStyle=rgbaA(mix(P.pink,P.green,sc),0.04+0.18*sc); ctx.lineWidth=0.8; ctx.beginPath(); ctx.moveTo(A.x,A.y); ctx.lineTo(B.x,B.y); ctx.stroke(); } } }
        ctx.globalCompositeOperation='lighter';
        ctx.fillStyle=radial(ctx,w*0.5,h*0.44,Math.min(w,h)*0.5,rgbaA(mix(P.pink,P.green,0.5),0.05+0.22*Rord),'rgba(0,0,0,0)'); ctx.fillRect(0,0,w,h);
        for(var i=0;i<N;i++){ var o=nd[i], pulse=Math.pow((Math.sin(o.th)+1)/2,3), col=mix(P.green,P.pink,pulse); glow(ctx,o.x,o.y,2.2+pulse*4,rgbaA(col,0.5+0.5*pulse),6+pulse*16); }
        ctx.globalCompositeOperation='source-over';
      } };

    return { renderers: R, palette: PAL };
}
