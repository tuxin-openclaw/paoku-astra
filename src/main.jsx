import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUp, ArrowLeft, ArrowRight, ArrowUpRight, Play, Pause, RotateCcw, Volume2, VolumeX, Trophy, Fish, Footprints, Maximize, Minimize, X, Heart, Coffee, Keyboard, Smartphone, Sparkles } from 'lucide-react';
import { createGame, startGame, inputGame, stepGame } from './game';
import { createScene } from './scene';
import { createAudio } from './audio';
import './style.css';

const readBest = () => { try { return Number(localStorage.getItem('paws-out-best')) || 0; } catch { return 0; } };
function App() {
  const stage = useRef(null), canvasHost = useRef(null), game = useRef(createGame()), sound = useRef(null);
  const [hud, setHud] = useState({ phase: 'ready', distance: 0, fish: 0, score: 0, speed: 10 });
  const [best, setBest] = useState(readBest), [muted, setMuted] = useState(false), [full, setFull] = useState(false), [help, setHelp] = useState(false), [error, setError] = useState(''), [toast, setToast] = useState('');
  const toastTimer = useRef();
  const sync = useCallback(() => { const g = game.current; setHud({ phase: g.phase, distance: Math.floor(g.distance), fish: g.fish, score: g.score, speed: g.speed }); }, []);
  const action = useCallback((name) => { sound.current?.unlock(); if (inputGame(game.current, name)) sound.current?.play('jump'); }, []);
  const begin = useCallback(() => { sound.current?.unlock(); sound.current?.play('start'); startGame(game.current); setHelp(false); setToast(''); sync(); stage.current?.focus({ preventScroll: true }); if (window.matchMedia('(max-width:760px)').matches) requestAnimationFrame(() => stage.current?.scrollIntoView({ block: 'start', behavior: 'instant' })); }, [sync]);
  const pause = useCallback(() => { const g = game.current; if (g.phase === 'running') g.phase = 'paused'; else if (g.phase === 'paused') g.phase = 'running'; sync(); }, [sync]);
  useEffect(() => {
    let world; try { world = createScene(canvasHost.current); } catch (e) { console.error(e); setError('3D 场景暂时无法启动，请开启浏览器硬件加速后刷新页面。'); return; }
    sound.current = createAudio(); let frame, prev = performance.now(), elapsed = 0, uiClock = 0;
    const loop = (now) => {
      const dt = Math.min((now - prev) / 1000, .05); prev = now; elapsed += dt;
      const events = stepGame(game.current, dt);
      for (const event of events) {
        world.effect(event); sound.current.play(event.type);
        if (event.type === 'fish' && game.current.fish % 10 === 0) { setToast('小鱼 +10 · 干得漂亮！'); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), 1800); }
        if (event.type === 'crash') {
          const value = Math.max(readBest(), game.current.score); try { localStorage.setItem('paws-out-best', String(value)); } catch { /* Private browsing may disallow storage. */ } setBest(value); sync();
        }
      }
      world.render(game.current, elapsed, dt); uiClock += dt; if (uiClock > .08) { sync(); uiClock = 0; }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    const visibility = () => { if (document.hidden && game.current.phase === 'running') { game.current.phase = 'paused'; sync(); } };
    document.addEventListener('visibilitychange', visibility);
    // Read-only diagnostics are available only in Vite development mode.
    if (import.meta.env.DEV) window.__PAWS_DEBUG__ = () => ({ ...game.current, objects: game.current.objects.map(o => ({ ...o })), random: undefined });
    return () => { cancelAnimationFrame(frame); clearTimeout(toastTimer.current); document.removeEventListener('visibilitychange', visibility); world.dispose(); sound.current.dispose(); delete window.__PAWS_DEBUG__; };
  }, [sync]);
  useEffect(() => {
    const onKey = (e) => {
      if (e.target instanceof HTMLButtonElement && (e.code === 'Space' || e.code === 'Enter')) return;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space', 'KeyA', 'KeyD', 'KeyW', 'Escape', 'KeyP', 'Enter'].includes(e.code)) e.preventDefault();
      if (e.repeat) return;
      if (e.code === 'Escape' || e.code === 'KeyP') { setHelp(false); pause(); return; }
      if (help) return;
      if (['Space', 'Enter'].includes(e.code) && ['ready', 'over'].includes(game.current.phase)) { begin(); return; }
      if (game.current.phase === 'paused' && e.code === 'Space') { pause(); return; }
      if (['ArrowLeft', 'KeyA'].includes(e.code)) action('left');
      if (['ArrowRight', 'KeyD'].includes(e.code)) action('right');
      if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) action('jump');
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [action, begin, pause, help]);
  useEffect(() => { const fn = () => setFull(Boolean(document.fullscreenElement)); document.addEventListener('fullscreenchange', fn); return () => document.removeEventListener('fullscreenchange', fn); }, []);
  const toggleFull = async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else if (stage.current.requestFullscreen) await stage.current.requestFullscreen(); else setFull(f => !f); } catch { setFull(f => !f); } };
  const touch = useRef(null);
  const down = e => { if (e.target.closest('button') || game.current.phase !== 'running') return; touch.current = { x: e.clientX, y: e.clientY, id: e.pointerId }; e.currentTarget.setPointerCapture(e.pointerId); };
  const up = e => { const t = touch.current; touch.current = null; if (!t || t.id !== e.pointerId) return; const dx = e.clientX - t.x, dy = e.clientY - t.y; if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) action('jump'); else if (Math.abs(dx) > Math.abs(dy)) action(dx > 0 ? 'right' : 'left'); else if (dy < 0) action('jump'); };
  const active = hud.phase !== 'ready';
  return <div className="app-shell">
    <header className="site-header"><a className="brand" href="./" aria-label="Paws Out 首页"><span className="brand-mark"><Footprints size={23}/></span><span>PAWS<span className="brand-out"> OUT</span><small>THE OFFICE ESCAPE</small></span></a><nav><span className="nav-current">橘猫逃离办公室</span><span className="header-divider"/><span className="edition">一场准时下班的冒险</span></nav><span className="live-tag"><i/> 下班计划已就绪</span></header>
    <main>
      <div className="page-intro"><div><div className="eyebrow"><span/> LESS WORK. MORE MEOW.</div><h1>今天，<span>猫先下班。</span></h1><p>工位困不住自由的灵魂。和橘子一起，跑向办公室之外。</p></div><div className="best-card"><span className="trophy-icon"><Trophy size={21}/></span><div><span>个人最佳纪录</span><strong>{best.toLocaleString()} <small>分</small></strong></div><span className="best-deco">↗</span></div></div>
      <section ref={stage} tabIndex={-1} className={`game-stage ${full ? 'expanded' : ''} ${hud.phase === 'over' ? 'crashed' : ''}`} onPointerDown={down} onPointerUp={up} onPointerCancel={() => { touch.current = null; }} aria-label="3D 橘猫跑酷游戏">
        <div ref={canvasHost} className="canvas-host"/>
        <div className="scene-vignette"/>
        <div className="game-topbar"><div className="location-tag"><i/><span>办公室 · 无限下班路</span><span className="location-code">F / 09</span></div><div className="game-tools"><button aria-label={muted ? '开启音效' : '关闭音效'} title={muted ? '开启音效' : '关闭音效'} onClick={() => { setMuted(!muted); sound.current?.setEnabled(muted); sound.current?.unlock(); }}>{muted ? <VolumeX size={18}/> : <Volume2 size={18}/>}</button><button aria-label={full ? '退出全屏' : '全屏游戏'} title="全屏游戏" onClick={toggleFull}>{full ? <Minimize size={18}/> : <Maximize size={18}/>}</button>{active && <button aria-label={hud.phase === 'paused' ? '继续游戏' : '暂停游戏'} disabled={hud.phase === 'over'} onClick={pause}>{hud.phase === 'paused' ? <Play size={18}/> : <Pause size={18}/>}</button>}</div></div>
        {active && <div className="hud"><div className="score-block"><span>逃离得分</span><strong>{String(hud.score).padStart(5, '0')}</strong></div><div className="hud-small"><span><Fish size={19}/> <b>{hud.fish}</b></span><i/><span><Footprints size={17}/> <b>{hud.distance}<small> m</small></b></span></div></div>}
        {hud.phase === 'ready' && !help && <div className="start-panel"><div className="chapter-tag"><span>01</span> THE GREAT ESCAPE</div><h2>办公室很大，<br/>小猫想<span>出去看看。</span></h2><p>老板还在开会，机会就是现在。<br/>绕过障碍、捡起小鱼，别让加班追上你。</p><button className="primary-button" onClick={begin} disabled={!!error}>开始逃离 <ArrowUpRight size={23}/></button><div className="start-hint"><span className="key">SPACE</span> 按空格键，立即出发</div><div className="cat-profile"><span className="cat-avatar">🐈</span><div><b>橘子 <span>· 资深摸鱼官</span></b><small>今日目标：准时下班，带鱼回家。</small></div><span className="profile-dot"/></div></div>}
        {hud.phase === 'ready' && <div className="scene-caption"><span className="caption-line"/><span>MEET YOUR LITTLE ESCAPE ARTIST</span><strong>四只爪子，<br/>一颗不想上班的心。</strong></div>}
        {toast && hud.phase === 'running' && <div className="pickup-toast"><Sparkles size={19}/>{toast}</div>}
        {hud.phase === 'running' && <><div className="speed-badge"><span className="speed-bars">▂▅▇</span><b>{(hud.speed / 10).toFixed(1)}×</b><span>摸鱼速度</span></div><div className="mobile-controls"><button aria-label="向左换道" onPointerDown={e => { e.stopPropagation(); action('left'); }}><ArrowLeft/></button><button className="jump-button" aria-label="跳跃" onPointerDown={e => { e.stopPropagation(); action('jump'); }}><ArrowUp/><span>跳跃</span></button><button aria-label="向右换道" onPointerDown={e => { e.stopPropagation(); action('right'); }}><ArrowRight/></button></div></>}
        {hud.phase === 'paused' && !help && <div className="modal-shade"><div className="result-panel"><span className="result-icon"><Coffee size={30}/></span><div className="eyebrow">A LITTLE COFFEE BREAK</div><h2>摸鱼中，稍等一下。</h2><p>小猫正在休息，办公室不会偷偷前进。</p><button className="primary-button" onClick={pause}>继续逃离 <Play size={20}/></button><button className="text-button" onClick={() => setHelp(true)}>查看操作说明</button></div></div>}
        {hud.phase === 'over' && <div className="modal-shade"><div className="result-panel"><span className="result-icon">🐾</span><div className="eyebrow">BUSTED. BUT STILL CUTE.</div><h2>哎呀，被工位拦住了。</h2><p>今天的逃离计划差一点点，再跑一次吧。</p><div className="result-score"><span>本次得分</span><strong>{hud.score.toLocaleString()}</strong>{hud.score >= best && hud.score > 0 && <em><Trophy size={13}/> 个人最佳</em>}</div><div className="result-stats"><span><Footprints size={17}/>{hud.distance} 米</span><span><Fish size={18}/>{hud.fish} 条小鱼</span></div><button className="primary-button" onClick={begin}>再逃一次 <RotateCcw size={19}/></button><span className="retry-hint">也可以按空格键重新开始</span></div></div>}
        {help && <div className="modal-shade"><div className="result-panel help-panel"><button className="close-button" aria-label="关闭说明" onClick={() => setHelp(false)}><X size={20}/></button><span className="result-icon"><Keyboard size={29}/></span><h2>下班，只需三步。</h2><div className="help-rows"><p><b>← → / A D</b><span>左右换道，躲开高推车</span></p><p><b>↑ / W / 空格</b><span>跳过纸箱和办公椅</span></p><p><b>手机滑动 / 按钮</b><span>左右滑换道，上滑或轻触跳跃</span></p><p><b>ESC / P</b><span>暂停或继续游戏</span></p></div><p className="scoring-note">每跑 1 米 +1 分 · 每条小鱼 +25 分<br/>跑得越远，速度越快。最高可达 2.3 倍。</p><button className="primary-button" onClick={() => setHelp(false)}>明白了 <ArrowRight size={18}/></button></div></div>}
        {error && <div className="modal-shade"><div className="result-panel"><h2>场景启动失败</h2><p role="alert">{error}</p><button className="primary-button" onClick={() => location.reload()}>刷新重试 <RotateCcw size={19}/></button></div></div>}
        <div className="game-bottom-note"><span><span className="tiny-dot"/> {hud.phase === 'ready' ? '3D ENDLESS RUNNER' : hud.phase === 'running' ? 'THE ESCAPE IS ON' : 'TAKE YOUR TIME'}</span><span>MADE FOR A LITTLE FREEDOM</span></div>
      </section>
      <div className="instruction-strip"><div className="instruction-title"><span className="small-paw"><Footprints size={21}/></span><div><b>下班生存指南</b><span>简单上手，即刻开溜</span></div></div><div className="instruction-item"><span className="key">←</span><span className="key">→</span><span>左右换道</span></div><div className="instruction-item"><span className="key wide">SPACE</span><span>轻盈一跃</span></div><div className="instruction-item fish-guide"><Fish size={23}/><span>小鱼 +25 分</span></div><button className="guide-button" onClick={() => { if (game.current.phase === 'running') { game.current.phase = 'paused'; sync(); } setHelp(true); }}>完整玩法 <ArrowUpRight size={15}/></button><span className="touch-guide"><Smartphone size={17}/> 支持滑动与触屏按钮</span></div>
      <footer><span><Heart size={13}/> 献给每一个想准时下班的你。</span><span>NO MEETINGS. JUST MEOWS. <span className="footer-paw">✳</span></span></footer>
    </main>
  </div>;
}
const root = import.meta.hot?.data.root ?? createRoot(document.getElementById('root'));
root.render(<App/>);
if (import.meta.hot) import.meta.hot.data.root = root;
