"""Project-specific visual decisions; schematic cards are not graded media."""
STYLE = ('16:9横屏，当代美国真人现实悬疑。环境低至中等饱和，人物肤色保持真实差异与自然纹理；'
         '深黑保留衣料和道具分离，白纸与白领高光柔和有层次。冷暖来自本镜已有物理光源，'
         '不统一青橙、不磨皮、不以整体欠曝制造悬疑。遵循本镜机位、表演与焦点，不擅自追加缓推、急变焦或摇晃。')

LOOKS = {
 'DOCK': '河岸冷灰、湿石与深蓝制服构成环境；橙囚服保持哑光折痕，面部可读。南侧车灯只影响确被照到的部位。媒体栏杆形成空间压力，不给人物添加英雄逆光。E01/E06同次押送继承天气、光比和衣色。',
 'CLINIC': '西窗与中性顶灯分区，灰绿只留在环境与材质；各人肤色保持区别，纸张不染成蓝绿。柜台和候诊区保持纵深，工作人员依自身任务活动。',
 'HOTEL': '石材、路缘、外套和晨间天光保持朴素层次；枪响前后不突然变色或改变曝光，反应与现场声承担冲击。',
 'HOTEL-BREAKFAST': '既定西窗晨光和餐区暖白灯混合，瓷器、杯沿与灰蓝西装保持真实反射；人物不加柔光美化。桌面生活动作有清楚空间。',
 'DINER': '西窗清早冷光与东柜台暖白工作灯分区，塑料桌面和旧地砖保留日常杂色；黑包与黑裤靠材质和亮度区分。关键移包、手腕与通道不能被前景装饰挡住。',
 'DINER-EXTERIOR': '阴天停车区偏冷中性，店内透出的暖白仅影响门口邻近处；不把手机补光当成全场光源。建筑和人保留普通生活的颜色。',
 'MARA-HOME': '米灰针织、旧木、蓝夹与绿色蜡笔保留不同颜色。西窗、东厨房灯和台灯依本场时段启用；暖灯局限在实际照到的人和桌面，不染全屋橙。对白与手头生活共存，疲态和皮肤细节保留。',
 'VISIT': '中性略冷顶灯为基础，东窄窗仅按时段提供环境补光；灰衣、肤色、金属桌分别可辨。桌沿和空位表达未得到的答复，不新增隔断玻璃。',
 'COURT-STATE': '北高窗与中性顶灯维持旧木、纸白和深灰的层次；法官、辩方与旁听者用同一写实肤色规则。既定遮挡不盖住已交代的递页、手腕或签名动作。',
 'COURT-FEDERAL': '北侧采光与中性照明配合浅灰石材和木纹，独立于州法院但继承相同肤色、黑位及高光规则；白衬衫、黑袍和纸面都留细节。',
 'COURT-CORRIDOR': '东南窗光按时段影响走廊，西椅、东饮水机与北门层次清楚；同一空间的人物继承一致照明，不用独立圣洁柔光区分立场。',
 'HELEN-OFFICE': '西窗与办公室现有灯具依时段工作，旧木、蓝夹、白纸和衣料不过度去色。共享桌面保留不同人手边的材料，文书细节只在改变判断时突出。',
 'NEWSROOM': '白天西窗、夜间既有桌灯按场景使用；屏幕只给邻近物体局部冷光，不能把全脸染蓝。以工作空间和别人听见后的反应体现压力，准确标题后期叠加。',
 'INSURER': '玻璃、浅灰表面、整洁木色与中性肤色构成明净办公室；不以邪恶绿光标记立场。玻璃边缘和桌面分区体现发言权，摄影只按本镜既定触发响应说话人。',
 'CAFE': '西窗与东吧台暖补依时段分区，杯子、纸件、橄榄开衫保持日常颜色；眼镜反射保留但不遮蔽关键眼神。桌边距离和交出哪一页比装饰虚化更重要。',
 'SERVER-OFFICE': '中性工作灯照清授权工位和纸件，设备指示灯只是局部小光源；不引入黑客霓虹色或让屏幕照亮整间房。',
 'POLICE': '冷白顶灯、旧墙、金属与衣料保留差异；人物肤色不一律染青，财物台与问询桌的记录动作必须可辨。',
 'STATION': '既有公共照明下保留灰墙、候车座、暗衣服与皮肤的层次；广播和其他旅客属于公共空间，不用独立追光隔离主角。',
 'HOTEL-ROOM': '西窗白天受天光、夜间保留正文明确的少量街灯冷光，北桌既有暖台灯按本场时段启用；廉价织物、墙面与黑包各自可读，暖光只影响邻近区域，不在东床新增灯具。',
 'PRISON': '北窄窗夜间外暗；中央既有带防护罩中性顶灯照及西桌纸和双手，南门观察口漏光只影响邻近处。E05/E24共用灯位，不给书信另加追光。灰衣、纸、桌面保留层次，缝隙可黑但写信的手须可读。',
 'EXTERIOR': '沿用本镜明确的街道、入口和时段，灰石、外套与肤色保持自然；围观手机或采访设备不自动带来新的全场光源。'
}

# Continuous beds only. One-off notification, key, paper and chair sounds are
# driven by each candidate's current action, never repeated from a full shot.
AMBIENCE = {
 'DOCK':'河岸风与远处旋翼底声，依押送所在位置连续变化',
 'CLINIC':'诊所通风与远处不可辨的候诊人声',
 'HOTEL':'城市晨间远车与酒店门外环境底声',
 'HOTEL-BREAKFAST':'餐区低位通风及远桌不可辨人声',
 'DINER':'冷柜和厨房抽风持续低响',
 'DINER-EXTERIOR':'停车区远车与门外风声',
 'MARA-HOME':'东厨房冰箱低响与窗外遥远交通声',
 'VISIT':'会见室持续通风，空房混响克制',
 'COURT-STATE':'法院通风和安静大厅底声',
 'COURT-FEDERAL':'法院通风和安静大厅底声',
 'COURT-CORRIDOR':'走廊通风、远端安检不可辨人声',
 'HELEN-OFFICE':'办公室低位通风与窗外远车',
 'NEWSROOM':'编辑部通风与远工位不可辨的工作底声',
 'INSURER':'公司中央空调低响',
 'CAFE':'咖啡店低位通风与远桌不可辨人声',
 'SERVER-OFFICE':'设备柜风扇持续低响',
 'POLICE':'警局通风与远处办公环境底声',
 'STATION':'公共候车空间的通风和不可辨远人声',
 'HOTEL-ROOM':'廉价房间通风与窗外遥远交通声',
 'PRISON':'监室通风与走廊远端低位环境声',
 'EXTERIOR':'本场已建立街道或法院外的远交通与风声'
}

def time_rule(scene):
    t=scene['time']
    if '傍晚' in t or '截稿前' in t:
        return '本场为傍晚过渡，窗外亮度只按正文已有暮光维持，不改成正午直射；场内既有灯具的明暗关系连续。'
    if '夜' in t or '晚' in t or '凌晨' in t:
        return '本场夜间/凌晨，空间母稿的门窗位置保持，但其中白天窗光说明不作当前光源；以本场正文已明确的工作灯、台灯或既有公共照明为主，窗外暗部保留环境层次。'
    return '本场光源启用及强度以明确时段和正文为准，同场反打继承光源方向；不因景别变化任意换色温。'

def look_for(scene, shot):
    base=LOOKS[scene['location']]
    ids=shot['characters']
    if 'LUIGI-RED' in ids:base+='深红毛衣维持暗酒红与针织纹理，不偏紫或霓虹红；白领不溢出。'
    if 'LUIGI-ESCORT' in ids:base+='橙棉布亮部保织纹，不与肤色融合。'
    return f'本场时段：{scene["time"]}。{time_rule(scene)} 本地光色与材质：{base}'

def scene_environment(scene, shot, locations):
    if scene['location']=='EXTERIOR':
        return shot['composition']+'；真实街道或法院外的既定入口与道路，不另建第二套空间；准确界面文字由后期叠加。'
    env=locations[scene['location']]
    t=scene['time']
    night=('夜' in t or '晚' in t or '凌晨' in t) and '傍晚' not in t
    if night:
        env=env.replace('西窗依时段受天光或夜间街灯冷光，北桌暖台灯按本场启用','西窗透少量街灯冷光，北桌既有暖台灯亮着；不启用白昼天光')
        env=env.replace('日间西窗环境主光、吧台暖补','夜间西窗外暗部、东吧台既有暖灯')
        env=env.replace('白天西窗为主、夜晚桌灯暖光','夜间既有桌灯暖光为主，西窗外暗部')
    elif '傍晚' in t:
        env=env.replace('日间西窗环境主光、吧台暖补','西窗仅余正文明确的暮光，东吧台既有暖灯维持桌边照明；不启用白昼窗光')
        env=env.replace('白天西窗为主、夜晚桌灯暖光','西窗暮光渐弱、既有桌灯照明连续，不跳成白天')
    else:
        env=env.replace('白天西窗为主、夜晚桌灯暖光','白天西窗为主，既有灯具按本镜描述启用')
        env=env.replace('西窗依时段受天光或夜间街灯冷光，北桌暖台灯按本场启用','西窗受清晨天光；北桌现有台灯是否点亮依本场正文，不调用夜间街灯')
    return env

def build_visual_cards(save, text, wrap, head, figure):
    # Simple geometry is deliberately labelled as design, never production stills.
    defs='''<defs><linearGradient id="face"><stop stop-color="#cba58e"/><stop offset=".52" stop-color="#af8b75"/><stop offset="1" stop-color="#745d50"/></linearGradient><linearGradient id="deepface"><stop stop-color="#906b54"/><stop offset="1" stop-color="#483a34"/></linearGradient><linearGradient id="steel"><stop stop-color="#596870"/><stop offset=".45" stop-color="#b8c2c2"/><stop offset=".6" stop-color="#d4d8d2"/><stop offset="1" stop-color="#78868a"/></linearGradient><pattern id="cotton" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 1H6M1 0V6" stroke="#794d34" opacity=".25" stroke-width=".6"/></pattern><pattern id="paper" width="29" height="19" patternUnits="userSpaceOnUse"><path d="M4 4l8 1M18 13l5 -1" stroke="#aca798" opacity=".3"/></pattern></defs>'''
    def actor(x,y,scale=1,coat='#4b555f',skin='url(#face)'):
        return figure(x,y,scale,coat)+f'<ellipse cx="{x}" cy="{y-25*scale}" rx="{12*scale}" ry="{12*scale}" fill="{skin}"/>'
    b=head('G1 · 风格卡 / REALIST SUSPENSE','《拒赔》统一视觉方案 · 原创矢量示意，不是剧照或调色样片')+defs
    for i,title in enumerate(['机构的距离','桌面上的博弈','没有停下的生活']):
        x=40+i*390
        b+=f'<rect x="{x}" y="135" width="360" height="203" fill="{["#70808a","#8a8b84","#968b77"][i]}"/>'
        if i==0:
            b+=f'<path d="M{x} 260H{x+360}V338H{x}Z" fill="#4c565d"/>'+actor(x+180,242,.8,'#d57238')+actor(x+80,238,.88,'#293947')+actor(x+279,240,.88,'#293947')
            for dx in [15,45,315,345]:b+=f'<path d="M{x+dx} 165V338" stroke="#29343c" stroke-width="7"/>'
        elif i==1:
            b+=f'<rect x="{x+28}" y="150" width="72" height="72" fill="#c5cdd0"/><path d="M{x+24} 314H{x+335}" stroke="#6d5646" stroke-width="26"/>'+actor(x+125,244,.72,'#6b2933')+actor(x+265,241,.76,'#38424c')+f'<path d="M{x+155} 295l52 -4 9 15 -54 3Z" fill="#e8e4dc"/>'
        else:
            b+=f'<rect x="{x+25}" y="150" width="66" height="95" fill="#718897"/><path d="M{x+256} 145l-50 166h109Z" fill="#e2bf80" opacity=".16"/><rect x="{x+245}" y="148" width="40" height="8" fill="#cfb180"/>'+actor(x+210,240,.75,'#b3a797')+actor(x+118,273,.46,'#d8d9cc')+f'<rect x="{x+67}" y="305" width="240" height="12" fill="#6b5847"/><path d="M{x+112} 297H{x+140}" stroke="#698376" stroke-width="4"/>'
        b+=text(x+5,375,title,20,width=18)
    b+=text(45,432,'同一规则：可读肤色、保留暗部材质、柔和纸白高光。\n不同处境：栏杆限制行动，桌面承载选择，家务不断打断谈话。\n摄影变化由演员的决定触发；静止与共享中景仍能产生压力。\n四部美剧提供创作机制，片名不代替实际机位、光源和表演设计。',20,width=55)
    save('visual/style-card.svg',wrap(b))

    b=head('G1 · 配色卡 / COLOR RELATIONSHIPS','设计色值，不是从参考剧提取；不构成LUT、曝光或输出色彩空间参数')+defs
    colors=['#556774','#c8c9c4','#a5795b','#262b31','#e8e4dc','#6b2933','#d57238','#698376']
    names=['环境 · 冬日灰蓝','墙石 · 中性灰','局部 · 灯下旧木','暗部 · 深炭灰','高光 · 纸白','身份 · 深红针织','身份 · 哑光橙棉','生活 · 灰绿']
    for i,(c,n) in enumerate(zip(colors,names)):
        x=45+i%4*290;y=140+i//4*180
        b+=f'<rect x="{x}" y="{y}" width="255" height="108" fill="{c}"/>'+text(x,y+139,n,17,width=24)+text(x,y+164,c,13,'#5e666c')
    b+=text(45,545,'肤色保持人的差异，冷环境不等于青色皮肤',20,width=50)
    for i,c in enumerate(['#d0aa91','#af876c','#7c5843','#493930']):
        b+=f'<rect x="{45+i*100}" y="568" width="90" height="48" fill="{c}"/>'
    b+=text(475,592,'此处肤色色块仅示意差异，不是角色固定肤色值。',16,width=39)
    b+=text(45,668,'环境收敛但不全局褪色；红橙保织纹，蓝夹与绿蜡笔仍可识别。',20,width=56)
    save('visual/palette-card.svg',wrap(b))

    b=head('G1 · 材质卡 / SURFACE RESPONSE','图案和几何高光仅表达设计区别；真实纹理须由演员、服装和场景样片核验')+defs
    mats=[('深红针织','#6b2933','knit','保留线圈，不靠锐化描边'),('橙色棉布','#d57238','cotton','亮部保折痕，不变塑料'),('无涂层白纸','#e8e4dc','paper','细纹与折边，不发光'),('拉丝金属','url(#steel)',None,'高光局部，不白成整板'),('磨损旧木','#8e6d53',None,'色差来自使用，不统一磨皮'),('磨砂玻璃','#b8c5c7',None,'透光与漫反射分开')]
    for i,(n,c,pat,rule) in enumerate(mats):
        x=45+i%3*390;y=140+i//3*260
        b+=f'<rect x="{x}" y="{y}" width="350" height="150" fill="{c}"/>'
        if pat:b+=f'<rect x="{x}" y="{y}" width="350" height="150" fill="url(#{pat})"/>'
        if i==4:
            for k in range(7):b+=f'<path d="M{x+8} {y+15+k*18}q170 12 330 -3" stroke="#604c3d" fill="none" opacity=".4"/>'
        if i==5:b+=f'<rect x="{x+110}" y="{y+20}" width="125" height="110" fill="#60737a" opacity=".18"/>'
        b+=text(x,y+184,n,21,width=23)+text(x,y+215,rule,16,width=24)
    save('visual/material-card.svg',wrap(b))

    b=head('G1 · 灯光卡 / MOTIVATED LIGHT','光源先成立，调色再统一；示意明暗关系，不冒充真实照度、色温或脸部样片')+defs
    lights=[('河岸押送','北侧天光；南车灯仅局部','#70818c','#d57238'),('法院','北高窗＋中性顶灯','#a6aaa5','#6b2933'),('会见室','顶灯；东窄窗按时段弱补','#9da7a6','#7e8788'),('玛拉家','西窗＋东厨房现有灯具','#9a8c77','#b0a392'),('诊所','西窗＋中性工作灯','#a9b6b2','#d5d8d4'),('公司','西窗/工作灯；玻璃中性','#b0b5af','#394a5d')]
    for i,(name,rule,bg,coat) in enumerate(lights):
        x=45+i%3*390;y=135+i//3*275
        b+=f'<rect x="{x}" y="{y}" width="350" height="160" fill="{bg}"/><path d="M{x+15} {y+16}L{x+225} {y+145}L{x+140} {y+10}Z" fill="#edf0df" opacity=".15"/>'+actor(x+190,y+93,.7,coat,'url(#deepface)' if i==4 else 'url(#face)')
        b+=text(x,y+192,name,20,width=23)+text(x,y+221,rule,15,width=23)+text(x,y+245,'受光与背光侧均保留材质/肤色',14,'#586169',width=25)
    save('visual/lighting-card.svg',wrap(b))

    b=head('G1 · 光位图 / WORLD LIGHT & CAMERA','世界北向固定；仅沿用既定光源；图形用于方向沟通，不是现场搭灯测量')+defs
    rooms=[('DOCK','北：河岸 / 直升机 / 天光','西：媒体栏杆','东：警员缓冲','南：押送车 / 车灯'),('DINER','北：后排 / 厕所通道','西：临街窗','东：柜台 / 灯','南：正门 / 警员来路'),('COURT','北：法官席 / 高窗','西：辩方','东：控方','南：旁听 / 入口')]
    for i,(n,no,we,ea,so) in enumerate(rooms):
        x=45+i*390;y=165
        b+=text(x,y-20,n,23)+f'<rect x="{x}" y="{y}" width="345" height="310" fill="#deded6" stroke="#7b8589"/>'
        if n=='DINER':
            b+=f'<path d="M{x+4} {y+82}h85" stroke="#829ea8" stroke-width="12" opacity=".7"/><path d="M{x+341} {y+240}h-55" stroke="#b99a70" stroke-width="9" opacity=".7"/>'
        else:
            b+=f'<path d="M{x+170} {y+47}v55" stroke="#829ea8" stroke-width="12" opacity=".7"/>'
            if n=='DOCK':b+=f'<path d="M{x+250} {y+304}v-43" stroke="#b99a70" stroke-width="8" opacity=".7"/>'
        b+=text(x+14,y+31,no,15,width=21)+text(x+10,y+140,we,14,width=10)+text(x+206,y+190,ea,14,width=9)+text(x+12,y+280,so,15,width=22)
        b+=f'<circle cx="{x+(110 if n=="DINER" else 165)}" cy="{y+(96 if n=="DINER" else 163)}" r="14" fill="#a5795b"/><rect x="{x+48}" y="{y+223}" width="26" height="18" fill="#556774"/>'
        b+=text(x+85,y+239,'可达机位区',12,width=9)
    b+=text(45,535,'N ↑ 不随反打旋转世界。屏幕左右可以变，门窗与灯位不交换。\nE01/E06继承同次押送的天气和曝光关系。\n夜景不启用母稿里的白天窗光；本场正文和时段优先。\n摄影参考不允许新增会见玻璃、改走位或把诊所接到纽约街边。',19,width=58)
    save('visual/light-plot.svg',wrap(b))

    b=head('G1 · LookDev验证板 / PENDING MEDIA','六项实际试片目标 · 下方仅为材质/层次示意，不能证明已完成调色匹配')+defs
    tests=[('红衣与白领','红不紫化，领口与针织均有细节'),('橙衣与肤色','橙棉布不与面部融合'),('深肤色与诊所','冷环境中保留面部层次'),('黑包与黑裤','保持两个物件的材质分离'),('纸白与台灯','白纸有折边，暖光局部生效'),('金属与灰衣','反射局部，不覆盖手与衣纹')]
    for i,(title,rule) in enumerate(tests):
        x=45+i%3*390;y=135+i//3*275
        b+=f'<rect x="{x}" y="{y}" width="350" height="160" fill="{["#8e999f","#70818c","#a5b3af","#4f5960","#9f8a6e","#8c9b9e"][i]}"/>'
        if i in [0,1,2]:
            b+=actor(x+170,y+90,.8,['#6b2933','#d57238','#d5d8d4'][i],'url(#deepface)' if i==2 else 'url(#face)')
            if i==0:b+=f'<path d="M{x+162} {y+78}l8 8 8 -8" stroke="#e8e4dc" fill="none" stroke-width="3"/>'
        elif i==3:b+=f'<rect x="{x+155}" y="{y+23}" width="52" height="130" fill="#262b31"/><rect x="{x+85}" y="{y+68}" width="68" height="78" rx="8" fill="#38434b" stroke="#758088" stroke-width="2"/>'
        elif i==4:b+=f'<path d="M{x+60} {y+38}l220 9 -12 86 -212 -9Z" fill="#e8e4dc"/><path d="M{x+268} {y+126}l-17 -15 17 -10" fill="#c4bdac"/>'
        else:b+=f'<rect x="{x+15}" y="{y+116}" width="320" height="26" fill="url(#steel)"/>'+actor(x+190,y+74,.6,'#78878b')
        b+=text(x,y+191,title,20,width=23)+text(x,y+222,rule,15,width=24)+text(x,y+246,'实际图像 / 动态 / 相邻反打：待验',14,'#7d3d3d',width=26)
    save('visual/lookdev-test-board.svg',wrap(b))
