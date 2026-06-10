import { useState, useEffect } from "react";
import { C } from "../theme";
import { inspectAPI, reportsAPI } from "../utils/api";
import SectionTitle from "../components/SectionTitle";

const PRODS=["Gear Shaft","Bearing Ring","Valve Body","Turbine Blade","PCB Module"];
const OPS  =["Rahul K","Priya M","Arjun S","Meera T"];

function demoRecords() {
  return Array.from({length:15},(_,i)=>({
    _id:`QC-${1000+i}`,product:PRODS[i%5],operator:OPS[i%4],station:["A","B","C"][i%3],
    status:i%4===0?"FAIL":"PASS",defect_count:i%4===0?Math.floor(1+Math.random()*3):0,
    accuracy:+(88+Math.random()*10).toFixed(1),
    timestamp:new Date(Date.now()-i*3600000).toLocaleString()
  }));
}

export default function Records() {
  const [records,setRecords] = useState([]);
  const [search, setSearch]  = useState("");
  const [filter, setFilter]  = useState("ALL");
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    inspectAPI.history(1,50).then(d=>{ setRecords(d.records); setLoading(false); })
      .catch(()=>{ setRecords(demoRecords()); setLoading(false); });
  },[]);

  const filtered = records.filter(r=>{
    const q = search.toLowerCase();
    const matchSearch = r.product?.toLowerCase().includes(q) || r._id?.toLowerCase().includes(q) || r.operator?.toLowerCase().includes(q);
    const matchFilter = filter==="ALL" || r.status===filter;
    return matchSearch && matchFilter;
  });

  const del = async (id) => {
    if (!window.confirm("Delete this record?")) return;
    try { await inspectAPI.deleteRecord(id); } catch {}
    setRecords(prev=>prev.filter(r=>r._id!==id));
  };

  const handleDownload = async (type) => {
    try {
      const blob = type === 'pdf' ? await reportsAPI.downloadPdf(7) : await reportsAPI.downloadExcel(7);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qualitron_report_${Date.now()}.${type === 'pdf' ? 'pdf' : 'xlsx'}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch(e) { alert("Download failed. Please ensure you have data and are logged in."); }
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="🔍 Search by product, ID, or operator..."
          style={{flex:1,minWidth:200,padding:"10px 16px",borderRadius:10,
            background:`${C.card}`,border:`1px solid ${C.border}`,color:`${C.text}`,fontSize:13,outline:"none"}}/>
        {["ALL","PASS","FAIL"].map(f=>(
          <div key={f} onClick={()=>setFilter(f)} style={{padding:"10px 16px",borderRadius:10,cursor:"pointer",
            fontWeight:700,fontSize:13,border:`1px solid ${filter===f?(f==="FAIL"?C.red:f==="PASS"?C.green:C.accent):`${C.border}`}`,
            background:filter===f?`${f==="FAIL"?C.red:f==="PASS"?C.green:C.accent}22`:`${C.card}`,
            color:filter===f?(f==="FAIL"?C.red:f==="PASS"?C.green:C.accent):`${C.muted}`}}>{f}</div>
        ))}
        <div style={{padding:"10px 16px",borderRadius:10,background:`${C.card}`,border:`1px solid ${C.border}`,color:`${C.muted}`,fontSize:13}}>
          {filtered.length} records
        </div>
        <button onClick={() => handleDownload('pdf')}
          style={{padding:"10px 16px",borderRadius:10,background:`linear-gradient(135deg, ${C.red}, #ff4040)`,border:"none",color:"#fff",fontWeight:800,fontSize:13,cursor:"pointer",boxShadow:"0 4px 10px rgba(255,0,0,0.3)"}}>
          📄 PDF
        </button>
        <button onClick={() => handleDownload('excel')}
          style={{padding:"10px 16px",borderRadius:10,background:`linear-gradient(135deg, ${C.green}, #00aa55)`,border:"none",color:"#000",fontWeight:800,fontSize:13,cursor:"pointer",boxShadow:"0 4px 10px rgba(0,255,0,0.2)"}}>
          📊 EXCEL
        </button>
      </div>

      <div style={{background:`${C.card}`,borderRadius:16,padding:20,border:`1px solid ${C.border}`,overflowX:"auto"}}>
        {loading ? (
          <div style={{textAlign:"center",padding:40,color:C.muted}}>Loading records...</div>
        ) : (
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr>{["ID","Product","Operator","Station","Status","Defects","Accuracy","Timestamp","Action"].map(h=>(
                <th key={h} style={{textAlign:"left",padding:"8px 12px",color:C.muted,
                  fontWeight:700,borderBottom:`1px solid ${C.border}`,fontSize:11,letterSpacing:1}}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.map((r,i)=>(
                <tr key={i}
                  onMouseEnter={e=>e.currentTarget.style.background=`${C.accent}08`}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                  style={{borderBottom:`1px solid ${C.border}22`}}>
                  <td style={{padding:"10px 12px",color:C.accent,fontFamily:"monospace",fontWeight:700}}>{r._id}</td>
                  <td style={{padding:"10px 12px",color:C.text}}>{r.product}</td>
                  <td style={{padding:"10px 12px",color:C.text}}>{r.operator}</td>
                  <td style={{padding:"10px 12px",color:C.muted}}>{r.station||"A"}</td>
                  <td style={{padding:"10px 12px"}}>
                    <span style={{padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:800,
                      background:r.status==="PASS"?`${C.green}22`:`${C.red}22`,
                      color:r.status==="PASS"?C.green:C.red,
                      border:`1px solid ${r.status==="PASS"?C.green:C.red}`}}>{r.status}</span>
                  </td>
                  <td style={{padding:"10px 12px",color:r.defect_count>0?C.red:C.green,fontWeight:700}}>{r.defect_count}</td>
                  <td style={{padding:"10px 12px",color:C.yellow}}>{r.accuracy}%</td>
                  <td style={{padding:"10px 12px",color:C.muted,fontSize:11}}>{r.timestamp}</td>
                  <td style={{padding:"10px 12px"}}>
                    <span onClick={()=>del(r._id)} style={{cursor:"pointer",color:C.red,fontSize:11,fontWeight:700}}>🗑 DEL</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
