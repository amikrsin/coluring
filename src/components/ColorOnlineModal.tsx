import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  X,
  PaintBucket,
  Brush,
  Eraser,
  Hand,
  Undo2,
  Redo2,
  RotateCcw,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Printer,
  ShieldCheck,
  FileDown,
  Upload,
  ChevronLeft,
  ChevronRight,
  Minus,
  MoveUpRight,
  Circle,
  Highlighter,
  SlidersHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  MoreHorizontal,
} from 'lucide-react';
import { ColoringSheet, Locale, PaperSize } from '../types';
import { TranslationDictionary, getText } from '../i18n/translations';
import { getLineArtDataUri } from '../data/line-art';
import {
  buildInkMask,
  reapplyInkLines,
  scanlineFloodFill,
} from '../utils/flood-fill';
import { renderPdfPageToCanvas } from '../utils/pdf-canvas';

type ToolMode =
  | 'bucket'
  | 'brush'
  | 'highlighter'
  | 'eraser'
  | 'line'
  | 'arrow'
  | 'circle'
  | 'pan';

type ColoringTool = 'bucket' | 'brush' | 'highlighter' | 'eraser';
type LineTool = 'line' | 'arrow' | 'circle';
type LineStyle = 'solid' | 'dashed' | 'dotted';
type FlyoutPanel = 'coloring' | 'lines' | 'color' | 'settings' | 'view' | 'file' | null;

const KID_PALETTE: { name: string; hex: string }[] = [
  { name: 'Cherry Red', hex: '#E63946' },
  { name: 'Coral Pink', hex: '#FF6B6B' },
  { name: 'Bubblegum', hex: '#F472B6' },
  { name: 'Magenta', hex: '#C026D3' },
  { name: 'Tangerine', hex: '#FB923C' },
  { name: 'Pumpkin', hex: '#F97316' },
  { name: 'Sunny Gold', hex: '#FFB703' },
  { name: 'Lemon', hex: '#FDE047' },
  { name: 'Lime', hex: '#84CC16' },
  { name: 'Spring Green', hex: '#38B000' },
  { name: 'Forest', hex: '#15803D' },
  { name: 'Sky Teal', hex: '#2A9D8F' },
  { name: 'Aqua', hex: '#22D3EE' },
  { name: 'Sky Blue', hex: '#38BDF8' },
  { name: 'Royal Blue', hex: '#2563EB' },
  { name: 'Grape Purple', hex: '#7C3AED' },
  { name: 'Peach', hex: '#FDBA74' },
  { name: 'Warm Brown', hex: '#92400E' },
  { name: 'Slate Gray', hex: '#64748B' },
  { name: 'Paper White', hex: '#FFFFFF' },
];

const QUICK_SIZES = [4, 10, 20, 34];

const MAX_HISTORY = 30;
const DEFAULT_CANVAS_W = 800;
const DEFAULT_CANVAS_H = 1000;

interface ColorOnlineModalProps {
  sheet: ColoringSheet;
  locale: Locale;
  t: TranslationDictionary;
  paperSize: PaperSize;
  onClose: () => void;
  onUploadFile?: (file: File) => void;
}

function getLineDashPattern(style: LineStyle, strokeWidth: number): number[] {
  const unit = Math.max(4, strokeWidth);
  if (style === 'dashed') return [unit * 2.4, unit * 1.4];
  if (style === 'dotted') return [1, unit * 1.9];
  return [];
}

function drawShapeOnContext(
  ctx: CanvasRenderingContext2D,
  mode: 'line' | 'arrow' | 'circle',
  start: { x: number; y: number },
  end: { x: number; y: number },
  strokeColor: string,
  strokeWidth: number,
  lineStyle: LineStyle
) {
  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = strokeColor;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash(getLineDashPattern(lineStyle, strokeWidth));

  if (mode === 'line' || mode === 'arrow') {
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    if (mode === 'arrow') {
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 6) {
        const angle = Math.atan2(dy, dx);
        const headLen = Math.max(14, strokeWidth * 2.4);
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
          end.x - headLen * Math.cos(angle - Math.PI / 6),
          end.y - headLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
          end.x - headLen * Math.cos(angle + Math.PI / 6),
          end.y - headLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      }
    }
  } else if (mode === 'circle') {
    const cx = (start.x + end.x) / 2;
    const cy = (start.y + end.y) / 2;
    const rx = Math.abs(end.x - start.x) / 2;
    const ry = Math.abs(end.y - start.y) / 2;
    if (rx > 1 || ry > 1) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.restore();
}

const CornerFlyoutMark: React.FC<{ active?: boolean }> = ({ active }) => (
  <svg
    viewBox="0 0 6 6"
    aria-hidden="true"
    className={`w-1.5 h-1.5 absolute bottom-1 right-1 pointer-events-none ${
      active ? 'text-white/90' : 'text-slate-400'
    }`}
  >
    <polygon points="6,0 6,6 0,6" fill="currentColor" />
  </svg>
);

export const ColorOnlineModal: React.FC<ColorOnlineModalProps> = ({
  sheet,
  locale,
  t,
  paperSize,
  onClose,
  onUploadFile,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const baseImageRef = useRef<ImageData | null>(null);
  const inkMaskRef = useRef<Uint8Array | null>(null);
  const historyRef = useRef<ImageData[]>([]);
  const historyIndexRef = useRef<number>(-1);

  // Snapshot captured at pointerdown for crisp rubber-band preview, highlighter strokes & pinch-cancel
  const strokeBaseRef = useRef<ImageData | null>(null);
  const strokePointsRef = useRef<{ x: number; y: number }[]>([]);

  // Active tool & Photoshop-style left rail toggle boxes
  const [tool, setTool] = useState<ToolMode>('bucket');
  const [lastColoringTool, setLastColoringTool] = useState<ColoringTool>('bucket');
  const [lastLineTool, setLastLineTool] = useState<LineTool>('line');
  const [railExpanded, setRailExpanded] = useState<boolean>(true);
  const [openFlyout, setOpenFlyout] = useState<FlyoutPanel>(null);

  const [lineStyle, setLineStyle] = useState<LineStyle>('solid');
  const [color, setColor] = useState<string>('#E63946');
  const [recentColors, setRecentColors] = useState<string[]>([
    '#E63946',
    '#FFB703',
    '#2A9D8F',
    '#2563EB',
    '#7C3AED',
  ]);
  const [brushSize, setBrushSize] = useState<number>(10);
  const [tolerance, setTolerance] = useState<number>(48);
  const [protectLines, setProtectLines] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(100);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);
  const [pdfPage, setPdfPage] = useState<number>(1);
  const [pdfTotalPages, setPdfTotalPages] = useState<number>(1);
  const [detectedInkPct, setDetectedInkPct] = useState<number | null>(null);

  const isDrawingRef = useRef<boolean>(false);
  const isPanningRef = useRef<boolean>(false);
  const startPtRef = useRef<{ x: number; y: number } | null>(null);
  const lastPtRef = useRef<{ x: number; y: number } | null>(null);
  const panStartRef = useRef<{ clientX: number; clientY: number; panX: number; panY: number } | null>(null);

  // Two-finger pinch-to-zoom & pan tracking for mobile touch ergonomics
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartRef = useRef<{
    dist: number;
    midX: number;
    midY: number;
    zoom: number;
    panX: number;
    panY: number;
  } | null>(null);
  const wasPinchingRef = useRef<boolean>(false);

  const title = getText(sheet.title, locale);

  const selectTool = useCallback((next: ToolMode) => {
    setTool(next);
    if (next === 'bucket' || next === 'brush' || next === 'highlighter' || next === 'eraser') {
      setLastColoringTool(next);
    } else if (next === 'line' || next === 'arrow' || next === 'circle') {
      setLastLineTool(next);
    }
  }, []);

  const selectColor = useCallback(
    (hex: string) => {
      setColor(hex);
      setRecentColors((prev) => {
        const filtered = prev.filter((c) => c.toLowerCase() !== hex.toLowerCase());
        return [hex, ...filtered].slice(0, 6);
      });
      if (tool === 'eraser' || tool === 'pan') {
        selectTool('brush');
      }
    },
    [tool, selectTool]
  );

  const toggleFlyout = useCallback((panel: FlyoutPanel) => {
    setOpenFlyout((prev) => (prev === panel ? null : panel));
  }, []);

  const syncHistoryFlags = useCallback(() => {
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, []);

  const pushSnapshot = useCallback(
    (imgData: ImageData) => {
      const cloned = new ImageData(
        new Uint8ClampedArray(imgData.data),
        imgData.width,
        imgData.height
      );
      const nextStack = historyRef.current.slice(0, historyIndexRef.current + 1);
      nextStack.push(cloned);
      if (nextStack.length > MAX_HISTORY) {
        nextStack.shift();
      }
      historyRef.current = nextStack;
      historyIndexRef.current = nextStack.length - 1;
      syncHistoryFlags();
    },
    [syncHistoryFlags]
  );

  // Reset page number when switching to a different sheet
  useEffect(() => {
    setPdfPage(1);
    setPdfTotalPages(1);
  }, [sheet.id, sheet.sourcePdfUrl, sheet.uploadedFile]);

  // Load high-res line-art (Direct PDF, Uploaded PDF/Image, or R2 SVG/PNG) onto canvas
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setZoom(100);
    setPan({ x: 0, y: 0 });

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const finalizeCanvasImage = (w: number, h: number) => {
      const initialData = ctx.getImageData(0, 0, w, h);
      baseImageRef.current = new ImageData(
        new Uint8ClampedArray(initialData.data),
        w,
        h
      );
      const mask = buildInkMask(initialData);
      inkMaskRef.current = mask;

      let inkPixels = 0;
      for (let i = 0; i < mask.length; i++) {
        if (mask[i] > 72) inkPixels++;
      }
      setDetectedInkPct(Math.round((inkPixels / mask.length) * 1000) / 10);

      historyRef.current = [
        new ImageData(new Uint8ClampedArray(initialData.data), w, h),
      ];
      historyIndexRef.current = 0;
      syncHistoryFlags();
      setLoading(false);
    };

    const loadImageSource = (src: string, isFallback: boolean, preserveAspect = false) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (cancelled) return;
        let targetW = DEFAULT_CANVAS_W;
        let targetH = DEFAULT_CANVAS_H;

        if (preserveAspect && img.naturalWidth > 0 && img.naturalHeight > 0) {
          const maxDim = 1040;
          const ratio = img.naturalWidth / img.naturalHeight;
          if (ratio >= 1) {
            targetW = Math.min(maxDim, Math.max(760, img.naturalWidth));
            targetH = Math.round(targetW / ratio);
          } else {
            targetH = Math.min(maxDim, Math.max(880, img.naturalHeight));
            targetW = Math.round(targetH * ratio);
          }
        }

        canvas.width = targetW;
        canvas.height = targetH;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetW, targetH);
        ctx.drawImage(img, 0, 0, targetW, targetH);
        finalizeCanvasImage(targetW, targetH);
      };
      img.onerror = () => {
        if (cancelled) return;
        if (!isFallback && !sheet.uploadedFile) {
          loadImageSource(getLineArtDataUri(sheet.id), true, false);
        } else {
          setLoadError('Could not load this image file. Please try another PNG, JPG, or PDF.');
          setLoading(false);
        }
      };
      img.src = src;
    };

    if (sheet.uploadedFile?.kind === 'pdf' && sheet.uploadedFile.arrayBuffer) {
      renderPdfPageToCanvas(sheet.uploadedFile.arrayBuffer, canvas, pdfPage, 960)
        .then(({ width, height, numPages }) => {
          if (cancelled) return;
          setPdfTotalPages(numPages);
          finalizeCanvasImage(width, height);
        })
        .catch(() => {
          if (!cancelled) {
            setLoadError('Could not render that PDF page. Try a standard printable PDF.');
            setLoading(false);
          }
        });
      return () => {
        cancelled = true;
      };
    }

    if (sheet.uploadedFile?.kind === 'image' && sheet.uploadedFile.dataUrl) {
      setPdfTotalPages(1);
      loadImageSource(sheet.uploadedFile.dataUrl, true, true);
      return () => {
        cancelled = true;
      };
    }

    if (sheet.sourcePdfUrl) {
      renderPdfPageToCanvas(sheet.sourcePdfUrl, canvas, pdfPage, 960)
        .then(({ width, height, numPages }) => {
          if (cancelled) return;
          setPdfTotalPages(numPages);
          finalizeCanvasImage(width, height);
        })
        .catch(() => {
          if (!cancelled) {
            setLoadError('Could not load the source PDF.');
            setLoading(false);
          }
        });
      return () => {
        cancelled = true;
      };
    }

    setPdfTotalPages(1);
    loadImageSource(sheet.lineArtUrl, false, false);

    return () => {
      cancelled = true;
    };
  }, [sheet.id, sheet.lineArtUrl, sheet.sourcePdfUrl, sheet.uploadedFile, pdfPage, syncHistoryFlags]);

  const handleUndo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || historyIndexRef.current <= 0) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    historyIndexRef.current -= 1;
    ctx.putImageData(historyRef.current[historyIndexRef.current], 0, 0);
    syncHistoryFlags();
  }, [syncHistoryFlags]);

  const handleRedo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || historyIndexRef.current >= historyRef.current.length - 1) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    historyIndexRef.current += 1;
    ctx.putImageData(historyRef.current[historyIndexRef.current], 0, 0);
    syncHistoryFlags();
  }, [syncHistoryFlags]);

  const handleReset = useCallback(() => {
    const canvas = canvasRef.current;
    const base = baseImageRef.current;
    if (!canvas || !base) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const fresh = new ImageData(new Uint8ClampedArray(base.data), base.width, base.height);
    ctx.putImageData(fresh, 0, 0);
    pushSnapshot(fresh);
    setOpenFlyout(null);
  }, [pushSnapshot]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (openFlyout) {
          setOpenFlyout(null);
        } else {
          onClose();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, handleUndo, handleRedo, openFlyout]);

  const getCanvasPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const snapAngleIfShift = (
    start: { x: number; y: number },
    end: { x: number; y: number },
    shiftKey: boolean
  ) => {
    if (!shiftKey) return end;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dist = Math.hypot(dx, dy);
    const angle = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
    return {
      x: start.x + dist * Math.cos(angle),
      y: start.y + dist * Math.sin(angle),
    };
  };

  // Multi-touch stage handlers (capture phase) for mobile pinch-zoom & two-finger pan
  const handleStagePointerDownCapture = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-studio-ui="true"]')) {
      return;
    }

    if (openFlyout !== null) {
      setOpenFlyout(null);
    }

    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointersRef.current.size === 2) {
      // Cancel any in-flight 1-finger stroke cleanly so pinching never leaves stray marks
      if (isDrawingRef.current && strokeBaseRef.current && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.putImageData(strokeBaseRef.current, 0, 0);
        }
      }
      isDrawingRef.current = false;
      isPanningRef.current = false;
      strokeBaseRef.current = null;
      strokePointsRef.current = [];
      wasPinchingRef.current = true;

      const pts = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const midX = (pts[0].x + pts[1].x) / 2;
      const midY = (pts[0].y + pts[1].y) / 2;
      pinchStartRef.current = {
        dist: Math.max(10, dist),
        midX,
        midY,
        zoom,
        panX: pan.x,
        panY: pan.y,
      };
    }
  };

  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activePointersRef.current.has(e.pointerId)) return;
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointersRef.current.size === 2 && pinchStartRef.current) {
      const pts = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const midX = (pts[0].x + pts[1].x) / 2;
      const midY = (pts[0].y + pts[1].y) / 2;

      const scaleRatio = dist / pinchStartRef.current.dist;
      const nextZoom = Math.round(
        Math.max(50, Math.min(350, pinchStartRef.current.zoom * scaleRatio))
      );
      setZoom(nextZoom);
      setPan({
        x: pinchStartRef.current.panX + (midX - pinchStartRef.current.midX),
        y: pinchStartRef.current.panY + (midY - pinchStartRef.current.midY),
      });
    }
  };

  const handleStagePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size < 2) {
      pinchStartRef.current = null;
    }
    if (activePointersRef.current.size === 0) {
      wasPinchingRef.current = false;
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Auto-close any open Photoshop flyout box immediately on canvas touch
    if (openFlyout !== null) {
      setOpenFlyout(null);
    }

    if (loading || loadError) return;
    if (activePointersRef.current.size >= 2 || wasPinchingRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);

    if (tool === 'pan' || e.button === 1) {
      isPanningRef.current = true;
      panStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
      return;
    }

    const pt = getCanvasPoint(e.clientX, e.clientY);

    if (tool === 'bucket') {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const changed = scanlineFloodFill(
        imgData,
        pt.x,
        pt.y,
        color,
        tolerance,
        protectLines ? inkMaskRef.current : null
      );
      if (changed) {
        ctx.putImageData(imgData, 0, 0);
        pushSnapshot(imgData);
      }
      return;
    }

    // Straight Line, Arrow Connector, or Circle Marker (live drag preview)
    if (tool === 'line' || tool === 'arrow' || tool === 'circle') {
      isDrawingRef.current = true;
      startPtRef.current = pt;
      lastPtRef.current = pt;
      strokeBaseRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      return;
    }

    // Translucent Highlighter Marker (for word tracking without hiding printed letters)
    if (tool === 'highlighter') {
      isDrawingRef.current = true;
      strokeBaseRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      strokePointsRef.current = [pt];
      ctx.save();
      ctx.globalAlpha = 0.36;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, Math.max(10, brushSize) / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    // Brush & Eraser (capture strokeBaseRef so accidental 2-finger pinch cancels cleanly)
    if (tool === 'brush' || tool === 'eraser') {
      isDrawingRef.current = true;
      lastPtRef.current = pt;
      strokeBaseRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, brushSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = tool === 'eraser' ? '#FFFFFF' : color;
      ctx.fill();
      ctx.restore();

      if (protectLines && inkMaskRef.current) {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        reapplyInkLines(imgData, inkMaskRef.current);
        ctx.putImageData(imgData, 0, 0);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointersRef.current.size >= 2 || wasPinchingRef.current) return;

    if (isPanningRef.current && panStartRef.current) {
      const dx = e.clientX - panStartRef.current.clientX;
      const dy = e.clientY - panStartRef.current.clientY;
      setPan({ x: panStartRef.current.panX + dx, y: panStartRef.current.panY + dy });
      return;
    }

    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const rawPt = getCanvasPoint(e.clientX, e.clientY);

    // Live rubber-band preview for Line, Arrow, and Circle tools
    if (
      (tool === 'line' || tool === 'arrow' || tool === 'circle') &&
      startPtRef.current &&
      strokeBaseRef.current
    ) {
      const pt =
        tool === 'circle' ? rawPt : snapAngleIfShift(startPtRef.current, rawPt, e.shiftKey);
      lastPtRef.current = pt;
      ctx.putImageData(strokeBaseRef.current, 0, 0);
      drawShapeOnContext(ctx, tool, startPtRef.current, pt, color, brushSize, lineStyle);
      return;
    }

    // Uniform-opacity smooth Highlighter stroke
    if (tool === 'highlighter' && strokeBaseRef.current) {
      strokePointsRef.current.push(rawPt);
      ctx.putImageData(strokeBaseRef.current, 0, 0);
      const pts = strokePointsRef.current;
      ctx.save();
      ctx.globalAlpha = 0.36;
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(14, brushSize * 1.4);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();
      ctx.restore();
      return;
    }

    // Smooth Brush / Eraser
    if ((tool === 'brush' || tool === 'eraser') && lastPtRef.current) {
      ctx.save();
      ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(lastPtRef.current.x, lastPtRef.current.y);
      ctx.lineTo(rawPt.x, rawPt.y);
      ctx.stroke();
      ctx.restore();
      lastPtRef.current = rawPt;
    }
  };

  const handlePointerUp = () => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      panStartRef.current = null;
      return;
    }

    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      startPtRef.current = null;
      lastPtRef.current = null;
      strokeBaseRef.current = null;
      strokePointsRef.current = [];

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      if (protectLines && inkMaskRef.current) {
        reapplyInkLines(imgData, inkMaskRef.current);
        ctx.putImageData(imgData, 0, 0);
      }
      pushSnapshot(imgData);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 15 : -15;
    setZoom((z) => Math.max(50, Math.min(350, z + delta)));
  };

  const handleSaveJpg = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `colorworld-${sheet.id}-colored.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.94);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handlePrintColored = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(`
      <!doctype html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            @page { size: ${paperSize === 'a4' ? 'A4' : 'letter'}; margin: 10mm; }
            body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
            img { max-width: 100%; max-height: 96vh; object-fit: contain; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" onload="window.print(); setTimeout(() => window.frameElement && window.frameElement.remove(), 500);" />
        </body>
      </html>
    `);
    doc.close();
  };

  const handleLocalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadFile) {
      onUploadFile(file);
      setOpenFlyout(null);
    }
    e.target.value = '';
  };

  const isColoringGroupActive =
    tool === 'bucket' || tool === 'brush' || tool === 'highlighter' || tool === 'eraser';
  const isLineGroupActive = tool === 'line' || tool === 'arrow' || tool === 'circle';

  const ActiveColoringIcon =
    lastColoringTool === 'bucket'
      ? PaintBucket
      : lastColoringTool === 'brush'
      ? Brush
      : lastColoringTool === 'highlighter'
      ? Highlighter
      : Eraser;

  const ActiveLineIcon =
    lastLineTool === 'line'
      ? Minus
      : lastLineTool === 'arrow'
      ? MoveUpRight
      : Circle;

  const activeToolLabel =
    tool === 'bucket'
      ? t.canvas.bucket
      : tool === 'brush'
      ? t.canvas.brush
      : tool === 'highlighter'
      ? 'Track'
      : tool === 'eraser'
      ? t.canvas.eraser
      : tool === 'line'
      ? 'Line'
      : tool === 'arrow'
      ? 'Map'
      : tool === 'circle'
      ? 'Circle'
      : t.canvas.pan;

  const toolHint =
    tool === 'bucket'
      ? detectedInkPct !== null && !loading
        ? `Outlines detected (${detectedInkPct}% ink) — tap inside any shape to fill.`
        : 'Tap inside any enclosed shape to fill.'
      : tool === 'line'
      ? 'Drag a straight line for image/letter mapping or tracing (Shift snaps 45°).'
      : tool === 'arrow'
      ? 'Drag from an image to its matching letter or word to draw an arrow.'
      : tool === 'circle'
      ? 'Drag to circle matching words, letters, or answers on worksheets.'
      : tool === 'highlighter'
      ? 'Translucent word-tracking marker that keeps printed letters readable.'
      : tool === 'brush'
      ? 'Smooth freehand pen for coloring and line tracing.'
      : tool === 'eraser'
      ? 'Erases color back to paper white while keeping black outlines sharp.'
      : 'Drag to move the page, or pinch with two fingers on mobile.';

  const cursorClass =
    tool === 'pan'
      ? 'cursor-grab active:cursor-grabbing'
      : tool === 'bucket' || isLineGroupActive
      ? 'cursor-crosshair'
      : 'cursor-cell';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${t.canvas.title}: ${title}`}
      className="fixed inset-0 z-50 bg-[#0F1E36]/90 backdrop-blur-sm flex flex-col"
    >
      {/* Hidden file picker shared between desktop header & mobile rail file menu */}
      {onUploadFile && (
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf,image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={handleLocalFileChange}
          className="hidden"
        />
      )}

      {/* Compact Top Studio Header Bar (Mobile-first single-row) */}
      <div className="h-12 sm:h-14 px-2.5 sm:px-4 bg-[#0F1E36] text-white border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs sm:text-base font-extrabold truncate">{title}</span>
          {pdfTotalPages > 1 && (
            <div className="flex items-center gap-0.5 bg-white/10 rounded-lg px-1 py-0.5 text-xs font-bold shrink-0">
              <button
                type="button"
                disabled={pdfPage <= 1}
                onClick={() => setPdfPage((p) => Math.max(1, p - 1))}
                aria-label="Previous PDF page"
                className="p-0.5 disabled:opacity-35 hover:text-[#FFB703] cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="tabular-nums px-1">
                {pdfPage}/{pdfTotalPages}
              </span>
              <button
                type="button"
                disabled={pdfPage >= pdfTotalPages}
                onClick={() => setPdfPage((p) => Math.min(pdfTotalPages, p + 1))}
                aria-label="Next PDF page"
                className="p-0.5 disabled:opacity-35 hover:text-[#FFB703] cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onUploadFile && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="hidden md:inline-flex h-9 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5 text-[#FFB703]" />
              <span>Open PDF / Image</span>
            </button>
          )}

          {/* Always-reachable Undo / Redo */}
          <div className="flex items-center bg-white/10 rounded-lg p-0.5">
            <button
              type="button"
              onClick={handleUndo}
              disabled={!canUndo}
              aria-label={t.canvas.undo}
              title={`${t.canvas.undo} (Ctrl+Z)`}
              className="min-w-[36px] h-8 sm:h-9 px-2 rounded-md text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-35 hover:bg-white/15 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <Undo2 className="w-4 h-4" />
              <span className="hidden lg:inline">{t.canvas.undo}</span>
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={!canRedo}
              aria-label={t.canvas.redo}
              title={`${t.canvas.redo} (Ctrl+Shift+Z)`}
              className="min-w-[36px] h-8 sm:h-9 px-2 rounded-md text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-35 hover:bg-white/15 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <Redo2 className="w-4 h-4" />
              <span className="hidden lg:inline">{t.canvas.redo}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleReset}
            title={t.canvas.reset}
            aria-label={t.canvas.reset}
            className="hidden sm:inline-flex h-9 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">{t.canvas.reset}</span>
          </button>

          {!sheet.uploadedFile && (
            <a
              href={sheet.pdfUrls[paperSize]}
              download={`colorworld-${sheet.id}-${paperSize}.pdf`}
              className="hidden md:inline-flex h-9 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>PDF</span>
            </a>
          )}

          <button
            type="button"
            onClick={handlePrintColored}
            className="hidden sm:inline-flex h-9 px-3 rounded-lg bg-[#2A9D8F] hover:bg-[#228579] text-white text-xs font-bold items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t.canvas.print}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveJpg}
            aria-label={t.canvas.saveJpg}
            className="h-9 px-2.5 sm:px-3.5 rounded-lg bg-[#E63946] hover:bg-[#D62839] text-white text-xs sm:text-sm font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{t.canvas.saveJpg}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label={t.canvas.close}
            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Full-Viewport Canvas Workspace + Photoshop-Style Floating Left Tool Rail */}
      <div
        onWheel={handleWheel}
        onPointerDownCapture={handleStagePointerDownCapture}
        onPointerMoveCapture={handleStagePointerMove}
        onPointerUpCapture={handleStagePointerUp}
        onPointerCancelCapture={handleStagePointerUp}
        className="flex-1 relative min-h-0 overflow-hidden bg-[#ECE8E1] dark:bg-[#0B1320] flex items-center justify-center select-none touch-none"
      >
        {/* Photoshop-Style Floating Left Toggle Tool Rail */}
        <div
          data-studio-ui="true"
          className="absolute left-2 sm:left-3.5 top-1/2 -translate-y-1/2 z-30 flex items-start gap-2 pointer-events-none"
        >
          {!railExpanded ? (
            <button
              type="button"
              onClick={() => setRailExpanded(true)}
              aria-label="Open tool box"
              title="Open tool box"
              className="pointer-events-auto min-w-[46px] min-h-[46px] px-2.5 py-2 rounded-2xl bg-[#0F1E36]/95 text-white border border-white/15 shadow-2xl flex flex-col items-center justify-center gap-1 hover:bg-[#192D4E] transition-colors cursor-pointer"
            >
              <PanelLeftOpen className="w-4 h-4 text-[#FFB703]" />
              <span
                className="w-4 h-4 rounded-full border-2 border-white/80"
                style={{ backgroundColor: color }}
              />
            </button>
          ) : (
            <nav
              aria-label="Studio tools"
              className="pointer-events-auto bg-[#0F1E36]/95 text-white border border-white/15 rounded-2xl shadow-2xl p-1.5 flex flex-col items-center gap-1 max-h-[calc(100dvh-76px)] overflow-y-auto backdrop-blur-md"
            >
              {/* Collapse Rail Button */}
              <button
                type="button"
                onClick={() => {
                  setOpenFlyout(null);
                  setRailExpanded(false);
                }}
                aria-label="Hide tool box"
                title="Hide tool box"
                className="w-11 h-7 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>

              <div className="w-7 h-px bg-white/10 my-0.5" />

              {/* 1. Coloring & Tracing Group Toggle (Fill, Brush, Track, Eraser) */}
              <button
                type="button"
                onClick={() => {
                  if (!isColoringGroupActive) {
                    selectTool(lastColoringTool);
                    setOpenFlyout('coloring');
                  } else {
                    toggleFlyout('coloring');
                  }
                }}
                aria-label="Coloring & tracing tools"
                aria-expanded={openFlyout === 'coloring'}
                title="Coloring & Tracing (Fill, Brush, Track, Eraser)"
                className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                  openFlyout === 'coloring' || isColoringGroupActive
                    ? 'bg-[#E63946] text-white shadow-sm'
                    : 'text-slate-200 hover:bg-white/10'
                }`}
              >
                <ActiveColoringIcon className="w-5 h-5" />
                <CornerFlyoutMark active={openFlyout === 'coloring' || isColoringGroupActive} />
              </button>

              {/* 2. Worksheet Line & Mapping Group Toggle (Line, Map Arrow, Circle) */}
              <button
                type="button"
                onClick={() => {
                  if (!isLineGroupActive) {
                    selectTool(lastLineTool);
                    setOpenFlyout('lines');
                  } else {
                    toggleFlyout('lines');
                  }
                }}
                aria-label="Worksheet line & mapping tools"
                aria-expanded={openFlyout === 'lines'}
                title="Worksheet Lines (Straight Line, Map Arrow, Circle)"
                className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                  openFlyout === 'lines' || isLineGroupActive
                    ? 'bg-[#2A9D8F] text-white shadow-sm'
                    : 'text-slate-200 hover:bg-white/10'
                }`}
              >
                <ActiveLineIcon className="w-5 h-5" />
                <CornerFlyoutMark active={openFlyout === 'lines' || isLineGroupActive} />
              </button>

              {/* 3. Photoshop Foreground Color Swatch Toggle */}
              <button
                type="button"
                onClick={() => toggleFlyout('color')}
                aria-label="Color palette"
                aria-expanded={openFlyout === 'color'}
                title="Colors & Custom Picker"
                className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                  openFlyout === 'color'
                    ? 'bg-white/20 ring-2 ring-[#FFB703]'
                    : 'hover:bg-white/10'
                }`}
              >
                <span
                  className="w-7 h-7 rounded-lg border-2 border-white shadow-inner block"
                  style={{ backgroundColor: color }}
                />
                <CornerFlyoutMark active={openFlyout === 'color'} />
              </button>

              {/* 4. Size, Style & Outline Protection Toggle */}
              <button
                type="button"
                onClick={() => toggleFlyout('settings')}
                aria-label="Tool size & outline settings"
                aria-expanded={openFlyout === 'settings'}
                title="Size, Tolerance & Outline Protection"
                className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                  openFlyout === 'settings'
                    ? 'bg-white/20 text-[#FFB703]'
                    : 'text-slate-200 hover:bg-white/10'
                }`}
              >
                <SlidersHorizontal className="w-5 h-5" />
                <CornerFlyoutMark active={openFlyout === 'settings'} />
              </button>

              {/* 5. Zoom & Pan Navigation Toggle */}
              <button
                type="button"
                onClick={() => toggleFlyout('view')}
                aria-label="Zoom and pan controls"
                aria-expanded={openFlyout === 'view'}
                title={`Zoom & Pan (${zoom}%)`}
                className={`relative w-11 h-11 rounded-xl flex flex-col items-center justify-center transition-colors cursor-pointer ${
                  openFlyout === 'view' || tool === 'pan'
                    ? 'bg-[#FFB703] text-[#0F1E36]'
                    : 'text-slate-200 hover:bg-white/10'
                }`}
              >
                {tool === 'pan' ? (
                  <Hand className="w-5 h-5" />
                ) : (
                  <ZoomIn className="w-5 h-5" />
                )}
                <CornerFlyoutMark active={openFlyout === 'view' || tool === 'pan'} />
              </button>

              <div className="w-7 h-px bg-white/10 my-0.5" />

              {/* 6. Page & Export Actions Toggle (especially helpful on mobile) */}
              <button
                type="button"
                onClick={() => toggleFlyout('file')}
                aria-label="Page actions and export"
                aria-expanded={openFlyout === 'file'}
                title="Open PDF/Image, Reset, Print & Download"
                className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                  openFlyout === 'file'
                    ? 'bg-white/20 text-white'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <MoreHorizontal className="w-5 h-5" />
                <CornerFlyoutMark active={openFlyout === 'file'} />
              </button>
            </nav>
          )}

          {/* Contextual Photoshop-Style Nested Flyout Toggle Box */}
          {railExpanded && openFlyout && (
            <div
              role="region"
              aria-label="Tool options panel"
              className="pointer-events-auto w-[252px] sm:w-[276px] max-w-[calc(100vw-76px)] max-h-[calc(100dvh-84px)] overflow-y-auto rounded-2xl bg-white/98 dark:bg-[#111C2D]/98 text-[#0F1E36] dark:text-slate-100 border border-[#CBD5E1] dark:border-slate-700 shadow-2xl p-3.5 backdrop-blur-md"
            >
              {/* Flyout 1: Coloring & Tracing Tools */}
              {openFlyout === 'coloring' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#0F1E36] dark:text-white">
                      Coloring &amp; Tracing
                    </span>
                    <button
                      type="button"
                      onClick={() => setOpenFlyout(null)}
                      aria-label="Close panel"
                      className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-[#64748B] cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'bucket' as ToolMode, label: t.canvas.bucket, sub: 'Tap to fill', icon: PaintBucket },
                      { id: 'brush' as ToolMode, label: t.canvas.brush, sub: 'Freehand pen', icon: Brush },
                      { id: 'highlighter' as ToolMode, label: 'Track', sub: 'Word marker', icon: Highlighter },
                      { id: 'eraser' as ToolMode, label: t.canvas.eraser, sub: 'Clean paper', icon: Eraser },
                    ].map((item) => {
                      const Icon = item.icon;
                      const active = tool === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => selectTool(item.id)}
                          className={`min-h-[48px] px-2.5 py-2 rounded-xl flex items-center gap-2 text-left transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#E63946] text-white shadow-sm'
                              : 'bg-[#FAF8F5] dark:bg-slate-800 text-[#1E293B] dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-extrabold leading-tight truncate">
                              {item.label}
                            </div>
                            <div
                              className={`text-[10px] leading-tight truncate ${
                                active ? 'text-white/80' : 'text-[#64748B] dark:text-slate-400'
                              }`}
                            >
                              {item.sub}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Quick Size / Tolerance right inside Coloring Box */}
                  <div className="pt-2 border-t border-[#E2E8F0] dark:border-slate-800">
                    {tool === 'bucket' ? (
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold mb-1">
                          <span>{t.canvas.tolerance}</span>
                          <span className="tabular-nums font-mono text-[#64748B] dark:text-slate-400">
                            {tolerance}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={10}
                          max={100}
                          value={tolerance}
                          onChange={(e) => setTolerance(Number(e.target.value))}
                          className="w-full accent-[#E63946] cursor-pointer"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span>{t.canvas.brushSize}</span>
                          <span className="tabular-nums font-mono text-[#64748B] dark:text-slate-400">
                            {brushSize}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min={2}
                          max={48}
                          value={brushSize}
                          onChange={(e) => setBrushSize(Number(e.target.value))}
                          className="w-full accent-[#E63946] cursor-pointer"
                        />
                        <div className="flex items-center justify-between gap-1.5">
                          {QUICK_SIZES.map((sz) => (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => setBrushSize(sz)}
                              className={`flex-1 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                                brushSize === sz
                                  ? 'bg-[#0F1E36] text-white dark:bg-white dark:text-[#0F1E36]'
                                  : 'bg-[#FAF8F5] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                              }`}
                              title={`${sz}px`}
                            >
                              <span
                                className="rounded-full bg-current block"
                                style={{
                                  width: Math.min(18, Math.max(4, sz / 2)),
                                  height: Math.min(18, Math.max(4, sz / 2)),
                                }}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Flyout 2: Worksheet Line, Mapping & Circle Tools */}
              {openFlyout === 'lines' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#0F1E36] dark:text-white">
                      Worksheet Line &amp; Mapping
                    </span>
                    <button
                      type="button"
                      onClick={() => setOpenFlyout(null)}
                      aria-label="Close panel"
                      className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-[#64748B] cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'line' as ToolMode, label: 'Line', icon: Minus },
                      { id: 'arrow' as ToolMode, label: 'Map', icon: MoveUpRight },
                      { id: 'circle' as ToolMode, label: 'Circle', icon: Circle },
                    ].map((item) => {
                      const Icon = item.icon;
                      const active = tool === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => selectTool(item.id)}
                          className={`min-h-[54px] py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 text-xs font-extrabold transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#2A9D8F] text-white shadow-sm'
                              : 'bg-[#FAF8F5] dark:bg-slate-800 text-[#1E293B] dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Line Style: Solid / Dashed / Dotted */}
                  <div>
                    <div className="text-xs font-bold text-[#64748B] dark:text-slate-400 mb-1.5">
                      Line Style
                    </div>
                    <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#FAF8F5] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700">
                      {(['solid', 'dashed', 'dotted'] as LineStyle[]).map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => setLineStyle(style)}
                          className={`min-h-[34px] text-xs font-bold rounded-lg capitalize transition-colors cursor-pointer ${
                            lineStyle === style
                              ? 'bg-[#2A9D8F] text-white'
                              : 'text-[#64748B] dark:text-slate-300 hover:text-[#0F1E36] dark:hover:text-white'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Line Thickness */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span>Line Width</span>
                      <span className="tabular-nums font-mono text-[#64748B] dark:text-slate-400">
                        {brushSize}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={32}
                      value={Math.min(32, brushSize)}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="w-full accent-[#2A9D8F] cursor-pointer"
                    />
                  </div>

                  <p className="text-[11px] text-[#64748B] dark:text-slate-400 leading-snug">
                    {toolHint}
                  </p>
                </div>
              )}

              {/* Flyout 3: Color Palette Toggle Box */}
              {openFlyout === 'color' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#0F1E36] dark:text-white">
                      Colors
                    </span>
                    <button
                      type="button"
                      onClick={() => setOpenFlyout(null)}
                      aria-label="Close colors"
                      className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-[#64748B] cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Active Color + Custom Color Picker */}
                  <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#FAF8F5] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-7 h-7 rounded-lg border border-black/20 shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs font-mono font-bold uppercase text-[#1E293B] dark:text-slate-200 truncate">
                        {color}
                      </span>
                    </div>
                    <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 text-xs font-bold cursor-pointer shrink-0">
                      <span>{t.canvas.customColor}</span>
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => selectColor(e.target.value)}
                        aria-label={t.canvas.customColor}
                        className="w-5 h-5 rounded border-0 cursor-pointer bg-transparent p-0"
                      />
                    </label>
                  </div>

                  {/* 20 Kid-Friendly Swatches (Touch-Friendly Grid) */}
                  <div className="grid grid-cols-5 gap-2">
                    {KID_PALETTE.map((swatch) => {
                      const selected = color.toLowerCase() === swatch.hex.toLowerCase();
                      return (
                        <button
                          key={swatch.hex}
                          type="button"
                          title={swatch.name}
                          aria-label={swatch.name}
                          onClick={() => selectColor(swatch.hex)}
                          style={{ backgroundColor: swatch.hex }}
                          className={`w-full aspect-square min-h-[38px] rounded-full border transition-transform cursor-pointer ${
                            selected
                              ? 'ring-2 ring-offset-2 ring-[#0F1E36] dark:ring-white dark:ring-offset-slate-900 scale-105 border-black/25'
                              : 'border-black/15 hover:scale-105'
                          }`}
                        />
                      );
                    })}
                  </div>

                  {/* Recent Colors Strip */}
                  {recentColors.length > 0 && (
                    <div className="pt-2 border-t border-[#E2E8F0] dark:border-slate-800">
                      <div className="text-[11px] font-bold text-[#64748B] dark:text-slate-400 mb-1.5">
                        Recent
                      </div>
                      <div className="flex items-center gap-1.5">
                        {recentColors.map((hex) => (
                          <button
                            key={hex}
                            type="button"
                            onClick={() => selectColor(hex)}
                            aria-label={`Recent color ${hex}`}
                            style={{ backgroundColor: hex }}
                            className="w-7 h-7 rounded-lg border border-black/15 cursor-pointer hover:scale-105 transition-transform"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Flyout 4: Tool Settings & Outline Protection */}
              {openFlyout === 'settings' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#0F1E36] dark:text-white">
                      Tool Settings · {activeToolLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => setOpenFlyout(null)}
                      aria-label="Close settings"
                      className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-[#64748B] cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {tool === 'bucket' ? (
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold mb-1">
                        <span>{t.canvas.tolerance}</span>
                        <span className="tabular-nums font-mono text-[#64748B] dark:text-slate-400">
                          {tolerance}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        value={tolerance}
                        onChange={(e) => setTolerance(Number(e.target.value))}
                        className="w-full accent-[#E63946] cursor-pointer"
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold mb-1">
                        <span>{t.canvas.brushSize}</span>
                        <span className="tabular-nums font-mono text-[#64748B] dark:text-slate-400">
                          {brushSize}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min={2}
                        max={48}
                        value={brushSize}
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                        className="w-full accent-[#E63946] cursor-pointer"
                      />
                    </div>
                  )}

                  <label className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 text-xs font-bold cursor-pointer select-none">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#2A9D8F] shrink-0" />
                      <span>{t.canvas.keepLines}</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={protectLines}
                      onChange={(e) => setProtectLines(e.target.checked)}
                      className="w-4 h-4 accent-[#2A9D8F] rounded cursor-pointer"
                    />
                  </label>

                  <p className="text-[11px] text-[#64748B] dark:text-slate-400 leading-snug">
                    {toolHint}
                  </p>
                </div>
              )}

              {/* Flyout 5: Zoom & Pan Navigation */}
              {openFlyout === 'view' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#0F1E36] dark:text-white">
                      Zoom &amp; Move
                    </span>
                    <button
                      type="button"
                      onClick={() => setOpenFlyout(null)}
                      aria-label="Close zoom panel"
                      className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-[#64748B] cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      selectTool('pan');
                      setOpenFlyout(null);
                    }}
                    className={`w-full min-h-[44px] px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      tool === 'pan'
                        ? 'bg-[#FFB703] text-[#0F1E36]'
                        : 'bg-[#FAF8F5] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Hand className="w-4 h-4" />
                    <span>{t.canvas.pan} Canvas</span>
                  </button>

                  <div className="flex items-center justify-between gap-1.5">
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.max(50, z - 25))}
                      aria-label="Zoom out"
                      className="flex-1 h-10 rounded-xl bg-[#FAF8F5] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center cursor-pointer"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="w-14 text-center text-xs font-extrabold tabular-nums">
                      {zoom}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.min(350, z + 25))}
                      aria-label="Zoom in"
                      className="flex-1 h-10 rounded-xl bg-[#FAF8F5] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center cursor-pointer"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setZoom(100);
                      setPan({ x: 0, y: 0 });
                    }}
                    className="w-full h-10 rounded-xl border border-[#CBD5E1] dark:border-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>{t.canvas.fit} Screen (100%)</span>
                  </button>

                  <p className="text-[11px] text-[#64748B] dark:text-slate-400 leading-snug">
                    On mobile, pinch with two fingers anywhere on the sheet to zoom and pan without switching tools.
                  </p>
                </div>
              )}

              {/* Flyout 6: File & Page Actions (Mobile-Accessible) */}
              {openFlyout === 'file' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-extrabold text-[#0F1E36] dark:text-white">
                      Page Actions
                    </span>
                    <button
                      type="button"
                      onClick={() => setOpenFlyout(null)}
                      aria-label="Close page actions"
                      className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-[#64748B] cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {onUploadFile && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full min-h-[42px] px-3 rounded-xl bg-[#FAF8F5] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-2.5 cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-[#E63946]" />
                      <span>Open Any PDF / Image</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handlePrintColored}
                    className="w-full min-h-[42px] px-3 rounded-xl bg-[#FAF8F5] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-2.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-[#2A9D8F]" />
                    <span>{t.canvas.print} Colored Page</span>
                  </button>

                  {!sheet.uploadedFile && (
                    <a
                      href={sheet.pdfUrls[paperSize]}
                      download={`colorworld-${sheet.id}-${paperSize}.pdf`}
                      onClick={() => setOpenFlyout(null)}
                      className="w-full min-h-[42px] px-3 rounded-xl bg-[#FAF8F5] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-2.5"
                    >
                      <FileDown className="w-4 h-4 text-[#0F1E36] dark:text-slate-200" />
                      <span>Download Blank PDF ({paperSize.toUpperCase()})</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full min-h-[42px] px-3 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/70 text-[#E63946] text-xs font-bold flex items-center gap-2.5 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{t.canvas.reset} Sheet</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Loading & Error Overlays */}
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#FAF8F5]/80 dark:bg-[#0B1320]/80">
            <div className="px-5 py-3 rounded-xl bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-700 shadow-lg text-sm font-bold text-[#1E293B] dark:text-slate-100">
              Detecting black outlines &amp; preparing canvas...
            </div>
          </div>
        )}

        {loadError && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
            <div className="max-w-md px-5 py-4 rounded-xl bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-700 shadow-lg text-center">
              <p className="text-sm font-bold text-[#E63946]">{loadError}</p>
            </div>
          </div>
        )}

        {/* Full-Stage Canvas Wrapper (automatically padded clear of left rail) */}
        <div
          className={`w-full h-full flex items-center justify-center ${
            railExpanded
              ? 'pl-16 pr-2.5 py-2.5 sm:pl-20 sm:pr-6 sm:py-5'
              : 'p-2.5 sm:p-5'
          }`}
        >
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
              transformOrigin: 'center center',
            }}
            className="transition-transform duration-75 ease-out"
          >
            <canvas
              ref={canvasRef}
              width={DEFAULT_CANVAS_W}
              height={DEFAULT_CANVAS_H}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={`max-h-[calc(100dvh-76px)] sm:max-h-[calc(100dvh-96px)] max-w-full w-auto h-auto bg-white rounded-xl shadow-2xl border-2 border-[#CBD5E1] ${cursorClass}`}
            />
          </div>
        </div>

        {/* Quiet Floating Bottom-Right Active Tool & Zoom Indicator (click to fit 100%) */}
        <button
          type="button"
          data-studio-ui="true"
          onClick={() => {
            setZoom(100);
            setPan({ x: 0, y: 0 });
          }}
          title="Reset zoom to fit screen"
          className="absolute bottom-3 right-3 z-20 px-2.5 py-1.5 rounded-xl bg-[#0F1E36]/85 text-white text-[11px] font-bold tabular-nums backdrop-blur-md border border-white/10 hover:bg-[#0F1E36] transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <span>{activeToolLabel}</span>
          <span aria-hidden="true" className="opacity-50">
            ·
          </span>
          <span>{zoom}%</span>
        </button>
      </div>
    </div>
  );
};
