"use client";
import { useState, useTransition, useCallback } from "react";
import { Layers, Plus, Upload, X, Trash2, Edit, Play, Save, ChevronDown, ChevronUp, AlertTriangle, CheckSquare, Square } from "lucide-react";
import { useRouter } from "next/navigation";

interface PortfolioItem { id: string; name: string; capacity: number; committee_id: string }
interface CommitteeItem { id: string; name: string; short_name: string; type: string; max_delegates: number; portfolio_type: string; session_format: string; theme?: string; portfolios?: PortfolioItem[] }
type ConfirmAction = { title: string; message: string; onConfirm: () => void; destructive?: boolean } | null;

function ConfirmModal({ action, onClose }: { action: NonNullable<ConfirmAction>; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#1B1C20]/60 backdrop-blur-sm" onClick={onClose}>
      <div className="neo-card bg-white p-6 max-w-md w-full border-2 border-[#1B1C20] shadow-[6px_6px_0px_#1B1C20]" onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-4">
          <div className={`p-2 rounded-lg ${action.destructive ? "bg-red-50" : "bg-amber-50"}`}>
            <AlertTriangle size={20} className={action.destructive ? "text-red-500" : "text-amber-500"} />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#1B1C20]">{action.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{action.message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="neo-badge px-5 py-2 text-sm font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">Cancel</button>
          <button onClick={() => { action.onConfirm(); onClose(); }} className={`neo-badge px-5 py-2 text-sm font-bold transition-colors ${action.destructive ? "bg-red-500 text-white hover:bg-red-600" : "bg-[#DDFE55] text-[#1B1C20] hover:bg-[#cbe849]"}`}>
            {action.destructive ? "Delete" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CommitteeManager({ conferenceId, committees }: { conferenceId: string; committees: CommitteeItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMatrixModal, setShowMatrixModal] = useState<string | null>(null);
  const [editingCommittee, setEditingCommittee] = useState<string | null>(null);
  const [expandedCommittee, setExpandedCommittee] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string | number>>({});
  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [newPortfolioCap, setNewPortfolioCap] = useState(1);
  const [editingPortfolio, setEditingPortfolio] = useState<string | null>(null);
  const [editPortfolioForm, setEditPortfolioForm] = useState({ name: "", capacity: 1 });
  const [csvText, setCsvText] = useState("");
  const [parsedMatrix, setParsedMatrix] = useState<{ name: string; capacity: number; isDuplicate?: boolean }[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [selectedPortfolios, setSelectedPortfolios] = useState<Set<string>>(new Set());
  const [duplicateFlag, setDuplicateFlag] = useState<string | null>(null);

  const doAction = useCallback((fn: () => Promise<void>) => {
    setActionError(null);
    startTransition(async () => {
      try { await fn(); router.refresh(); } catch (err: any) { setActionError(err.message || "Action failed"); }
    });
  }, [router]);

  const handleParseCsv = () => {
    if (!showMatrixModal) return;
    const c = committees.find(x => x.id === showMatrixModal);
    const existingNames = new Set((c?.portfolios || []).map(p => p.name.toLowerCase()));
    
    const lines = csvText.split("\n").filter(l => l.trim());
    const parsed: { name: string; capacity: number; isDuplicate?: boolean }[] = [];
    const seenInCsv = new Set<string>();

    for (const line of lines) {
      const parts = line.split(",");
      const name = parts[0]?.trim() || "Unknown";
      const cap = parts[1] ? parseInt(parts[1].trim()) : 1;
      
      const lowerName = name.toLowerCase();
      const isDuplicate = existingNames.has(lowerName) || seenInCsv.has(lowerName);
      if (!isDuplicate) {
        seenInCsv.add(lowerName);
      }
      
      parsed.push({ name, capacity: isNaN(cap) ? 1 : cap, isDuplicate });
    }
    setParsedMatrix(parsed);
  };

  const handleAddSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    doAction(async () => { const { addCommittee } = await import("@/lib/mun/actions/conference"); await addCommittee(conferenceId, fd); setShowAddModal(false); });
  };

  const handleEditCommittee = (c: CommitteeItem) => {
    setEditingCommittee(c.id);
    setEditForm({ name: c.name, short_name: c.short_name, type: c.type, max_delegates: c.max_delegates, portfolio_type: c.portfolio_type, session_format: c.session_format });
  };

  const saveCommitteeEdit = (id: string) => doAction(async () => { const { updateCommittee } = await import("@/lib/mun/actions/conference"); await updateCommittee(id, editForm); setEditingCommittee(null); });

  const handleDeleteCommittee = (id: string, name: string) => setConfirmAction({ title: "Delete Committee", message: `This will permanently delete "${name}" and ALL its portfolios, EB roles, and checklists. This cannot be undone.`, destructive: true, onConfirm: () => doAction(async () => { const { deleteCommittee } = await import("@/lib/mun/actions/conference"); await deleteCommittee(id); }) });

  const handleAddPortfolio = (committeeId: string) => {
    if (!newPortfolioName.trim()) return;
    const c = committees.find(x => x.id === committeeId);
    const exists = c?.portfolios?.some(p => p.name.toLowerCase() === newPortfolioName.trim().toLowerCase());
    if (exists) { setDuplicateFlag(newPortfolioName.trim()); return; }
    setDuplicateFlag(null);
    doAction(async () => { const { addPortfolio } = await import("@/lib/mun/actions/conference"); await addPortfolio(committeeId, newPortfolioName.trim(), newPortfolioCap); setNewPortfolioName(""); setNewPortfolioCap(1); });
  };

  const handleDeletePortfolio = (id: string, name: string) => setConfirmAction({ title: "Remove Portfolio", message: `Remove "${name}"? Any delegate allotted to this portfolio will be unassigned.`, destructive: true, onConfirm: () => doAction(async () => { const { deletePortfolio } = await import("@/lib/mun/actions/conference"); await deletePortfolio(id, conferenceId); }) });

  const handleBulkDelete = () => {
    if (selectedPortfolios.size === 0) return;
    setConfirmAction({ title: "Bulk Delete Portfolios", message: `Delete ${selectedPortfolios.size} selected portfolio(s)? Delegates allotted to them will be unassigned.`, destructive: true, onConfirm: () => doAction(async () => { const { bulkDeletePortfolios } = await import("@/lib/mun/actions/conference"); await bulkDeletePortfolios([...selectedPortfolios], conferenceId); setSelectedPortfolios(new Set()); }) });
  };

  const handleSavePortfolioEdit = (id: string) => doAction(async () => { const { updatePortfolio } = await import("@/lib/mun/actions/conference"); await updatePortfolio(id, editPortfolioForm); setEditingPortfolio(null); });

  const uploadMatrix = (cId: string) => { 
    const validEntries = parsedMatrix.filter(p => !p.isDuplicate);
    if (!validEntries.length) return; 
    doAction(async () => { 
      const { uploadPortfolioMatrix } = await import("@/lib/mun/actions/conference"); 
      await uploadPortfolioMatrix(cId, validEntries); 
      setShowMatrixModal(null); 
      setCsvText(""); 
      setParsedMatrix([]); 
    }); 
  };

  const togglePortfolioSelection = (id: string) => { const next = new Set(selectedPortfolios); next.has(id) ? next.delete(id) : next.add(id); setSelectedPortfolios(next); };
  const toggleSelectAll = (portfolios: PortfolioItem[]) => {
    const allSelected = portfolios.every(p => selectedPortfolios.has(p.id));
    const next = new Set(selectedPortfolios);
    portfolios.forEach(p => allSelected ? next.delete(p.id) : next.add(p.id));
    setSelectedPortfolios(next);
  };

  const TYPE_OPTIONS = [["UN_GENERAL","UN General"],["UN_SPECIALIZED","UN Specialized"],["INDIAN_PARLIAMENT","Indian Parliament"],["CRISIS","Crisis"],["JOINT_CRISIS","Joint Crisis"],["UN_SECURITY","UN Security"],["INDIAN_CABINET","Indian Cabinet"],["PRESS_CORP","Press Corp"],["FICTIONAL","Fictional"],["CUSTOM","Custom"]];
  const PT_OPTIONS = [["COUNTRY","Countries"],["PERSON","Persons"],["ROLE","Roles"],["TEAM","Teams"],["CUSTOM","Custom"]];
  const SF_OPTIONS = [["STANDARD","Standard"],["CRISIS","Crisis"],["CONTINUOUS_CRISIS","Continuous Crisis"],["HYBRID","Hybrid"]];

  return (
    <div className="space-y-6">
      {confirmAction && <ConfirmModal action={confirmAction} onClose={() => setConfirmAction(null)} />}

      {actionError && (
        <div className="neo-badge bg-red-50 text-red-700 px-4 py-3 text-sm font-medium flex justify-between items-center">
          <span>{actionError}</span><button onClick={() => setActionError(null)}><X size={14} /></button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#1B1C20] flex items-center gap-2"><Layers size={20} /> Dynamic Committee Engine</h2>
        <button onClick={() => setShowAddModal(true)} className="neo-btn bg-[#DDFE55] text-[#1B1C20] px-6 py-2.5 font-bold text-sm flex items-center gap-2"><Plus size={16} /> Add Committee</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {committees.map(c => (
          <div key={c.id} className="neo-card bg-white relative border-[2px] border-[#1B1C20] shadow-[4px_4px_0px_#1B1C20]">
            <div className="p-6">
              {editingCommittee === c.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input value={editForm.name as string} onChange={e => setEditForm({...editForm, name: e.target.value})} className="neo-badge px-3 py-2 bg-gray-50 text-sm w-full" placeholder="Full Name" />
                    <input value={editForm.short_name as string} onChange={e => setEditForm({...editForm, short_name: e.target.value})} className="neo-badge px-3 py-2 bg-gray-50 text-sm w-full" placeholder="Short Name" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <select value={editForm.type as string} onChange={e => setEditForm({...editForm, type: e.target.value})} className="neo-badge px-2 py-2 bg-gray-50 text-xs">
                      {TYPE_OPTIONS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    <select value={editForm.portfolio_type as string} onChange={e => setEditForm({...editForm, portfolio_type: e.target.value})} className="neo-badge px-2 py-2 bg-gray-50 text-xs">
                      {PT_OPTIONS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    <input type="number" value={editForm.max_delegates as number} onChange={e => setEditForm({...editForm, max_delegates: Number(e.target.value)})} className="neo-badge px-2 py-2 bg-gray-50 text-xs" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => saveCommitteeEdit(c.id)} disabled={isPending} className="neo-btn bg-[#22C55E] text-white px-4 py-1.5 text-xs font-bold flex items-center gap-1"><Save size={12} /> {isPending ? "Saving..." : "Save"}</button>
                    <button onClick={() => setEditingCommittee(null)} className="neo-btn bg-gray-200 text-gray-700 px-4 py-1.5 text-xs font-bold">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-4">
                    <div><h3 className="text-xl font-black text-[#1B1C20] uppercase">{c.short_name}</h3><p className="text-sm font-semibold text-gray-500">{c.name}</p></div>
                    <div className="flex items-center gap-2">
                      <span className="neo-badge px-2 py-1 text-[10px] bg-gray-100 text-gray-600 uppercase">{c.type.replace(/_/g," ")}</span>
                      <button onClick={() => handleEditCommittee(c)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Edit"><Edit size={14} className="text-gray-500" /></button>
                      <button onClick={() => handleDeleteCommittee(c.id, c.short_name)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 size={14} className="text-red-400" /></button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-6 pt-4 border-t-2 border-dashed border-gray-200">
                    <button onClick={() => { setExpandedCommittee(expandedCommittee === c.id ? null : c.id); setSelectedPortfolios(new Set()); setDuplicateFlag(null); }} className="text-xs font-bold text-gray-500 flex items-center gap-1 hover:text-[#1B1C20] transition-colors">
                      {c.portfolios?.length || 0} Portfolios {expandedCommittee === c.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                    <div className="flex gap-2">
                      <button onClick={() => setShowMatrixModal(c.id)} className="text-xs font-bold bg-[#f3f4f6] text-[#1B1C20] px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-[#e5e7eb] border border-[#d1d5db] transition-colors"><Upload size={14} /> Matrix</button>
                      <button onClick={() => router.push(`/mun/session/${c.id}`)} className="text-xs font-bold bg-[#DDFE55] text-[#1B1C20] px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-[#cbe849] border border-[#1B1C20] shadow-[2px_2px_0px_#1B1C20] transition-colors"><Play size={14} /> Live Session</button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Expanded Portfolio Panel */}
            {expandedCommittee === c.id && (
              <div className="border-t-2 border-[#1B1C20] bg-[#fafafa] p-4">
                {/* Add row + duplicate flag */}
                <div className="flex items-center gap-2 mb-2">
                  <input value={newPortfolioName} onChange={e => { setNewPortfolioName(e.target.value); setDuplicateFlag(null); }} placeholder="New portfolio name" className={`neo-badge flex-1 px-3 py-2 bg-white text-xs ${duplicateFlag ? "ring-2 ring-red-400" : ""}`} />
                  <input type="number" value={newPortfolioCap} onChange={e => setNewPortfolioCap(Number(e.target.value))} min={1} max={10} className="neo-badge w-16 px-2 py-2 bg-white text-xs text-center" />
                  <button onClick={() => handleAddPortfolio(c.id)} disabled={isPending || !newPortfolioName.trim()} className="neo-badge bg-[#DDFE55] px-3 py-2 text-xs font-bold disabled:opacity-40"><Plus size={12} /></button>
                </div>
                {duplicateFlag && <p className="text-xs text-red-500 font-bold mb-2 flex items-center gap-1"><AlertTriangle size={12} /> &quot;{duplicateFlag}&quot; already exists in this committee.</p>}

                {/* Bulk actions bar */}
                {(c.portfolios?.length || 0) > 0 && (
                  <div className="flex items-center justify-between mb-2">
                    <button onClick={() => toggleSelectAll(c.portfolios || [])} className="text-[10px] font-bold text-gray-400 hover:text-[#1B1C20] flex items-center gap-1">
                      {c.portfolios?.every(p => selectedPortfolios.has(p.id)) ? <CheckSquare size={12} /> : <Square size={12} />} Select All
                    </button>
                    {selectedPortfolios.size > 0 && (
                      <button onClick={handleBulkDelete} className="neo-badge bg-red-500 text-white px-3 py-1 text-[10px] font-bold flex items-center gap-1 hover:bg-red-600 transition-colors">
                        <Trash2 size={10} /> Delete {selectedPortfolios.size} Selected
                      </button>
                    )}
                  </div>
                )}

                <div className="max-h-64 overflow-y-auto space-y-1">
                  {(c.portfolios || []).map(p => (
                    <div key={p.id} className={`flex items-center gap-2 bg-white neo-badge px-3 py-2 text-xs group ${selectedPortfolios.has(p.id) ? "ring-2 ring-[#DDFE55]" : ""}`}>
                      <button onClick={() => togglePortfolioSelection(p.id)} className="shrink-0">
                        {selectedPortfolios.has(p.id) ? <CheckSquare size={14} className="text-[#DDFE55]" /> : <Square size={14} className="text-gray-300" />}
                      </button>
                      {editingPortfolio === p.id ? (
                        <>
                          <input value={editPortfolioForm.name} onChange={e => setEditPortfolioForm({...editPortfolioForm, name: e.target.value})} className="flex-1 bg-gray-50 px-2 py-1 text-xs border border-gray-200 rounded" />
                          <input type="number" value={editPortfolioForm.capacity} onChange={e => setEditPortfolioForm({...editPortfolioForm, capacity: Number(e.target.value)})} min={1} max={10} className="w-14 bg-gray-50 px-2 py-1 text-xs border border-gray-200 rounded text-center" />
                          <button onClick={() => handleSavePortfolioEdit(p.id)} className="text-[#22C55E] hover:text-[#16a34a]"><Save size={12} /></button>
                          <button onClick={() => setEditingPortfolio(null)} className="text-gray-400 hover:text-gray-600"><X size={12} /></button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 font-medium text-[#1B1C20]">{p.name}</span>
                          <span className="text-gray-400">cap: {p.capacity}</span>
                          <button onClick={() => { setEditingPortfolio(p.id); setEditPortfolioForm({ name: p.name, capacity: p.capacity }); }} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-[#1B1C20] transition-opacity"><Edit size={11} /></button>
                          <button onClick={() => handleDeletePortfolio(p.id, p.name)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"><Trash2 size={11} /></button>
                        </>
                      )}
                    </div>
                  ))}
                  {(!c.portfolios || c.portfolios.length === 0) && <p className="text-center text-gray-400 text-xs py-4">No portfolios yet.</p>}
                </div>
              </div>
            )}
          </div>
        ))}
        {committees.length === 0 && <div className="col-span-full neo-card bg-[#f3f4f6] p-12 text-center border-dashed border-2 border-gray-300"><Layers size={48} className="mx-auto text-gray-400 mb-4" /><p className="text-gray-500 font-bold">No committees created yet.</p></div>}
      </div>

      {/* Add Committee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B1C20]/50 backdrop-blur-sm">
          <form onSubmit={handleAddSubmit} className="neo-card bg-white p-8 max-w-lg w-full">
            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold">Create Committee</h3><button type="button" onClick={() => setShowAddModal(false)}><X size={20} /></button></div>
            <div className="space-y-4">
              <div><label className="block text-xs font-bold mb-1">Committee Name</label><input name="name" required placeholder="e.g. UNGA" className="neo-badge w-full px-3 py-2 bg-gray-50 text-sm" /></div>
              <div><label className="block text-xs font-bold mb-1">Short Name</label><input name="short_name" required placeholder="e.g. UNGA" className="neo-badge w-full px-3 py-2 bg-gray-50 text-sm" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1">Type</label><select name="type" className="neo-badge w-full px-3 py-2 bg-gray-50 text-sm">{TYPE_OPTIONS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></div>
                <div><label className="block text-xs font-bold mb-1">Max Delegates</label><input name="max_delegates" type="number" defaultValue={30} className="neo-badge w-full px-3 py-2 bg-gray-50 text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1">Portfolio Type</label><select name="portfolio_type" className="neo-badge w-full px-3 py-2 bg-gray-50 text-sm">{PT_OPTIONS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></div>
                <div><label className="block text-xs font-bold mb-1">Session Format</label><select name="session_format" className="neo-badge w-full px-3 py-2 bg-gray-50 text-sm">{SF_OPTIONS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></div>
              </div>
            </div>
            <button type="submit" disabled={isPending} className="neo-btn bg-[#1B1C20] text-white w-full py-3 mt-6 font-bold">{isPending ? "Creating..." : "Save Committee"}</button>
          </form>
        </div>
      )}

      {/* Matrix Upload Modal */}
      {showMatrixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B1C20]/50 backdrop-blur-sm">
          <div className="neo-card bg-white p-8 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold">Upload Portfolio Matrix</h3><button onClick={() => setShowMatrixModal(null)}><X size={20} /></button></div>
            <p className="text-sm text-gray-500 mb-4">Paste CSV: <code>Portfolio Name, Capacity</code></p>
            <textarea value={csvText} onChange={e => setCsvText(e.target.value)} placeholder={"USA, 1\nRussia, 2"} className="neo-badge w-full h-40 p-4 bg-gray-50 font-mono text-sm resize-none mb-4" />
            <div className="flex gap-3 mb-6">
              <button onClick={handleParseCsv} className="neo-btn bg-[#f3f4f6] text-[#1B1C20] px-6 py-2 font-bold text-sm">Parse</button>
              <button disabled={!parsedMatrix.length || isPending} onClick={() => uploadMatrix(showMatrixModal)} className="neo-btn bg-[#DDFE55] text-[#1B1C20] px-6 py-2 font-bold text-sm flex items-center gap-2 disabled:opacity-50"><Upload size={16} /> {isPending ? "Uploading..." : `Upload ${parsedMatrix.length}`}</button>
            </div>
            {parsedMatrix.length > 0 && (
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500 sticky top-0">
                    <tr><th className="px-4 py-2">Portfolio</th><th className="px-4 py-2">Cap</th><th className="px-4 py-2">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {parsedMatrix.map((p,i) => (
                      <tr key={i} className={p.isDuplicate ? "bg-red-50/50" : ""}>
                        <td className="px-4 py-2 font-medium">{p.name}</td>
                        <td className="px-4 py-2 text-gray-500">{p.capacity}</td>
                        <td className="px-4 py-2">
                          {p.isDuplicate ? (
                            <span className="inline-flex items-center gap-1 text-red-600 font-medium text-xs"><AlertTriangle size={12} /> Duplicate</span>
                          ) : (
                            <span className="text-green-600 font-medium text-xs">Valid</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
