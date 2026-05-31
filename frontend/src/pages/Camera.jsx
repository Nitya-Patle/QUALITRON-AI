import { useState, useEffect, useRef } from "react";
import { C } from "../theme";
import { cameraAPI } from "../utils/api";
import SectionTitle from "../components/SectionTitle";

const DEFECT_TYPES = ["Scratch","Crack","Dent","Discoloration","Missing Part","Rust"];

export default function Camera() {
  const [active,setActive]       = useState(false);
  const [frameCount,setFrameCount]= useState(0);
  const [detections,setDets]     = useState([]);
  const [streamUrl,setStreamUrl] = useState(null);
  const intervalRef = useRef();

  const startCamera = async () => {
    try {
      await cameraAPI.start("cam01", 0);
      setStreamUrl(cameraAPI.streamUrl("cam01"));
    } catch { console.log("Backend not connected, demo mode"); }
    setActive(true);
    intervalRef.current = setInterval(() => {
      setFrameCount(c=>c+1);
      if (Math.random()<0.12) {
        setDets(prev=>[{id:Date.now(),type:DEFECT_TYPES[Math.floor(Math.random()*DEFECT_TYPES.length)],
          conf:(0.75+Math.random()*0.23).toFixed(2),time:new Date().toLocaleTimeString()},...prev.slice(0,9)]);
      }
    },1000);
  };

  const stopCamera = async () => {
    clearInterval(intervalRef.current);
    try { await cameraAPI.stop("cam01"); } catch {}
    setActive(false); setStreamUrl(null);
  };

  useEffect(()=>()=>clearInterval(intervalRef.current),[]);

  return (
    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:20}}>
      <div style={{background:C.card,borderRadius:16,padding:20,border:`1px solid ${C.border}`}}>
        <SectionTitle>Live CCTV Feed — Camera 01</SectionTitle>
        <div style={{position:"relative",background:"#000",borderRadius:12,overflow:"hidden",
          aspectRatio:"16/9",marginBottom:16,border:`2px solid ${active?C.green:C.border}`}}>
          {streamUrl ? (
            <img src={streamUrl} alt="live" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          ) : (
            <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",
              background:active?"linear-gradient(135deg,#0a1628,#112244,#0a1628)":"#111"}}>
              {!active ? (
                <div style={{textAlign:"center",color:C.muted}}>
                  <div style={{fontSize:56}}>📷</div>
                  <div style={{marginTop:8}}>Camera Offline</div>
                </div>
              ) : (
                <div style={{width:"100%",height:"100%",position:"relative",
                  background:"repeating-linear-gradient(0deg,#0001 0,#0001 1px,transparent 1px,transparent 20px),repeating-linear-gradient(90deg,#0001 0,#0001 1px,transparent 1px,transparent 20px),linear-gradient(135deg,#0a1628,#112244)"}}>
                  <div style={{position:"absolute",top:"35%",left:"30%",width:140,height:90,
                    border:`2px solid ${C.accent}`,borderRadius:4,opacity:0.6}}/>
                  {detections.length>0 && (
                    <div style={{position:"absolute",top:"42%",left:"38%",width:50,height:35,
                      border:`2px solid ${C.red}`,borderRadius:2}}>
                      <div style={{position:"absolute",top:-14,left:0,fontSize:9,color:C.red,fontFamily:"monospace",whiteSpace:"nowrap"}}>
                        {detections[0]?.type}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {active && (
            <>
              <div style={{position:"absolute",top:10,left:10,background:"#0008",borderRadius:6,
                padding:"4px 10px",fontSize:11,color:C.green,fontFamily:"monospace",
                display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:6,height:6,background:C.red,borderRadius:"50%",animation:"pulse 1s infinite"}}/>
                REC · {String(Math.floor(frameCount/60)).padStart(2,"0")}:{String(frameCount%60).padStart(2,"0")}
              </div>
              <div style={{position:"absolute",top:10,right:10,background:"#0008",borderRadius:6,
                padding:"4px 10px",fontSize:11,color:C.accent,fontFamily:"monospace"}}>30 FPS | 1080p</div>
              <div style={{position:"absolute",bottom:10,left:10,background:"#0008",borderRadius:6,
                padding:"4px 10px",fontSize:10,color:C.muted,fontFamily:"monospace"}}>
                CAM01 | STATION-A | {new Date().toLocaleString()}
              </div>
            </>
          )}
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={active?stopCamera:startCamera} style={{flex:1,padding:12,borderRadius:10,fontWeight:800,
            cursor:"pointer",border:`1px solid ${active?C.red:C.green}`,
            background:active?`${C.red}22`:`linear-gradient(135deg,${C.green},#00aa55)`,
            color:active?C.red:"#000"}}>
            {active?"⏹ STOP MONITORING":"▶ START MONITORING"}
          </button>
          <button style={{padding:12,paddingLeft:20,paddingRight:20,borderRadius:10,
            border:`1px solid ${C.border}`,background:C.bg,color:C.text,cursor:"pointer",fontWeight:700}}>
            📸 SNAPSHOT
          </button>
        </div>
      </div>

      <div style={{background:C.card,borderRadius:16,padding:20,border:`1px solid ${C.border}`,
        display:"flex",flexDirection:"column",gap:16}}>
        <SectionTitle>Live Detections</SectionTitle>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[["FRAMES",frameCount,C.accent],["ALERTS",detections.length,C.red]].map(([l,v,c],i)=>(
            <div key={i} style={{background:C.bg,borderRadius:8,padding:12,textAlign:"center"}}>
              <div style={{fontSize:22,fontWeight:800,color:c,fontFamily:"monospace"}}>{v}</div>
              <div style={{fontSize:10,color:C.muted}}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{flex:1,overflowY:"auto",maxHeight:260}}>
          {detections.length===0 ? (
            <div style={{textAlign:"center",color:C.muted,padding:32,fontSize:13}}>
              {active?"Monitoring... No defects yet":"Start camera to see live alerts"}
            </div>
          ) : detections.map((d,i)=>(
            <div key={d.id} style={{padding:"10px 12px",borderRadius:8,marginBottom:8,
              background:C.bg,border:`1px solid ${C.red}44`,animation:i===0?"fadeIn 0.3s":undefined}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontWeight:700,color:C.red,fontSize:13}}>⚠ {d.type}</span>
                <span style={{fontSize:10,color:C.muted}}>{d.time}</span>
              </div>
              <div style={{fontSize:11,color:C.muted}}>Confidence: {d.conf}</div>
            </div>
          ))}
        </div>
        <div>
          <div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:8}}>IoT SENSORS</div>
          {[["Temperature","72°C",true],["Vibration","0.4g",true],
            ["Humidity","65%",false],["Speed","1.2m/s",true]].map(([l,v,ok],i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <span style={{fontSize:11,color:C.muted}}>{l}</span>
              <span style={{fontSize:12,fontWeight:700,color:ok?C.green:C.yellow}}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
