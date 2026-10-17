/* Korean source text -> localized presentation. Columns: en, ja, zh-Hans, zh-Hant, es, pt, ru. */
(function(){
  const langs=['en','ja','zh-Hans','zh-Hant','es','pt','ru'];
  const rows=`
오르카 던전 돌파|Orca Dungeon Assault|オルカ・ダンジョン突破|奥尔卡地牢突围|奧爾卡地牢突圍|Asalto a la mazmorra Orca|Assalto à masmorra Orca|Штурм подземелья «Орка»
시스템 언어|System language|システム言語|系统语言|系統語言|Idioma del sistema|Idioma do sistema|Язык системы
언어|Language|言語|语言|語言|Idioma|Idioma|Язык
출격 대원 선택|Select squad leader|出撃隊員選択|选择出击队员|選擇出擊隊員|Elige líder|Escolha a líder|Выбор бойца
출격 개시|Deploy|出撃開始|开始出击|開始出擊|Desplegar|Iniciar missão|Начать операцию
작전 개시|Deploy|作戦開始|开始行动|開始行動|Iniciar operación|Iniciar operação|Начать операцию
연구소|Research Lab|研究所|研究所|研究所|Laboratorio|Laboratório|Лаборатория
설정 닫기|Close settings|設定を閉じる|关闭设置|關閉設定|Cerrar ajustes|Fechar configurações|Закрыть настройки
설정|Settings|設定|设置|設定|Ajustes|Configurações|Настройки
기본 훈련|Basic Training|基本訓練|基础训练|基礎訓練|Entrenamiento|Treinamento|Обучение
위험 등급|Threat Level|危険度|危险等级|危險等級|Nivel de amenaza|Nível de ameaça|Уровень угрозы
패치 노트|Patch Notes|更新履歴|更新日志|更新日誌|Notas del parche|Notas da atualização|Список изменений
무작위|Random|ランダム|随机|隨機|Aleatorio|Aleatório|Случайный выбор
해금 대원 중 랜덤|Random unlocked unit|解放済み隊員からランダム|随机已解锁队员|隨機已解鎖隊員|Unidad desbloqueada al azar|Unidade desbloqueada aleatória|Случайный открытый боец
아직 출격 기록이 없습니다.|No operations recorded yet.|出撃記録はまだありません。|暂无出击记录。|尚無出擊紀錄。|Aún no hay registros.|Ainda não há registros.|Записей об операциях пока нет.
작전 일시 정지|Operation paused|作戦一時停止|行动暂停|行動暫停|Operación en pausa|Operação pausada|Операция приостановлена
작전 상황|Operation Status|作戦状況|行动状态|行動狀態|Estado de operación|Estado da operação|Статус операции
옵션|Options|オプション|选项|選項|Opciones|Opções|Параметры
조작법|Controls|操作方法|操作说明|操作說明|Controles|Controles|Управление
전체 음량|Master volume|全体音量|主音量|主音量|Volumen general|Volume geral|Общая громкость
배경음|Music|BGM|背景音乐|背景音樂|Música|Música|Музыка
효과음|Sound effects|効果音|音效|音效|Efectos de sonido|Efeitos sonoros|Звуковые эффекты
대원 음성|Character voices|隊員ボイス|队员语音|隊員語音|Voces de personajes|Vozes das personagens|Голоса персонажей
음소거|Mute|ミュート|静音|靜音|Silenciar|Silenciar|Без звука
화면 흔들림|Screen shake|画面振動|画面震动|畫面震動|Vibración de pantalla|Tremor de tela|Тряска экрана
화면 번쩍임|Screen flashes|画面フラッシュ|画面闪光|畫面閃光|Destellos|Flashes|Вспышки экрана
피해 숫자|Damage numbers|ダメージ数値|伤害数字|傷害數字|Números de daño|Números de dano|Числа урона
자동 조준 보조|Aim assist|エイムアシスト|辅助瞄准|輔助瞄準|Ayuda de apuntado|Assistência de mira|Помощь в прицеливании
마우스 시점 당기기|Aim camera offset|マウス方向へ視点移動|鼠标视角偏移|滑鼠視角偏移|Cámara hacia la mira|Câmera na direção da mira|Смещение камеры к прицелу
사격 토글(누르고 있지 않기)|Toggle fire (no holding)|射撃切替（長押し不要）|切换射击（无需长按）|切換射擊（無須長按）|Alternar disparo (sin mantener)|Alternar disparo (sem segurar)|Переключение стрельбы (без удержания)
적탄 고대비 색|High-contrast enemy bullets|敵弾の高コントラスト色|敌弹高对比配色|敵彈高對比配色|Balas enemigas de alto contraste|Balas inimigas de alto contraste|Контрастные вражеские пули
조작 안내|Control hints|操作ガイド|操作提示|操作提示|Ayudas de control|Dicas de controle|Подсказки управления
HUD 크기|HUD size|HUDサイズ|界面大小|介面大小|Tamaño del HUD|Tamanho do HUD|Размер интерфейса
전체 화면|Fullscreen|全画面|全屏|全螢幕|Pantalla completa|Tela cheia|Полный экран
키 설정|Key bindings|キー設定|按键设置|按鍵設定|Asignación de teclas|Configurar teclas|Назначение клавиш
버튼 크기|Button size|ボタンサイズ|按钮大小|按鈕大小|Tamaño de botones|Tamanho dos botões|Размер кнопок
버튼 투명도|Button transparency|ボタン透明度|按钮透明度|按鈕透明度|Transparencia de botones|Transparência dos botões|Прозрачность кнопок
왼손 모드|Left-handed mode|左利きモード|左手模式|左手模式|Modo zurdo|Modo canhoto|Режим для левшей
UI 배치 편집|Edit UI layout|UI配置編集|编辑界面布局|編輯介面配置|Editar distribución|Editar layout|Настройка интерфейса
항목을 눌러 선택|Tap an element to select|項目をタップして選択|点击选择项目|點選項目|Toca un elemento|Toque em um elemento|Нажмите на элемент
항목을 끌어서 옮기고, 선택한 항목의 크기를 조절하세요|Drag elements to move; select one to resize.|ドラッグで移動し、選択した項目のサイズを調整。|拖动项目移动，选中后调整大小。|拖曳項目移動，選取後調整大小。|Arrastra para mover; selecciona para cambiar el tamaño.|Arraste para mover; selecione para redimensionar.|Перетаскивайте элементы; выберите элемент для изменения размера.
작게|Small|小|小|小|Pequeño|Pequeno|Малый
보통|Normal|標準|标准|標準|Normal|Normal|Обычный
크게|Large|大|大|大|Grande|Grande|Большой
기본값|Default|初期値|默认|預設|Predeterminado|Padrão|По умолчанию
초기화|Reset|リセット|重置|重設|Restablecer|Redefinir|Сбросить
저장|Save|保存|保存|儲存|Guardar|Salvar|Сохранить
취소|Cancel|キャンセル|取消|取消|Cancelar|Cancelar|Отмена
완료|Done|完了|完成|完成|Listo|Concluir|Готово
닫기|Close|閉じる|关闭|關閉|Cerrar|Fechar|Закрыть
작전 계속|Resume|作戦続行|继续行动|繼續行動|Continuar|Continuar|Продолжить
작전 포기|Abort operation|作戦放棄|放弃行动|放棄行動|Abandonar operación|Abandonar operação|Прервать операцию
정말 포기합니까? 한 번 더|Abort? Press again to confirm|放棄しますか？もう一度押す|确定放弃？再次点击确认|確定放棄？再次點擊確認|¿Abandonar? Pulsa de nuevo|Abandonar? Pressione novamente|Прервать? Нажмите ещё раз
일시 정지|Pause|一時停止|暂停|暫停|Pausa|Pausa|Пауза
전술 지도|Tactical Map|戦術マップ|战术地图|戰術地圖|Mapa táctico|Mapa tático|Тактическая карта
지도 닫기|Close map|マップを閉じる|关闭地图|關閉地圖|Cerrar mapa|Fechar mapa|Закрыть карту
탭: 지도|Tap: map|タップ：マップ|点击：地图|點選：地圖|Tocar: mapa|Toque: mapa|Нажать: карта
미니맵|Minimap|ミニマップ|小地图|小地圖|Minimapa|Minimapa|Мини-карта
상태 패널|Status panel|ステータスパネル|状态面板|狀態面板|Panel de estado|Painel de status|Панель состояния
사격 패드|Aim pad|射撃パッド|射击摇杆|射擊搖桿|Panel de disparo|Controle de tiro|Панель стрельбы
조준·사격|Aim & fire|照準・射撃|瞄准射击|瞄準射擊|Apuntar y disparar|Mirar e atirar|Прицел и стрельба
조준 · 사격|Aim & fire|照準・射撃|瞄准射击|瞄準射擊|Apuntar y disparar|Mirar e atirar|Прицел и стрельба
보조 스킬|Secondary skill|補助スキル|辅助技能|輔助技能|Habilidad secundaria|Habilidade secundária|Дополнительный навык
궁극기|Ultimate|必殺技|终极技能|終極技能|Habilidad definitiva|Habilidade suprema|Ультимативный навык
무기 교체|Switch weapon|武器切替|切换武器|切換武器|Cambiar arma|Trocar arma|Сменить оружие
상호작용|Interact|インタラクト|交互|互動|Interactuar|Interagir|Взаимодействие
재장전 필요|Reload required|リロードが必要|需要装填|需要裝填|Recarga necesaria|Recarregamento necessário|Требуется перезарядка
장전 없음|No reload|リロード不要|无需装填|無須裝填|Sin recarga|Sem recarga|Без перезарядки
탄약 없음|Out of ammo|弾薬切れ|弹药耗尽|彈藥耗盡|Sin munición|Sem munição|Нет патронов
재장전|Reload|リロード|装填|裝填|Recargar|Recarregar|Перезарядка
왼쪽 버튼|Left click|左クリック|鼠标左键|滑鼠左鍵|Clic izquierdo|Clique esquerdo|Левая кнопка мыши
오른쪽 버튼|Right click|右クリック|鼠标右键|滑鼠右鍵|Clic derecho|Clique direito|Правая кнопка мыши
마우스|Mouse|マウス|鼠标|滑鼠|Ratón|Mouse|Мышь
방향키|Arrow keys|方向キー|方向键|方向鍵|Flechas|Setas|Стрелки
게임패드|Gamepad|ゲームパッド|手柄|控制器|Mando|Controle|Геймпад
왼쪽 스틱 이동|Left stick: move|左スティック：移動|左摇杆移动|左搖桿移動|Stick izquierdo: mover|Analógico esquerdo: mover|Левый стик: движение
오른쪽 스틱 조준|Right stick: aim|右スティック：照準|右摇杆瞄准|右搖桿瞄準|Stick derecho: apuntar|Analógico direito: mirar|Правый стик: прицел
왼쪽 화면 드래그|Drag the left side|画面左側をドラッグ|拖动屏幕左侧|拖曳螢幕左側|Arrastra el lado izquierdo|Arraste o lado esquerdo|Тяните по левой части экрана
조준 패드를 누른 채 드래그|Hold and drag the aim pad|照準パッドを押してドラッグ|按住瞄准摇杆拖动|按住瞄準搖桿拖曳|Mantén y arrastra el panel de mira|Segure e arraste o controle de mira|Удерживайте и тяните панель прицела
구르는 동안 무적|Invulnerable while rolling|ローリング中は無敵|翻滚期间无敌|翻滾期間無敵|Invulnerable al rodar|Invulnerável ao rolar|Неуязвимость во время переката
스킬 / 보조 버튼|Ultimate / secondary buttons|必殺技／補助ボタン|终极／辅助按钮|終極／輔助按鈕|Botones de definitiva / secundaria|Botões de suprema / secundária|Кнопки ультимативного / доп. навыка
강화 모듈을 하나 선택하십시오|Choose one upgrade module|強化モジュールを選択|选择一个强化模块|選擇一個強化模組|Elige un módulo de mejora|Escolha um módulo de melhoria|Выберите модуль улучшения
강화 모듈을 하나 선택하세요|Choose one upgrade module|強化モジュールを選択|选择一个强化模块|選擇一個強化模組|Elige un módulo de mejora|Escolha um módulo de melhoria|Выберите модуль улучшения
공통|Universal|共通|通用|通用|Común|Comum|Общее
전용|Exclusive|専用|专属|專屬|Exclusivo|Exclusivo|Особое
임무 완료|Mission Complete|任務完了|任务完成|任務完成|Misión completada|Missão concluída|Задание выполнено
임무 실패|Mission Failed|任務失敗|任务失败|任務失敗|Misión fallida|Missão fracassada|Задание провалено
다시 도전|Retry|再挑戦|再次挑战|再次挑戰|Reintentar|Tentar novamente|Повторить
타이틀로|Title screen|タイトルへ|返回标题|返回標題|Pantalla de título|Tela inicial|В главное меню
작전 목표|Operation goals|作戦目標|行动目标|行動目標|Objetivos|Objetivos|Цели операции
피격 횟수|Hits taken|被弾回数|受击次数|受擊次數|Impactos recibidos|Acertos sofridos|Получено попаданий
작전 시간|Operation time|作戦時間|行动时间|行動時間|Tiempo de operación|Tempo da operação|Время операции
처치한 철충|Enemies defeated|鉄虫撃破数|击败铁虫|擊敗鐵蟲|Enemigos derrotados|Inimigos derrotados|Уничтожено врагов
가한 피해|Damage dealt|与ダメージ|造成伤害|造成傷害|Daño infligido|Dano causado|Нанесённый урон
제압한 구역|Rooms cleared|制圧区画|清理区域|清理區域|Salas despejadas|Salas concluídas|Зачищено комнат
격파한 보스|Bosses defeated|ボス撃破数|击败首领|擊敗首領|Jefes derrotados|Chefes derrotados|Побеждено боссов
최고 도달|Deepest floor|最高到達|最深到达|最深到達|Máxima profundidad|Maior profundidade|Максимальная глубина
최고 기록|Best record|最高記録|最佳纪录|最佳紀錄|Mejor marca|Melhor recorde|Лучший результат
출격 지점|Deployment point|出撃地点|出击地点|出擊地點|Punto de despliegue|Ponto de partida|Точка высадки
기본 무기 · 탄약 무한|Starting weapon · unlimited ammo|初期武器・弾薬無限|初始武器 · 无限弹药|初始武器 · 無限彈藥|Arma inicial · munición infinita|Arma inicial · munição infinita|Начальное оружие · бесконечные патроны
피해를 주면 충전|Charges by dealing damage|ダメージを与えると充填|造成伤害充能|造成傷害充能|Se carga al infligir daño|Carrega ao causar dano|Заряжается при нанесении урона
체력 · 방어막|Health · shield|体力・シールド|生命 · 护盾|生命 · 護盾|Salud · escudo|Vida · escudo|Здоровье · щит
화력|Firepower|火力|火力|火力|Potencia|Poder de fogo|Огневая мощь
내구|Defense|耐久|耐久|耐久|Defensa|Defesa|Защита
기동|Mobility|機動|机动|機動|Movilidad|Mobilidade|Подвижность
후보|Candidates|候補|候选|候選|Candidatas|Candidatas|Кандидаты
히든|Hidden|隠し|隐藏|隱藏|Oculto|Oculto|Скрытый
해금|Unlock|解放|解锁|解鎖|Desbloquear|Desbloquear|Открыть
강화|Upgrade|強化|强化|強化|Mejora|Melhoria|Улучшение
쿨타임|Cooldown|クールタイム|冷却时间|冷卻時間|Recarga|Recarga|Перезарядка навыка
회피|Dodge|回避|闪避|閃避|Esquivar|Esquivar|Уклонение
사격|Fire|射撃|射击|射擊|Disparar|Atirar|Стрельба
조준|Aim|照準|瞄准|瞄準|Apuntar|Mirar|Прицел
이동|Move|移動|移动|移動|Mover|Mover|Движение
장전|Reload|装填|装填|裝填|Recargar|Recarregar|Перезарядка
지도|Map|マップ|地图|地圖|Mapa|Mapa|Карта
스킬|Skill|スキル|技能|技能|Habilidad|Habilidade|Навык
보조|Secondary|補助|辅助|輔助|Secundaria|Secundária|Дополнительный
교체|Switch|切替|切换|切換|Cambiar|Trocar|Сменить
줍기|Pick up|拾う|拾取|拾取|Recoger|Pegar|Подобрать
무기|Weapon|武器|武器|武器|Arma|Arma|Оружие
계속|Resume|続行|继续|繼續|Continuar|Continuar|Продолжить
버리기|Drop|捨てる|丢弃|丟棄|Soltar|Largar|Выбросить
휠|Wheel|ホイール|滚轮|滾輪|Rueda|Roda|Колесо
확대/축소|Zoom|拡大／縮小|缩放|縮放|Zoom|Zoom|Масштаб
구매|Buy|購入|购买|購買|Comprar|Comprar|Купить
가격|Price|価格|价格|價格|Precio|Preço|Цена
부품|Parts|部品|零件|零件|Piezas|Peças|Детали
열쇠|Key|鍵|钥匙|鑰匙|Llave|Chave|Ключ
상점|Shop|ショップ|商店|商店|Tienda|Loja|Магазин
보급|Supply|補給|补给|補給|Suministro|Suprimentos|Снабжение
보스|Boss|ボス|首领|首領|Jefe|Chefe|Босс
체력|Health|体力|生命|生命|Salud|Vida|Здоровье
방어막|Shield|シールド|护盾|護盾|Escudo|Escudo|Щит
탄약|Ammo|弾薬|弹药|彈藥|Munición|Munição|Патроны
방어|Defense|防御|防御|防禦|Defensa|Defesa|Защита
피격|Hit taken|被弾|受击|受擊|Impacto recibido|Acerto sofrido|Попадание
도달|Reached|到達|到达|到達|Alcanzado|Alcançado|Достигнуто
분 이내|min or less|分以内|分钟以内|分鐘以內|min o menos|min ou menos|мин. или меньше
회 이하|or fewer hits|回以下|次以下|次以下|impactos o menos|acertos ou menos|попаданий или меньше
초|s|秒|秒|秒|s|s|с
회|times|回|次|次|veces|vezes|раз

조준 사격|Aimed Fire|照準射撃|瞄准射击|瞄準射擊|Disparo apuntado|Tiro preciso|Прицельный огонь
전술 수류탄|Tactical Grenade|戦術手榴弾|战术手雷|戰術手榴彈|Granada táctica|Granada tática|Тактическая граната
경기관총 난사|Machine-gun Barrage|軽機関銃乱射|轻机枪扫射|輕機槍掃射|Ráfaga de ametralladora|Rajada de metralhadora|Пулемётный шквал
기관총 사격|Focused Machine-gun Fire|機関銃射撃|机枪射击|機槍射擊|Fuego concentrado|Fogo concentrado|Сосредоточенный огонь
제압 난사|Suppressive Barrage|制圧乱射|压制扫射|壓制掃射|Descarga de supresión|Rajada de supressão|Подавляющий обстрел
집속 사격|Focused Burst|集束射撃|集束射击|集束射擊|Ráfaga concentrada|Rajada concentrada|Прицельная очередь
전술 배치|Tactical Deployment|戦術配置|战术部署|戰術部署|Despliegue táctico|Posicionamento tático|Тактическое развёртывание
근거리 포격|Point-blank Barrage|至近距離砲撃|近距离炮击|近距離砲擊|Bombardeo a quemarropa|Bombardeio à queima-roupa|Обстрел в упор
방벽 생성|Barrier Deployment|防壁展開|生成屏障|生成屏障|Crear barrera|Gerar barreira|Развёртывание барьера
원호 사격|Covering Fire|援護射撃|掩护射击|掩護射擊|Fuego de cobertura|Fogo de cobertura|Прикрывающий огонь
발목 잡기|Ankle Snare|足止め|牵制脚步|牽制腳步|Trampa de tobillo|Imobilização|Захват ног
라이플 사격|Rifle Shot|ライフル射撃|步枪射击|步槍射擊|Disparo de rifle|Tiro de rifle|Выстрел из винтовки
요인 경호|VIP Escort|要人護衛|要员护卫|要員護衛|Escolta VIP|Escolta VIP|Охрана VIP
듀얼 버스트|Dual Burst|デュアルバースト|双枪连射|雙槍連射|Ráfaga doble|Rajada dupla|Двойная очередь
사이클롭스 이터널 빔|Cyclops Eternal Beam|サイクロプス・エターナルビーム|独眼巨人永恒光束|獨眼巨人永恆光束|Rayo eterno del cíclope|Raio eterno do ciclope|Вечный луч циклопа
액스 오브 다크니스|Axe of Darkness|アックス・オブ・ダークネス|黑暗之斧|黑暗之斧|Hacha de la oscuridad|Machado das trevas|Топор тьмы
드래곤 슬레이어|Dragon Slayer|ドラゴンスレイヤー|屠龙者|屠龍者|Matadragones|Matador de dragões|Убийца драконов
브레스트 라이언|Breast Lion|ブレストライオン|胸部雄狮|胸部雄獅|León del pecho|Leão do peito|Грудной лев
T-2 브라우니|T-2 Brownie|T-2 ブラウニー|T-2 布朗尼|T-2 布朗尼|T-2 Brownie|T-2 Brownie|T-2 Брауни
T-3 레프리콘|T-3 Leprechaun|T-3 レプリコン|T-3 小妖精|T-3 小妖精|T-3 Leprechaun|T-3 Leprechaun|T-3 Лепрекон
T-10 님프|T-10 Nymph|T-10 ニンフ|T-10 宁芙|T-10 寧芙|T-10 Nymph|T-10 Nymph|T-10 Нимфа
T-4 케시크|T-4 Kheshig|T-4 ケシク|T-4 怯薛|T-4 怯薛|T-4 Kheshig|T-4 Kheshig|T-4 Кешик
T-20S 노움|T-20S Gnome|T-20S ノーム|T-20S 侏儒|T-20S 侏儒|T-20S Gnome|T-20S Gnome|T-20S Гном
콘스탄챠 S2|Constantia S2|コンスタンツァS2|康斯坦丁 S2|康斯坦丁 S2|Constantia S2|Constantia S2|Констанция S2
블랙 리리스|Black Lilith|ブラックリリス|黑莉莉丝|黑莉莉絲|Black Lilith|Black Lilith|Чёрная Лилит
램파리온|Ramparion|ランパリオン|兰帕利昂|蘭帕利昂|Ramparion|Ramparion|Рампарион
램파트|Rampart|ランパート|堡垒|堡壘|Rampart|Rampart|Рампарт
브라우니|Brownie|ブラウニー|布朗尼|布朗尼|Brownie|Brownie|Брауни
레프리콘|Leprechaun|レプリコン|小妖精|小妖精|Leprechaun|Leprechaun|Лепрекон
케시크|Kheshig|ケシク|怯薛|怯薛|Kheshig|Kheshig|Кешик
님프|Nymph|ニンフ|宁芙|寧芙|Nymph|Nymph|Нимфа
노움|Gnome|ノーム|侏儒|侏儒|Gnome|Gnome|Гном
스틸라인 돌격병|Steel Line Assault Trooper|スチールライン突撃兵|钢铁防线突击兵|鋼鐵防線突擊兵|Soldado de asalto Steel Line|Soldado de assalto Steel Line|Штурмовик Steel Line
스틸라인 기관총 사수|Steel Line Machine Gunner|スチールライン機関銃手|钢铁防线机枪手|鋼鐵防線機槍手|Ametralladora de Steel Line|Metralhadora da Steel Line|Пулемётчик Steel Line
스틸라인 화력 지원병|Steel Line Fire Support|スチールライン火力支援兵|钢铁防线火力支援兵|鋼鐵防線火力支援兵|Apoyo de fuego Steel Line|Apoio de fogo Steel Line|Огневая поддержка Steel Line
앵거 오브 호드 의무병|Anger of Horde Medic|アンガーオブホード衛生兵|部落之怒医护兵|部落之怒醫護兵|Médica de Anger of Horde|Médica da Anger of Horde|Медик Anger of Horde
스틸라인 유탄병|Steel Line Grenadier|スチールライン擲弾兵|钢铁防线榴弹兵|鋼鐵防線榴彈兵|Granadera de Steel Line|Granadeira da Steel Line|Гренадер Steel Line
정밀 사격 전문가|Precision Shooting Expert|精密射撃の専門家|精准射击专家|精準射擊專家|Experta en tiro preciso|Especialista em tiro preciso|Эксперт по точной стрельбе
쌍권총 전투 바이오로이드|Dual-pistol combat bioroid|双拳銃戦闘バイオロイド|双枪战斗生化人|雙槍戰鬥生化人|Bioroide de combate con dos pistolas|Bioroide de combate com duas pistolas|Боевой биороид с двумя пистолетами
자칭 진조의 흑마법사|Self-proclaimed true vampire mage|自称真祖の黒魔術師|自称真祖的黑魔法师|自稱真祖的黑魔法師|Autoproclamada maga vampírica|Autoproclamada maga vampírica|Самопровозглашённая вампирша-маг
강철의 수호자|Guardian of Steel|鋼の守護者|钢铁守护者|鋼鐵守護者|Guardián de acero|Guardião de aço|Стальной страж
돌격소총|Assault Rifle|アサルトライフル|突击步枪|突擊步槍|Rifle de asalto|Rifle de assalto|Штурмовая винтовка
경기관총|Light Machine Gun|軽機関銃|轻机枪|輕機槍|Ametralladora ligera|Metralhadora leve|Ручной пулемёт
유탄발사기|Grenade Launcher|グレネードランチャー|榴弹发射器|榴彈發射器|Lanzagranadas|Lança-granadas|Гранатомёт
정밀소총|Marksman Rifle|精密ライフル|精确步枪|精確步槍|Rifle de precisión|Rifle de precisão|Марксманская винтовка
자동 산탄총|Automatic Shotgun|オートショットガン|自动霰弹枪|自動霰彈槍|Escopeta automática|Escopeta automática|Автоматический дробовик
산탄총|Shotgun|ショットガン|霰弹枪|霰彈槍|Escopeta|Escopeta|Дробовик
손목 블래스터|Wrist Blaster|リストブラスター|腕部爆破枪|腕部爆破槍|Bláster de muñeca|Blaster de pulso|Наручный бластер
고속 소총|High-velocity Rifle|高速ライフル|高速步枪|高速步槍|Rifle de alta velocidad|Rifle de alta velocidade|Скоростная винтовка
전격총|Arc Gun|電撃銃|电击枪|電擊槍|Arma eléctrica|Arma elétrica|Электропушка
화염포|Flame Cannon|火炎砲|火焰炮|火焰砲|Cañón de fuego|Canhão de chamas|Огнемётная пушка
레일건|Railgun|レールガン|轨道炮|軌道砲|Cañón de riel|Canhão elétrico|Рельсотрон
회전포|Rotary Cannon|回転砲|转管炮|轉管砲|Cañón rotativo|Canhão rotativo|Роторная пушка
박격포|Mortar|迫撃砲|迫击炮|迫擊砲|Mortero|Morteiro|Миномёт
대물저격총|Anti-materiel Rifle|対物ライフル|反器材步枪|反器材步槍|Rifle antimaterial|Rifle antimaterial|Крупнокалиберная винтовка
쌍권총|Dual Pistols|双拳銃|双枪|雙槍|Dos pistolas|Pistolas duplas|Парные пистолеты
리펄서|Repulsor|リパルサー|冲击炮|衝擊砲|Repulsor|Repulsor|Репульсор
어깨 포|Shoulder Cannon|ショルダーキャノン|肩炮|肩砲|Cañón de hombro|Canhão de ombro|Наплечная пушка
마도 지팡이|Arcane Staff|魔法の杖|魔法杖|魔法杖|Bastón arcano|Cajado arcano|Магический посох
모든 무기·스킬|All weapons and skills|全武器・スキル|所有武器与技能|所有武器與技能|Todas las armas y habilidades|Todas as armas e habilidades|Всё оружие и навыки
전술 추격|Tactical Pursuit|戦術追撃|战术追击|戰術追擊|Persecución táctica|Perseguição tática|Тактическое преследование
제압 교리|Suppression Doctrine|制圧教義|压制准则|壓制準則|Doctrina de supresión|Doutrina de supressão|Доктрина подавления
기동 지원|Mobile Support|機動支援|机动支援|機動支援|Apoyo móvil|Apoio móvel|Мобильная поддержка
표식 연쇄|Mark Chain|標的連鎖|标记连锁|標記連鎖|Cadena de marcas|Corrente de marcas|Цепь меток
약점 포착|Weak-point Analysis|弱点捕捉|捕捉弱点|捕捉弱點|Detectar debilidad|Detectar fraqueza|Поиск слабостей
근접 대응|Close-range Response|近接対応|近战应对|近戰應對|Respuesta cercana|Resposta próxima|Ближний бой
경호 전술|Escort Tactics|護衛戦術|护卫战术|護衛戰術|Tácticas de escolta|Táticas de escolta|Тактика охраны
암흑 추적|Dark Pursuit|闇の追跡|黑暗追踪|黑暗追蹤|Acecho oscuro|Perseguição sombria|Тёмное преследование
돌파 교리|Breakthrough Doctrine|突破教義|突破准则|突破準則|Doctrina de ruptura|Doutrina de avanço|Доктрина прорыва
피해 증가|Damage increase|ダメージ増加|伤害提升|傷害提升|Aumento de daño|Aumento de dano|Увеличение урона
공격력|Attack|攻撃力|攻击力|攻擊力|Ataque|Ataque|Атака
재장전 속도|Reload speed|リロード速度|装填速度|裝填速度|Velocidad de recarga|Velocidade de recarga|Скорость перезарядки
연사 속도|Fire rate|連射速度|射速|射速|Cadencia de tiro|Cadência de tiro|Скорострельность
치명타 확률|Critical chance|クリティカル率|暴击率|暴擊率|Probabilidad crítica|Chance de crítico|Шанс критического удара
치명타|Critical|クリティカル|暴击|暴擊|Crítico|Crítico|Критический удар
최대 체력|Max health|最大体力|最大生命|最大生命|Salud máxima|Vida máxima|Максимум здоровья
이동 속도|Movement speed|移動速度|移动速度|移動速度|Velocidad de movimiento|Velocidade de movimento|Скорость движения
탄창 용량|Magazine capacity|装弾数|弹匣容量|彈匣容量|Capacidad del cargador|Capacidade do carregador|Ёмкость магазина
최대 탄약|Max ammo|最大弾薬|最大弹药|最大彈藥|Munición máxima|Munição máxima|Максимум патронов
탄창|Magazine|弾倉|弹匣|彈匣|Cargador|Carregador|Магазин
탄속|Projectile speed|弾速|弹速|彈速|Velocidad del proyectil|Velocidade do projétil|Скорость снаряда
관통|Pierce|貫通|穿透|貫穿|Penetración|Penetração|Пробивание
범위|Radius|範囲|范围|範圍|Radio|Raio|Радиус
지속|Duration|持続|持续|持續|Duración|Duração|Длительность
피해|Damage|ダメージ|伤害|傷害|Daño|Dano|Урон
제압|Suppression|制圧|压制|壓制|Supresión|Supressão|Подавление
표식|Mark|標的|标记|標記|Marca|Marca|Метка
속박|Root|束縛|定身|定身|Inmovilización|Imobilização|Обездвиживание
실명|Blind|暗闇|致盲|致盲|Ceguera|Cegueira|Ослепление
기절|Stun|気絶|眩晕|暈眩|Aturdimiento|Atordoamento|Оглушение
둔화|Slow|スロー|减速|緩速|Ralentización|Lentidão|Замедление
넉백|Knockback|ノックバック|击退|擊退|Empuje|Repulsão|Отбрасывание
적탄 소거|Clear enemy bullets|敵弾消去|消除敌弹|消除敵彈|Elimina balas enemigas|Apaga balas inimigas|Уничтожение вражеских пуль
기폭|Detonate|起爆|引爆|引爆|Detonar|Detonar|Подрыв
부여|Apply|付与|施加|施加|Aplicar|Aplicar|Наложение
상태이상|Status effect|状態異常|异常状态|異常狀態|Efecto de estado|Efeito de estado|Эффект состояния

`;
  window.LOCALES=window.LOCALES||{};
  for(const lang of langs)window.LOCALES[lang]=window.LOCALES[lang]||{};
  for(const line of rows.trim().split('\n').filter(line=>line.trim())){const [key,...values]=line.split('|');if(values.length!==7)throw new Error('Invalid locale row: '+key);langs.forEach((lang,i)=>window.LOCALES[lang][key]=values[i]);}
})();
