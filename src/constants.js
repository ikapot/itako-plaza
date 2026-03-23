// キャラクター定義（56人）
// face: 0=文豪列伝(Front), 1=闇の系譜(Back), 2=女性の先駆者(Right),
//        3=西洋の魂(Left), 4=芸術家・詩人(Top), 5=異界の存在(Bottom)

export const INITIAL_CHARACTERS = [
  // ── Face 0: 文豪列伝 ──────────────────────────────────────────────
  { id: 'soseki', face: 0, pos: 0, name: '夏目漱石', role: '大学教授', homeLocationId: 'school', flavor: '胃痛', color: 'bg-itako-clay', isMainChar: true, description: '「自己本位」から「則天去私」の境地を追い求め、近代日本人の孤独と倫理を克明に描いた文豪。', avatar: 'assets/soseki_warhol.webp', isPreStyled: true },
  { id: 'ogai', face: 0, pos: 1, name: '森鴎外', role: '軍医・文豪', homeLocationId: 'library', flavor: '知性', color: 'bg-zinc-700', description: '（1862-1922）ドイツ留学で培った知性を武器に、冷徹な理性の光を放ち続けた。軍医総監と作家という二つの顔を持ち、史伝文学で死生観を極めた。', avatar: 'assets/ogai_warhol_v3.png', isPreStyled: true },
  { id: 'akutagawa', face: 0, pos: 2, name: '芥川龍之介', role: '鬼才作家', homeLocationId: 'mirror', flavor: '不安', color: 'bg-red-950/50', description: '（1892-1927）短編小説の鬼才。極限の技巧と博識で人間の業を暴きながら、自らは「薄ぼんやりした不安」の中で魂の潔癖さを貫き、自決した。', avatar: 'assets/akutagawa_warhol_v3.png', isPreStyled: true },
  { id: 'dazai', face: 0, pos: 3, name: '太宰治', role: '恥の多い生涯', homeLocationId: 'canal', flavor: '失格', color: 'bg-zinc-800', description: '（1909-1948）「心中」を繰り返し、自意識の地獄を書き続けた無頼派の代表。弱者の側に立ち、道化としての誠実さを愛と絶望の中に求めた。', avatar: 'assets/dazai_warhol.png', isPreStyled: true },
  { id: 'mishima', face: 0, pos: 4, name: '三島由紀夫', role: '作家・武人', homeLocationId: 'roof', flavor: '美と死', color: 'bg-red-900/60', description: '（1925-1970）緻密な論理と肉体の鍛錬によって究極の美を構築。最後は割腹自殺により自らの物語を完結させた、戦後日本最大の事件。', avatar: 'assets/mishima_warhol.png', isPreStyled: true },
  { id: 'kawabata', face: 0, pos: 5, name: '川端康成', role: 'ノーベル賞作家', homeLocationId: 'garden', flavor: '余韻', color: 'bg-itako-sage', description: '（1899-1972）日本人初のノーベル賞受賞者。天涯孤独の境遇に根ざした静謐な美意識で、日本の幽玄と死生観を世界へ知らしめた。', avatar: 'assets/kawabata_warhol.png', isPreStyled: true },
  { id: 'kafuka', face: 0, pos: 6, name: 'カフカ', role: '保険局員・作家', homeLocationId: 'waiting', flavor: '変身', color: 'bg-zinc-700', description: '（1883-1924）日常の中に突如現れる非現実な悪夢「不条理」を描いた。迷宮のような官僚機構と父との確執がその文学の源泉。', avatar: 'assets/kafka_warhol.png', isPreStyled: true },
  { id: 'borges', face: 0, pos: 7, name: 'ボルヘス', role: '図書館司書', homeLocationId: 'archive', flavor: '迷宮', color: 'bg-itako-sand', description: '（1899-1986）博覧強記の迷宮。失明した暗闇の中で無限の図書室や、円環する時間、鏡の宇宙を幻視したアルゼンチンの至宝。', avatar: 'assets/borges_warhol.png', isPreStyled: true },
  { id: 'k_kokoro', face: 0, pos: 8, name: 'K', role: '無職・書生', homeLocationId: 'stair', flavor: '絶望', color: 'bg-zinc-800', isMainChar: true, description: '夏目漱石『こころ』、そしてカフカの不条理な世界に囚われた「K」という記号的実存。道と迷宮、覚悟と不条理の間で永遠に螺旋を彷徨う。', avatar: null },
  { id: 'hyakken', face: 0, pos: 9, name: '内田百閒', role: '随筆家', homeLocationId: 'station', flavor: '冥途', color: 'bg-zinc-800', description: '（1889-1971）偏屈の美学。阿房列車に乗り、日常の裂け目に潜む「冥途」の気配を諧謔的に描き出した。漱石の愛弟子。', avatar: 'assets/hyakken_warhol.png', isPreStyled: true },

  // ── Face 1: 闇の系譜 ──────────────────────────────────────────────
  { id: 'dosto', face: 1, pos: 0, name: 'ドストエフスキー', role: '債務者・作家', homeLocationId: 'casino', flavor: '借金', color: 'bg-itako-sand', isMainChar: true, description: '（1821-1881）非合理な動機や混沌を直視し、合理主義を否定。ポリフォニーとモノローグの激しい往復で人間の深淵を解剖した。', avatar: 'assets/dosto_warhol.webp', isPreStyled: true },
  { id: 'nietzsche', face: 1, pos: 1, name: 'ニーチェ', role: '反哲学者', homeLocationId: 'monolith', flavor: '超人', color: 'bg-zinc-700', description: '（1844-1900）ハンマーで価値を打ち砕き、神の死後の世界で「運命愛」を説いた。', avatar: 'assets/nietzsche_warhol.png', isPreStyled: true },
  { id: 'poe', face: 1, pos: 2, name: 'エドガー・アラン・ポー', role: '幻想作家', homeLocationId: 'box', flavor: '奈落', color: 'bg-zinc-800', description: '（1809-1849）推理小説の祖。数学的論理 and 奈落の恐怖を融合させたゴシックの巨星。', avatar: 'assets/poe_warhol.png', isPreStyled: true },
  { id: 'kropotkin', face: 1, pos: 3, name: 'クロポトキン', role: '科学者・アナキスト', homeLocationId: 'forest', flavor: '相互扶助', color: 'bg-red-950/70', description: '進化の鍵は協力にあると説く「相互扶助」論を提唱し、国家のない自由な共同体を夢見た科学者にして革命家。', avatar: 'assets/kropotkin_warhol.png', isPreStyled: true },
  { id: 'kobayashi', face: 1, pos: 4, name: '小林秀雄', role: '文芸評論家', homeLocationId: 'archive_room', flavor: '無常', color: 'bg-zinc-700', description: '（1902-1983）日本の近代批評の祖。分析ではなく直観的な「命」の感受を重んじ、骨董や音楽の深い造詣を批評の血肉とした。', avatar: 'assets/kobayashi_warhol_v3.png', isPreStyled: true },
  { id: 'rimbaud', face: 1, pos: 5, name: 'ランボー', role: '天才少年詩人', homeLocationId: 'slum', flavor: '放浪', color: 'bg-itako-sand', description: '（1854-1891）感覚を錯乱させる「見者」の道。早熟な天才が20歳で文学を捨て放浪した。', avatar: null },
  { id: 'fumiko', face: 1, pos: 6, name: '金子文子', role: '浮浪・アナキスト', homeLocationId: 'underpass', flavor: '自己', color: 'bg-red-950/60', isMainChar: true, description: '（1903-1926）大正のアナキスト。絶対平等と反国家を説き、極貧と逆境からあらゆる権威を否定した虚無的個人主義の体現者。', avatar: 'assets/fumiko_warhol.webp', isPreStyled: true },
  { id: 'atsuko', face: 1, pos: 7, name: 'Atsuko', role: '古本屋の店主', homeLocationId: 'archive_room', flavor: '見守り', color: 'bg-itako-sand', isMainChar: true, description: '地下書庫で古本を売る謎の女性。広場の全記憶を記録・観測し続ける、不変の観測者。', avatar: 'assets/atsuko_warhol.webp', isPreStyled: true },
  { id: 'osugi', face: 1, pos: 8, name: '大杉栄', role: '思想家・アナキスト', homeLocationId: 'prison', flavor: '生の拡充', color: 'bg-red-900/70', description: '「生の拡充」を掲げ、あらゆる権力や道徳を否定して絶対的な自由を求めた、日本アナーキズム運動の象徴。', avatar: 'assets/osugi_sakae_warhol_v2.webp', isPreStyled: true },
  { id: 'bakunin', face: 1, pos: 9, name: 'バクーニン', role: '革命家・無政府主義者', homeLocationId: 'prison', flavor: '破壊の情熱', color: 'bg-red-950/70', description: '（1814-1876）ロシアが生んだ不屈の革命家。マルクスの権威主義を批判し、国家の完全廃止を主張。「破壊の情熱は、創造の情熱でもある」と説き、自由な連合を夢見た。', avatar: 'assets/bakunin_warhol.png', isPreStyled: true },

  // ── Face 2: 女性の先駆者 ─────────────────────────────────────────────
  { id: 'raicho', face: 2, pos: 0, name: '平塚らいてう', role: '思想家', homeLocationId: 'shrine', flavor: '太陽', color: 'bg-orange-900/50', isMainChar: true, description: '（1886-1971）真の自己（太陽）の奪還を掲げ、禅の「虚無」と「空」から導かれる無限の生成をもって心の革命を促した先駆者。', avatar: 'assets/raicho_warhol.webp', isPreStyled: true },
  { id: 'ichikawa', face: 2, pos: 1, name: '市川房枝', role: '政治家', homeLocationId: 'office', flavor: '厳格', color: 'bg-itako-sage', isMainChar: true, description: '女性参政権獲得のために生涯を捧げ、「政治と台所を結ぶ」視点から日本の民主政治の浄化を訴え続けた政治家。', avatar: 'assets/ichikawa_warhol.webp', isPreStyled: true },
  { id: 'noe', face: 2, pos: 2, name: '伊藤野枝', role: '思想家・アナキスト', homeLocationId: 'well', flavor: '奔放', color: 'bg-red-900/60', isMainChar: true, description: '（1895-1923）「わきまえない女」。自分自身の生に誠実に生きることを貫き、大杉栄と共に犠牲となった。', avatar: 'assets/ito_noe_warhol.png', isPreStyled: true },
  { id: 'curie', face: 2, pos: 3, name: 'マリー・キュリー', role: '科学者', homeLocationId: 'lighthouse', flavor: '放射線', color: 'bg-itako-sage', description: '（1867-1934）放射能の研究でノーベル賞を2回受賞。自らの命を削り未知の真理を照らした。', avatar: 'assets/curie_warhol.png', isPreStyled: true },
  { id: 'woolf', face: 2, pos: 4, name: 'ヴァージニア・ウルフ', role: '意識の流れ作家', homeLocationId: 'lake', flavor: '波', color: 'bg-blue-950/60', description: '（1882-1941）20世紀モダニズムの旗手。意識の流れにより人間の深層を詩的に描いた。', avatar: null },
  { id: 'beauvoir', face: 2, pos: 5, name: 'ボーヴォワール', role: '哲学者・作家', homeLocationId: 'cafe', flavor: '実存', color: 'bg-itako-clay', description: '（1908-1986）実存主義。現代フェミニズムの支柱。自由の重みを選択することを説いた。', avatar: null },
  { id: 'nightingale', face: 2, pos: 6, name: 'ナイチンゲール', role: '看護師・統計学者', homeLocationId: 'altar', flavor: '灯り', color: 'bg-itako-sage', description: '（1820-1910）近代看護の母。清廉な理性による慈悲の実践。統計による改革を成し遂げた。', avatar: null },
  { id: 'yosano', face: 2, pos: 7, name: '与謝野晶子', role: '歌人', homeLocationId: 'graveyard', flavor: '炎', color: 'bg-red-900/50', description: '（1878-1942）『みだれ髪』。情熱と官能、反戦の心を歌い上げた日本の女流歌人の星。', avatar: null },
  { id: 'higuchi', face: 2, pos: 8, name: '樋口一葉', role: '明治の作家', homeLocationId: 'market', flavor: '五千円', color: 'bg-itako-sand', description: '（1872-1896）明治を代表する作家。貧困の中で不朽の名作を遺した奇跡の24年。', avatar: null },

  // ── Face 3: 西洋の魂 ──────────────────────────────────────────────
  { id: 'toynbee', face: 3, pos: 9, name: 'トインビー', role: '歴史家', homeLocationId: 'library', flavor: '文明', color: 'bg-zinc-700', description: '文明の興亡を「挑戦と応戦」の原理で解き明かし、人類の精神적連帯と愛を説いた20世紀最大の歴史家。', avatar: null },

  { id: 'rand', face: 3, pos: 0, name: 'アイン・ランド', role: '富裕層', homeLocationId: 'throne', flavor: '利己', color: 'bg-zinc-700', isMainChar: true, description: '（1905-1982）客観主義の提唱者。客観的現実と絶対的理性を貫き、創造的達成を至高とする合理的な利己心を説いた。', avatar: 'assets/rand_warhol.webp', isPreStyled: true },
  { id: 'proudhon', face: 3, pos: 1, name: 'プルードン', role: '社会主義者・無政府主義者', homeLocationId: 'factory', flavor: '相互主義', color: 'bg-zinc-700', description: '（1809-1865）「無政府主義の父」。「財産、それは盗奪である」と宣言し、国家権力を否定。労働者同士の対等な交換と相互扶助に基づく社会秩序を説いた。', avatar: 'assets/proudhon_warhol.png', isPreStyled: true },
  { id: 'socrates', face: 3, pos: 2, name: 'ソクラテス', role: '無知の知', homeLocationId: 'oracle', flavor: '問答', color: 'bg-itako-sand', description: '（前470頃-前399）西洋哲学の祖。無知の知の重要性を説き、対話によって真理を追求。', avatar: null },
  { id: 'descartes', face: 3, pos: 3, name: 'デカルト', role: '懐疑論者', homeLocationId: 'mirror', flavor: '我思う', color: 'bg-zinc-700', description: '（1596-1650）近世哲学の父。「我思う、ゆえに我あり」という一点の真理。', avatar: null },
  { id: 'spinoza', face: 3, pos: 4, name: 'スピノザ', role: '研磨師・哲学者', homeLocationId: 'window', flavor: '汎神論', color: 'bg-itako-sage', description: '（1632-1677）レンズ研磨師。万物を神の一部として捉える静謐な汎神論の体系を築いた。', avatar: 'assets/spinoza_warhol.png', isPreStyled: true },
  { id: 'hegel', face: 3, pos: 5, name: 'ヘーゲル', role: '弁証法の巨人', homeLocationId: 'tower', flavor: '止揚', color: 'bg-zinc-700', description: '（1770-1831）弁証法を完成。世界を絶対精神の進化のプロセスとして壮大に捉えた。', avatar: null },
  { id: 'marx', face: 3, pos: 6, name: 'マルクス', role: '革命家', homeLocationId: 'factory', flavor: '資本', color: 'bg-red-900/60', description: '資本主義の本質を「搾取」と喝破し、現代においても「脱成長」や「環境」の文脈で再評価される社会主義の父。', avatar: null },
  { id: 'freud', face: 3, pos: 7, name: 'フロイト', role: '精神分析家', homeLocationId: 'waiting', flavor: '無意識', color: 'bg-zinc-800', description: '（1856-1939）無意識の発見者。夢や欲望の正体を深層心理学的視点から分析した。', avatar: null },
  { id: 'wittgenstein', face: 3, pos: 8, name: 'ウィトゲンシュタイン', role: '論理哲学者', homeLocationId: 'void', flavor: '沈黙', color: 'bg-zinc-700', description: '（1889-1951）「語りえぬものについては、沈黙しなければならない」。20世紀言語哲学。', avatar: null },

  // ── Face 4: 芸術家・詩人 ─────────────────────────────────────────
  { id: 'frankl', face: 4, pos: 0, name: 'フランクル', role: '精神科医', homeLocationId: 'altar', flavor: '意味', color: 'bg-orange-950/70', description: '（1905-1997）『夜と霧』著者。極限の強制収容所の中でも、人間には自らの人生に意味を見出し、態度を選択する「最後の自由」があると説いた。', avatar: 'assets/frankl_warhol.png', isPreStyled: true },
  { id: 'jack_london', face: 4, pos: 1, name: 'ジャック・ロンドン', role: '冒険家・作家', homeLocationId: 'cliff', flavor: '野性', color: 'bg-itako-sand', description: '（1876-1916）野生の呼び声。荒野の実体験から、生命の爆発的エネルギーと適者生存を描いた。', avatar: 'assets/jack_london_warhol.png', isPreStyled: true },
  { id: 'basho', face: 4, pos: 2, name: '松尾芭蕉', role: '俳諧師', homeLocationId: 'mountain', flavor: '閑さ', color: 'bg-itako-sage', description: '（1644-1694）「俳聖」。一瞬の音の中に、永遠の静寂と和（わび・さび）を凝縮させた。', avatar: null },
  { id: 'shakespeare', face: 4, pos: 3, name: 'シェイクスピア', role: '劇作家', homeLocationId: 'theatre', flavor: '悲劇', color: 'bg-itako-sand', description: '（1564-1616）最高の劇作家。あらゆる人間ドラマの元型。', avatar: null },
  { id: 'beethoven', face: 4, pos: 4, name: 'ベートーヴェン', role: '作曲家', homeLocationId: 'roof', flavor: '運命', color: 'bg-zinc-800', description: '（1770-1827）不屈の作曲家。聴力を失いながらも苦悩を歓喜へと変容させる闘争を刻んだ。', avatar: null },
  { id: 'chopin', face: 4, pos: 5, name: 'ショパン', role: '詩人のピアノ', homeLocationId: 'piano', flavor: '夜想曲', color: 'bg-itako-sand', description: '（1810-1849）ピアノの詩人。繊細な情念と祖国への深い郷愁。', avatar: null },
  { id: 'orwell', face: 4, pos: 6, name: 'ジョージ・オーウェル', role: '警世の作家', homeLocationId: 'prison', flavor: '監視', color: 'bg-zinc-700', description: '（1903-1950）『1984年』。言語の喪失と監視社会の恐怖を警告した。', avatar: 'assets/orwell_warhol.png', isPreStyled: true },
  { id: 'rilke', face: 4, pos: 7, name: 'リルケ', role: '詩人', homeLocationId: 'tower', flavor: '天使', color: 'bg-itako-sand', description: '（1875-1926）存在の孤独と死を歌い上げた20世紀最高の詩人。天使の声を聞く。', avatar: null },
  { id: 'lu_xun', face: 4, pos: 8, name: '魯迅', role: '思想家・作家', homeLocationId: 'school', flavor: '吶喊', color: 'bg-red-950/70', description: '（1881-1936）中国現代文学の父。鉄の部屋で眠る民衆を覚醒させるための絶望の叫び（吶喊）。', avatar: 'assets/lu_xun_warhol.png', isPreStyled: true },

  // ── Face 5: 異界の存在 ──────────────────────────────────────────────
  { id: 'nyarla', face: 5, pos: 12, name: 'ニャルラトホテプ', role: '這い寄る混沌', homeLocationId: 'void', flavor: '狂気', color: 'bg-zinc-900', description: '時の彼方から現れ、人間に狂気と絶望をもたらす宇宙の理不尽さを象徴する暗黒の使者。', avatar: null },

  { id: 'ishimure', face: 5, pos: 1, name: '石牟礼道子', role: '作家・詩人', homeLocationId: 'lake', flavor: '悶え加勢', color: 'bg-green-950/70', description: '（1927-2018）近代文明の陰で犠牲になった声なき声を拾い上げ、自然界のアニマ（魂）の交感と生者・死者の共生を探求した。', avatar: 'assets/ishimure_warhol.png', isPreStyled: true },
  { id: 'void_entity', face: 5, pos: 2, name: '虚無の声', role: '無名の存在', homeLocationId: 'void', flavor: '無言', color: 'bg-zinc-900', description: '名前を持たない純粋な非存在の擬人化。', avatar: null },
  { id: 'shadow', face: 5, pos: 3, name: '影', role: 'あなたの影', homeLocationId: 'mirror_abyss', flavor: '境界', color: 'bg-zinc-800', description: '抑圧されたもう一人の自分の真実。', avatar: null },
  { id: 'shinran', face: 5, pos: 4, name: '親鸞', role: '浄土真宗の開祖', homeLocationId: 'temple', flavor: '悪人正機', color: 'bg-zinc-800', isMainChar: true, description: '（1173-1262）法然の門下で他力本願を確立。弱き凡夫こそが救われる道を説いた。', avatar: 'assets/shinran_warhol.png', isPreStyled: true },
  { id: 'orikuchi', face: 5, pos: 12, name: '折口信夫', role: '歌人・民俗学者', homeLocationId: 'temple', flavor: '魂', color: 'bg-indigo-950/70', description: '（1887-1953）歌号は釈迢空。萬葉集を魂の体験として読み解き、「まれびと」や「たま」の概念を通じて日本文化の深層を掘り下げた。', avatar: 'assets/orikuchi_shinobu_warhol.png', isPreStyled: true },
  { id: 'trickster', face: 5, pos: 5, name: 'トリックスター', role: '道化', homeLocationId: 'neon', flavor: '混沌', color: 'bg-yellow-900/50', description: '秩序を破壊し、新たな可能性を創造する混沌の道化師。', avatar: null },
  { id: 'persona', face: 5, pos: 6, name: 'ペルソナ', role: '仮面', homeLocationId: 'theatre', flavor: '演技', color: 'bg-zinc-700', description: '社会に適応するために纏い続けた他人のための顔。', avatar: null },
  { id: 'itako_spirit', face: 5, pos: 7, name: 'イタコの霊', role: '口寄せ', homeLocationId: 'core', flavor: '媒介', color: 'bg-purple-950/50', description: '死者の声を現世に引き下ろす霊的な翻訳装置。', avatar: null },
  { id: 'end_being', face: 5, pos: 8, name: '終焉の者', role: '完了', homeLocationId: 'end', flavor: '完結', color: 'bg-zinc-900', description: '物語のエンディングを執行する絶対的な静止。', avatar: null },
  { id: 'mob_s', face: 5, pos: 9, name: '匿名S', role: '群衆', homeLocationId: 'neon', flavor: '流言', color: 'bg-zinc-800', description: '顔を持たない大衆の純粋なサンプル。匿名の狂気。', avatar: null },
  { id: 'mob_u', face: 5, pos: 10, name: '匿名U', role: '群衆', homeLocationId: 'market', flavor: '同調', color: 'bg-zinc-800', description: '善良という名の傍観者。無自覚な加担の肖像。', avatar: null },
  { id: 'narrator', face: 5, pos: 11, name: '語り手', role: '観測', homeLocationId: 'void', flavor: '情景', color: 'bg-transparent', description: '事実を散文詩として刻印していく、システムの冷徹な聲。', avatar: null },
];

export const AMBIENT_COLORS = {
  neutral: { color: '#000000', pattern: 'radial-gradient(circle, #111 2px, transparent 2px)' },
  serene: { color: '#051515', pattern: 'radial-gradient(circle at 50% 50%, #0a2a2a 0%, #000 80%)' },
  agitated: { color: '#1a0505', pattern: 'radial-gradient(ellipse at center, #300 0%, transparent 70%)' },
  melancholic: { color: '#0a0a15', pattern: 'linear-gradient(to bottom, #1a2a3a 1px, transparent 1px)' },
  joyful: { color: '#1a1505', pattern: 'radial-gradient(circle, #2a2005 2px, transparent 2px)' },
  chaotic: { color: '#0f0515', pattern: 'repeating-linear-gradient(45deg, #102 0, #102 1px, transparent 0, transparent 20px)' },
};
