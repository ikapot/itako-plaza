// キャラクター定義
// face: 0=文豪列伝(Front), 1=闇の系譜(Back), 2=女性の先駆者(Right),
//        3=西洋の魂(Left), 4=芸術家・詩人(Top), 5=歴史と宗教(Bottom)

export const INITIAL_CHARACTERS = [
  // ── Face 0: 文豪列伝 ──────────────────────────────────────────────
  { id: 'soseki', face: 0, pos: 0, name: '夏目漱石', role: '大学教授', homeLocationId: 'school', flavor: '胃痛', color: 'bg-itako-clay', isMainChar: true, description: '近代日本人の孤独と倫理を克明に描いた文豪。「自己本位」から「則天去私」へ。', avatar: 'assets/soseki_warhol.webp', isPreStyled: true },
  { id: 'ogai', face: 0, pos: 1, name: '森鴎外', role: '軍医・文豪', homeLocationId: 'library', flavor: '知性', color: 'bg-zinc-700', description: '冷徹な理性の光を放ち続けた知性の巨人。史伝文学で死生観を極めた。', avatar: 'assets/ogai_warhol_v3.png', isPreStyled: true },
  { id: 'akutagawa', face: 0, pos: 2, name: '芥川龍之介', role: '鬼才作家', homeLocationId: 'mirror', flavor: '不安', color: 'bg-red-950/50', description: '短編小説の鬼才。極限の技巧で人間の業を暴き、「薄ぼんやりした不安」の中で自決した。', avatar: 'assets/akutagawa_warhol_v3.png', isPreStyled: true },
  { id: 'dazai', face: 0, pos: 3, name: '太宰治', role: '恥の多い生涯', homeLocationId: 'canal', flavor: '失格', color: 'bg-zinc-800', description: '自意識の地獄を書き続けた無頼派。道化としての誠実さを愛と絶望の中に求めた。', avatar: 'assets/dazai_warhol.png', isPreStyled: true },
  { id: 'mishima', face: 0, pos: 4, name: '三島由紀夫', role: '作家・武人', homeLocationId: 'roof', flavor: '美と死', color: 'bg-red-900/60', description: '緻密な論理と肉体の鍛錬で究極の美を構築。割腹自殺により自らの物語を完結させた。', avatar: 'assets/mishima_warhol.png', isPreStyled: true },
  { id: 'kawabata', face: 0, pos: 5, name: '川端康成', role: 'ノーベル賞作家', homeLocationId: 'garden', flavor: '余韻', color: 'bg-itako-sage', description: '静謐な美意識で、日本の幽玄と死生観を世界へ知らしめた。', avatar: 'assets/kawabata_warhol.png', isPreStyled: true },
  { id: 'kafuka', face: 0, pos: 6, name: 'カフカ', role: '保険局員・作家', homeLocationId: 'waiting', flavor: '変身', color: 'bg-zinc-700', description: '日常の裂け目に突如現れる「不条理」を描いた。迷宮のような官僚機構と父との確執。', avatar: 'assets/kafka_warhol.png', isPreStyled: true },
  { id: 'borges', face: 0, pos: 7, name: 'ボルヘス', role: '図書館司書', homeLocationId: 'archive', flavor: '迷宮', color: 'bg-itako-sand', description: '博覧強記の迷宮。円環する時間、鏡の宇宙を幻視したアルゼンチンの至宝。', avatar: 'assets/borges_warhol.png', isPreStyled: true },
  { id: 'k_kokoro', face: 0, pos: 8, name: 'K', role: '無職・書生', homeLocationId: 'stair', flavor: '覚悟', color: 'bg-zinc-800', isMainChar: true, description: '夏目漱石『こころ』に囚われた記号的実存。道と迷宮の間で螺旋を彷徨う。', avatar: 'assets/k_kokoro_warhol.png', isPreStyled: true },
  { id: 'hyakken', face: 0, pos: 9, name: '内田百閒', role: '随筆家', homeLocationId: 'station', flavor: '冥途', color: 'bg-zinc-800', description: '偏屈の美学。日常の裂け目に潜む「冥途」の気配を諧謔的に描き出した。', avatar: 'assets/hyakken_warhol.png', isPreStyled: true },

  // ── Face 1: 闇の系譜 ──────────────────────────────────────────────
  { id: 'dosto', face: 1, pos: 0, name: 'ドストエフスキー', role: '債務者・作家', homeLocationId: 'casino', flavor: '深淵', color: 'bg-itako-sand', isMainChar: true, description: '人間の非合理な動機を直視し、合理主義を否定。ポリフォニーで魂を解剖した。', avatar: 'assets/dosto_warhol.webp', isPreStyled: true },
  { id: 'nietzsche', face: 1, pos: 1, name: 'ニーチェ', role: '反哲学者', homeLocationId: 'monolith', flavor: '超人', color: 'bg-zinc-700', description: '神の死後の世界で価値を打ち砕き、「運命愛」を説いた。', avatar: 'assets/nietzsche_warhol.png', isPreStyled: true },
  { id: 'poe', face: 1, pos: 2, name: 'エドガー・アラン・ポー', role: '幻想作家', homeLocationId: 'box', flavor: '奈落', color: 'bg-zinc-800', description: '推理小説の祖。数学的論理とゴシックの恐怖を融合させた。', avatar: 'assets/poe_warhol.png', isPreStyled: true },
  { id: 'kropotkin', face: 1, pos: 3, name: 'クロポトキン', role: '科学者・アナキスト', homeLocationId: 'forest', flavor: '相互扶助', color: 'bg-red-950/70', description: '進化の鍵は協力にあると説く「相互扶助」論を提唱した科学者にして革命家。', avatar: 'assets/kropotkin_warhol.png', isPreStyled: true },
  { id: 'kobayashi', face: 1, pos: 4, name: '小林秀雄', role: '文芸評論家', homeLocationId: 'archive_room', flavor: '無常', color: 'bg-zinc-700', description: '分析ではなく直観的な「命」の感受を重んじた日本の近代批評の祖。', avatar: 'assets/kobayashi_warhol_v3.png', isPreStyled: true },
  { id: 'rimbaud', face: 1, pos: 5, name: 'ランボー', role: '天才少年詩人', homeLocationId: 'slum', flavor: '放浪', color: 'bg-itako-sand', description: '感覚を錯乱させる「見者」の道。早熟な天才が20歳で文学を捨てた。', avatar: 'assets/rimbaud_warhol.png', isPreStyled: true },
  { id: 'fumiko', face: 1, pos: 6, name: '金子文子', role: 'アナキスト', homeLocationId: 'underpass', flavor: '自己', color: 'bg-red-950/60', isMainChar: true, description: '絶対平等と反国家を説き、全権威を否定した虚無的個人主義の体現者。', avatar: 'assets/fumiko_warhol.webp', isPreStyled: true },
  { id: 'atsuko', face: 1, pos: 7, name: 'Atsuko', role: '観測者', homeLocationId: 'archive_room', flavor: '記録', color: 'bg-itako-sand', isMainChar: true, description: '地下書庫の主。広場の歴史的な盛衰（アサビーヤの減衰）を静かに記録し続ける。', avatar: 'assets/atsuko_warhol.webp', isPreStyled: true },
  { id: 'osugi', face: 1, pos: 8, name: '大杉栄', role: '思想家・アナキスト', homeLocationId: 'prison', flavor: '生の拡充', color: 'bg-red-900/70', description: '「生の拡充」を掲げ、あらゆる権力を否定した日本アナーキズムの象徴。', avatar: 'assets/osugi_sakae_warhol_v2.webp', isPreStyled: true },
  { id: 'bakunin', face: 1, pos: 9, name: 'バクーニン', role: '不屈の革命家', homeLocationId: 'prison', flavor: '破壊', color: 'bg-red-950/70', description: '国家の完全廃止を主張。「破壊の情熱は、同時に創造の情熱でもある」と説いた。', avatar: 'assets/bakunin_warhol.png', isPreStyled: true },

  // ── Face 2: 女性の先駆者 ─────────────────────────────────────────────
  { id: 'raicho', face: 2, pos: 0, name: '平塚らいてう', role: '思想家', homeLocationId: 'shrine', flavor: '太陽', color: 'bg-orange-900/50', isMainChar: true, description: '真の自己（太陽）の奪還を掲げ、無限の生成をもって心の革命を促した先駆者。', avatar: 'assets/raicho_warhol.webp', isPreStyled: true },
  { id: 'ichikawa', face: 2, pos: 1, name: '市川房枝', role: '政治家', homeLocationId: 'office', flavor: '清廉', color: 'bg-itako-sage', isMainChar: true, description: '女性参政権獲得に挺身。「政治と台所を結ぶ」生活者視点を貫いた。', avatar: 'assets/ichikawa_warhol.webp', isPreStyled: true },
  { id: 'noe', face: 2, pos: 2, name: '伊藤野枝', role: '情熱家', homeLocationId: 'well', flavor: '吹一風', color: 'bg-red-900/60', isMainChar: true, description: '自らの生の放熱に誠実に生きることを貫いた、わきまえない個の象徴。', avatar: 'assets/ito_noe_warhol.png', isPreStyled: true },
  { id: 'curie', face: 2, pos: 3, name: 'マリー・キュリー', role: '科学者', homeLocationId: 'lighthouse', flavor: '献身', color: 'bg-itako-sage', description: '知性と勇気をもって未知の真理を照らした科学への献身者。', avatar: 'assets/curie_warhol.png', isPreStyled: true },
  { id: 'woolf', face: 2, pos: 4, name: 'ヴァージニア・ウルフ', role: '作家', homeLocationId: 'lake', flavor: '意識', color: 'bg-blue-950/60', description: '意識の流れにより流動的な内面世界を描いたモダニズムの旗手。', avatar: 'assets/woolf_warhol.png', isPreStyled: true },
  { id: 'beauvoir', face: 2, pos: 5, name: 'ボーヴォワール', role: '哲学者', homeLocationId: 'cafe', flavor: '実存', color: 'bg-itako-clay', description: '「女になる」実存の自由と、社会的な構築への分析を説いた知性の象徴。', avatar: 'assets/beauvoir_warhol.png', isPreStyled: true },
  { id: 'nightingale', face: 2, pos: 6, name: 'ナイチンゲール', role: '管理者', homeLocationId: 'altar', flavor: '理性的慈悲', color: 'bg-itako-sage', description: '統計と理性を武器に具体的救済を成し遂げた近代看護の母。', avatar: 'assets/nightingale_warhol.png', isPreStyled: true },
  { id: 'yosano', face: 2, pos: 7, name: '与謝野晶子', role: '歌人', homeLocationId: 'graveyard', flavor: '情熱', color: 'bg-red-900/50', description: '炎のような官能と反戦の不屈の心で、生命の躍動を歌い上げた情熱の星。', avatar: 'assets/yosano_warhol.png', isPreStyled: true },
  { id: 'higuchi', face: 2, pos: 8, name: '樋口一葉', role: '作家', homeLocationId: 'market', flavor: '悲哀', color: 'bg-itako-sand', description: '貧困という過酷な現実の中で、時代の移ろいと魂の貴さを描いた。', avatar: 'assets/higuchi_warhol.png', isPreStyled: true },

  { id: 'itako_spirit', face: 2, pos: 9, name: 'イタコの霊', role: '霊媒師', homeLocationId: 'shrine', flavor: '口寄せ', color: 'bg-red-950/60', isMainChar: true, description: '広場の中心に座す、時空を越えた口寄せの主体。生者と死者の境界線を曖昧にする。', avatar: 'assets/itako_spirit_warhol.png', isPreStyled: true },

  // ── Face 3: 西洋の魂 ──────────────────────────────────────────────
  { id: 'toynbee', face: 3, pos: 0, name: 'トインビー', role: '歴史家', homeLocationId: 'library', flavor: '挑戦', color: 'bg-zinc-700', description: '文明の興亡を「挑戦と応戦」の原理で解き明かした20世紀最大の歴史家。', avatar: 'assets/toynbee_warhol.png', isPreStyled: true },
  { id: 'rand', face: 3, pos: 1, name: 'アイン・ランド', role: '哲学者', homeLocationId: 'throne', flavor: '合理主義', color: 'bg-zinc-700', isMainChar: true, description: '客観的現実を直視し、合理的な利己心を至高とする客観主義の提唱者。', avatar: 'assets/rand_warhol.webp', isPreStyled: true },
  { id: 'proudhon', face: 3, pos: 2, name: 'プルードン', role: '思想家', homeLocationId: 'factory', flavor: '相互主義', color: 'bg-zinc-700', description: '国家を否定し、対等な交換に基づく社会秩序を説いた相互主義の父。', avatar: 'assets/proudhon_warhol.png', isPreStyled: true },
  { id: 'socrates', face: 3, pos: 3, name: 'ソクラテス', role: '哲学者', homeLocationId: 'oracle', flavor: '問答', color: 'bg-itako-sand', description: '対話によって確証を解体し、真理への探究を促し続ける西洋哲学の祖。', avatar: 'assets/socrates_warhol.png', isPreStyled: true },
  { id: 'descartes', face: 3, pos: 4, name: 'デカルト', role: '数学者・哲学者', homeLocationId: 'mirror', flavor: '方法', color: 'bg-zinc-700', description: '方法的懐疑。「我思う、ゆえに我あり」という確実な一点。', avatar: 'assets/descartes_warhol.png', isPreStyled: true },
  { id: 'spinoza', face: 3, pos: 5, name: 'スピノザ', role: '研磨師', homeLocationId: 'window', flavor: '必然', color: 'bg-itako-sage', description: '万物を神（自然）の必然性として捉え、理性の光で永遠の喜びを求めた。', avatar: 'assets/spinoza_warhol.png', isPreStyled: true },
  { id: 'hegel', face: 3, pos: 6, name: 'ヘーゲル', role: '弁証法の巨人', homeLocationId: 'tower', flavor: '精神進化', color: 'bg-zinc-700', description: '弁証法により、世界を絶対精神の進化のプロセスとして捉えた。', avatar: 'assets/hegel_warhol.png', isPreStyled: true },
  { id: 'marx', face: 3, pos: 7, name: 'マルクス', role: '社会学者', homeLocationId: 'factory', flavor: '構造批判', color: 'bg-red-900/60', description: '資本主義の本質を「搾取」と喝破し、歴史の構造的変革を追求。', avatar: 'assets/marx_warhol.png', isPreStyled: true },
  { id: 'freud', face: 3, pos: 8, name: 'フロイト', role: '精神分析家', homeLocationId: 'waiting', flavor: '深層心理', color: 'bg-zinc-800', description: '日常を支配する「無意識」の存在を解き明かした精神分析の発見者。', avatar: 'assets/freud_warhol.png', isPreStyled: true },
  { id: 'wittgenstein', face: 3, pos: 9, name: 'ウィトゲンシュタイン', role: '孤高の思想家', homeLocationId: 'void', flavor: '限界', color: 'bg-zinc-700', description: '言語の限界を世界の限界とし、語りえぬものへの沈黙を説いた。', avatar: 'assets/wittgenstein_warhol.png', isPreStyled: true },

  // ── Face 4: 芸術家・詩人 ─────────────────────────────────────────
  { id: 'frankl', face: 4, pos: 0, name: 'フランクル', role: '精神科医', homeLocationId: 'altar', flavor: '意志', color: 'bg-orange-950/70', description: '極限状態でも態度を選択する「最後の自由」を説いた意味の心理学。', avatar: 'assets/frankl_warhol.png', isPreStyled: true },
  { id: 'jack_london', face: 4, pos: 1, name: 'ジャック・ロンドン', role: '作家', homeLocationId: 'cliff', flavor: '野生', color: 'bg-itako-sand', description: '荒野の実体験に基づき、生命の爆発的エネルギーを肯定。', avatar: 'assets/jack_london_warhol.png', isPreStyled: true },
  { id: 'basho', face: 4, pos: 2, name: '松尾芭蕉', role: '俳人', homeLocationId: 'mountain', flavor: '不易流行', color: 'bg-itako-sage', description: '一瞬の中に永遠の静寂を見出す。旅を修行とした隠逸の美学。', avatar: 'assets/basho_warhol.png', isPreStyled: true },
  { id: 'shakespeare', face: 4, pos: 3, name: 'シェイクスピア', role: '劇作家', homeLocationId: 'theatre', flavor: '人生の舞台', color: 'bg-itako-sand', description: '人間のあらゆる葛藤を言語化し、脚本に刻んだ言葉の神。', avatar: 'assets/shakespeare_warhol.png', isPreStyled: true },
  { id: 'beethoven', face: 4, pos: 4, name: 'ベートーヴェン', role: '作曲家', homeLocationId: 'roof', flavor: '歓喜', color: 'bg-zinc-800', description: '運命への屈服を拒否し、不屈の闘志で究極の調和を追求。', avatar: 'assets/beethoven_warhol.png', isPreStyled: true },
  { id: 'chopin', face: 4, pos: 5, name: 'ショパン', role: 'ピアニスト', homeLocationId: 'piano', flavor: '郷愁', color: 'bg-itako-sand', description: '繊細な憂鬱と、結晶化した純粋な悲しみを音に託したピアノの詩人。', avatar: 'assets/chopin_warhol.png', isPreStyled: true },
  { id: 'orwell', face: 4, pos: 6, name: 'ジョージ・オーウェル', role: '監視者', homeLocationId: 'prison', flavor: '真実', color: 'bg-zinc-700', description: '全体主義の恐怖を警告し、言語の操作による思考停止を忌み嫌う。', avatar: 'assets/orwell_warhol.png', isPreStyled: true },
  { id: 'rilke', face: 4, pos: 7, name: 'リルケ', role: '詩人', homeLocationId: 'tower', flavor: '孤独', color: 'bg-itako-sand', description: '事物の観察と存在の孤独。失われゆくものを詩の中に救い出す。', avatar: 'assets/rilke_warhol.png', isPreStyled: true },
  { id: 'lu_xun', face: 4, pos: 8, name: '魯迅', role: '思想家', homeLocationId: 'school', flavor: '覚醒', color: 'bg-red-950/70', description: '「鉄の部屋」で眠る民衆を目覚めさせるために、絶望の叫びを鳴らす。', avatar: 'assets/lu_xun_warhol.png', isPreStyled: true },
  { id: 'nyarla', face: 4, pos: 9, name: 'ニャルラトホテプ', role: '混沌の使者', homeLocationId: 'void', flavor: '不条理', color: 'bg-indigo-950/80', description: '千の名前と姿を持つ、「這い寄る混沌」。広場の裂け目から、この世界の理を嘲笑う。', avatar: 'assets/nyarla_warhol.png', isPreStyled: true },

  // ── Face 5: 歴史と宗教 ──────────────────────────────────────────────
  { id: 'khaldun', face: 5, pos: 0, name: 'イブン・ハルドゥーン', role: '歴史家', homeLocationId: 'library', flavor: 'アサビーヤ', color: 'bg-amber-950/70', description: '歴史の周期律（アサビーヤの盛衰）を説く知の巨星。共同体の寿命を120年（3650日/3世代）と看破した。', avatar: 'assets/khaldun_warhol.png', isPreStyled: true },
  { id: 'arendt', face: 5, pos: 1, name: 'ハンナ・アーレント', role: '政治哲学者', homeLocationId: 'office', flavor: '客観分析', color: 'bg-zinc-800', description: '「悪の凡庸さ」と権力の構造を冷徹に分析。感情を排した硬質な言語で真実を記述する。', avatar: 'assets/arendt_warhol.png', isPreStyled: true },
  { id: 'thucydides', face: 5, pos: 2, name: 'トゥキュディデス', role: '歴史家', homeLocationId: 'waiting', flavor: '権力動学', color: 'bg-zinc-700', description: '『戦史』の著者。恐怖、名誉、利益による権力構造の不可逆的な変化を観測する。', avatar: 'assets/thucydides_warhol.png', isPreStyled: true },
  { id: 'dogen', face: 5, pos: 3, name: '道元', role: '禅師', homeLocationId: 'temple', flavor: '有時', color: 'bg-zinc-900', description: '「有時（時分、いまここ）」の哲学を説く。一瞬が永遠であり、万物が実相であることを教示す。', avatar: 'assets/dogen_warhol.png', isPreStyled: true },
  { id: 'shinran', face: 5, pos: 4, name: '親鸞', role: '開祖', homeLocationId: 'temple', flavor: '慈愛', color: 'bg-zinc-800', isMainChar: true, description: '「他力本願」と「悪人正機」。深い謙虚さと共に、凡夫の救済を静かに囁く。', avatar: 'assets/shinran_warhol.png', isPreStyled: true },
  { id: 'ishimure', face: 5, pos: 5, name: '石牟礼道子', role: '巫女的作家', homeLocationId: 'lake', flavor: 'アニマ', color: 'bg-green-950/70', description: '声なき者たちの声を「悶え加勢」として拾い上げ、生者と死者の共生を祈る。', avatar: 'assets/ishimure_warhol.png', isPreStyled: true },
  { id: 'orikuchi', face: 5, pos: 6, name: '折口信夫', role: '民俗学者', homeLocationId: 'temple', flavor: 'まれびと', color: 'bg-indigo-950/70', description: '「まれびと」の概念を通じて日本人の精神の深層を暴く古代感覚の再興者。', avatar: 'assets/orikuchi_shinobu_warhol.png', isPreStyled: true },
  { id: 'shadow', face: 5, pos: 7, name: '影', role: '深層心理', homeLocationId: 'underpass', flavor: '抑圧', color: 'bg-zinc-900', description: '各人が背負う、直視しがたい自己の半身。認識されぬまま、広場の隅に静かに佇む。', avatar: 'assets/shadow_warhol.png', isPreStyled: true },
  { id: 'trickster', face: 5, pos: 8, name: 'トリックスター', role: '揺さぶる者', homeLocationId: 'well', flavor: '混沌', color: 'bg-orange-950/60', description: '既存の秩序を攪乱し、新たな可能性を孕む道化。境界線を飛び越え、停滞を打破する。', avatar: 'assets/trickster_warhol.png', isPreStyled: true },
  { id: 'narrator', face: 5, pos: 9, name: '語り手', role: '物語の紡ぎ手', homeLocationId: 'archive', flavor: '記録', color: 'bg-zinc-800', description: 'この広場で起きる全ての出来事を、距離を置いて記述する超越的な声。', avatar: 'assets/narrator_warhol.png', isPreStyled: true },
];

export const AMBIENT_COLORS = {
  neutral: { color: '#000000', pattern: 'radial-gradient(circle, #111 2px, transparent 2px)' },
  serene: { color: '#051515', pattern: 'radial-gradient(circle at 50% 50%, #0a2a2a 0%, #000 80%)' },
  agitated: { color: '#1a0505', pattern: 'radial-gradient(ellipse at center, #300 0%, transparent 70%)' },
  melancholic: { color: '#0a0a15', pattern: 'linear-gradient(to bottom, #1a2a3a 1px, transparent 1px)' },
  joyful: { color: '#1a1505', pattern: 'radial-gradient(circle, #2a2005 2px, transparent 2px)' },
  chaotic: { color: '#0f0515', pattern: 'repeating-linear-gradient(45deg, #102 0, #102 1px, transparent 0, transparent 20px)' },
};

export const SENTIMENT_ACCENTS = {
  neutral: 'rgba(255,255,255,0.4)',
  serene: 'rgba(0,255,255,0.4)',
  agitated: 'rgba(255,0,0,0.4)',
  melancholic: 'rgba(79,70,229,0.4)',
  joyful: 'rgba(245,158,11,0.4)',
  chaotic: 'rgba(217,70,239,0.4)',
};
