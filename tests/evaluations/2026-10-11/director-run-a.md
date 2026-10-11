# CineWeave Director 独立文字试跑 A

日期：2026-10-11。范围：四项只有文字设定的完整视频稿。未读取 cinematic-cases.json、研究/执行/计划报告、其他运行稿或 .build 既有输出；没有媒体/API调用、源码修改或Git提交。以下身份、布局、画幅与表现媒介均为本次可撤销提案。

逐镜状态针对文字规划。没有素材的像素、声音、真实连续性、观众理解和艺术效果没有被当成通过，也没有以缺媒体豁免文本任务。Node实际版本v22.15.0；临时JSON输入仅在系统临时目录。

## CD-E51

### 原请求

```text
白天安静人行道，观众先发现有人跟随；前方人物只在结尾通过橱窗倒影确认，不回头，也不新增袭击或追逐。给完整八秒单镜视频稿。
```

### 实际回答

以下为通用文生视频稿；暂定横向 16:9、自然写实表现。人物外观、橱窗位置与日光方向是可撤销的设计补足。八秒是成片采用时长，故事中连续经过八秒。

#### S1｜0.0—8.0 秒｜连续单镜

```text
白天，安静的城市人行道，八秒连续单镜，横向16:9。人行道沿东西方向延伸，北侧是店面，前方一面干净橱窗紧接着哑光浅灰外墙；南侧是路缘。画面没有其他行人穿过，没有车辆驶入。柔和中性日光由南侧开阔天空照来，浅灰墙与铺地提供弱反光；人的脸、深色衣料及橱窗反射保留层次，玻璃不变成不透明镜面，店内陈列仍隐约可见，整体为低饱和灰、米白与深蓝，不改变白天的安静感。
前方人物甲是约三十岁的成年女性，短齐下巴黑发、长圆脸、平直眉、自然深棕眼睛，无发饰和装饰性彩妆，皮肤有自然纹理，穿米白棉质短外套、灰色直筒长裤和低帮布鞋。她起初眉间舒展、双唇轻合，肩颈松弛，面朝行走的东方，视线只落在前方路面与即将经过的橱窗陈列。后方人物乙是约四十岁的成年男性，短发、方脸，穿深蓝哑光夹克、黑色长裤和深色鞋；不拿武器，不伸手接近甲。乙的注意力持续落在甲的背部，保持克制步态。
摄影机在甲前方偏南的街侧斜位，略低于眼睛，以较宽的三分之四正侧面中全景陪甲向东平移。甲在近处画面右侧，画面左后方保留她已经走过的人行道；乙可在该纵深中被直接看见。甲的脚步、乙的全身和两人的间距都留在画内。景深保护前后两人，摄影机不切镜、不环绕、不突然推近，也不靠模糊藏掉乙。
0.0至1.2秒，甲平稳向东走，头与肩保持朝前。乙从左后方进入可读的背景，距甲约四米，沿同一人行道跟进；甲尚未看见他。
1.2至3.2秒，观众有机会直接注意到乙始终看着甲的背部，沿甲走过的路线保持距离。甲继续看前方，步速自然，没有警觉表情。
3.2至5.6秒，甲因即将经过橱窗的陈列稍放慢两步，身体与头仍朝东方；乙随后也减慢，保留原来的跟随间距。他没有超越甲，也不转去看别处。摄影机保持原跟行速度的柔和调整，让这种步速响应与距离同时可见；甲此时的视线仍在前方及陈列，尚未作出察觉跟随的回应。
5.6至6.6秒，甲与摄影机沿已有路径来到橱窗前，甲身后的乙进入玻璃可反射的视角。橱窗里的乙与画面背景中的乙来自同一人、同一位置和连续步态；反射按玻璃角度呈现，不额外出现第三个人。此前外墙与斜角反光没有向甲提供可辨认的跟随者图像。
6.6至8.0秒，仅在这个结尾窗口，甲将眼球移向左前方橱窗中的乙的倒影，头、肩与身体仍朝前，不向后转头。她在倒影里见到乙仍跟着自己，眉间轻收、下颌略紧，行走中的肩颈收住一点；不瞪眼，不张嘴，也不突然奔跑。摄影机继续陪行，保留甲的眼线朝向、清楚的倒影和真实背景中的乙，最后一刻甲仍向东走，乙仍在约四米之后。
声音是安静街面的连续底声与两组自然脚步，乙的脚步较远；甲放慢时脚步间隔相应变长。不以突出的身后脚步或惊吓音提前让甲确认。不加对白、旁白、配乐或突发撞击。全段没有回头、袭击、追逐、拦路或新增人物；结束仅完成甲通过橱窗倒影确认有人跟随的认知变化。
```

注意力设计是先让观众读到背景中的目光、同路线和步速响应，再让甲在 6.6—8.0 秒取得反射线索。反射的真实几何与人物是否可读仍需实际画面确认；这份稿件只完成文字规划。

### 实际读取文件与整文件 SHA256

以下记录写稿前实际加载的全部本地文本上下文及检查器运行依赖；祖先目录检查未发现 AGENTS.md。未读取所禁来源。

| 相对路径 | SHA256 |
| --- | --- |
| `skills/cineweave-director/SKILL.md` | `6d83c553b4a1ccedd55a84a06df5582739c0bc258c50de85e998cc7e61224524` |
| `skills/cineweave-director/references/optional/ensemble-direction-and-review.md` | `a3f41e181a4382ed4a23835c696797837fac9cfc939fc3f86203443cab680bae` |
| `skills/cineweave-director/references/optional/prompt-detail-standard.md` | `0de944dffd30d69bc05a52ef4bceaf0a90dce40564e2f1a288c68e7dd1e88e59` |
| `skills/cineweave-director/references/optional/shot-design-workbench.md` | `b2e182a4907a235d0044b500d70d57fdde3b6ec9a7c9a99546583907632543c2` |
| `skills/cineweave-director/references/routes/shot-direction.md` | `8ac6fd68d2f3c51d66a6dbbdd7a60d3604721497f3717a54ce08b15f49e2c82f` |
| `skills/cineweave-director/references/routes/storyboard-rhythm.md` | `f71bf9c0aadea9a05d24043e76e3241f3594aa3dcc681b078537c8b5c76af9fd` |
| `skills/cineweave-director/references/optional/video-sound-and-delivery.md` | `4a60146d81fc2092fb7bb6e18d9b1cd4e8ac8cdf09b11994f5a98b86fab2a715` |
| `skills/cineweave-director/references/optional/editing-sound-craft.md` | `184f2fc8e8d638aab40b294d266badecc6ee37c99e1d097c8e3ec847e45a4da4` |
| `skills/cineweave-director/references/optional/directing-craft.md` | `82524260f2823fe2d779e367a8a17802c050368c29d8e084cea1b741dd1bcf03` |
| `skills/cineweave-director/references/optional/video-performance-direction.md` | `561ef041a31693d8607e16eed361597ab258a519709855d3e85ec1154969088d` |
| `skills/cineweave-director/references/optional/video-timing-and-handles.md` | `d687fb586e766bd670598fae00813f2d80ad1fc522dda39ee0311e21ee2afee5` |
| `skills/cineweave-director/scripts/check-shot-review.mjs` | `bb69f60d8794f3329bc4b7af772d05ad01a28c001c7345f1de63bfa1e3d7d1c2` |
| `skills/cineweave-director/scripts/parse-json.mjs` | `9c15621d8304bf6114cc4cb322409c8e59433409ac17950311725cdcbebecf11` |

### 实际逐镜评审工作表（原始输入）

本表是非规范临时工作表，source版本1。完整六视角覆盖本项所有实际镜头；pass仅是对应文字事实的规划结论。

```json
{
  "source": {
    "type": "prompt",
    "id": "CD-E51-director-run-a",
    "version": 1
  },
  "mode": "full",
  "shotIds": [
    "S1"
  ],
  "reviews": [
    {
      "role": "direction",
      "shotId": "S1",
      "status": "pass",
      "criterion": "信息、目的与关系变化符合本次原请求。",
      "observation": "1.2—5.6秒先显示乙跟同一路线且响应甲减速，甲仅6.6—8.0秒从倒影确认。",
      "sourceLocator": "CD-E51 / 实际回答 / S1 / 对应正文时间窗口"
    },
    {
      "role": "performance",
      "shotId": "S1",
      "status": "pass",
      "criterion": "人物取得具体触发后才改变行为，动作在当前窗口可读。",
      "observation": "甲前段关注路面与陈列，末段才移眼看乙反射；眉间下颌小幅变化，头肩始终朝东。",
      "sourceLocator": "CD-E51 / 实际回答 / S1 / 对应正文时间窗口"
    },
    {
      "role": "staging",
      "shotId": "S1",
      "status": "pass",
      "criterion": "位置、路径和关键接触可达，遮挡不删除必要事实。",
      "observation": "甲乙同一路前后约四米，乙不接近；橱窗、来路与两人留在单镜可见范围。",
      "sourceLocator": "CD-E51 / 实际回答 / S1 / 对应正文时间窗口"
    },
    {
      "role": "cinematography",
      "shotId": "S1",
      "status": "pass",
      "criterion": "机位、覆盖、焦点与光源服务所需可见事实。",
      "observation": "街侧前斜位向东陪行，景深保护甲乙，已有玻璃视角显示同一乙倒影，没有切镜。",
      "sourceLocator": "CD-E51 / 实际回答 / S1 / 对应正文时间窗口"
    },
    {
      "role": "prompt",
      "shotId": "S1",
      "status": "pass",
      "criterion": "完整文字初态、过程、终态、声音与用户锁定项没有互相矛盾。",
      "observation": "完整八秒初态、步速响应、倒影触发与行走终态，声音不提前成为甲确认线索。",
      "sourceLocator": "CD-E51 / 实际回答 / S1 / 对应正文时间窗口"
    },
    {
      "role": "continuity",
      "shotId": "S1",
      "status": "pass",
      "criterion": "入出状态、身份、道具、方向与相邻时间关系闭合。",
      "observation": "连续八秒无剪辑；甲不回头，乙不变成第三人，日光、衣着和行进方向沿用。",
      "sourceLocator": "CD-E51 / 实际回答 / S1 / 对应正文时间窗口"
    }
  ]
}
```

### 随包逐镜工具原始结果

实际命令：`node skills/cineweave-director/scripts/check-shot-review.mjs <系统临时目录>/CD-E51.json`。
实际退出码：0。stdout原样保留如下；stderr为空。

```json
{
  "valid": true,
  "scope": "plan_only",
  "coverageComplete": true,
  "reviewComplete": true,
  "expectedRows": 6,
  "missing": [],
  "openItems": [],
  "prompt": null,
  "errors": [],
  "limitation": "仅检查工作表一致性，不核验引用内容、艺术质量、媒体、权利、批准或实际执行。",
  "localization": {
    "locale": "zh-CN",
    "summary": "规划评审已完成；实际媒体仍未核验。"
  }
}
```

## CD-E52

### 原请求

```text
甲把信封交给乙，乙握稳甲才松手；两人在同侧短柜台边，台词只有甲说“先还给你”。给两版同样十二秒的完整三镜视频稿，只改变中镜覆盖：共同画面与手部细节。身份、空间、台词、光色、结果和前后镜保持一致。
```

### 实际回答

当前全文版本：v2。空间措辞经手工复查后修订，修订记录与v2原始工具结果附在本项末尾。

以下两版都是十二秒、三镜、连续叙事时间。暂定 16:9、自然写实；原创身份和柜台结构仅用于这次稿件。共同画面版在中镜保留双方的同时关系；手部细节版让握稳与松手的先后更大、更清楚，代价是该镜看不见两张脸。手部版不改变表演或声音。两版首镜和末镜正文逐字相同。

#### 共同画面版 S1｜0.0—3.0 秒
```text
白天的安静小工作室，横向16:9，自然写实。东西向短柜台靠北墙，柜台台面为浅灰哑光木面；甲与乙都站在柜台南侧这一条边，甲在西端即画面左，乙在东端即画面右，相距约半米，两人的身体朝南、朝摄影机一侧，各略转向对方，柜台在两人身后，不站到柜台两侧。摄影机在柜台南侧朝北，眼平固定双人中全景，两人的头、上身、前臂、双手及柜台南缘完整入画。背景是浅灰墙与一段不带文字的木层架，不增加人群。两人的面部、交接手和信封都在可读景深内，不移动、不变焦、不越到柜台北侧。
甲是约四十五岁的成年女性，窄方脸、深棕眼睛、右眉尾小痣、黑发齐肩向后别在耳后，无发饰、无装饰性彩妆，穿砖红色哑光棉衬衫、袖口平直。乙是约三十二岁的成年男性，圆长脸、浓而自然的眉、短黑发、无胡须，穿石灰绿色棉质圆领上衣。两人肤质自然，身份与服装固定。甲神情平实，意在交还物件；乙克制地接收，肩膀放松，双唇自然轻合。信封是同一只浅棕牛皮纸薄信封，封口闭合，没有文字，长边水平。
本镜采用全场0.0至3.0秒，实时三秒。入镜时甲右手的拇指与食指捏住信封西端短边，信封在甲腰前、离台面约十厘米；甲左手轻搭柜台南缘。乙左手留在自己腰侧，右手自然垂下，视线落在甲的信封上，尚未触碰。0.6至1.8秒，甲看着乙，用平实、清楚的普通话完整说“先还给你”，口型与下颌自然随这句话活动。乙只听、不说话。2.0至3.0秒，甲右手将信封沿水平方向向东送到两人之间，在共同可达的交接位置停下，继续捏住西端短边；乙的左手仍在腰侧，没有提前握信封。甲说完后双唇自然合拢，视线落到信封交接位置。
南侧窗的中性柔和日光照亮脸和手，北侧浅灰墙反射较弱填充；砖红、石灰绿、浅棕与灰色保持低饱和固有色，手指、纸面与衣料的纹理可读，没有光色突变。声音保留同一工作室的轻弱室内底声，甲的这一句话清楚、来自画面左侧；没有其他对白、旁白或音乐。出点信封已经停在两人之间，仍由甲右手持有，乙尚未伸左手；下一镜从这一等待状态连续接入。
```

#### 共同画面版 S2｜3.0—8.0 秒
```text
同一白天工作室，横向16:9，自然写实。本镜只改变覆盖，保留既定表演与声音。摄影机在柜台南侧朝北，固定眼平双人中景，从头顶留白至腰部，甲在画面左、西端，乙在画面右、东端；两人仍站在浅灰短柜台的同一南侧边，相距约半米、略朝对方。两张脸、双方交接手腕和完整信封同时入画，景深保护面部与纸边，不移动、不变焦、不越轴。浅灰北墙与无字木层架在背景。
甲约四十五岁，窄方脸、深棕眼睛、右眉尾小痣、黑发齐肩别于耳后，穿砖红哑光棉衬衫、袖口平直；乙约三十二岁，圆长脸、自然浓眉、短黑发、无胡须，穿石灰绿色棉质圆领上衣，无发饰和装饰性彩妆，肤质自然。甲神情平实，乙克制地接收，两人的视线都在信封上；甲双唇已自然合拢，乙全程不说话。
本镜采用全场3.0至8.0秒，实时五秒。入镜时信封长边水平、封口闭合、浅棕纸面无字，停在两人之间离台面约十厘米；甲右手捏住西端短边，甲左手搭柜台南缘，乙左手尚在腰侧，右手垂下。3.4秒乙伸出左手；4.5秒左拇指落在信封东端朝摄影机的纸面，食指与中指在背面形成对夹；4.5至5.2秒收紧对夹、手腕对正，信封保持水平，不晃动。甲仍握住西端，等待乙建立稳固握持。5.7秒甲才张开右拇指和食指，完全离开纸边；6.4秒右手退回甲腰侧。6.5至8.0秒乙左手将信封水平收向自己，到腰前约五厘米处停下，右手仍垂下，尚未托底。两人不换站位，不追加眼神或表演变化。
南侧窗的中性柔光与北墙弱反射沿用首镜，面部、手部和信封同时可读，砖红、石灰绿、浅棕与浅灰保持同一低饱和光色。声音只有连续室内底声和轻弱手指触纸、信封移动的摩擦，声音距离与首镜相同；甲的“先还给你”已在首镜说完，本镜不重说，不加乙的回应、旁白或音乐。出点乙左手独持信封、甲右手已收回，下一镜继续乙右手托住底边的动作。
```

#### 共同画面版 S3｜8.0—12.0 秒
```text
同一白天工作室，横向16:9，自然写实。摄影机回到柜台南侧朝北的固定双人中全景，眼平，与第一镜同机位、取景及可读景深；甲在画面左、西端，乙在画面右、东端，两人仍站在短柜台的同一南侧边，身体略朝对方。浅灰台面、北墙、无文字木层架以及南侧窗的位置不变。甲约四十五岁，窄方脸、深棕眼睛、右眉尾小痣、齐肩黑发别在耳后，砖红棉衬衫袖口平直；乙约三十二岁，圆长脸、自然浓眉、短黑发、无胡须，穿石灰绿色棉质圆领上衣。无发饰和装饰性彩妆，保留同样自然肤质与克制表情。
本镜采用全场8.0至12.0秒，实时四秒。入镜时同一只闭合的无字浅棕信封长边水平，已被乙左手握住东端并收到自己腰前约五厘米处；甲右手已离开信封、收回甲腰侧，甲左手仍搭柜台南缘。乙右手起初自然垂下。8.3至9.1秒，乙抬起右手，用右掌托住信封底边中部，左手保持原握持，把信封稳稳收到下胸前，不打开、不另换信封；信封由乙双手持有。9.1至10.2秒，乙抬眼看向甲的脸，眉间略舒展，双唇仍轻合；甲保持平实神情看着乙，没有再伸手，也不追加台词或夸张点头。10.2至12.0秒，两人维持原站位，乙双手在下胸前持稳信封，甲双手留在各自原位，结尾明确物件已归乙。
南侧窗中性柔光与北墙弱反射保持前镜相同的脸部、手部和纸面层次；砖红、石灰绿、浅棕与浅灰不变，不另换调色。声音继续同一室内底声，乙右手托纸时有轻弱纸面摩擦，听觉距离与前镜一致。本镜没有对白、旁白或配乐。切入承接上一镜乙左手独持、甲已松手的结果，不重演接过信封。
```

#### 手部细节版 S1｜0.0—3.0 秒
```text
白天的安静小工作室，横向16:9，自然写实。东西向短柜台靠北墙，柜台台面为浅灰哑光木面；甲与乙都站在柜台南侧这一条边，甲在西端即画面左，乙在东端即画面右，相距约半米，两人的身体朝南、朝摄影机一侧，各略转向对方，柜台在两人身后，不站到柜台两侧。摄影机在柜台南侧朝北，眼平固定双人中全景，两人的头、上身、前臂、双手及柜台南缘完整入画。背景是浅灰墙与一段不带文字的木层架，不增加人群。两人的面部、交接手和信封都在可读景深内，不移动、不变焦、不越到柜台北侧。
甲是约四十五岁的成年女性，窄方脸、深棕眼睛、右眉尾小痣、黑发齐肩向后别在耳后，无发饰、无装饰性彩妆，穿砖红色哑光棉衬衫、袖口平直。乙是约三十二岁的成年男性，圆长脸、浓而自然的眉、短黑发、无胡须，穿石灰绿色棉质圆领上衣。两人肤质自然，身份与服装固定。甲神情平实，意在交还物件；乙克制地接收，肩膀放松，双唇自然轻合。信封是同一只浅棕牛皮纸薄信封，封口闭合，没有文字，长边水平。
本镜采用全场0.0至3.0秒，实时三秒。入镜时甲右手的拇指与食指捏住信封西端短边，信封在甲腰前、离台面约十厘米；甲左手轻搭柜台南缘。乙左手留在自己腰侧，右手自然垂下，视线落在甲的信封上，尚未触碰。0.6至1.8秒，甲看着乙，用平实、清楚的普通话完整说“先还给你”，口型与下颌自然随这句话活动。乙只听、不说话。2.0至3.0秒，甲右手将信封沿水平方向向东送到两人之间，在共同可达的交接位置停下，继续捏住西端短边；乙的左手仍在腰侧，没有提前握信封。甲说完后双唇自然合拢，视线落到信封交接位置。
南侧窗的中性柔和日光照亮脸和手，北侧浅灰墙反射较弱填充；砖红、石灰绿、浅棕与灰色保持低饱和固有色，手指、纸面与衣料的纹理可读，没有光色突变。声音保留同一工作室的轻弱室内底声，甲的这一句话清楚、来自画面左侧；没有其他对白、旁白或音乐。出点信封已经停在两人之间，仍由甲右手持有，乙尚未伸左手；下一镜从这一等待状态连续接入。
```

#### 手部细节版 S2｜3.0—8.0 秒
```text
同一白天工作室，横向16:9，自然写实。本镜只改变覆盖，保留既定表演与声音。摄影机仍在柜台南侧朝北、同一轴线侧，固定手部近景，略俯看柜台南缘前方的交接位置；画面完整保留两人的前臂、手腕、双手与整个信封，甲的砖红袖口从画面左进入，乙的石灰绿袖口从画面右进入，两人的脸均在取景外。浅灰柜台南缘是空间锚点，景深容纳甲西端持封处与乙东端对夹处，不移动、不变焦。两人仍站在同一南侧边，甲在西端、乙在东端，相距约半米、略朝对方。
甲约四十五岁，窄方脸、深棕眼睛、右眉尾小痣、黑发齐肩别于耳后，穿砖红哑光棉衬衫、袖口平直；乙约三十二岁，圆长脸、自然浓眉、短黑发、无胡须，穿石灰绿色棉质圆领上衣，无发饰和装饰性彩妆，肤质自然。甲神情平实，乙克制地接收，两人的视线都在信封上；甲双唇已自然合拢，乙全程不说话。上述面部不在本镜取景内，身份以连续的袖口、手和相同站位继承，不为手部近景补脸；这些表演保持与共同画面版一致。
本镜采用全场3.0至8.0秒，实时五秒。入镜时信封长边水平、封口闭合、浅棕纸面无字，停在两人之间离台面约十厘米；甲右手捏住西端短边，甲左手搭柜台南缘，乙左手尚在腰侧，右手垂下。3.4秒乙伸出左手；4.5秒左拇指落在信封东端朝摄影机的纸面，食指与中指在背面形成对夹；4.5至5.2秒收紧对夹、手腕对正，信封保持水平，不晃动。甲仍握住西端，等待乙建立稳固握持。5.7秒甲才张开右拇指和食指，完全离开纸边；6.4秒右手退回甲腰侧。6.5至8.0秒乙左手将信封水平收向自己，到腰前约五厘米处停下，右手仍垂下，尚未托底。两人不换站位，不追加眼神或表演变化。取景留出乙收手的可见空间，不在完成独持之前裁掉信封或甲松开的指尖。
南侧窗的中性柔光与北墙弱反射沿用首镜，手部、衣袖和信封保持与共同画面版相同的照明、纸面响应与低饱和固有色；近景不自动加深反差或虚化必要接触，也不因靠近手部而放大拟音。声音只有连续室内底声和轻弱手指触纸、信封移动的摩擦，声音距离与首镜相同；甲的“先还给你”已在首镜说完，本镜不重说，不加乙的回应、旁白或音乐。出点乙左手独持信封、甲右手已收回，下一镜继续乙右手托住底边的动作。
```

#### 手部细节版 S3｜8.0—12.0 秒
```text
同一白天工作室，横向16:9，自然写实。摄影机回到柜台南侧朝北的固定双人中全景，眼平，与第一镜同机位、取景及可读景深；甲在画面左、西端，乙在画面右、东端，两人仍站在短柜台的同一南侧边，身体略朝对方。浅灰台面、北墙、无文字木层架以及南侧窗的位置不变。甲约四十五岁，窄方脸、深棕眼睛、右眉尾小痣、齐肩黑发别在耳后，砖红棉衬衫袖口平直；乙约三十二岁，圆长脸、自然浓眉、短黑发、无胡须，穿石灰绿色棉质圆领上衣。无发饰和装饰性彩妆，保留同样自然肤质与克制表情。
本镜采用全场8.0至12.0秒，实时四秒。入镜时同一只闭合的无字浅棕信封长边水平，已被乙左手握住东端并收到自己腰前约五厘米处；甲右手已离开信封、收回甲腰侧，甲左手仍搭柜台南缘。乙右手起初自然垂下。8.3至9.1秒，乙抬起右手，用右掌托住信封底边中部，左手保持原握持，把信封稳稳收到下胸前，不打开、不另换信封；信封由乙双手持有。9.1至10.2秒，乙抬眼看向甲的脸，眉间略舒展，双唇仍轻合；甲保持平实神情看着乙，没有再伸手，也不追加台词或夸张点头。10.2至12.0秒，两人维持原站位，乙双手在下胸前持稳信封，甲双手留在各自原位，结尾明确物件已归乙。
南侧窗中性柔光与北墙弱反射保持前镜相同的脸部、手部和纸面层次；砖红、石灰绿、浅棕与浅灰不变，不另换调色。声音继续同一室内底声，乙右手托纸时有轻弱纸面摩擦，听觉距离与前镜一致。本镜没有对白、旁白或配乐。切入承接上一镜乙左手独持、甲已松手的结果，不重演接过信封。
```

两个切点都是继续同一动作，无重放与时间省略：3.0 秒交接尚未接触；8.0 秒乙左手独持、右手尚未托底。甲唯一台词的估计窗口为 0.6—1.8 秒；实际口型、声长、纸边握持和交接可读性须由生成或录制素材验证。

### 实际读取文件与整文件 SHA256

以下记录写稿前实际加载的全部本地文本上下文及检查器运行依赖；祖先目录检查未发现 AGENTS.md。未读取所禁来源。

| 相对路径 | SHA256 |
| --- | --- |
| `skills/cineweave-director/SKILL.md` | `6d83c553b4a1ccedd55a84a06df5582739c0bc258c50de85e998cc7e61224524` |
| `skills/cineweave-director/references/optional/ensemble-direction-and-review.md` | `a3f41e181a4382ed4a23835c696797837fac9cfc939fc3f86203443cab680bae` |
| `skills/cineweave-director/references/optional/prompt-detail-standard.md` | `0de944dffd30d69bc05a52ef4bceaf0a90dce40564e2f1a288c68e7dd1e88e59` |
| `skills/cineweave-director/references/optional/shot-design-workbench.md` | `b2e182a4907a235d0044b500d70d57fdde3b6ec9a7c9a99546583907632543c2` |
| `skills/cineweave-director/references/routes/shot-direction.md` | `8ac6fd68d2f3c51d66a6dbbdd7a60d3604721497f3717a54ce08b15f49e2c82f` |
| `skills/cineweave-director/references/routes/storyboard-rhythm.md` | `f71bf9c0aadea9a05d24043e76e3241f3594aa3dcc681b078537c8b5c76af9fd` |
| `skills/cineweave-director/references/optional/video-sound-and-delivery.md` | `4a60146d81fc2092fb7bb6e18d9b1cd4e8ac8cdf09b11994f5a98b86fab2a715` |
| `skills/cineweave-director/references/optional/editing-sound-craft.md` | `184f2fc8e8d638aab40b294d266badecc6ee37c99e1d097c8e3ec847e45a4da4` |
| `skills/cineweave-director/references/optional/directing-craft.md` | `82524260f2823fe2d779e367a8a17802c050368c29d8e084cea1b741dd1bcf03` |
| `skills/cineweave-director/references/optional/video-performance-direction.md` | `561ef041a31693d8607e16eed361597ab258a519709855d3e85ec1154969088d` |
| `skills/cineweave-director/references/optional/video-timing-and-handles.md` | `d687fb586e766bd670598fae00813f2d80ad1fc522dda39ee0311e21ee2afee5` |
| `skills/cineweave-director/scripts/check-shot-review.mjs` | `bb69f60d8794f3329bc4b7af772d05ad01a28c001c7345f1de63bfa1e3d7d1c2` |
| `skills/cineweave-director/scripts/parse-json.mjs` | `9c15621d8304bf6114cc4cb322409c8e59433409ac17950311725cdcbebecf11` |

### 实际逐镜评审工作表（原始v1输入，修订前）

本表是非规范临时工作表，source版本1。完整六视角覆盖本项所有实际镜头；pass仅是对应文字事实的规划结论。

```json
{
  "source": {
    "type": "prompt",
    "id": "CD-E52-director-run-a",
    "version": 1
  },
  "mode": "full",
  "shotIds": [
    "共同画面版-S1",
    "共同画面版-S2",
    "共同画面版-S3",
    "手部细节版-S1",
    "手部细节版-S2",
    "手部细节版-S3"
  ],
  "reviews": [
    {
      "role": "direction",
      "shotId": "共同画面版-S1",
      "status": "pass",
      "criterion": "信息、目的与关系变化符合本次原请求。",
      "observation": "建立同侧柜台、信封归甲、唯一台词与尚未交接的等待。",
      "sourceLocator": "CD-E52 / 实际回答 / 共同画面版-S1 / 对应正文时间窗口"
    },
    {
      "role": "performance",
      "shotId": "共同画面版-S1",
      "status": "pass",
      "criterion": "人物取得具体触发后才改变行为，动作在当前窗口可读。",
      "observation": "甲0.6—1.8秒说先还给你，乙只听，2.0秒甲才送封，乙未伸手。",
      "sourceLocator": "CD-E52 / 实际回答 / 共同画面版-S1 / 对应正文时间窗口"
    },
    {
      "role": "staging",
      "shotId": "共同画面版-S1",
      "status": "pass",
      "criterion": "位置、路径和关键接触可达，遮挡不删除必要事实。",
      "observation": "双方同在柜台南侧甲西乙东；甲右手持西边，交接点共同可达。",
      "sourceLocator": "CD-E52 / 实际回答 / 共同画面版-S1 / 对应正文时间窗口"
    },
    {
      "role": "cinematography",
      "shotId": "共同画面版-S1",
      "status": "pass",
      "criterion": "机位、覆盖、焦点与光源服务所需可见事实。",
      "observation": "南侧固定双人中全景保护面部、手、台缘与信封，南窗光可读。",
      "sourceLocator": "CD-E52 / 实际回答 / 共同画面版-S1 / 对应正文时间窗口"
    },
    {
      "role": "prompt",
      "shotId": "共同画面版-S1",
      "status": "pass",
      "criterion": "完整文字初态、过程、终态、声音与用户锁定项没有互相矛盾。",
      "observation": "完整三秒初态、准确唯一台词、水平送封和甲仍持有的终态。",
      "sourceLocator": "CD-E52 / 实际回答 / 共同画面版-S1 / 对应正文时间窗口"
    },
    {
      "role": "continuity",
      "shotId": "共同画面版-S1",
      "status": "pass",
      "criterion": "入出状态、身份、道具、方向与相邻时间关系闭合。",
      "observation": "3.0秒封停两人之间且乙未伸手，对应共同画面S2入态。",
      "sourceLocator": "CD-E52 / 实际回答 / 共同画面版-S1 / 对应正文时间窗口"
    },
    {
      "role": "direction",
      "shotId": "共同画面版-S2",
      "status": "pass",
      "criterion": "信息、目的与关系变化符合本次原请求。",
      "observation": "双人共同画面保留同时关系，5.2秒乙握稳先于5.7秒甲释放。",
      "sourceLocator": "CD-E52 / 实际回答 / 共同画面版-S2 / 对应正文时间窗口"
    },
    {
      "role": "performance",
      "shotId": "共同画面版-S2",
      "status": "pass",
      "criterion": "人物取得具体触发后才改变行为，动作在当前窗口可读。",
      "observation": "4.5秒乙先对夹到5.2秒稳住，甲5.7秒才松手，视线落封且不加新表演。",
      "sourceLocator": "CD-E52 / 实际回答 / 共同画面版-S2 / 对应正文时间窗口"
    },
    {
      "role": "staging",
      "shotId": "共同画面版-S2",
      "status": "pass",
      "criterion": "位置、路径和关键接触可达，遮挡不删除必要事实。",
      "observation": "甲持西端乙左手持东端都在画内，先共同持有后乙独持。",
      "sourceLocator": "CD-E52 / 实际回答 / 共同画面版-S2 / 对应正文时间窗口"
    },
    {
      "role": "cinematography",
      "shotId": "共同画面版-S2",
      "status": "pass",
      "criterion": "机位、覆盖、焦点与光源服务所需可见事实。",
      "observation": "同侧固定双人中景保护两脸和纸边，不越轴不换光色。",
      "sourceLocator": "CD-E52 / 实际回答 / 共同画面版-S2 / 对应正文时间窗口"
    },
    {
      "role": "prompt",
      "shotId": "共同画面版-S2",
      "status": "pass",
      "criterion": "完整文字初态、过程、终态、声音与用户锁定项没有互相矛盾。",
      "observation": "五秒写伸手、握稳、松手和收封，首镜台词说完不重说。",
      "sourceLocator": "CD-E52 / 实际回答 / 共同画面版-S2 / 对应正文时间窗口"
    },
    {
      "role": "continuity",
      "shotId": "共同画面版-S2",
      "status": "pass",
      "criterion": "入出状态、身份、道具、方向与相邻时间关系闭合。",
      "observation": "8.0秒乙左手收封腰前五厘米、右手垂下，甲右手回腰侧，对应S3。",
      "sourceLocator": "CD-E52 / 实际回答 / 共同画面版-S2 / 对应正文时间窗口"
    },
    {
      "role": "direction",
      "shotId": "共同画面版-S3",
      "status": "pass",
      "criterion": "信息、目的与关系变化符合本次原请求。",
      "observation": "确认乙双手持封的交还结果，不开封或新增事件。",
      "sourceLocator": "CD-E52 / 实际回答 / 共同画面版-S3 / 对应正文时间窗口"
    },
    {
      "role": "performance",
      "shotId": "共同画面版-S3",
      "status": "pass",
      "criterion": "人物取得具体触发后才改变行为，动作在当前窗口可读。",
      "observation": "8.3—9.1秒乙才右掌托底、左手原握保留，抬眼回应无新对白。",
      "sourceLocator": "CD-E52 / 实际回答 / 共同画面版-S3 / 对应正文时间窗口"
    },
    {
      "role": "staging",
      "shotId": "共同画面版-S3",
      "status": "pass",
      "criterion": "位置、路径和关键接触可达，遮挡不删除必要事实。",
      "observation": "同侧原站位，甲不再接封，乙右掌从垂下到托底可达。",
      "sourceLocator": "CD-E52 / 实际回答 / 共同画面版-S3 / 对应正文时间窗口"
    },
    {
      "role": "cinematography",
      "shotId": "共同画面版-S3",
      "status": "pass",
      "criterion": "机位、覆盖、焦点与光源服务所需可见事实。",
      "observation": "回首镜相同机位，南窗和北墙反射、固有色保持。",
      "sourceLocator": "CD-E52 / 实际回答 / 共同画面版-S3 / 对应正文时间窗口"
    },
    {
      "role": "prompt",
      "shotId": "共同画面版-S3",
      "status": "pass",
      "criterion": "完整文字初态、过程、终态、声音与用户锁定项没有互相矛盾。",
      "observation": "四秒全文从乙左手独持至双手稳持，声音只有底声与纸面摩擦。",
      "sourceLocator": "CD-E52 / 实际回答 / 共同画面版-S3 / 对应正文时间窗口"
    },
    {
      "role": "continuity",
      "shotId": "共同画面版-S3",
      "status": "pass",
      "criterion": "入出状态、身份、道具、方向与相邻时间关系闭合。",
      "observation": "切入继续上一镜，不重新交接；12.0秒信封稳定归乙、封口不变。",
      "sourceLocator": "CD-E52 / 实际回答 / 共同画面版-S3 / 对应正文时间窗口"
    },
    {
      "role": "direction",
      "shotId": "手部细节版-S1",
      "status": "pass",
      "criterion": "信息、目的与关系变化符合本次原请求。",
      "observation": "首镜正文逐字复用共同画面版S1，同样建立同侧空间和唯一台词。",
      "sourceLocator": "CD-E52 / 实际回答 / 手部细节版-S1 / 对应正文时间窗口"
    },
    {
      "role": "performance",
      "shotId": "手部细节版-S1",
      "status": "pass",
      "criterion": "人物取得具体触发后才改变行为，动作在当前窗口可读。",
      "observation": "相同0.6—1.8秒甲说话、2.0—3.0秒送封，乙不提前伸手。",
      "sourceLocator": "CD-E52 / 实际回答 / 手部细节版-S1 / 对应正文时间窗口"
    },
    {
      "role": "staging",
      "shotId": "手部细节版-S1",
      "status": "pass",
      "criterion": "位置、路径和关键接触可达，遮挡不删除必要事实。",
      "observation": "相同甲西乙东、柜台南侧、甲右手持西端、乙左手未伸出。",
      "sourceLocator": "CD-E52 / 实际回答 / 手部细节版-S1 / 对应正文时间窗口"
    },
    {
      "role": "cinematography",
      "shotId": "手部细节版-S1",
      "status": "pass",
      "criterion": "机位、覆盖、焦点与光源服务所需可见事实。",
      "observation": "相同固定中全景、南窗光与景深职责，没有另换起始覆盖。",
      "sourceLocator": "CD-E52 / 实际回答 / 手部细节版-S1 / 对应正文时间窗口"
    },
    {
      "role": "prompt",
      "shotId": "手部细节版-S1",
      "status": "pass",
      "criterion": "完整文字初态、过程、终态、声音与用户锁定项没有互相矛盾。",
      "observation": "三秒全文与另一版一致，未用参见替代。",
      "sourceLocator": "CD-E52 / 实际回答 / 手部细节版-S1 / 对应正文时间窗口"
    },
    {
      "role": "continuity",
      "shotId": "手部细节版-S1",
      "status": "pass",
      "criterion": "入出状态、身份、道具、方向与相邻时间关系闭合。",
      "observation": "3.0秒封停两人间、甲仍持有，接入手部S2同一表演入态。",
      "sourceLocator": "CD-E52 / 实际回答 / 手部细节版-S1 / 对应正文时间窗口"
    },
    {
      "role": "direction",
      "shotId": "手部细节版-S2",
      "status": "pass",
      "criterion": "信息、目的与关系变化符合本次原请求。",
      "observation": "仅把接触事实放大，代价为失去面部可见性，结果与表演不改。",
      "sourceLocator": "CD-E52 / 实际回答 / 手部细节版-S2 / 对应正文时间窗口"
    },
    {
      "role": "performance",
      "shotId": "手部细节版-S2",
      "status": "pass",
      "criterion": "人物取得具体触发后才改变行为，动作在当前窗口可读。",
      "observation": "相同4.5—5.2秒乙握稳、5.7秒甲松手、6.5—8.0秒乙收封。",
      "sourceLocator": "CD-E52 / 实际回答 / 手部细节版-S2 / 对应正文时间窗口"
    },
    {
      "role": "staging",
      "shotId": "手部细节版-S2",
      "status": "pass",
      "criterion": "位置、路径和关键接触可达，遮挡不删除必要事实。",
      "observation": "甲左袖乙右袖、台缘和完整信封锚定位置，保留甲释放指尖及乙收手空间。",
      "sourceLocator": "CD-E52 / 实际回答 / 手部细节版-S2 / 对应正文时间窗口"
    },
    {
      "role": "cinematography",
      "shotId": "手部细节版-S2",
      "status": "pass",
      "criterion": "机位、覆盖、焦点与光源服务所需可见事实。",
      "observation": "仍南侧机位，略俯手部近景，景深保护两接触，不换调色拟音距离。",
      "sourceLocator": "CD-E52 / 实际回答 / 手部细节版-S2 / 对应正文时间窗口"
    },
    {
      "role": "prompt",
      "shotId": "手部细节版-S2",
      "status": "pass",
      "criterion": "完整文字初态、过程、终态、声音与用户锁定项没有互相矛盾。",
      "observation": "同样五秒动作和无新增对白；面部取景外如实注明，未宣称看清脸部。",
      "sourceLocator": "CD-E52 / 实际回答 / 手部细节版-S2 / 对应正文时间窗口"
    },
    {
      "role": "continuity",
      "shotId": "手部细节版-S2",
      "status": "pass",
      "criterion": "入出状态、身份、道具、方向与相邻时间关系闭合。",
      "observation": "8.0秒握持手、水平位置、甲已收手与另一版S2及本版S3一致。",
      "sourceLocator": "CD-E52 / 实际回答 / 手部细节版-S2 / 对应正文时间窗口"
    },
    {
      "role": "direction",
      "shotId": "手部细节版-S3",
      "status": "pass",
      "criterion": "信息、目的与关系变化符合本次原请求。",
      "observation": "尾镜正文逐字复用共同画面版S3，相同交还结果。",
      "sourceLocator": "CD-E52 / 实际回答 / 手部细节版-S3 / 对应正文时间窗口"
    },
    {
      "role": "performance",
      "shotId": "手部细节版-S3",
      "status": "pass",
      "criterion": "人物取得具体触发后才改变行为，动作在当前窗口可读。",
      "observation": "相同8.3—9.1秒右掌托底和9.1—10.2秒抬眼，无新增动作。",
      "sourceLocator": "CD-E52 / 实际回答 / 手部细节版-S3 / 对应正文时间窗口"
    },
    {
      "role": "staging",
      "shotId": "手部细节版-S3",
      "status": "pass",
      "criterion": "位置、路径和关键接触可达，遮挡不删除必要事实。",
      "observation": "同一南侧原站位，乙左手原握被右掌支撑而非重新接封。",
      "sourceLocator": "CD-E52 / 实际回答 / 手部细节版-S3 / 对应正文时间窗口"
    },
    {
      "role": "cinematography",
      "shotId": "手部细节版-S3",
      "status": "pass",
      "criterion": "机位、覆盖、焦点与光源服务所需可见事实。",
      "observation": "回同一首镜双人中全景，南窗和北墙光色一致。",
      "sourceLocator": "CD-E52 / 实际回答 / 手部细节版-S3 / 对应正文时间窗口"
    },
    {
      "role": "prompt",
      "shotId": "手部细节版-S3",
      "status": "pass",
      "criterion": "完整文字初态、过程、终态、声音与用户锁定项没有互相矛盾。",
      "observation": "四秒全文与另一版一致，无对白开封或新增结果。",
      "sourceLocator": "CD-E52 / 实际回答 / 手部细节版-S3 / 对应正文时间窗口"
    },
    {
      "role": "continuity",
      "shotId": "手部细节版-S3",
      "status": "pass",
      "criterion": "入出状态、身份、道具、方向与相邻时间关系闭合。",
      "observation": "入态乙左手独持甲已释放，终态乙双手持封，切点均事件继续。",
      "sourceLocator": "CD-E52 / 实际回答 / 手部细节版-S3 / 对应正文时间窗口"
    }
  ]
}
```

### 随包逐镜工具原始v1结果（修订前）

实际命令：`node skills/cineweave-director/scripts/check-shot-review.mjs <系统临时目录>/CD-E52.json`。
实际退出码：0。stdout原样保留如下；stderr为空。

```json
{
  "valid": true,
  "scope": "plan_only",
  "coverageComplete": true,
  "reviewComplete": true,
  "expectedRows": 36,
  "missing": [],
  "openItems": [],
  "prompt": null,
  "errors": [],
  "limitation": "仅检查工作表一致性，不核验引用内容、艺术质量、媒体、权利、批准或实际执行。",
  "localization": {
    "locale": "zh-CN",
    "summary": "规划评审已完成；实际媒体仍未核验。"
  }
}
```


### 手工空间复查与最终v2工作表

明确身体朝南、柜台在身后，使南侧摄影机能够看见双方的脸；两版首尾镜的替换完全相同。

仅修改以上文字变量，其余表演、接触、声音与硬锁保持。已复查本镜及相邻镜的方向、出入状态；源版本递增为2，以下为针对上方最终全文实际重跑的输入。

```json
{
  "source": {
    "type": "prompt",
    "id": "CD-E52-director-run-a",
    "version": 2
  },
  "mode": "full",
  "shotIds": [
    "共同画面版-S1",
    "共同画面版-S2",
    "共同画面版-S3",
    "手部细节版-S1",
    "手部细节版-S2",
    "手部细节版-S3"
  ],
  "reviews": [
    {
      "role": "direction",
      "shotId": "共同画面版-S1",
      "status": "pass",
      "criterion": "信息、目的与关系变化符合本次原请求。",
      "observation": "建立同侧柜台、信封归甲、唯一台词与尚未交接的等待。",
      "sourceLocator": "CD-E52 / 实际回答 / 共同画面版-S1 / 对应正文时间窗口"
    },
    {
      "role": "performance",
      "shotId": "共同画面版-S1",
      "status": "pass",
      "criterion": "人物取得具体触发后才改变行为，动作在当前窗口可读。",
      "observation": "甲0.6—1.8秒说先还给你，乙只听，2.0秒甲才送封，乙未伸手。",
      "sourceLocator": "CD-E52 / 实际回答 / 共同画面版-S1 / 对应正文时间窗口"
    },
    {
      "role": "staging",
      "shotId": "共同画面版-S1",
      "status": "pass",
      "criterion": "位置、路径和关键接触可达，遮挡不删除必要事实。",
      "observation": "双方同在柜台南侧甲西乙东；甲右手持西边，交接点共同可达。",
      "sourceLocator": "CD-E52 / 实际回答 / 共同画面版-S1 / 对应正文时间窗口"
    },
    {
      "role": "cinematography",
      "shotId": "共同画面版-S1",
      "status": "pass",
      "criterion": "机位、覆盖、焦点与光源服务所需可见事实。",
      "observation": "南侧固定双人中全景保护面部、手、台缘与信封，南窗光可读。 两人身体朝南、柜台在背后，南侧机位可见脸。",
      "sourceLocator": "CD-E52 / 实际回答 / 共同画面版-S1 / 对应正文时间窗口"
    },
    {
      "role": "prompt",
      "shotId": "共同画面版-S1",
      "status": "pass",
      "criterion": "完整文字初态、过程、终态、声音与用户锁定项没有互相矛盾。",
      "observation": "完整三秒初态、准确唯一台词、水平送封和甲仍持有的终态。",
      "sourceLocator": "CD-E52 / 实际回答 / 共同画面版-S1 / 对应正文时间窗口"
    },
    {
      "role": "continuity",
      "shotId": "共同画面版-S1",
      "status": "pass",
      "criterion": "入出状态、身份、道具、方向与相邻时间关系闭合。",
      "observation": "3.0秒封停两人之间且乙未伸手，对应共同画面S2入态。",
      "sourceLocator": "CD-E52 / 实际回答 / 共同画面版-S1 / 对应正文时间窗口"
    },
    {
      "role": "direction",
      "shotId": "共同画面版-S2",
      "status": "pass",
      "criterion": "信息、目的与关系变化符合本次原请求。",
      "observation": "双人共同画面保留同时关系，5.2秒乙握稳先于5.7秒甲释放。",
      "sourceLocator": "CD-E52 / 实际回答 / 共同画面版-S2 / 对应正文时间窗口"
    },
    {
      "role": "performance",
      "shotId": "共同画面版-S2",
      "status": "pass",
      "criterion": "人物取得具体触发后才改变行为，动作在当前窗口可读。",
      "observation": "4.5秒乙先对夹到5.2秒稳住，甲5.7秒才松手，视线落封且不加新表演。",
      "sourceLocator": "CD-E52 / 实际回答 / 共同画面版-S2 / 对应正文时间窗口"
    },
    {
      "role": "staging",
      "shotId": "共同画面版-S2",
      "status": "pass",
      "criterion": "位置、路径和关键接触可达，遮挡不删除必要事实。",
      "observation": "甲持西端乙左手持东端都在画内，先共同持有后乙独持。",
      "sourceLocator": "CD-E52 / 实际回答 / 共同画面版-S2 / 对应正文时间窗口"
    },
    {
      "role": "cinematography",
      "shotId": "共同画面版-S2",
      "status": "pass",
      "criterion": "机位、覆盖、焦点与光源服务所需可见事实。",
      "observation": "同侧固定双人中景保护两脸和纸边，不越轴不换光色。",
      "sourceLocator": "CD-E52 / 实际回答 / 共同画面版-S2 / 对应正文时间窗口"
    },
    {
      "role": "prompt",
      "shotId": "共同画面版-S2",
      "status": "pass",
      "criterion": "完整文字初态、过程、终态、声音与用户锁定项没有互相矛盾。",
      "observation": "五秒写伸手、握稳、松手和收封，首镜台词说完不重说。",
      "sourceLocator": "CD-E52 / 实际回答 / 共同画面版-S2 / 对应正文时间窗口"
    },
    {
      "role": "continuity",
      "shotId": "共同画面版-S2",
      "status": "pass",
      "criterion": "入出状态、身份、道具、方向与相邻时间关系闭合。",
      "observation": "8.0秒乙左手收封腰前五厘米、右手垂下，甲右手回腰侧，对应S3。",
      "sourceLocator": "CD-E52 / 实际回答 / 共同画面版-S2 / 对应正文时间窗口"
    },
    {
      "role": "direction",
      "shotId": "共同画面版-S3",
      "status": "pass",
      "criterion": "信息、目的与关系变化符合本次原请求。",
      "observation": "确认乙双手持封的交还结果，不开封或新增事件。",
      "sourceLocator": "CD-E52 / 实际回答 / 共同画面版-S3 / 对应正文时间窗口"
    },
    {
      "role": "performance",
      "shotId": "共同画面版-S3",
      "status": "pass",
      "criterion": "人物取得具体触发后才改变行为，动作在当前窗口可读。",
      "observation": "8.3—9.1秒乙才右掌托底、左手原握保留，抬眼回应无新对白。",
      "sourceLocator": "CD-E52 / 实际回答 / 共同画面版-S3 / 对应正文时间窗口"
    },
    {
      "role": "staging",
      "shotId": "共同画面版-S3",
      "status": "pass",
      "criterion": "位置、路径和关键接触可达，遮挡不删除必要事实。",
      "observation": "同侧原站位，甲不再接封，乙右掌从垂下到托底可达。",
      "sourceLocator": "CD-E52 / 实际回答 / 共同画面版-S3 / 对应正文时间窗口"
    },
    {
      "role": "cinematography",
      "shotId": "共同画面版-S3",
      "status": "pass",
      "criterion": "机位、覆盖、焦点与光源服务所需可见事实。",
      "observation": "回首镜相同机位，南窗和北墙反射、固有色保持。",
      "sourceLocator": "CD-E52 / 实际回答 / 共同画面版-S3 / 对应正文时间窗口"
    },
    {
      "role": "prompt",
      "shotId": "共同画面版-S3",
      "status": "pass",
      "criterion": "完整文字初态、过程、终态、声音与用户锁定项没有互相矛盾。",
      "observation": "四秒全文从乙左手独持至双手稳持，声音只有底声与纸面摩擦。",
      "sourceLocator": "CD-E52 / 实际回答 / 共同画面版-S3 / 对应正文时间窗口"
    },
    {
      "role": "continuity",
      "shotId": "共同画面版-S3",
      "status": "pass",
      "criterion": "入出状态、身份、道具、方向与相邻时间关系闭合。",
      "observation": "切入继续上一镜，不重新交接；12.0秒信封稳定归乙、封口不变。",
      "sourceLocator": "CD-E52 / 实际回答 / 共同画面版-S3 / 对应正文时间窗口"
    },
    {
      "role": "direction",
      "shotId": "手部细节版-S1",
      "status": "pass",
      "criterion": "信息、目的与关系变化符合本次原请求。",
      "observation": "首镜正文逐字复用共同画面版S1，同样建立同侧空间和唯一台词。",
      "sourceLocator": "CD-E52 / 实际回答 / 手部细节版-S1 / 对应正文时间窗口"
    },
    {
      "role": "performance",
      "shotId": "手部细节版-S1",
      "status": "pass",
      "criterion": "人物取得具体触发后才改变行为，动作在当前窗口可读。",
      "observation": "相同0.6—1.8秒甲说话、2.0—3.0秒送封，乙不提前伸手。",
      "sourceLocator": "CD-E52 / 实际回答 / 手部细节版-S1 / 对应正文时间窗口"
    },
    {
      "role": "staging",
      "shotId": "手部细节版-S1",
      "status": "pass",
      "criterion": "位置、路径和关键接触可达，遮挡不删除必要事实。",
      "observation": "相同甲西乙东、柜台南侧、甲右手持西端、乙左手未伸出。",
      "sourceLocator": "CD-E52 / 实际回答 / 手部细节版-S1 / 对应正文时间窗口"
    },
    {
      "role": "cinematography",
      "shotId": "手部细节版-S1",
      "status": "pass",
      "criterion": "机位、覆盖、焦点与光源服务所需可见事实。",
      "observation": "相同固定中全景、南窗光与景深职责，没有另换起始覆盖。 两人身体朝南、柜台在背后，南侧机位可见脸。",
      "sourceLocator": "CD-E52 / 实际回答 / 手部细节版-S1 / 对应正文时间窗口"
    },
    {
      "role": "prompt",
      "shotId": "手部细节版-S1",
      "status": "pass",
      "criterion": "完整文字初态、过程、终态、声音与用户锁定项没有互相矛盾。",
      "observation": "三秒全文与另一版一致，未用参见替代。",
      "sourceLocator": "CD-E52 / 实际回答 / 手部细节版-S1 / 对应正文时间窗口"
    },
    {
      "role": "continuity",
      "shotId": "手部细节版-S1",
      "status": "pass",
      "criterion": "入出状态、身份、道具、方向与相邻时间关系闭合。",
      "observation": "3.0秒封停两人间、甲仍持有，接入手部S2同一表演入态。",
      "sourceLocator": "CD-E52 / 实际回答 / 手部细节版-S1 / 对应正文时间窗口"
    },
    {
      "role": "direction",
      "shotId": "手部细节版-S2",
      "status": "pass",
      "criterion": "信息、目的与关系变化符合本次原请求。",
      "observation": "仅把接触事实放大，代价为失去面部可见性，结果与表演不改。",
      "sourceLocator": "CD-E52 / 实际回答 / 手部细节版-S2 / 对应正文时间窗口"
    },
    {
      "role": "performance",
      "shotId": "手部细节版-S2",
      "status": "pass",
      "criterion": "人物取得具体触发后才改变行为，动作在当前窗口可读。",
      "observation": "相同4.5—5.2秒乙握稳、5.7秒甲松手、6.5—8.0秒乙收封。",
      "sourceLocator": "CD-E52 / 实际回答 / 手部细节版-S2 / 对应正文时间窗口"
    },
    {
      "role": "staging",
      "shotId": "手部细节版-S2",
      "status": "pass",
      "criterion": "位置、路径和关键接触可达，遮挡不删除必要事实。",
      "observation": "甲左袖乙右袖、台缘和完整信封锚定位置，保留甲释放指尖及乙收手空间。",
      "sourceLocator": "CD-E52 / 实际回答 / 手部细节版-S2 / 对应正文时间窗口"
    },
    {
      "role": "cinematography",
      "shotId": "手部细节版-S2",
      "status": "pass",
      "criterion": "机位、覆盖、焦点与光源服务所需可见事实。",
      "observation": "仍南侧机位，略俯手部近景，景深保护两接触，不换调色拟音距离。",
      "sourceLocator": "CD-E52 / 实际回答 / 手部细节版-S2 / 对应正文时间窗口"
    },
    {
      "role": "prompt",
      "shotId": "手部细节版-S2",
      "status": "pass",
      "criterion": "完整文字初态、过程、终态、声音与用户锁定项没有互相矛盾。",
      "observation": "同样五秒动作和无新增对白；面部取景外如实注明，未宣称看清脸部。",
      "sourceLocator": "CD-E52 / 实际回答 / 手部细节版-S2 / 对应正文时间窗口"
    },
    {
      "role": "continuity",
      "shotId": "手部细节版-S2",
      "status": "pass",
      "criterion": "入出状态、身份、道具、方向与相邻时间关系闭合。",
      "observation": "8.0秒握持手、水平位置、甲已收手与另一版S2及本版S3一致。",
      "sourceLocator": "CD-E52 / 实际回答 / 手部细节版-S2 / 对应正文时间窗口"
    },
    {
      "role": "direction",
      "shotId": "手部细节版-S3",
      "status": "pass",
      "criterion": "信息、目的与关系变化符合本次原请求。",
      "observation": "尾镜正文逐字复用共同画面版S3，相同交还结果。",
      "sourceLocator": "CD-E52 / 实际回答 / 手部细节版-S3 / 对应正文时间窗口"
    },
    {
      "role": "performance",
      "shotId": "手部细节版-S3",
      "status": "pass",
      "criterion": "人物取得具体触发后才改变行为，动作在当前窗口可读。",
      "observation": "相同8.3—9.1秒右掌托底和9.1—10.2秒抬眼，无新增动作。",
      "sourceLocator": "CD-E52 / 实际回答 / 手部细节版-S3 / 对应正文时间窗口"
    },
    {
      "role": "staging",
      "shotId": "手部细节版-S3",
      "status": "pass",
      "criterion": "位置、路径和关键接触可达，遮挡不删除必要事实。",
      "observation": "同一南侧原站位，乙左手原握被右掌支撑而非重新接封。",
      "sourceLocator": "CD-E52 / 实际回答 / 手部细节版-S3 / 对应正文时间窗口"
    },
    {
      "role": "cinematography",
      "shotId": "手部细节版-S3",
      "status": "pass",
      "criterion": "机位、覆盖、焦点与光源服务所需可见事实。",
      "observation": "回同一首镜双人中全景，南窗和北墙光色一致。",
      "sourceLocator": "CD-E52 / 实际回答 / 手部细节版-S3 / 对应正文时间窗口"
    },
    {
      "role": "prompt",
      "shotId": "手部细节版-S3",
      "status": "pass",
      "criterion": "完整文字初态、过程、终态、声音与用户锁定项没有互相矛盾。",
      "observation": "四秒全文与另一版一致，无对白开封或新增结果。",
      "sourceLocator": "CD-E52 / 实际回答 / 手部细节版-S3 / 对应正文时间窗口"
    },
    {
      "role": "continuity",
      "shotId": "手部细节版-S3",
      "status": "pass",
      "criterion": "入出状态、身份、道具、方向与相邻时间关系闭合。",
      "observation": "入态乙左手独持甲已释放，终态乙双手持封，切点均事件继续。",
      "sourceLocator": "CD-E52 / 实际回答 / 手部细节版-S3 / 对应正文时间窗口"
    }
  ]
}
```

### 最终v2工具原始结果

实际命令：`node skills/cineweave-director/scripts/check-shot-review.mjs <系统临时目录>/CD-E52.json`。实际退出码0，stderr为空。stdout原样保留：

```json
{
  "valid": true,
  "scope": "plan_only",
  "coverageComplete": true,
  "reviewComplete": true,
  "expectedRows": 36,
  "missing": [],
  "openItems": [],
  "prompt": null,
  "errors": [],
  "limitation": "仅检查工作表一致性，不核验引用内容、艺术质量、媒体、权利、批准或实际执行。",
  "localization": {
    "locale": "zh-CN",
    "summary": "规划评审已完成；实际媒体仍未核验。"
  }
}
```

## CD-E53

### 原请求

```text
十秒逃离暴雨的三镜片段：摄影机主要陪着两人找屋檐；中镜可暂时离开同行视点，只解释前方唯一通路被落枝挡住，随后回到同行，不增受伤或新人物。给逐镜稿和这次视点例外的理由。
```

### 实际回答

当前全文版本：v2。空间措辞经手工复查后修订，修订记录与v2原始工具结果附在本项末尾。

暂定 16:9、自然写实。两人是普通成年同行者，找近处现有屋檐避雨。三镜合计十秒，故事连续经过十秒。唯一通路是店墙与路边栏杆之间的步行带；低矮落枝可以跨过，但不能从两侧绕出另一路。落枝已在地上，不拍落下的瞬间。

#### S1｜0.0—4.0 秒｜同行寻找

```text
白天暴雨，横向16:9。东西向人行道北侧是连续店墙，南侧是路边金属栏杆，两者之间只有一条约一米四宽的通路；东面五米外，同一店面的屋檐伸出，檐下有干湿分明的短段地面。雨水斜落，灰天漫射日光照亮湿墙、积水与衣料，保持低饱和蓝灰和土褐，水面高光不遮住脚下。没有新人物、车辆或另一个避雨入口。
甲是约三十五岁的成年男性，瘦长脸、短黑发、穿土褐哑光外套和深灰长裤；乙是约三十岁的成年女性，圆脸、黑发低束，穿蓝灰棉质外套和黑色长裤。两人无伞、无手持物，服装已经淋湿，脸和手保留自然纹理；面部紧而专注，不哭喊，不夸张喘息。甲在前、乙落后半步，朝东方寻找屋檐，视线轮流确认脚下与前方干处。
摄影机在南侧栏杆外的街侧，斜向东北，以腰高双人中全景平移陪着两人向东走，画面运动主要从左向右。取景保留两人的头、手、脚及前方屋檐位置，不转成任何一人的字面第一视角，身体间距与共同去向可读。甲0.0至3.2秒快步前进，乙保持半步间距跟上，手臂自然控制平衡，不互相拖拽。3.2秒甲看见通路前方有障碍而缩短最后一步，乙见甲减速也放慢；两人在落枝西侧停下，鞋尖尚未碰枝。屋檐仍在障碍东侧。摄影机随这次制动减慢，没有抢先越过两人或把障碍拍成另一个地点。
环境声音以近处暴雨和鞋底踩水为主，无对白、旁白或配乐。出点两人都在落枝西侧，甲在前、乙在后半步，仍看向前方，身体无受伤、摔倒或新增湿度重置；下一镜只解释刚被看见的这一个阻碍。
```

#### S2｜4.0—6.0 秒｜有限的地理插入

```text
同一条白天暴雨中的人行道，横向16:9。摄影机暂时离开同行覆盖，固定在南侧栏杆外、靠近落枝的低位斜向东北拍摄，仍在东西行进轴线的南侧。只拍落枝、通路两边和前方屋檐的下沿，不拍任何新人物。北侧店墙与南侧栏杆共同夹住唯一的步行带，一根已落地的枝干横贯通路，枝叶占住两侧，主干约二十厘米高；两侧没有可绕行缺口，屋檐的干地面在它东侧约一米处。枝干只是低矮路障，并非封闭的高墙。
本镜采用全场4.0至6.0秒，实时两秒。第一刻障碍、墙、栏杆和屋檐干湿线已经同框，连续看清唯一通路为什么被挡，以及阻碍之后就是屋檐，不增加枝条落下或别处的危险。落枝始终静置，雨水在枝皮与叶面流下；摄影机不推入神秘细节，不揭露隐藏者、不切换到第二条路。两位同行者此时仍在西侧短暂停步，处于取景外，不在这两秒内跨过障碍。
沿用灰天漫射日光、蓝灰与土褐的低饱和视觉基线，枝皮、湿地和檐下干地可辨，不加局部戏剧聚光。声音仍保留同行距离的连续暴雨与短暂停步后的轻弱衣料声，不放大枝条声音，不插入雷击或警报。出点落枝和路径状态不变；下一镜回到两人刚才的西侧站位，继续当前时间。
```

#### S3｜6.0—10.0 秒｜回到同行、进入屋檐

```text
回到同一白天暴雨人行道，横向16:9。摄影机恢复第一镜在南侧栏杆外的腰高双人中全景与平移方向，斜向东北；北侧店墙、南侧栏杆、横贯通路的低枝和东面近处屋檐位置一致。甲约三十五岁，瘦长脸、短黑发、土褐外套、深灰长裤；乙约三十岁，圆脸、低束黑发、蓝灰外套、黑色长裤。服装与发丝仍湿，保持前镜身份、湿痕和自然纹理，不在檐下立即变干。
采用全场6.0至10.0秒，实时四秒。入镜甲在落枝西侧，乙仍在甲后半步，鞋尚未触枝，两人都是刚才停步后向前看的状态。6.0至6.6秒甲低头确认脚下低矮的主干，乙看甲准备跨出的脚，等待前方位置腾出。6.6至7.3秒甲抬右脚跨过约二十厘米高的枝干，落在东侧现有通路地面，随后左脚跟过，重心由前脚接稳；手臂小幅张开维持平衡，不跳跃、不踩动树枝。7.3至8.2秒乙在同一位置依次跨过，甲保持向东走并留出距离，乙落脚后继续跟上，枝干留在两人身后。没有侧向绕路、受伤或互换站位。
8.2至9.3秒摄影机继续陪着两人向东走短短一段，甲先、乙后进入同一屋檐下；9.3至10.0秒两人收住步伐，肩膀略放松，甲看檐外雨幕，乙仍看脚下干湿交界。甲在画面右、乙在其左后方，不回头演新事件。雨仍在檐外猛烈落下，檐下只见两人衣角滴水，脸、土褐衣料与蓝灰衣料保留同样的中性低饱和光色，阴影改变仅来自进入真实屋檐遮挡。
声音的暴雨连续跨两个切点；进入屋檐后，直打头肩的雨声自然减弱，檐外雨与滴水仍可闻，跨枝时的脚步按落脚同步。无对白、旁白、配乐或惊吓音。出点两人已在屋檐下站稳，落枝仍在来路上，结束于这次避雨得到的短暂遮蔽。
```

S1→S2 与 S2→S3 都是同一事件的连续时间；中镜占据两人停步检查的两秒，没有暗中省略跨枝。摄影机主要陪同行者移动，中镜的例外只为给观众看清“此路唯一、低枝横挡、屋檐就在其后”这组地理关系，避免回到同行画面时把跨枝误读成换路。它不是任何人物的严格光学 POV，不提供受害者、险情或另一位置的信息。两秒后回到原有机位侧和人物站位，人物的任务仍是去同一个屋檐。

### 实际读取文件与整文件 SHA256

以下记录写稿前实际加载的全部本地文本上下文及检查器运行依赖；祖先目录检查未发现 AGENTS.md。未读取所禁来源。

| 相对路径 | SHA256 |
| --- | --- |
| `skills/cineweave-director/SKILL.md` | `6d83c553b4a1ccedd55a84a06df5582739c0bc258c50de85e998cc7e61224524` |
| `skills/cineweave-director/references/optional/ensemble-direction-and-review.md` | `a3f41e181a4382ed4a23835c696797837fac9cfc939fc3f86203443cab680bae` |
| `skills/cineweave-director/references/optional/prompt-detail-standard.md` | `0de944dffd30d69bc05a52ef4bceaf0a90dce40564e2f1a288c68e7dd1e88e59` |
| `skills/cineweave-director/references/optional/shot-design-workbench.md` | `b2e182a4907a235d0044b500d70d57fdde3b6ec9a7c9a99546583907632543c2` |
| `skills/cineweave-director/references/routes/shot-direction.md` | `8ac6fd68d2f3c51d66a6dbbdd7a60d3604721497f3717a54ce08b15f49e2c82f` |
| `skills/cineweave-director/references/routes/storyboard-rhythm.md` | `f71bf9c0aadea9a05d24043e76e3241f3594aa3dcc681b078537c8b5c76af9fd` |
| `skills/cineweave-director/references/optional/video-sound-and-delivery.md` | `4a60146d81fc2092fb7bb6e18d9b1cd4e8ac8cdf09b11994f5a98b86fab2a715` |
| `skills/cineweave-director/references/optional/editing-sound-craft.md` | `184f2fc8e8d638aab40b294d266badecc6ee37c99e1d097c8e3ec847e45a4da4` |
| `skills/cineweave-director/references/optional/directing-craft.md` | `82524260f2823fe2d779e367a8a17802c050368c29d8e084cea1b741dd1bcf03` |
| `skills/cineweave-director/references/optional/video-performance-direction.md` | `561ef041a31693d8607e16eed361597ab258a519709855d3e85ec1154969088d` |
| `skills/cineweave-director/references/optional/video-timing-and-handles.md` | `d687fb586e766bd670598fae00813f2d80ad1fc522dda39ee0311e21ee2afee5` |
| `skills/cineweave-director/scripts/check-shot-review.mjs` | `bb69f60d8794f3329bc4b7af772d05ad01a28c001c7345f1de63bfa1e3d7d1c2` |
| `skills/cineweave-director/scripts/parse-json.mjs` | `9c15621d8304bf6114cc4cb322409c8e59433409ac17950311725cdcbebecf11` |

### 实际逐镜评审工作表（原始v1输入，修订前）

本表是非规范临时工作表，source版本1。完整六视角覆盖本项所有实际镜头；pass仅是对应文字事实的规划结论。

```json
{
  "source": {
    "type": "prompt",
    "id": "CD-E53-director-run-a",
    "version": 1
  },
  "mode": "full",
  "shotIds": [
    "S1",
    "S2",
    "S3"
  ],
  "reviews": [
    {
      "role": "direction",
      "shotId": "S1",
      "status": "pass",
      "criterion": "信息、目的与关系变化符合本次原请求。",
      "observation": "陪两人去东面屋檐，末段停在原路障碍西侧，为中镜解释留入口。",
      "sourceLocator": "CD-E53 / 实际回答 / S1 / 对应正文时间窗口"
    },
    {
      "role": "performance",
      "shotId": "S1",
      "status": "pass",
      "criterion": "人物取得具体触发后才改变行为，动作在当前窗口可读。",
      "observation": "甲3.2秒见障碍才制动，乙接收甲减速再停，两人未预演险情。",
      "sourceLocator": "CD-E53 / 实际回答 / S1 / 对应正文时间窗口"
    },
    {
      "role": "staging",
      "shotId": "S1",
      "status": "pass",
      "criterion": "位置、路径和关键接触可达，遮挡不删除必要事实。",
      "observation": "北墙南栏杆界定唯一路，甲前乙后半步，鞋未碰枝无新增人。",
      "sourceLocator": "CD-E53 / 实际回答 / S1 / 对应正文时间窗口"
    },
    {
      "role": "cinematography",
      "shotId": "S1",
      "status": "pass",
      "criterion": "机位、覆盖、焦点与光源服务所需可见事实。",
      "observation": "街侧南方腰高陪行保留头脚与屋檐，没有抢先越过人物。",
      "sourceLocator": "CD-E53 / 实际回答 / S1 / 对应正文时间窗口"
    },
    {
      "role": "prompt",
      "shotId": "S1",
      "status": "pass",
      "criterion": "完整文字初态、过程、终态、声音与用户锁定项没有互相矛盾。",
      "observation": "四秒入态、快步、制动和未碰枝出态，雨声连续无对白配乐。",
      "sourceLocator": "CD-E53 / 实际回答 / S1 / 对应正文时间窗口"
    },
    {
      "role": "continuity",
      "shotId": "S1",
      "status": "pass",
      "criterion": "入出状态、身份、道具、方向与相邻时间关系闭合。",
      "observation": "4.0秒二人在枝西侧甲前乙后，接中镜画外停步与S3原站位。",
      "sourceLocator": "CD-E53 / 实际回答 / S1 / 对应正文时间窗口"
    },
    {
      "role": "direction",
      "shotId": "S2",
      "status": "pass",
      "criterion": "信息、目的与关系变化符合本次原请求。",
      "observation": "仅解释唯一路被约二十厘米低枝挡住、屋檐在其后，不泄露新危险。",
      "sourceLocator": "CD-E53 / 实际回答 / S2 / 对应正文时间窗口"
    },
    {
      "role": "performance",
      "shotId": "S2",
      "status": "pass",
      "criterion": "人物取得具体触发后才改变行为，动作在当前窗口可读。",
      "observation": "两人画外继续西侧停步两秒，没有提前跨枝。",
      "sourceLocator": "CD-E53 / 实际回答 / S2 / 对应正文时间窗口"
    },
    {
      "role": "staging",
      "shotId": "S2",
      "status": "pass",
      "criterion": "位置、路径和关键接触可达，遮挡不删除必要事实。",
      "observation": "墙栏杆同框、两侧无绕路，低枝可跨，干湿线属于已有屋檐。",
      "sourceLocator": "CD-E53 / 实际回答 / S2 / 对应正文时间窗口"
    },
    {
      "role": "cinematography",
      "shotId": "S2",
      "status": "pass",
      "criterion": "机位、覆盖、焦点与光源服务所需可见事实。",
      "observation": "南侧低位固定插入仍同轴线侧，雨光声音沿用，没有转严格POV。",
      "sourceLocator": "CD-E53 / 实际回答 / S2 / 对应正文时间窗口"
    },
    {
      "role": "prompt",
      "shotId": "S2",
      "status": "pass",
      "criterion": "完整文字初态、过程、终态、声音与用户锁定项没有互相矛盾。",
      "observation": "两秒只写路障几何雨水静置，不拍枝落下、隐藏者或第二条路。",
      "sourceLocator": "CD-E53 / 实际回答 / S2 / 对应正文时间窗口"
    },
    {
      "role": "continuity",
      "shotId": "S2",
      "status": "pass",
      "criterion": "入出状态、身份、道具、方向与相邻时间关系闭合。",
      "observation": "4.0—6.0秒连续停步，枝不动二人仍西侧，回同行未省略跨枝。",
      "sourceLocator": "CD-E53 / 实际回答 / S2 / 对应正文时间窗口"
    },
    {
      "role": "direction",
      "shotId": "S3",
      "status": "pass",
      "criterion": "信息、目的与关系变化符合本次原请求。",
      "observation": "6.0秒恢复同行，沿原路跨枝进入同一屋檐完成避雨。",
      "sourceLocator": "CD-E53 / 实际回答 / S3 / 对应正文时间窗口"
    },
    {
      "role": "performance",
      "shotId": "S3",
      "status": "pass",
      "criterion": "人物取得具体触发后才改变行为，动作在当前窗口可读。",
      "observation": "甲先确认再跨，乙等位置腾出才跟；入檐才松肩，无受伤。",
      "sourceLocator": "CD-E53 / 实际回答 / S3 / 对应正文时间窗口"
    },
    {
      "role": "staging",
      "shotId": "S3",
      "status": "pass",
      "criterion": "位置、路径和关键接触可达，遮挡不删除必要事实。",
      "observation": "原西侧入镜、同点依次跨枝，枝不动，无侧绕或互撞。",
      "sourceLocator": "CD-E53 / 实际回答 / S3 / 对应正文时间窗口"
    },
    {
      "role": "cinematography",
      "shotId": "S3",
      "status": "pass",
      "criterion": "机位、覆盖、焦点与光源服务所需可见事实。",
      "observation": "恢复南侧腰高及向东平移，脚落地可读，阴影来自屋檐。",
      "sourceLocator": "CD-E53 / 实际回答 / S3 / 对应正文时间窗口"
    },
    {
      "role": "prompt",
      "shotId": "S3",
      "status": "pass",
      "criterion": "完整文字初态、过程、终态、声音与用户锁定项没有互相矛盾。",
      "observation": "四秒写停步态、跨枝承重、入檐站稳；雨声随遮蔽减弱。",
      "sourceLocator": "CD-E53 / 实际回答 / S3 / 对应正文时间窗口"
    },
    {
      "role": "continuity",
      "shotId": "S3",
      "status": "pass",
      "criterion": "入出状态、身份、道具、方向与相邻时间关系闭合。",
      "observation": "10.0秒两人在檐下枝留来路，湿衣身份光色沿用，入镜为继续。",
      "sourceLocator": "CD-E53 / 实际回答 / S3 / 对应正文时间窗口"
    }
  ]
}
```

### 随包逐镜工具原始v1结果（修订前）

实际命令：`node skills/cineweave-director/scripts/check-shot-review.mjs <系统临时目录>/CD-E53.json`。
实际退出码：0。stdout原样保留如下；stderr为空。

```json
{
  "valid": true,
  "scope": "plan_only",
  "coverageComplete": true,
  "reviewComplete": true,
  "expectedRows": 18,
  "missing": [],
  "openItems": [],
  "prompt": null,
  "errors": [],
  "limitation": "仅检查工作表一致性，不核验引用内容、艺术质量、媒体、权利、批准或实际执行。",
  "localization": {
    "locale": "zh-CN",
    "summary": "规划评审已完成；实际媒体仍未核验。"
  }
}
```


### 手工空间复查与最终v2工作表

将本次暂定屋檐起始距离从三米改为五米，让首镜快步约四米到落枝、屋檐在枝后一米的地理与时间一致。

仅修改以上文字变量，其余表演、接触、声音与硬锁保持。已复查本镜及相邻镜的方向、出入状态；源版本递增为2，以下为针对上方最终全文实际重跑的输入。

```json
{
  "source": {
    "type": "prompt",
    "id": "CD-E53-director-run-a",
    "version": 2
  },
  "mode": "full",
  "shotIds": [
    "S1",
    "S2",
    "S3"
  ],
  "reviews": [
    {
      "role": "direction",
      "shotId": "S1",
      "status": "pass",
      "criterion": "信息、目的与关系变化符合本次原请求。",
      "observation": "陪两人去东面屋檐，末段停在原路障碍西侧，为中镜解释留入口。",
      "sourceLocator": "CD-E53 / 实际回答 / S1 / 对应正文时间窗口"
    },
    {
      "role": "performance",
      "shotId": "S1",
      "status": "pass",
      "criterion": "人物取得具体触发后才改变行为，动作在当前窗口可读。",
      "observation": "甲3.2秒见障碍才制动，乙接收甲减速再停，两人未预演险情。",
      "sourceLocator": "CD-E53 / 实际回答 / S1 / 对应正文时间窗口"
    },
    {
      "role": "staging",
      "shotId": "S1",
      "status": "pass",
      "criterion": "位置、路径和关键接触可达，遮挡不删除必要事实。",
      "observation": "北墙南栏杆界定唯一路，甲前乙后半步，鞋未碰枝无新增人。 屋檐在起点东面五米，落枝位于檐前一米。",
      "sourceLocator": "CD-E53 / 实际回答 / S1 / 对应正文时间窗口"
    },
    {
      "role": "cinematography",
      "shotId": "S1",
      "status": "pass",
      "criterion": "机位、覆盖、焦点与光源服务所需可见事实。",
      "observation": "街侧南方腰高陪行保留头脚与屋檐，没有抢先越过人物。",
      "sourceLocator": "CD-E53 / 实际回答 / S1 / 对应正文时间窗口"
    },
    {
      "role": "prompt",
      "shotId": "S1",
      "status": "pass",
      "criterion": "完整文字初态、过程、终态、声音与用户锁定项没有互相矛盾。",
      "observation": "四秒入态、快步、制动和未碰枝出态，雨声连续无对白配乐。",
      "sourceLocator": "CD-E53 / 实际回答 / S1 / 对应正文时间窗口"
    },
    {
      "role": "continuity",
      "shotId": "S1",
      "status": "pass",
      "criterion": "入出状态、身份、道具、方向与相邻时间关系闭合。",
      "observation": "4.0秒二人在枝西侧甲前乙后，接中镜画外停步与S3原站位。",
      "sourceLocator": "CD-E53 / 实际回答 / S1 / 对应正文时间窗口"
    },
    {
      "role": "direction",
      "shotId": "S2",
      "status": "pass",
      "criterion": "信息、目的与关系变化符合本次原请求。",
      "observation": "仅解释唯一路被约二十厘米低枝挡住、屋檐在其后，不泄露新危险。",
      "sourceLocator": "CD-E53 / 实际回答 / S2 / 对应正文时间窗口"
    },
    {
      "role": "performance",
      "shotId": "S2",
      "status": "pass",
      "criterion": "人物取得具体触发后才改变行为，动作在当前窗口可读。",
      "observation": "两人画外继续西侧停步两秒，没有提前跨枝。",
      "sourceLocator": "CD-E53 / 实际回答 / S2 / 对应正文时间窗口"
    },
    {
      "role": "staging",
      "shotId": "S2",
      "status": "pass",
      "criterion": "位置、路径和关键接触可达，遮挡不删除必要事实。",
      "observation": "墙栏杆同框、两侧无绕路，低枝可跨，干湿线属于已有屋檐。",
      "sourceLocator": "CD-E53 / 实际回答 / S2 / 对应正文时间窗口"
    },
    {
      "role": "cinematography",
      "shotId": "S2",
      "status": "pass",
      "criterion": "机位、覆盖、焦点与光源服务所需可见事实。",
      "observation": "南侧低位固定插入仍同轴线侧，雨光声音沿用，没有转严格POV。",
      "sourceLocator": "CD-E53 / 实际回答 / S2 / 对应正文时间窗口"
    },
    {
      "role": "prompt",
      "shotId": "S2",
      "status": "pass",
      "criterion": "完整文字初态、过程、终态、声音与用户锁定项没有互相矛盾。",
      "observation": "两秒只写路障几何雨水静置，不拍枝落下、隐藏者或第二条路。",
      "sourceLocator": "CD-E53 / 实际回答 / S2 / 对应正文时间窗口"
    },
    {
      "role": "continuity",
      "shotId": "S2",
      "status": "pass",
      "criterion": "入出状态、身份、道具、方向与相邻时间关系闭合。",
      "observation": "4.0—6.0秒连续停步，枝不动二人仍西侧，回同行未省略跨枝。",
      "sourceLocator": "CD-E53 / 实际回答 / S2 / 对应正文时间窗口"
    },
    {
      "role": "direction",
      "shotId": "S3",
      "status": "pass",
      "criterion": "信息、目的与关系变化符合本次原请求。",
      "observation": "6.0秒恢复同行，沿原路跨枝进入同一屋檐完成避雨。",
      "sourceLocator": "CD-E53 / 实际回答 / S3 / 对应正文时间窗口"
    },
    {
      "role": "performance",
      "shotId": "S3",
      "status": "pass",
      "criterion": "人物取得具体触发后才改变行为，动作在当前窗口可读。",
      "observation": "甲先确认再跨，乙等位置腾出才跟；入檐才松肩，无受伤。",
      "sourceLocator": "CD-E53 / 实际回答 / S3 / 对应正文时间窗口"
    },
    {
      "role": "staging",
      "shotId": "S3",
      "status": "pass",
      "criterion": "位置、路径和关键接触可达，遮挡不删除必要事实。",
      "observation": "原西侧入镜、同点依次跨枝，枝不动，无侧绕或互撞。",
      "sourceLocator": "CD-E53 / 实际回答 / S3 / 对应正文时间窗口"
    },
    {
      "role": "cinematography",
      "shotId": "S3",
      "status": "pass",
      "criterion": "机位、覆盖、焦点与光源服务所需可见事实。",
      "observation": "恢复南侧腰高及向东平移，脚落地可读，阴影来自屋檐。",
      "sourceLocator": "CD-E53 / 实际回答 / S3 / 对应正文时间窗口"
    },
    {
      "role": "prompt",
      "shotId": "S3",
      "status": "pass",
      "criterion": "完整文字初态、过程、终态、声音与用户锁定项没有互相矛盾。",
      "observation": "四秒写停步态、跨枝承重、入檐站稳；雨声随遮蔽减弱。",
      "sourceLocator": "CD-E53 / 实际回答 / S3 / 对应正文时间窗口"
    },
    {
      "role": "continuity",
      "shotId": "S3",
      "status": "pass",
      "criterion": "入出状态、身份、道具、方向与相邻时间关系闭合。",
      "observation": "10.0秒两人在檐下枝留来路，湿衣身份光色沿用，入镜为继续。",
      "sourceLocator": "CD-E53 / 实际回答 / S3 / 对应正文时间窗口"
    }
  ]
}
```

### 最终v2工具原始结果

实际命令：`node skills/cineweave-director/scripts/check-shot-review.mjs <系统临时目录>/CD-E53.json`。实际退出码0，stderr为空。stdout原样保留：

```json
{
  "valid": true,
  "scope": "plan_only",
  "coverageComplete": true,
  "reviewComplete": true,
  "expectedRows": 18,
  "missing": [],
  "openItems": [],
  "prompt": null,
  "errors": [],
  "limitation": "仅检查工作表一致性，不核验引用内容、艺术质量、媒体、权利、批准或实际执行。",
  "localization": {
    "locale": "zh-CN",
    "summary": "规划评审已完成；实际媒体仍未核验。"
  }
}
```

## CD-E54

### 原请求

```text
同一饭后收杯活动出现两次，总十二秒：第一次甲乙各收自己的杯，第二次乙先离开，甲随后收起乙的杯。给两段完整视频稿，同机位、身份、桌位和光色，仅让关系回应变化可见，不加对白或回忆。
```

### 实际回答

当前全文版本：v2。空间措辞经手工复查后修订，修订记录与v2原始工具结果附在本项末尾。

暂定 16:9、自然写实。两段各六秒，总采用时长十二秒，表现前后两次独立饭后活动。第一段末尾已经完成收杯；硬切到第二次活动时，两个杯子又在各自原位。这是同类活动的再次发生，中间经过的时间未指定；不是重放、重演或人物回忆。

#### S1｜0.0—6.0 秒｜第一次，各收自己的杯

```text
白天饭后的安静餐室，横向16:9，六秒连续固定镜头。摄影机在餐桌南侧，略高于坐姿眼睛，朝北斜俯的双人中景，保留两人的头、肩、前臂、双手、完整杯子和桌面，不移动、不变焦。甲与乙坐在桌子北侧同一条边，甲在西侧、画面左，乙在东侧、画面右，固定座位间距；乙离席方向是桌子的东侧，即画面右方。浅木桌面上，甲面前一只无字奶白陶杯，杯柄朝西；乙面前一只无字深绿陶杯，杯柄朝东。两杯都空，杯底确实接触桌面。桌面中央靠南有一只空的浅灰小托盘，托盘能放下两个杯子；两只空饭盘仍在各自座位前，不移动。
甲是约三十八岁的成年女性，椭圆脸、自然平眉、短黑发侧分，穿浅灰亚麻圆领上衣；乙是约四十岁的成年男性，方圆脸、短黑发、无胡须，穿暗蓝棉衬衫。两人无发饰和装饰性彩妆，自然肤质，嘴唇轻合、眉间放松，饭后神情平静，身体由原椅子支撑。东侧高窗的中性柔光从画面右照来，经浅墙与木桌弱反射，面部、杯柄和手指可读；奶白、深绿、暗蓝、浅灰和浅木保持同一低饱和光色，不加金黄滤镜。
0.0至0.8秒，两人各看自己面前的空杯，手在桌缘。0.8至1.5秒，甲左手握住自己奶白杯的西侧杯柄，乙右手握住自己深绿杯的东侧杯柄，手指穿入柄环、拇指压在柄上，杯身不被穿过。1.5至3.0秒，甲抬杯数厘米，移到中央托盘西半边并放下；乙同时抬起自己的杯，移到托盘东半边，3.4秒放下。两人的路径在托盘两半分开，手腕不交叉，杯子不碰撞。各杯落稳后各自松开，甲左手在3.1秒回到原桌缘，乙右手在3.6秒回到原桌缘。3.6至6.0秒，两个杯子都稳放托盘、杯柄方向不变，两人仍坐在原位，视线自然回到各自桌面，不增加相互凝视或笑容。出点两人各自完成了自己杯子的收拾。
声音保持轻弱餐室底声，拿杯时有轻微袖口声，两杯落在托盘上分别有清楚但轻的陶瓷触盘声。无对白、旁白或配乐。不增加离场、争执或回忆。整个六秒里只有这次日常收杯活动。
```

#### S2｜6.0—12.0 秒｜第二次，乙离开后甲接手

```text
同一白天饭后的安静餐室，横向16:9，六秒连续固定镜头。这是另一次饭后，摄影机与第一段完全相同，仍在桌南侧、略高于坐姿眼睛、朝北斜俯，双人中景保留桌面、两人的手和乙右侧离席空间，不移动、不变焦。甲仍坐桌北侧西端、画面左，乙起初仍坐北侧东端、画面右，椅子和桌位不换。奶白空陶杯在甲面前，杯柄朝西；深绿空陶杯在乙面前，杯柄朝东；中央靠南的浅灰托盘此时又是空的，两只空饭盘仍在各自座位前。杯、盘和桌面的形态、材质与摆放继承第一段的初态，不把第一段收好的杯误当作本段起点。
甲约三十八岁，椭圆脸、自然平眉、侧分短黑发、浅灰亚麻圆领上衣；乙约四十岁，方圆脸、短黑发、无胡须、暗蓝棉衬衫。身份、服饰、无发饰与无装饰性彩妆、自然肤质与平静表情一致。东侧高窗的中性柔光仍由画面右照来，浅墙与木桌弱反射保持面部、手和杯柄可读，奶白、深绿、暗蓝、浅灰和浅木同样低饱和，不改变时间氛围或调色。
以本段局部0.0至6.0秒计时，对应全场6.0至12.0秒。0.0至0.4秒乙双脚承重、上身前倾后站起，不碰自己的深绿杯；甲仍坐着，视线短暂跟随乙起身。0.4至1.7秒乙沿桌东侧朝画面右走出，双手空着，深绿杯继续留在乙原位。甲不阻拦、不说话。0.8至3.0秒，甲与第一次相同，用左手握自己奶白杯的西侧杯柄，抬起数厘米、移到托盘西半边、放稳，3.1秒松开并收回左手，杯柄仍朝西。
3.1至3.4秒，甲看向乙空下的座位前那只未收的深绿杯，手停在桌缘，眉、嘴与肩膀保持平静；离席和留下的杯是她下一动作的可见触发。3.4至5.3秒，甲伸右手，握住深绿杯朝东的杯柄，抬离桌面数厘米，向左移到同一托盘的东半边，放稳后松开。甲从自己的固定座位伸手即可够到，没有换座、把杯拖过盘子或让杯自行滑动。5.3至6.0秒，甲收回右手，两个杯子都稳放托盘，乙座位仍空，乙仍在画外。甲留在原位，没有补笑容、眼泪或凝视空椅的戏剧表演。出点由同一托盘上的两杯和乙空位读出：这一次甲替离开的乙完成了剩余收杯。
声音保持同样的轻弱餐室底声。乙起身有轻微椅脚与衣料声，离席脚步自然向右远去；奶白杯在本段3.0秒落盘、深绿杯在5.3秒落盘，轻弱陶瓷声按接触同步。没有对白、旁白、配乐、往事声音或闪回。光色、机位、桌位和人物身份保持一致，变化仅来自乙没有收杯就离开，以及甲看见留下的杯后接手。
```

第一段给观众并列的两项自理动作，第二段保留甲收自己杯子的相同窗口，再把“乙自行收杯”改为“乙离开—甲看见留下的杯—甲补收”。不把这个行动预先解释成和解、爱情、疏离或其他未经指定的关系结论；变化由谁回应、谁承担任务来呈现。

### 实际读取文件与整文件 SHA256

以下记录写稿前实际加载的全部本地文本上下文及检查器运行依赖；祖先目录检查未发现 AGENTS.md。未读取所禁来源。

| 相对路径 | SHA256 |
| --- | --- |
| `skills/cineweave-director/SKILL.md` | `6d83c553b4a1ccedd55a84a06df5582739c0bc258c50de85e998cc7e61224524` |
| `skills/cineweave-director/references/optional/ensemble-direction-and-review.md` | `a3f41e181a4382ed4a23835c696797837fac9cfc939fc3f86203443cab680bae` |
| `skills/cineweave-director/references/optional/prompt-detail-standard.md` | `0de944dffd30d69bc05a52ef4bceaf0a90dce40564e2f1a288c68e7dd1e88e59` |
| `skills/cineweave-director/references/optional/shot-design-workbench.md` | `b2e182a4907a235d0044b500d70d57fdde3b6ec9a7c9a99546583907632543c2` |
| `skills/cineweave-director/references/routes/shot-direction.md` | `8ac6fd68d2f3c51d66a6dbbdd7a60d3604721497f3717a54ce08b15f49e2c82f` |
| `skills/cineweave-director/references/routes/storyboard-rhythm.md` | `f71bf9c0aadea9a05d24043e76e3241f3594aa3dcc681b078537c8b5c76af9fd` |
| `skills/cineweave-director/references/optional/video-sound-and-delivery.md` | `4a60146d81fc2092fb7bb6e18d9b1cd4e8ac8cdf09b11994f5a98b86fab2a715` |
| `skills/cineweave-director/references/optional/editing-sound-craft.md` | `184f2fc8e8d638aab40b294d266badecc6ee37c99e1d097c8e3ec847e45a4da4` |
| `skills/cineweave-director/references/optional/directing-craft.md` | `82524260f2823fe2d779e367a8a17802c050368c29d8e084cea1b741dd1bcf03` |
| `skills/cineweave-director/references/optional/video-performance-direction.md` | `561ef041a31693d8607e16eed361597ab258a519709855d3e85ec1154969088d` |
| `skills/cineweave-director/references/optional/video-timing-and-handles.md` | `d687fb586e766bd670598fae00813f2d80ad1fc522dda39ee0311e21ee2afee5` |
| `skills/cineweave-director/scripts/check-shot-review.mjs` | `bb69f60d8794f3329bc4b7af772d05ad01a28c001c7345f1de63bfa1e3d7d1c2` |
| `skills/cineweave-director/scripts/parse-json.mjs` | `9c15621d8304bf6114cc4cb322409c8e59433409ac17950311725cdcbebecf11` |

### 实际逐镜评审工作表（原始v1输入，修订前）

本表是非规范临时工作表，source版本1。完整六视角覆盖本项所有实际镜头；pass仅是对应文字事实的规划结论。

```json
{
  "source": {
    "type": "prompt",
    "id": "CD-E54-director-run-a",
    "version": 1
  },
  "mode": "full",
  "shotIds": [
    "S1",
    "S2"
  ],
  "reviews": [
    {
      "role": "direction",
      "shotId": "S1",
      "status": "pass",
      "criterion": "信息、目的与关系变化符合本次原请求。",
      "observation": "并列甲乙各收自己杯，结束杯在托盘二人留座，建立对照。",
      "sourceLocator": "CD-E54 / 实际回答 / S1 / 对应正文时间窗口"
    },
    {
      "role": "performance",
      "shotId": "S1",
      "status": "pass",
      "criterion": "人物取得具体触发后才改变行为，动作在当前窗口可读。",
      "observation": "各看自己杯、握柄抬杯、落稳再松手，表情平静无额外关系表演。",
      "sourceLocator": "CD-E54 / 实际回答 / S1 / 对应正文时间窗口"
    },
    {
      "role": "staging",
      "shotId": "S1",
      "status": "pass",
      "criterion": "位置、路径和关键接触可达，遮挡不删除必要事实。",
      "observation": "桌北甲西乙东，奶白西柄深绿东柄，托盘两半避免路径交叉。",
      "sourceLocator": "CD-E54 / 实际回答 / S1 / 对应正文时间窗口"
    },
    {
      "role": "cinematography",
      "shotId": "S1",
      "status": "pass",
      "criterion": "机位、覆盖、焦点与光源服务所需可见事实。",
      "observation": "桌南固定略俯中景保留脸手杯，东窗中性柔光可读。",
      "sourceLocator": "CD-E54 / 实际回答 / S1 / 对应正文时间窗口"
    },
    {
      "role": "prompt",
      "shotId": "S1",
      "status": "pass",
      "criterion": "完整文字初态、过程、终态、声音与用户锁定项没有互相矛盾。",
      "observation": "六秒初态、并行收杯、落盘声音与留座终态，无对白回忆。",
      "sourceLocator": "CD-E54 / 实际回答 / S1 / 对应正文时间窗口"
    },
    {
      "role": "continuity",
      "shotId": "S1",
      "status": "pass",
      "criterion": "入出状态、身份、道具、方向与相邻时间关系闭合。",
      "observation": "杯不自移且落稳后释放，6.0秒第一次完成，下段明确另次发生。",
      "sourceLocator": "CD-E54 / 实际回答 / S1 / 对应正文时间窗口"
    },
    {
      "role": "direction",
      "shotId": "S2",
      "status": "pass",
      "criterion": "信息、目的与关系变化符合本次原请求。",
      "observation": "乙先离开、甲自收再代收，关系变化由任务承担呈现。",
      "sourceLocator": "CD-E54 / 实际回答 / S2 / 对应正文时间窗口"
    },
    {
      "role": "performance",
      "shotId": "S2",
      "status": "pass",
      "criterion": "人物取得具体触发后才改变行为，动作在当前窗口可读。",
      "observation": "乙1.7秒前离场，甲3.1—3.4秒看未收杯后才3.4秒接手，无悲伤补戏。",
      "sourceLocator": "CD-E54 / 实际回答 / S2 / 对应正文时间窗口"
    },
    {
      "role": "staging",
      "shotId": "S2",
      "status": "pass",
      "criterion": "位置、路径和关键接触可达，遮挡不删除必要事实。",
      "observation": "甲原座位够到乙杯，乙向东离场，两杯落两半，空位清楚。",
      "sourceLocator": "CD-E54 / 实际回答 / S2 / 对应正文时间窗口"
    },
    {
      "role": "cinematography",
      "shotId": "S2",
      "status": "pass",
      "criterion": "机位、覆盖、焦点与光源服务所需可见事实。",
      "observation": "同桌南固定机位、身份、东窗光和固有色，原取景保留离席空间。",
      "sourceLocator": "CD-E54 / 实际回答 / S2 / 对应正文时间窗口"
    },
    {
      "role": "prompt",
      "shotId": "S2",
      "status": "pass",
      "criterion": "完整文字初态、过程、终态、声音与用户锁定项没有互相矛盾。",
      "observation": "六秒另次活动初态、离开、自收代收齐全，无对白闪回新事件。",
      "sourceLocator": "CD-E54 / 实际回答 / S2 / 对应正文时间窗口"
    },
    {
      "role": "continuity",
      "shotId": "S2",
      "status": "pass",
      "criterion": "入出状态、身份、道具、方向与相邻时间关系闭合。",
      "observation": "两段并非同次接续；硬切杯复原表现再次发生，本段终态两杯落盘乙画外。",
      "sourceLocator": "CD-E54 / 实际回答 / S2 / 对应正文时间窗口"
    }
  ]
}
```

### 随包逐镜工具原始v1结果（修订前）

实际命令：`node skills/cineweave-director/scripts/check-shot-review.mjs <系统临时目录>/CD-E54.json`。
实际退出码：0。stdout原样保留如下；stderr为空。

```json
{
  "valid": true,
  "scope": "plan_only",
  "coverageComplete": true,
  "reviewComplete": true,
  "expectedRows": 12,
  "missing": [],
  "openItems": [],
  "prompt": null,
  "errors": [],
  "limitation": "仅检查工作表一致性，不核验引用内容、艺术质量、媒体、权利、批准或实际执行。",
  "localization": {
    "locale": "zh-CN",
    "summary": "规划评审已完成；实际媒体仍未核验。"
  }
}
```


### 手工空间复查与最终v2工作表

修正人物自身左右与画面左右的混淆：乙从桌东侧向画面右离开，不再称为人物自身右方。

仅修改以上文字变量，其余表演、接触、声音与硬锁保持。已复查本镜及相邻镜的方向、出入状态；源版本递增为2，以下为针对上方最终全文实际重跑的输入。

```json
{
  "source": {
    "type": "prompt",
    "id": "CD-E54-director-run-a",
    "version": 2
  },
  "mode": "full",
  "shotIds": [
    "S1",
    "S2"
  ],
  "reviews": [
    {
      "role": "direction",
      "shotId": "S1",
      "status": "pass",
      "criterion": "信息、目的与关系变化符合本次原请求。",
      "observation": "并列甲乙各收自己杯，结束杯在托盘二人留座，建立对照。",
      "sourceLocator": "CD-E54 / 实际回答 / S1 / 对应正文时间窗口"
    },
    {
      "role": "performance",
      "shotId": "S1",
      "status": "pass",
      "criterion": "人物取得具体触发后才改变行为，动作在当前窗口可读。",
      "observation": "各看自己杯、握柄抬杯、落稳再松手，表情平静无额外关系表演。",
      "sourceLocator": "CD-E54 / 实际回答 / S1 / 对应正文时间窗口"
    },
    {
      "role": "staging",
      "shotId": "S1",
      "status": "pass",
      "criterion": "位置、路径和关键接触可达，遮挡不删除必要事实。",
      "observation": "桌北甲西乙东，奶白西柄深绿东柄，托盘两半避免路径交叉。 乙离席为世界东侧、画面右方，未混为人物自身右方。",
      "sourceLocator": "CD-E54 / 实际回答 / S1 / 对应正文时间窗口"
    },
    {
      "role": "cinematography",
      "shotId": "S1",
      "status": "pass",
      "criterion": "机位、覆盖、焦点与光源服务所需可见事实。",
      "observation": "桌南固定略俯中景保留脸手杯，东窗中性柔光可读。",
      "sourceLocator": "CD-E54 / 实际回答 / S1 / 对应正文时间窗口"
    },
    {
      "role": "prompt",
      "shotId": "S1",
      "status": "pass",
      "criterion": "完整文字初态、过程、终态、声音与用户锁定项没有互相矛盾。",
      "observation": "六秒初态、并行收杯、落盘声音与留座终态，无对白回忆。",
      "sourceLocator": "CD-E54 / 实际回答 / S1 / 对应正文时间窗口"
    },
    {
      "role": "continuity",
      "shotId": "S1",
      "status": "pass",
      "criterion": "入出状态、身份、道具、方向与相邻时间关系闭合。",
      "observation": "杯不自移且落稳后释放，6.0秒第一次完成，下段明确另次发生。",
      "sourceLocator": "CD-E54 / 实际回答 / S1 / 对应正文时间窗口"
    },
    {
      "role": "direction",
      "shotId": "S2",
      "status": "pass",
      "criterion": "信息、目的与关系变化符合本次原请求。",
      "observation": "乙先离开、甲自收再代收，关系变化由任务承担呈现。",
      "sourceLocator": "CD-E54 / 实际回答 / S2 / 对应正文时间窗口"
    },
    {
      "role": "performance",
      "shotId": "S2",
      "status": "pass",
      "criterion": "人物取得具体触发后才改变行为，动作在当前窗口可读。",
      "observation": "乙1.7秒前离场，甲3.1—3.4秒看未收杯后才3.4秒接手，无悲伤补戏。",
      "sourceLocator": "CD-E54 / 实际回答 / S2 / 对应正文时间窗口"
    },
    {
      "role": "staging",
      "shotId": "S2",
      "status": "pass",
      "criterion": "位置、路径和关键接触可达，遮挡不删除必要事实。",
      "observation": "甲原座位够到乙杯，乙向东离场，两杯落两半，空位清楚。 乙离席为世界东侧、画面右方，未混为人物自身右方。",
      "sourceLocator": "CD-E54 / 实际回答 / S2 / 对应正文时间窗口"
    },
    {
      "role": "cinematography",
      "shotId": "S2",
      "status": "pass",
      "criterion": "机位、覆盖、焦点与光源服务所需可见事实。",
      "observation": "同桌南固定机位、身份、东窗光和固有色，原取景保留离席空间。",
      "sourceLocator": "CD-E54 / 实际回答 / S2 / 对应正文时间窗口"
    },
    {
      "role": "prompt",
      "shotId": "S2",
      "status": "pass",
      "criterion": "完整文字初态、过程、终态、声音与用户锁定项没有互相矛盾。",
      "observation": "六秒另次活动初态、离开、自收代收齐全，无对白闪回新事件。",
      "sourceLocator": "CD-E54 / 实际回答 / S2 / 对应正文时间窗口"
    },
    {
      "role": "continuity",
      "shotId": "S2",
      "status": "pass",
      "criterion": "入出状态、身份、道具、方向与相邻时间关系闭合。",
      "observation": "两段并非同次接续；硬切杯复原表现再次发生，本段终态两杯落盘乙画外。",
      "sourceLocator": "CD-E54 / 实际回答 / S2 / 对应正文时间窗口"
    }
  ]
}
```

### 最终v2工具原始结果

实际命令：`node skills/cineweave-director/scripts/check-shot-review.mjs <系统临时目录>/CD-E54.json`。实际退出码0，stderr为空。stdout原样保留：

```json
{
  "valid": true,
  "scope": "plan_only",
  "coverageComplete": true,
  "reviewComplete": true,
  "expectedRows": 12,
  "missing": [],
  "openItems": [],
  "prompt": null,
  "errors": [],
  "limitation": "仅检查工作表一致性，不核验引用内容、艺术质量、媒体、权利、批准或实际执行。",
  "localization": {
    "locale": "zh-CN",
    "summary": "规划评审已完成；实际媒体仍未核验。"
  }
}
```

## 运行范围核对

四个原请求逐字保存；E51为一镜八秒，E52两版各三镜十二秒且首尾正文逐字相同，E53为四秒＋两秒＋四秒，E54为两次活动各六秒。最终稿对应的六视角共72行，四项首轮检查器都实际执行；空间措辞复查后，E52、E53、E54又实际执行v2检查，初轮与最终原始输入/结果都保留在相应任务之后。

检查器只验证工作表配对与状态一致性，不读取稿件引用、实际像素或音频；已逐镜手工核对文字因果与切点，但没有声称出图、视频、声长、口型或观众效果通过。对话声长和运动自然度仍需真实素材，没有新增评分或成功率。

本次唯一工作区写入为本文件。临时执行输入保存于系统临时目录，没有改源码、调用媒体/API、commit或push。

## 追加：CD-E51 反馈后修订

本追加发生在独立审阅提出文字warn之后。前文E51 v1全文、首次工作表与首次原始结果全部保留；首次工具完成不再用于支持反射几何已闭合。当前E51全文采用以下v2，其他三项最终稿不改。

### 反馈来源与单一根因

```text
独立审阅对 CD-E51 最终稿提出反射几何的文字 warn：你设东西向人行道、北侧店面、甲向东走、乙在后约4米；甲只看左前方而头肩仍朝东。若玻璃与北侧店面平行，乙虚像通常仍在西侧，不能由前向眼线确认。
```


唯一修订变量是橱窗实际反射面的方向/角面，责任领域为场景。补定竖直内折斜玻璃：俯视面内方向北偏西约23度，朝街法线西偏南约23度，使后方乙的光线经固定角面进入甲前左方眼线。没有改演员眼线、回头、机位、运动或节拍。

传播只在三处：开头声明固定角面；5.6—6.6秒解释这个面的光路；6.6—8.0秒将眼线目标明确为这个角面。其余原稿正文逐字保留，包括八秒单镜、观众先获知、甲仅结尾确认、头肩朝东不回头、乙约四米在后、白天光色、声音及无袭击/追逐/新人物。

### 反馈复查的v1工作表与实际结果

下表是收到反馈后对已保留v1的重新判断，没有改写首次表和结果。四项几何相关状态改为revise，未受影响的表演和连续性只在原文字范围内沿用。

```json
{
  "source": {
    "type": "prompt",
    "id": "CD-E51-director-run-a",
    "version": 1
  },
  "mode": "full",
  "shotIds": [
    "S1"
  ],
  "reviews": [
    {
      "role": "direction",
      "shotId": "S1",
      "status": "revise",
      "criterion": "信息、目的与关系变化符合本次原请求。",
      "observation": "反馈复查：末段要求甲前向眼线确认，但v1没有给出能把后方乙映到前左方的实际反射面方向，认知机制缺少地理支持。",
      "sourceLocator": "CD-E51 / 已保留v1实际回答 / S1 / 反射面及末段确认",
      "repair": {
        "domain": "scene",
        "variable": "橱窗实际反射面的方向/角面",
        "acceptance": "只补实际斜玻璃朝向，使后方乙的虚像可从甲前左方眼线接收，保留演法和八秒时序；真实反射仍待素材验收。"
      }
    },
    {
      "role": "performance",
      "shotId": "S1",
      "status": "pass",
      "criterion": "人物取得具体触发后才改变行为，动作在当前窗口可读。",
      "observation": "甲前段关注路面与陈列，末段才移眼看乙反射；眉间下颌小幅变化，头肩始终朝东。 此文字决定未受反馈影响而沿用，不是媒体验收。",
      "sourceLocator": "CD-E51 / 已保留v1实际回答 / S1 / 反射面及末段确认"
    },
    {
      "role": "staging",
      "shotId": "S1",
      "status": "revise",
      "criterion": "位置、路径和关键接触可达，遮挡不删除必要事实。",
      "observation": "反馈复查：人行道东西向、甲向东、乙在后约四米；v1没有声明橱窗斜面，若玻璃平行北墙，后方虚像仍偏西，前向眼线不足。",
      "sourceLocator": "CD-E51 / 已保留v1实际回答 / S1 / 反射面及末段确认",
      "repair": {
        "domain": "scene",
        "variable": "橱窗实际反射面的方向/角面",
        "acceptance": "只补实际斜玻璃朝向，使后方乙的虚像可从甲前左方眼线接收，保留演法和八秒时序；真实反射仍待素材验收。"
      }
    },
    {
      "role": "cinematography",
      "shotId": "S1",
      "status": "revise",
      "criterion": "机位、覆盖、焦点与光源服务所需可见事实。",
      "observation": "反馈复查：v1只写反射按玻璃角度呈现，却未给反射面方向，不能据此确认甲左前方及街侧摄影机都能看见同一乙的倒影。",
      "sourceLocator": "CD-E51 / 已保留v1实际回答 / S1 / 反射面及末段确认",
      "repair": {
        "domain": "scene",
        "variable": "橱窗实际反射面的方向/角面",
        "acceptance": "只补实际斜玻璃朝向，使后方乙的虚像可从甲前左方眼线接收，保留演法和八秒时序；真实反射仍待素材验收。"
      }
    },
    {
      "role": "prompt",
      "shotId": "S1",
      "status": "revise",
      "criterion": "完整文字初态、过程、终态、声音与用户锁定项没有互相矛盾。",
      "observation": "反馈复查：v1的前向眼线与未明确方向的北侧橱窗有未闭合几何关系，完整时序不能补足反射路径。",
      "sourceLocator": "CD-E51 / 已保留v1实际回答 / S1 / 反射面及末段确认",
      "repair": {
        "domain": "scene",
        "variable": "橱窗实际反射面的方向/角面",
        "acceptance": "只补实际斜玻璃朝向，使后方乙的虚像可从甲前左方眼线接收，保留演法和八秒时序；真实反射仍待素材验收。"
      }
    },
    {
      "role": "continuity",
      "shotId": "S1",
      "status": "pass",
      "criterion": "入出状态、身份、道具、方向与相邻时间关系闭合。",
      "observation": "连续八秒无剪辑；甲不回头，乙不变成第三人，日光、衣着和行进方向沿用。 此文字决定未受反馈影响而沿用，不是媒体验收。",
      "sourceLocator": "CD-E51 / 已保留v1实际回答 / S1 / 反射面及末段确认"
    }
  ]
}
```


实际运行形式：Node ESM从标准输入接收工作表，调用随包导出的checkShotReview和parseJsonStrict，没有新建输入文件。两次运行均使用下列精确调用代码，输入分别是上方v1反馈表和下方v2表。

```javascript
import { checkShotReview } from './skills/cineweave-director/scripts/check-shot-review.mjs'; import { parseJsonStrict } from './skills/cineweave-director/scripts/parse-json.mjs'; let source=''; for await (const chunk of process.stdin) source += chunk; const result=checkShotReview(parseJsonStrict(source)); console.log(JSON.stringify(result,null,2)); process.exitCode=!result.valid?1:result.reviewComplete?0:2;
```


v1反馈复查实际退出码2；stderr为空，stdout原样保留：

```json
{
  "valid": true,
  "scope": "plan_only",
  "coverageComplete": true,
  "reviewComplete": false,
  "expectedRows": 6,
  "missing": [],
  "openItems": [
    {
      "role": "direction",
      "shotId": "S1",
      "status": "revise"
    },
    {
      "role": "staging",
      "shotId": "S1",
      "status": "revise"
    },
    {
      "role": "cinematography",
      "shotId": "S1",
      "status": "revise"
    },
    {
      "role": "prompt",
      "shotId": "S1",
      "status": "revise"
    }
  ],
  "prompt": null,
  "errors": [],
  "limitation": "仅检查工作表一致性，不核验引用内容、艺术质量、媒体、权利、批准或实际执行。"
}
```


### v2反射面构造说明与边界

以下给出一种局部俯视构造：甲朝东，乙在西后方四米；经所给斜角面反射，乙的虚像位于甲东前方与北侧，因此头仍朝东时可以向左前方移眼。摄影机例点仍在甲前方偏南；甲与摄影机的视线在角面落于不同点，角面须同时容纳这些点。坐标只是未指定精确尺寸的原位置关系的一种实例，不增加新的走位或速度指令。

```json
{
  "scope": "illustrative_plan_only",
  "axes": {
    "x": "东",
    "y": "北"
  },
  "A": [
    0.0,
    0.0
  ],
  "B": [
    -4.0,
    0.0
  ],
  "cameraC": [
    0.6,
    -0.6
  ],
  "reflectingPlane": "7x + 3y = 18.5；竖直斜角面的俯视支撑直线",
  "planeDirectionNorthToWestDegrees": 23.19859051364819,
  "virtualB": [
    7.224137931034482,
    4.810344827586207
  ],
  "AForwardLeftEyeAngleDegrees": 33.65849960657732,
  "rayHitFromA": [
    2.056100795755968,
    1.3690981432360743
  ],
  "rayHitFromCameraC": [
    2.3036520876941724,
    0.7914784620469323
  ],
  "limitation": "局部自定俯视构造，不是从素材量得的坐标，不证明材质反射率、倒影清晰度、整镜焦点或观众辨认。"
}
```


真实几何仍须实际素材验收：5.6秒前是否未给甲可辨线索、6.6—8.0秒甲与摄影机是否同时看见正确倒影、角面是否容纳光路、玻璃透反射与身份辨认是否自然、头肩是否始终朝东。本次没有看过反射结果，数值构造与规划检查均不构成媒体验收。

### CD-E51 v2完整修订稿

以下为通用文生视频稿；暂定横向 16:9、自然写实表现。人物外观、橱窗位置与日光方向是可撤销的设计补足。八秒是成片采用时长，故事中连续经过八秒。

#### S1｜0.0—8.0 秒｜连续单镜

```text
白天，安静的城市人行道，八秒连续单镜，横向16:9。人行道沿东西方向延伸，北侧是店面，前方一面干净橱窗紧接着哑光浅灰外墙；橱窗实际承担反射的是竖直的内折斜玻璃角面，俯视由靠街的东南边缘向店内西北延伸，面内方向约为北偏西二十三度，朝街面法线指向西偏南约二十三度。这个固定角面不平行于东西向店墙，收在北侧橱窗范围内，不伸入甲乙的直行路线；南侧是路缘。画面没有其他行人穿过，没有车辆驶入。柔和中性日光由南侧开阔天空照来，浅灰墙与铺地提供弱反光；人的脸、深色衣料及橱窗反射保留层次，玻璃不变成不透明镜面，店内陈列仍隐约可见，整体为低饱和灰、米白与深蓝，不改变白天的安静感。
前方人物甲是约三十岁的成年女性，短齐下巴黑发、长圆脸、平直眉、自然深棕眼睛，无发饰和装饰性彩妆，皮肤有自然纹理，穿米白棉质短外套、灰色直筒长裤和低帮布鞋。她起初眉间舒展、双唇轻合，肩颈松弛，面朝行走的东方，视线只落在前方路面与即将经过的橱窗陈列。后方人物乙是约四十岁的成年男性，短发、方脸，穿深蓝哑光夹克、黑色长裤和深色鞋；不拿武器，不伸手接近甲。乙的注意力持续落在甲的背部，保持克制步态。
摄影机在甲前方偏南的街侧斜位，略低于眼睛，以较宽的三分之四正侧面中全景陪甲向东平移。甲在近处画面右侧，画面左后方保留她已经走过的人行道；乙可在该纵深中被直接看见。甲的脚步、乙的全身和两人的间距都留在画内。景深保护前后两人，摄影机不切镜、不环绕、不突然推近，也不靠模糊藏掉乙。
0.0至1.2秒，甲平稳向东走，头与肩保持朝前。乙从左后方进入可读的背景，距甲约四米，沿同一人行道跟进；甲尚未看见他。
1.2至3.2秒，观众有机会直接注意到乙始终看着甲的背部，沿甲走过的路线保持距离。甲继续看前方，步速自然，没有警觉表情。
3.2至5.6秒，甲因即将经过橱窗的陈列稍放慢两步，身体与头仍朝东方；乙随后也减慢，保留原来的跟随间距。他没有超越甲，也不转去看别处。摄影机保持原跟行速度的柔和调整，让这种步速响应与距离同时可见；甲此时的视线仍在前方及陈列，尚未作出察觉跟随的回应。
5.6至6.6秒，甲与摄影机沿已有路径来到橱窗前，甲身后的乙进入上述固定斜玻璃角面可反射的视角；来自后方西侧乙的光线经这个角面反射，进入甲看向左前方角面的眼线，乙的虚像因此位于甲的前左方。反射面保持原位，不转动，不改变玻璃材质。橱窗里的乙与画面背景中的乙来自同一人、同一位置和连续步态；反射按玻璃角度呈现，不额外出现第三个人。此前外墙与斜角反光没有向甲提供可辨认的跟随者图像。
6.6至8.0秒，仅在这个结尾窗口，甲将眼球移向左前方橱窗斜角面中的乙的倒影，头、肩与身体仍朝前，不向后转头。她在倒影里见到乙仍跟着自己，眉间轻收、下颌略紧，行走中的肩颈收住一点；不瞪眼，不张嘴，也不突然奔跑。摄影机继续陪行，保留甲的眼线朝向、清楚的倒影和真实背景中的乙，最后一刻甲仍向东走，乙仍在约四米之后。
声音是安静街面的连续底声与两组自然脚步，乙的脚步较远；甲放慢时脚步间隔相应变长。不以突出的身后脚步或惊吓音提前让甲确认。不加对白、旁白、配乐或突发撞击。全段没有回头、袭击、追逐、拦路或新增人物；结束仅完成甲通过橱窗倒影确认有人跟随的认知变化。
```

注意力设计是先让观众读到背景中的目光、同路线和步速响应，再让甲在 6.6—8.0 秒取得反射线索。反射的真实几何与人物是否可读仍需实际画面确认；这份稿件只完成文字规划。

### 传播与复查记录

在追加前实际执行了逆向替换检查：撤回三处角面措辞后，v2全文与前文保存的v1回答完全相等。单镜没有相邻镜需要改动；复查5.6秒进入角面条件、6.6秒取得线索、8.0秒仍向东走的相邻节拍。补面方向没有提前安排甲确认，也没有更换摄影机或动作版本。

### v2最终规划工作表与实际工具结果

source递增为2，六视角覆盖唯一实际镜头S1；这是feedback后修订。pass仅表示当前文字意图与所给斜面关系相容，实际反射、材质和画面可读性待媒体。

```json
{
  "source": {
    "type": "prompt",
    "id": "CD-E51-director-run-a",
    "version": 2
  },
  "mode": "full",
  "shotIds": [
    "S1"
  ],
  "reviews": [
    {
      "role": "direction",
      "shotId": "S1",
      "status": "pass",
      "criterion": "信息、目的与关系变化符合本次原请求。",
      "observation": "观众1.2—5.6秒先读跟随、甲仅6.6—8.0秒确认均保持；补固定斜角面使前左方确认具有可解释光路。",
      "sourceLocator": "CD-E51 / 反馈后v2完整修订稿 / S1 / 角面初态及5.6—8.0秒"
    },
    {
      "role": "performance",
      "shotId": "S1",
      "status": "pass",
      "criterion": "人物取得具体触发后才改变行为，动作在当前窗口可读。",
      "observation": "仅增加角面，甲前段仍看路面陈列，末段只移眼，头肩始终朝东；原表情、步速响应和时序不改。",
      "sourceLocator": "CD-E51 / 反馈后v2完整修订稿 / S1 / 角面初态及5.6—8.0秒"
    },
    {
      "role": "staging",
      "shotId": "S1",
      "status": "pass",
      "criterion": "位置、路径和关键接触可达，遮挡不删除必要事实。",
      "observation": "竖直内折角面面内方向北偏西约23度、朝街法线西偏南约23度，把乙虚像映到甲前左方，角面不伸入原路线。",
      "sourceLocator": "CD-E51 / 反馈后v2完整修订稿 / S1 / 角面初态及5.6—8.0秒"
    },
    {
      "role": "cinematography",
      "shotId": "S1",
      "status": "pass",
      "criterion": "机位、覆盖、焦点与光源服务所需可见事实。",
      "observation": "原街侧前斜位仍向东陪行；角面方向支持甲与摄影机分别看到同一乙的反射，运镜焦点光色不改；实际清晰度待媒体。",
      "sourceLocator": "CD-E51 / 反馈后v2完整修订稿 / S1 / 角面初态及5.6—8.0秒"
    },
    {
      "role": "prompt",
      "shotId": "S1",
      "status": "pass",
      "criterion": "完整文字初态、过程、终态、声音与用户锁定项没有互相矛盾。",
      "observation": "完整八秒全文只在角面初态、5.6—6.6秒反射机制、6.6—8.0秒眼线目标三处传播同一方向决定，未改其他演法时序。",
      "sourceLocator": "CD-E51 / 反馈后v2完整修订稿 / S1 / 角面初态及5.6—8.0秒"
    },
    {
      "role": "continuity",
      "shotId": "S1",
      "status": "pass",
      "criterion": "入出状态、身份、道具、方向与相邻时间关系闭合。",
      "observation": "连续八秒无剪辑、甲不回头、乙在后约四米；固定角面前后一致，身份光色声音与终态保持。",
      "sourceLocator": "CD-E51 / 反馈后v2完整修订稿 / S1 / 角面初态及5.6—8.0秒"
    }
  ]
}
```


v2实际退出码0；stderr为空，stdout原样保留：

```json
{
  "valid": true,
  "scope": "plan_only",
  "coverageComplete": true,
  "reviewComplete": true,
  "expectedRows": 6,
  "missing": [],
  "openItems": [],
  "prompt": null,
  "errors": [],
  "limitation": "仅检查工作表一致性，不核验引用内容、艺术质量、媒体、权利、批准或实际执行。"
}
```


### 本次实际读取与校验来源

| 相对路径 | 本次读取时整文件SHA256 |
| --- | --- |
| tests/evaluations/2026-10-11/director-run-a.md | 3e4d47fdbe13794d1199c703ecc0f8c67315eea301346390e0efe2718a140c4e（追加前） |
| skills/cineweave-director/scripts/check-shot-review.mjs | bb69f60d8794f3329bc4b7af772d05ad01a28c001c7345f1de63bfa1e3d7d1c2 |
| skills/cineweave-director/scripts/parse-json.mjs | 9c15621d8304bf6114cc4cb322409c8e59433409ac17950311725cdcbebecf11 |

继承前文已读Skill与相关参考，不重复加载，也未读取其他运行或所禁报告。

### E52/E53/E54的v1全文证据缺口

这三项的v1工作表和原始结果已在前文保留，但v1全文曾在同一文件内原位修改；当前没有可定位、可核验的独立v1全文保存文件或持久快照。完整v1源稿内容因此保持unknown，不从上下文或记忆重造，也不把v1表当成v1全文。此前检查版本可追溯到表，完整首稿的来源链仍有这一缺口。三项最终v2全文、现有表与结果保持原样。

本次仅向现有director-run-a.md追加；没有新建文件、改源码、媒体/API调用、commit或push。

### 参考来源版本补注

根代理告知：全部首轮成稿之后，workbench才增加“受限视点下的可见性”两段，成为参考来源版本2。本次首轮及E51反馈修订使用的是此前实际读取的workbench版本1，整文件SHA256为b2e182a4907a235d0044b500d70d57fdde3b6ec9a7c9a99546583907632543c2；本次没有读取新增段，也没有用当前文件替代原来源证据。上方E51 prompt版本2表示稿件经过反馈修订，参考来源仍为已读版本1。针对新参考上下文的复验由根代理另行执行，不计入本报告本轮检查。
