const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const token  = () => localStorage.getItem("qc_token");
const hdr    = (form=false) => ({ Authorization:`Bearer ${token()}`, ...(!form && {"Content-Type":"application/json"}) });
const handle = async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error||"API error"); return d; };

export const authAPI = {
  login:    (email,pass) => fetch(`${BASE}/auth/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password:pass})}).then(handle),
  register: (name,email,pass,role) => fetch(`${BASE}/auth/register`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,email,password:pass,role})}).then(handle),
  me:       ()           => fetch(`${BASE}/auth/me`,{headers:hdr()}).then(handle),
};

export const inspectAPI = {
  upload: (file,product,station="A") => {
    const fd = new FormData();
    fd.append("image",file); fd.append("product",product); fd.append("station",station);
    return fetch(`${BASE}/inspect/upload`,{method:"POST",headers:hdr(true),body:fd}).then(handle);
  },
  history: (page=1,limit=20,status=null,product=null) => {
    const p = new URLSearchParams({page,limit});
    if(status)  p.set("status",status);
    if(product) p.set("product",product);
    return fetch(`${BASE}/inspect/history?${p}`,{headers:hdr()}).then(handle);
  },
  getRecord:    (id) => fetch(`${BASE}/inspect/record/${id}`,{headers:hdr()}).then(handle),
  deleteRecord: (id) => fetch(`${BASE}/inspect/record/${id}`,{method:"DELETE",headers:hdr()}).then(handle),
};

export const dashboardAPI = {
  kpis:       () => fetch(`${BASE}/dashboard/kpis`,       {headers:hdr()}).then(handle),
  daily:      () => fetch(`${BASE}/dashboard/daily`,      {headers:hdr()}).then(handle),
  hourly:     () => fetch(`${BASE}/dashboard/hourly`,     {headers:hdr()}).then(handle),
  defectDist: () => fetch(`${BASE}/dashboard/defect-dist`,{headers:hdr()}).then(handle),
  predictive: () => fetch(`${BASE}/dashboard/predictive`, {headers:hdr()}).then(handle),
};

export const cameraAPI = {
  start:     (id,source=0) => fetch(`${BASE}/camera/start/${id}`,{method:"POST",headers:hdr(),body:JSON.stringify({source})}).then(handle),
  stop:      (id)          => fetch(`${BASE}/camera/stop/${id}`, {method:"POST",headers:hdr()}).then(handle),
  status:    ()            => fetch(`${BASE}/camera/status`,     {headers:hdr()}).then(handle),
  streamUrl: (id)          => `${BASE}/camera/stream/${id}`,
};

export const alertsAPI = {
  list:         (page=1)  => fetch(`${BASE}/alerts/?page=${page}`,{headers:hdr()}).then(handle),
  resolve:      (id)      => fetch(`${BASE}/alerts/resolve/${id}`,{method:"POST",headers:hdr()}).then(handle),
  getConfig:    ()        => fetch(`${BASE}/alerts/config`,        {headers:hdr()}).then(handle),
  updateConfig: (cfg)     => fetch(`${BASE}/alerts/config`,{method:"PUT",headers:hdr(),body:JSON.stringify(cfg)}).then(handle),
};

export const reportsAPI = {
  pdfUrl:   (days=7) => `${BASE}/reports/pdf?days=${days}`,
  excelUrl: (days=7) => `${BASE}/reports/excel?days=${days}`,
};
