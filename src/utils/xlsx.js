export function makeXLSX(sheets) {
  const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const colRef = ci => ci < 26 ? String.fromCharCode(65+ci) : String.fromCharCode(65+Math.floor(ci/26)-1)+String.fromCharCode(65+ci%26);
  const sheetXMLs = sheets.map(sh => {
    const mc = Math.max(...sh.rows.map(r=>r.length),1);
    let x = '<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols>';
    for (let c=0;c<mc;c++) x+=`<col min="${c+1}" max="${c+1}" width="22" customWidth="1"/>`;
    x+='</cols><sheetData>';
    sh.rows.forEach((row,ri) => {
      x+=`<row r="${ri+1}">`;
      row.forEach((cell,ci) => {
        const ref=colRef(ci)+(ri+1);
        if (cell==null||cell==='') x+=`<c r="${ref}"/>`;
        else if (typeof cell==='number'&&isFinite(cell)) x+=`<c r="${ref}"><v>${cell}</v></c>`;
        else x+=`<c r="${ref}" t="inlineStr"><is><t>${esc(String(cell))}</t></is></c>`;
      });
      x+='</row>';
    });
    x+='</sheetData></worksheet>';
    return x;
  });
  let wb='<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>';
  sheets.forEach((s,i)=>{wb+=`<sheet name="${esc(s.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`;});
  wb+='</sheets></workbook>';
  let wr='<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">';
  sheets.forEach((_,i)=>{wr+=`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`;});
  wr+='</Relationships>';
  const rels='<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
  let ct='<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>';
  sheets.forEach((_,i)=>{ct+=`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`;});
  ct+='</Types>';
  const te=new TextEncoder();
  const files=[{p:'[Content_Types].xml',d:te.encode(ct)},{p:'_rels/.rels',d:te.encode(rels)},{p:'xl/workbook.xml',d:te.encode(wb)},{p:'xl/_rels/workbook.xml.rels',d:te.encode(wr)},...sheetXMLs.map((x,i)=>({p:`xl/worksheets/sheet${i+1}.xml`,d:te.encode(x)}))];
  const crc32=buf=>{let c=0xFFFFFFFF;for(let i=0;i<buf.length;i++){c^=buf[i];for(let j=0;j<8;j++)c=(c>>>1)^(c&1?0xEDB88320:0);}return(c^0xFFFFFFFF)>>>0;};
  const parts=[],cd=[];let off=0;
  files.forEach(f=>{
    const nb=te.encode(f.p),crc=crc32(f.d);
    const lh=new Uint8Array(30+nb.length),lv=new DataView(lh.buffer);
    lv.setUint32(0,0x04034b50,true);lv.setUint16(4,20,true);lv.setUint32(14,crc,true);lv.setUint32(18,f.d.length,true);lv.setUint32(22,f.d.length,true);lv.setUint16(26,nb.length,true);lh.set(nb,30);
    const ce=new Uint8Array(46+nb.length),cv=new DataView(ce.buffer);
    cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint32(16,crc,true);cv.setUint32(20,f.d.length,true);cv.setUint32(24,f.d.length,true);cv.setUint16(28,nb.length,true);cv.setUint32(42,off,true);ce.set(nb,46);
    parts.push(lh,f.d);cd.push(ce);off+=lh.length+f.d.length;
  });
  const cdOff=off;let cdSz=0;cd.forEach(e=>{parts.push(e);cdSz+=e.length;});
  const eocd=new Uint8Array(22),ev=new DataView(eocd.buffer);
  ev.setUint32(0,0x06054b50,true);ev.setUint16(8,files.length,true);ev.setUint16(10,files.length,true);ev.setUint32(12,cdSz,true);ev.setUint32(16,cdOff,true);
  parts.push(eocd);
  return new Blob(parts,{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}