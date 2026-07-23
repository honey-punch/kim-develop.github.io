import Phaser from 'phaser';
import {VIEW_WIDTH, VIEW_HEIGHT} from '../config.js';
import {PANEL_SCALE} from '../art/panels.js';

// 컷신을 트는 씬. 맵 씬 위에 얹혀서 돈다.
//
// 넓은 컷은 아래 맵 씬을 그대로 비추고 카메라만 옮긴다(하이브리드).
// 얼굴 컷은 이 씬이 검은 화면을 깔고 그 위에 클로즈업을 띄운다.
// 그래서 맵을 다시 그릴 필요도, 컷마다 배경을 그릴 필요도 없다.

// 위아래 검은 띠 높이. HTML의 신처럼 키 큰 인물이 들어가려면 너무 두꺼우면 안 된다.
// 띠가 72였을 땐 신의 머리가 잘렸다.
const LETTERBOX = 44;
const BOX_HEIGHT = 132; // 대사 상자 높이

export default class CutsceneScene extends Phaser.Scene {
  constructor() {
    super('CutsceneScene');
  }

  init({beats, stage, onDone}) {
    this.beats = beats;
    this.stageKey = stage; // 아래에서 돌고 있는 맵 씬 키
    this.onDone = onDone;
    this.index = 0;
    this.waitingForKey = false;
    this.finished = false;
    this.booming = null;
    this.boomStamps = [];
    this.boomScale = 7; // makePixelText에 넘긴 배율과 같아야 제 크기로 줄어든다
  }

  get stage() {
    return this.scene.get(this.stageKey);
  }

  create() {
    const cam = this.cameras.main;
    cam.setBackgroundColor('rgba(0,0,0,0)'); // 아래 맵이 비쳐야 한다

    // 얼굴 컷에서 맵을 가리는 검은 막. 넓은 컷에서는 투명해진다.
    this.curtain = this.add
      .rectangle(0, 0, VIEW_WIDTH, VIEW_HEIGHT, 0x05060a)
      .setOrigin(0)
      .setAlpha(0);

    // 화면을 가득 채우는 배경 컷. 하늘·구름·번개가 따로 움직여야 해서
    // 한 장짜리 그림이 아니라 여러 겹을 담는 통이다.
    this.panelLayer = this.add.container(0, 0);
    // 얼굴 클로즈업
    this.portrait = this.add.image(VIEW_WIDTH / 2, VIEW_HEIGHT / 2 - 70, '').setVisible(false);

    // 번개와 정전에 쓰는 막. 검은 띠보다 아래에 둬서 띠는 늘 덮여 있게 한다.
    this.veil = this.add
      .rectangle(0, 0, VIEW_WIDTH, VIEW_HEIGHT, 0xffffff)
      .setOrigin(0)
      .setAlpha(0);

    // 위아래 검은 띠. 컷신 내내 깔려 있어 '영화를 보는 중'이라는 신호가 된다.
    this.add.rectangle(0, 0, VIEW_WIDTH, LETTERBOX, 0x000000).setOrigin(0);
    this.add.rectangle(0, VIEW_HEIGHT - LETTERBOX, VIEW_WIDTH, LETTERBOX, 0x000000).setOrigin(0);

    // 엔딩의 'theEnd();'와 제목이 뜨는 자리. 글자는 그때그때 도트로 구워 얹는다.
    this.titleLayer = this.add.container(VIEW_WIDTH / 2, VIEW_HEIGHT / 2 - 20).setAlpha(0);

    this.buildDialogue();

    // 조작 안내. Esc(건너뛰기)는 늘 되지만 Enter/Space(넘기기)는
    // 대사를 기다리는 컷에서만 먹는다. 안 되는 동안 안내를 띄워 두면
    // 눌러도 반응이 없어 고장 난 것처럼 보인다.
    this.skipHint = this.add
      .text(VIEW_WIDTH - 24, VIEW_HEIGHT - 22, '', {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#7a7f8a',
      })
      .setOrigin(1, 0.5);

    this.input.keyboard.on('keydown-ESC', () => this.skip());
    ['keydown-ENTER', 'keydown-SPACE'].forEach((evt) =>
      this.input.keyboard.on(evt, () => this.advance())
    );

    this.play(0);
  }

  buildDialogue() {
    // 대사창 아래를 검은 띠 위에 얹는다. 띠 안쪽까지 내려가면
    // 띠에 적어 둔 조작 안내와 겹쳐서 둘 다 못 읽는다.
    const top = VIEW_HEIGHT - LETTERBOX - BOX_HEIGHT - 8;

    const boxW = VIEW_WIDTH - 200;
    const left = VIEW_WIDTH / 2 - boxW / 2;

    // 대사창은 반투명 검정을 유지하되 테두리를 겹으로 두고 모서리를 찍어 준다.
    // 사각형 하나만 두면 화면에 얹힌 판이 아니라 그냥 어두운 자국처럼 보인다.
    this.box = this.add
      .rectangle(VIEW_WIDTH / 2, top + BOX_HEIGHT / 2, boxW, BOX_HEIGHT, 0x0d0f14, 0.92)
      .setStrokeStyle(2, 0x4a5160)
      .setVisible(false);

    // 안쪽 가는 선. 바깥 테두리와 사이를 띄워 두 겹으로 보이게 한다.
    this.boxInner = this.add
      .rectangle(VIEW_WIDTH / 2, top + BOX_HEIGHT / 2, boxW - 12, BOX_HEIGHT - 12, 0x000000, 0)
      .setStrokeStyle(1, 0x2b303c)
      .setVisible(false);

    // 네 모서리를 짧은 금색 선으로 찍는다.
    this.corners = [
      [left + 6, top + 6, 1, 1],
      [left + boxW - 6, top + 6, -1, 1],
      [left + 6, top + BOX_HEIGHT - 6, 1, -1],
      [left + boxW - 6, top + BOX_HEIGHT - 6, -1, -1],
    ].flatMap(([cx, cy, sx, sy]) => [
      this.add.rectangle(cx, cy, 14 * sx, 2, 0xffd479).setOrigin(0, 0.5).setVisible(false),
      this.add.rectangle(cx, cy, 2, 14 * sy, 0xffd479).setOrigin(0.5, 0).setVisible(false),
    ]);

    // 이름표. 대사창 위쪽 테두리에 걸치는 작은 판이다.
    this.namePlate = this.add
      .rectangle(left + 16, top, 8, 34, 0x1a1d26, 0.98)
      .setOrigin(0, 0.5)
      .setStrokeStyle(2, 0xffd479)
      .setVisible(false);

    this.speaker = this.add
      .text(left + 30, top, '', {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        color: '#ffd479',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5)
      .setVisible(false);

    this.line = this.add
      .text(this.box.x - this.box.width / 2 + 22, top + 48, '', {
        fontFamily: 'sans-serif',
        fontSize: '23px',
        color: '#e8eaee',
        wordWrap: {width: this.box.width - 44},
        lineSpacing: 6,
      })
      .setVisible(false);

    // 다음 컷으로 넘길 수 있을 때만 깜빡인다.
    this.prompt = this.add
      .text(this.box.x + this.box.width / 2 - 24, top + BOX_HEIGHT - 22, '▼', {
        fontFamily: 'sans-serif',
        fontSize: '19px',
        color: '#ffd479',
      })
      .setOrigin(1, 0.5)
      .setVisible(false);

    this.tweens.add({
      targets: this.prompt,
      alpha: 0.2,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }

  // 한 컷을 무대에 올린다.
  play(index) {
    if (this.finished) return;
    this.timer?.remove();
    this.timer = null;
    if (index >= this.beats.length) return this.finish();

    this.index = index;
    const beat = this.beats[index];

    // keep을 주면 앞 컷의 배경을 그대로 이어 쓴다.
    // 같은 배경에 대사만 얹는 컷마다 구름이 처음부터 다시 모이면 안 되니까.
    if (!beat.keep) {
      this.clearPanel();
      if (beat.storm) this.showStorm();
      else if (beat.panel) this.showPanel(beat.panel, beat.scale);
      if (beat.figures) this.showFigures(beat.figures);
    }

    // 배경 컷 > 얼굴 컷 > 맵 컷 순으로 화면을 차지한다.
    // 큰 글자 컷은 아무것도 없는 검은 화면 위에 뜬다.
    const hasPanel = this.panelLayer.length > 0;
    this.portrait.setVisible(!!beat.portrait);
    this.curtain.setAlpha(hasPanel || beat.portrait || beat.title ? 1 : (beat.dim ?? 0));

    if (beat.portrait) this.portrait.setTexture(beat.portrait).setScale(beat.scale ?? 7);
    this.showTitle(beat.title);

    // boom을 단 컷이 이어지는 동안 글자가 남아 있는다.
    if (beat.boom) this.startBoom(beat.boom);
    else this.stopBoom();

    if (beat.camera) this.moveCamera(beat.camera);
    beat.do?.(this.stage, this);

    this.showLine(beat);

    // 대사는 키를 눌러 넘긴다. 다만 hold를 같이 주면 그 시간 뒤에 저절로 넘어간다 —
    // 타닥타닥 같은 분위기용 자막까지 일일이 누르게 하면 흐름이 끊긴다.
    this.waitingForKey = !!beat.text;
    if (!beat.text || beat.hold) {
      this.timer = this.time.delayedCall(beat.hold ?? 1400, () => this.play(index + 1));
    }

    this.skipHint.setText(
      this.waitingForKey ? 'Enter/Space 넘기기   Esc 건너뛰기' : 'Esc 건너뛰기'
    );
  }

  showLine(beat) {
    const has = !!beat.text;
    const named = has && !!beat.who;

    this.box.setVisible(has);
    this.boxInner.setVisible(has);
    this.corners.forEach((c) => c.setVisible(has));
    this.prompt.setVisible(has);
    this.line.setVisible(has).setText(beat.text ?? '');

    this.speaker.setVisible(named).setText(beat.who ?? '');
    // 이름표는 이름 길이에 맞춰 늘린다. 고정 폭이면 '???'에서 헐렁해진다.
    this.namePlate.setVisible(named).setSize(this.speaker.width + 28, 34);

    // 화자가 없는 나레이션은 대사가 이름 자리까지 올라온다.
    this.line.setY(this.box.y - BOX_HEIGHT / 2 + (named ? 40 : 28));
  }

  // 큰 글자는 스르르 떴다가 컷이 끝나면 스르르 사라진다.
  //
  // 글자를 작게 한 번 그린 뒤 그 그림을 통째로 확대한다. 큰 폰트를 바로 쓰면
  // 곡선이 매끄럽게 나와 도트 세계에서 혼자 튄다. 작게 그려서 키우면
  // 픽셀이 네모나게 뭉개지면서 도트로 찍은 글자처럼 보인다.
  showTitle(text) {
    this.tweens.killTweensOf(this.titleLayer);
    this.titleLayer.removeAll(true);

    if (!text) {
      this.titleLayer.setAlpha(0);
      return;
    }

    // 작게 그릴수록 도트가 굵어진다. 11px보다 더 줄이면 한글 획이 뭉개져 못 읽는다.
    const stamp = this.makePixelText(text, {color: '#ffd479', stroke: '#2a1f10'});
    this.titleLayer.add(stamp);
    this.titleLayer.setAlpha(0);
    this.tweens.add({targets: this.titleLayer, alpha: 1, duration: 900, ease: 'Sine.easeInOut'});
  }

  // 글자를 작게 한 번 그린 뒤 그 그림을 통째로 확대한다. 큰 폰트를 바로 쓰면
  // 곡선이 매끄럽게 나와 도트 세계에서 혼자 튄다. 작게 그려서 키우면
  // 픽셀이 네모나게 뭉개지면서 도트로 찍은 글자처럼 보인다.
  // 11px보다 더 줄이면 한글 획이 뭉개져 못 읽는다.
  makePixelText(text, {color = '#ffffff', stroke = '#141821', size = 11, scale = 6} = {}) {
    const draft = this.make
      .text(
        {
          text,
          style: {
            fontFamily: 'sans-serif',
            fontSize: `${size}px`,
            color,
            align: 'center',
            lineSpacing: 3,
            stroke,
            strokeThickness: 2,
          },
        },
        false
      )
      .setOrigin(0.5);

    const stamp = this.add
      .renderTexture(0, 0, Math.ceil(draft.width), Math.ceil(draft.height))
      .setOrigin(0.5)
      .setScale(scale);
    stamp.draw(draft, draft.width / 2, draft.height / 2);
    // 확대할 때 픽셀을 뭉개지 않고 네모나게 키운다.
    stamp.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    draft.destroy();

    return stamp;
  }

  // 충격. '쿠구궁' 같은 글자가 한 자씩 화면에 내리꽂힌다.
  // 카메라는 흔들지 않는다 — 얼굴 컷이 같이 흔들리면 표정을 읽을 수 없다.
  // boom을 단 컷이 이어지는 동안은 글자가 그대로 남는다.
  startBoom(text) {
    if (this.booming === text) return;
    this.stopBoom();
    this.booming = text;

    // 얼굴을 가리지 않게 위쪽에 널찍이 벌려 놓는다.
    // 가운데에 겹쳐 찍으면 정작 봐야 할 표정이 안 보인다.
    const chars = [...text];
    const gap = 260;
    const left = VIEW_WIDTH / 2 - ((chars.length - 1) * gap) / 2;

    chars.forEach((ch, i) => {
      const stamp = this.makePixelText(ch, {color: '#ff5a6e', stroke: '#2a0d12', size: 13, scale: 7})
        .setPosition(left + i * gap, LETTERBOX + 62)
        .setAngle(Phaser.Math.Between(-9, 9))
        .setAlpha(0)
        .setScale(this.boomScale * 3);
      this.boomStamps.push(stamp);

      // 위에서 쿵 하고 박힌다. 커진 채로 나타나 제 크기로 줄어든다.
      this.time.delayedCall(i * 260, () => {
        if (!stamp.active) return;
        stamp.setAlpha(1);
        this.tweens.add({
          targets: stamp,
          scale: this.boomScale,
          duration: 180,
          ease: 'Back.easeOut',
        });
      });
    });
  }

  stopBoom() {
    if (!this.booming) return;
    this.booming = null;
    this.boomStamps.forEach((s) => s.destroy());
    this.boomStamps.length = 0;
  }

  // 화면을 하얗게 덮는다. HTML의 신에게서 퍼지는 빛.
  whiteout(duration = 1200) {
    this.tweens.killTweensOf(this.veil);
    this.veil.setFillStyle(0xffffff).setAlpha(0);
    this.tweens.add({targets: this.veil, alpha: 1, duration, ease: 'Cubic.easeIn'});
  }

  // 덮어 둔 막을 걷는다. 흰 막이든 검은 막이든 색을 건드리지 않고 투명하게만 만든다.
  clearVeil(duration = 700) {
    this.tweens.killTweensOf(this.veil);
    this.tweens.add({targets: this.veil, alpha: 0, duration});
  }

  clearPanel() {
    this.panelLayer.removeAll(true); // 자식까지 파괴한다
  }

  showPanel(key, scale) {
    const img = this.add.image(VIEW_WIDTH / 2, VIEW_HEIGHT / 2, key).setScale(scale ?? PANEL_SCALE);
    this.panelLayer.add(img);
  }

  // 배경 위에 세우는 인물. 건물을 등지고 선 김개발의 뒤통수 같은 컷에 쓴다.
  // 기준점은 발밑이라 y가 곧 서 있는 바닥 높이다.
  showFigures(figures) {
    figures.forEach(({key, x, y, scale = 4, flipX = false, tint, cropBottom = 0}) => {
      const img = this.add
        .image(x, y, key)
        .setOrigin(0.5, 1)
        .setScale(scale)
        .setFlipX(flipX);
      // 밤 배경을 등지고 선 인물은 눌러 줘야 한다. 그대로 두면 혼자 밝아서 붙여 놓은 것처럼 뜬다.
      if (tint) img.setTint(tint);

      // 하반신을 잘라내 상반신만 남긴다(단위는 텍스처 픽셀).
      // 잘라낸 만큼 내려 주므로 y는 '잘린 밑단이 놓이는 자리'가 된다.
      if (cropBottom) {
        img.setCrop(0, 0, img.width, img.height - cropBottom);
        img.y += cropBottom * scale;
      }

      this.panelLayer.add(img);
    });
  }

  // 수상한 건물. 구름이 양쪽에서 모여들고 다 모이면 번개가 친다.
  showStorm() {
    const put = (obj) => {
      this.panelLayer.add(obj);
      return obj;
    };

    put(this.add.image(VIEW_WIDTH / 2, VIEW_HEIGHT / 2, 'panel-sky').setScale(PANEL_SCALE));

    // 화면 밖에서 건물 꼭대기 쪽으로 밀려 들어온다.
    [
      {key: 'panel-cloud-0', from: -300, to: 430, y: 156, delay: 0},
      {key: 'panel-cloud-1', from: VIEW_WIDTH + 340, to: 858, y: 122, delay: 180},
      {key: 'panel-cloud-2', from: -420, to: 632, y: 208, delay: 360},
    ].forEach(({key, from, to, y, delay}) => {
      const cloud = put(this.add.image(from, y, key).setScale(PANEL_SCALE).setAlpha(0.2));
      this.tweens.add({targets: cloud, x: to, alpha: 1, delay, duration: 2600, ease: 'Sine.easeInOut'});
    });

    // 구름이 모일수록 하늘이 무거워진다.
    const gloom = put(
      this.add.rectangle(0, 0, VIEW_WIDTH, VIEW_HEIGHT, 0x05060a).setOrigin(0).setAlpha(0)
    );
    this.tweens.add({targets: gloom, alpha: 0.3, duration: 2600});

    // 건물 양옆으로 하나씩. 건물이 번개를 등지고 선 그림이 된다.
    [2400, 3200].forEach((at, i) => this.time.delayedCall(at, () => this.strike(i ? 862 : 430)));
  }

  // 건물을 배경으로 내리꽂히는 번개 한 줄기.
  strike(x) {
    if (!this.panelLayer.length) return; // 이미 다음 컷으로 넘어갔다

    const bolt = this.add.image(x, 150, 'panel-bolt').setOrigin(0.5, 0).setScale(PANEL_SCALE);
    this.panelLayer.add(bolt);
    this.tweens.add({targets: bolt, alpha: 0, duration: 280, onComplete: () => bolt.destroy()});
    this.lightning(1);
  }

  moveCamera({x, y, zoom, duration = 0}) {
    const cam = this.stage.cameras.main;
    cam.stopFollow();
    const worldX = x * 32 + 16;
    const worldY = y * 32 + 16;

    if (duration > 0) {
      if (zoom) cam.zoomTo(zoom, duration);
      cam.pan(worldX, worldY, duration, 'Sine.easeInOut');
    } else {
      if (zoom) cam.setZoom(zoom);
      cam.centerOn(worldX, worldY);
    }
  }

  // 번개. 창밖이 번쩍하고 방 안까지 하얗게 물든다.
  lightning(times = 2) {
    for (let i = 0; i < times; i++) {
      this.time.delayedCall(i * 220, () => {
        this.veil.setFillStyle(0xffffff).setAlpha(0.9);
        this.tweens.add({targets: this.veil, alpha: 0, duration: 180});
      });
    }
  }

  // 정전. duration을 주면 그만큼에 걸쳐 덮거나 걷고, 0이면 즉시 바뀐다.
  blackout(on, duration = 0) {
    this.tweens.killTweensOf(this.veil);
    this.veil.setFillStyle(0x000000);

    if (!on) {
      this.tweens.add({targets: this.veil, alpha: 0, duration});
      return;
    }
    if (duration <= 0) {
      this.veil.setAlpha(1);
      return;
    }
    this.tweens.add({targets: this.veil, alpha: 1, duration});
  }

  advance() {
    if (this.waitingForKey) this.play(this.index + 1);
  }

  // 건너뛰기. 남은 컷의 do를 전부 즉시 실행해서 세상을 컷신이 끝난 상태로 맞춘다.
  // 그냥 씬만 닫으면 동료가 안 사라지거나 불이 안 켜진 채로 게임이 시작된다.
  skip() {
    if (this.finished) return;
    // do 쪽에서 '지금은 연출 없이 결과만 남겨야 한다'를 알 수 있게 표시해 둔다.
    this.skipping = true;
    this.beats.slice(this.index).forEach((beat) => beat.do?.(this.stage, this));
    this.finish();
  }

  finish() {
    if (this.finished) return;
    this.finished = true;
    this.stopBoom();
    this.onDone?.(this.stage);
    this.scene.stop();
  }
}
