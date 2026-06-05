"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, GripVertical, Plus, Trash2, Save, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { saveFormConfig, getFormConfig } from "./actions";

type FieldType = "text" | "number" | "email" | "phone" | "dropdown" | "checkbox" | "file";

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  locked: boolean;
  options?: string; // Comma separated for dropdowns
}

const DEFAULT_FIELDS: FormField[] = [
  { id: "name", type: "text", label: "Full Name", placeholder: "Enter your full name", required: true, locked: true },
  { id: "phone", type: "phone", label: "Phone Number", placeholder: "10-digit mobile number", required: true, locked: true },
  { id: "email", type: "email", label: "Email Address", placeholder: "john@example.com", required: true, locked: true },
  { id: "herbalife_id", type: "text", label: "Herbalife ID", placeholder: "Enter your ID", required: true, locked: false },
  { id: "sponsor", type: "text", label: "Sponsor Name", placeholder: "Name of your sponsor", required: true, locked: false },
];

export default function FormBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [fields, setFields] = useState<FormField[]>(DEFAULT_FIELDS);
  const [isSaving, setIsSaving] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    async function loadConfig() {
      try {
        const savedConfig = await getFormConfig(resolvedParams.id);
        if (savedConfig && Array.isArray(savedConfig) && savedConfig.length > 0) {
          setFields(savedConfig as FormField[]);
        }
      } catch (err) {
        console.error("Failed to load existing form config:", err);
      }
    }
    loadConfig();
  }, [resolvedParams.id]);

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
      label: "New Field",
      placeholder: "",
      required: false,
      locked: false,
    };
    setFields([...fields, newField]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveFormConfig(resolvedParams.id, fields);
    } catch (e) {
      console.error(e);
      setIsSaving(false);
    }
  };

  if (!isMounted) return null; // Avoid hydration mismatch on DND

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/events`}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Registration Form Builder</h1>
            <p className="text-gray-500">Customize what information attendees need to provide.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={addField} className="rounded-xl border-dashed border-gray-300">
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Field
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-[#1d1d1f] hover:bg-[#2A2B31] text-[#DDFE55] font-semibold rounded-xl px-6 border border-[#1d1d1f]"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Form
          </Button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="form-fields">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
              {fields.map((field, index) => (
                <Draggable key={field.id} draggableId={field.id} index={index}>
                  {(provided, snapshot) => (
                    <Card 
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`border-gray-200 transition-shadow rounded-2xl ${snapshot.isDragging ? "shadow-lg ring-2 ring-primary/20 bg-gray-50" : "shadow-sm"}`}
                    >
                      <CardContent className="p-0 flex items-stretch">
                        <div 
                          {...provided.dragHandleProps} 
                          className="w-12 border-r border-gray-100 flex items-center justify-center bg-gray-50/50 hover:bg-gray-100 transition-colors rounded-l-2xl cursor-grab active:cursor-grabbing"
                        >
                          <GripVertical className="text-gray-400 w-5 h-5" />
                        </div>
                        <div className="flex-1 p-6">
                          <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Field Label</Label>
                                  <div className="relative">
                                    <Input 
                                      value={field.label} 
                                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                                      disabled={field.locked}
                                      className={`rounded-lg ${field.locked ? "bg-gray-50 text-gray-600 pl-9" : ""}`}
                                    />
                                    {field.locked && <Lock className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Field Type</Label>
                                  <Select 
                                    value={field.type} 
                                    onValueChange={(val) => { if (val) updateField(field.id, { type: val as FieldType }) }}
                                    disabled={field.locked}
                                  >
                                    <SelectTrigger className={`rounded-lg ${field.locked ? "bg-gray-50 text-gray-600" : ""}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="text">Short Text</SelectItem>
                                      <SelectItem value="number">Number</SelectItem>
                                      <SelectItem value="email">Email</SelectItem>
                                      <SelectItem value="phone">Phone Number</SelectItem>
                                      <SelectItem value="dropdown">Dropdown Options</SelectItem>
                                      <SelectItem value="checkbox">Checkbox (Yes/No)</SelectItem>
                                      <SelectItem value="file">File Upload</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              {field.type !== 'checkbox' && field.type !== 'file' && (
                                <div className="space-y-2">
                                  <Label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Placeholder Text</Label>
                                  <Input 
                                    value={field.placeholder || ""} 
                                    onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                                    disabled={field.locked}
                                    placeholder="e.g. Enter your answer here..."
                                    className={`rounded-lg ${field.locked ? "bg-gray-50 text-gray-600" : ""}`}
                                  />
                                </div>
                              )}

                              {field.type === 'dropdown' && (
                                <div className="space-y-2">
                                  <Label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Options (Comma separated)</Label>
                                  <Input 
                                    value={field.options || ""} 
                                    onChange={(e) => updateField(field.id, { options: e.target.value })}
                                    placeholder="e.g. Option 1, Option 2, Option 3"
                                    className="rounded-lg"
                                  />
                                </div>
                              )}
                            </div>

                            <div className="w-full md:w-48 flex flex-col justify-between pt-6">
                              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <Label className="text-sm font-medium text-gray-700 cursor-pointer">Required</Label>
                                <Switch 
                                  checked={field.required}
                                  onCheckedChange={(checked) => updateField(field.id, { required: checked })}
                                  disabled={field.locked}
                                />
                              </div>
                              
                              {!field.locked && (
                                <Button 
                                  variant="ghost" 
                                  onClick={() => removeField(field.id)}
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50 w-full mt-4 rounded-xl"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Remove Field
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
