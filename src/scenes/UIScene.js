import Phaser from 'phaser';
import {VIEW_WIDTH, VIEW_HEIGHT, UI_BAR_HEIGHT} from '../config.js';
import {GameState, SKILLS} from '../state.js';

// 월드 씬 위에 겹쳐 도는 씬. 카메라 줌이 1이라 텍스트가 원본 해상도로 나온다.
const BAR_TOP = VIEW_HEIGHT - UI_BAR_HEIGHT;
const BAR_X = 62;
const BAR_W = 240;
const BAR_H = 14;
const HP_Y = BAR_TOP + 22;
const DP_Y = BAR_TOP + 52;

// 글자를 키우면서 왼쪽의 '다음 레벨까지 …'가 길어져 스킬 슬롯과 부딪혔다.
// 슬롯 시작점을 오른쪽으로 밀어 자리를 비운다.
const SKILL_X = 590;
const SKILL_SLOT = 40;
const SKILL_GAP = 10;

const COLOR = {
  panel: 0x14141c,
  border: 0x3d3d4a,
  borderLocked: 0x2a2a34,
  slot: 0x24242e,
  hp: 0xd6455d,
  dp: 0x4aa3d8,
  empty: 0x2c2c38,
};

const LABEL = {fontFamily: 'sans-serif', fontSize: '16px', color: '#9a9aa8'};
const VALUE = {fontFamily: 'sans-serif', fontSize: '16px', color: '#e8e8f0'};

export default class UIScene extends Phaser.Scene {
  constructor() {
    super({key: 'UIScene', active: false});
  }

  create() {
    // Phaser는 씬을 재시작해도 인스턴스를 재사용한다. 표시 객체는 새로 만들어지므로
    // 이전 생애에서 남은 캐시를 비워야 refresh가 첫 갱신을 건너뛰지 않는다.
    this.lastSig = null;

    this.add.rectangle(0, BAR_TOP, VIEW_WIDTH, UI_BAR_HEIGHT, COLOR.panel).setOrigin(0, 0);
    this.add.rectangle(0, BAR_TOP, VIEW_WIDTH, 2, COLOR.border).setOrigin(0, 0);

    this.bars = this.add.graphics();

    this.add.text(24, HP_Y - 1, 'HP', LABEL);
    this.add.text(24, DP_Y - 1, 'DP', LABEL);
    this.hpText = this.add.text(BAR_X + BAR_W + 12, HP_Y - 1, '', VALUE);
    this.dpText = this.add.text(BAR_X + BAR_W + 12, DP_Y - 1, '', VALUE);

    this.lvText = this.add
      .text(BAR_X + BAR_W + 116, BAR_TOP + 22, '', {
        fontFamily: 'sans-serif',
        fontSize: '21px',
        color: '#ffd479',
      })
      .setOrigin(0, 0);
    this.expText = this.add
      .text(BAR_X + BAR_W + 116, BAR_TOP + 56, '', {fontFamily: 'sans-serif', fontSize: '14px', color: '#7f7f8c'})
      .setOrigin(0, 0);

    this.buildSkillSlots();
    this.buildPotionSlot('supplement', 'item-supplement', VIEW_WIDTH - 470);
    this.buildPotionSlot('americano', 'item-americano', VIEW_WIDTH - 380);
    this.buildWeaponSlot(VIEW_WIDTH - 280);

    this.buildBossBar();
    this.buildAcquireModal();

    this.buildHint();

    this.buildMapName();

    this.slots = {};
    this.buildDebugOverlay();
    this.refresh();
  }

  // ★ 왼쪽 위에 뜨는 '맵이름'.
  //    글자는 각 맵 씬의 mapName 게터가 정한다 —
  //    사무실은 OfficeScene, 거리는 StreetScene, 던전 층은 dungeonScenes.js의 name.
  //    여기서는 위치·크기·색만 만진다.
  buildMapName() {
    this.mapNameText = this.add
      .text(24, 24, '', {
        fontFamily: 'sans-serif',
        fontSize: '33px',
        color: '#fff',
        // 몬스터가 외치는 글씨와 같은 방식. 밝은 바닥 위에서도 읽히게 테두리를 두른다.
        stroke: '#14161c',
        strokeThickness: 6,
      })
      .setDepth(40)
      .setAlpha(0);

    this.setMapName(this.activeMapScene()?.mapName);
  }

  // 맵을 옮길 때마다 맵 씬이 불러 준다. 잠깐 떠 있다가 흐려진다.
  setMapName(name) {
    if (!this.mapNameText || !name) return;

    this.mapNameText.setText(name).setAlpha(0);
    this.tweens.killTweensOf(this.mapNameText);
    this.tweens.add({targets: this.mapNameText, alpha: 1, duration: 400});
    this.tweens.add({targets: this.mapNameText, alpha: 0.35, delay: 3200, duration: 800});
  }

  // 개발용 실시간 오버레이. 매 프레임 바뀌는 값은 콘솔보다 화면에서 보는 게 낫다.
  // ` (백틱) 키로 켜고 끈다. 빌드에는 포함되지 않는다.
  buildDebugOverlay() {
    if (!import.meta.env.DEV) return;

    // 맵이름 아래에 붙인다. 같은 자리에 두면 겹쳐서 둘 다 못 읽는다.
    this.debugText = this.add
      .text(12, 60, '', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#7df9a6',
        backgroundColor: '#000000cc',
        padding: {x: 8, y: 6},
        lineSpacing: 2,
      })
      .setDepth(50)
      .setVisible(false);

    this.input.keyboard.on('keydown-BACKTICK', () => {
      this.debugText.setVisible(!this.debugText.visible);
    });
  }

  // 지금 돌고 있는 맵 씬(사무실/거리/던전)을 찾는다.
  activeMapScene() {
    return this.scene.manager.getScenes(true).find((s) => s.player);
  }

  refreshDebug() {
    if (!this.debugText?.visible) return;

    const s = GameState;
    const map = this.activeMapScene();
    const now = this.game.loop.time;

    const cools = SKILLS.filter((sk) => sk.cooldown > 0)
      .map((sk) => {
        const left = ((GameState.cooldownUntil[sk.id] ?? 0) - now) / 1000;
        return `${sk.key}:${left > 0 ? left.toFixed(1) : 'ready'}`;
      })
      .join('  ');

    const lines = [
      `FPS ${Math.round(this.game.loop.actualFps)}   scene ${map?.scene.key ?? '-'}`,
      `pos  ${map ? `${Math.round(map.player.x)}, ${Math.round(map.player.y)}` : '-'}   tile ${map ? `${map.player.tileX}, ${map.player.tileY}` : '-'}`,
      `face ${map?.player.facing ?? '-'}   무적 ${map?.player.invulnerable ? 'Y' : 'N'}`,
      `HP ${Math.ceil(s.hp)}/${s.maxHp}   DP ${Math.ceil(s.dp)}/${s.maxDp}`,
      `Lv ${s.level}   EXP ${s.exp}   무기 ${s.weapon?.name ?? '맨손'}`,
      `적 ${map?.enemies?.countActive() ?? 0}   내탄 ${map?.playerShots?.getLength() ?? 0}   적탄 ${map?.enemyShots?.getLength() ?? 0}`,
      `쿨 ${cools}`,
      '` 키로 끄기',
    ];

    this.debugText.setText(lines.join('\n'));
  }

  buildSkillSlots() {
    const y = BAR_TOP + 10;
    this.skillSlots = SKILLS.map((skill, i) => {
      const x = SKILL_X + i * (SKILL_SLOT + SKILL_GAP);
      const box = this.add
        .rectangle(x, y, SKILL_SLOT, SKILL_SLOT, COLOR.slot)
        .setOrigin(0, 0)
        .setStrokeStyle(1, COLOR.border);
      const icon = this.add.image(x + SKILL_SLOT / 2, y + SKILL_SLOT / 2, skill.icon).setScale(1.4);

      // 쿨타임 동안 아이콘 위를 덮고 남은 초를 보여 준다.
      const veil = this.add
        .rectangle(x, y, SKILL_SLOT, SKILL_SLOT, 0x000000, 0.62)
        .setOrigin(0, 0)
        .setVisible(false);
      const timer = this.add
        .text(x + SKILL_SLOT / 2, y + SKILL_SLOT / 2, '', {
          fontFamily: 'sans-serif',
          fontSize: '18px',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setVisible(false);

      const label = this.add
        .text(x + SKILL_SLOT / 2, y + SKILL_SLOT + 5, '', {fontFamily: 'sans-serif', fontSize: '15px'})
        .setOrigin(0.5, 0);
      return {skill, box, icon, label, veil, timer};
    });
  }

  // 쿨타임은 매 프레임 변하므로 값 캐시(refresh)와 분리해서 갱신한다.
  refreshCooldowns() {
    const now = this.game.loop.time;

    this.skillSlots.forEach(({skill, icon, veil, timer}) => {
      const until = GameState.cooldownUntil[skill.id] ?? 0;
      const remain = until - now;
      const cooling = remain > 0 && GameState.hasSkill(skill);

      veil.setVisible(cooling);
      timer.setVisible(cooling);

      if (!cooling) {
        if (GameState.hasSkill(skill)) icon.setAlpha(1);
        return;
      }

      icon.setAlpha(0.5);
      const seconds = (remain / 1000).toFixed(1);
      if (timer.text !== seconds) timer.setText(seconds);
    });
  }

  buildPotionSlot(key, texture, x) {
    const y = BAR_TOP + 26;
    this.add.rectangle(x, y, 36, 36, COLOR.slot).setOrigin(0, 0).setStrokeStyle(1, COLOR.border);
    this.add.image(x + 18, y + 18, texture).setScale(1.4);
    this[`${key}Text`] = this.add.text(x + 42, y + 11, '', VALUE);
  }

  buildWeaponSlot(x) {
    const y = BAR_TOP + 26;
    this.add.rectangle(x, y, 36, 36, COLOR.slot).setOrigin(0, 0).setStrokeStyle(1, COLOR.border);
    this.weaponIcon = this.add.image(x + 18, y + 18, 'item-keyboard').setScale(1.4);
    this.add.text(x + 44, y - 8, '무기', LABEL);

    // 전설의 키보드처럼 이름이 긴 무기가 있어 두 줄까지 감싼다.
    this.weaponText = this.add.text(x + 44, y + 9, '', {
      ...VALUE,
      wordWrap: {width: VIEW_WIDTH - (x + 44) - 12},
      lineSpacing: 3,
    });
  }

  drawBar(x, y, ratio, color) {
    this.bars.fillStyle(COLOR.empty);
    this.bars.fillRect(x, y, BAR_W, BAR_H);
    this.bars.fillStyle(color);
    this.bars.fillRect(x, y, Math.max(0, Math.round(BAR_W * ratio)), BAR_H);
    this.bars.lineStyle(1, COLOR.border);
    this.bars.strokeRect(x + 0.5, y + 0.5, BAR_W - 1, BAR_H - 1);
  }

  // setText는 텍스처를 다시 굽기 때문에 값이 바뀐 프레임에만 갱신한다.
  refresh() {
    const s = GameState;
    const sig = `${Math.ceil(s.hp)}/${s.maxHp}|${Math.ceil(s.dp)}/${s.maxDp}|${s.level}|${s.exp}|${s.potions.supplement}|${s.potions.americano}|${s.weapon?.id ?? '-'}`;
    if (sig === this.lastSig) return;
    this.lastSig = sig;

    this.bars.clear();
    this.drawBar(BAR_X, HP_Y, s.hp / s.maxHp, COLOR.hp);
    this.drawBar(BAR_X, DP_Y, s.dp / s.maxDp, COLOR.dp);

    this.hpText.setText(`${Math.ceil(s.hp)} / ${s.maxHp}`);
    this.dpText.setText(`${Math.ceil(s.dp)} / ${s.maxDp}`);
    this.lvText.setText(`Lv.${s.level}`);
    const toNext = s.expToNext();
    this.expText.setText(toNext === null ? 'MAX' : `다음 레벨까지 ${toNext}`);
    this.supplementText.setText(`x${s.potions.supplement}`);
    this.americanoText.setText(`x${s.potions.americano}`);

    if (s.weapon) {
      this.weaponIcon.setVisible(true).setTint(s.weapon.color);
      this.weaponText.setText(s.weapon.name);
    } else {
      this.weaponIcon.setVisible(false);
      this.weaponText.setText('맨손');
    }

    this.skillSlots.forEach(({skill, box, icon, label}) => {
      const unlocked = s.hasSkill(skill);
      const affordable = s.dp >= skill.dp;

      // 잠긴 스킬은 왜 못 쓰는지 보여 준다.
      // 레벨은 됐지만 아직 안 열린 스킬(버그 소환)은 레벨을 적으면 오히려 헷갈리므로 물음표로 둔다.
      if (!unlocked) {
        const gate = skill.requiresUnlock && s.level >= skill.level ? '???' : `Lv.${skill.level}`;
        label.setText(gate).setColor('#55555f');
      } else {
        label.setText(skill.dp ? `${skill.key}·${skill.dp}` : skill.key);
        label.setColor(affordable ? '#e8e8f0' : '#d6455d');
      }

      icon.setAlpha(unlocked ? 1 : 0.18);
      box.setStrokeStyle(1, unlocked ? COLOR.border : COLOR.borderLocked);
    });
  }

  update() {
    this.refresh();
    this.refreshCooldowns();
    this.refreshBossBar();
    this.refreshDebug();
  }

  // 보스전에만 화면 위쪽에 뜨는 체력 바.
  buildBossBar() {
    const w = 560;
    const x = VIEW_WIDTH / 2;

    this.bossBar = this.add.container(x, 44).setVisible(false).setDepth(18);

    const back = this.add.rectangle(0, 0, w, 16, COLOR.empty).setStrokeStyle(1, 0x6b2b3a);
    this.bossFill = this.add.rectangle(-w / 2 + 1, 0, w - 2, 14, 0xd6455d).setOrigin(0, 0.5);
    this.bossName = this.add
      .text(0, -20, '', {fontFamily: 'sans-serif', fontSize: '18px', color: '#ffc4d2'})
      .setOrigin(0.5, 1);

    this.bossBar.add([back, this.bossFill, this.bossName]);
    this.bossBarWidth = w - 2;
  }

  showBossBar(name, boss) {
    this.boss = boss;
    this.bossName.setText(name);
    this.bossFill.width = this.bossBarWidth;
    this.bossBar.setVisible(true).setAlpha(0);
    this.tweens.add({targets: this.bossBar, alpha: 1, duration: 400});
  }

  hideBossBar() {
    this.boss = null;
    this.tweens.add({
      targets: this.bossBar,
      alpha: 0,
      duration: 600,
      onComplete: () => this.bossBar.setVisible(false),
    });
  }

  refreshBossBar() {
    if (!this.boss?.active || !this.bossBar.visible) return;
    const ratio = Math.max(0, this.boss.hp / this.boss.maxHp);
    this.bossFill.width = this.bossBarWidth * ratio;
  }

  // 스킬·무기·포션을 얻었을 때 뜨는 획득 창.
  // 떠 있는 동안 게임이 멈추고, Q를 눌러야 닫힌다.
  buildAcquireModal() {
    const w = 640;
    const h = 208;
    const x = VIEW_WIDTH / 2;
    const y = VIEW_HEIGHT / 2 - 40;

    this.acquireQueue = [];
    this.acquire = this.add.container(x, y).setAlpha(0).setVisible(false).setDepth(30);

    // 창 뒤를 어둡게 덮어 게임이 멈춘 상태임을 알린다.
    this.acquireVeil = this.add
      .rectangle(0, 0, VIEW_WIDTH, VIEW_HEIGHT, 0x000000, 0.55)
      .setOrigin(0.5)
      .setPosition(VIEW_WIDTH / 2 - x, VIEW_HEIGHT / 2 - y);

    const panel = this.add.rectangle(0, 0, w, h, 0x14141c, 0.98).setStrokeStyle(2, 0xffd479);

    this.acquireBadge = this.add
      .text(-w / 2 + 22, -h / 2 + 16, '', {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#ffd479',
      })
      .setOrigin(0, 0);

    this.acquireIcon = this.add.image(-w / 2 + 50, -10, 'skill-bug').setScale(2.4);
    this.acquireTitle = this.add
      .text(-w / 2 + 90, -46, '', {
        fontFamily: 'sans-serif',
        fontSize: '23px',
        color: '#ffffff',
        wordWrap: {width: w - 120},
      })
      .setOrigin(0, 0);
    this.acquireDesc = this.add
      .text(-w / 2 + 90, -8, '', {
        fontFamily: 'sans-serif',
        fontSize: '17px',
        color: '#c8c8d4',
        wordWrap: {width: w - 120},
      })
      .setOrigin(0, 0);
    this.acquireMeta = this.add
      .text(-w / 2 + 90, 40, '', {fontFamily: 'sans-serif', fontSize: '16px', color: '#7f7f8c'})
      .setOrigin(0, 0);

    const footer = this.add
      .text(0, h / 2 - 36, 'Q키를 눌러 진행', {
        fontFamily: 'sans-serif',
        fontSize: '17px',
        color: '#ffd479',
      })
      .setOrigin(0.5, 0);

    // 눌러 달라는 신호로 은은하게 깜빡인다.
    this.tweens.add({
      targets: footer,
      alpha: 0.35,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.acquire.add([
      this.acquireVeil,
      panel,
      this.acquireBadge,
      this.acquireIcon,
      this.acquireTitle,
      this.acquireDesc,
      this.acquireMeta,
      footer,
    ]);

    // 창을 닫는 Q. 맵 씬이 멈춰 있어도 UI 씬은 살아 있으므로 여기서 받는다.
    this.input.keyboard.on('keydown-Q', () => this.dismissAcquire());
  }

  // 한 번에 여러 개를 얻을 수 있으므로 줄을 세워 하나씩 보여 준다.
  queueAcquire(entry) {
    this.acquireQueue.push(entry);
    if (!this.acquire.visible) this.showNextAcquire();
  }

  // 스킬은 형식이 정해져 있어 따로 감싸 둔다.
  queueSkillDialog(skill) {
    this.queueAcquire({
      badge: '새 스킬을 배웠다',
      icon: skill.icon,
      title: `${skill.name}   [ ${skill.key} ]`,
      desc: skill.desc,
      meta: `DP ${skill.dp} 소모 · 쿨타임 ${(skill.cooldown / 1000).toFixed(1)}초`,
    });
  }

  showNextAcquire() {
    const entry = this.acquireQueue.shift();
    if (!entry) {
      this.acquire.setVisible(false);
      this.resumeGame();
      return;
    }

    this.acquireBadge.setText(entry.badge);
    this.acquireIcon.setTexture(entry.icon).setTint(entry.tint ?? 0xffffff);
    this.acquireTitle.setText(entry.title);
    this.acquireDesc.setText(entry.desc);
    this.acquireMeta.setText(entry.meta ?? '');

    this.pauseGame();
    this.acquire.setVisible(true).setAlpha(0);
    this.tweens.add({targets: this.acquire, alpha: 1, duration: 200});

    // 창이 뜬 직후의 Q는 무시한다. 공격하려던 입력으로 창이 바로 닫히면 읽을 틈이 없다.
    this.acquireReadyAt = this.game.loop.time + 350;
  }

  dismissAcquire() {
    if (!this.acquire.visible) return;
    if (this.game.loop.time < this.acquireReadyAt) return;
    this.showNextAcquire();
  }

  pauseGame() {
    const map = this.activeMapScene();
    if (map && !map.scene.isPaused()) map.scene.pause();
  }

  resumeGame() {
    const map = this.scene.manager.getScenes(false).find((s) => s.player && s.scene.isPaused());
    if (!map) return;

    map.scene.resume();
    // 창을 닫은 Q가 그대로 공격으로 이어지지 않게 눌린 상태를 씻어 낸다.
    map.input.keyboard.resetKeys();
  }

  // 힌트 판. 컷신 대사창과 같은 결로 짜서 화면 안에서 따로 놀지 않게 한다.
  // 컨테이너로 묶어 두면 판 전체를 한꺼번에 띄우고 튕길 수 있다.
  buildHint() {
    const y = BAR_TOP - 58;
    this.hintBox = this.add.container(VIEW_WIDTH / 2, y).setAlpha(0).setDepth(35);

    this.hintPanel = this.add
      .rectangle(0, 0, 200, 56, 0x0d0f14, 0.94)
      .setStrokeStyle(2, 0xffd479);
    this.hintInner = this.add.rectangle(0, 0, 190, 46, 0x000000, 0).setStrokeStyle(1, 0x4a4130);

    this.hintText = this.add
      .text(0, 0, '', {
        fontFamily: 'sans-serif',
        fontSize: '23px',
        color: '#ffffff',
        // 몬스터가 외치는 글씨와 같은 방식. 판 위에서도 글자가 또렷하게 선다.
        stroke: '#14161c',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    this.hintBox.add([this.hintPanel, this.hintInner, this.hintText]);
  }

  showHint(text, duration = 2600) {
    this.hintText.setText(text);

    // 글자 길이에 맞춰 판을 늘린다. 고정 폭이면 짧은 힌트에서 휑해진다.
    const w = this.hintText.width + 56;
    const h = this.hintText.height + 28;
    this.hintPanel.setSize(w, h);
    this.hintInner.setSize(w - 10, h - 10);

    this.tweens.killTweensOf(this.hintBox);

    // 바뀔 때마다 아래에서 튕겨 올라온다. 같은 자리에 조용히 갈아 끼우면
    // 글자가 바뀐 걸 눈치채지 못하고 지나간다.
    this.hintBox.setAlpha(0).setScale(0.92).setY(BAR_TOP - 44);
    this.tweens.add({
      targets: this.hintBox,
      alpha: 1,
      scale: 1,
      y: BAR_TOP - 58,
      duration: 240,
      ease: 'Back.easeOut',
    });

    this.tweens.add({
      targets: this.hintBox,
      alpha: 0,
      delay: duration,
      duration: 500,
    });
  }
}
