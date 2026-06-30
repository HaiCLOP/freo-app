"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, GripVertical, Plus, Trash2, Save, Loader2, Lock, Settings2, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { saveFormConfig, getFormConfig } from "./actions";

export type FieldType = "text" | "long_text" | "number" | "email" | "phone" | "dropdown" | "checkbox" | "radio" | "file_upload" | "date" | "time" | "rating" | "linear_scale" | "section_divider" | "image" | "page_break" | "checkbox_grid" | "hyperlink";

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  description?: string;
  required: boolean;
  locked: boolean;
  options?: string; // Comma separated for choice fields, or accepted extensions for file_upload
  gridRows?: string; // Comma separated rows for checkbox_grid
  validation?: any; // e.g. min, max
  logic?: any; // Conditional logic rules
}

const DEFAULT_FIELDS: FormField[] = [
  { id: "name", type: "text", label: "Full Name", placeholder: "Enter your full name", required: true, locked: true },
  { id: "phone", type: "phone", label: "Phone Number", placeholder: "10-digit mobile number", required: true, locked: true },
  { id: "email", type: "email", label: "Email Address", placeholder: "john@example.com", required: true, locked: true },
];

export default function FormBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [fields, setFields] = useState<FormField[]>(DEFAULT_FIELDS);
  const [isSaving, setIsSaving] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [lastSavedFields, setLastSavedFields] = useState<string>("");

  const [isFirstTimeBuilder, setIsFirstTimeBuilder] = useState(false);

  const [formSettings, setFormSettings] = useState<{ isClosed: boolean; closedMessage: string; waitlistEnabled: boolean }>({ isClosed: false, closedMessage: "", waitlistEnabled: false });
  const [lastSavedSettings, setLastSavedSettings] = useState<string>("");

  // AI State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiError, setAiError] = useState("");

  // Load Initial Config
  useEffect(() => {
    setIsMounted(true);
    async function loadConfig() {
      try {
        const savedData = await getFormConfig(resolvedParams.id);
        const localSaved = localStorage.getItem(`freo_builder_progress_${resolvedParams.id}`);
        
        let loadedFields = DEFAULT_FIELDS;
        let loadedSettings = { isClosed: false, closedMessage: "", waitlistEnabled: false };
        let hasCloudData = false;

        if (savedData) {
          if (savedData.form_config && Array.isArray(savedData.form_config) && savedData.form_config.length > 0) {
            loadedFields = savedData.form_config as FormField[];
            hasCloudData = true;
          }
          if (savedData.form_settings) {
            loadedSettings = {
              isClosed: savedData.form_settings.isClosed || false,
              closedMessage: savedData.form_settings.closedMessage || "",
              waitlistEnabled: savedData.form_settings.waitlistEnabled || false
            };
          }
        }

        // If no cloud data, try to recover from local storage
        if (!hasCloudData) {
          setIsFirstTimeBuilder(true);
          if (localSaved) {
            try {
              const parsed = JSON.parse(localSaved);
              if (parsed.fields && Array.isArray(parsed.fields)) {
                loadedFields = parsed.fields;
              }
              if (parsed.formSettings) {
                loadedSettings = parsed.formSettings;
              }
            } catch (e) {}
          }
        }

        setFields(loadedFields);
        setLastSavedFields(JSON.stringify(loadedFields));
        
        setFormSettings(loadedSettings);
        setLastSavedSettings(JSON.stringify(loadedSettings));
        
      } catch (err) {
        console.error("Failed to load existing form config:", err);
      }
    }
    loadConfig();
  }, [resolvedParams.id]);

  // Local Storage Backup
  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem(`freo_builder_progress_${resolvedParams.id}`, JSON.stringify({
      fields,
      formSettings
    }));
  }, [fields, formSettings, isMounted, resolvedParams.id]);

  // Auto-Save Cloud Sync
  useEffect(() => {
    if (!isMounted) return;
    
    const currentFieldsString = JSON.stringify(fields);
    const currentSettingsString = JSON.stringify(formSettings);
    
    if (currentFieldsString === lastSavedFields && currentSettingsString === lastSavedSettings) return; // No changes to save

    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        await saveFormConfig(resolvedParams.id, fields, formSettings);
        setLastSavedFields(currentFieldsString);
        setLastSavedSettings(currentSettingsString);
      } catch (err) {
        console.error("Auto-save failed", err);
      } finally {
        setIsSaving(false);
      }
    }, 1500); // 1.5 second debounce

    return () => clearTimeout(timer);
  }, [fields, formSettings, isMounted, resolvedParams.id, lastSavedFields, lastSavedSettings]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setFields(items);
  };

  const addField = () => {
    const newField: FormField = {
      id: `custom_${Date.now()}`,
      type: "text",
      label: "New Question",
      placeholder: "",
      required: false,
      locked: false,
    };
    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
  };

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiGenerating(true);
    setAiError("");
    try {
      const res = await fetch("/api/ai/generate-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate form");
      
      if (data.fields && Array.isArray(data.fields)) {
        setFields(data.fields);
        setShowAiModal(false);
        setAiPrompt("");
      }
    } catch (err: any) {
      setAiError(err.message || "Something went wrong.");
    } finally {
      setIsAiGenerating(false);
    }
  };

  if (!isMounted) return null;

  const selectedField = fields.find(f => f.id === selectedFieldId);

  return (
    <>
      <div className={`max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 pb-12`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/events`}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Advanced Form Builder</h1>
              <p className="text-sm sm:text-base text-gray-500">Design your perfect registration experience.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            {isSaving ? (
              <span className="text-xs sm:text-sm font-medium text-blue-500 flex items-center bg-blue-50 px-3 py-1.5 rounded-full">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Syncing...
              </span>
            ) : (
              <span className="text-xs sm:text-sm font-medium text-green-600 flex items-center bg-green-50 px-3 py-1.5 rounded-full">
                <Save className="w-4 h-4 mr-2" />
                Saved
              </span>
            )}
            <Button variant="outline" onClick={() => setShowAiModal(true)} className="rounded-xl border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800">
              <Sparkles className="w-4 h-4 mr-2" />
              Generate with AI
            </Button>
            <Button variant="outline" onClick={addField} className="rounded-xl border-dashed border-gray-300">
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
            {isFirstTimeBuilder && (
              <Link href={`/dashboard/events/${resolvedParams.id}/registrations`}>
                <Button className="rounded-xl bg-black hover:bg-gray-800 text-white shadow-sm">
                  Create Form
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* LEFT PANE: Editor (Draggable list) */}
          <div className="lg:col-span-2 space-y-4">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="form-fields">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3 min-h-[400px]">
                    {fields.map((field, index) => (
                      <Draggable key={field.id} draggableId={field.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            onClick={() => setSelectedFieldId(field.id)}
                            className={`flex items-center group cursor-pointer transition-all duration-200 border rounded-2xl bg-white ${
                              selectedFieldId === field.id 
                                ? "border-blue-500 shadow-md ring-1 ring-blue-500" 
                                : snapshot.isDragging 
                                  ? "shadow-xl border-primary/20 scale-[1.02]" 
                                  : "border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md"
                            }`}
                          >
                            <div 
                              {...provided.dragHandleProps} 
                              className="p-4 border-r border-transparent flex items-center justify-center text-gray-300 group-hover:text-gray-500 transition-colors"
                            >
                              <GripVertical className="w-5 h-5" />
                            </div>
                            <div className="flex-1 p-4 pl-2 flex flex-col justify-center">
                              {field.type === 'page_break' ? (
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 border-b-2 border-dashed border-gray-300"></div>
                                  <div className="mx-4 text-center">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full">Page Break / Next Button</span>
                                  </div>
                                  <div className="flex-1 border-b-2 border-dashed border-gray-300"></div>
                                </div>
                              ) : field.type === 'section_divider' ? (
                                <div className="py-2">
                                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                                    <h3 className="text-lg font-bold text-gray-900">{field.label || "Untitled Section"}</h3>
                                    <span className="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md">Section</span>
                                  </div>
                                  {field.description && <p className="text-sm text-gray-500 mt-2">{field.description}</p>}
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-gray-900">{field.label || "Untitled Question"}</span>
                                      {field.required && <span className="text-red-500 text-sm">*</span>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md capitalize">
                                        {field.type.replace('_', ' ')}
                                      </span>
                                      {field.locked && <Lock className="w-4 h-4 text-gray-400" />}
                                    </div>
                                  </div>
                                  {field.description && (
                                    <p className="text-sm text-gray-500 mt-1 truncate">{field.description}</p>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            
            <button
              onClick={addField}
              className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 font-medium hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 transition-all flex items-center justify-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add new question
            </button>

            {/* Visual Indicator for the end of the form */}
            <div className="mt-8 p-6 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center justify-between opacity-60">
              <div className="text-sm text-gray-500 font-medium tracking-wide uppercase">End of Form</div>
              <Button disabled className="rounded-xl px-8 h-12 bg-black text-white cursor-not-allowed">
                {fields.length > 0 && fields[fields.length - 1].type === "page_break" 
                  ? "Next Page" 
                  : "Submit Registration"}
              </Button>
            </div>
          </div>

          {/* RIGHT PANE: Properties */}
          <div className="col-span-1 lg:sticky lg:top-6">
            <Card className="rounded-2xl border-gray-200 shadow-xl overflow-hidden bg-white/50 backdrop-blur-xl">
              <CardContent className="p-0">
                {selectedField ? (
                  <div className="flex flex-col h-full">
                    <div className="p-4 border-b border-gray-100 bg-white flex items-center gap-2">
                      <Settings2 className="w-5 h-5 text-blue-500" />
                      <h3 className="font-bold text-gray-900">Field Properties</h3>
                    </div>
                    
                    <div className="p-6 space-y-6 bg-gray-50/30">
                      <div className="space-y-3">
                        <Label className="text-xs uppercase tracking-wider font-bold text-gray-500">Field Label</Label>
                        <Input 
                          value={selectedField.label} 
                          onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                          disabled={selectedField.locked}
                          className="bg-white"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label className="text-xs uppercase tracking-wider font-bold text-gray-500">Field Type</Label>
                        <Select 
                          value={selectedField.type} 
                          onValueChange={(val) => { if (val) updateField(selectedField.id, { type: val as FieldType }) }}
                          disabled={selectedField.locked}
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Short Text</SelectItem>
                            <SelectItem value="long_text">Paragraph Text</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="phone">Phone Number</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="dropdown">Dropdown</SelectItem>
                            <SelectItem value="radio">Multiple Choice (Radio)</SelectItem>
                            <SelectItem value="checkbox">Checkboxes</SelectItem>
                            <SelectItem value="date">Date Picker</SelectItem>
                            <SelectItem value="time">Time Picker</SelectItem>
                            <SelectItem value="rating">Rating (1-5)</SelectItem>
                            <SelectItem value="linear_scale">Linear Scale (1-10)</SelectItem>
                            <SelectItem value="file_upload">File Upload</SelectItem>
                            <SelectItem value="checkbox_grid">Checkbox Grid</SelectItem>
                            <SelectItem value="section_divider">Section Divider</SelectItem>
                            <SelectItem value="page_break">Page Break</SelectItem>
                            <SelectItem value="hyperlink">Hyperlink (External URL)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {!['section_divider', 'page_break'].includes(selectedField.type) && (
                        <div className="space-y-3">
                          <Label className="text-xs uppercase tracking-wider font-bold text-gray-500">Description (Optional)</Label>
                          <Input 
                            value={selectedField.description || ""} 
                            onChange={(e) => updateField(selectedField.id, { description: e.target.value })}
                            disabled={selectedField.locked}
                            placeholder="Help text for the user"
                            className="bg-white"
                          />
                        </div>
                      )}

                      {['text', 'long_text', 'number', 'email', 'phone'].includes(selectedField.type) && (
                        <div className="space-y-3">
                          <Label className="text-xs uppercase tracking-wider font-bold text-gray-500">Placeholder Text</Label>
                          <Input 
                            value={selectedField.placeholder || ""} 
                            onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                            disabled={selectedField.locked}
                            placeholder="e.g. Enter your answer..."
                            className="bg-white"
                          />
                        </div>
                      )}

                      {['dropdown', 'radio', 'checkbox', 'hyperlink'].includes(selectedField.type) && (
                        <div className="space-y-3">
                          <Label className="text-xs uppercase tracking-wider font-bold text-gray-500">
                            {selectedField.type === 'hyperlink' ? 'Target URL' : 'Options (Comma separated)'}
                          </Label>
                          <Input 
                            value={selectedField.options || ""} 
                            onChange={(e) => updateField(selectedField.id, { options: e.target.value })}
                            placeholder={selectedField.type === 'hyperlink' ? "https://example.com" : "Option 1, Option 2, Option 3"}
                            className="bg-white"
                          />
                        </div>
                      )}

                      {selectedField.type === 'checkbox_grid' && (
                        <div className="space-y-4">
                          <div className="space-y-3">
                            <Label className="text-xs uppercase tracking-wider font-bold text-gray-500">Rows (Comma separated)</Label>
                            <Input 
                              value={selectedField.gridRows || ""} 
                              onChange={(e) => updateField(selectedField.id, { gridRows: e.target.value })}
                              placeholder="Row 1, Row 2, Row 3"
                              className="bg-white"
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-xs uppercase tracking-wider font-bold text-gray-500">Columns (Comma separated)</Label>
                            <Input 
                              value={selectedField.options || ""} 
                              onChange={(e) => updateField(selectedField.id, { options: e.target.value })}
                              placeholder="Column 1, Column 2, Column 3"
                              className="bg-white"
                            />
                          </div>
                        </div>
                      )}

                      {selectedField.type === 'file_upload' && (
                        <div className="space-y-3">
                          <Label className="text-xs uppercase tracking-wider font-bold text-gray-500">Accepted File Types (Comma separated)</Label>
                          <Input 
                            value={selectedField.options || ""} 
                            onChange={(e) => updateField(selectedField.id, { options: e.target.value })}
                            placeholder="e.g. .jpg, .png, .pdf, image/*"
                            className="bg-white"
                          />
                        </div>
                      )}

                      {!['section_divider', 'page_break'].includes(selectedField.type) && (
                        <div className="pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-sm font-semibold text-gray-900">Required Field</Label>
                              <p className="text-xs text-gray-500">User must answer this question.</p>
                            </div>
                            <Switch 
                              checked={selectedField.required}
                              onCheckedChange={(checked) => updateField(selectedField.id, { required: checked })}
                              disabled={selectedField.locked}
                            />
                          </div>
                        </div>
                      )}

                      {!selectedField.locked && (
                        <div className="pt-4 border-t border-gray-200 space-y-4">
                          <div>
                            <Label className="text-sm font-semibold text-gray-900">Conditional Logic</Label>
                            <p className="text-xs text-gray-500 mb-3">Show this field only when a condition is met.</p>
                            
                            <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                              <div className="space-y-2">
                                <Label className="text-xs font-medium text-gray-500">Depends On (Field)</Label>
                                <Select
                                  value={selectedField.logic?.dependsOn || "none"}
                                  onValueChange={(val) => {
                                    if (val === "none") {
                                      const newLogic = { ...selectedField.logic };
                                      delete newLogic.dependsOn;
                                      if (Object.keys(newLogic).length === 0) updateField(selectedField.id, { logic: undefined });
                                      else updateField(selectedField.id, { logic: newLogic });
                                    } else {
                                      updateField(selectedField.id, { logic: { ...selectedField.logic, dependsOn: val, condition: selectedField.logic?.condition || "equals", value: selectedField.logic?.value || "" } });
                                    }
                                  }}
                                >
                                  <SelectTrigger className="bg-gray-50">
                                    <SelectValue placeholder="Select field" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Always Show</SelectItem>
                                    {fields.filter(f => f.id !== selectedField.id && ['dropdown', 'radio', 'checkbox'].includes(f.type)).map(f => (
                                      <SelectItem key={f.id} value={f.id}>{f.label || 'Untitled'}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {selectedField.logic?.dependsOn && (
                                <>
                                  <div className="space-y-2">
                                    <Label className="text-xs font-medium text-gray-500">Condition</Label>
                                    <Select
                                      value={selectedField.logic?.condition || "equals"}
                                      onValueChange={(val) => updateField(selectedField.id, { logic: { ...selectedField.logic, condition: val } })}
                                    >
                                      <SelectTrigger className="bg-gray-50">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="equals">Equals</SelectItem>
                                        <SelectItem value="not_equals">Does Not Equal</SelectItem>
                                        <SelectItem value="contains">Contains</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs font-medium text-gray-500">Value</Label>
                                    <Input 
                                      value={selectedField.logic?.value || ""}
                                      onChange={(e) => updateField(selectedField.id, { logic: { ...selectedField.logic, value: e.target.value } })}
                                      placeholder="e.g. Yes"
                                      className="bg-gray-50"
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {!selectedField.locked && (
                        <div className="pt-6">
                          <Button 
                            variant="destructive" 
                            onClick={() => removeField(selectedField.id)}
                            className="w-full rounded-xl"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Field
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    <div className="p-4 border-b border-gray-100 bg-white flex items-center gap-2">
                      <Settings2 className="w-5 h-5 text-blue-500" />
                      <h3 className="font-bold text-gray-900">Form Settings</h3>
                    </div>
                    
                    <div className="p-6 space-y-6 bg-gray-50/30">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <Label className="text-sm font-semibold text-gray-900">Close Form</Label>
                            <p className="text-xs text-gray-500 mt-1 max-w-[200px]">Stop accepting new responses immediately.</p>
                          </div>
                          <Switch 
                            checked={formSettings.isClosed}
                            onCheckedChange={(checked) => setFormSettings({ ...formSettings, isClosed: checked })}
                          />
                        </div>
                      </div>

                      {formSettings.isClosed && (
                        <div className="space-y-3 pt-4 border-t border-gray-200">
                          <Label className="text-xs uppercase tracking-wider font-bold text-gray-500">Closure Message</Label>
                          <Input 
                            value={formSettings.closedMessage} 
                            onChange={(e) => setFormSettings({ ...formSettings, closedMessage: e.target.value })}
                            placeholder="e.g. This form is no longer accepting responses."
                            className="bg-white"
                          />
                          <p className="text-xs text-gray-500">Displayed to users when they visit the form.</p>
                        </div>
                      )}

                      <div className="space-y-4 pt-4 border-t border-gray-200">
                        <div className="flex items-start justify-between">
                          <div>
                            <Label className="text-sm font-semibold text-gray-900">Waitlist System</Label>
                            <p className="text-xs text-gray-500 mt-1 max-w-[200px]">Allow users to join waitlist when event is full.</p>
                          </div>
                          <Switch 
                            checked={formSettings.waitlistEnabled}
                            onCheckedChange={(checked) => setFormSettings({ ...formSettings, waitlistEnabled: checked })}
                          />
                        </div>
                      </div>

                      <div className="pt-6 mt-6 border-t border-gray-200">
                        <div className="p-8 text-center text-gray-400 flex flex-col items-center justify-center">
                          <p className="font-medium text-gray-500">Select a field to edit its properties</p>
                          <p className="text-sm mt-1">Click any field on the left to edit it here.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* AI Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">AI Form Builder</h3>
                  <p className="text-xs text-purple-600 font-medium">Powered by Llama 4 Scout</p>
                </div>
              </div>
              <button onClick={() => setShowAiModal(false)} className="text-gray-400 hover:text-gray-600 bg-white p-2 rounded-full shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Describe the type of form you want to create, and AI will generate the appropriate fields for you. This will replace your current fields.
              </p>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Create a volunteer registration form with emergency contact and t-shirt size..."
                className="w-full h-32 p-4 text-sm border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none"
                disabled={isAiGenerating}
              />
              {aiError && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                  {aiError}
                </div>
              )}
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowAiModal(false)} disabled={isAiGenerating}>
                Cancel
              </Button>
              <Button 
                onClick={handleAiGenerate} 
                disabled={isAiGenerating || !aiPrompt.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6"
              >
                {isAiGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Form
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
