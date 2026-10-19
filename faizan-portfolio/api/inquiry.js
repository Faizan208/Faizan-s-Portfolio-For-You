// Server-side Vercel Function. Configure RESEND_API_KEY, INQUIRY_TO_EMAIL, INQUIRY_FROM_EMAIL in Vercel.
export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({error:'Method not allowed'}); }
  const apiKey=process.env.RESEND_API_KEY;
  const to=process.env.INQUIRY_TO_EMAIL;
  const from=process.env.INQUIRY_FROM_EMAIL;
  if (!apiKey || !to || !from) return res.status(503).json({error:'Message delivery is not configured yet. Please try again later.'});
  const body=req.body && typeof req.body==='object'?req.body:{};
  const val=(name,limit=300)=>String(body[name]??'').trim().slice(0,limit);
  if (val('website')) return res.status(200).json({ok:true}); // honeypot
  const name=val('fullName',100),email=val('email',254),type=val('projectType',100),description=val('description',5000);
  if (name.length<2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !type || !description) return res.status(400).json({error:'Please provide a valid name, email, project type, and description.'});
  const budget=val('budget',100),timeline=val('timeline',100),reference=val('referenceUrl',1000);
  const details=[['Name',name],['Email',email],['Type',type],['Description',description],['Budget',budget],['Timeline',timeline],['Reference',reference]].map(([k,v])=>`${k}: ${v}`).join('\n\n');
  try {
    const response=await fetch('https://api.resend.com/emails', {
      method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},
      body:JSON.stringify({from,to:[to],reply_to:email,subject:`Portfolio inquiry: ${type}`,text:details})
    });
    if (!response.ok) { console.error('Delivery provider rejected request',response.status);return res.status(502).json({error:'The message could not be delivered. Please try again.'}); }
    return res.status(200).json({ok:true});
  } catch(e) {console.error('Inquiry delivery error',e);return res.status(502).json({error:'The message could not be delivered. Please try again.'});}
}
