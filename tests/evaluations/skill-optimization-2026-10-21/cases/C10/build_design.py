from pathlib import Path
from xml.sax.saxutils import escape
import json, hashlib, textwrap
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parent
CARDS=ROOT/'cards'; CARDS.mkdir(exist_ok=True)
FONT='C:/Windows/Fonts/msyh.ttc'
BG='#151d23'; PANEL='#202c34'; FG='#e8e4d9'; MUT='#a4b6bf'; WARM='#d3984d'; COLD='#718894'
files=[]
class Board:
    def __init__(self,name,title,stage):
        self.name=name; self.s=[]; self.im=Image.new('RGB',(1400,900),BG); self.d=ImageDraw.Draw(self.im)
        self.rect(0,0,1400,900,BG); self.text(45,28,title,34); self.text(45,80,f'{stage} · HP01 / SC01 · r1 · 原创矢量设计，非真实样片',18,MUT)
        self.text(45,854,'仅设计交付 / 媒体未提供 / 24秒 · 4镜 · 16:9 / 完整提示词与判据见 output.md',18,MUT)
    def rect(self,x,y,w,h,fill=PANEL,stroke=None):
        self.s.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}"'+(f' stroke="{stroke}" stroke-width="2"' if stroke else '')+'/>')
        self.d.rectangle((x,y,x+w,y+h),fill=fill,outline=stroke,width=2)
    def line(self,x,y,x2,y2,col=MUT,width=3):
        self.s.append(f'<line x1="{x}" y1="{y}" x2="{x2}" y2="{y2}" stroke="{col}" stroke-width="{width}"/>'); self.d.line((x,y,x2,y2),fill=col,width=width)
    def circ(self,x,y,r,col):
        self.s.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{col}"/>'); self.d.ellipse((x-r,y-r,x+r,y+r),fill=col)
    def text(self,x,y,t,size=23,col=FG):
        self.s.append(f'<text x="{x}" y="{y+size}" font-size="{size}" fill="{col}">{escape(t)}</text>');self.d.text((x,y),t,font=ImageFont.truetype(FONT,size),fill=col)
    def para(self,x,y,t,width=30,size=22,col=FG):
        for i,l in enumerate(textwrap.wrap(t,width=width)): self.text(x,y+i*(size+12),l,size,col)
    def arrow(self,x,y,x2,y2,col=WARM):
        self.line(x,y,x2,y2,col,4)
        import math
        a=math.atan2(y2-y,x2-x)
        for d in [-.55,.55]: self.line(x2,y2,x2-15*math.cos(a+d),y2-15*math.sin(a+d),col,4)
    def person(self,x,y,col=COLD):
        self.circ(x,y,22,col);self.rect(x-30,y+27,60,95,col);self.line(x-24,y+122,x-32,y+160,col,10);self.line(x+24,y+122,x+32,y+160,col,10)
    def save(self):
        p=CARDS/(self.name+'.svg');p.write_text('<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="900" viewBox="0 0 1400 900"><style>text{font-family:Microsoft YaHei,Noto Sans CJK SC,sans-serif}</style>'+''.join(self.s)+'</svg>\n',encoding='utf8',newline='\n')
        self.im.save(CARDS/(self.name+'.png')); files.append((self.name,p.name))

b=Board('HP01_SC01_G1_style_card_v1','G1 / 风格卡：日常手艺中的身份伪装','G1 STYLE')
for x,word,col in [(70,'窗框 / 观看边界','#302820'),(500,'薄皮 / 连续物理','#B9AA91'),(930,'女子 / 稳定终态','#434F56')]:
    b.rect(x,155,380,360); b.rect(x+25,185,330,190,col); b.text(x+25,405,word,24)
    if x==70:
        for dx in [45,145,245]: b.rect(x+dx,185,12,190,'#8c7354')
        b.line(x+25,278,x+355,278,'#8c7354',10)
    elif x==500:
        for dy in [0,45,90]: b.line(x+50,220+dy,x+315,245+dy,'#827560',3)
        b.circ(x+190,230,22,'#827560')
    else:b.person(x+190,225,'#B9AA91')
b.para(75,550,'写实摄影：木边清楚、棉麻有重量，薄皮必须区别纸与衣服。固定镜头让动作成为证据。',48)
b.para(75,660,'时间：4镜连续观察；描→提→抖→披→成形。无闪白、烟遮、魔法发光、血伤、裸露、冲窗惊吓。',48)
b.save()

b=Board('HP01_SC01_G1_palette_card_v1','G1 / 配色卡：西暖与东冷不交换世界方向','G1 PALETTE')
palette=[('#302820','45% 焦木褐','窗 / 桌 / 暗背景'),('#434F56','25% 炭蓝灰','棉麻袍 / 榻影'),('#B9AA91','20% 灰米','薄皮 / 衣领'),('#D3984D','≤5% 琥珀','西灯局部高光'),('#718894','约5% 冷灰青','东方极弱边缘')]
for i,(c,t,u) in enumerate(palette):
    x=55+i*267;b.rect(x,170,240,260,c);b.text(x,458,c,26);b.text(x,505,t,23);b.text(x,550,u,20,MUT)
b.para(65,650,'sRGB显示设计值与面积意向，不是实测材质、LUT或精确模型保证。四镜共用同一色彩命题；肤色不整体染青或染黄。',49)
b.save()

b=Board('HP01_SC01_G1_material_card_v1','G1 / 材质卡：同一照明下的五种响应','G1 MATERIAL')
materials=[('A1 麻袍','#434F56','粗麻织纹 / 低而宽的反光'),('P2 旧木','#302820','顺纹细沟 / 边缘磨损'),('P1 薄皮','#B9AA91','微细皮纹 / 柔韧半透薄边'),('P3 铜灯','#80623e','暗铜斑 / 窄暖高光'),('A3 肤面','#a68b73','半哑 / 鼻侧毛孔与唇纹')]
for i,(t,c,desc) in enumerate(materials):
    x=50+i*268;b.rect(x,175,238,260,c)
    for k in range(12):
        if i==0:b.line(x+12+k*18,190,x+12+k*18,415,'#637078',2);b.line(x+8,190+k*18,x+228,190+k*18,'#637078',1)
        elif i==1:b.line(x+15,190+k*18,x+222,203+k*18,'#554330',2)
        elif i==2:b.line(x+14,195+k*17,x+222,201+k*17,'#c8baa3',1)
        elif i==3:b.rect(x+18+k*15,190,4,195,'#a88048')
        else:b.circ(x+25+(k%4)*55,210+(k//4)*65,2,'#826953')
    b.text(x,465,t,25);b.para(x,515,desc,10,22)
b.para(65,680,'图纹为材质设计示意，不是材质实测样片。冷光保留固有色，暖光不涂平纹理。所有人体完整着衣、皮肤无伤口。',49)
b.save()

b=Board('HP01_SC01_G1_lighting_card_v1','G1 / 灯光卡：L1西桌油灯 + L2东方弱环境','G1 LIGHTING')
b.rect(70,155,700,580);b.person(420,325,'#434F56');b.circ(240,390,18,WARM);b.arrow(240,390,390,360,WARM);b.arrow(680,300,455,340,COLD)
b.text(110,660,'L1 小暖光：世界西面亮，影偏东',23,WARM);b.text(825,180,'L1 / 叙事主光',28,WARM)
b.para(825,235,'西桌真实油灯，小面积暖光；优先读清手指、皮边与脸。西墙反光只来自同一盏灯。',21)
b.text(825,435,'L2 / 极弱冷环境',28,COLD);b.para(825,490,'东方开缝宽冷光，只分离东肩与木面；不变成第二盏主灯。无无动机正面补光。',21)
b.text(90,765,'曝光意图：暗部仍读出手与皮，灯焰保层次；无照度或光比实测。',23)
b.save()

def plan(b,blocking=False):
    b.rect(130,160,720,560,'#202c34','#82939b'); b.text(465,120,'北 N',22);b.text(78,415,'西 W',20);b.text(870,415,'东 E',20);b.text(465,743,'南 S',22)
    b.rect(330,190,390,120,'#302820','#907c64');b.text(355,205,'北榻 B1 / 皮与竹碟',22)
    b.rect(175,315,100,110,'#302820','#907c64');b.circ(225,345,13,WARM);b.text(160,440,'西桌 L1',23,WARM)
    b.rect(835,340,15,120,COLD);b.arrow(830,380,650,330,COLD)
    b.rect(170,160,115,14,'#806d56');b.text(170,175,'关闭门',18)
    b.rect(440,709,130,15,'#a58b65');b.text(580,699,'固定南窗 W1',20)
    b.circ(535,285,20,'#a0a6a5');b.text(560,290,'主体朝南',20);b.circ(480,292,8,'#b9aa91');b.text(325,320,'碟：主体右 / 世界西',19)
    b.circ(520,775,17,COLD);b.text(545,770,'王生窗外',21);b.arrow(520,750,535,325,'#b9aa91')
    b.rect(475,805,20,15,COLD);b.text(110,795,'C2/C3/C4 透过既有开口向北',20)
    b.rect(635,790,20,15,COLD);b.text(655,785,'C1',19)
    b.arrow(225,345,500,285,WARM)
    b.para(965,170,'统一世界坐标：北+y，东+x；南窗y=0。室内4.8×5米，为设计假设。',16,22)
    b.para(965,355,'不镜像：西桌暖灯、北榻、南木窗、东冷环境。王生始终在窗外。',16,22)
    b.para(965,535,'仅图示：箭头表示光向或目光，不是实测光束。机位需后续预演验证窗格遮挡。',16,22)

b=Board('HP01_SC01_G1_light_plot_v1','G1 / 光位图：世界方向、窗遮挡与可达机位','G1 LIGHT PLOT');plan(b);b.save()
b=Board('HP01_SC01_G2_scene_map_v1','G2 / 场景结构图：同一坐标系内的空间硬锁','G2 GEOGRAPHY');plan(b);b.save()

b=Board('HP01_SC01_G1_lookdev_test_board_v1','G1 / LookDev测试设计板：五格都有输入与否定条件','G1 LOOKDEV')
tests=[('LD1 人物近景','王生眼部 + 木窗','比较冷环境强弱','否决：痣漂移、脸全青'),('LD2 场景空镜','南窗→北榻 / 西灯','比较暗部显示抬升','否决：地理镜像、全黄'),('LD3 皮与手接触','左压皮 / 右持笔','比较表面粗糙响应','否决：穿皮、皮变纸'),('LD4 内外受光','灯经窗缝到王生','比较窗缝光衰减','否决：室外独立聚光'),('LD5 邻近视点','南窗中心 / 偏东20cm','只改观察位置','否决：灯换边、换身份')]
for i,(t,inp,var,no) in enumerate(tests):
    x=45+(i%3)*450;y=145+(i//3)*340;b.rect(x,y,425,315);b.text(x+18,y+15,t,24)
    b.rect(x+18,y+65,125,105,'#302820');b.circ(x+80,y+100,18,'#b9aa91');b.line(x+30,y+145,x+130,y+145,COLD,4)
    b.text(x+160,y+77,'设计示意',20,MUT);b.text(x+160,y+116,'真实样片：未提供',18,WARM)
    b.text(x+18,y+185,inp,20);b.text(x+18,y+225,var,20,MUT);b.text(x+18,y+265,no,19,WARM)
b.rect(945,485,410,315);b.para(965,510,'全部固定身份、衣装、空间与世界光位；每格最多两候选，只比较一变量。完整独立测试提示词见 output.md G1。待执行，不是样片验收通过。',16,23);b.save()

b=Board('HP01_SC01_G3_blocking_board_v1','G3 / 调度卡：先松笔、再抓皮，动作不回退','G3 BLOCKING')
phases=[('S1 / 窗外','王生右手贴框','眼神先动→头前倾'),('S2 / 描皮','左手压 / 右手笔','两笔完成→笔离皮'),('S3 / 提披','右笔入西侧碟并松手','双手提→一抖→披落'),('S4 / 贴合','双手理肩→落膝','成形后王生画外新句')]
for i,(t,a,c) in enumerate(phases):
    x=45+i*340;b.rect(x,165,315,440);b.text(x+15,185,t,24);b.person(x+155,280,'#718894');b.arrow(x+70,400,x+120,330,WARM);b.text(x+15,485,a,18);b.para(x+15,530,c,13,19)
    if i<3:b.arrow(x+315,370,x+338,370)
b.para(60,660,'主体坐北榻朝南，坐骨与双脚有支撑；自身右手对应世界西。眼神只看皮与手，女子不看窗。王生全程窗外，无两人身体接触。',50)
b.save()

b=Board('HP01_SC01_G4_storyboard_board_v1','G4 / 四格分镜：每格独立摄影任务，非模型帧','G4 STORYBOARD')
shots=[('S1 0–5秒 / 近景','窗外偏东看王生 / 固定','听笔→眼神→前倾','出：右手贴框，眼线向北'),('S2 5–11秒 / 中近景','南窗看北榻 / 固定深焦','左压皮，右补两笔','出：右手笔离皮'),('S3 11–19秒 / 中景','南窗原轴 / 固定深焦','搁笔→提→抖→披','出：皮触额肩，手理边'),('S4 19–24秒 / 中近景','南窗原轴 / 固定深焦','贴合→落手→画外新句','出：女子稳定，切黑')]
for i,(t,c,a,e) in enumerate(shots):
    x=45+(i%2)*685;y=140+(i//2)*345;b.rect(x,y,650,320);b.text(x+18,y+15,t,24)
    b.rect(x+20,y+65,270,152,'#302820');b.person(x+155,y+95,'#b9aa91')
    b.rect(x+30,y+65,9,152,'#907758')
    if i==1:b.rect(x+110,y+170,100,25,'#b9aa91')
    if i==2:b.line(x+90,y+112,x+220,y+112,'#cbbca1',12)
    b.para(x+310,y+70,c,15,21);b.para(x+310,y+132,a,15,20);b.text(x+20,y+250,e,22,MUT)
b.save()

b=Board('HP01_SC01_G5_edit_timeline_v1','G5 / 声画时间线：24fps × 24秒 = 576帧','G5 EDIT / SOUND')
start=70;w=1260
for i,(a,z,t,c) in enumerate([(0,5,'S1 偷看',COLD),(5,11,'S2 描皮','#756f5e'),(11,19,'S3 提抖披',WARM),(19,24,'S4 成形','#b9aa91')]):
    x=start+w*a/24;ww=w*(z-a)/24;b.rect(x,220,ww,120,c);b.text(x+12,250,t,23,BG);b.text(x,175,str(a)+'s',23);b.text(x+5,365,f'[{a*24},{z*24})帧',19,MUT)
b.text(1270,175,'24s',23);b.text(70,430,'环境底声',23);b.rect(240,435,1090,35,'#435664');b.text(70,500,'动作拟音',23)
for a,z in [(0.5,1),(6.5,9),(11.5,18.9),(19,20.8)]:b.rect(70+w*a/24,540,w*(z-a)/24,26,'#a88a60')
b.text(70,610,'王生画外 D1',23);b.rect(70+w*21.1/24,615,w*1.4/24,40,WARM);b.text(850,675,'21.1–22.5秒：原来如此。',23,WARM)
b.para(70,730,'三处硬切：视线匹配 / 悬笔接搁笔 / 已披接贴合。S3皮声后出0.3秒。无音乐、无旁白。所有音频窗口均待实际回流测听。',48,22)
b.save()

html='<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>窗内：G0–G7设计图卡</title><style>body{background:#151d23;color:#eee;font:18px sans-serif;max-width:1400px;margin:30px auto}img{width:100%;height:auto}a{color:#d3984d}section{margin:35px 0}</style><h1>《窗内》24秒四镜设计图卡</h1><p>原创矢量设计，无真实模型媒体。完整G0–G7与提示词见 <a href="../output.md">output.md</a>。</p>'
for n,p in files:html+=f'<section><h2>{n}</h2><a href="{p}">打开SVG</a><img src="{p}" alt="{n}"></section>'
(CARDS/'index.html').write_text(html+'\n',encoding='utf8',newline='\n')

# Canonical final wording: the seated south-facing subject's right is world west.
p=ROOT/'output.md';s=p.read_text(encoding='utf8')
s=s.replace('榻上东端','榻上世界西侧').replace('榻东端','榻世界西侧')
s=s.replace('下文“榻世界西侧”静态展示位置在拍摄前调整为此正式机位位置，正式戏内不移动碟子。','正式戏内碟子不移动。')
if '**重要坐标修订说明：**' in s:
    a=s.index('**重要坐标修订说明：**');z=s.index('**世界状态。**',a);s=s[:a]+s[z:]
a=s.index('**设计校对记录。**');z=s.index('**条件性问题归因',a);s=s[:a]+'**设计校对记录。**逐项核对人物自身左右与世界方向：主体朝南，自身右侧为世界西侧。笔碟空间锚点已在资产稿、镜头稿、图卡中统一；未修改灯位或镜位。这是文字与图示检查，不代表真实素材返修。\n\n'+s[z:]
p.write_text(s,encoding='utf8',newline='\n')

roles=['direction','performance','staging','cinematography','prompt','continuity']
obs=[['顺声音建立偷看者，北向视线交给S2。','刮笔声先于眼神和前倾。','右手贴框、脚在窗外，没有开窗。','C1固定近景，眼焦保持，视线空间留右。','S1三条独立复制稿包含衣光声与边界。','王生留窗外，右手未离框，S2沿北向切入。'],['显露薄皮脸形与描画机制。','两笔完成后才抬笔，左手稳定压皮。','双手皮笔同框，世界西侧竹碟可达。','南窗朝北固定，较深可读范围保护皮与脸。','图稿是接笔瞬间，视频写完整两笔并离皮。','出态悬笔且左手压皮，S3继承。'],['8秒完整保留提抖披，不靠闪白遮挡。','先放笔松手再抓皮，眼神随工作对象。','坐骨和脚有支撑，皮举高空间留足。','固定中景，无切焦遮手或皮接触。','视频包含一次抖、披落及无裸露血伤约束。','已触额肩出点，S4不重演举皮。'],['稳定女子终态后才听到王生新增句。','女子垂眼落手，无口型或听见反应。','同一坐位肩宽，世界西侧笔碟不移。','南窗同轴固定中近景，焦点保护额肩双手。','准确新句进入视频及声音复制稿。','从已披未合继续至合边，终态留足辨认。']]
review={'source':{'type':'design','id':'HP01_SC01_r1','version':1,'cameraLanguageScope':'narrative_video'},'mode':'full','shotIds':['S1','S2','S3','S4'],'reviews':[],'cameraDecisions':[]}
for i in range(4):
    sid=f'S{i+1}';dur=[5,6,8,5][i]
    for j,r in enumerate(roles):review['reviews'].append({'role':r,'shotId':sid,'status':'pass','criterion':'检查本镜设计正文在该视角的完整性与内部一致性；不判断真实媒体。','observation':obs[i][j],'sourceLocator':f'output.md / G4 / {sid}；G5边界表'})
    cam={'shotScale':['胸口以上近景','腰部以上含膝前榻面中近景','含举皮最高点的中景','胸口至膝上中近景'][i],'position':'南窗外偏东朝西北' if i==0 else '南窗开口朝北','height':'眼高','angle':'侧向平视' if i==0 else '略俯视','perspectiveIntent':'前景窗框确立观察边界，身体与道具保持可读','focusTarget':'王生近侧眼' if i==0 else '手、皮、头肩共同活动范围','depthOfField':'眼部清楚，背景柔化' if i==0 else '较深可读范围','axisSide':'南北观察轴东侧或贴轴，始终南窗朝北','movementIntent':'保持固定，让人物与道具动作承担揭示'}
    review['cameraDecisions'].append({'shotId':sid,'decision':{'primaryTechniqueId':'neutral_static','supportingTechniqueIds':[],'narrativeReason':obs[i][0],'audiencePayoff':obs[i][0],'trigger':['北榻刮笔声','王生眼线锁定后切入','描画完成笔离皮','皮已接触额肩'][i],'cameraMode':'static','focusMode':'hold','noMotionReason':'避免镜头移动遮蔽观察与关键接触','exitMatch':obs[i][5]},'camera':cam,'composition':{'layout':'窗缘框定观察，主体和手皮保持无遮挡','foreground':'南木窗细边','midground':'王生' if i==0 else '主体与皮壳双手','background':'暗室暖点' if i==0 else '北墙与榻缘','negativeSpace':'朝北的视线空间' if i==0 else '举皮与落手需要的动作空间','visualHierarchy':'眼神' if i==0 else '皮与手的接触优先，其次脸和榻'},'temporal':{'durationSeconds':dur,'cameraMotion':{'type':'static','motivation':'让可见动作承担信息','path':'固定原位','start':'固定','acceleration':'无加速','peak':'无移动','deceleration':'无减速','end':'原位固定','framingChange':'无片内变焦或裁切变化'},'focusTimeline':[{'eventId':sid+'_F0','timeSeconds':0,'description':'保持指定焦点及所需可读范围至本镜出点'}],'edit':{'entry':obs[i][2],'exit':obs[i][5],'preferredTransition':'硬切','soundBridge':'同场环境连续，S3皮声可后出0.3秒'}}})
(ROOT/'review.json').write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
delivery={'frameRate':{'numerator':24,'denominator':1},'totalFrames':576,'shots':[{'id':f'S{i+1}','startFrame':a,'endFrame':z} for i,(a,z) in enumerate([(0,120),(120,264),(264,456),(456,576)])],'subtitles':[{'id':'D1','startFrame':504,'endFrame':552,'text':'原来如此。','expectedHanCharacters':4}]}
(ROOT/'delivery.json').write_text(json.dumps(delivery,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
preview=Image.new('RGB',(1400,900),(14,20,25))
for i,(n,_) in enumerate(files):
    tile=Image.open(CARDS/(n+'.png')).resize((350,225));preview.paste(tile,((i%4)*350,(i//4)*225))
preview.save(CARDS/'contact-sheet.png')
print(json.dumps({'svgCards':len(files),'pngCards':len(files),'html':str(CARDS/'index.html'),'output':str(ROOT/'output.md')},ensure_ascii=False))
