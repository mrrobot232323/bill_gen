import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import InvoiceTemplate from '../components/InvoiceTemplate';
import { generatePDF } from '../utils/pdfGenerator';
import { templates } from '../utils/templateRegistry';

const TemplatePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [currentTemplate, setCurrentTemplate] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);
  const [fitPreview, setFitPreview] = useState(true);
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (location.state && location.state.formData) {
      setFormData(location.state.formData);
      setCurrentTemplate(location.state.selectedTemplate || 1);
    } else {
      // If no form data in location state, try to load from localStorage
      const savedFormData = localStorage.getItem('formData');
      if (savedFormData) {
        setFormData(JSON.parse(savedFormData));
      }
    }
  }, [location.state]);

  // Responsive scale-to-fit for the A4 preview
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !contentRef.current || !fitPreview) {
        setScale(1);
        return;
      }
      const cw = containerRef.current.clientWidth;
      const iw = contentRef.current.scrollWidth; // intrinsic A4 width in CSS pixels
      if (!iw) return;
      const nextScale = Math.min(1, cw / iw);
      setScale(nextScale);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fitPreview, formData, currentTemplate]);

  const handleTemplateChange = (templateNumber) => {
    setCurrentTemplate(templateNumber);
  };

  const handleDownloadPDF = async () => {
    if (formData && !isDownloading) {
      setIsDownloading(true);
      try {
        await generatePDF(formData, currentTemplate);
      } catch (error) {
        console.error('Error generating PDF:', error);
      } finally {
        setIsDownloading(false);
      }
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  if (!formData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-center mb-6 md:mb-8">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <Button variant={fitPreview ? "default" : "outline"} onClick={() => setFitPreview((v) => !v)}>
            {fitPreview ? "Fit: On" : "Fit: Off"}
          </Button>
          <Button variant="outline" onClick={() => window.print()} className="no-print">
            Print
          </Button>
          <Button onClick={handleDownloadPDF} disabled={isDownloading}>
            {isDownloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Downloading...
              </>
            ) : (
              "Download PDF"
            )}
          </Button>
        </div>
      </div>

      <div className="mb-6 md:mb-8 overflow-x-auto">
        <div className="flex space-x-2 sm:space-x-3">
          {templates.map((template, index) => (
            <div
              key={index}
              className={`cursor-pointer px-3 py-2 sm:p-4 border rounded hover:shadow ${
                currentTemplate === index + 1
                  ? "border-blue-500"
                  : "border-gray-300"
              }`}
              onClick={() => handleTemplateChange(index + 1)}
            >
              {template.name}
            </div>
          ))}
        </div>
      </div>

      {/* Preview container: scales content to fit on small screens */}
      <div ref={containerRef} className="mx-auto border shadow-lg bg-white overflow-hidden max-w-full">
        <div
          ref={contentRef}
          className="w-[210mm] h-[297mm] mx-auto print-a4"
          style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
        >
          <InvoiceTemplate data={formData} templateNumber={currentTemplate} />
        </div>
        {/* Spacer to maintain layout height when scaled */}
        {fitPreview && (
          <div style={{ height: contentRef.current ? contentRef.current.offsetHeight * scale : undefined }} />
        )}
      </div>
    </div>
  );
};

export default TemplatePage;
