"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";

interface DynamicFormClientProps {
  event: any;
  formConfig: any[];
  isWaitlistMode?: boolean;
}

export default function DynamicFormClient({ event, formConfig, isWaitlistMode }: DynamicFormClientProps) {
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem(`freo_form_progress_${event.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.values) setFormValues(parsed.values);
        if (parsed.page) setCurrentPage(parsed.page);
      } catch (e) {}
    }
  }, [event.id]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(`freo_form_progress_${event.id}`, JSON.stringify({
        values: formValues,
        page: currentPage
      }));
    }
  }, [formValues, currentPage, event.id, isMounted]);

  const handleValueChange = (fieldId: string, value: any) => {
    setFormValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const pages: any[][] = [[]];
  let currentPageIndex = 0;

  formConfig.forEach((field: any) => {
    if (field.type === "page_break") {
      currentPageIndex++;
      pages[currentPageIndex] = [];
    } else {
      pages[currentPageIndex].push(field);
    }
  });

  const isLastPage = currentPage === pages.length - 1;

  const handleNext = () => {
    const form = document.getElementById('registration-form') as HTMLFormElement;
    if (form && form.reportValidity()) {
      setCurrentPage(p => p + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setCurrentPage(p => Math.max(0, p - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const evaluateLogic = (logic?: { dependsOn?: string, condition?: string, value?: string }) => {
    if (!logic || !logic.dependsOn) return true;
    
    const dependentValue = formValues[logic.dependsOn];
    const targetValue = logic.value || "";

    switch (logic.condition) {
      case "equals":
        return String(dependentValue).trim().toLowerCase() === String(targetValue).trim().toLowerCase();
      case "not_equals":
        return String(dependentValue).trim().toLowerCase() !== String(targetValue).trim().toLowerCase();
      case "contains":
        return String(dependentValue).trim().toLowerCase().includes(String(targetValue).trim().toLowerCase());
      default:
        return true;
    }
  };

  return (
    <>
      {/* Dynamic Fields */}
      {pages.map((pageFields, pageIndex) => (
        <div key={pageIndex} className={pageIndex === currentPage ? "block" : "hidden"}>
          {pageFields.map((field: any) => {
            const isVisible = evaluateLogic(field.logic);
            const isRequiredOnCurrentPage = field.required && pageIndex === currentPage;
        
        if (!isVisible) return null;

        if (field.type === "section_divider") {
          return (
            <div key={field.id} className="pt-6 pb-2 border-b border-gray-100 mt-8">
              <h3 className="text-xl font-bold text-gray-900">{field.label}</h3>
              {field.description && <p className="text-gray-500 mt-2 text-sm">{field.description}</p>}
            </div>
          );
        }

        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-gray-700 font-medium">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-gray-500 pb-1">{field.description}</p>
            )}
            
            {field.type === "text" || field.type === "email" || field.type === "phone" || field.type === "number" ? (
              <Input 
                id={field.id} 
                name={field.id} 
                type={field.type === "phone" ? "tel" : field.type} 
                placeholder={field.placeholder} 
                required={isRequiredOnCurrentPage}
                onChange={(e) => handleValueChange(field.id, e.target.value)}
                className="rounded-xl bg-gray-50/50 focus-visible:ring-primary/20 py-6"
              />
            ) : field.type === "long_text" ? (
              <Textarea 
                id={field.id} 
                name={field.id} 
                placeholder={field.placeholder} 
                required={isRequiredOnCurrentPage}
                onChange={(e) => handleValueChange(field.id, e.target.value)}
                className="rounded-xl bg-gray-50/50 focus-visible:ring-primary/20 min-h-[120px] resize-y"
              />
            ) : field.type === "dropdown" ? (
              <Select name={field.id} required={isRequiredOnCurrentPage} onValueChange={(val) => handleValueChange(field.id, val)}>
                <SelectTrigger className="rounded-xl bg-gray-50/50 py-6">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.split(',').map((opt: string) => (
                    <SelectItem key={opt.trim()} value={opt.trim()}>{opt.trim()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field.type === "radio" ? (
              <div className="space-y-3 pt-2">
                {field.options?.split(',').map((opt: string) => (
                  <div key={opt.trim()} className="flex items-center space-x-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                    <input 
                      type="radio" 
                      id={`${field.id}_${opt.trim()}`} 
                      name={field.id} 
                      value={opt.trim()} 
                      required={isRequiredOnCurrentPage} 
                      onChange={(e) => handleValueChange(field.id, e.target.value)}
                      className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-900" 
                    />
                    <Label htmlFor={`${field.id}_${opt.trim()}`} className="text-sm font-medium text-gray-700 cursor-pointer flex-1">{opt.trim()}</Label>
                  </div>
                ))}
              </div>
            ) : field.type === "checkbox" ? (
              <div className="flex items-center space-x-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100 mt-2">
                <Switch 
                  id={field.id} 
                  name={field.id} 
                  required={isRequiredOnCurrentPage} 
                  onCheckedChange={(checked) => handleValueChange(field.id, checked ? "Yes" : "No")}
                />
                <Label htmlFor={field.id} className="text-sm font-medium text-gray-700 cursor-pointer">{field.options || field.placeholder || "Yes, I agree"}</Label>
              </div>
            ) : field.type === "date" || field.type === "time" ? (
              <Input 
                id={field.id} 
                name={field.id} 
                type={field.type} 
                required={isRequiredOnCurrentPage} 
                onChange={(e) => handleValueChange(field.id, e.target.value)}
                className="rounded-xl bg-gray-50/50 focus-visible:ring-primary/20 py-6"
              />
            ) : field.type === "rating" ? (
              <div className="flex items-center justify-between sm:justify-start sm:gap-6 bg-gray-50/50 p-6 rounded-xl border border-gray-100 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div key={star} className="flex flex-col items-center gap-3">
                    <input 
                      type="radio" 
                      id={`${field.id}_${star}`} 
                      name={field.id} 
                      value={star} 
                      required={isRequiredOnCurrentPage} 
                      onChange={(e) => handleValueChange(field.id, e.target.value)}
                      className="w-5 h-5 text-gray-900 border-gray-300 focus:ring-gray-900" 
                    />
                    <Label htmlFor={`${field.id}_${star}`} className="text-sm font-bold text-gray-700 cursor-pointer">{star}</Label>
                  </div>
                ))}
              </div>
            ) : field.type === "linear_scale" ? (
              <div className="flex flex-wrap items-center gap-4 bg-gray-50/50 p-6 rounded-xl border border-gray-100 mt-2">
                {Array.from({length: 10}, (_, i) => i + 1).map((num) => (
                  <div key={num} className="flex flex-col items-center gap-3">
                    <input 
                      type="radio" 
                      id={`${field.id}_${num}`} 
                      name={field.id} 
                      value={num} 
                      required={isRequiredOnCurrentPage} 
                      onChange={(e) => handleValueChange(field.id, e.target.value)}
                      className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-900" 
                    />
                    <Label htmlFor={`${field.id}_${num}`} className="text-xs font-bold text-gray-600 cursor-pointer">{num}</Label>
                  </div>
                ))}
              </div>
            ) : field.type === "file" || field.type === "file_upload" ? (
              <Input 
                id={field.id} 
                name={field.id} 
                type="file" 
                required={isRequiredOnCurrentPage} 
                accept={field.options || "*"}
                onChange={(e) => handleValueChange(field.id, e.target.value)}
                className="h-auto py-3 rounded-xl bg-gray-50/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-900 file:text-white hover:file:bg-gray-800 cursor-pointer mt-2"
              />
            ) : field.type === "checkbox_grid" ? (
              <div className="overflow-x-auto mt-2 border border-gray-200 rounded-xl bg-white">
                <table className="w-full text-left border-collapse min-w-max">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="p-4 font-medium text-gray-700"></th>
                      {field.options?.split(',').map((col: string) => (
                        <th key={col.trim()} className="p-4 font-medium text-gray-700 text-center">{col.trim()}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {field.gridRows?.split(',').map((row: string) => (
                      <tr key={row.trim()} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-medium text-gray-900">{row.trim()}</td>
                        {field.options?.split(',').map((col: string) => (
                          <td key={col.trim()} className="p-4 text-center">
                            <input 
                              type="checkbox" 
                              name={`${field.id}_${row.trim()}`} 
                              value={col.trim()} 
                              className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900 mx-auto block" 
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        );
          })}
        </div>
      ))}

      <hr className="my-8 border-gray-100" />

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-8 gap-4">
        {currentPage > 0 ? (
          <Button 
            type="button" 
            variant="outline" 
            onClick={handlePrev}
            className="py-6 px-6 rounded-xl text-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
        ) : (
          <div></div> // Placeholder for flex layout
        )}

        {!isLastPage ? (
          <Button 
            type="button" 
            onClick={handleNext}
            className="py-6 px-8 rounded-xl bg-gray-900 text-white hover:bg-primary shadow-md transition-all duration-300"
          >
            Next Page
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : null}
      </div>

      {/* Mandatory Payment Section - Only show on last page */}
      {isLastPage && (
        <>
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900">Payment Verification</h3>
            <div className="bg-yellow-50 p-5 rounded-2xl border border-yellow-100 text-sm text-yellow-800 leading-relaxed">
              Please ensure you have sent <strong>₹{event.price}</strong> to the UPI details shown on the right before submitting this form.
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="utr_id" className="text-gray-700 font-medium">UTR / Transaction ID <span className="text-red-500">*</span></Label>
              <Input 
                id="utr_id" 
                name="utr_id" 
                placeholder="e.g. 123456789012" 
                required 
                className="rounded-xl bg-gray-50/50 focus-visible:ring-primary/20 py-6 font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_screenshot" className="text-gray-700 font-medium">Payment Screenshot <span className="text-red-500">*</span></Label>
              <Input 
                id="payment_screenshot" 
                name="payment_screenshot" 
                type="file" 
                accept="image/*"
                required 
                className="h-auto py-3 rounded-xl bg-gray-50/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-900 file:text-white hover:file:bg-gray-800 cursor-pointer"
              />
            </div>
          </div>

          <SubmitButton 
            className="w-full py-6 text-base font-semibold rounded-xl bg-gray-900 hover:bg-primary transition-all duration-300 text-white shadow-md hover:shadow-primary/25 mt-8"
            pendingText={isWaitlistMode ? "Joining..." : "Submitting..."}
          >
            {isWaitlistMode ? "Join Waitlist" : "Submit Registration"}
          </SubmitButton>
        </>
      )}
    </>
  );
}
