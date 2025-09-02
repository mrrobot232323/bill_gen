import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
// React Query removed: not used
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { navItems } from "./nav-items";
import TemplatePage from "./pages/TemplatePage";
import ReceiptPage from "./pages/ReceiptPage";
import Index from "./pages/Index";
import { useEffect, useRef, useState } from "react";
import LocomotiveScroll from "locomotive-scroll";
import { ThemeProvider } from "next-themes";

// No QueryClient needed

const App = () => {
  const containerRef = useRef(null);
  const locoRef = useRef(null);
  const [enableSmooth, setEnableSmooth] = useState(() => {
    const saved = localStorage.getItem('smoothScroll');
    if (saved === 'on') return true;
    if (saved === 'off') return false;
    return typeof window !== 'undefined' ? window.innerWidth >= 768 : true; // disable on very small screens by default
  });

  // Initialize or destroy Locomotive depending on enableSmooth
  useEffect(() => {
    if (!containerRef.current) return;
    // If smooth disabled, destroy and bail
    if (!enableSmooth) {
      if (locoRef.current) {
        try { locoRef.current.destroy(); } catch {}
        locoRef.current = null;
        window.__loco = undefined;
      }
      return;
    }
    // Create instance
    const loco = new LocomotiveScroll({
      el: containerRef.current,
      smooth: true,
      multiplier: 1,
      smoothMobile: false,
      smartphone: { smooth: false },
      tablet: { smooth: false },
    });
    locoRef.current = loco;
    window.__loco = loco;
    const ro = new ResizeObserver(() => {
      window.requestAnimationFrame(() => locoRef.current && locoRef.current.update());
    });
    ro.observe(containerRef.current);
    const imgLoadHandler = () => locoRef.current && locoRef.current.update();
    const attachImgListeners = () => {
      const imgs = containerRef.current?.querySelectorAll('img');
      imgs?.forEach((img) => {
        img.removeEventListener('load', imgLoadHandler);
        img.addEventListener('load', imgLoadHandler, { passive: true });
      });
    };
    attachImgListeners();
    const mo = new MutationObserver(() => attachImgListeners());
    mo.observe(containerRef.current, { subtree: true, childList: true });
    return () => {
      try {
        mo.disconnect();
        ro.disconnect();
        loco.destroy();
      } catch (_) {}
    };
  }, [enableSmooth]);

  // Inner component to update locomotive on route change
  const Routed = () => {
    const location = useLocation();
    useEffect(() => {
      // delay to allow new DOM to paint then update locomotive
      const id = setTimeout(() => {
        if (locoRef.current) {
          locoRef.current.update();
        }
      }, 50);
      return () => clearTimeout(id);
    }, [location]);
    return (
      <Routes>
        {navItems.map(({ to, page }) => (
          <Route key={to} path={to} element={page} />
        ))}
        <Route path="/" element={<Index />} />
        <Route path="/template" element={<TemplatePage />} />
        <Route path="/receipt" element={<ReceiptPage />} />
      </Routes>
    );
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
          <div data-scroll-container ref={containerRef}>
            <div data-scroll-section>
              <BrowserRouter>
                <Routed />
              </BrowserRouter>
            </div>
            {/* Back to top button */}
            <button
              type="button"
              onClick={() => {
                if (locoRef.current) {
                  locoRef.current.scrollTo(0, { duration: 600 });
                } else {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="fixed bottom-4 left-4 z-20 px-3 py-2 rounded-full bg-slate-800 text-white shadow hover:bg-slate-700 active:scale-95 transition no-print"
              aria-label="Back to top"
            >
              Top
            </button>
            {/* Back button */}
            <button
              type="button"
              onClick={() => (window.history.length > 1 ? window.history.back() : (window.location.href = '/'))}
              className="fixed bottom-4 left-20 z-20 px-3 py-2 rounded-full bg-slate-800 text-white shadow hover:bg-slate-700 active:scale-95 transition no-print"
              aria-label="Back"
            >
              Back
            </button>
            {/* Smooth scroll toggle */}
            <button
              type="button"
              onClick={() => { const next = !enableSmooth; setEnableSmooth(next); localStorage.setItem('smoothScroll', next ? 'on' : 'off'); }}
              className="fixed bottom-4 right-4 z-20 px-3 py-2 rounded-full bg-slate-800 text-white shadow hover:bg-slate-700 active:scale-95 transition no-print"
              aria-label="Toggle smooth scrolling"
              title="Toggle smooth scrolling"
            >
              {enableSmooth ? 'Smooth: On' : 'Smooth: Off'}
            </button>
          </div>
      </TooltipProvider>
    </ThemeProvider>
  );
};

export default App;
