import React, { useState, useRef, useEffect } from 'react';
import papi from '../Axios/paxios';
import api from '../Axios/axios';
import { useToast } from '../components/ToastProvider';

const normalizeBbox = (bbox) => {
  if (!bbox) return null;
  if (Array.isArray(bbox) && bbox.length === 4) {
    const [a, b, c, d] = bbox.map(n => Number(n) || 0);
    if (c > a && d > b) return { x: a, y: b, w: c - a, h: d - b };
    return { x: a, y: b, w: c, h: d };
  }
  if (bbox.xmin !== undefined) return { x: bbox.xmin, y: bbox.ymin, w: bbox.xmax - bbox.xmin, h: bbox.ymax - bbox.ymin };
  if (bbox.x !== undefined && bbox.y !== undefined && bbox.w !== undefined) return { x: bbox.x, y: bbox.y, w: bbox.w, h: bbox.h };
  if (bbox.left !== undefined) return { x: bbox.left, y: bbox.top, w: bbox.width, h: bbox.height };
  return null;
};

const looksNormalizedFraction = (b) => {
  if (!b) return false;
  const vals = [b.x, b.y, b.w, b.h].map(v => Number(v));
  if (vals.some(v => Number.isNaN(v))) return false;
  return vals.every(v => v >= 0 && v <= 1);
};

const FormAutoFill = () => {
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [isPdf, setIsPdf] = useState(false);
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [fieldValues, setFieldValues] = useState({});
  const [simpleFields, setSimpleFields] = useState([]);
  const [simpleValues, setSimpleValues] = useState({});
  const [loadingExtractSimple, setLoadingExtractSimple] = useState(false);
  const [loadingFillSimple, setLoadingFillSimple] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [guideActive, setGuideActive] = useState(false);
  const [guideStep, setGuideStep] = useState(0);
  const [guideAnswers, setGuideAnswers] = useState({});
  const imgRef = useRef(null);
  const containerRef = useRef(null);
  const pdfCanvasRef = useRef(null);
  const [pdfRenderError, setPdfRenderError] = useState(null);
  const [naturalSize, setNaturalSize] = useState({ w: 1, h: 1 });
  const [pdfArrayBuffer, setPdfArrayBuffer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pdfRef = useRef(null);
  const pdfUrlRef = useRef(null);
  const initialValuesRef = useRef({ fieldValues: {}, simpleValues: {} });
  const [hasEdits, setHasEdits] = useState(false);
  const toast = useToast();

  useEffect(() => { return () => { if (imageUrl) URL.revokeObjectURL(imageUrl); }; }, [imageUrl]);

  useEffect(() => {
    return () => {
      try { if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current); } catch (e) {}
      try { if (pdfRef.current && typeof pdfRef.current.destroy === 'function') pdfRef.current.destroy(); } catch (e) {}
    };
  }, []);

  const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const base64ToUint8 = (b64) => {
    const bin = atob(b64); const len = bin.length; const arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) arr[i] = bin.charCodeAt(i);
    return arr;
  };

  const STORAGE_KEY = 'formAutofill:state:v1';

  const saveStateToStorage = async (opts = {}) => {
    try {
      const payload = { fileName: file ? file.name : null, fileType: file ? file.type : null, isPdf: !!isPdf, currentPage: currentPage || 1, totalPages: totalPages || 1, fields: fields || [], fieldValues: fieldValues || {} };
      if (file) {
        if (isPdf && pdfArrayBuffer) {
          const arr = new Uint8Array(pdfArrayBuffer); let binary = '';
          for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
          payload.fileBase64 = btoa(binary);
        } else if (!isPdf && imageUrl) {
          try { payload.fileBase64 = await blobToBase64(file); } catch (e) {}
        } else {
          try { payload.fileBase64 = await blobToBase64(file); } catch (e) {}
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (err) { console.warn('saveStateToStorage failed', err); }
  };

  const restoreStateFromStorage = async () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const obj = JSON.parse(raw);
      if (!obj) return false;
      setFieldValues(obj.fieldValues || {}); setFields(obj.fields || []);
      setCurrentPage(obj.currentPage || 1); setTotalPages(obj.totalPages || 1);
      if (obj.fileBase64 && obj.fileName) {
        const u8 = base64ToUint8(obj.fileBase64);
        const blob = new Blob([u8], { type: obj.fileType || 'application/pdf' });
        const f = new File([blob], obj.fileName, { type: obj.fileType || 'application/pdf' });
        setFile(f); const url = URL.createObjectURL(f); setImageUrl(url); setIsPdf(!!obj.isPdf);
        if (obj.isPdf) {
          try { setPdfArrayBuffer(u8.buffer); await renderPdfToCanvas(f, obj.currentPage || 1); } catch (e) { console.warn('restore pdf render failed', e); }
        } else { setTimeout(() => repaintValuesOnCanvas(1), 200); }
        initialValuesRef.current = { fieldValues: obj.fieldValues || {}, simpleValues: {} };
      }
      return true;
    } catch (err) { console.warn('restoreStateFromStorage failed', err); return false; }
  };

  useEffect(() => { restoreStateFromStorage().catch(() => {}); }, []);
  useEffect(() => { saveStateToStorage().catch(() => {}); }, [file, fields, fieldValues, currentPage, totalPages, isPdf]);

  useEffect(() => {
    try {
      const initial = initialValuesRef.current || { fieldValues: {}, simpleValues: {} };
      const cur = { fieldValues: fieldValues || {}, simpleValues: simpleValues || {} };
      const same = JSON.stringify(initial.fieldValues || {}) === JSON.stringify(cur.fieldValues || {}) && JSON.stringify(initial.simpleValues || {}) === JSON.stringify(cur.simpleValues || {});
      setHasEdits(!same);
    } catch (e) { setHasEdits(true); }
  }, [fieldValues, simpleValues]);

  const onFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setFile(f); const url = URL.createObjectURL(f); setImageUrl(url);
    const pdfCheck = f.type === 'application/pdf' || (f.name && f.name.toLowerCase().endsWith('.pdf'));
    setIsPdf(pdfCheck); setFields([]); setSelectedField(null); setFieldValues({});
    if (pdfCheck) {
      renderPdfToCanvas(f, 1);
      try {
        const reader = new FileReader();
        reader.onload = (ev) => setPdfArrayBuffer(ev.target.result);
        reader.readAsArrayBuffer(f);
      } catch (e) { console.warn('Could not read pdf array buffer', e); }
    }
  };

  const extractAcroFields = async () => {
    if (!file) { toast.error('Please select a PDF first.'); return; }
    setLoadingExtractSimple(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await api.post('/api/forms/extract', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const names = res.data.fields || []; setSimpleFields(names);
      const seed = {}; names.forEach(n => seed[n] = ''); setSimpleValues(seed);
    } catch (err) { console.error('extractAcroFields failed', err); toast.error('Failed to extract fields. Make sure the PDF has AcroForm fields.'); }
    finally { setLoadingExtractSimple(false); }
  };

  const handleSimpleValueChange = (name, value) => setSimpleValues(prev => ({ ...prev, [name]: value }));

  const fillAndDownload = async () => {
    if (!file) { toast.error('No file to fill.'); return; }
    setLoadingFillSimple(true);
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('values', JSON.stringify(simpleValues));
      const res = await api.post('/api/forms/fill', fd, { headers: { 'Content-Type': 'multipart/form-data' }, responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' }); const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = file.name ? `filled-${file.name}` : 'filled-form.pdf';
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err) { console.error('fillAndDownload failed', err); toast.error('Failed to fill or download PDF.'); }
    finally { setLoadingFillSimple(false); }
  };

  const renderPdfToCanvas = async (file, startPage = 1) => {
    setPdfRenderError(null); let pdfjs = null;
    try { pdfjs = await import('pdfjs-dist/legacy/build/pdf'); } catch (e1) {
      try { pdfjs = await import('pdfjs-dist/build/pdf'); } catch (e2) { setPdfRenderError('Failed to load PDF renderer'); return; }
    }
    try {
      if (pdfjs && pdfjs.GlobalWorkerOptions) { const ver = pdfjs.version || '2.16.105'; pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${ver}/pdf.worker.min.js`; }
      const url = URL.createObjectURL(file);
      if (pdfUrlRef.current) { try { URL.revokeObjectURL(pdfUrlRef.current); } catch (e) {} }
      pdfUrlRef.current = url;
      const loadingTask = pdfjs.getDocument(url); const pdf = await loadingTask.promise; pdfRef.current = pdf;
      setTotalPages(pdf.numPages || 1);
      const page = await pdf.getPage(startPage); const viewport = page.getViewport({ scale: 1 });
      const canvas = pdfCanvasRef.current;
      if (!canvas) { setPdfRenderError('No canvas available to render PDF'); return; }
      const context = canvas.getContext('2d');
      canvas.width = Math.round(viewport.width); canvas.height = Math.round(viewport.height);
      canvas.style.width = '100%'; canvas.style.height = 'auto';
      await page.render({ canvasContext: context, viewport }).promise;
      setNaturalSize({ w: viewport.width, h: viewport.height }); setCurrentPage(startPage);
      setTimeout(() => repaintValuesOnCanvas(startPage), 50);
    } catch (err) { console.error('PDF render failed', err); setPdfRenderError('Failed to render PDF preview'); }
  };

  const renderPage = async (pageNum) => {
    try {
      if (!pdfRef.current) return; const pdf = pdfRef.current; const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1 }); const canvas = pdfCanvasRef.current;
      if (!canvas) return; const ctx = canvas.getContext('2d');
      canvas.width = Math.round(viewport.width); canvas.height = Math.round(viewport.height);
      canvas.style.width = '100%'; canvas.style.height = 'auto';
      await page.render({ canvasContext: ctx, viewport }).promise;
      setNaturalSize({ w: viewport.width, h: viewport.height }); setCurrentPage(pageNum);
      setTimeout(() => repaintValuesOnCanvas(pageNum), 50);
    } catch (err) { console.error('renderPage failed', err); setPdfRenderError('Failed to render PDF page'); }
  };

  const repaintValuesOnCanvas = (pageNum) => {
    try {
      if (isPdf) { fields.forEach(f => { const fPage = f.page || 1; if (fPage !== pageNum) return; const val = fieldValues[f.id]; if (val) drawValueOnCanvas(f, val); }); }
      else { const canvas = applyAllValuesToCanvas(); if (!canvas) return; setImageUrl(canvas.toDataURL('image/png')); }
    } catch (err) { console.warn('repaintValuesOnCanvas failed', err); }
  };

  const detectFieldBoxes = async () => {
    try {
      let srcCanvas = null;
      if (isPdf && pdfCanvasRef.current) { srcCanvas = pdfCanvasRef.current; }
      else if (!isPdf && imgRef.current) {
        const img = imgRef.current; const off = document.createElement('canvas');
        off.width = naturalSize.w || img.naturalWidth || img.width; off.height = naturalSize.h || img.naturalHeight || img.height;
        const ctx = off.getContext('2d'); ctx.drawImage(img, 0, 0, off.width, off.height); srcCanvas = off;
      } else { return []; }
      const cw = srcCanvas.width; const ch = srcCanvas.height; const ctx = srcCanvas.getContext('2d'); if (!ctx) return [];
      const step = Math.max(4, Math.floor(Math.min(cw, ch) / 200)); const gw = Math.floor(cw / step); const gh = Math.floor(ch / step);
      const imgData = ctx.getImageData(0, 0, cw, ch).data; const grid = new Uint8Array(gw * gh);
      for (let gy = 0; gy < gh; gy++) { for (let gx = 0; gx < gw; gx++) { const px = Math.min(cw - 1, gx * step); const py = Math.min(ch - 1, gy * step); const i = (py * cw + px) * 4; const r = imgData[i], g = imgData[i + 1], b = imgData[i + 2]; const lum = 0.299 * r + 0.587 * g + 0.114 * b; const isYellow = (r > 200 && g > 180 && b < 180); if (lum > 220 || isYellow) grid[gy * gw + gx] = 1; } }
      const visited = new Uint8Array(gw * gh); const boxes = []; const neigh = [[1,0],[-1,0],[0,1],[0,-1]];
      for (let y = 0; y < gh; y++) { for (let x = 0; x < gw; x++) { const idx = y * gw + x; if (visited[idx] || !grid[idx]) continue; const q = [idx]; visited[idx] = 1; let minX = x, maxX = x, minY = y, maxY = y; while (q.length) { const cur = q.shift(); const cx = cur % gw; const cy = Math.floor(cur / gw); for (const [dx,dy] of neigh) { const nx = cx + dx; const ny = cy + dy; if (nx < 0 || nx >= gw || ny < 0 || ny >= gh) continue; const ni = ny * gw + nx; if (visited[ni]) continue; if (grid[ni]) { visited[ni] = 1; q.push(ni); minX = Math.min(minX, nx); maxX = Math.max(maxX, nx); minY = Math.min(minY, ny); maxY = Math.max(maxY, ny); } } } const px = Math.max(0, minX * step); const py = Math.max(0, minY * step); const pw = Math.min(cw, (maxX - minX + 1) * step); const ph = Math.min(ch, (maxY - minY + 1) * step); if (pw > 40 && ph > 10) boxes.push({ x: px, y: py, w: pw, h: ph }); } }
      if (boxes.length === 0) return [];
      const merged = []; const iou = (a,b) => { const ix = Math.max(a.x, b.x); const iy = Math.max(a.y, b.y); const ax = Math.min(a.x + a.w, b.x + b.w); const ay = Math.min(a.y + a.h, b.y + b.h); const iw = Math.max(0, ax - ix); const ih = Math.max(0, ay - iy); const inter = iw * ih; const uni = a.w * a.h + b.w * b.h - inter; return uni <= 0 ? 0 : inter / uni; };
      const used = new Array(boxes.length).fill(false);
      for (let i = 0; i < boxes.length; i++) { if (used[i]) continue; let base = { ...boxes[i] }; for (let j = i + 1; j < boxes.length; j++) { if (used[j]) continue; if (iou(base, boxes[j]) > 0.15) { const nx = Math.min(base.x, boxes[j].x); const ny = Math.min(base.y, boxes[j].y); const ax = Math.max(base.x + base.w, boxes[j].x + boxes[j].w); const ay = Math.max(base.y + base.h, boxes[j].y + boxes[j].h); base = { x: nx, y: ny, w: ax - nx, h: ay - ny }; used[j] = true; } } merged.push(base); }
      merged.sort((a,b) => (a.y - b.y) || (a.x - b.x));
      return merged.map(b => ({ x: b.x, y: b.y, w: b.w, h: b.h }));
    } catch (err) { console.error('detectFieldBoxes failed', err); return []; }
  };

  const analyze = async () => {
    if (!file) { toast.error('Please upload a form image or PDF first.'); return; }
    setLoading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await papi.post('/api/forms/analyze', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const returned = res.data.fields || [];
      const generateFallbackBbox = (idx, total) => { const pageW = Math.max(800, naturalSize.w || 1000); const pageH = Math.max(1000, naturalSize.h || 1400); const margin = 40; const availH = pageH - margin * 2; const itemH = Math.max(24, Math.floor(availH / Math.max(1, total)) - 8); return { x: margin, y: margin + idx * (itemH + 8), w: pageW - margin * 2, h: itemH }; };
      const getFieldPage = (f) => { if (!f) return 1; const candidates = [f.page, f.page_number, f.pageNumber, f.page_num, f.pageNum, f.pageno, f.pageNo, f.pageIndex, f.p]; for (const c of candidates) { if (c === undefined || c === null) continue; const n = Number(c); if (!Number.isNaN(n) && n >= 1) return Math.floor(n); } return 1; };
      const normalized = returned.map((f, i) => {
        let bboxNorm = normalizeBbox(f.bbox);
        if (bboxNorm && looksNormalizedFraction(bboxNorm)) { const pageW = Math.max(800, naturalSize.w || 1000); const pageH = Math.max(1000, naturalSize.h || 1400); bboxNorm = { x: Math.round(bboxNorm.x * pageW), y: Math.round(bboxNorm.y * pageH), w: Math.round(bboxNorm.w * pageW), h: Math.round(bboxNorm.h * pageH) }; }
        if (!bboxNorm || ((bboxNorm.w === 0 || bboxNorm.h === 0) && Array.isArray(f.bbox) && f.bbox.every(v => v === 0))) bboxNorm = generateFallbackBbox(i, returned.length);
        return { ...f, bboxNorm, page: getFieldPage(f) };
      });
      setFields(normalized);
      if (isPdf && pdfArrayBuffer) resolveAllFieldLabels(normalized, pdfArrayBuffer).catch(err => console.warn('resolveAllFieldLabels failed', err));
      const initialValues = {}; normalized.forEach(f => { if (f.value) initialValues[f.id] = f.value });
      if (Object.keys(initialValues).length) setFieldValues(prev => ({ ...prev, ...initialValues }));
      initialValuesRef.current = { fieldValues: (Object.keys(initialValues).length ? { ...initialValues } : {}), simpleValues: {} };
      setSelectedField(null);
    } catch (err) { console.error('Analyze failed', err); toast.error('Failed to analyze form.'); }
    finally { setLoading(false); }
  };

  const onImageLoad = (e) => { const img = e.target; setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight }); };

  const scaleBbox = (bbox) => {
    if (!bbox) return null;
    const el = isPdf ? pdfCanvasRef.current : imgRef.current; if (!el) return null;
    const rect = el.getBoundingClientRect(); const containerRect = containerRef.current ? containerRef.current.getBoundingClientRect() : null;
    const scaleX = rect.width / Math.max(1, naturalSize.w); const scaleY = rect.height / Math.max(1, naturalSize.h);
    const offsetLeft = containerRect ? (rect.left - containerRect.left) : 0; const offsetTop = containerRect ? (rect.top - containerRect.top) : 0;
    let left = Math.round(offsetLeft + (bbox.x * scaleX)); let top = Math.round(offsetTop + (bbox.y * scaleY));
    let width = Math.round(Math.max(1, bbox.w * scaleX)); let height = Math.round(Math.max(1, bbox.h * scaleY));
    if (containerRect) { left = Math.max(0, Math.min(left, Math.max(0, containerRect.width - width))); top = Math.max(0, Math.min(top, Math.max(0, containerRect.height - height))); }
    return { left, top, width, height };
  };

  const resolveAllFieldLabels = async (fieldsList, pdfBuffer) => {
    if (!fieldsList || !fieldsList.length || !pdfBuffer) return;
    let pdfjs = null;
    try { pdfjs = await import('pdfjs-dist/legacy/build/pdf'); } catch (e) { return; }
    try {
      const loadingTask = pdfjs.getDocument({ data: pdfBuffer }); const pdf = await loadingTask.promise;
      const updated = await Promise.all(fieldsList.map(async (f) => {
        try {
          const pageNum = f.page || 1; const page = await pdf.getPage(pageNum); const scale = 1.5; const viewport = page.getViewport({ scale });
          const annotations = await page.getAnnotations();
          const ann = annotations.find(a => (a.fieldName && a.fieldName === f.id) || (a.name && a.name === f.id) || (a.id && a.id === f.id));
          let label = f.label_text || f.id; let thumb = null;
          if (ann && ann.rect) {
            const vpRect = viewport.convertToViewportRectangle(ann.rect); const left = Math.min(vpRect[0], vpRect[2]); const top = Math.min(vpRect[1], vpRect[3]); const width = Math.abs(vpRect[2] - vpRect[0]); const height = Math.abs(vpRect[3] - vpRect[1]);
            const textContent = await page.getTextContent();
            const tokens = textContent.items.map(item => { const tr = pdfjs.Util.transform(viewport.transform, item.transform); return { str: item.str, x: tr[4], y: tr[5], width: item.width || 0, height: Math.abs(item.transform && item.transform[0]) || 10 }; });
            const cx = left + width / 2; const cy = top + height / 2;
            const scored = tokens.map(t => { const tx = t.x + (t.width / 2 || 0); const ty = t.y + (t.height / 2 || 0); const dx = tx - cx; const dy = ty - cy; return { t, dist: Math.sqrt(dx*dx + dy*dy), dy }; }).filter(s => Number.isFinite(s.dist));
            scored.sort((a,b) => { const pa = (a.dy < 0) ? 0 : 1; const pb = (b.dy < 0) ? 0 : 1; if (pa !== pb) return pa - pb; return a.dist - b.dist; });
            const nearest = scored.slice(0, 6).map(s => s.t.str).join(' ').trim(); if (nearest) label = nearest;
            const off = document.createElement('canvas'); off.width = Math.round(viewport.width); off.height = Math.round(viewport.height);
            const ctx = off.getContext('2d'); await page.render({ canvasContext: ctx, viewport }).promise;
            const pad = 8; const sx = Math.max(0, Math.floor(left - pad)); const sy = Math.max(0, Math.floor(top - pad)); const sw = Math.min(off.width - sx, Math.ceil(width + pad * 2)); const sh = Math.min(off.height - sy, Math.ceil(height + pad * 2));
            if (sw > 4 && sh > 4) { const thumbCanvas = document.createElement('canvas'); const tW = Math.min(240, sw); const tH = Math.min(160, sh); thumbCanvas.width = tW; thumbCanvas.height = tH; const tctx = thumbCanvas.getContext('2d'); tctx.drawImage(off, sx, sy, sw, sh, 0, 0, tW, tH); thumb = thumbCanvas.toDataURL('image/png'); }
          } else {
            try { const textContent = await page.getTextContent(); const sample = (textContent.items || []).slice(0, 8).map(i => i.str).join(' ').trim(); if (sample) label = sample.substring(0, 120); } catch (e) {}
          }
          return { ...f, label, thumbnail: thumb };
        } catch (err) { return f; }
      }));
      setFields(prev => prev.map(pf => { const u = updated.find(x => x.id === pf.id); return u ? { ...pf, label: u.label, thumbnail: u.thumbnail } : pf; }));
    } catch (err) { console.error('resolveAllFieldLabels main failure', err); }
  };

  const handleOverlayClick = (field) => setSelectedField(field);

  const drawTextOnCtx = (ctx, bbox, text) => {
    if (!ctx || !bbox || !text) return;
    const padding = Math.max(4, Math.floor(bbox.h * 0.12)); const fontSize = Math.max(10, Math.floor(bbox.h * 0.65));
    ctx.save(); ctx.fillStyle = '#000'; ctx.textBaseline = 'middle'; ctx.font = `${fontSize}px sans-serif`;
    const x = bbox.x + padding; const y = bbox.y + bbox.h / 2;
    ctx.beginPath(); ctx.rect(bbox.x + 1, bbox.y + 1, Math.max(2, bbox.w - 2), Math.max(2, bbox.h - 2)); ctx.clip();
    let draw = String(text || ''); const maxWidth = Math.max(10, bbox.w - padding * 2); let measured = ctx.measureText(draw).width;
    if (measured > maxWidth) { while (draw.length > 0 && ctx.measureText(draw + '…').width > maxWidth) draw = draw.slice(0, -1); draw = draw + '…'; }
    ctx.fillText(draw, x, y); ctx.restore();
  };

  const drawValueOnCanvas = (field, value) => {
    if (!field) return; const bbox = field.bboxNorm; if (!bbox) return;
    if (isPdf && pdfCanvasRef.current) { drawTextOnCtx(pdfCanvasRef.current.getContext('2d'), bbox, value || ''); }
    else if (!isPdf && imgRef.current) {
      const img = imgRef.current; const off = document.createElement('canvas'); const w = naturalSize.w || img.naturalWidth || img.width; const h = naturalSize.h || img.naturalHeight || img.height;
      off.width = w; off.height = h; const ctx = off.getContext('2d'); ctx.drawImage(img, 0, 0, w, h); drawTextOnCtx(ctx, bbox, value || ''); setImageUrl(off.toDataURL('image/png')); setNaturalSize({ w, h });
    }
  };

  const applyAllValuesToCanvas = () => {
    if (isPdf && pdfCanvasRef.current) { const src = pdfCanvasRef.current; const copy = document.createElement('canvas'); copy.width = src.width; copy.height = src.height; const ctx = copy.getContext('2d'); ctx.drawImage(src, 0, 0); fields.forEach(f => { const val = fieldValues[f.id]; if (val) drawTextOnCtx(ctx, f.bboxNorm, val); }); return copy; }
    if (!isPdf && imgRef.current) { const img = imgRef.current; const off = document.createElement('canvas'); const w = naturalSize.w || img.naturalWidth || img.width; const h = naturalSize.h || img.naturalHeight || img.height; off.width = w; off.height = h; const ctx = off.getContext('2d'); ctx.drawImage(img, 0, 0, w, h); fields.forEach(f => { const val = fieldValues[f.id]; if (val) drawTextOnCtx(ctx, f.bboxNorm, val); }); return off; }
    return null;
  };

  const downloadFilled = async () => {
    try {
      if (isPdf) {
        if (!pdfRef.current) { toast.error('PDF not loaded'); return; }
        const pdfDoc = pdfRef.current; const num = pdfDoc.numPages || totalPages || 1; const { jsPDF } = await import('jspdf'); let pdfOut = null;
        for (let p = 1; p <= num; p++) {
          const page = await pdfDoc.getPage(p); const viewport = page.getViewport({ scale: 1 }); const off = document.createElement('canvas'); off.width = Math.round(viewport.width); off.height = Math.round(viewport.height);
          const ctx = off.getContext('2d'); await page.render({ canvasContext: ctx, viewport }).promise;
          fields.forEach(f => { if ((f.page || 1) !== p) return; const val = fieldValues[f.id]; if (val) drawTextOnCtx(ctx, f.bboxNorm, val); });
          const dataUrl = off.toDataURL('image/png');
          if (!pdfOut) { const orientation = off.width >= off.height ? 'l' : 'p'; pdfOut = new jsPDF({ orientation, unit: 'px', format: [off.width, off.height] }); pdfOut.addImage(dataUrl, 'PNG', 0, 0, off.width, off.height); }
          else { pdfOut.addPage([off.width, off.height], off.width >= off.height ? 'l' : 'p'); pdfOut.setPage(pdfOut.getNumberOfPages()); pdfOut.addImage(dataUrl, 'PNG', 0, 0, off.width, off.height); }
        }
        if (!pdfOut) { toast.error('No pages rendered'); return; }
        const blob = pdfOut.output('blob'); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = (file && file.name) ? `filled-${file.name.replace(/\.[^.]+$/, '')}.pdf` : 'filled-form.pdf'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
      } else {
        const canvas = applyAllValuesToCanvas(); if (!canvas) { toast.error('Nothing to download'); return; }
        const dataUrl = canvas.toDataURL('image/png'); const { jsPDF } = await import('jspdf'); const orientation = canvas.width >= canvas.height ? 'l' : 'p'; const pdf = new jsPDF({ orientation, unit: 'px', format: [canvas.width, canvas.height] }); pdf.addImage(dataUrl, 'PNG', 0, 0, canvas.width, canvas.height);
        const blob = pdf.output('blob'); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = (file && file.name) ? `filled-${file.name.replace(/\.[^.]+$/, '')}.pdf` : 'filled-form.pdf'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
      }
      try { initialValuesRef.current = { fieldValues: { ...fieldValues }, simpleValues: { ...simpleValues } }; setHasEdits(false); } catch (e) {}
    } catch (err) { console.error('downloadFilled failed', err); toast.error('Failed to create download. Check console for details.'); }
  };

  const suggestField = async (field) => {
    if (!field) return; setSuggestLoading(true);
    try { const payload = { fieldId: field.id, context: fieldValues }; const res = await papi.post('/api/forms/suggest', payload); const sugg = res.data.suggestions || res.data.values || []; setSuggestions(sugg); if (sugg && sugg.length === 1) handleValueChange(field.id, sugg[0]); }
    catch (err) { console.error('Suggest failed', err); toast.error('Suggestion service failed.'); }
    finally { setSuggestLoading(false); }
  };

  const autoFillAll = async () => {
    setSuggestLoading(true);
    try { const payload = { context: fieldValues }; const res = await papi.post('/api/forms/suggest-all', payload); const map = res.data.values || {}; setFieldValues(prev => ({ ...prev, ...map })); toast.success('Auto-fill applied for returned fields. Review before exporting.'); }
    catch (err) { console.error('Auto-fill failed', err); toast.error('Auto-fill failed.'); }
    finally { setSuggestLoading(false); }
  };

  const askAi = async (field) => {
    if (!aiPrompt) { toast.error('Please enter a question or prompt for the AI.'); return; }
    setAiLoading(true);
    try { const payload = { prompt: aiPrompt, fieldId: field ? field.id : null, context: fieldValues }; const res = await papi.post('/api/forms/assist', payload); const answer = res.data.answer || res.data.suggestion || ''; if (field && answer) handleValueChange(field.id, answer); setSuggestions(answer ? [answer] : []); }
    catch (err) { console.error('AI assist failed', err); toast.error('AI assist failed.'); }
    finally { setAiLoading(false); }
  };

  const examplesForField = (field) => {
    if (!field) return [];
    const label = (field.label_text || field.id || '').toLowerCase();
    if (label.includes('given') || label.includes('first')) return ['John', 'Alice', 'Maria'];
    if (label.includes('family') || label.includes('last')) return ['Doe', 'Smith', 'Patel'];
    if (label.includes('email')) return ['name@example.com', 'user@company.com'];
    if (label.includes('phone')) return ['+1-555-123-4567', '+44 7700 900123'];
    if (label.includes('country')) return ['United States', 'India', 'United Kingdom'];
    if (label.includes('city')) return ['New York', 'Mumbai', 'London'];
    if (label.includes('postcode') || label.includes('zip')) return ['10001', '94105', 'SW1A 1AA'];
    if (label.includes('address')) return ['123 Example St', 'Flat 4B, 56 High St'];
    return ['Example value'];
  };

  const guideQuestionsForField = (field) => {
    if (!field) return [];
    const label = (field.label_text || field.id || '').toLowerCase();
    if (label.includes('given') || label.includes('first')) return [{ id: 'q_name_type', text: 'Is this a personal or company name?', type: 'choice', options: ['Personal', 'Company'] }, { id: 'q_preferred', text: 'Do you prefer a short or full given name?', type: 'choice', options: ['Short', 'Full'] }];
    if (label.includes('country')) return [{ id: 'q_region', text: 'Which continent or region is the address in?', type: 'choice', options: ['Americas', 'Europe', 'Asia', 'Africa', 'Oceania'] }];
    if (label.includes('city') || label.includes('postcode')) return [{ id: 'q_postcode', text: 'Do you know the postcode? (enter if yes)', type: 'text' }];
    return [{ id: 'q_generic', text: `Provide any detail that helps fill ${field.label_text || field.id}`, type: 'text' }];
  };

  const handleValueChange = (id, value) => setFieldValues(prev => ({ ...prev, [id]: value }));

  const exportValues = async () => {
    const payload = Object.entries(fieldValues).map(([id, value]) => ({ id, value }));
    try { await papi.post('/api/forms/export', { values: payload }); toast.success('Export successful'); }
    catch (err) { console.error('Export failed', err); toast.error('Export failed'); }
  };

  // shared styles
  const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#F9FAFB', fontSize: 13, color: '#0F1F3D', outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s', boxSizing: 'border-box', fontFamily: 'inherit' };
  const onFocus = e => { e.target.style.borderColor = '#C9963A'; e.target.style.boxShadow = '0 0 0 3px rgba(201,150,58,0.12)'; e.target.style.background = '#fff'; };
  const onBlur = e => { e.target.style.borderColor = '#D1D5DB'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F9FAFB'; };
  const chipStyle = { padding: '4px 10px', borderRadius: 20, border: '1px solid #E5E7EB', background: '#F9FAFB', color: '#374151', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' };

  return (
    <div style={{ padding: '28px 28px', background: '#F0F2F5', minHeight: '100%', fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#C9963A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>AI Powered</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F1F3D', margin: 0, letterSpacing: '-0.02em' }}>AutoFill Forms</h2>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '14px 16px', background: '#ffffff', borderRadius: 12, border: '1px solid #E5E7EB', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, border: '1.5px dashed #D1D5DB', background: '#FAFAFA', cursor: 'pointer', fontSize: 13, color: '#374151', fontWeight: 500, transition: 'border-color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#C9963A'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#D1D5DB'}
        >
          <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          {file ? file.name : 'Upload form…'}
          <input type="file" accept="image/*,.pdf" onChange={onFileChange} style={{ display: 'none' }} />
        </label>

        <button
          onClick={analyze}
          disabled={!file || loading}
          style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: (!file || loading) ? '#9CA3AF' : 'linear-gradient(135deg,#0F1F3D,#162848)', color: (!file || loading) ? '#fff' : '#E8B96A', fontWeight: 700, fontSize: 13, cursor: (!file || loading) ? 'not-allowed' : 'pointer', transition: 'opacity 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}
          onMouseEnter={e => { if (file && !loading) e.currentTarget.style.opacity = '0.85'; }}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          {loading ? (
            <><svg style={{ animation: 'spin 1s linear infinite', width: 14, height: 14 }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg><style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>Analyzing…</>
          ) : 'Analyze Form'}
        </button>

        <button
          onClick={downloadFilled}
          disabled={!hasEdits}
          style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: hasEdits ? 'linear-gradient(135deg,#C9963A,#A67820)' : '#E5E7EB', color: hasEdits ? '#fff' : '#9CA3AF', fontWeight: 700, fontSize: 13, cursor: hasEdits ? 'pointer' : 'not-allowed', transition: 'opacity 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}
          onMouseEnter={e => { if (hasEdits) e.currentTarget.style.opacity = '0.88'; }}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Download Filled
        </button>

        {fields.length > 0 && (
          <button
            onClick={autoFillAll}
            disabled={suggestLoading}
            style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 13, cursor: suggestLoading ? 'not-allowed' : 'pointer', marginLeft: 'auto' }}
            onMouseEnter={e => { if (!suggestLoading) e.currentTarget.style.background = '#F9FAFB'; }}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
          >
            {suggestLoading ? 'Auto-filling…' : '✨ Auto-fill All'}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

        {/* Document viewer */}
        <div ref={containerRef} style={{ flex: 1, position: 'relative', background: '#ffffff', borderRadius: 12, border: '1px solid #E5E7EB', minHeight: 500, overflow: 'hidden' }}>

          {/* Page nav */}
          {isPdf && totalPages > 1 && (
            <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 20, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(15,31,61,0.85)', borderRadius: 8, padding: '6px 10px' }}>
              <button onClick={() => renderPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1} style={{ padding: '3px 8px', borderRadius: 5, border: 'none', background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 12, cursor: currentPage <= 1 ? 'not-allowed' : 'pointer', opacity: currentPage <= 1 ? 0.4 : 1 }}>‹</button>
              <span style={{ fontSize: 12, color: '#E8B96A', fontWeight: 600 }}>Page {currentPage} / {totalPages}</span>
              <button onClick={() => renderPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages} style={{ padding: '3px 8px', borderRadius: 5, border: 'none', background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 12, cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', opacity: currentPage >= totalPages ? 0.4 : 1 }}>›</button>
              <input type="number" min={1} max={totalPages} value={currentPage} onChange={(e) => { const v = Math.max(1, Math.min(totalPages, Number(e.target.value) || 1)); renderPage(v); }} style={{ width: 44, padding: '3px 6px', borderRadius: 5, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 12, textAlign: 'center', outline: 'none' }} />
            </div>
          )}

          {imageUrl ? (
            isPdf ? (
              <div style={{ width: '100%', height: 'auto' }}>
                <canvas ref={pdfCanvasRef} />
                {pdfRenderError && <div style={{ padding: '10px 14px', margin: 8, fontSize: 12, color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8 }}>{pdfRenderError}</div>}
              </div>
            ) : (
              <img ref={imgRef} src={imageUrl} alt="form" onLoad={onImageLoad} style={{ width: '100%', height: 'auto', display: 'block' }} />
            )
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📄</div>
              <div style={{ fontSize: 14 }}>Upload a form image or PDF to begin.</div>
            </div>
          )}

          {/* Field overlays */}
          {fields.map(f => {
            const fPage = f.page || 1;
            if (isPdf && fPage !== currentPage) return null;
            const bbox = f.bboxNorm; const pos = scaleBbox(bbox);
            if (!bbox || !pos) return null;
            const displayLabel = f.label || f.label_text || f.id;
            const isSelected = selectedField && selectedField.id === f.id;
            return (
              <div key={f.id} onClick={() => handleOverlayClick(f)} title={displayLabel}
                style={{ position: 'absolute', left: pos.left, top: pos.top, width: pos.width, height: pos.height, border: `2px solid ${isSelected ? '#C9963A' : 'rgba(15,31,61,0.4)'}`, background: isSelected ? 'rgba(201,150,58,0.1)' : 'rgba(15,31,61,0.04)', cursor: 'pointer', borderRadius: 3, transition: 'border-color 0.15s, background 0.15s', boxSizing: 'border-box' }}
                onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = '#C9963A'; e.currentTarget.style.background = 'rgba(201,150,58,0.07)'; } }}
                onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'rgba(15,31,61,0.4)'; e.currentTarget.style.background = 'rgba(15,31,61,0.04)'; } }}
              />
            );
          })}
        </div>

        {/* Inspector panel */}
        <div style={{ width: 300, flexShrink: 0, background: '#ffffff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6', background: 'linear-gradient(135deg,#0F1F3D,#162848)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#C9963A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>AI Inspector</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>Field Inspector</div>
          </div>

          <div style={{ padding: '14px 14px', overflowY: 'auto', maxHeight: 'calc(100vh - 240px)', scrollbarWidth: 'none' }}>

            {/* Simple AcroForm fields */}
            {simpleFields && simpleFields.length > 0 && (
              <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 10, background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0F1F3D', marginBottom: 10 }}>Detected form fields (fillable PDF)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
                  {simpleFields.map(name => (
                    <div key={name} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <label style={{ width: 110, fontSize: 12, color: '#374151', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</label>
                      <input value={simpleValues[name] || ''} onChange={(e) => handleSimpleValueChange(name, e.target.value)} style={{ ...inputStyle, flex: 1 }} onFocus={onFocus} onBlur={onBlur} />
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                  <button onClick={fillAndDownload} disabled={loadingFillSimple} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: loadingFillSimple ? '#9CA3AF' : 'linear-gradient(135deg,#C9963A,#A67820)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: loadingFillSimple ? 'not-allowed' : 'pointer' }}>{loadingFillSimple ? 'Filling…' : 'Fill & Download'}</button>
                  <button onClick={() => { setSimpleFields([]); setSimpleValues({}); }} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', color: '#374151', fontSize: 12, cursor: 'pointer' }}>Clear</button>
                </div>
              </div>
            )}

            {!selectedField ? (
              <div style={{ padding: '24px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>🖱️</div>
                <div style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.6 }}>
                  {isPdf ? `PDF loaded — page ${currentPage} of ${totalPages}. Click a highlighted box to inspect a field.` : 'Click a highlighted box on the form to inspect a field.'}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Field header */}
                <div style={{ padding: '10px 12px', background: 'rgba(201,150,58,0.07)', borderRadius: 8, border: '1px solid rgba(201,150,58,0.2)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F1F3D' }}>{selectedField.label_text || selectedField.id}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>ID: {selectedField.id}</div>
                </div>

                {selectedField.description && (
                  <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6, padding: '8px 10px', background: '#F9FAFB', borderRadius: 6 }}>{selectedField.description}</div>
                )}

                {/* Suggestions from field */}
                {(selectedField.suggestions || []).length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Suggestions</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {(selectedField.suggestions || []).map((s, idx) => (
                        <button key={idx} onClick={() => handleValueChange(selectedField.id, s)} style={chipStyle}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9963A'; e.currentTarget.style.background = 'rgba(201,150,58,0.06)'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = '#F9FAFB'; }}
                        >{s}</button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Examples */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Examples</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {examplesForField(selectedField).map((ex, i) => (
                      <button key={i} onClick={() => handleValueChange(selectedField.id, ex)} style={chipStyle}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9963A'; e.currentTarget.style.background = 'rgba(201,150,58,0.06)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = '#F9FAFB'; }}
                      >{ex}</button>
                    ))}
                  </div>
                </div>

                {/* Guide */}
                {guideActive && (
                  <div style={{ padding: '12px 12px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0F1F3D', marginBottom: 8 }}>Guided questions</div>
                    {guideQuestionsForField(selectedField).map((q, idx) => (
                      <div key={q.id} style={{ display: guideStep === idx ? 'block' : 'none', marginBottom: 8 }}>
                        <div style={{ fontSize: 12, color: '#374151', marginBottom: 6 }}>{q.text}</div>
                        {q.type === 'choice' ? (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {q.options.map(opt => (
                              <button key={opt} onClick={() => setGuideAnswers(prev => ({ ...prev, [q.id]: opt }))}
                                style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: guideAnswers[q.id] === opt ? 'linear-gradient(135deg,#0F1F3D,#162848)' : '#ffffff', color: guideAnswers[q.id] === opt ? '#E8B96A' : '#374151', border: guideAnswers[q.id] === opt ? 'none' : '1px solid #E5E7EB', fontSize: 12, cursor: 'pointer' }}
                              >{opt}</button>
                            ))}
                          </div>
                        ) : (
                          <input value={guideAnswers[q.id] || ''} onChange={(e) => setGuideAnswers(prev => ({ ...prev, [q.id]: e.target.value }))} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                        )}
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      <button onClick={() => setGuideStep(s => Math.max(0, s - 1))} style={{ ...chipStyle, fontSize: 11 }}>Back</button>
                      <button onClick={() => setGuideStep(s => s + 1)} style={{ ...chipStyle, fontSize: 11 }}>Next</button>
                      <button onClick={() => { const guidePrompt = Object.entries(guideAnswers || {}).map(([k, v]) => `${k}: ${v}`).join('; '); setAiPrompt(guidePrompt); askAi(selectedField); }} style={{ padding: '5px 12px', borderRadius: 7, border: 'none', background: 'linear-gradient(135deg,#C9963A,#A67820)', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Show suggestion</button>
                      <button onClick={() => setGuideActive(false)} style={{ ...chipStyle, fontSize: 11 }}>Done</button>
                    </div>
                  </div>
                )}

                {/* Value input */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#374151', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Value</label>
                  <input value={fieldValues[selectedField.id] || ''} onChange={(e) => handleValueChange(selectedField.id, e.target.value)} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                </div>

                {/* AI suggestions result */}
                {suggestions && suggestions.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>AI Suggestions</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {suggestions.map((s, i) => (
                        <button key={i} onClick={() => handleValueChange(selectedField.id, s)} style={chipStyle}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9963A'; e.currentTarget.style.background = 'rgba(201,150,58,0.06)'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = '#F9FAFB'; }}
                        >{s}</button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #F3F4F6' }}>
                  <button onClick={() => { drawValueOnCanvas(selectedField, fieldValues[selectedField.id] || ''); setSelectedField(null); }}
                    style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', color: '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >Done</button>
                  <button onClick={() => downloadFilled()}
                    style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#C9963A,#A67820)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormAutoFill;