"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Play, Pause, Square, Plus, Trash2, Clock, Mic, Users, Settings } from "lucide-react";
import { updateSessionMode, addSpeaker, updateSpeakerStatus, removeSpeaker, startTimer, pauseTimer, resetTimer } from "@/lib/mun/actions/session";
import { useRouter } from "next/navigation";

export function LiveSessionClient({ session: initialSession, portfolios, committeeId }: { session: any, portfolios: any[], committeeId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [session, setSession] = useState(initialSession);
  const [isPending, startTransition] = useTransition();
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [customDuration, setCustomDuration] = useState(60); // default 60s
  
  // Setup Real-time
  useEffect(() => {
    const channel = supabase.channel(`session_${session.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mun_sessions', filter: `id=eq.${session.id}` }, (payload) => {
        setSession((prev: any) => ({ ...prev, ...payload.new }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mun_speakers', filter: `session_id=eq.${session.id}` }, () => {
        router.refresh(); // Fetch new speakers from server (simplest way to get relations)
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session.id, router, supabase]);

  // Update timer display
  useEffect(() => {
    if (session.timer_paused_remaining !== null && session.timer_paused_remaining !== undefined) {
      setTimeLeft(session.timer_paused_remaining);
      return;
    }

    if (!session.timer_started_at || !session.speaker_time_seconds) {
      setTimeLeft(session.speaker_time_seconds || 0);
      return;
    }

    const interval = setInterval(() => {
      const started = new Date(session.timer_started_at).getTime();
      const elapsed = Math.floor((Date.now() - started) / 1000);
      const remaining = Math.max(0, session.speaker_time_seconds - elapsed);
      setTimeLeft(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [session.timer_started_at, session.timer_paused_remaining, session.speaker_time_seconds]);

  const handleModeChange = (mode: string) => {
    startTransition(async () => {
      await updateSessionMode(session.id, mode, committeeId);
    });
  };

  const handleStartTimer = () => {
    startTransition(async () => {
      await startTimer(session.id, customDuration, committeeId);
    });
  };

  const handleAddSpeaker = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const portfolioId = e.target.value;
    if (!portfolioId) return;
    startTransition(async () => {
      await addSpeaker(session.id, portfolioId, committeeId);
    });
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] font-sans selection:bg-[#DDFE55] selection:text-[#1B1C20] flex flex-col">
      <header className="bg-[#1B1C20] text-white p-4 flex items-center justify-between border-b-4 border-[#DDFE55]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#DDFE55] text-[#1B1C20] flex items-center justify-center">
            <Mic size={20} />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tight uppercase">Live Session</h1>
            <p className="text-[#C1C2C7] text-xs font-semibold uppercase">{session.mode.replace(/_/g, " ")}</p>
          </div>
        </div>
        
        <select 
          value={session.mode} 
          onChange={(e) => handleModeChange(e.target.value)}
          className="bg-white/10 text-white border-2 border-white/20 rounded-lg px-4 py-2 text-sm font-bold uppercase cursor-pointer"
        >
          <option value="ROLL_CALL" className="text-black">Roll Call</option>
          <option value="GSL" className="text-black">General Speaker's List</option>
          <option value="MODERATED_CAUCUS" className="text-black">Moderated Caucus</option>
          <option value="UNMODERATED_CAUCUS" className="text-black">Unmoderated Caucus</option>
          <option value="VOTING" className="text-black">Voting Block</option>
        </select>
      </header>

      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto w-full">
        {/* Left Column: Timer & Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="neo-card bg-white p-6 border-[3px] border-[#1B1C20] shadow-[6px_6px_0px_#1B1C20]">
            <h2 className="text-xl font-black uppercase text-[#1B1C20] mb-6 flex items-center gap-2">
              <Clock size={20} /> Master Timer
            </h2>
            
            <div className="text-center bg-[#f3f4f6] rounded-2xl py-8 mb-6 border-2 border-[#e5e7eb]">
              <span className="text-6xl font-black tracking-tighter tabular-nums text-[#1B1C20]">
                {Math.floor((timeLeft || 0) / 60).toString().padStart(2, '0')}:
                {((timeLeft || 0) % 60).toString().padStart(2, '0')}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <input 
                  type="number" 
                  value={customDuration}
                  onChange={(e) => setCustomDuration(Number(e.target.value))}
                  className="neo-badge w-full px-3 py-2 text-center font-bold text-lg"
                />
                <span className="text-xs font-bold text-gray-500 self-center">SEC</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={handleStartTimer}
                  className="bg-[#DDFE55] hover:bg-[#cbe849] text-[#1B1C20] p-3 rounded-xl border-2 border-[#1B1C20] shadow-[2px_2px_0px_#1B1C20] flex items-center justify-center transition-transform hover:-translate-y-0.5"
                >
                  <Play size={20} />
                </button>
                <button 
                  onClick={() => startTransition(async () => pauseTimer(session.id, committeeId, timeLeft || 0))}
                  className="bg-[#FFA500] hover:bg-[#e69500] text-[#1B1C20] p-3 rounded-xl border-2 border-[#1B1C20] shadow-[2px_2px_0px_#1B1C20] flex items-center justify-center transition-transform hover:-translate-y-0.5"
                >
                  <Pause size={20} />
                </button>
                <button 
                  onClick={() => startTransition(async () => resetTimer(session.id, committeeId))}
                  className="bg-white hover:bg-gray-50 text-red-500 p-3 rounded-xl border-2 border-[#1B1C20] shadow-[2px_2px_0px_#1B1C20] flex items-center justify-center transition-transform hover:-translate-y-0.5"
                >
                  <Square size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Speakers List */}
        <div className="lg:col-span-2">
          <div className="neo-card bg-white p-6 border-[3px] border-[#1B1C20] shadow-[6px_6px_0px_#1B1C20] h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black uppercase text-[#1B1C20] flex items-center gap-2">
                <Users size={20} /> Speakers List
              </h2>
              
              <select 
                onChange={handleAddSpeaker}
                className="neo-badge px-3 py-2 text-sm font-bold bg-[#f3f4f6] border border-[#e5e7eb] cursor-pointer"
                defaultValue=""
              >
                <option value="" disabled>+ Add Portfolio</option>
                {portfolios.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {session.speakers?.length === 0 && (
                <div className="h-full flex items-center justify-center flex-col text-gray-400">
                  <Mic size={48} className="mb-4 opacity-50" />
                  <p className="font-bold">No speakers added yet.</p>
                </div>
              )}
              
              {session.speakers?.map((s: any, idx: number) => (
                <div key={s.id} className={`flex items-center justify-between p-4 rounded-2xl border-2 ${s.status === 'SPEAKING' ? 'border-[#4F46E5] bg-[#E0E7FF]' : s.status === 'DONE' ? 'border-gray-200 bg-gray-50 opacity-60' : 'border-[#1B1C20] bg-white'}`}>
                  <div className="flex items-center gap-4">
                    <span className="font-black text-xl text-gray-400 w-6">{idx + 1}.</span>
                    <div>
                      <p className="font-bold text-[#1B1C20]">{s.mun_portfolios?.name}</p>
                      <p className="text-xs font-semibold uppercase text-gray-500">{s.status}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {s.status === 'WAITING' && (
                      <button 
                        onClick={() => startTransition(async () => updateSpeakerStatus(s.id, 'SPEAKING', committeeId))}
                        className="bg-[#DDFE55] text-[#1B1C20] px-4 py-1.5 rounded-lg border border-[#1B1C20] shadow-[2px_2px_0px_#1B1C20] text-xs font-bold"
                      >
                        YIELD FLOOR
                      </button>
                    )}
                    {s.status === 'SPEAKING' && (
                      <button 
                        onClick={() => startTransition(async () => updateSpeakerStatus(s.id, 'DONE', committeeId))}
                        className="bg-black text-white px-4 py-1.5 rounded-lg border border-[#1B1C20] shadow-[2px_2px_0px_#1B1C20] text-xs font-bold"
                      >
                        FINISH
                      </button>
                    )}
                    <button 
                      onClick={() => startTransition(async () => removeSpeaker(s.id, committeeId))}
                      className="text-red-400 hover:text-red-500 p-1.5"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
