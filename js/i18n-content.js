/* Localized game content is indexed by canonical source strings, never by mutating DATA. */
(function(){
  const langs=['en','ja','zh-Hans','zh-Hant','es','pt','ru'];
  const rows=`
$item:dmg:name|Enhanced Warheads|強化弾頭|强化弹头|強化彈頭|Ojivas mejoradas|Ogivas reforçadas|Усиленные боеголовки
$item:rof:name|Rapid-fire Module|高速連射モジュール|高速连射模块|高速連射模組|Módulo de disparo rápido|Módulo de tiro rápido|Модуль скорострельности
$item:reload:name|Autoloader|自動装填装置|自动装填机|自動裝填機|Cargador automático|Carregador automático|Автомат заряжания
$item:crit:name|Critical Scope|クリティカルスコープ|暴击瞄准镜|暴擊瞄準鏡|Mira crítica|Mira crítica|Критический прицел
$item:boots:name|Lightweight Boots|軽量機動ブーツ|轻型机动靴|輕型機動靴|Botas ligeras|Botas leves|Лёгкие ботинки
$item:heart:name|Bio-enhancement Fluid|生体強化点滴|生体强化液|生體強化液|Suero biológico|Soro biológico|Биологическая сыворотка
$item:armor:name|Force-field Generator|力場発生器|力场发生器|力場產生器|Generador de campo|Gerador de campo|Генератор силового поля
$item:pierce:name|Armor-piercing Rounds|徹甲弾|穿甲弹|穿甲彈|Balas perforantes|Munição perfurante|Бронебойные патроны
$item:vamp:name|Nano Repair Unit|ナノ修復装置|纳米修复器|奈米修復器|Reparador nanométrico|Reparador nano|Наноремонтный модуль
$item:homing:name|Homing Chipset|誘導チップセット|制导芯片组|導引晶片組|Chip de guiado|Chip de rastreamento|Чип наведения
$item:velo:name|Accelerated Warheads|加速弾頭|加速弹头|加速彈頭|Ojivas aceleradas|Ogivas aceleradas|Ускоренные боеголовки
$item:link:name|Tactical Data Link|戦術データリンク|战术数据链|戰術資料鏈|Enlace táctico|Link tático|Тактический канал данных
$item:thorn:name|Reactive Armor|反応装甲|反应装甲|反應裝甲|Blindaje reactivo|Blindagem reativa|Динамическая броня
$item:lucky:name|Lucky Tuna|幸運のツナ|幸运金枪鱼|幸運鮪魚|Atún de la suerte|Atum da sorte|Счастливый тунец
$item:bounce:name|Ricochet Circuit|跳弾回路|跳弹电路|跳彈迴路|Circuito de rebote|Circuito de ricochete|Схема рикошета
$item:split:name|Splitting Warheads|分裂弾頭|分裂弹头|分裂彈頭|Ojivas divisorias|Ogivas divisoras|Разделяющиеся боеголовки
$item:frost:name|Cryo Rounds|冷却弾|冷冻弹|冷凍彈|Balas criogénicas|Munição criogênica|Криопатроны
$item:drone:name|Support Drone|支援ドローン|支援无人机|支援無人機|Dron de apoyo|Drone de apoio|Дрон поддержки
$item:explo:name|Explosive Warheads|爆発弾頭|爆炸弹头|爆炸彈頭|Ojivas explosivas|Ogivas explosivas|Разрывные боеголовки
$item:orbit:name|Defense Satellites|防御衛星|防御卫星|防禦衛星|Satélites defensivos|Satélites de defesa|Защитные спутники
$item:adren:name|Adrenaline Injector|アドレナリン注入器|肾上腺素注射器|腎上腺素注射器|Inyector de adrenalina|Injetor de adrenalina|Адреналиновый инъектор
$item:echo:name|Echo-fire Module|残響射撃モジュール|回响射击模块|迴響射擊模組|Módulo de eco|Módulo de eco|Модуль эхо-огня
$item:magnet:name|Recovery Magnet|回収マグネット|回收磁铁|回收磁鐵|Imán recolector|Ímã coletor|Сборочный магнит
$item:chain:name|Chain Discharger|連鎖放電装置|连锁放电器|連鎖放電器|Descargador en cadena|Descarga em cadeia|Цепной разрядник
$item:berserk:name|Berserker Circuit|バーサーカー回路|狂战士电路|狂戰士迴路|Circuito berserker|Circuito berserker|Схема берсерка
$item:overclock:name|Overload Core|過負荷コア|过载核心|超載核心|Núcleo de sobrecarga|Núcleo de sobrecarga|Ядро перегрузки
$item:execute:name|Execution Protocol|処刑プロトコル|处决协议|處決協定|Protocolo de ejecución|Protocolo de execução|Протокол казни
$item:kinetic:name|Kinetic Converter|運動エネルギー変換器|动能转换器|動能轉換器|Conversor cinético|Conversor cinético|Кинетический преобразователь
$item:reserve:name|Reserve Ammo Depot|予備弾薬庫|备用弹药库|備用彈藥庫|Depósito de munición|Depósito de munição|Резервный боезапас
$item:medkit:name|First Aid Kit|応急処置キット|急救包|急救包|Botiquín|Kit de primeiros socorros|Аптечка
$item:ghost:name|Phase Dodge Unit|位相回避装置|相位闪避器|相位閃避器|Evasor de fase|Esquiva de fase|Фазовое уклонение
$item:crit:desc|Critical chance +15% (2× damage)|クリティカル率+15%（ダメージ2倍）|暴击率+15%（伤害2倍）|暴擊率+15%（傷害2倍）|Crítico +15% (daño ×2)|Crítico +15% (dano ×2)|Шанс крит. +15% (урон ×2)
$item:boots:desc|Movement speed +12%; shorter dodge cooldown|移動速度+12%、回避クールタイム短縮|移动速度+12%，缩短闪避冷却|移動速度+12%，縮短閃避冷卻|Movimiento +12%; menor recarga de esquiva|Movimento +12%; recarga de esquiva menor|Скорость +12%; быстрее восстановление уклонения
$item:heart:desc|Max health +50; fully heals|最大体力+50、全回復|最大生命+50，恢复全部生命|最大生命+50，恢復全部生命|Salud máxima +50; cura completa|Vida máxima +50; cura total|Макс. здоровье +50; полное лечение
$item:pierce:desc|All projectiles gain +1 pierce|全弾の貫通+1|所有弹丸穿透+1|所有彈丸貫穿+1|Penetración de proyectiles +1|Penetração de projéteis +1|Пробивание всех снарядов +1
$item:vamp:desc|6% chance to heal 25 on a kill|撃破時6%で体力25回復|击杀时6%概率恢复25生命|擊殺時6%機率恢復25生命|6% de curar 25 al matar|6% de curar 25 ao eliminar|6% шанс лечения 25 за убийство
$item:homing:desc|Projectiles home toward nearby enemies|弾が近くの敵を追尾|弹丸追踪附近敌人|彈丸追蹤附近敵人|Los proyectiles persiguen enemigos cercanos|Projéteis perseguem inimigos próximos|Снаряды наводятся на ближайших врагов
$item:velo:desc|Projectile speed +35%; increased range|弾速+35%、射程増加|弹速+35%，射程增加|彈速+35%，射程增加|Velocidad del proyectil +35%; más alcance|Velocidade do projétil +35%; mais alcance|Скорость снарядов +35%; дальность увеличена
$item:link:desc|Ultimate charge rate +50%|必殺技充填速度+50%|终极技能充能速度+50%|終極技能充能速度+50%|Carga de definitiva +50%|Carga da suprema +50%|Скорость заряда ультимативного навыка +50%
$item:thorn:desc|Taking damage triggers a shockwave that clears bullets|被弾時に敵弾を消す衝撃波|受击时释放冲击波并消除敌弹|受擊時釋放衝擊波並消除敵彈|Al recibir daño, una onda elimina balas|Ao sofrer dano, uma onda apaga balas|При попадании — ударная волна, уничтожающая пули
$item:lucky:desc|Parts +50%; better chest rarity|部品+50%、宝箱の等級上昇|零件+50%，宝箱品质提高|零件+50%，寶箱品質提高|Piezas +50%; mejores cofres|Peças +50%; baús melhores|Детали +50%; выше качество сундуков
$item:bounce:desc|Projectiles bounce off walls once|弾が壁で1回跳ね返る|弹丸撞墙反弹一次|彈丸撞牆反彈一次|Los proyectiles rebotan una vez|Projéteis ricocheteiam uma vez|Снаряды один раз отскакивают от стен
$item:split:desc|On impact, splits into 2 smaller projectiles|命中時に小弾2発へ分裂|命中时分裂成2枚小弹丸|命中時分裂成2枚小彈丸|Al impactar, se divide en 2 proyectiles|Ao acertar, divide em 2 projéteis|При попадании разделяется на 2 малых снаряда
$item:frost:desc|Slows hit enemies by 40% for 1.5 s|命中した敵を1.5秒間40%減速|命中敌人减速40%，持续1.5秒|命中敵人緩速40%，持續1.5秒|Ralentiza un 40% durante 1,5 s|Desacelera 40% por 1,5 s|Замедляет врагов на 40% на 1,5 с
$item:drone:desc|An orbiting drone automatically fires at nearby enemies|周回ドローンが近くの敵を自動射撃|环绕无人机自动攻击附近敌人|環繞無人機自動攻擊附近敵人|Un dron orbital dispara automáticamente|Um drone orbital atira automaticamente|Орбитальный дрон автоматически стреляет по врагам
$item:explo:desc|15% chance of an explosion on hit|命中時15%で小爆発|命中时15%概率小范围爆炸|命中時15%機率小範圍爆炸|15% de explosión al impactar|15% de explosão ao acertar|15% шанс взрыва при попадании
$item:orbit:desc|2 orbiting satellites erase enemy bullets|周回衛星2基が敵弾を消去|2颗环绕卫星消除接触的敌弹|2顆環繞衛星消除接觸的敵彈|2 satélites orbitales eliminan balas|2 satélites orbitais apagam balas|2 орбитальных спутника уничтожают пули
$item:adren:desc|Damage +35% for 2 s after dodging|回避直後2秒間ダメージ+35%|闪避后2秒内伤害+35%|閃避後2秒內傷害+35%|Daño +35% durante 2 s tras esquivar|Dano +35% por 2 s após esquivar|Урон +35% на 2 с после уклонения
$item:echo:desc|Every 6 shots, fires 2 extra fan-shaped projectiles|6発ごとに追加弾2発を扇状発射|每6次射击额外扇形发射2弹|每6次射擊額外扇形發射2彈|Cada 6 disparos, lanza 2 proyectiles extra|A cada 6 tiros, lança 2 projéteis extras|Каждые 6 выстрелов — ещё 2 снаряда веером
$item:magnet:desc|Pickup radius ×2; parts +25%|回収範囲2倍、部品+25%|拾取范围2倍，零件+25%|拾取範圍2倍，零件+25%|Radio de recogida ×2; piezas +25%|Raio de coleta ×2; peças +25%|Радиус сбора ×2; детали +25%
$item:chain:desc|15% chance to arc to a nearby enemy for 60% damage|命中時15%で近くの敵へ電撃（ダメージ60%）|命中时15%概率向附近敌人传导60%伤害|命中時15%機率向附近敵人傳導60%傷害|15% de descarga a otro enemigo (60% de daño)|15% de descarga em outro inimigo (60% do dano)|15% шанс разряда в соседнего врага (60% урона)
$item:berserk:desc|Damage +30% at half health or below|体力半分以下でダメージ+30%|生命不高于一半时伤害+30%|生命不高於一半時傷害+30%|Daño +30% con media salud o menos|Dano +30% com metade da vida ou menos|Урон +30% при здоровье не выше половины
$item:overclock:desc|Fire rate +25% for 3 s after a kill|撃破後3秒間連射速度+25%|击杀后3秒内射速+25%|擊殺後3秒內射速+25%|Cadencia +25% durante 3 s tras matar|Cadência +25% por 3 s após eliminar|Скорострельность +25% на 3 с после убийства
$item:execute:desc|Execute normal enemies below 15% HP; damage +20% to bosses below 30% HP|体力15%未満の通常敵を処刑、体力30%未満のボスへダメージ+20%|处决生命低于15%的普通敌人；对生命低于30%的首领伤害+20%|處決生命低於15%的普通敵人；對生命低於30%的首領傷害+20%|Ejecuta enemigos bajo 15% de salud; daño +20% a jefes bajo 30%|Executa inimigos abaixo de 15% de vida; dano +20% a chefes abaixo de 30%|Казнь обычных врагов ниже 15% здоровья; урон боссам ниже 30% здоровья +20%
$item:kinetic:desc|Damage +15% while moving|移動中ダメージ+15%|移动时伤害+15%|移動時傷害+15%|Daño +15% al moverse|Dano +15% em movimento|Урон +15% при движении
$item:reserve:desc|Refill supply weapons by 20% after clearing a room|区画制圧時に補給武器の弾薬20%補充|清理区域后补给武器弹药恢复20%|清理區域後補給武器彈藥恢復20%|Recupera 20% de munición al despejar salas|Recupera 20% de munição ao concluir salas|После зачистки комнаты: боезапас трофейного оружия +20%
$item:medkit:desc|Heal 25 after clearing a room if at half health or below|体力半分以下なら区画制圧時に25回復|清理区域时若生命不高于一半，恢复25生命|清理區域時若生命不高於一半，恢復25生命|Cura 25 al despejar una sala con media salud o menos|Cura 25 ao concluir sala com metade da vida ou menos|После зачистки: лечение 25 при здоровье не выше половины
$item:ghost:desc|Dodge invulnerability +50%; erases grazed bullets|回避無敵+50%、かすめた敵弾を消去|闪避无敌+50%，消除擦身敌弹|閃避無敵+50%，消除擦身敵彈|Invulnerabilidad de esquiva +50%; elimina balas rozadas|Invulnerabilidade de esquiva +50%; apaga balas próximas|Неуязвимость при уклонении +50%; удаляет задетые пули

$hero:brownie:skillDesc|[Detonate] 3 piercing aimed shots detonate status effects: suppression → stun, mark → blast, root → shatter. The last shot explodes.|[起爆] 貫通照準射撃3連発。制圧→気絶、標的→爆発、束縛→粉砕。最後の弾は着弾爆発。|[引爆] 3连发贯穿瞄准射击，引爆异常：压制→眩晕，标记→爆炸，定身→粉碎。末弹爆炸。|[引爆] 3連發貫穿瞄準射擊，引爆異常：壓制→暈眩，標記→爆炸，定身→粉碎。末彈爆炸。|[Detonar] 3 disparos perforantes: supresión → aturdimiento, marca → explosión, inmovilización → fractura. El último explota.|[Detonar] 3 tiros perfurantes: supressão → atordoamento, marca → explosão, imobilização → ruptura. O último explode.|[Подрыв] 3 пробивающих выстрела: подавление → оглушение, метка → взрыв, обездвиживание → раскол. Последний снаряд взрывается.
$secondary:brownie:desc|[Apply] Grenade at cursor: blast, knockback, stun, 5.5 s suppression, bullet clearing and lingering fire. Suppressed targets are staggered longer.|[付与] カーソルに手榴弾。爆発・ノックバック・気絶・5.5秒制圧・敵弾消去・残り火。制圧中の敵は長く気絶。|[施加] 向指针投雷：爆炸、击退、眩晕、压制5.5秒、清弹、余火。已被压制的敌人受到更强硬直。|[施加] 向游標投雷：爆炸、擊退、暈眩、壓制5.5秒、清彈、餘火。已被壓制的敵人受到更強硬直。|[Aplicar] Granada al cursor: explosión, empuje, aturdimiento, supresión 5,5 s, limpia balas y deja fuego. Mayor aturdimiento si hay supresión.|[Aplicar] Granada no cursor: explosão, repulsão, atordoamento, supressão 5,5 s, apaga balas e deixa fogo. Maior atordoamento em alvos suprimidos.|[Наложение] Граната к курсору: взрыв, отбрасывание, оглушение, подавление 5,5 с, удаление пуль и огонь. Подавленные враги оглушаются сильнее.
$hero:leprechaun:skillDesc|[Apply → Detonate] 3 s wide piercing barrage suppresses enemies and clears frontal bullets. The final volley staggers suppressed enemies in the cone.|[付与→起爆] 3秒間の貫通扇状乱射。制圧・前方敵弾消去。最後の一斉射撃が扇内の制圧敵を気絶させる。|[施加→引爆] 扇形贯穿扫射3秒，压制并消除前方敌弹。末轮齐射使扇形内被压制敌人硬直。|[施加→引爆] 扇形貫穿掃射3秒，壓制並消除前方敵彈。末輪齊射使扇形內被壓制敵人硬直。|[Aplicar → Detonar] Ráfaga perforante amplia durante 3 s: suprime y elimina balas frontales. La descarga final aturde a los suprimidos.|[Aplicar → Detonar] Rajada perfurante ampla por 3 s: suprime e apaga balas frontais. A descarga final atordoa alvos suprimidos.|[Наложение → Подрыв] 3 с пробивающего огня веером: подавление и удаление пуль впереди. Последний залп оглушает подавленных врагов.
$secondary:leprechaun:desc|[Apply] 2 s focused fire: fire rate ×2.5, damage +35%, unlimited ammo. Piercing suppressive shots root an enemy for 1 s after 6 hits; venting staggers suppressed targets.|[付与] 2秒集中射撃：連射2.5倍、ダメージ+35%、弾薬無限。貫通制圧弾6発命中で1秒束縛。終了時の排熱で制圧敵を気絶。|[施加] 集中射击2秒：射速2.5倍、伤害+35%、无限弹药。贯穿压制弹对同一敌人命中6次后定身1秒，结束排热使压制目标硬直。|[施加] 集中射擊2秒：射速2.5倍、傷害+35%、無限彈藥。貫穿壓制彈對同一敵人命中6次後定身1秒，結束排熱使壓制目標硬直。|[Aplicar] 2 s de fuego: cadencia ×2,5, daño +35%, munición infinita. Perfora y suprime; 6 impactos inmovilizan 1 s. La ventilación aturde a suprimidos.|[Aplicar] 2 s de fogo: cadência ×2,5, dano +35%, munição infinita. Perfura e suprime; 6 acertos imobilizam 1 s. A ventilação atordoa suprimidos.|[Наложение] Огонь 2 с: темп ×2,5, урон +35%, патроны не тратятся. Пробивание и подавление; 6 попаданий обездвиживают на 1 с. Сброс жара оглушает подавленных.
$hero:nymph:skillDesc|[Apply → Detonate] Bullet rain at the cursor suppresses and roots enemies. The final volley shatters previously rooted targets (+40%).|[付与→起爆] カーソルに弾雨。制圧・束縛し、最後の射撃が事前に束縛された敵を粉砕（+40%）。|[施加→引爆] 指针处落下弹雨并压制、定身。末轮齐射粉碎预先定身的目标（+40%）。|[施加→引爆] 游標處落下彈雨並壓制、定身。末輪齊射粉碎預先定身的目標（+40%）。|[Aplicar → Detonar] Lluvia de balas que suprime e inmoviliza. La última descarga fractura a los ya inmovilizados (+40%).|[Aplicar → Detonar] Chuva de balas que suprime e imobiliza. A última descarga rompe alvos já imobilizados (+40%).|[Наложение → Подрыв] Град пуль у курсора подавляет и обездвиживает. Последний залп раскалывает ранее обездвиженных (+40%).
$secondary:nymph:desc|[Detonate → Apply] 14 heavy piercing MG80 rounds. The last slug detonates suppression to stagger targets and roots the line for 1.5 s.|[起爆→付与] MG80重貫通弾14発。最後の弾が制圧を起爆して気絶させ、射線上を1.5秒束縛。|[引爆→施加] MG80重型贯穿弹14发，末弹引爆压制使敌人硬直，并沿线定身1.5秒。|[引爆→施加] MG80重型貫穿彈14發，末彈引爆壓制使敵人硬直，並沿線定身1.5秒。|[Detonar → Aplicar] 14 balas pesadas perforantes. La última detona supresión e inmoviliza la línea 1,5 s.|[Detonar → Aplicar] 14 balas pesadas perfurantes. A última detona supressão e imobiliza a linha por 1,5 s.|[Подрыв → Наложение] 14 тяжёлых пробивающих пуль. Последняя подрывает подавление и обездвиживает по линии на 1,5 с.
$hero:gnome:skillDesc|[Detonate] Shockwave and frontal barrier: 6 s, absorbs 2 hits. Every 5 blocked bullets launches a grenade at a marked enemy; the final blast detonates marks.|[起爆] 衝撃波と前方防壁（6秒・2回無効）。5発防ぐごとに標的へ榴弾。終了爆発で標的を起爆。|[引爆] 冲击波与前方屏障（6秒，抵挡2次受击）。每挡5弹向标记目标发射榴弹，结束爆炸引爆标记。|[引爆] 衝擊波與前方屏障（6秒，抵擋2次受擊）。每擋5彈向標記目標發射榴彈，結束爆炸引爆標記。|[Detonar] Onda y barrera frontal de 6 s que absorbe 2 golpes. Cada 5 balas bloqueadas lanza una granada a un marcado. Explosión final detona marcas.|[Detonar] Onda e barreira frontal de 6 s que absorve 2 acertos. A cada 5 balas bloqueadas lança granada em alvo marcado. Explosão final detona marcas.|[Подрыв] Ударная волна и фронтальный барьер на 6 с, блокирует 2 попадания. Каждые 5 пуль — граната по отмеченному врагу; финальный взрыв подрывает метки.
$secondary:gnome:desc|[Apply] Marking round at the cursor pulls in and staggers nearby enemies. Marks last 5 s (damage taken +50%).|[付与] カーソルへ標的弾。周囲を引き寄せて気絶、5秒標的（被ダメージ+50%）。|[施加] 指针处标记弹吸引周围敌人并造成硬直，标记5秒（受到伤害+50%）。|[施加] 游標處標記彈吸引周圍敵人並造成硬直，標記5秒（受到傷害+50%）。|[Aplicar] Bala al cursor: atrae y aturde enemigos cercanos; marca 5 s (daño recibido +50%).|[Aplicar] Bala no cursor: atrai e atordoa inimigos próximos; marca 5 s (dano recebido +50%).|[Наложение] Снаряд к курсору притягивает и оглушает врагов; метка 5 с (входящий урон +50%).
$hero:constantia:skillDesc|[Apply] Bori roots, marks and suppresses the cursor area for 4 s. Pushes and roots nearby enemies; interrupts boss patterns.|[付与] ボリがカーソル周辺を4秒束縛・標的・制圧。近くの敵を押し出して束縛。ボスの攻撃を中断。|[施加] 波利在指针周围定身、标记、压制4秒，击退并定身近身敌人，打断首领招式。|[施加] 波利在游標周圍定身、標記、壓制4秒，擊退並定身近身敵人，打斷首領招式。|[Aplicar] Bori inmoviliza, marca y suprime el área 4 s. Empuja a enemigos cercanos e interrumpe jefes.|[Aplicar] Bori imobiliza, marca e suprime a área por 4 s. Repele inimigos próximos e interrompe chefes.|[Наложение] Бори обездвиживает, отмечает и подавляет область на 4 с. Отталкивает ближних врагов и прерывает атаки боссов.
$secondary:constantia:desc|[Detonate] Depleted-uranium shot pierces up to 3 enemies. Rooted/marked targets take ×2 damage and a status blast; otherwise marks for 6.5 s. Critical chance 35%, critical damage ×1.8.|[起爆] 劣化ウラン弾が最大3体貫通。束縛・標的中はダメージ2倍と状態爆発、それ以外は6.5秒標的。クリティカル35%・1.8倍。|[引爆] 贫铀弹最多贯穿3敌。定身或标记目标承受2倍伤害并触发异常爆炸，否则标记6.5秒。暴击35%，倍率1.8。|[引爆] 貧鈾彈最多貫穿3敵。定身或標記目標承受2倍傷害並觸發異常爆炸，否則標記6.5秒。暴擊35%，倍率1.8。|[Detonar] Bala de uranio atraviesa hasta 3 enemigos. Daño ×2 y explosión a marcados/inmovilizados; de lo contrario marca 6,5 s. Crítico 35%, ×1,8.|[Detonar] Bala de urânio atravessa até 3 inimigos. Dano ×2 e explosão em marcados/imobilizados; caso contrário marca 6,5 s. Crítico 35%, ×1,8.|[Подрыв] Урановый снаряд пробивает до 3 врагов. Отмеченным/обездвиженным — урон ×2 и взрыв; остальным — метка 6,5 с. Крит. шанс 35%, урон ×1,8.
$hero:kheshig:skillDesc|[Detonate → Apply] Deployment shockwave detonates and reapplies marks. Resets secondary skill; 6 s of attack +40%, fire rate +30%, no ammo consumption, 1-hit guard; heals 25.|[起爆→付与] 配置衝撃波が標的を起爆して再付与。補助スキル即再使用。6秒間攻撃+40%、連射+30%、弾薬消費なし、1回防御、25回復。|[引爆→施加] 部署冲击波引爆并重新施加标记，重置辅助技能。6秒内攻击+40%、射速+30%、所有武器不耗弹、抵挡1击，恢复25生命。|[引爆→施加] 部署衝擊波引爆並重新施加標記，重設輔助技能。6秒內攻擊+40%、射速+30%、所有武器不耗彈、抵擋1擊，恢復25生命。|[Detonar → Aplicar] Onda detona y reaplica marcas. Reinicia secundaria. 6 s: ataque +40%, cadencia +30%, sin gasto de munición, bloquea 1 golpe; cura 25.|[Detonar → Aplicar] Onda detona e reaplica marcas. Reinicia secundária. 6 s: ataque +40%, cadência +30%, sem gasto de munição, bloqueia 1 acerto; cura 25.|[Подрыв → Наложение] Волна подрывает и обновляет метки, сбрасывает доп. навык. На 6 с: атака +40%, темп +30%, без расхода патронов, блок 1 удара; лечение 25.
$secondary:kheshig:desc|[Apply] 3 large CT-11 slugs; up to +28.5% damage at close range. Knockback and 4 s mark (damage taken +50%).|[付与] CT-11大型スラッグ3連射。至近距離で最大+28.5%。ノックバック、4秒標的（被ダメージ+50%）。|[施加] CT-11大型独头弹3连发，近距离伤害最多+28.5%，击退并标记4秒（受到伤害+50%）。|[施加] CT-11大型獨頭彈3連發，近距離傷害最多+28.5%，擊退並標記4秒（受到傷害+50%）。|[Aplicar] 3 balas grandes: hasta +28,5% de daño de cerca; empuje y marca 4 s (daño recibido +50%).|[Aplicar] 3 balas grandes: até +28,5% de dano de perto; repulsão e marca 4 s (dano recebido +50%).|[Наложение] 3 крупных пули CT-11: до +28,5% урона вблизи, отбрасывание и метка 4 с (входящий урон +50%).
$hero:blacklilith:skillDesc|[Detonate] 6 s escort: blocks 2 hits, attack +30%, auto aim, no ammo consumption. Drone absorbs bullets; every 1.2 s a shot staggers suppressed enemies.|[起爆] 6秒護衛：2回無効、攻撃+30%、自動照準、弾薬消費なし。ドローンが敵弾吸収、1.2秒ごとの射撃で制圧敵を気絶。|[引爆] 护卫6秒：抵挡2击、攻击+30%、自动瞄准、所有武器不耗弹。无人机吸收敌弹，每1.2秒射击使压制敌人硬直。|[引爆] 護衛6秒：抵擋2擊、攻擊+30%、自動瞄準、所有武器不耗彈。無人機吸收敵彈，每1.2秒射擊使壓制敵人硬直。|[Detonar] Escolta 6 s: bloquea 2 golpes, ataque +30%, autoapuntado, sin gasto de munición. Dron absorbe balas; cada 1,2 s aturde a suprimidos.|[Detonar] Escolta 6 s: bloqueia 2 acertos, ataque +30%, mira automática, sem gasto de munição. Drone absorve balas; a cada 1,2 s atordoa suprimidos.|[Подрыв] Охрана 6 с: блок 2 ударов, атака +30%, автонаведение, без расхода патронов. Дрон поглощает пули; каждые 1,2 с оглушает подавленных.
$secondary:blacklilith:desc|[Apply] 20 crossing dual-pistol shots suppress for 6.5 s. The final slugs stagger enemies suppressed before the cast.|[付与] 双拳銃の交差20連射、6.5秒制圧。最後の弾が発動前から制圧中の敵を気絶。|[施加] 双枪交叉20连发，压制6.5秒。末轮独头弹使施放前已被压制的敌人硬直。|[施加] 雙槍交叉20連發，壓制6.5秒。末輪獨頭彈使施放前已被壓制的敵人硬直。|[Aplicar] 20 disparos cruzados: supresión 6,5 s. Los últimos aturden a enemigos suprimidos antes del lanzamiento.|[Aplicar] 20 tiros cruzados: supressão 6,5 s. Os últimos atordoam inimigos suprimidos antes do uso.|[Наложение] 20 перекрёстных выстрелов, подавление 6,5 с. Последние оглушают врагов, подавленных до применения.
$hero:lrl:skillDesc|[Apply] Removes eye patch, charges light, then fires a giant red beam for 1.5 s (12 hits): 5 s blind and suppression, clears bullets and interrupts bosses.|[付与] 眼帯を外し光を溜め、赤い巨光線を1.5秒発射（12ヒット）。5秒暗闇・制圧、敵弾消去、ボス中断。|[施加] 摘下眼罩蓄光，发射巨大红色光束1.5秒（12次命中），致盲与压制5秒，清弹并打断首领。|[施加] 摘下眼罩蓄光，發射巨大紅色光束1.5秒（12次命中），致盲與壓制5秒，清彈並打斷首領。|[Aplicar] Carga y dispara un gran rayo rojo durante 1,5 s (12 impactos): ciega y suprime 5 s, elimina balas e interrumpe jefes.|[Aplicar] Carrega e dispara um raio vermelho por 1,5 s (12 acertos): cega e suprime 5 s, apaga balas e interrompe chefes.|[Наложение] Снимает повязку и выпускает красный луч на 1,5 с (12 ударов): ослепление и подавление 5 с, удаление пуль, прерывание боссов.
$secondary:lrl:desc|[Detonate] Swings Dragon Slayer, firing 3 piercing slashes that clear bullets. Blinded enemies guarantee a weak-point hit (×2.45, stun 1 s); weak-point hits halve cooldown.|[起爆] ドラゴンスレイヤーで貫通剣気3本、敵弾消去。暗闇の敵には必ず弱点（2.45倍・1秒気絶）。弱点時クールタイム半減。|[引爆] 挥动屠龙者发射3道贯穿剑气并清弹。致盲目标必定弱点（2.45倍，眩晕1秒），弱点命中使冷却减半。|[引爆] 揮動屠龍者發射3道貫穿劍氣並清彈。致盲目標必定弱點（2.45倍，暈眩1秒），弱點命中使冷卻減半。|[Detonar] 3 cortes perforantes limpian balas. Cegados reciben punto débil garantizado (×2,45, aturdimiento 1 s); reduce recarga a la mitad.|[Detonar] 3 cortes perfurantes apagam balas. Cegos recebem ponto fraco garantido (×2,45, atordoamento 1 s); reduz recarga pela metade.|[Подрыв] 3 пробивающие волны убирают пули. Ослеплённым гарантирован удар в слабость (×2,45, оглушение 1 с); перезарядка сокращается вдвое.
$hero:ramparion:skillDesc|An electromagnetic tornado restrains enemies ahead, then a giant lion charges. Glows gold, dashes through them and returns. Invulnerable during the cast.|電磁トルネードで前方の敵を拘束し、巨大な獅子が突進。黄金に輝き、閃光の貫通突進から帰還。発動中無敵。|电磁龙卷风束缚前方敌人，巨狮冲锋。全身金光，闪光贯穿突进后返回，施放期间无敌。|電磁龍捲風束縛前方敵人，巨獅衝鋒。全身金光，閃光貫穿突進後返回，施放期間無敵。|Un tornado electromagnético atrapa enemigos y un león gigante carga. Brilla en oro, atraviesa al enemigo y regresa. Invulnerable al usarlo.|Um tornado eletromagnético prende inimigos e um leão gigante avança. Brilha em ouro, atravessa os inimigos e retorna. Invulnerável durante o uso.|Электромагнитный вихрь удерживает врагов, затем мчится огромный лев. Золотое сияние, сквозной рывок и возврат. Неуязвимость во время применения.
$secondary:ramparion:desc|Hold to charge for up to 2 s; movement speed is 50% while holding. Release a piercing, knocking-back fire lion: up to ×2.4 size and ×2.5 damage. Cooldown starts on release.|最大2秒長押し充填、移動速度50%。放すと貫通・ノックバックの炎獅子。最大サイズ2.4倍・ダメージ2.5倍。発射後にクールタイム開始。|按住蓄力最多2秒，期间移速50%。松开释放贯穿击退的火狮，最大体积2.4倍、伤害2.5倍，释放后开始冷却。|按住蓄力最多2秒，期間移速50%。鬆開釋放貫穿擊退的火獅，最大體積2.4倍、傷害2.5倍，釋放後開始冷卻。|Mantén hasta 2 s; movimiento al 50%. Suelta un león de fuego perforante con empuje: tamaño hasta ×2,4 y daño ×2,5. Recarga desde el lanzamiento.|Segure até 2 s; movimento a 50%. Solte um leão de fogo perfurante: tamanho até ×2,4 e dano ×2,5, com repulsão. Recarga inicia ao soltar.|Заряд до 2 с; скорость движения 50%. Выпускает пробивающего огненного льва с отбрасыванием: размер до ×2,4, урон до ×2,5. Перезарядка начинается при выпуске.


$hero:brownie:desc|Balanced rifle and high mobility. Recommended for new commanders.|バランスの良いライフルと高機動。初めての指揮官におすすめ。|均衡的步枪与高机动，推荐新指挥官使用。|均衡的步槍與高機動，推薦新指揮官使用。|Rifle equilibrado y gran movilidad. Ideal para principiantes.|Rifle equilibrado e alta mobilidade. Ideal para iniciantes.|Сбалансированная винтовка и высокая подвижность. Подходит новичкам.
$hero:leprechaun:desc|High fire rate and sturdy health. Crushes enemies with bullet storms.|圧倒的な連射と頑丈な体力。弾幕で敵を圧倒する。|强大射速与坚实体力，以弹幕压制敌人。|強大射速與堅實體力，以彈幕壓制敵人。|Gran cadencia y resistencia. Abruma con tormentas de balas.|Alta cadência e resistência. Domina com chuvas de balas.|Высокий темп огня и живучесть. Подавляет врага шквалом пуль.
$hero:nymph:desc|MG80 fire support; suppressive barrages pin down enemies.|MG80の火力支援。制圧乱射で敵を足止めする。|MG80火力支援，以压制扫射限制敌人行动。|MG80火力支援，以壓制掃射限制敵人行動。|Apoyo con MG80; sus ráfagas inmovilizan enemigos.|Apoio com MG80; suas rajadas prendem inimigos.|Поддержка MG80; подавляющий обстрел сковывает врага.
$hero:kheshig:desc|A medic with an automatic shotgun: close-range firepower and first aid.|自動散弾銃を持つ衛生兵。近接火力と応急処置で生き抜く。|持自动霰弹枪的医护兵，依靠近战火力与急救生存。|持自動霰彈槍的醫護兵，依靠近戰火力與急救生存。|Médica con escopeta automática, potencia cercana y primeros auxilios.|Médica com escopeta automática, fogo próximo e primeiros socorros.|Медик с автоматическим дробовиком, ближним огнём и первой помощью.
$hero:gnome:desc|Grenade blasts clear groups. Watch the direct-hit trajectory.|榴弾の範囲攻撃で一掃。直撃判定に注意。|榴弹范围伤害清理群敌，注意直击轨迹。|榴彈範圍傷害清理群敵，注意直擊軌跡。|Las granadas eliminan grupos. Cuida los impactos directos.|Granadas eliminam grupos. Cuide dos acertos diretos.|Гранаты уничтожают группы. Следите за прямыми попаданиями.
$hero:constantia:desc|Powerful piercing precision fire. Every shot is lethal.|貫通する高威力精密射撃。一発一発が致命的。|高威力贯穿精准射击，每一发都致命。|高威力貫穿精準射擊，每一發都致命。|Tiro preciso, potente y perforante. Cada bala es letal.|Tiro preciso, potente e perfurante. Cada bala é letal.|Мощная пробивающая точная стрельба. Каждый выстрел смертелен.
$hero:blacklilith:desc|A master of dual pistols and escort, dancing through bullet storms.|双拳銃と護衛の達人。弾幕の中で舞うように戦う。|双枪与护卫大师，在弹幕中如舞蹈般战斗。|雙槍與護衛大師，在彈幕中如舞蹈般戰鬥。|Experta en dos pistolas y escolta; baila entre las balas.|Mestra das pistolas duplas e da escolta; dança entre balas.|Мастер парных пистолетов и охраны; танцует среди пуль.
$hero:lrl:desc|A self-proclaimed dark mage fighting with an axe and a sealed eye beam.|自称黒魔術師。斧と封印された眼のビームで戦う。|自称黑魔法师，以斧与封印之眼光束战斗。|自稱黑魔法師，以斧與封印之眼光束戰鬥。|Maga oscura autoproclamada; lucha con hacha y rayo ocular.|Autoproclamada maga das trevas; luta com machado e raio ocular.|Самопровозглашённый тёмный маг с топором и лучом из запечатанного глаза.
$hero:ramparion:desc|Huge frame and thick armor. Slow, but can weather almost anything.|巨大な体と分厚い装甲。遅いがあらゆる攻撃に耐える。|巨大身躯与厚重装甲，虽慢却能承受重击。|巨大身軀與厚重裝甲，雖慢卻能承受重擊。|Enorme y muy blindado. Lento, pero aguanta casi todo.|Enorme e blindado. Lento, mas resiste a quase tudo.|Огромный корпус и толстая броня. Медленный, но крайне стойкий.
빠르고 안정적인 연사|Fast, steady automatic fire|速く安定した連射|快速稳定连射|快速穩定連射|Disparo rápido y estable|Tiro rápido e estável|Быстрый устойчивый огонь
대용량 탄창, 흩뿌리는 탄막|Large magazine, wide bullet spray|大容量弾倉、広がる弾幕|大弹匣，散布弹幕|大彈匣，散布彈幕|Gran cargador, amplio fuego|Grande carregador, fogo amplo|Большой магазин, широкий разброс
착탄 시 광역 폭발|Area explosion on impact|着弾時に範囲爆発|命中后范围爆炸|命中後範圍爆炸|Explosión de área al impactar|Explosão em área ao acertar|Взрыв по площади при попадании
적 2명을 관통하는 고위력탄|High-power rounds pierce 2 enemies|高威力弾が敵2体を貫通|高威力弹穿透2名敌人|高威力彈貫穿2名敵人|Balas potentes atraviesan 2 enemigos|Balas potentes atravessam 2 inimigos|Мощные пули пробивают 2 врагов
근거리에서 압도적인 산탄|Devastating spread at close range|至近距離で強力な散弾|近距离强力散弹|近距離強力散彈|Perdigones devastadores de cerca|Dispersão devastadora de perto|Сокрушительная дробь вблизи
손목에 차는 에너지 블래스터, 빠른 재장전|Wrist-mounted energy blaster; quick reload|手首装着のエネルギー銃、高速装填|腕戴能量枪，快速装填|腕戴能量槍，快速裝填|Bláster de muñeca; recarga rápida|Blaster de pulso; recarga rápida|Наручный энергобластер; быстрая перезарядка
고속 관통탄 연사|Rapid high-velocity piercing rounds|高速貫通弾の連射|高速贯穿弹连射|高速貫穿彈連射|Balas rápidas y perforantes|Balas rápidas e perfurantes|Скоростные пробивающие пули
조준 방향의 적에게 연쇄 번개|Chain lightning toward aimed enemies|照準方向へ連鎖電撃|向瞄准方向释放连锁闪电|向瞄準方向釋放連鎖閃電|Rayos encadenados hacia la mira|Raios em cadeia na direção da mira|Цепная молния в направлении прицела
거대한 화염탄, 화상 지대 생성|Large fireball leaves a burning zone|巨大火炎弾、炎上地帯を生成|巨大火球形成燃烧区域|巨大火球形成燃燒區域|Gran bola de fuego deja llamas|Grande bola de fogo deixa chamas|Крупный огненный шар оставляет зону горения
일직선 상의 모든 적을 꿰뚫는 레일 사격|Rail shot pierces every enemy in a line|直線上の全敵を貫くレール射撃|轨道射击贯穿直线上所有敌人|軌道射擊貫穿直線上所有敵人|Disparo de riel atraviesa toda la línea|Tiro elétrico atravessa toda a linha|Выстрел пробивает всех врагов по линии
반동이 적은 관통 연사|Low-recoil piercing automatic fire|低反動の貫通連射|低后坐力贯穿连射|低後座力貫穿連射|Fuego perforante de poco retroceso|Fogo perfurante de baixo recuo|Пробивающий огонь с малой отдачей
압도적인 탄막, 긴 재장전|Overwhelming barrage; long reload|圧倒的弾幕、長いリロード|强大弹幕，装填较慢|強大彈幕，裝填較慢|Gran cortina de balas; recarga lenta|Chuva de balas; recarga lenta|Плотный шквал; долгая перезарядка
느리지만 넓은 폭발|Slow shots, wide explosions|低速だが広範囲の爆発|射速慢但爆炸范围大|射速慢但爆炸範圍大|Disparos lentos, grandes explosiones|Tiros lentos, grandes explosões|Медленные выстрелы, широкие взрывы
적 4명을 꿰뚫는 대물탄|Anti-materiel rounds pierce 4 enemies|対物弾が敵4体を貫通|反器材弹贯穿4名敌人|反器材彈貫穿4名敵人|Balas antimaterial atraviesan 4 enemigos|Balas antimaterial atravessam 4 inimigos|Крупнокалиберные пули пробивают 4 врагов
님프의 MG80 — 안정적인 지원 사격|Nymph’s MG80 — steady support fire|ニンフのMG80、安定した支援射撃|宁芙的MG80——稳定支援射击|寧芙的MG80——穩定支援射擊|MG80 de Nymph: apoyo estable|MG80 da Nymph: apoio estável|MG80 Нимфы — устойчивый огонь поддержки
연사가 되는 자동 산탄총|Fully automatic shotgun|連射可能な自動散弾銃|可连射的自动霰弹枪|可連射的自動霰彈槍|Escopeta totalmente automática|Escopeta totalmente automática|Полностью автоматический дробовик
빠르게 번갈아 쏘는 쌍권총|Fast alternating dual pistols|高速交互射撃の双拳銃|快速交替射击的双枪|快速交替射擊的雙槍|Pistolas de disparo alterno rápido|Pistolas de tiro alternado rápido|Быстрая попеременная стрельба из двух пистолетов
회전하며 날아가는 도끼 — 2회 관통 · 장전 없음|Spinning thrown axe — 2 pierces, no reload|回転して飛ぶ斧、2回貫通・装填不要|旋转飞斧——贯穿2次，无需装填|旋轉飛斧——貫穿2次，無須裝填|Hacha giratoria: 2 penetraciones, sin recarga|Machado giratório: 2 penetrações, sem recarga|Вращающийся топор — 2 пробивания, без перезарядки
폭발하는 마탄|Exploding magic projectile|爆発する魔弾|爆炸魔弹|爆炸魔彈|Proyectil mágico explosivo|Projétil mágico explosivo|Взрывной магический снаряд
손바닥에서 발사하는 사거리 7칸의 흰색 레이저|White palm laser with 7-tile range|掌から白いレーザー、射程7マス|掌心白色激光，射程7格|掌心白色雷射，射程7格|Láser blanco de palma, alcance 7|Laser branco da palma, alcance 7|Белый лазер из ладони, дальность 7 клеток
무거운 관통 포탄|Heavy piercing shells|重い貫通砲弾|重型贯穿炮弹|重型貫穿砲彈|Proyectiles pesados perforantes|Projéteis pesados perfurantes|Тяжёлые пробивающие снаряды
모든 피해|All damage|全ダメージ|所有伤害|所有傷害|Todo el daño|Todo o dano|Весь урон
궁극기 충전 속도|Ultimate charge rate|必殺技充填速度|终极充能速度|終極充能速度|Carga de definitiva|Carga da suprema|Скорость заряда ультимативного навыка
스킬 충전 속도|Skill charge rate|スキル充填速度|技能充能速度|技能充能速度|Carga de habilidad|Carga de habilidade|Скорость заряда навыка
확장 탄창|Extended Magazine|拡張弾倉|扩容弹匣|擴容彈匣|Cargador ampliado|Carregador estendido|Увеличенный магазин
회피 쿨타임|Dodge cooldown|回避クールタイム|闪避冷却|閃避冷卻|Recarga de esquiva|Recarga de esquiva|Восстановление уклонения
약점 확률|Weak-point chance|弱点確率|弱点概率|弱點機率|Probabilidad de punto débil|Chance de ponto fraco|Шанс удара в слабость
토네이도 속박|Tornado root|トルネード束縛|龙卷定身|龍捲定身|Inmovilización de tornado|Imobilização do tornado|Обездвиживание вихрем
효과|Effect|効果|效果|效果|Efecto|Efeito|Эффект
폭|Width|幅|宽度|寬度|Anchura|Largura|Ширина
대원 선택|Select unit|隊員選択|选择队员|選擇隊員|Elegir unidad|Escolher unidade|Выбор бойца
출격|Deploy|出撃|出击|出擊|Desplegar|Iniciar|Высадка
B2 도달 시 해금|Unlock at B2|B2到達で解放|抵达B2解锁|抵達B2解鎖|Se desbloquea en B2|Desbloqueia em B2|Открывается на B2
B4 도달 시 해금|Unlock at B4|B4到達で解放|抵达B4解锁|抵達B4解鎖|Se desbloquea en B4|Desbloqueia em B4|Открывается на B4


$perk:m_brownie:desc|All weapons/skills: +10% damage to suppressed, slowed or stunned targets; all weapons reload +8%.|全武器・スキル：制圧・減速・気絶中へのダメージ+10%、全武器装填速度+8%。|所有武器与技能：对压制、减速或眩晕目标伤害+10%；所有武器装填速度+8%。|所有武器與技能：對壓制、緩速或暈眩目標傷害+10%；所有武器裝填速度+8%。|Todas las armas/habilidades: daño +10% a suprimidos, ralentizados o aturdidos; recarga +8%.|Todas as armas/habilidades: dano +10% em suprimidos, lentos ou atordoados; recarga +8%.|Всё оружие/навыки: урон +10% подавленным, замедленным или оглушённым; скорость перезарядки +8%.
$perk:m_leprechaun:desc|All weapons/skills: +10% damage to suppressed targets; all magazines +10%.|全武器・スキル：制圧中へのダメージ+10%、全武器装弾数+10%。|所有武器与技能：对压制目标伤害+10%；所有武器弹匣+10%。|所有武器與技能：對壓制目標傷害+10%；所有武器彈匣+10%。|Todas las armas/habilidades: daño +10% a suprimidos; cargadores +10%.|Todas as armas/habilidades: dano +10% em suprimidos; carregadores +10%.|Всё оружие/навыки: урон +10% подавленным; ёмкость магазинов +10%.
$perk:m_nymph:desc|All weapons/skills: +12% damage to suppressed or rooted targets. Kills reduce dodge cooldown by 0.15 s (once per 0.5 s).|全武器・スキル：制圧・束縛中へのダメージ+12%。撃破で回避待機-0.15秒（0.5秒ごと）。|所有武器与技能：对压制或定身目标伤害+12%；击杀使闪避冷却减少0.15秒（每0.5秒一次）。|所有武器與技能：對壓制或定身目標傷害+12%；擊殺使閃避冷卻減少0.15秒（每0.5秒一次）。|Todas las armas/habilidades: daño +12% a suprimidos/inmovilizados. Matar reduce esquiva 0,15 s (cada 0,5 s).|Todas as armas/habilidades: dano +12% em suprimidos/imobilizados. Eliminar reduz esquiva 0,15 s (a cada 0,5 s).|Всё оружие/навыки: урон +12% подавленным/обездвиженным. Убийство сокращает уклонение на 0,15 с (раз в 0,5 с).
$perk:m_gnome:desc|All weapons/skills: +10% damage to marked targets. Killing marked enemies causes an 8-damage area blast (once per second).|全武器・スキル：標的へのダメージ+10%。標的撃破で周囲に8ダメージ爆発（1秒ごと）。|所有武器与技能：对标记目标伤害+10%；击杀标记敌人造成8伤害范围爆炸（每秒一次）。|所有武器與技能：對標記目標傷害+10%；擊殺標記敵人造成8傷害範圍爆炸（每秒一次）。|Todas las armas/habilidades: daño +10% a marcados. Matarlos causa una explosión de 8 de daño (cada segundo).|Todas as armas/habilidades: dano +10% em marcados. Eliminá-los causa explosão de 8 de dano (a cada segundo).|Всё оружие/навыки: урон +10% отмеченным. Их убийство вызывает взрыв с уроном 8 (раз в секунду).
$perk:m_constantia:desc|All weapons/skills: +16% damage to marked or rooted targets.|全武器・スキル：標的・束縛中へのダメージ+16%。|所有武器与技能：对标记或定身目标伤害+16%。|所有武器與技能：對標記或定身目標傷害+16%。|Todas las armas/habilidades: daño +16% a marcados o inmovilizados.|Todas as armas/habilidades: dano +16% em marcados ou imobilizados.|Всё оружие/навыки: урон +16% отмеченным или обездвиженным.
$perk:m_kheshig:desc|All weapons/skills: +12% damage to targets within 4 tiles.|全武器・スキル：距離4以内へのダメージ+12%。|所有武器与技能：对4格内目标伤害+12%。|所有武器與技能：對4格內目標傷害+12%。|Todas las armas/habilidades: daño +12% a objetivos a 4 casillas o menos.|Todas as armas/habilidades: dano +12% em alvos a até 4 espaços.|Всё оружие/навыки: урон +12% целям в пределах 4 клеток.
$perk:m_blacklilith:desc|All weapons/skills: +12% damage to suppressed targets or while escort is active.|全武器・スキル：制圧対象または護衛中ダメージ+12%。|所有武器与技能：对压制目标或护卫期间伤害+12%。|所有武器與技能：對壓制目標或護衛期間傷害+12%。|Todas las armas/habilidades: daño +12% a suprimidos o durante la escolta.|Todas as armas/habilidades: dano +12% em suprimidos ou durante a escolta.|Всё оружие/навыки: урон +12% подавленным или во время охраны.
$perk:m_lrl:desc|All weapons/skills: +16% damage to blinded targets.|全武器・スキル：暗闇の対象へのダメージ+16%。|所有武器与技能：对致盲目标伤害+16%。|所有武器與技能：對致盲目標傷害+16%。|Todas las armas/habilidades: daño +16% a objetivos cegados.|Todas as armas/habilidades: dano +16% em alvos cegos.|Всё оружие/навыки: урон +16% ослеплённым.
$perk:m_ramparion:desc|All weapons/skills: +12% damage within 3 tiles or to rooted/stunned targets.|全武器・スキル：距離3以内または束縛・気絶中へのダメージ+12%。|所有武器与技能：对3格内或定身、眩晕目标伤害+12%。|所有武器與技能：對3格內或定身、暈眩目標傷害+12%。|Todas las armas/habilidades: daño +12% a 3 casillas o menos, o a inmovilizados/aturdidos.|Todas as armas/habilidades: dano +12% a até 3 espaços, ou em imobilizados/atordoados.|Всё оружие/навыки: урон +12% в пределах 3 клеток или обездвиженным/оглушённым.
$perk:p_hp:desc|Max health +50; heals 50|最大体力+50、50回復|最大生命+50，恢复50生命|最大生命+50，恢復50生命|Salud máxima +50; cura 50|Vida máxima +50; cura 50|Макс. здоровье +50; лечение 50
$perk:p_armor:desc|Shield +1 (blocks one hit)|シールド+1（被弾1回無効）|护盾+1（抵挡1次伤害）|護盾+1（抵擋1次傷害）|Escudo +1 (bloquea un golpe)|Escudo +1 (bloqueia um acerto)|Щит +1 (блокирует 1 попадание)
$perk:p_chain:desc|Kills have a 40% chance to cause a damaging explosion|撃破時40%で周囲に爆発ダメージ|击杀时40%概率范围爆炸|擊殺時40%機率範圍爆炸|40% de explosión al matar|40% de explosão ao eliminar|40% шанс взрыва при убийстве
$perk:p_leech:desc|5% chance to heal 25 on a kill|撃破時5%で体力25回復|击杀时5%概率恢复25生命|擊殺時5%機率恢復25生命|5% de curar 25 al matar|5% de curar 25 ao eliminar|5% шанс лечения 25 при убийстве
$perk:p_rollReload:desc|Dodging instantly refills 30% of the equipped weapon's magazine|回避で装備武器の弾倉を30%即時補充|闪避立即补充当前武器30%弹匣|閃避立即補充當前武器30%彈匣|Esquivar recarga al instante el 30% del cargador|Esquivar recarrega na hora 30% do carregador|Уклонение мгновенно пополняет 30% магазина
$perk:p_rollBlast:desc|Dodge ends with a damaging, bullet-clearing shockwave|回避終了時に衝撃波、周囲にダメージと敵弾消去|闪避结束时释放冲击波，伤害周围敌人并清弹|閃避結束時釋放衝擊波，傷害周圍敵人並清彈|Esquivar termina con una onda que daña y elimina balas|Esquiva termina com onda que causa dano e apaga balas|В конце уклонения — волна урона и удаления пуль
$perk:p_last:desc|Damage +40% at 50 health or below|体力50以下でダメージ+40%|生命不高于50时伤害+40%|生命不高於50時傷害+40%|Daño +40% con 50 de salud o menos|Dano +40% com 50 de vida ou menos|Урон +40% при здоровье 50 или ниже
화력 강화|Firepower Boost|火力強化|火力强化|火力強化|Potencia mejorada|Poder de fogo|Усиление огня
속사 회로|Rapid-fire Circuit|速射回路|速射电路|速射迴路|Circuito de tiro rápido|Circuito de tiro rápido|Схема скорострельности
급속 장전|Quick Reload|高速装填|快速装填|快速裝填|Recarga rápida|Recarga rápida|Быстрая перезарядка
장갑 보강|Armor Reinforcement|装甲補強|装甲加固|裝甲加固|Refuerzo de blindaje|Reforço de blindagem|Усиление брони
정밀 조준|Precision Aim|精密照準|精密瞄准|精密瞄準|Puntería precisa|Mira precisa|Точное прицеливание
코어 링크|Core Link|コアリンク|核心链接|核心連結|Enlace de núcleo|Link de núcleo|Связь ядер
냉각 시스템|Cooling System|冷却システム|冷却系统|冷卻系統|Sistema de refrigeración|Sistema de resfriamento|Система охлаждения
보호막 생성기|Shield Generator|シールド発生器|护盾发生器|護盾產生器|Generador de escudo|Gerador de escudo|Генератор щита
연쇄 기폭|Chain Detonation|連鎖起爆|连锁引爆|連鎖引爆|Detonación en cadena|Detonação em cadeia|Цепной подрыв
흡혈 탄두|Vampiric Warheads|吸血弾頭|吸血弹头|吸血彈頭|Ojivas vampíricas|Ogivas vampíricas|Вампирические боеголовки
전술 재장전|Tactical Reload|戦術装填|战术装填|戰術裝填|Recarga táctica|Recarga tática|Тактическая перезарядка
회피 충격파|Dodge Shockwave|回避衝撃波|闪避冲击波|閃避衝擊波|Onda evasiva|Onda de esquiva|Волна уклонения
최후의 저항|Last Stand|最後の抵抗|背水一战|背水一戰|Última resistencia|Última resistência|Последний рубеж


소총탄|Rifle ammo|ライフル弾|步枪弹|步槍彈|Munición de rifle|Munição de rifle|Винтовочные патроны
소총|Rifle|ライフル|步枪|步槍|Rifle|Rifle|Винтовка
기관총 탄띠|Machine-gun belt|機関銃弾帯|机枪弹链|機槍彈鏈|Cinta de ametralladora|Cinta de metralhadora|Пулемётная лента
탄띠|Ammo belt|弾帯|弹链|彈鏈|Cinta|Cinta|Лента
산탄|Shells|散弾|霰弹|霰彈|Cartuchos|Cartuchos|Дробь
저격탄|Sniper ammo|狙撃弾|狙击弹|狙擊彈|Munición de francotirador|Munição de precisão|Снайперские патроны
저격|Sniper|狙撃|狙击|狙擊|Francotirador|Precisão|Снайпер
폭발탄|Explosive ammo|爆発弾|爆炸弹|爆炸彈|Munición explosiva|Munição explosiva|Разрывные патроны
폭발|Explosion|爆発|爆炸|爆炸|Explosión|Explosão|Взрыв
에너지 셀|Energy cell|エネルギーセル|能量电池|能量電池|Celda de energía|Célula de energia|Энергоячейка
에너지|Energy|エネルギー|能量|能量|Energía|Energia|Энергия
정밀 돌격소총|Precision Assault Rifle|精密アサルトライフル|精确突击步枪|精確突擊步槍|Rifle de asalto preciso|Rifle de assalto preciso|Точная штурмовая винтовка
자폭 드론|Suicide Drone|自爆ドローン|自爆无人机|自爆無人機|Dron suicida|Drone suicida|Дрон-камикадзе
오르카 격납고|Orca Hangar|オルカ格納庫|奥尔卡机库|奧爾卡機庫|Hangar Orca|Hangar Orca|Ангар «Орка»
철충 소굴|Iron Parasite Nest|鉄虫の巣窟|铁虫巢穴|鐵蟲巢穴|Nido de parásitos|Ninho de parasitas|Гнездо железных паразитов
지하 정비창|Underground Dock|地下整備場|地下维修厂|地下維修廠|Taller subterráneo|Oficina subterrânea|Подземный док
폐쇄 연구동|Sealed Laboratory|閉鎖研究棟|封闭研究楼|封閉研究樓|Laboratorio sellado|Laboratório selado|Закрытая лаборатория
외곽 방어선|Outer Defense Line|外郭防衛線|外围防线|外圍防線|Defensa exterior|Defesa externa|Внешняя линия обороны
철혈 사령부|Ironblood Command|鉄血司令部|铁血司令部|鐵血司令部|Comando Ironblood|Comando Ironblood|Командование «Железная кровь»
철충 무리의 군주|Lord of the Swarm|鉄虫群の主|铁虫之王|鐵蟲之王|Señor del enjambre|Senhor do enxame|Повелитель роя
파괴의 거신|Colossus of Destruction|破壊の巨神|毁灭巨神|毀滅巨神|Coloso de destrucción|Colosso da destruição|Колосс разрушения
처형 집행 기체|Execution Unit|処刑執行機|处刑执行机|處刑執行機|Unidad de ejecución|Unidade de execução|Казнящий модуль
심연의 포식자|Abyssal Predator|深淵の捕食者|深渊捕食者|深淵捕食者|Depredador del abismo|Predador do abismo|Хищник бездны
야간 강습 여왕체|Night Assault Queen|夜襲の女王|夜袭女王|夜襲女王|Reina del asalto nocturno|Rainha do ataque noturno|Королева ночного штурма
탐식하는 파괴자|Ravenous Destroyer|貪食の破壊者|贪食破坏者|貪食破壞者|Destructor voraz|Destruidor voraz|Ненасытный разрушитель
철혈 사령부 총사령관|Ironblood Commander-in-Chief|鉄血司令部総司令官|铁血总司令|鐵血總司令|Comandante de Ironblood|Comandante da Ironblood|Главнокомандующий «Железной крови»
탄막 사이의 빈틈을 찾아 회피하세요|Dodge through gaps in the bullet patterns.|弾幕の隙間を探して回避。|寻找弹幕空隙闪避。|尋找彈幕空隙閃避。|Esquiva por los huecos entre balas.|Esquive pelos espaços entre balas.|Уклоняйтесь в промежутки между пулями.
돌진 전 붉은 조준선을 주시하세요 · 좁혀 오는 고리는 빈틈으로|Watch red charge lines; use gaps in closing rings.|突進前の赤い線と、迫る輪の隙間に注意。|注意冲锋前红色瞄准线，从收缩弹环空隙闪避。|注意衝鋒前紅色瞄準線，從收縮彈環空隙閃避。|Vigila las líneas rojas y los huecos de los anillos.|Observe linhas vermelhas e espaços nos anéis.|Следите за красными линиями рывка и разрывами в кольцах.
돌진 예고선이 보이면 옆으로 구르세요|Roll sideways when the charge warning appears.|突進予告線が出たら横に回避。|出现冲锋预警线时向侧面翻滚。|出現衝鋒預警線時向側面翻滾。|Rueda a un lado al ver la línea de carga.|Role para o lado ao ver a linha de avanço.|При линии рывка перекатывайтесь в сторону.
유도탄은 강철 엄폐물 뒤로 끌어 떼어내세요|Lure homing shots behind steel cover.|誘導弾は鋼鉄の遮蔽物へ誘導。|将追踪弹引到钢铁掩体后方。|將追蹤彈引到鋼鐵掩體後方。|Lleva los misiles tras coberturas de acero.|Leve os mísseis atrás de coberturas de aço.|Отводите самонаводящиеся пули за стальные укрытия.
발밑에 깔리는 보랏빛 지뢰는 터지기 전에 벗어나세요|Move away from purple mines before they explode.|紫の地雷は爆発前に離れる。|脚下紫色地雷爆炸前离开。|腳下紫色地雷爆炸前離開。|Sal de las minas moradas antes de que exploten.|Saia das minas roxas antes de explodirem.|Уходите с фиолетовых мин до взрыва.
회전하는 십자 탄줄과 같은 방향으로 도세요|Circle in the same direction as the rotating crossfire.|回転する十字弾と同じ方向へ回る。|与旋转十字弹幕同向绕行。|與旋轉十字彈幕同向繞行。|Gira en el sentido de la cruz de balas.|Gire no mesmo sentido da cruz de balas.|Двигайтесь по направлению вращения перекрёстного огня.
최종 결전 — 보조 스킬과 회피로 탄막을 끊어내세요|Final battle: break through with secondary skills and dodges.|最終決戦：補助スキルと回避で突破。|最终决战：以辅助技能和闪避突破弹幕。|最終決戰：以輔助技能和閃避突破彈幕。|Batalla final: rompe el patrón con habilidades y esquivas.|Batalha final: rompa o padrão com habilidades e esquivas.|Финальная битва: прорывайте залпы навыками и уклонениями.
생체 강화|Bio Enhancement|生体強化|生体强化|生體強化|Mejora biológica|Melhoria biológica|Биоусиление
보급 열쇠|Supply Keys|補給の鍵|补给钥匙|補給鑰匙|Llaves de suministro|Chaves de suprimento|Ключи снабжения
초기 자금|Starting Funds|初期資金|初始资金|初始資金|Fondos iniciales|Fundos iniciais|Начальный капитал
스킬 예열|Skill Precharge|スキル予熱|技能预热|技能預熱|Precarga de habilidad|Pré-carga de habilidade|Предзаряд навыка
탄두 개량|Warhead Tuning|弾頭改良|弹头改良|彈頭改良|Mejora de ojiva|Melhoria de ogiva|Улучшение боеголовок
전개식 방어막|Deployable Shield|展開式シールド|展开式护盾|展開式護盾|Escudo desplegable|Escudo móvel|Развёртываемый щит
기동 보조 장치|Mobility Assist|機動補助装置|机动辅助装置|機動輔助裝置|Asistente de movilidad|Auxílio de mobilidade|Усилитель подвижности
보급망 확충|Supply Network|補給網拡張|扩建补给网|擴建補給網|Red de suministro|Rede de suprimentos|Сеть снабжения
전투 데이터 분석|Combat Analytics|戦闘データ分析|战斗数据分析|戰鬥資料分析|Análisis de combate|Análise de combate|Боевой анализ
강화 모듈 확장|Extra Upgrade Choice|強化選択拡張|强化模块扩展|強化模組擴展|Opción extra de mejora|Opção extra de melhoria|Дополнительный выбор улучшений
긴급 복구 프로토콜|Emergency Recovery|緊急復旧|紧急修复协议|緊急修復協定|Recuperación de emergencia|Recuperação de emergência|Аварийное восстановление
시작 체력|Starting health|開始体力|初始生命|初始生命|Salud inicial|Vida inicial|Начальное здоровье
시작 열쇠|Starting keys|開始鍵|初始钥匙|初始鑰匙|Llaves iniciales|Chaves iniciais|Начальные ключи
시작 부품|Starting parts|開始部品|初始零件|初始零件|Piezas iniciales|Peças iniciais|Начальные детали
시작 방어막|Starting shield|開始シールド|初始护盾|初始護盾|Escudo inicial|Escudo inicial|Начальный щит
경험치|Experience|経験値|经验|經驗|Experiencia|Experiência|Опыт
레벨업 선택지 4장|4 level-up choices|レベルアップ選択肢4枚|升级选项4张|升級選項4張|4 opciones al subir de nivel|4 opções ao subir de nível|4 варианта при повышении уровня
작전 불능 시 1회 부활 (체력 최대 100)|Revive once on defeat (up to 100 health)|戦闘不能時1回復活（体力最大100）|失去战斗能力时复活1次（生命最高100）|失去戰鬥能力時復活1次（生命最高100）|Revive una vez al caer (hasta 100 de salud)|Revive uma vez ao cair (até 100 de vida)|Одно воскрешение при поражении (до 100 здоровья)
추적 도탄|Homing Ricochet|追跡跳弾|追踪跳弹|追蹤跳彈|Rebote guiado|Ricochete guiado|Самонаводящийся рикошет
산개 관통|Piercing Split|拡散貫通|散射穿透|散射貫穿|División perforante|Divisão perfurante|Пробивающее разделение
전술 편대|Tactical Squadron|戦術編隊|战术编队|戰術編隊|Escuadrón táctico|Esquadrão tático|Тактическая эскадрилья
취약 노출|Expose Weakness|弱点露出|暴露弱点|暴露弱點|Exponer debilidad|Expor fraqueza|Раскрытие слабости
반응 역장|Reactive Field|反応力場|反应力场|反應力場|Campo reactivo|Campo reativo|Реактивное поле
레일 탄두|Rail Warheads|レール弾頭|轨道弹头|軌道彈頭|Ojivas de riel|Ogivas elétricas|Рельсовые боеголовки
처형 사격|Execution Shot|処刑射撃|处决射击|處決射擊|Disparo ejecutor|Tiro executor|Казнящий выстрел
피의 연사|Bloody Barrage|血の連射|血之连射|血之連射|Ráfaga sangrienta|Rajada sangrenta|Кровавый шквал
연쇄 폭발|Chain Explosion|連鎖爆発|连锁爆炸|連鎖爆炸|Explosión en cadena|Explosão em cadeia|Цепной взрыв
역장 위성|Field Satellites|力場衛星|力场卫星|力場衛星|Satélites de campo|Satélites de campo|Спутники силового поля
질풍|Gale|疾風|疾风|疾風|Vendaval|Vendaval|Шквал
초전도|Superconductor|超伝導|超导|超導|Superconductor|Supercondutor|Сверхпроводник
응급 수복|Emergency Repair|応急修復|紧急修复|緊急修復|Reparación de emergencia|Reparo de emergência|Аварийный ремонт
관성 사격|Kinetic Fire|慣性射撃|惯性射击|慣性射擊|Disparo cinético|Tiro cinético|Кинетический огонь
튕긴 탄환이 적을 향해 꺾이고, 두 번 튕김|Ricochets home on enemies and bounce twice|跳弾が敵を追尾、2回反射|跳弹追踪敌人，可反弹两次|跳彈追蹤敵人，可反彈兩次|Rebotes guiados; rebotan dos veces|Ricochetes guiados; rebatem duas vezes|Рикошеты наводятся и отскакивают дважды
갈라진 탄환도 적을 관통|Split projectiles also pierce enemies|分裂弾も貫通|分裂弹也能穿透|分裂彈也能貫穿|Los proyectiles divididos también perforan|Projéteis divididos também perfuram|Разделённые снаряды тоже пробивают
드론 연사 속도 2배|Drone fire rate ×2|ドローン連射2倍|无人机射速2倍|無人機射速2倍|Cadencia del dron ×2|Cadência do drone ×2|Темп огня дрона ×2
둔화된 적에게 치명타 확률 +25%|Critical chance +25% against slowed enemies|減速中の敵へクリティカル率+25%|对减速敌人暴击率+25%|對緩速敵人暴擊率+25%|Crítico +25% contra ralentizados|Crítico +25% contra lentos|Шанс крит. +25% по замедленным
방어막이 깨질 때 큰 충격파|Large shockwave when a shield breaks|シールド破壊時に大きな衝撃波|护盾破裂时释放大型冲击波|護盾破裂時釋放大型衝擊波|Gran onda al romperse el escudo|Grande onda ao quebrar o escudo|Мощная волна при разрушении щита
치명타 피해 2배 → 2.6배|Critical damage ×2 → ×2.6|クリティカル2倍→2.6倍|暴击伤害2倍→2.6倍|暴擊傷害2倍→2.6倍|Daño crítico ×2 → ×2,6|Dano crítico ×2 → ×2,6|Крит. урон ×2 → ×2,6
흡혈 확률 2배|Lifesteal chance ×2|吸血確率2倍|吸血概率2倍|吸血機率2倍|Probabilidad de robo de vida ×2|Chance de roubo de vida ×2|Шанс вампиризма ×2
폭발 확률 30%, 갈라진 탄도 폭발|Explosion chance 30%; split projectiles also explode|爆発確率30%、分裂弾も爆発|爆炸概率30%，分裂弹也爆炸|爆炸機率30%，分裂彈也爆炸|Explosión 30%; proyectiles divididos también explotan|Explosão 30%; projéteis divididos também explodem|Шанс взрыва 30%; разделённые снаряды тоже взрываются
위성 3기, 더 넓은 소거 범위|3 satellites with a wider clearing radius|衛星3基、消去範囲拡大|3颗卫星，清弹范围扩大|3顆衛星，清彈範圍擴大|3 satélites y mayor radio|3 satélites e maior raio|3 спутника с увеличенным радиусом
회피 직후 연사 속도도 +30%|Also fire rate +30% just after dodging|回避直後は連射速度も+30%|闪避后射速也+30%|閃避後射速也+30%|Cadencia +30% tras esquivar|Cadência +30% após esquivar|Также темп огня +30% после уклонения
전격 확률 30%, 전격을 맞은 적도 둔화|Arc chance 30%; shocked enemies are also slowed|電撃確率30%、感電敵も減速|电击概率30%，电击目标也减速|電擊機率30%，電擊目標也緩速|Descarga 30%; también ralentiza|Descarga 30%; também desacelera|Шанс разряда 30%; поражённые также замедляются
응급 처치 키트가 체력 50 회복, 체력 조건 없음|First aid heals 50, with no health requirement|応急処置は50回復、体力条件なし|急救包恢复50生命，无生命条件限制|急救包恢復50生命，無生命條件限制|Botiquín cura 50 sin requisito de salud|Kit cura 50 sem condição de vida|Аптечка лечит 50 без условия по здоровью
이동 중 피해 +15% → +30%|Moving damage +15% → +30%|移動中ダメージ+15%→+30%|移动伤害+15%→+30%|移動傷害+15%→+30%|Daño en movimiento +15% → +30%|Dano em movimento +15% → +30%|Урон в движении +15% → +30%


오르카 연구소|Orca Research Lab|オルカ研究所|奥尔卡研究所|奧爾卡研究所|Laboratorio Orca|Laboratório Orca|Лаборатория «Орка»
데이터 칩으로 영구 강화|Permanent upgrades with data chips|データチップで永久強化|用数据芯片永久强化|用資料晶片永久強化|Mejoras permanentes con chips|Melhorias permanentes com chips|Постоянные улучшения за чипы
보유 데이터 칩|Data chips owned|所持データチップ|持有数据芯片|持有資料晶片|Chips disponibles|Chips disponíveis|Имеющиеся чипы
출격할 때마다 획득: 도달 층 ×12 · 보스 격파 ×15 · 제압 구역 ×2 · 처치 6마리당 1 · 작전 성공 +30|Earn each run: floor ×12 · bosses ×15 · rooms ×2 · 1 per 6 kills · victory +30|毎出撃：階×12・ボス×15・区画×2・6撃破ごと1・成功+30|每次出击：楼层×12 · 首领×15 · 区域×2 · 每6次击杀1 · 成功+30|每次出擊：樓層×12 · 首領×15 · 區域×2 · 每6次擊殺1 · 成功+30|Por partida: piso ×12 · jefes ×15 · salas ×2 · 1 por 6 bajas · victoria +30|Por partida: andar ×12 · chefes ×15 · salas ×2 · 1 por 6 abates · vitória +30|За операцию: этаж ×12 · боссы ×15 · комнаты ×2 · 1 за 6 убийств · победа +30
재출격|Redeploy|再出撃|重新出击|重新出擊|Volver a desplegar|Iniciar novamente|Повторная высадка
전투 보고|Combat Report|戦闘報告|战斗报告|戰鬥報告|Informe de combate|Relatório de combate|Боевой отчёт
두 장비를 함께 얻으면 발동|Activates when both items are owned|両装備の所持で発動|同时持有两件装备时激活|同時持有兩件裝備時啟動|Se activa con ambos objetos|Ativa com ambos os itens|Активируется при наличии обоих предметов
가로|Landscape|横向き|横屏|橫向|Horizontal|Horizontal|Альбомная
세로|Portrait|縦向き|竖屏|直向|Vertical|Vertical|Портретная
건너뛰기|Skip|スキップ|跳过|跳過|Omitir|Pular|Пропустить
사용 가능|Ready|使用可能|可使用|可使用|Disponible|Disponível|Доступно
준비 완료|Ready|準備完了|准备就绪|準備就緒|Listo|Pronto|Готово
충전|Charge|充填|充能|充能|Carga|Carga|Заряд
발동 중|Active|発動中|生效中|生效中|Activo|Ativo|Активно
발동|Active|発動|激活|啟動|Activación|Ativação|Активация
종료|End|終了|结束|結束|Fin|Fim|Конец
경과|Elapsed|経過|经过|經過|Transcurrido|Decorrido|Прошло
남은|Remaining|残り|剩余|剩餘|Restante|Restante|Осталось
현재|Current|現在|当前|目前|Actual|Atual|Текущий
선택 항목 기본값|Reset selected element|選択項目を初期化|重置所选项目|重設所選項目|Restablecer selección|Redefinir seleção|Сбросить выбранный элемент
전체 기본값|Reset all|すべて初期化|全部重置|全部重設|Restablecer todo|Redefinir tudo|Сбросить всё
미연구|Not researched|未研究|未研究|未研究|Sin investigar|Não pesquisado|Не исследовано
연구 완료|Research complete|研究完了|研究完成|研究完成|Investigación completa|Pesquisa concluída|Исследовано
신규 개방|New unlock|新規解放|新解锁|新解鎖|Nuevo desbloqueo|Novo desbloqueio|Новое открытие
통계|Statistics|統計|统计|統計|Estadísticas|Estatísticas|Статистика
레벨|Level|レベル|等级|等級|Nivel|Nível|Уровень
시간|Time|時間|时间|時間|Tiempo|Tempo|Время
누적 처치|Total kills|累計撃破|累计击杀|累計擊殺|Bajas totales|Abates totais|Всего убийств
처치|Kills|撃破|击杀|擊殺|Bajas|Abates|Убийства
격파|Defeated|撃破|击败|擊敗|Derrotado|Derrotado|Побеждено
버림|Dropped|破棄|已丢弃|已丟棄|Soltado|Largado|Выброшено
선택|Select|選択|选择|選擇|Elegir|Escolher|Выбрать
통로|Corridor|通路|通道|通道|Pasillo|Corredor|Коридор
도전 구역|Challenge Room|挑戦区画|挑战区域|挑戰區域|Sala de desafío|Sala de desafio|Комната испытания
도전 성공|Challenge complete|挑戦成功|挑战成功|挑戰成功|Desafío completado|Desafio concluído|Испытание пройдено
도전 실패 — 시간 초과|Challenge failed — time up|挑戦失敗、時間切れ|挑战失败——时间结束|挑戰失敗——時間結束|Desafío fallido: tiempo agotado|Desafio falhou: tempo esgotado|Испытание провалено — время вышло
도전|Challenge|挑戦|挑战|挑戰|Desafío|Desafio|Испытание
버티기|Survive|耐久|生存|生存|Sobrevivir|Sobreviver|Выживание
섬멸|Eliminate|殲滅|歼灭|殲滅|Eliminar|Eliminar|Уничтожение
보급 창고|Supply Room|補給庫|补给仓库|補給倉庫|Almacén|Depósito|Склад снабжения
보스 구역|Boss Room|ボス区画|首领区域|首領區域|Sala del jefe|Sala do chefe|Комната босса
라비아타 상점|Labiata’s Shop|ラビアタの店|拉比亚塔商店|拉比亞塔商店|Tienda de Labiata|Loja da Labiata|Магазин Лабиаты
상자 열기|Open chest|宝箱を開く|打开宝箱|打開寶箱|Abrir cofre|Abrir baú|Открыть сундук
무기 획득|Weapon acquired|武器獲得|获得武器|獲得武器|Arma obtenida|Arma obtida|Получено оружие
장비 획득|Item acquired|装備獲得|获得装备|獲得裝備|Objeto obtenido|Item obtido|Получен предмет
두 번째 무기|Second weapon|2つ目の武器|第二把武器|第二把武器|Segunda arma|Segunda arma|Второе оружие
사용 무기|Weapons used|使用武器|使用武器|使用武器|Armas usadas|Armas usadas|Использованное оружие
무기 슬롯|Weapon slots|武器スロット|武器栏位|武器欄位|Espacios de armas|Espaços de armas|Ячейки оружия
탄약 상자|Ammo box|弾薬箱|弹药箱|彈藥箱|Caja de munición|Caixa de munição|Ящик патронов
탄약 소진|Ammo depleted|弾薬切れ|弹药耗尽|彈藥耗盡|Munición agotada|Munição esgotada|Боезапас исчерпан
열쇠 획득|Key acquired|鍵獲得|获得钥匙|獲得鑰匙|Llave obtenida|Chave obtida|Получен ключ
열쇠가 필요합니다|A key is required|鍵が必要です|需要钥匙|需要鑰匙|Se necesita una llave|É necessária uma chave|Нужен ключ
기본 무기는 버릴 수 없습니다|The starting weapon cannot be dropped|初期武器は捨てられません|无法丢弃初始武器|無法丟棄初始武器|No puedes soltar el arma inicial|Não pode largar a arma inicial|Начальное оружие нельзя выбросить
부품이 부족합니다|Not enough parts|部品が足りません|零件不足|零件不足|Faltan piezas|Peças insuficientes|Недостаточно деталей
부품 부족|Not enough parts|部品不足|零件不足|零件不足|Faltan piezas|Peças insuficientes|Недостаточно деталей
맞는 무기가 없습니다|No matching weapon|対応武器がありません|没有对应武器|沒有對應武器|No hay arma compatible|Nenhuma arma compatível|Нет подходящего оружия
해당 무기의 탄약이 가득합니다|Matching weapon ammo is full|対応武器の弾薬は満タン|对应武器弹药已满|對應武器彈藥已滿|La munición compatible está llena|A munição compatível está cheia|Боезапас подходящего оружия полон
더 가까이 다가가세요|Move closer|もっと近づいてください|请靠近一些|請靠近一些|Acércate|Aproxime-se|Подойдите ближе
버릴 무기로 교체하세요|Switch to the weapon to drop|捨てる武器に切り替えてください|切换到要丢弃的武器|切換到要丟棄的武器|Cambia al arma que quieras soltar|Troque para a arma que quer largar|Выберите оружие для выбрасывания
없음|None|なし|无|無|Ninguno|Nenhum|Нет
전 구역 클리어|All rooms cleared|全区画制圧|所有区域已清理|所有區域已清理|Todas las salas despejadas|Todas as salas concluídas|Все комнаты зачищены
구역 제압 완료|Room cleared|区画制圧完了|区域清理完成|區域清理完成|Sala despejada|Sala concluída|Комната зачищена
교전 중에는 이동할 수 없습니다|Cannot teleport during combat|交戦中は移動できません|战斗中无法传送|戰鬥中無法傳送|No puedes teletransportarte en combate|Não pode teleportar em combate|Нельзя телепортироваться во время боя
클리어한 구역으로만 이동할 수 있습니다|Teleport only to cleared rooms|制圧済み区画のみ移動可能|只能传送到已清理区域|只能傳送到已清理區域|Solo a salas despejadas|Só para salas concluídas|Только в зачищенные комнаты
전술 지도 열기|Open tactical map|戦術マップを開く|打开战术地图|打開戰術地圖|Abrir mapa táctico|Abrir mapa tático|Открыть тактическую карту
보조 버튼|Secondary button|補助ボタン|辅助按钮|輔助按鈕|Botón secundario|Botão secundário|Кнопка доп. навыка
스킬 버튼|Ultimate button|必殺技ボタン|终极按钮|終極按鈕|Botón de definitiva|Botão de suprema|Кнопка ультимативного навыка
줍기 버튼|Pick-up button|拾うボタン|拾取按钮|拾取按鈕|Botón de recoger|Botão de pegar|Кнопка подбора
지도 · 메뉴|Map · menu|マップ・メニュー|地图 · 菜单|地圖 · 選單|Mapa · menú|Mapa · menu|Карта · меню
키보드 · 마우스|Keyboard · mouse|キーボード・マウス|键盘 · 鼠标|鍵盤 · 滑鼠|Teclado · ratón|Teclado · mouse|Клавиатура · мышь
왼쪽 / 오른쪽 스틱|Left / right stick|左／右スティック|左／右摇杆|左／右搖桿|Stick izquierdo / derecho|Analógico esquerdo / direito|Левый / правый стик
대원 해금|Unit unlocked|隊員解放|队员解锁|隊員解鎖|Unidad desbloqueada|Unidade desbloqueada|Боец открыт
무작위 대원|Random unit|ランダム隊員|随机队员|隨機隊員|Unidad aleatoria|Unidade aleatória|Случайный боец
히든 대원 출현|Hidden unit discovered|隠し隊員出現|隐藏队员出现|隱藏隊員出現|Unidad oculta encontrada|Unidade oculta encontrada|Найден скрытый боец
히든 대원|Hidden unit|隠し隊員|隐藏队员|隱藏隊員|Unidad oculta|Unidade oculta|Скрытый боец
잠김|Locked|未解放|未解锁|未解鎖|Bloqueado|Bloqueado|Закрыто
준비|Ready|準備|准备|準備|Preparado|Pronto|Готово
교전 중|In combat|交戦中|战斗中|戰鬥中|En combate|Em combate|В бою
적의 공격|Enemy attack|敵の攻撃|敌人攻击|敵人攻擊|Ataque enemigo|Ataque inimigo|Атака врага
적 |Enemies |敵 |敌人 |敵人 |Enemigos |Inimigos |Враги\u0020
시너지 도감|Synergy Codex|シナジー図鑑|协同图鉴|協同圖鑑|Códice de sinergias|Códice de sinergias|Справочник синергий
시너지 발동|Synergy active|シナジー発動|协同激活|協同啟動|Sinergia activa|Sinergia ativa|Синергия активна
시너지|Synergy|シナジー|协同|協同|Sinergia|Sinergia|Синергия
획득 데이터 칩 (연구소)|Data chips earned (Lab)|獲得チップ（研究所）|获得芯片（研究所）|獲得晶片（研究所）|Chips obtenidos (laboratorio)|Chips obtidos (laboratório)|Получено чипов (лаборатория)
획득 장비|Items acquired|獲得装備|获得装备|獲得裝備|Equipo obtenido|Equipamento obtido|Полученное снаряжение
획득한 부품|Parts collected|獲得部品|获得零件|獲得零件|Piezas recogidas|Peças coletadas|Собрано деталей
획득한 아이템이 없습니다|No items acquired|獲得アイテムなし|未获得道具|未獲得道具|No se obtuvieron objetos|Nenhum item obtido|Предметы не получены
획득|Acquired|獲得|获得|獲得|Obtenido|Obtido|Получено
작전 불능 회피|Defeat prevented|戦闘不能を回避|避免失去战斗能力|避免失去戰鬥能力|Derrota evitada|Derrota evitada|Поражение предотвращено
작전 불능|Incapacitated|戦闘不能|失去战斗能力|失去戰鬥能力|Incapacitada|Incapacitada|Выведен из строя
작전 성공|Operation complete|作戦成功|行动成功|行動成功|Operación exitosa|Operação bem-sucedida|Операция успешна
준비 완료|Ready|準備完了|准备就绪|準備就緒|Listo|Pronto|Готово
피해 무효|Damage blocked|ダメージ無効|伤害无效|傷害無效|Daño bloqueado|Dano bloqueado|Урон заблокирован
약점 적중!|Weak point hit!|弱点命中！|命中弱点！|命中弱點！|¡Punto débil!|Ponto fraco!|Попадание в слабость!
거치 장갑|Emplacement armor|固定装甲|架设装甲|架設裝甲|Blindaje de emplazamiento|Blindagem de posição|Позиционная броня
강력한 공격 — 큰 피해!|Heavy attack — major damage!|強攻撃、大ダメージ！|强力攻击——高伤害！|強力攻擊——高傷害！|¡Ataque fuerte, gran daño!|Ataque forte, grande dano!|Мощная атака — большой урон!
증기 배출구|Steam vent|蒸気噴出口|蒸汽喷口|蒸汽噴口|Salida de vapor|Saída de vapor|Паровой клапан
구역 경고 — 증기 배출구 작동 중|Warning: active steam vents|警告：蒸気噴出口作動中|警告：蒸汽喷口正在运作|警告：蒸汽噴口正在運作|Aviso: salidas de vapor activas|Aviso: saídas de vapor ativas|Осторожно: активные паровые клапаны
연습탄|Practice round|練習弾|练习弹|練習彈|Bala de práctica|Bala de treino|Учебная пуля
알 수 없는 공격|Unknown attack|不明な攻撃|未知攻击|未知攻擊|Ataque desconocido|Ataque desconhecido|Неизвестная атака
강화 모듈|Upgrade modules|強化モジュール|强化模块|強化模組|Módulos de mejora|Módulos de melhoria|Модули улучшения
출격 준비|Deployment preparation|出撃準備|准备出击|準備出擊|Preparación de despliegue|Preparação de partida|Подготовка к высадке
귀환 — 작전 종료|Return — operation ended|帰還、作戦終了|返回——行动结束|返回——行動結束|Regreso: operación terminada|Retorno: operação encerrada|Возврат — операция завершена
생존|Survival|生存|生存|生存|Supervivencia|Sobrevivência|Выживание
완주 시 판정|Evaluated on completion|完走時に判定|完成行动时判定|完成行動時判定|Se evalúa al terminar|Avaliado ao concluir|Оценивается по завершении
칩|Chips|チップ|芯片|晶片|Chips|Chips|Чипы
개|items|個|个|個|unidades|unidades|шт.


회피 구르기 중에는 적탄에 맞지 않습니다. 탄막 사이를 구르며 빠져나가세요.|Dodging makes you invulnerable to bullets. Roll through the barrage.|回避中は敵弾に無敵。弾幕をくぐり抜けましょう。|翻滚时免疫敌弹，穿过弹幕逃脱。|翻滾時免疫敵彈，穿過彈幕逃脫。|Al esquivar eres inmune a balas. Rueda entre ellas.|Ao esquivar fica imune a balas. Role entre elas.|При перекате пули не ранят. Проходите сквозь залпы.
)은 쿨타임만 차면 언제든 쓸 수 있습니다. 머리 위 링이 다 차면 준비 완료.|) is ready when its cooldown ends. A full overhead ring means ready.|）は待機時間後に使用可能。頭上リングが満ちたら準備完了。|）冷却结束即可使用，头顶圆环充满表示就绪。|）冷卻結束即可使用，頭頂圓環充滿表示就緒。|) está disponible al terminar su recarga; el anillo lleno lo indica.|) fica disponível após a recarga; o anel cheio indica isso.|) доступен после восстановления; полный круг над головой означает готовность.
보물 상자는 열쇠가 필요합니다. 엘리트 철충은 열쇠를 자주 떨어뜨립니다.|Treasure chests need keys. Elite enemies often drop them.|宝箱には鍵が必要。エリート鉄虫から入手しやすいです。|宝箱需要钥匙，精英铁虫经常掉落钥匙。|寶箱需要鑰匙，精英鐵蟲經常掉落鑰匙。|Los cofres necesitan llaves; los élites suelen soltarlas.|Baús precisam de chaves; elites costumam deixá-las.|Для сундуков нужны ключи. Их часто роняют элитные враги.
붉은 드럼통은 폭발합니다. 적을 유인해 터뜨리세요.|Red barrels explode. Lure enemies close before shooting them.|赤いドラム缶は爆発。敵を誘って撃ちましょう。|红色油桶会爆炸，将敌人引近后引爆。|紅色油桶會爆炸，將敵人引近後引爆。|Los barriles rojos explotan. Atrae enemigos y dispárales.|Barris vermelhos explodem. Atraia inimigos e atire.|Красные бочки взрываются. Подманите врагов и взорвите их.
마우스(모바일은 조준 패드)로 조준합니다. 설정에서 자동 조준 보조를 켤 수 있습니다.|Aim with the mouse or mobile aim pad. Aim assist is available in Settings.|マウス／照準パッドで照準。設定でアシストを有効にできます。|使用鼠标或移动端瞄准摇杆瞄准，可在设置中开启辅助瞄准。|使用滑鼠或行動端瞄準搖桿瞄準，可在設定中開啟輔助瞄準。|Apunta con ratón o panel móvil. Puedes activar ayuda en Ajustes.|Mire com mouse ou controle móvel. Ative assistência nas Configurações.|Цельтесь мышью или сенсорной панелью. Помощь включается в настройках.
부품으로 상점에서 라비아타에게 물자를 구매할 수 있습니다.|Spend parts at Labiata’s shop for supplies.|部品でラビアタの店の物資を購入できます。|可在拉比亚塔商店花费零件购买补给。|可在拉比亞塔商店花費零件購買補給。|Compra suministros con piezas en la tienda de Labiata.|Compre suprimentos com peças na loja da Labiata.|Покупайте припасы за детали в магазине Лабиаты.
궁극기 게이지는 적에게 피해를 줄수록 차오릅니다.|Deal damage to charge your ultimate.|敵にダメージを与えると必殺技が充填されます。|对敌人造成伤害可为终极技能充能。|對敵人造成傷害可為終極技能充能。|Inflige daño para cargar tu definitiva.|Cause dano para carregar a suprema.|Наносите урон для заряда ультимативного навыка.
작전에 성공하면 타이틀에서 「위험 등급」을 올려 더 큰 보상에 도전할 수 있습니다.|Win an operation to unlock higher Threat Levels and rewards on the title screen.|作戦成功でタイトルの危険度と報酬を上げられます。|行动成功后可在标题界面提高危险等级，挑战更高奖励。|行動成功後可在標題介面提高危險等級，挑戰更高獎勵。|Gana para subir la amenaza y las recompensas desde el título.|Vença para aumentar ameaça e recompensas na tela inicial.|Победа открывает повышение угрозы и наград в главном меню.
 키 · 숫자 키 · 휠로 교체합니다. 기본 무기는 탄약이 무한합니다.| / number keys / wheel switch weapons. Starting ammo is unlimited.|／数字キー／ホイールで武器切替。初期武器は弾薬無限。|／数字键／滚轮切换武器，初始武器无限弹药。|／數字鍵／滾輪切換武器，初始武器無限彈藥。| / números / rueda cambian armas. El arma inicial tiene munición infinita.| / números / roda trocam armas. A arma inicial tem munição infinita.| / цифры / колесо меняют оружие. Начальный боезапас бесконечен.
 · 적에게 피해를 줄수록 다시 충전됩니다| · Recharges by dealing damage|・ダメージを与えて再充填| · 造成伤害再次充能| · 造成傷害再次充能| · Se recarga al infligir daño| · Recarrega ao causar dano| · Заряжается при нанесении урона
 — 왼쪽 화면을 드래그해 움직이세요| — Drag on the left side to move| — 画面左側をドラッグして移動| ——拖动屏幕左侧移动| ——拖曳螢幕左側移動| — Arrastra a la izquierda para moverte| — Arraste à esquerda para mover| — Тяните по левой части экрана для движения
 로 움직이세요| to move|で移動|来移动|來移動| para moverte| para mover| для движения
 — 마우스로 조준, | — Aim with the mouse; use | — マウスで照準、| ——鼠标瞄准，使用| ——滑鼠瞄準，使用| — Apunta con el ratón; usa | — Mire com o mouse; use | — Цельтесь мышью; используйте\u0020
으로 훈련 표적 2개를 부수세요| to destroy 2 training targets|で訓練標的2体を破壊|摧毁2个训练目标|摧毀2個訓練目標| para destruir 2 blancos| para destruir 2 alvos| для уничтожения 2 учебных мишеней
 — 조준 패드를 누른 채 드래그해 훈련 표적 2개를 부수세요| — Hold and drag the aim pad to destroy 2 targets| — 照準パッドを押してドラッグし、標的2体を破壊| ——按住瞄准摇杆拖动，摧毁2个目标| ——按住瞄準搖桿拖曳，摧毀2個目標| — Mantén y arrastra la mira para destruir 2 blancos| — Segure e arraste a mira para destruir 2 alvos| — Удерживайте и тяните прицел, чтобы уничтожить 2 мишени
 — 연습탄이 가까이 왔을 때 | — When practice bullets get close, use | — 練習弾が近づいたら| ——练习弹接近时使用| ——練習彈接近時使用| — Cuando se acerquen balas de práctica, usa | — Quando balas de treino se aproximarem, use | — При приближении учебных пуль используйте\u0020
으로 구르며 피하세요 (2회)| to dodge through them (twice)|で回避（2回）|翻滚躲避（2次）|翻滾躲避（2次）| para esquivar (2 veces)| para esquivar (2 vezes)| для уклонения (2 раза)
 — 연습탄이 가까이 왔을 때 회피 버튼! 구르는 동안은 맞지 않습니다 (2회)| — Tap Dodge near a practice bullet. Rolling makes you invulnerable (twice).| — 練習弾の近くで回避！回避中は無敵（2回）。| ——练习弹接近时点击闪避，翻滚期间无敌（2次）。| ——練習彈接近時點擊閃避，翻滾期間無敵（2次）。| — Esquiva cerca de una bala. Eres invulnerable al rodar (2 veces).| — Esquive perto de uma bala. Fica invulnerável ao rolar (2 vezes).| — Уклонитесь рядом с пулей. В перекате вы неуязвимы (2 раза).
 — 게이지를 채워 두었습니다. | — Your gauge is full. Use | — ゲージ満タンです。| ——能量已充满，使用| ——能量已充滿，使用| — La carga está llena. Usa | — A carga está cheia. Use | — Шкала заполнена. Используйте\u0020
 — 오른쪽 위 미니맵을 눌러 탐색한 구역을 확인하세요. 클리어한 구역은 눌러서 순간이동, 보스 방은 찾으면 붉은 육각형으로 표시| — Tap the top-right minimap. Cleared rooms allow teleporting; bosses are red hexagons.| — 右上のマップをタップ。制圧済み区画へ移動可能、ボスは赤い六角形。| ——点击右上小地图查看已探索区域，点击已清理区域传送，首领房为红色六边形。| ——點擊右上小地圖查看已探索區域，點擊已清理區域傳送，首領房為紅色六邊形。| — Toca el minimapa arriba a la derecha. Teletransporte a salas despejadas; jefes en rojo.| — Toque no minimapa superior direito. Teleporte para salas concluídas; chefes em vermelho.| — Нажмите мини-карту справа вверху. Телепорт в зачищенные комнаты; боссы — красные шестиугольники.
으로 탐색한 구역을 확인하세요. 클리어한 구역으로 순간이동, 보스 방은 찾으면 붉은 육각형으로 표시| to view explored rooms. Teleport to cleared rooms; bosses are red hexagons.|で探索済み区画を確認。制圧済みへ移動、ボスは赤い六角形。|查看探索区域，可传送至已清理区域，首领房为红色六边形。|查看探索區域，可傳送至已清理區域，首領房為紅色六邊形。| para ver salas exploradas. Teletransporte a despejadas; jefes rojos.| para ver salas exploradas. Teleporte às concluídas; chefes vermelhos.| для карты разведанных комнат. Телепорт в зачищенные; боссы отмечены красным.
문이 열렸습니다 — 출격 보급을 고르고 전진하세요|Doors open — choose supplies and advance|扉が開きました。補給を選んで前進！|大门已开——选择出击补给并前进|大門已開——選擇出擊補給並前進|Puertas abiertas: elige suministros y avanza|Portas abertas: escolha suprimentos e avance|Двери открыты — выберите припасы и вперёд
기본 훈련 완료 — 문이 열렸습니다. B6 철혈 사령부까지 돌파하세요!|Training complete — reach Ironblood Command on B6!|訓練完了！B6鉄血司令部まで突破！|训练完成——突破至B6铁血司令部！|訓練完成——突破至B6鐵血司令部！|Entrenamiento completo: ¡llega al comando de B6!|Treino concluído: chegue ao comando no B6!|Обучение завершено — прорвитесь к командованию на B6!
기본 훈련을 건너뛰었습니다 — 타이틀의 「기본 훈련」으로 다시 할 수 있습니다|Training skipped — replay it from the title screen.|訓練をスキップ。タイトルから再訓練できます。|已跳过训练，可从标题界面重新训练。|已跳過訓練，可從標題介面重新訓練。|Entrenamiento omitido; repítelo desde el título.|Treino pulado; repita na tela inicial.|Обучение пропущено. Его можно повторить из главного меню.
연습탄 명중 — 훈련 중에는 피해가 없습니다|Practice hit — no damage during training|練習弾命中、訓練中はダメージなし|练习弹命中——训练中不会受伤|練習彈命中——訓練中不會受傷|Impacto de práctica: sin daño en entrenamiento|Acerto de treino: sem dano no treinamento|Учебное попадание — в обучении урона нет
출격 보급 · 하나를 고르세요|Deployment supplies · choose one|出撃補給・1つ選択|出击补给 · 选择一个|出擊補給 · 選擇一個|Suministros · elige uno|Suprimentos · escolha um|Припасы · выберите один
출격 보급 — 출격 지점의 장비 3개 중 하나를 고르세요 (하나를 집으면 나머지는 회수)|Choose 1 of 3 starting supplies; the others are removed.|出撃地点の装備3つから1つ選択。残りは回収されます。|从3件出击补给中选1件，其余会被回收。|從3件出擊補給中選1件，其餘會被回收。|Elige 1 de 3 suministros; se retiran los demás.|Escolha 1 de 3 suprimentos; os demais serão retirados.|Выберите 1 из 3 припасов; остальные заберут.
궁극기 준비 완료 — |Ultimate ready — |必殺技準備完了 — |终极技能就绪——|終極技能就緒——|Definitiva lista — |Suprema pronta — |Ультимативный навык готов —\u0020
스킬 충전 중 — |Skill charging — |スキル充填中 — |技能充能中——|技能充能中——|Habilidad cargando — |Habilidade carregando — |Заряд навыка —\u0020
보조 스킬 · 재사용 |Secondary · cooldown |補助・再使用 |辅助 · 冷却 |輔助 · 冷卻 |Secundaria · recarga |Secundária · recarga |Доп. навык · восстановление\u0020
실명: 적의 조준 오차 증가. LRL의 검기는 실명한 적에게 확정 약점 피해를 줍니다.|Blind scatters enemy aim. LRL’s slashes guarantee weak-point hits on blinded enemies.|暗闇は敵の照準を乱す。LRLの剣気は暗闇の敵に確定弱点。|致盲增大敌人瞄准误差，LRL剑气对致盲敌人必定弱点命中。|致盲增大敵人瞄準誤差，LRL劍氣對致盲敵人必定弱點命中。|Ceguera desvía la mira enemiga; LRL garantiza puntos débiles contra cegados.|Cegueira desvia a mira inimiga; LRL garante ponto fraco em cegos.|Ослепление сбивает прицел. Волны LRL гарантируют слабое место по ослеплённым.
약점 간파 — 실명한 적의 약점을 베었다!|Weakness exposed — struck a blinded enemy!|弱点看破！暗闇の敵を斬った！|看破弱点——斩中致盲敌人的弱点！|看破弱點——斬中致盲敵人的弱點！|¡Debilidad expuesta en enemigo cegado!|Fraqueza exposta em inimigo cego!|Слабость раскрыта — поражён ослеплённый враг!
승강기 탑승 — 다음 구역으로|Enter elevator — next sector|昇降機に乗り、次の区画へ|搭乘升降机——前往下一区域|搭乘升降機——前往下一區域|Ascensor: siguiente sector|Elevador: próximo setor|В лифт — к следующему сектору
승강기를 타고 다음 구역으로 이동하세요|Take the elevator to the next sector|昇降機で次の区画へ|搭乘升降机前往下一区域|搭乘升降機前往下一區域|Toma el ascensor al siguiente sector|Pegue o elevador ao próximo setor|На лифте к следующему сектору
철혈 사령부 제압 — 승강기로 귀환하세요|Command secured — return via elevator|司令部制圧、昇降機で帰還|司令部已压制——搭升降机返回|司令部已壓制——搭升降機返回|Comando asegurado: regresa por el ascensor|Comando dominado: retorne pelo elevador|Командование захвачено — возвращайтесь на лифте
철혈 사령부를 제압하고 무사히 귀환했습니다!|Ironblood Command secured. Returned safely!|鉄血司令部を制圧、無事帰還！|压制铁血司令部并安全返回！|壓制鐵血司令部並安全返回！|¡Comando asegurado y regreso a salvo!|Comando dominado e retorno seguro!|Командование захвачено. Успешное возвращение!


 닫기 · 휠 확대/축소 · 끌어서 이동 · 클리어한 구역을 클릭(또는 | Close · wheel to zoom · drag to pan · click a cleared room (or use | 閉じる・ホイール拡縮・ドラッグ移動・制圧区画をクリック（または| 关闭 · 滚轮缩放 · 拖动平移 · 点击已清理区域（或用| 關閉 · 滾輪縮放 · 拖曳平移 · 點擊已清理區域（或用| Cerrar · rueda: zoom · arrastrar: mover · elige sala despejada (o usa | Fechar · roda: zoom · arrastar: mover · escolha sala concluída (ou use | Закрыть · колесо: масштаб · перетаскивание: обзор · нажмите зачищенную комнату (или\u0020
로 고르고 | to select, then |で選択して|选择，再按|選擇，再按| para elegir y | para escolher e | для выбора, затем\u0020
 · 패드 십자키 + | · gamepad D-pad + |・十字キー＋| · 手柄方向键＋| · 控制器方向鍵＋| · cruceta del mando + | · direcional + | · крестовина +\u0020
 · 십자키 + | · D-pad + |・十字キー＋| · 方向键＋| · 方向鍵＋| · cruceta + | · direcional + | · крестовина +\u0020
)하면 그곳으로 이동|) to teleport there|）で移動|）即可传送|）即可傳送|) para teletransportarte|) para teleportar|) для телепортации
 / 휠(위·아래)| / wheel (up/down)|／ホイール上下|／滚轮上下|／滾輪上下| / rueda (arriba/abajo)| / roda (cima/baixo)| / колесо (вверх/вниз)
 또는 | or | または | 或 | 或 | o | ou | или\u0020
 · 출격 시 해금된 대원 중 한 명| · An unlocked unit is chosen on deploy|・出撃時に解放済み隊員から選択| · 出击时从已解锁队员中选择| · 出擊時從已解鎖隊員中選擇| · Una unidad desbloqueada al desplegar| · Unidade desbloqueada ao iniciar| · При высадке выбирается открытый боец
 · 한쪽 보유 | · One item owned |・片方所持 | · 已持有一件 | · 已持有一件 | · Un objeto obtenido | · Um item obtido | · Один предмет получен\u0020
 — 강화 모듈 최대치: 체력 +25 · 궁극기 +25%| — All upgrades maxed: health +25 · ultimate +25%| — 全強化最大：体力+25・必殺技+25%| ——强化已满：生命+25 · 终极+25%| ——強化已滿：生命+25 · 終極+25%| — Mejoras al máximo: salud +25 · definitiva +25%| — Melhorias máximas: vida +25 · suprema +25%| — Все улучшения максимальны: здоровье +25 · заряд +25%
 — 다음 출격부터 선택 가능| — Available next deployment| — 次の出撃から選択可能| ——下次出击起可选| ——下次出擊起可選| — Disponible en la siguiente partida| — Disponível na próxima partida| — Доступно со следующей высадки
 — 타이틀에서 선택| — Select on title screen| — タイトルで選択| ——在标题界面选择| ——在標題介面選擇| — Elige en el título| — Escolha na tela inicial| — Выберите в главном меню
 화면)| orientation)|画面）|屏幕）|螢幕）|)|)| режим)
40초 안에 |Within 40 s: |40秒以内に|40秒内|40秒內|En 40 s: |Em 40 s: |За 40 с:\u0020
기 섬멸 — 성공하면 고급 보급 상자| kills — success earns a high-grade chest|体撃破で高級補給箱|次击杀——成功获得高级补给箱|次擊殺——成功獲得高級補給箱| bajas: cofre avanzado al ganar| abates: baú avançado ao vencer| убийств — награда: ценный сундук
끝까지 버티면 고급 보급 상자 획득|Survive to earn a high-grade chest|最後まで耐えて高級補給箱を獲得|坚持到底获得高级补给箱|堅持到底獲得高級補給箱|Sobrevive para obtener un cofre avanzado|Sobreviva para obter um baú avançado|Выживите и получите ценный сундук
들어서면 30초 동안 증원이 몰려옵니다. 버티거나 목표 수를 처치하면 고급 상자|Reinforcements arrive for 30 s. Survive or reach the kill target for a high-grade chest.|入室後30秒間増援。生存か目標撃破数で高級箱。|进入后增援持续30秒，生存或达到击杀目标可获高级宝箱。|進入後增援持續30秒，生存或達到擊殺目標可獲高級寶箱。|Refuerzos durante 30 s. Sobrevive o cumple las bajas para un cofre avanzado.|Reforços por 30 s. Sobreviva ou atinja os abates para um baú avançado.|Подкрепления 30 с. Выживите или выполните цель убийств для ценного сундука.
보스는 체력 33%·66%에서 패턴이 바뀝니다. 붉은 예고선과 흐릿한 탄(곧 발사)을 주시하세요|Boss patterns change at 66% and 33% health. Watch red warnings and faint incoming bullets.|ボスは体力66%・33%で変化。赤い予告と薄い予告弾に注意。|首领在66%与33%生命切换招式，注意红色预警和淡色预发射弹。|首領在66%與33%生命切換招式，注意紅色預警和淡色預發射彈。|Jefes cambian al 66% y 33% de salud. Vigila avisos rojos y balas tenues.|Chefes mudam com 66% e 33% de vida. Observe avisos vermelhos e balas suaves.|Боссы меняют атаки при 66% и 33% здоровья. Следите за предупреждениями и бледными пулями.
잠긴 보물 상자는 열쇠 1개로 엽니다. 열쇠는 엘리트 철충·구역 보상·상점에서 얻습니다|Locked chests cost 1 key. Find keys from elites, room rewards and shops.|施錠箱は鍵1個。鍵はエリート・区画報酬・店で入手。|上锁宝箱需1把钥匙，钥匙来自精英、区域奖励和商店。|上鎖寶箱需1把鑰匙，鑰匙來自精英、區域獎勵和商店。|Cofres cerrados cuestan 1 llave: élites, salas y tiendas las dan.|Baús trancados custam 1 chave: elites, salas e lojas fornecem.|Для запертых сундуков нужен 1 ключ. Источники: элиты, награды комнат, магазин.
처치·상자에서 모은 부품(톱니)으로 체력·열쇠·장비를 삽니다. 가격표가 붉으면 부품 부족|Spend parts from kills and chests on healing, keys and items. Red prices mean insufficient funds.|撃破・箱の部品で回復・鍵・装備を購入。赤い価格は部品不足。|击杀和宝箱获取零件，用于购买生命、钥匙和装备，红色价格表示不足。|擊殺和寶箱獲取零件，用於購買生命、鑰匙和裝備，紅色價格表示不足。|Usa piezas de bajas y cofres para comprar. Precio rojo: fondos insuficientes.|Use peças de abates e baús para comprar. Preço vermelho: saldo insuficiente.|Тратьте детали от убийств и сундуков на лечение и предметы. Красная цена: не хватает средств.
라비아타: 어서 와요. 필요한 물자가 있으면 골라 보세요.|Labiata: Welcome. Choose any supplies you need.|ラビアタ：いらっしゃい。必要な物資をどうぞ。|拉比亚塔：欢迎，挑选需要的物资吧。|拉比亞塔：歡迎，挑選需要的物資吧。|Labiata: Bienvenida. Elige lo que necesites.|Labiata: Bem-vinda. Escolha o que precisar.|Лабиата: Добро пожаловать. Выбирайте нужные припасы.
들고 있는 무기의 예비 탄약을 최대치의 40% 채웁니다|Refills carried weapons by 40% of maximum reserves|所持武器の予備弾薬を最大値の40%補充|补充所持武器最大备用弹药的40%|補充所持武器最大備用彈藥的40%|Repone 40% de las reservas máximas|Repõe 40% das reservas máximas|Восполняет 40% максимального резерва оружия
의 예비 탄약을 최대치의 10% 채웁니다|: restores 10% of maximum reserve ammo|：予備弾薬を最大値の10%補充|：恢复最大备用弹药的10%|：恢復最大備用彈藥的10%|: repone 10% de reserva máxima|: repõe 10% da reserva máxima|: восполняет 10% максимального резерва
보급 상자를 여는 열쇠 +1|Supply chest key +1|補給箱の鍵+1|补给箱钥匙+1|補給箱鑰匙+1|Llave de cofre +1|Chave de baú +1|Ключ от сундука +1
체력 회복 (+50)|Heal (+50)|体力回復（+50）|生命恢复（+50）|生命恢復（+50）|Curación (+50)|Cura (+50)|Лечение (+50)
체력을 50 회복합니다|Restores 50 health|体力を50回復|恢复50生命|恢復50生命|Recupera 50 de salud|Recupera 50 de vida|Восстанавливает 50 здоровья
피격 1회를 막아 주는 방어막 +1|Shield +1: blocks one hit|シールド+1：被弾1回無効|护盾+1：抵挡1次受击|護盾+1：抵擋1次受擊|Escudo +1: bloquea un golpe|Escudo +1: bloqueia um acerto|Щит +1: блокирует попадание
체력이 가득 찼습니다|Health is full|体力は満タンです|生命已满|生命已滿|Salud completa|Vida cheia|Здоровье полное
체력이 부족해 계약할 수 없습니다|Not enough health for the pact|契約に必要な体力が不足|生命不足，无法契约|生命不足，無法契約|Falta salud para el pacto|Falta vida para o pacto|Недостаточно здоровья для договора
응급 처치 — 체력 25 회복|First aid — heals 25|応急処置、体力25回復|急救——恢复25生命|急救——恢復25生命|Primeros auxilios: cura 25|Primeiros socorros: cura 25|Первая помощь — лечение 25
응급 처치 키트 — 체력 회복|First aid kit — health restored|応急処置キット、体力回復|急救包——恢复生命|急救包——恢復生命|Botiquín: salud recuperada|Kit: vida recuperada|Аптечка — здоровье восстановлено
최대 체력 한계 — 방어막 +1로 전환|Health cap reached — shield +1 instead|体力上限、代わりにシールド+1|已达生命上限——改为护盾+1|已達生命上限——改為護盾+1|Límite de salud: escudo +1|Limite de vida: escudo +1|Предел здоровья — вместо этого щит +1
피의 계약 제단|Blood Pact Altar|血の契約祭壇|鲜血契约祭坛|鮮血契約祭壇|Altar del pacto de sangre|Altar do pacto de sangue|Алтарь кровавого договора
피의 계약 — 최대 체력 50 → S급 이상 장비|Blood pact: 50 max health → S-rank+ item|血の契約：最大体力50→S級以上装備|血契：50最大生命→S级以上装备|血契：50最大生命→S級以上裝備|Pacto: 50 de salud máxima → objeto S+|Pacto: 50 de vida máxima → item S+|Договор: 50 макс. здоровья → предмет ранга S+
피의 계약 — 최대 체력 50을 바쳤습니다|Blood pact — sacrificed 50 max health|血の契約、最大体力50を捧げた|血契——献出50最大生命|血契——獻出50最大生命|Pacto: sacrificaste 50 de salud máxima|Pacto: sacrificou 50 de vida máxima|Договор — пожертвовано 50 макс. здоровья
최대 체력 한 칸(50)을 영구히 바치고 S급 이상 장비를 얻습니다. 체력이 넉넉할 때만!|Permanently sacrifice 50 max health for an S-rank+ item. Only with enough health!|最大体力50を永久に捧げS級以上装備。体力に余裕がある時だけ！|永久献出50最大生命换取S级以上装备，仅在生命充足时使用！|永久獻出50最大生命換取S級以上裝備，僅在生命充足時使用！|Sacrifica 50 de salud máxima por un objeto S+. ¡Solo con salud suficiente!|Sacrifique 50 de vida máxima por item S+. Só com vida suficiente!|Навсегда отдайте 50 макс. здоровья за предмет S+. Только при запасе здоровья!


가슴의 사자여 불타올라라!|Lion of my chest, burn bright!|胸の獅子よ、燃え上がれ！|胸中雄狮，燃烧吧！|胸中雄獅，燃燒吧！|¡León de mi pecho, arde!|Leão do meu peito, queime!|Лев в моей груди, пылай!
대파 상태: 램파리온으로 복귀할 때까지 스킬을 사용할 수 없습니다.|Wrecked: skills disabled until Ramparion returns.|大破中：ランパリオン復帰までスキル不可。|大破状态：恢复兰帕利昂前无法使用技能。|大破狀態：恢復蘭帕利昂前無法使用技能。|Destrozado: sin habilidades hasta recuperar Ramparion.|Destruído: sem habilidades até recuperar Ramparion.|Разрушен: навыки недоступны до восстановления Рампариона.
램파리온 대파 — 램파트로 버텨라!|Ramparion wrecked — survive as Rampart!|ランパリオン大破、ランパートで耐えろ！|兰帕利昂大破——用堡垒坚持住！|蘭帕利昂大破——用堡壘堅持住！|¡Ramparion destruido: resiste como Rampart!|Ramparion destruído: resista como Rampart!|Рампарион разрушен — выживайте как Рампарт!
램파리온 복귀까지 |Ramparion returns in |ランパリオン復帰まで |兰帕利昂恢复倒计时 |蘭帕利昂恢復倒數 |Ramparion vuelve en |Ramparion retorna em |До восстановления Рампариона\u0020
램파리온, 재기동!!|Ramparion, reboot!!|ランパリオン、再起動！|兰帕利昂，重启！！|蘭帕利昂，重啟！！|¡Ramparion, reinicio!|Ramparion, reiniciar!|Рампарион, перезапуск!
초 동안 버티면 램파리온으로 복귀합니다 (램파트: 체력 75 · 공격력 40% · 스킬 불가)| s to restore Ramparion (Rampart: 75 health, 40% attack, no skills)|秒耐えると復帰（ランパート：体力75・攻撃40%・スキル不可）|秒后恢复（堡垒：生命75 · 攻击40% · 无技能）|秒後恢復（堡壘：生命75 · 攻擊40% · 無技能）| s para restaurar (Rampart: salud 75, ataque 40%, sin habilidades)| s para restaurar (Rampart: vida 75, ataque 40%, sem habilidades)| с до восстановления (Рампарт: здоровье 75, атака 40%, без навыков)
2단계 — 공세 강화|Phase 2 — intensified assault|第2段階：攻勢強化|第2阶段——攻势强化|第2階段——攻勢強化|Fase 2: asalto intenso|Fase 2: ataque intenso|Фаза 2 — усиленный натиск
폭주 — 최종 단계|Enraged — final phase|暴走、最終段階|暴走——最终阶段|暴走——最終階段|Furia: fase final|Fúria: fase final|Ярость — финальная фаза
흡수 에너지 — 5초간 피해 +|Absorbed energy — damage for 5 s +|吸収エネルギー、5秒間ダメージ+|吸收能量——5秒内伤害+|吸收能量——5秒內傷害+|Energía absorbida: daño durante 5 s +|Energia absorvida: dano por 5 s +|Поглощённая энергия — урон на 5 с +
게임패드 연결됨 — 왼쪽 스틱 이동 · 오른쪽 스틱 조준 · RT 사격 · LT 회피|Gamepad connected: left stick move · right stick aim · RT fire · LT dodge|パッド接続：左移動・右照準・RT射撃・LT回避|手柄已连接：左摇杆移动 · 右摇杆瞄准 · RT射击 · LT闪避|控制器已連接：左搖桿移動 · 右搖桿瞄準 · RT射擊 · LT閃避|Mando conectado: izquierda mover · derecha apuntar · RT disparar · LT esquivar|Controle conectado: esquerdo mover · direito mirar · RT atirar · LT esquivar|Геймпад: левый стик движение · правый прицел · RT огонь · LT уклонение
왼쪽 드래그 이동 · 조준 패드 드래그로 조준·사격|Drag left to move · drag aim pad to aim and fire|左ドラッグ移動・照準パッドで射撃|左侧拖动移动 · 拖动瞄准摇杆瞄准射击|左側拖曳移動 · 拖曳瞄準搖桿瞄準射擊|Arrastra a la izquierda: mover · mira: apuntar y disparar|Arraste à esquerda: mover · mira: mirar e atirar|Слева тяните для движения · панель прицела для огня
대원 카드를 두 번 누르면 출격 · 왼쪽 화면 드래그로 이동 · 오른쪽 조준 패드를 누른 채 드래그해 조준·사격|Tap a unit twice to deploy · left drag to move · right aim pad to aim/fire|隊員を2回タップで出撃・左移動・右照準射撃|双击队员出击 · 左侧拖动移动 · 右侧瞄准摇杆瞄准射击|連點隊員出擊 · 左側拖曳移動 · 右側瞄準搖桿瞄準射擊|Toca unidad dos veces: desplegar · izquierda: mover · derecha: apuntar/disparar|Toque unidade duas vezes: iniciar · esquerda: mover · direita: mirar/atirar|Двойное нажатие бойца: высадка · слева движение · справа прицел/огонь
각 대원의 기본 무기와 스킬로 시작 · 아주 드물게 히든 대원이 나타납니다|Start with that unit’s weapon and skills; hidden units are very rare.|各隊員の初期武器とスキルで開始。まれに隠し隊員。|以各队员初始武器和技能开始，隐藏队员极少出现。|以各隊員初始武器和技能開始，隱藏隊員極少出現。|Empieza con su arma y habilidades; las unidades ocultas son raras.|Comece com sua arma e habilidades; unidades ocultas são raras.|Начните с оружием и навыками бойца; скрытые бойцы редки.
출격 순간 대원이 결정됩니다|Unit is selected at deployment|出撃時に隊員決定|出击时决定队员|出擊時決定隊員|La unidad se decide al desplegar|A unidade é decidida ao iniciar|Боец определяется при высадке
명 중 한 명이 무작위로 출격합니다. 누가 나올지는 출격하는 순간 결정됩니다.| units: one is chosen randomly on deployment.|名から出撃時にランダム決定。|名队员中随机出击一名，出击时决定。|名隊員中隨機出擊一名，出擊時決定。| unidades: se elige una al desplegar.| unidades: uma é escolhida ao iniciar.| бойцов: случайный выбор при высадке.
무작위 칸에 히든 대원 등장 — |Hidden unit on the random card — |ランダム枠に隠し隊員 — |随机栏出现隐藏队员——|隨機欄出現隱藏隊員——|Unidad oculta en aleatorio — |Unidade oculta no aleatório — |Скрытый боец в случайной карте —\u0020
해금된 대원 |Unlocked units |解放済み隊員 |已解锁队员 |已解鎖隊員 |Unidades desbloqueadas |Unidades desbloqueadas |Открытые бойцы\u0020
위험 등급 — 작전에 한 번 성공하면 개방됩니다 (등급마다 적 강화 · 데이터 칩 +25%)|Threat Levels unlock after one victory (stronger enemies; chips +25% per level).|一度成功で危険度解放（敵強化・チップ各+25%）。|成功一次解锁危险等级（敌人强化，每级芯片+25%）。|成功一次解鎖危險等級（敵人強化，每級晶片+25%）。|Amenaza tras una victoria: enemigos más fuertes y chips +25% por nivel.|Ameaça após uma vitória: inimigos fortes e chips +25% por nível.|Угроза открывается после победы: сильнее враги, чипы +25% за уровень.
 / 마우스 휠로 무기를 바꿉니다. 무기는 최대 3개, 보급 무기는 탄약이 한정 — | / wheel to switch. Up to 3 weapons; supply ammo is limited — |／ホイールで切替。最大3武器、補給弾薬は有限 — |／滚轮切换。最多3把武器，补给弹药有限——|／滾輪切換。最多3把武器，補給彈藥有限——| / rueda cambia. Máximo 3 armas; munición limitada — | / roda troca. Até 3 armas; munição limitada — | / колесо для смены. До 3 оружий; боезапас ограничен —\u0020
 / 휠로 다른 무기로 바꾸세요. 기본 무기는 탄약이 무한합니다. 빈 무기는 | / wheel to switch weapons. Starting ammo is unlimited. Drop empty weapons with |／ホイールで切替。初期弾薬は無限。空武器を捨てる：|／滚轮切换武器。初始武器无限弹药，空武器丢弃键：|／滾輪切換武器。初始武器無限彈藥，空武器丟棄鍵：| / rueda para cambiar. Arma inicial infinita. Suelta vacías con | / roda para trocar. Arma inicial infinita. Largue vazias com | / колесо для смены. Начальные патроны бесконечны. Выбросить пустое оружие:\u0020
교체 버튼으로 다른 무기로 바꾸세요. 기본 무기는 탄약이 무한합니다. 탄약 상자(초록)로 보충|Use Switch to change weapons. Starting ammo is unlimited; green boxes refill supply ammo.|切替ボタンで武器変更。初期弾薬無限、緑の箱で補充。|点击切换更换武器。初始武器无限弹药，绿色弹药箱补充弹药。|點擊切換更換武器。初始武器無限彈藥，綠色彈藥箱補充彈藥。|Cambia de arma con el botón. Munición inicial infinita; cajas verdes reponen.|Troque pelo botão. Munição inicial infinita; caixas verdes repõem.|Меняйте оружие кнопкой. Начальный боезапас бесконечен; зелёные ящики пополняют патроны.
교체 버튼으로 무기를 바꿉니다. 무기는 최대 3개, 보급 무기는 탄약이 한정되어 있습니다 — 줍기 버튼으로 버리기|Switch changes weapons. Carry up to 3; supply ammo is limited. Pick-up button drops weapons.|切替で最大3武器。補給弾薬は有限、拾うボタンで破棄。|切换按钮更换武器，最多3把，补给弹药有限；拾取按钮丢弃。|切換按鈕更換武器，最多3把，補給彈藥有限；拾取按鈕丟棄。|Cambia armas. Máximo 3; munición limitada. Recoger también suelta.|Troque armas. Até 3; munição limitada. Pegar também larga.|Меняйте оружие. До 3; боезапас ограничен. Кнопка подбора также выбрасывает.
로 버릴 수 있습니다(무기는 최대 3개)| to drop (max 3 weapons)|で破棄（最大3武器）|丢弃（最多3把武器）|丟棄（最多3把武器）| para soltar (máximo 3 armas)| para largar (até 3 armas)| для выбрасывания (до 3 оружий)
로 버리기| to drop|で破棄|丢弃|丟棄| para soltar| para largar| для выбрасывания
을(를) 누르세요 (기본 무기는 버릴 수 없습니다)| to confirm (starting weapon cannot be dropped)|を押す（初期武器は破棄不可）|确认（无法丢弃初始武器）|確認（無法丟棄初始武器）| para confirmar (arma inicial no descartable)| para confirmar (arma inicial não descartável)| для подтверждения (начальное оружие не выбросить)
개 — 버릴 무기로 바꾼 뒤 | slots — switch to the weapon to drop, then |枠 — 捨てる武器に切り替えて|个栏位——切到要丢弃的武器，再按|個欄位——切到要丟棄的武器，再按| espacios: elige arma para soltar y | espaços: escolha arma para largar e | ячеек — выберите оружие для выбрасывания, затем\u0020
 버림 — 다시 | dropped — press again |を破棄 — 再び|已丢弃——再次按|已丟棄——再次按| soltada: pulsa otra vez | largada: pressione de novo | выброшено — нажмите снова\u0020
으로 새 무기 획득| to take the new weapon|で新武器を獲得|获得新武器|獲得新武器| para tomar la nueva arma| para pegar a nova arma| чтобы взять новое оружие
무기는 최대 |Weapon limit: |武器上限：|武器上限：|武器上限：|Límite de armas: |Limite de armas: |Лимит оружия:\u0020
무기는 |Weapons: |武器：|武器：|武器：|Armas: |Armas: |Оружие:\u0020
급 무기 · | rank weapon · |級武器・|级武器 · |級武器 · | rango de arma · | grau de arma · | ранг оружия ·\u0020
급 장비 · | rank item · |級装備・|级装备 · |級裝備 · | rango de objeto · | grau de item · | ранг предмета ·\u0020
마우스 조준 · 좌클릭 사격 · 우클릭/|Mouse aim · left click fire · right click/|マウス照準・左射撃・右クリック／|鼠标瞄准 · 左键射击 · 右键／|滑鼠瞄準 · 左鍵射擊 · 右鍵／|Ratón apuntar · clic izq. disparar · clic der./|Mouse mirar · clique esq. atirar · clique dir./|Мышь: прицел · ЛКМ: огонь · ПКМ/
UI 배치를 저장했습니다 (|UI layout saved (|UI配置を保存（|已保存界面布局（|已儲存介面配置（|Distribución guardada (|Layout salvo (|Интерфейс сохранён (
클릭한 뒤 새 키를 누르세요 (Esc 취소) · 이동은 WASD/방향키 고정|Click, then press a new key (Esc cancels). Movement stays WASD/arrows.|クリック後に新キー（Esc取消）。移動はWASD／方向キー固定。|点击后按新键（Esc取消），移动固定为WASD／方向键。|點擊後按新鍵（Esc取消），移動固定為WASD／方向鍵。|Haz clic y pulsa tecla (Esc cancela). Movimiento fijo WASD/flechas.|Clique e pressione tecla (Esc cancela). Movimento fixo WASD/setas.|Нажмите и задайте клавишу (Esc отмена). Движение: WASD/стрелки.
」 키는 이동 · 일시 정지 · 무기 슬롯 · 시스템 키라 쓸 수 없습니다|” is reserved for movement, pause, weapon slots or the system.|」は移動・停止・武器・システム用のため使用不可。|」已保留给移动、暂停、武器栏位或系统，无法使用。|」已保留給移動、暫停、武器欄位或系統，無法使用。|” está reservada para movimiento, pausa, armas o sistema.|” está reservada para movimento, pausa, armas ou sistema.|» зарезервирована для движения, паузы, оружия или системы.
탄약이 없습니다 — 무기를 교체하세요|Out of ammo — switch weapons|弾薬切れ、武器を切り替えてください|弹药耗尽——切换武器|彈藥耗盡——切換武器|Sin munición: cambia de arma|Sem munição: troque de arma|Нет патронов — смените оружие
치트 활성화|Cheats enabled|チート有効|作弊已启用|作弊已啟用|Trucos activados|Truques ativados|Читы включены


그래픽 장치가 재설정되었습니다 — 잠시 후 다시 불러옵니다|Graphics device reset — reloading shortly|描画装置リセット、再読込します|图形设备已重置——即将重新加载|圖形裝置已重設——即將重新載入|Gráficos reiniciados: recargando|Gráficos reiniciados: recarregando|Графическое устройство сброшено — перезагрузка
리소스 불러오는 중|Loading resources|リソース読込中|正在加载资源|正在載入資源|Cargando recursos|Carregando recursos|Загрузка ресурсов
작전 지역 데이터 수신 중|Receiving sector data|作戦地域データ受信中|正在接收区域数据|正在接收區域資料|Recibiendo datos del sector|Recebendo dados do setor|Получение данных сектора
작전 데이터를 받지 못했습니다|Could not load operation data|作戦データ取得失敗|无法获取行动数据|無法取得行動資料|No se pudieron cargar los datos|Não foi possível carregar os dados|Не удалось загрузить данные операции
작전 데이터를 받지 못했습니다 — 네트워크를 확인한 뒤 다시 출격하세요|Could not load operation data. Check your connection and retry.|作戦データ取得失敗。接続を確認して再出撃。|无法获取行动数据，请检查网络后重试。|無法取得行動資料，請檢查網路後重試。|No se cargaron datos. Comprueba la conexión y reintenta.|Dados não carregados. Verifique a conexão e tente novamente.|Данные не загружены. Проверьте соединение и повторите.
출격 준비 중 오류가 발생했습니다 — 다시 시도해 주세요|Deployment failed — please try again|出撃準備エラー、再試行してください|出击准备出错——请重试|出擊準備出錯——請重試|Error de despliegue: vuelve a intentar|Erro de partida: tente novamente|Ошибка высадки — повторите попытку
일시적인 오류가 발생했습니다 — 게임은 계속 진행됩니다|Temporary error — the game continues|一時的なエラー、ゲームは続行します|出现临时错误——游戏继续进行|出現暫時錯誤——遊戲繼續進行|Error temporal: el juego continúa|Erro temporário: o jogo continua|Временная ошибка — игра продолжается
오류가 반복되어 타이틀로 돌아갑니다|Repeated errors — returning to title|エラーが続いたためタイトルへ戻ります|错误重复——返回标题界面|錯誤重複——返回標題介面|Errores repetidos: volviendo al título|Erros repetidos: voltando ao início|Повторные ошибки — возврат в меню
조준선에 적이 없습니다|No enemy in the firing line|射線上に敵がいません|射线上没有敌人|射線上沒有敵人|No hay enemigos en la línea|Sem inimigos na linha|На линии огня нет врагов
처음 보는 상황 · TIP|New situation · TIP|初めての状況・TIP|新情况 · 提示|新情況 · 提示|Situación nueva · CONSEJO|Situação nova · DICA|Новая ситуация · СОВЕТ
작전 목표 · 별 3개|Operation goals · 3 stars|作戦目標・星3つ|行动目标 · 3星|行動目標 · 3星|Objetivos · 3 estrellas|Objetivos · 3 estrelas|Цели операции · 3 звезды
분 이내 (별 3개)| min or less (3 stars)|分以内（星3つ）|分钟以内（3星）|分鐘以內（3星）| min o menos (3 estrellas)| min ou menos (3 estrelas)| мин. или меньше (3 звезды)
분 이내 돌파| min or less|分以内に突破|分钟内突破|分鐘內突破| min o menos| min ou menos| мин. на прохождение
에서 작전 불능 — | — incapacitated: |で戦闘不能 — |失去战斗能力——|失去戰鬥能力——| — incapacitada: | — incapacitada: | — выведен из строя:\u0020
에서 작전을 포기하고 귀환했습니다| — operation aborted; returned|で作戦を放棄して帰還|放弃行动并返回|放棄行動並返回| — operación abandonada y regreso| — operação abandonada e retorno| — операция прервана, возврат
으로 복구되었습니다 (이번 출격 1회)| restored (once this run)|に復旧（今回1回）|恢复（本次行动1次）|恢復（本次行動1次）| restaurado (una vez por partida)| restaurado (uma vez por partida)| восстановлено (раз за операцию)
의 공격| attack|の攻撃|的攻击|的攻擊|: ataque|: ataque|: атака
의 탄막| barrage|の弾幕|的弹幕|的彈幕|: ráfaga|: rajada|: залп
회 남음| uses remaining|回残り|次剩余|次剩餘| usos restantes| usos restantes| применений осталось
회 이하로 돌파| hits or fewer|回以下で突破|次以下受击通关|次以下受擊通關| impactos o menos| acertos ou menos| попаданий или меньше
번 | times |回 |次 |次 | veces | vezes | раз\u0020


음량 · 키 설정 · 접근성 옵션|Audio · key bindings · accessibility|音量・キー設定・アクセシビリティ|音量 · 按键 · 无障碍选项|音量 · 按鍵 · 無障礙選項|Audio · teclas · accesibilidad|Áudio · teclas · acessibilidade|Звук · клавиши · доступность
첫 출격과 같은 기본 훈련을 다시 진행합니다|Replay the first-deployment tutorial|初回出撃の基本訓練を再実行|重新进行首次出击的基础训练|重新進行首次出擊的基礎訓練|Repetir el entrenamiento inicial|Repetir o treino inicial|Повторить начальное обучение
작전 성공 시 다음 위험 등급 개방 · 등급마다 적 체력 +15%, 적탄 속도 +4%, 데이터 칩 +25%|Win to unlock the next threat level: enemy health +15%, bullet speed +4%, chips +25% per level|成功で次の危険度解放：敵体力+15%、敵弾速+4%、チップ+25%／段階|成功解锁下级危险：每级敌生命+15%、弹速+4%、芯片+25%|成功解鎖下級危險：每級敵生命+15%、彈速+4%、晶片+25%|Gana para subir amenaza: salud enemiga +15%, balas +4%, chips +25% por nivel|Vença para subir ameaça: vida inimiga +15%, balas +4%, chips +25% por nível|Победа открывает следующую угрозу: здоровье врагов +15%, скорость пуль +4%, чипы +25%
현재 대원 스킬|Current unit skills|現在の隊員スキル|当前队员技能|目前隊員技能|Habilidades actuales|Habilidades atuais|Навыки текущего бойца
최고 도달|Deepest floor|最高到達|最深到达|最深到達|Máxima profundidad|Maior profundidade|Максимальная глубина
게임을 시작하지 못했습니다 — 새로고침해 주세요.|Could not start the game — please refresh.|ゲーム起動失敗、再読込してください。|无法启动游戏，请刷新。|無法啟動遊戲，請重新整理。|No se pudo iniciar: recarga la página.|Não foi possível iniciar: recarregue.|Не удалось запустить игру — обновите страницу.
이 브라우저 / 기기에서 WebGL을 사용할 수 없습니다. 하드웨어 가속을 켜거나 다른 브라우저로 실행해 주세요.|WebGL unavailable. Enable hardware acceleration or use another browser.|WebGL非対応。ハードウェアアクセラレーションか別ブラウザを使用。|WebGL不可用，请开启硬件加速或使用其他浏览器。|WebGL無法使用，請開啟硬體加速或使用其他瀏覽器。|WebGL no disponible. Activa aceleración o usa otro navegador.|WebGL indisponível. Ative aceleração ou use outro navegador.|WebGL недоступен. Включите аппаратное ускорение или смените браузер.
리소스를 불러오지 못했습니다 (|Could not load resources (|リソース読込失敗（|无法加载资源（|無法載入資源（|No se cargaron recursos (|Recursos não carregados (|Ресурсы не загружены (
). 새로고침해 주세요.|). Please refresh.|）。再読込してください。|）。请刷新。|）。請重新整理。|). Recarga la página.|). Recarregue a página.|). Обновите страницу.
파일로 직접 열면 일부 사운드가 꺼집니다 — start_game.bat 으로 실행하세요|Opening as a file disables some audio — use start_game.bat|ファイル直接起動では一部音声不可。start_game.batを使用|直接打开文件会禁用部分声音，请使用start_game.bat|直接開啟檔案會停用部分聲音，請使用start_game.bat|Abrir como archivo desactiva audio: usa start_game.bat|Abrir como arquivo desativa áudio: use start_game.bat|При открытии файла часть звуков недоступна — используйте start_game.bat


설정에 언어 선택 추가 — 기본값은 시스템 언어, 선택한 언어 자동 저장|Added language selection: defaults to system language; remembers your choice.|言語選択追加：初期値はシステム言語、選択を自動保存。|新增语言选择：默认系统语言，自动保存选择。|新增語言選擇：預設系統語言，自動儲存選擇。|Selector de idioma: predeterminado del sistema; guarda tu elección.|Seletor de idioma: padrão do sistema; salva sua escolha.|Выбор языка: по умолчанию системный; выбор сохраняется.
한국어 · English · 日本語 · 简体中文 · 繁體中文 · Español · Português · Русский 지원|Supports Korean, English, Japanese, Simplified/Traditional Chinese, Spanish, Portuguese and Russian.|韓国語・英語・日本語・簡体字・繁体字・スペイン語・ポルトガル語・ロシア語対応。|支持韩语、英语、日语、简繁中文、西班牙语、葡萄牙语及俄语。|支援韓語、英語、日語、簡繁中文、西班牙語、葡萄牙語及俄語。|Coreano, inglés, japonés, chino simplificado/tradicional, español, portugués y ruso.|Coreano, inglês, japonês, chinês simplificado/tradicional, espanhol, português e russo.|Корейский, английский, японский, упрощённый/традиционный китайский, испанский, португальский, русский.
언어 변경 시 메뉴 · 대원과 장비 설명 · 강화 카드 · 전투 안내를 즉시 갱신|Language changes instantly update menus, unit/item descriptions, cards and combat hints.|言語変更でメニュー・隊員／装備説明・カード・戦闘案内を即更新。|切换语言立即更新菜单、队员装备说明、强化卡和战斗提示。|切換語言立即更新選單、隊員裝備說明、強化卡和戰鬥提示。|Cambiar idioma actualiza menús, descripciones, cartas y ayudas al instante.|Mudar idioma atualiza menus, descrições, cartas e dicas na hora.|Смена языка сразу обновляет меню, описания, карты и подсказки.
성장 개편 — 기본총 전용 숙련 9종을 모든 무기·스킬에 적용되는 대원별 전술 강화로 변경|9 starter-weapon masteries replaced with hero tactics for all weapons and skills.|初期武器熟練9種を全武器・スキル対応の戦術強化に変更。|9种初始武器熟练改为适用所有武器技能的角色战术强化。|9種初始武器熟練改為適用所有武器技能的角色戰術強化。|9 maestrías iniciales pasan a tácticas para todas las armas y habilidades.|9 maestrias iniciais viram táticas para todas as armas e habilidades.|9 навыков начального оружия заменены тактиками для всего оружия и навыков.
제압 · 표식 · 속박 · 실명 · 근접 전투와 연계해 무기를 바꿔도 강화 효과 유지|Tactics interact with suppression, marks, roots, blind and close combat; bonuses survive weapon swaps.|制圧・標的・束縛・暗闇・近接と連携、武器変更後も強化維持。|联动压制、标记、定身、致盲及近战，切枪后仍保留强化。|連動壓制、標記、定身、致盲及近戰，切槍後仍保留強化。|Las tácticas enlazan estados y cercanía; se mantienen al cambiar armas.|Táticas combinam estados e proximidade; mantêm bônus ao trocar armas.|Тактики связаны с состояниями и ближним боем; бонусы сохраняются при смене оружия.
님프 처치 보조와 노움 표식 폭발에 발동 간격 적용|Added activation limits to Nymph’s kill aid and Gnome’s mark explosions.|ニンフの撃破補助とノームの標的爆発に発動間隔を追加。|宁芙击杀辅助和侏儒标记爆炸增加触发间隔。|寧芙擊殺輔助和侏儒標記爆炸增加觸發間隔。|Se limitan activaciones de ayudas de Nymph y explosiones de Gnome.|Limites de ativação nas ajudas de Nymph e explosões de Gnome.|Ограничена частота помощи Нимфы за убийства и взрывов меток Гнома.
사격 강화 중 탄약 소모 면제를 보급 무기에도 적용 — 빈 탄창에서도 강화 시간 동안 사격 가능|Firing buffs also spare supply ammo; empty weapons can fire during the buff.|射撃強化の弾薬無消費を補給武器にも適用、空弾倉でも強化中射撃可。|射击强化期间补给武器同样不耗弹，空弹匣也可射击。|射擊強化期間補給武器同樣不耗彈，空彈匣也可射擊。|Mejoras de disparo ahorran munición también en armas vacías de suministro.|Bônus de tiro poupam munição também em armas de suprimento vazias.|Усиление огня сохраняет патроны трофейного оружия; можно стрелять даже с пустым магазином.
레일건 — 손잡이를 쥐는 손과 총열을 받치는 손의 위치 수정|Railgun: corrected grip and support-hand placement.|レールガンの握り手・支え手の位置を修正。|轨道炮：修正握持手与支撑手位置。|軌道砲：修正握持手與支撐手位置。|Cañón de riel: manos de agarre y apoyo corregidas.|Canhão elétrico: mãos de empunhadura e apoio corrigidas.|Рельсотрон: исправлено положение обеих рук.
양손 총기 11종 — 무기 크기와 대원별 손 모양에 맞춰 손잡이 · 받침 위치 보정|Adjusted grips and support hands on 11 two-handed firearms.|両手銃11種のサイズと手に合わせて位置補正。|11种双手枪械：按武器大小和队员手型修正握持位置。|11種雙手槍械：按武器大小和隊員手型修正握持位置。|Ajustadas manos en 11 armas de dos manos.|Ajustadas mãos em 11 armas de duas mãos.|Исправлены руки у 11 двуручных видов оружия.
손목 블래스터 — 겹쳐 있던 보조 손 제거, 한 손 착용 및 무기 크기 · 손목 연결 위치 수정|Wrist blaster: removed extra hand; fixed size and wrist attachment.|リストブラスターの余分な手を削除、サイズと手首接続を修正。|腕部爆破枪：移除多余辅助手，修正大小和手腕连接。|腕部爆破槍：移除多餘輔助手，修正大小和手腕連接。|Bláster: mano extra eliminada, tamaño y muñeca corregidos.|Blaster: mão extra removida, tamanho e pulso corrigidos.|Наручный бластер: убрана лишняя рука, исправлены размер и крепление.
음성 — T-4 케시크 음성 연결|Connected T-4 Kheshig voice lines.|T-4ケシクのボイスを接続。|连接T-4怯薛语音。|連接T-4怯薛語音。|Voces de T-4 Kheshig conectadas.|Vozes de T-4 Kheshig conectadas.|Подключены реплики T-4 Кешик.
안내 음성 추가 — 보스 등장 · 레벨 업 · 스테이지 클리어 · 체력 부족 · 게임 오버|Added announcer cues for bosses, level-ups, clears, low health and defeat.|ボス・レベルアップ・制圧・低体力・敗北の案内音声追加。|新增首领、升级、通关、低生命及失败提示语音。|新增首領、升級、通關、低生命及失敗提示語音。|Avisos de voz para jefes, niveles, victorias, poca salud y derrota.|Avisos de voz para chefes, níveis, vitórias, pouca vida e derrota.|Добавлены объявления о боссах, уровнях, зачистке, низком здоровье и поражении.
ESC 작전 상황에서 현재 대원의 E/F 설명 · 쿨타임 · 스킬 강화 확인|ESC operation status shows E/F descriptions, cooldowns and upgrades.|ESC作戦状況でE/F説明・待機時間・強化を確認。|ESC行动状态显示E/F说明、冷却及技能强化。|ESC行動狀態顯示E/F說明、冷卻及技能強化。|ESC muestra descripciones E/F, recargas y mejoras.|ESC mostra descrições E/F, recargas e melhorias.|В меню ESC: описания E/F, восстановление и улучшения.
새 버전이 올라오면 이전 스크립트 캐시 없이 바로 적용|New releases bypass old script caches.|新バージョンは旧スクリプトキャッシュを回避。|新版本绕过旧脚本缓存。|新版本略過舊腳本快取。|Nuevas versiones omiten la caché anterior.|Novas versões ignoram o cache anterior.|Новые версии обходят старый кэш скриптов.


스테이지 작전|Stage Operations|ステージ作戦|关卡行动|關卡行動|Operaciones por etapas|Operações por fases|Этапные операции
쉬움|Easy|簡単|简单|簡單|Fácil|Fácil|Легко
어려움|Hard|難しい|困难|困難|Difícil|Difícil|Сложно
난이도|Difficulty|難易度|难度|難度|Dificultad|Dificuldade|Сложность
이전 스테이지 클리어 시 개방|Clear the previous stage to unlock|前ステージクリアで解放|通关前一关卡解锁|通關前一關卡解鎖|Completa la etapa anterior|Conclua a fase anterior|Пройдите предыдущий этап
클리어 시 개방| clear to unlock|クリアで解放|通关后解锁|通關後解鎖| completado para desbloquear| concluído para desbloquear| пройти для открытия
중간 보스|Mid-boss|中ボス|中间首领|中間首領|Jefe intermedio|Chefe intermediário|Промежуточный босс
최종 보스|Final boss|最終ボス|最终首领|最終首領|Jefe final|Chefe final|Финальный босс
적 체력|Enemy health|敵体力|敌人生命|敵人生命|Salud enemiga|Vida inimiga|Здоровье врагов
층|floor|階|层|層|piso|andar|этаж
동결 저장고|Frozen Storage|凍結貯蔵庫|冷冻仓库|冷凍倉庫|Almacén congelado|Depósito congelado|Морозильное хранилище
용광로 구역|Furnace Sector|溶鉱炉区画|熔炉区域|熔爐區域|Sector de hornos|Setor da fornalha|Сектор печей
오염 처리장|Waste Treatment|汚染処理場|污染处理厂|污染處理廠|Tratamiento de residuos|Tratamento de resíduos|Очистной комплекс
수몰 구역|Flooded Sector|水没区画|淹没区域|淹沒區域|Sector inundado|Setor inundado|Затопленный сектор
발전 구역|Power Sector|発電区画|发电区域|發電區域|Sector de energía|Setor de energia|Энергосектор
오르카 외곽|Orca Outskirts|オルカ外郭|奥尔卡外围|奧爾卡外圍|Afueras de Orca|Arredores de Orca|Окраины «Орки»
수몰 정비창|Flooded Workshop|水没整備場|淹没维修厂|淹沒維修廠|Taller inundado|Oficina inundada|Затопленная мастерская
용광로 전선|Furnace Front|溶鉱炉前線|熔炉前线|熔爐前線|Frente de hornos|Frente da fornalha|Фронт печей
잠긴 대원입니다 — 다른 대원을 고르세요|Unit locked — choose another|未解放の隊員です、別の隊員を選択|队员未解锁——请选择其他队员|隊員未解鎖——請選擇其他隊員|Unidad bloqueada: elige otra|Unidade bloqueada: escolha outra|Боец закрыт — выберите другого
데이터 칩 파밍 — 오르카 던전 B1 ~ B6|Data-chip runs — Orca Dungeon B1–B6|データチップ収集：オルカB1～B6|数据芯片获取——奥尔卡地牢B1～B6|資料晶片獲取——奧爾卡地牢B1～B6|Chips: mazmorra Orca B1–B6|Chips: masmorra Orca B1–B6|Сбор чипов — подземелье «Орка» B1–B6
스테이지 5개 · 난이도 쉬움 / 보통 / 어려움 · 장비 파밍 (데이터 칩은 조금)|5 stages · Easy / Normal / Hard · equipment rewards, fewer chips|5ステージ・簡単／標準／難しい・装備報酬（チップ少量）|5个关卡 · 简单／标准／困难 · 获取装备（少量芯片）|5個關卡 · 簡單／標準／困難 · 獲取裝備（少量晶片）|5 etapas · Fácil / Normal / Difícil · equipo y pocos chips|5 fases · Fácil / Normal / Difícil · equipamento e poucos chips|5 этапов · Легко / Обычно / Сложно · снаряжение и немного чипов

`;
  function keyOf(key){if(!key.startsWith('$'))return key;const [type,id,field]=key.slice(1).split(':');const list=type==='item'?DATA.ITEMS:type==='perk'?DATA.PERKS:[...DATA.HEROES,...DATA.HIDDEN];const obj=list.find(x=>x.id===id);return obj&&(type==='secondary'?obj.sk2[field]:obj[field]);}
  function add(source,values){if(!source)return;langs.forEach((lang,i)=>window.LOCALES[lang][source]=values[i]);}
  for(const line of rows.trim().split('\n').filter(s=>s.trim())){const [key,...v]=line.split('|');if(v.length!==7)throw new Error('Invalid content locale: '+key);add(keyOf(key),v);}
  for(const [source,name] of Object.entries({"나이트 칙": "Night Chick", "드론": "Drone", "퍼프헤드": "Pupp Head", "폴른": "Fallen", "레기온": "Legion", "센츄리온": "Centurion", "프레데터": "Predator", "인트루더": "Intruder", "기간테스": "Gigantes", "팔랑기테스": "Phalangites", "하베스터": "Harvester", "저거너트": "Juggernaut", "빅 칙": "Big Chick", "포트리스": "Fortress", "디스트로이어": "Destroyer", "둠 이터": "Doom Eater", "블랙 나이트": "Black Knight", "엠페러 칙": "Emperor Chick", "골타리온": "Goltarion", "엑스큐셔너": "Executioner", "니드호그": "Nidhogg", "나이트 칙 퀸": "Night Chick Queen", "둠 이터 프라임": "Doom Eater Prime", "철혈의 왕자": "Ironblood Prince"}))add(source,langs.map(()=>name));
  for(const perk of DATA.PERKS.filter(p=>p.id.startsWith('u_'))){
    if(window.LOCALES.en[perk.name])continue;
    const h=[...DATA.HEROES,...DATA.HIDDEN].find(h=>h.id===perk.hero);if(!h)continue;
    const skill=(perk.id===h.upF||perk.id==='u_od')?h.skillName:h.sk2.name;
    add(perk.name,langs.map((l,i)=>(window.LOCALES[l][skill]||skill)+' '+['Upgrade','強化','强化','強化','Mejora','Melhoria','Улучшение'][i]));
  }
  const metaTemplates={
    hp:['Starting health +{n}','開始体力+{n}','初始生命+{n}','初始生命+{n}','Salud inicial +{n}','Vida inicial +{n}','Начальное здоровье +{n}'],
    key:['Starting keys +{n}','開始鍵+{n}','初始钥匙+{n}','初始鑰匙+{n}','Llaves iniciales +{n}','Chaves iniciais +{n}','Начальные ключи +{n}'],
    gold:['Starting parts +{n}','開始部品+{n}','初始零件+{n}','初始零件+{n}','Piezas iniciales +{n}','Peças iniciais +{n}','Начальные детали +{n}'],
    skill:['Start with {n}% ultimate charge','必殺技{n}%で開始','初始终极充能{n}%','初始終極充能{n}%','Carga inicial {n}%','Carga inicial {n}%','Начальный заряд {n}%'],
    luck:['Shop prices -{n}%; better supply chests','店の価格-{n}%、補給箱等級上昇','商店价格-{n}%，补给箱品质提高','商店價格-{n}%，補給箱品質提高','Precios -{n}%; cofres mejores','Preços -{n}%; baús melhores','Цены -{n}%; лучше сундуки']
  };
  const metaScale={hp:25,key:1,gold:20,skill:35,luck:7};
  for(const m of DATA.META)if(metaTemplates[m.id])for(let level=0;level<=m.max;level++)add(m.desc(level),metaTemplates[m.id].map(s=>s.replace('{n}',level*metaScale[m.id])));
  window.I18N_CONTENT={add,langs,keyOf};
})();
