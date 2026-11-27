"""Alinea guion.txt con narracion.mp3 sin servicios externos.
Detecta los tramos de voz por energía y reparte las palabras (ponderadas por sílabas)
entre los tramos con programación dinámica, prefiriendo cortes en signos de puntuación."""
import numpy as np, re, json, subprocess, sys
SR=16000; HOP=160
raw=subprocess.run(['ffmpeg','-v','error','-i','narracion.mp3','-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True).stdout
a=np.frombuffer(raw,dtype=np.float32)
e=np.array([np.sqrt(np.mean(a[i:i+400]**2)+1e-12) for i in range(0,len(a)-400,HOP)])
sp=20*np.log10(e)>-38
segs=[];st=None
for i,s in enumerate(sp):
    if s and st is None: st=i
    if not s and st is not None: segs.append([st,i]); st=None
if st is not None: segs.append([st,len(sp)])
m=[]
for s in segs:
    if m and (s[0]-m[-1][1])*HOP/SR<0.12: m[-1][1]=s[1]
    else: m.append(s)
S=[(s*HOP/SR,t*HOP/SR) for s,t in m if (t-s)*HOP/SR>0.1]

HABLADO={'37':'treinta y siete','39':'treinta y nueve'}
def silabas(w):
    w=HABLADO.get(re.sub(r'\W','',w),w).lower()
    n=len(re.findall(r'[aeiouáéíóúü]+',w))
    return max(1,n)+0.35  # pequeño peso fijo por palabra
texto=open('guion.txt',encoding='utf-8').read().split()
W=[{'w':w,'syl':silabas(w),'punct':bool(re.search(r'[,.?!:;]$',w))} for w in texto]
tot_syl=sum(x['syl'] for x in W); tot_dur=sum(t-s for s,t in S); k=tot_dur/tot_syl
N=len(W); M=len(S); INF=1e18
cum=np.concatenate([[0],np.cumsum([x['syl'] for x in W])])
dp=np.full((M+1,N+1),INF); bk=np.zeros((M+1,N+1),dtype=int); dp[0,0]=0
for j in range(1,M+1):
    d=S[j-1][1]-S[j-1][0]
    for i in range(0,N+1):
        best=INF;arg=0
        for p in range(max(0,i-25),i+1):
            if dp[j-1,p]>=INF: continue
            syl=cum[i]-cum[p]
            c=((d-k*syl)/max(d,0.3))**2 if i>p else d*4
            if i>p and not W[i-1]['punct']: c+=0.6   # cortar en mitad de frase penaliza
            v=dp[j-1,p]+c
            if v<best: best=v;arg=p
        dp[j,i]=best;bk[j,i]=arg
asig=[];i=N
for j in range(M,0,-1):
    p=bk[j,i];asig.append((j-1,p,i));i=p
asig.reverse()
out=[]
for j,p,i in asig:
    s,t=S[j]; syl=cum[i]-cum[p]; x=s
    for q in range(p,i):
        dd=(t-s)*W[q]['syl']/syl
        out.append({'w':W[q]['w'],'start':round(x,3),'end':round(x+dd,3)}); x+=dd
dur=float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0','narracion.mp3'],capture_output=True,text=True).stdout)
json.dump({'duracion':dur,'palabras':out},open('tiempos.json','w'),ensure_ascii=False,indent=1)
for j,p,i in asig:
    print(f"{S[j][0]:6.2f}-{S[j][1]:6.2f}  "+' '.join(W[q]['w'] for q in range(p,i)))
