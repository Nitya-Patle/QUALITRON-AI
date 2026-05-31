import { C } from "../theme";
export default function SectionTitle({ children }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
      <div style={{width:4,height:20,background:C.accent,borderRadius:2}}/>
      <span style={{fontSize:14,fontWeight:700,color:C.text,letterSpacing:2,textTransform:"uppercase"}}>{children}</span>
    </div>
  );
}
