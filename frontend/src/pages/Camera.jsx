import { useState, useEffect, useRef } from "react";
import { C } from "../theme";
import { cameraAPI } from "../utils/api";
import SectionTitle from "../components/SectionTitle";

export default function Camera() {
  const [active, setActive] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [detections, setDets] = useState([]);
  const [streamUrl, setStreamUrl] = useState(null);
  const [passStatus, setPassStatus] = useState(null); // "PASS" or "FAIL"
  
  const intervalRef = useRef();
  const videoRef = useRef();
  const canvasRef = useRef();
  const activeRef = useRef(false);
  const isProcessing = useRef(false);

  const captureFrame = async () => {
    if (!activeRef.current || !videoRef.current || !canvasRef.current) return;
    
    if (!isProcessing.current) {
      isProcessing.current = true;
      try {
        setFrameCount(c => c + 1);
        const canvas = canvasRef.current;
        const video = videoRef.current;
        
        if (video.videoWidth > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const b64 = canvas.toDataURL("image/jpeg", 0.7); // slightly lower quality to save bandwidth
          
          const res = await cameraAPI.processFrame(b64);
          
          if (res.annotated_image) {
            setStreamUrl(res.annotated_image);
          }
          
          if (res.defects) {
            setPassStatus(res.defects.length === 0 ? "PASS" : "FAIL");
            
            if (res.defects.length > 0) {
              setDets(prev => {
                const newDets = res.defects.map(d => ({
                  id: Date.now() + Math.random(),
                  type: d.type,
                  conf: d.confidence,
                  time: new Date().toLocaleTimeString()
                }));
                return [...newDets, ...prev].slice(0, 15);
              });
            }
          }
        }
      } catch (e) {
        console.error("AI inference error:", e);
      } finally {
        isProcessing.current = false;
      }
    }
    
    // Recursively call the next frame after 1.5 seconds, but ONLY if we are still active
    if (activeRef.current) {
      intervalRef.current = setTimeout(captureFrame, 1500);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setActive(true);
      activeRef.current = true;
      setPassStatus("PASS"); // Initial optimistic state
      
      // Start the recursive capture loop
      intervalRef.current = setTimeout(captureFrame, 1000);
      
    } catch (e) {
      console.error(e);
      alert("Webcam access denied or unavailable: " + e.message);
    }
  };

  const stopCamera = () => {
    activeRef.current = false;
    clearTimeout(intervalRef.current);
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    setActive(false);
    setStreamUrl(null);
    setPassStatus(null);
  };

  useEffect(() => () => stopCamera(), []);

  return (
    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:20}}>
      <div style={{background:C.card,borderRadius:16,padding:20,border:`1px solid ${C.border}`}}>
        <SectionTitle>Live CCTV Feed — Local Webcam</SectionTitle>
        <div style={{position:"relative",background:"#000",borderRadius:12,overflow:"hidden",
          aspectRatio:"16/9",marginBottom:16,border:`2px solid ${active?C.green:C.border}`}}>
          
          <canvas ref={canvasRef} style={{ display: "none" }} />
          
          <video 
            ref={videoRef} 
            style={{ width: "100%", height: "100%", objectFit: "cover", display: active ? "block" : "none" }} 
            muted playsInline 
          />
          
          {!active && (
            <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:"#111"}}>
              <div style={{textAlign:"center",color:C.muted}}>
                <div style={{fontSize:56}}>📷</div>
                <div style={{marginTop:8}}>Camera Offline</div>
              </div>
            </div>
          )}

          {/* Picture-in-Picture Latest AI Scan */}
          {active && streamUrl && (
            <div style={{
              position:"absolute", bottom: 15, right: 15, width: "30%", aspectRatio: "16/9",
              border: `2px solid ${C.accent}`, borderRadius: 8, overflow: "hidden",
              boxShadow: "0 10px 20px rgba(0,0,0,0.5)", background: "#000"
            }}>
              <img src={streamUrl} alt="AI Scan" style={{width:"100%",height:"100%",objectFit:"cover"}} />
              <div style={{position:"absolute",top:0,left:0,background:"rgba(0,0,0,0.7)",color:"white",fontSize:10,padding:"2px 6px",fontWeight:"bold"}}>LATEST AI SCAN</div>
            </div>
          )}

          {/* Dynamic PASS / FAIL Badge Overlay */}
          {active && passStatus && (
            <div style={{
              position:"absolute", top: 15, left: "50%", transform: "translateX(-50%)",
              background: passStatus === "PASS" ? "rgba(0, 180, 80, 0.9)" : "rgba(255, 60, 90, 0.9)",
              color: "#fff", padding: "8px 24px", borderRadius: 30,
              fontSize: 24, fontWeight: 900, letterSpacing: 2,
              boxShadow: "0 4px 15px rgba(0,0,0,0.5)", border: "2px solid #fff",
              animation: passStatus === "FAIL" ? "pulse 1s infinite" : "none"
            }}>
              {passStatus}
            </div>
          )}

          {active && (
            <>
              <div style={{position:"absolute",top:10,left:10,background:"#0008",borderRadius:6,
                padding:"4px 10px",fontSize:11,color:C.green,fontFamily:"monospace",
                display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:6,height:6,background:C.red,borderRadius:"50%",animation:"pulse 1s infinite"}}/>
                REC · {String(Math.floor(frameCount/20)).padStart(2,"0")}:{String((frameCount*3)%60).padStart(2,"0")}
              </div>
              <div style={{position:"absolute",top:10,right:10,background:"#0008",borderRadius:6,
                padding:"4px 10px",fontSize:11,color:C.accent,fontFamily:"monospace"}}>30 FPS | WEBRTC</div>
              <div style={{position:"absolute",bottom:10,left:10,background:"#0008",borderRadius:6,
                padding:"4px 10px",fontSize:10,color:C.muted,fontFamily:"monospace"}}>
                LOCAL | STATION-A | {new Date().toLocaleString()}
              </div>
            </>
          )}
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={active?stopCamera:startCamera} style={{flex:1,padding:12,borderRadius:10,fontWeight:800,
            cursor:"pointer",border:`1px solid ${active?C.red:C.green}`,
            background:active?`${C.red}22`:`linear-gradient(135deg,${C.green},#00aa55)`,
            color:active?C.red:"#000", transition: "all 0.2s"}}>
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
          {[["SCANS",frameCount,C.accent],["ALERTS",detections.length,C.red]].map(([l,v,c],i)=>(
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
