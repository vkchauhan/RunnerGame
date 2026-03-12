import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, Trophy, Zap, Image as ImageIcon, Sparkles, Download, Loader2, Pause, PlayCircle } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

import { GameOverScreen } from './components/GameOverScreen';

// --- Constants ---
const LANES = 3;
const LANE_WIDTH = 100;
const GAME_WIDTH = LANES * LANE_WIDTH;
const GAME_HEIGHT = 600;
const PLAYER_SIZE = 60;
const OBSTACLE_SIZE = 50;
const INITIAL_SPEED = 5;
const SPEED_INCREMENT = 0.5;
const DIFFICULTY_INTERVAL = 30000;

type GameState = 'MENU' | 'PLAYING' | 'GAMEOVER' | 'ASSETS' | 'PAUSED';

interface Entity {
  x: number;
  y: number;
  lane: number;
  type: 'cow' | 'rickshaw' | 'thela' | 'matka' | 'samosa';
}

const ASSET_PROMPTS = {
  rickshaw: "A side profile 2D vector of a yellow and green Indian auto-rickshaw, vibrant colors, high contrast, clean white background.",
  cow: "A side profile 2D vector of a white Indian cow standing, clean white background, vibrant colors.",
  thela: "A side profile 2D vector of an Indian street food cart (thela) with wooden wheels, clean white background, vibrant.",
  matka: "A side profile 2D vector of a group of brown clay pots (matkas), clean white background, terracotta color.",
  samosa: "A side profile 2D vector of a golden-brown crispy Indian samosa, vibrant, clean white background.",
  background: "A top-down view of a dark gray asphalt road with thick white dashed lane markings, vertically tiling, clean 2D vector style, high contrast.",
  player: "A side profile 2D vector of an Indian boy running, vibrant kurta, clean white background."
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [generatedAssets, setGeneratedAssets] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const gameRef = useRef({
    playerLane: 1,
    playerX: LANE_WIDTH + (LANE_WIDTH - PLAYER_SIZE) / 2,
    playerY: GAME_HEIGHT - 120,
    obstacles: [] as Entity[],
    speed: INITIAL_SPEED,
    lastDifficultyUpdate: 0,
    frameCount: 0,
    isJumping: false,
    isSliding: false,
    jumpTimer: 0,
    slideTimer: 0,
  });

  const generateAsset = async (key: keyof typeof ASSET_PROMPTS) => {
    setIsGenerating(key);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ text: ASSET_PROMPTS[key] }],
        config: { imageConfig: { aspectRatio: "1:1" } }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          setGeneratedAssets(prev => ({ ...prev, [key]: imageUrl }));
          break;
        }
      }
    } catch (error) {
      console.error("Asset generation failed:", error);
    } finally {
      setIsGenerating(null);
    }
  };

  const [isBootstrapping, setIsBootstrapping] = useState(false);

  const bootstrapAssets = async () => {
    setIsBootstrapping(true);
    const keys = Object.keys(ASSET_PROMPTS) as (keyof typeof ASSET_PROMPTS)[];
    for (const key of keys) {
      if (!generatedAssets[key]) {
        await generateAsset(key);
      }
    }
    setIsBootstrapping(false);
  };

  const startGame = () => {
    setScore(0);
    gameRef.current = {
      playerLane: 1,
      playerX: LANE_WIDTH + (LANE_WIDTH - PLAYER_SIZE) / 2,
      playerY: GAME_HEIGHT - 120,
      obstacles: [],
      speed: INITIAL_SPEED,
      lastDifficultyUpdate: Date.now(),
      frameCount: 0,
      isJumping: false,
      isSliding: false,
      jumpTimer: 0,
      slideTimer: 0,
    };
    setGameState('PLAYING');
  };

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    // Pre-load images
    const images: Record<string, HTMLImageElement> = {};
    Object.entries(generatedAssets).forEach(([key, url]) => {
      const img = new Image();
      img.src = url as string;
      images[key] = img;
    });

    const spawnObstacle = () => {
      const lane = Math.floor(Math.random() * LANES);
      const types: Entity['type'][] = ['cow', 'rickshaw', 'thela', 'matka', 'samosa'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      gameRef.current.obstacles.push({
        lane,
        x: lane * LANE_WIDTH + (LANE_WIDTH - OBSTACLE_SIZE) / 2,
        y: -OBSTACLE_SIZE,
        type
      });
    };

    const update = () => {
      const g = gameRef.current;
      g.frameCount++;

      if (Date.now() - g.lastDifficultyUpdate > DIFFICULTY_INTERVAL) {
        g.speed += SPEED_INCREMENT;
        g.lastDifficultyUpdate = Date.now();
      }

      const targetX = g.playerLane * LANE_WIDTH + (LANE_WIDTH - PLAYER_SIZE) / 2;
      g.playerX += (targetX - g.playerX) * 0.2;

      if (g.isJumping) {
        g.jumpTimer--;
        if (g.jumpTimer <= 0) g.isJumping = false;
      }
      if (g.isSliding) {
        g.slideTimer--;
        if (g.slideTimer <= 0) g.isSliding = false;
      }

      if (g.frameCount % Math.max(20, Math.floor(60 / (g.speed / 5))) === 0) {
        spawnObstacle();
      }

      for (let i = g.obstacles.length - 1; i >= 0; i--) {
        const obs = g.obstacles[i];
        obs.y += g.speed;

        const pRect = { x: g.playerX + 10, y: g.playerY + 10, w: PLAYER_SIZE - 20, h: PLAYER_SIZE - 20 };
        const oRect = { x: obs.x + 5, y: obs.y + 5, w: OBSTACLE_SIZE - 10, h: OBSTACLE_SIZE - 10 };

        if (
          pRect.x < oRect.x + oRect.w &&
          pRect.x + pRect.w > oRect.x &&
          pRect.y < oRect.y + oRect.h &&
          pRect.y + pRect.h > oRect.y
        ) {
          if (obs.type === 'samosa') {
            setScore(s => s + 10);
            g.obstacles.splice(i, 1);
          } else {
            const canAvoid = (obs.type === 'cow' && g.isJumping) || 
                             (obs.type === 'matka' && g.isJumping);
            
            if (!canAvoid) {
              setGameState('GAMEOVER');
              return;
            }
          }
        }

        if (obs.y > GAME_HEIGHT) {
          g.obstacles.splice(i, 1);
          if (obs.type !== 'samosa') setScore(s => s + 1);
        }
      }
    };

    const draw = () => {
      const g = gameRef.current;
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Draw Road / Background
      if (images.background) {
        const pattern = ctx.createPattern(images.background, 'repeat');
        if (pattern) {
          ctx.fillStyle = pattern;
          ctx.save();
          ctx.translate(0, (g.frameCount * g.speed) % images.background.height);
          ctx.fillRect(0, -images.background.height, GAME_WIDTH, GAME_HEIGHT + images.background.height);
          ctx.restore();
        }
      } else {
        // Fallback Road (Matching Reference Image)
        ctx.fillStyle = '#444'; // Dark asphalt gray
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        // Procedural Lane Markers
        ctx.fillStyle = '#AAA'; // Light gray/white markers
        const markerWidth = 10;
        const markerHeight = 60;
        const gap = 60;
        const offset = (g.frameCount * g.speed) % (markerHeight + gap);
        
        for (let i = 0; i <= LANES; i++) {
          const x = i * LANE_WIDTH - markerWidth / 2;
          for (let y = -markerHeight * 2; y < GAME_HEIGHT + markerHeight; y += markerHeight + gap) {
            ctx.fillRect(x, y + offset, markerWidth, markerHeight);
          }
        }
      }
      
      // Remove old thin lane markers logic as it's now handled above

      // Draw Player
      const playerDrawY = g.isJumping ? g.playerY - 40 : g.playerY;
      const playerDrawH = g.isSliding ? PLAYER_SIZE / 2 : PLAYER_SIZE;
      const playerDrawYOffset = g.isSliding ? PLAYER_SIZE / 2 : 0;

      if (images.player) {
        ctx.drawImage(images.player, g.playerX, playerDrawY + playerDrawYOffset, PLAYER_SIZE, playerDrawH);
      } else {
        ctx.fillStyle = g.isJumping ? '#FFD700' : g.isSliding ? '#FF4500' : '#007AFF';
        ctx.fillRect(g.playerX, playerDrawY + playerDrawYOffset, PLAYER_SIZE, playerDrawH);
      }

      // Draw Obstacles
      g.obstacles.forEach(obs => {
        const img = images[obs.type];
        if (img) {
          ctx.drawImage(img, obs.x, obs.y, OBSTACLE_SIZE, OBSTACLE_SIZE);
        } else {
          switch(obs.type) {
            case 'cow': ctx.fillStyle = '#F5F5F5'; break;
            case 'rickshaw': ctx.fillStyle = '#EAB308'; break;
            case 'thela': ctx.fillStyle = '#8B4513'; break;
            case 'matka': ctx.fillStyle = '#C2410C'; break;
            case 'samosa': ctx.fillStyle = '#F97316'; break;
          }
          ctx.fillRect(obs.x, obs.y, OBSTACLE_SIZE, OBSTACLE_SIZE);
        }
      });
    };

    const loop = () => {
      update();
      draw();
      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    const handleKeyDown = (e: KeyboardEvent) => {
      const g = gameRef.current;
      if (e.key === 'ArrowLeft' && g.playerLane > 0) g.playerLane--;
      if (e.key === 'ArrowRight' && g.playerLane < LANES - 1) g.playerLane++;
      if (e.key === 'ArrowUp' && !g.isJumping) {
        g.isJumping = true;
        g.jumpTimer = 30;
      }
      if (e.key === 'ArrowDown' && !g.isSliding) {
        g.isSliding = true;
        g.slideTimer = 30;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState, generatedAssets]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center font-sans text-white overflow-hidden p-4">
      <div className="flex flex-col lg:flex-row gap-8 items-center max-w-6xl w-full">
        
        {/* Game Container */}
        <div className="relative w-full max-w-[400px] aspect-[2/3] bg-[#1a1a1a] rounded-[2.5rem] shadow-[0_0_100px_rgba(249,115,22,0.1)] overflow-hidden border-8 border-[#222]">
          <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} className="w-full h-full block" />

          {/* HUD */}
          {gameState === 'PLAYING' && (
            <div className="absolute top-8 left-8 right-8 flex justify-between items-start pointer-events-none">
              <div className="bg-black/60 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/10">
                <p className="text-[10px] uppercase tracking-[0.2em] text-orange-500 font-black mb-0.5">Score</p>
                <p className="text-3xl font-black text-white">{score}</p>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <button 
                  onClick={() => setGameState('PAUSED')}
                  className="pointer-events-auto bg-black/60 backdrop-blur-xl p-3 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <Pause size={20} className="text-white" />
                </button>
                <div className="bg-black/60 backdrop-blur-xl p-3 rounded-2xl border border-white/10 flex items-center gap-2">
                  <Zap size={16} className="text-orange-500" />
                  <span className="text-sm font-black">{(gameRef.current.speed).toFixed(1)}x</span>
                </div>
              </div>
            </div>
          )}

          {/* Overlays */}
          <AnimatePresence>
            {gameState === 'PAUSED' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center p-10 text-center z-50">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                  <h2 className="text-5xl font-black tracking-tighter mb-8 text-white italic">GAME PAUSED</h2>
                  <button 
                    onClick={() => {
                      gameRef.current.lastDifficultyUpdate = Date.now(); // Reset timer to prevent sudden speed jump
                      setGameState('PLAYING');
                    }} 
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-5 px-12 rounded-3xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl shadow-orange-500/40"
                  >
                    <PlayCircle size={24} /> RESUME DASH
                  </button>
                </motion.div>
              </motion.div>
            )}
            {gameState === 'MENU' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-10 text-center">
                <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                  <h1 className="text-6xl font-black tracking-tighter mb-2 italic leading-none">
                    BAZAAR<br /><span className="text-orange-500">DASH</span>
                  </h1>
                  <p className="text-white/40 text-[10px] mb-12 uppercase tracking-[0.4em] font-bold">Street Food Runner</p>
                  
                  <div className="space-y-4 w-full max-w-[240px] mx-auto">
                    <button 
                      onClick={startGame} 
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-5 rounded-3xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl shadow-orange-500/40"
                    >
                      <Play fill="currentColor" size={24} /> START DASH
                    </button>
                    
                    {!Object.keys(generatedAssets).length ? (
                      <button 
                        onClick={bootstrapAssets}
                        disabled={isBootstrapping}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-3xl flex items-center justify-center gap-3 transition-all border border-white/10 relative overflow-hidden"
                      >
                        {isBootstrapping ? (
                          <>
                            <Loader2 className="animate-spin" size={18} />
                            SETTING UP...
                          </>
                        ) : (
                          <>
                            <Sparkles size={18} />
                            GENERATE ALL ASSETS
                          </>
                        )}
                        {isBootstrapping && (
                          <motion.div 
                            className="absolute bottom-0 left-0 h-1 bg-white/30"
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 15 }}
                          />
                        )}
                      </button>
                    ) : (
                      <button onClick={() => setGameState('ASSETS')} className="w-full bg-white/5 hover:bg-white/10 text-white/80 font-bold py-4 rounded-3xl flex items-center justify-center gap-3 transition-all border border-white/10">
                        <ImageIcon size={18} /> ASSET STUDIO
                      </button>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}

            {gameState === 'GAMEOVER' && (
              <GameOverScreen 
                score={score} 
                highScore={highScore} 
                onRetry={startGame} 
              />
            )}

            {gameState === 'ASSETS' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0f0f0f] flex flex-col p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black italic tracking-tight">ASSET <span className="text-orange-500">STUDIO</span></h2>
                  <button onClick={() => setGameState('MENU')} className="text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest">Back</button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                  {Object.keys(ASSET_PROMPTS).map((key) => (
                    <div key={key} className="bg-white/5 rounded-3xl p-5 border border-white/5 group">
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-xs font-black uppercase tracking-widest text-white/60">{key}</p>
                        {generatedAssets[key] && <Sparkles size={14} className="text-orange-500" />}
                      </div>
                      <div className="aspect-square bg-black/40 rounded-2xl mb-4 overflow-hidden border border-white/5 flex items-center justify-center relative">
                        {generatedAssets[key] ? (
                          <img src={generatedAssets[key]} alt={key} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center p-6">
                            <ImageIcon size={32} className="mx-auto mb-3 text-white/10" />
                            <p className="text-[10px] text-white/20 uppercase font-bold leading-relaxed">No asset generated yet</p>
                          </div>
                        )}
                        {isGenerating === key && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                            <Loader2 className="animate-spin text-orange-500" size={32} />
                          </div>
                        )}
                      </div>
                      <button 
                        disabled={!!isGenerating}
                        onClick={() => generateAsset(key as keyof typeof ASSET_PROMPTS)}
                        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-widest transition-all"
                      >
                        {isGenerating === key ? 'Generating...' : generatedAssets[key] ? 'Regenerate' : 'Generate Asset'}
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info Panel */}
        <div className="flex-1 max-w-md space-y-6">
          <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="text-orange-500" size={24} />
              <h3 className="text-xl font-black italic">INDIAN CONTEXT <span className="text-white/40">DESIGN</span></h3>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-xs font-black text-orange-500 uppercase tracking-widest mb-2">Tier 1 & 2 Cities</p>
                <p className="text-sm text-white/60 leading-relaxed">
                  Assets are designed to reflect the vibrant chaos of cities like Indore, Jaipur, or Mumbai. 
                  Expect yellow-green rickshaws, stray cows, and busy bazaar textures with Hindi signage.
                </p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-xs font-black text-orange-500 uppercase tracking-widest mb-2">Technical Strategy</p>
                <p className="text-sm text-white/60 leading-relaxed">
                  Using 2D Vector style ensures the <span className="text-white font-bold">APK size stays under 10MB</span> while maintaining high visual fidelity on budget 2GB RAM devices.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-orange-500/10 border border-orange-500/20 p-6 rounded-3xl">
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Optimization</p>
              <p className="text-2xl font-black">10MB</p>
              <p className="text-[10px] text-white/40 uppercase font-bold mt-1">Target APK Size</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Performance</p>
              <p className="text-2xl font-black">60FPS</p>
              <p className="text-[10px] text-white/40 uppercase font-bold mt-1">Budget Hardware</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(249,115,22,0.5); }
      `}</style>
    </div>
  );
}
