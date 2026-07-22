import Phaser from 'phaser';
import {
  TILE,
  WORLD_ZOOM,
  COLLIDING_TILES,
  EXIT_TILES,
  VIEW_WIDTH,
  VIEW_HEIGHT,
  UI_BAR_HEIGHT,
  DEPTH,
} from '../config.js';
import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';
import Projectile from '../entities/Projectile.js';
import {SKILL_SPECS} from '../config.js';
import {GameState, WEAPONS, POTIONS, MAX_LEVEL, SKILLS} from '../state.js';
import {tilesetKey} from '../art/tiles.js';
import {MOOD_AIR} from '../art/palette.js';
import {
  keyboardSwing,
  soundWave,
  keyboardRattle,
  advisorGhost,
  ADVISOR_MS,
  castGlow,
  potionBurst,
  groundRing,
} from '../effects.js';

// 타일맵을 쓰는 모든 씬(사무실, 거리, 던전 각 층)의 공통 뼈대.
export default class MapScene extends Phaser.Scene {
  // 씬이 덮어쓰지 않으면 따뜻한 쪽. 번개가 친 뒤의 씬은 'cold'를 쓴다.
  get mood() {
    return 'warm';
  }

  // ★ 왼쪽 위에 뜨는 '맵이름'. 씬마다 이 게터를 덮어써서 정한다.
  //    빈 값이면 아무것도 뜨지 않는다.
  get mapName() {
    return '';
  }

  // 어느 씬에서 넘어왔는지. goTo가 넘겨 준다.
  init(data) {
    this.enteredFrom = data?.from ?? null;
  }

  // spawnFrom은 '이 씬에서 왔을 때는 여기 세운다'는 표다.
  // 없으면 늘 쓰던 입구에 세운다.
  buildMap(mapData, spawn, spawnFrom) {
    spawn = spawnFrom?.[this.enteredFrom] ?? spawn;
    // 씬 인스턴스는 재시작해도 재사용되므로 이전 생애의 흔적을 여기서 지운다.
    this.transitioning = false;
    this.wasOnExit = false;

    const map = this.make.tilemap({data: mapData, tileWidth: TILE, tileHeight: TILE});
    const tileset = map.addTilesetImage('tiles', tilesetKey(this.mood), TILE, TILE, 0, 0);
    this.layer = map.createLayer(0, tileset, 0, 0).setDepth(DEPTH.ground);
    this.layer.setCollision(COLLIDING_TILES);

    this.player = new Player(this, spawn.x * TILE + TILE / 2, spawn.y * TILE + TILE);
    this.physics.add.collider(this.player, this.layer);

    this.enemies = this.add.group({runChildUpdate: true});
    this.physics.add.collider(this.enemies, this.layer);
    this.physics.add.collider(this.enemies, this.enemies);

    this.playerShots = this.add.group();
    this.enemyShots = this.add.group();
    // 김개발을 노리는 탄 무리. 보스전은 여기에 자기 탄을 하나 더 얹는다.
    this.hostileShots = [this.enemyShots];

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    const cam = this.cameras.main;
    cam.setSize(VIEW_WIDTH, VIEW_HEIGHT - UI_BAR_HEIGHT);
    cam.setBackgroundColor(MOOD_AIR[this.mood].background);
    cam.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    cam.setZoom(WORLD_ZOOM);
    cam.setRoundPixels(true);
    cam.startFollow(this.player, true, 0.15, 0.15);
    cam.fadeIn(400, 0, 0, 0);

    // UIScene이 이미 떠 있으면 맵이름만 갈아 준다.
    // 이제 막 띄우는 참이면 UIScene이 create에서 스스로 읽어 간다.
    const uiWasRunning = this.scene.isActive('UIScene');
    if (!uiWasRunning) this.scene.launch('UIScene');
    else this.ui.setMapName(this.mapName);

    this.bindPotionKeys();

    // 컷신이 도는 도중에 이 씬을 떠나면 컷신 씬만 남아 다음 맵 위에 계속 떠 있는다.
    // 끝났다는 신호(onDone)를 못 받으니 하단바도 숨은 채로 굳는다.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (!this.scene.isActive('CutsceneScene')) return;
      this.scene.stop('CutsceneScene');
      this.ui.cameras.main.setVisible(true);
    });

    return map;
  }

  // 컷신을 튼다. 도는 동안 조작은 막히고(transitioning) 하단바는 숨는다.
  // 컷신 씬이 이 씬의 카메라를 직접 몰기 때문에 따라다니기도 잠시 끈다.
  playCutscene(beats, onDone) {
    this.transitioning = true;
    this.player.setVelocity(0, 0);
    this.ui.cameras.main.setVisible(false);

    this.scene.launch('CutsceneScene', {
      beats,
      stage: this.scene.key,
      onDone: () => {
        const cam = this.cameras.main;
        cam.setZoom(WORLD_ZOOM);
        cam.startFollow(this.player, true, 0.15, 0.15);
        this.ui.cameras.main.setVisible(true);
        this.transitioning = false;
        onDone?.();
      },
    });
  }

  // 서 있는 것들은 y좌표를 그대로 깊이로 쓴다. 아래쪽에 선 쪽이 앞을 가린다.
  sortDepth(sprite) {
    sprite.setDepth(sprite.y);
    if (sprite.shadow) {
      sprite.shadow.setPosition(sprite.x, sprite.y - 2);
      sprite.shadow.setDepth(sprite.y - 1);
    }
  }

  // 발밑 그림자. 이게 있어야 캐릭터가 바닥에 붙어 서 있는 것으로 보인다.
  addShadow(sprite) {
    return this.add.image(sprite.x, sprite.y - 2, 'shadow').setDepth(sprite.y - 1);
  }

  // 방 전체를 어둡게 덮는다. 촛불 같은 광원은 이 막보다 위에 그려 빛 웅덩이를 만든다.
  // 카메라에 붙이지 않고 맵 크기로 깔아야 줌과 스크롤에 흔들리지 않는다.
  dim(alpha) {
    const {width, height} = this.physics.world.bounds;
    this.darkness = this.add
      .rectangle(0, 0, width, height, 0x05070d, alpha)
      .setOrigin(0)
      .setDepth(DEPTH.effect - 100);
  }

  // 촛불. 어둠막 위에 얹어 주변만 밝히고, 심지가 잘게 흔들린다.
  spawnCandles(defs = []) {
    defs.forEach(({x, y}) => {
      const cx = x * TILE + TILE / 2;
      const cy = y * TILE + TILE;

      const glow = this.add
        .circle(cx, cy - 24, 78, 0xffb35c, 0.16)
        .setDepth(DEPTH.effect - 99)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: glow,
        scale: 1.12,
        alpha: 0.24,
        duration: Phaser.Math.Between(900, 1500),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      this.add
        .image(cx, cy, `prop-candle-${this.mood}`)
        .setOrigin(0.5, 1)
        .setDepth(DEPTH.effect - 98);
    });
  }

  // 책상 위의 모니터·머그컵처럼 지나갈 수 있는 장식. 타일이 아니라 그림이라
  // 맵 배열을 건드리지 않고도 얼마든지 늘릴 수 있다.
  spawnProps(defs = []) {
    defs.forEach(({texture, x, y}) => {
      const worldY = y * TILE + TILE;
      this.add
        .image(x * TILE + TILE / 2, worldY, `${texture}-${this.mood}`)
        .setOrigin(0.5, 1)
        .setDepth(worldY);
    });
  }

  // 이미 주운 것은 다시 놓지 않는다. 맵으로 돌아와도 아이템이 되살아나면 안 된다.
  spawnItems(defs) {
    defs.forEach((def) => {
      if (GameState.hasPicked(def.id)) return;

      const texture = def.type === 'weapon' ? 'item-keyboard' : POTIONS[def.item].icon;
      const sprite = this.physics.add.staticSprite(
        def.x * TILE + TILE / 2,
        def.y * TILE + TILE / 2,
        texture
      ).setDepth(def.y * TILE + TILE);

      // 플레이어 충돌 박스는 발밑 8px뿐이라 스프라이트 크기 그대로면 밟고도 지나친다.
      // 획득 판정만 타일 한 칸으로 넓힌다.
      sprite.body.setSize(TILE, TILE);
      sprite.body.position.set(def.x * TILE, def.y * TILE);
      sprite.body.updateCenter();

      this.tweens.add({
        targets: sprite,
        y: sprite.y - 3,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      this.physics.add.overlap(this.player, sprite, () => this.collect(def, sprite));
    });
  }

  collect(def, sprite) {
    if (GameState.hasPicked(def.id)) return;
    GameState.markPicked(def.id);
    sprite.destroy();

    if (def.type === 'weapon') {
      const weapon = WEAPONS[def.item];
      GameState.giveWeapon(def.item);
      let desc = ''

      switch (weapon.id) {
        case 'daiso':
          desc = '이런걸로 개발하면 기분이 안좋아질 것 같다.'
          break;
        case 'mechanical':
          desc = '이 기계식 키보드는 이제 제겁니다.'
          break;
        case 'legend':
          desc = '이 키보드와 흰 천만 있다면 어디든 갈 수 있어.'
          break;
      }

      this.ui.queueAcquire({
        badge: '새 무기를 손에 넣었다',
        icon: 'item-keyboard',
        tint: weapon.color,
        title: weapon.name,
        desc,
        meta: `공격력 ${weapon.damage}`,
      });
      return;
    }

    const potion = POTIONS[def.item];
    GameState.potions[def.item] += def.count;
    const stat = potion.restores.toUpperCase();

    this.ui.queueAcquire({
      badge: '아이템을 얻었다',
      icon: potion.icon,
      title: `${potion.name} ${def.count}개`,
      desc: `마시면 ${stat}를 ${potion.amount} 회복한다.`,
      meta: `숫자 ${potion.key}키로 사용`,
    });
  }

  // 이미 잡은 몬스터는 다시 놓지 않는다. 맵을 오갈 수 있게 되면서
  // 되돌아올 때마다 방이 다시 채워지면 안 되기 때문이다.
  // 배치 순서가 곧 이름표라, 맵 파일에서 순서를 바꾸면 기록이 어긋난다.
  spawnEnemies(defs) {
    defs.forEach((def, i) => {
      const id = `${this.scene.key}-${i}`;
      if (GameState.hasKilled(id)) return;

      const enemy = new Enemy(this, def.x * TILE + TILE / 2, def.y * TILE + TILE, def.type);
      enemy.spawnId = id;
      this.enemies.add(enemy);
    });
  }

  // 전투가 끝났을 때 날아다니는 위험 요소를 한 번에 치운다.
  // 죽은 적이 남긴 탄에 맞는 일이 없도록.
  clearHazards() {
    this.enemyShots.clear(true, true);
    this.enemies.clear(true, true);
  }

  // 그 방향으로 설 수 있는 자리를 찾는다. 바깥에서부터 좁혀 오며
  // 벽·책상에 겹치지 않는 첫 지점을 고른다. 못 찾으면 그 방향은 건너뛴다.
  freeSpotToward(angle, from = 132, to = 60) {
    for (let r = from; r >= to; r -= 18) {
      const x = this.player.x + Math.cos(angle) * r;
      const y = this.player.y + Math.sin(angle) * r;
      const tile = this.layer.getTileAtWorldXY(x, y);
      if (tile && !COLLIDING_TILES.includes(tile.index)) return {x, y};
    }
    return null;
  }

  // 병풍코딩을 배운 직후의 연출용 포위.
  //
  // 다섯 방향을 정해 놓고 그쪽만 뒤지면 벽을 등지고 섰을 때 두세 마리밖에 못 나온다
  // (아래가 벽이면 아래쪽 방향은 아무리 각도를 틀어도 자리가 없다).
  // 그래서 원을 촘촘히 훑어 빈자리를 다 모은 뒤, 서로 떨어진 것만 골라 세운다.
  surroundForScreenSkill() {
    const spots = [];
    for (let i = 0; i < 16; i++) {
      const spot = this.freeSpotToward((Math.PI * 2 * i) / 16);
      if (spot) spots.push(spot);
    }

    const picked = [];
    spots.forEach((spot) => {
      if (picked.length >= 5) return;
      const apart = picked.every((p) => Phaser.Math.Distance.Between(p.x, p.y, spot.x, spot.y) > 56);
      if (apart) picked.push(spot);
    });

    picked.forEach((p) => this.summonEnemyAt(p.x, p.y, 'html'));

    // 이 시계는 설명 창이 떠 있는 동안 멈춰 있다(씬이 통째로 멈추므로).
    // 그래서 이 지연은 '창을 닫은 뒤 추종자들이 다가오는 시간'이 된다.
    // 나타나는 연출(0.26초)만 보여 주고 곧장 잇는다 — 더 끌면 그냥 기다리는 시간이 된다.
    this.time.delayedCall(700, () => {
      this.ui.queueAcquire({
        badge: '포위되었습니다',
        icon: 'skill-screen',
        title: '병풍코딩   [ R ]',
        desc: 'R키를 눌러 병풍코딩 스킬을 사용하세요.',
        meta: '화면에 보이는 모든 적을 한꺼번에 때린다',
      });
    });
  }

  // 타일이 아니라 월드 좌표로 소환한다. 보스의 소환 패턴이 쓴다.
  summonEnemyAt(x, y, type) {
    const bounds = this.physics.world.bounds;
    const enemy = new Enemy(
      this,
      Phaser.Math.Clamp(x, bounds.x + TILE, bounds.right - TILE),
      Phaser.Math.Clamp(y, bounds.y + TILE, bounds.bottom - TILE),
      type
    );
    this.enemies.add(enemy);

    // 갑자기 튀어나오면 억울하니 잠깐 나타나는 티를 낸다.
    enemy.setAlpha(0);
    this.tweens.add({targets: enemy, alpha: 1, duration: 260});
    return enemy;
  }

  // 평타와 스킬이 때릴 수 있는 대상.
  // 보스처럼 enemies 그룹 밖에 있는 적은 씬이 덧붙인다.
  // 사본을 돌려준다. 순회 중 적이 죽어도 원소를 건너뛰지 않고, 덧붙여도 그룹이 오염되지 않는다.
  damageTargets() {
    return [...this.enemies.getChildren()];
  }

  // 맞는 범위는 물리 몸통이 아니라 눈에 보이는 몸이다.
  // 물리 몸통은 벽에 걸리지 않도록 발밑만 잡아 놓았기 때문에,
  // 그걸로 판정하면 가슴 높이로 날아온 탄이 그냥 지나가 버린다.
  hitArea(sprite) {
    const w = sprite.displayWidth * 0.6;
    const h = sprite.displayHeight * 0.8;
    return new Phaser.Geom.Rectangle(sprite.x - w / 2, sprite.y - h, w, h);
  }

  // 평타 판정. 겹치는 적을 모두 때린다.
  resolveAttack(area, damage) {
    this.damageTargets().forEach((enemy) => {
      if (!enemy.active) return;
      if (Phaser.Geom.Intersects.RectangleToRectangle(area, this.hitArea(enemy))) {
        enemy.takeDamage(damage, this.player.x, this.player.y);
      }
    });
  }

  // 탄 명중. 물리 겹침 대신 직접 재는 이유는 resolveAttack과 같다.
  // 탄 쪽은 스킬마다 조절한 판정 크기(물리 몸통)를 그대로 쓴다.
  resolveShots() {
    const shotBox = (shot) =>
      new Phaser.Geom.Rectangle(shot.body.left, shot.body.top, shot.body.width, shot.body.height);
    const hits = (shot, target) =>
      Phaser.Geom.Intersects.RectangleToRectangle(shotBox(shot), this.hitArea(target));

    const targets = this.damageTargets();
    this.playerShots.getChildren().forEach((shot) => {
      targets.forEach((enemy) => {
        if (!shot.active || !enemy.active) return;
        if (hits(shot, enemy) && shot.tryHit(enemy)) {
          enemy.takeDamage(shot.damage, shot.x, shot.y);
        }
      });
    });

    this.hostileShots.forEach((group) => {
      group.getChildren().forEach((shot) => {
        if (!shot.active || !this.player.active) return;
        if (hits(shot, this.player) && shot.tryHit(this.player)) {
          this.player.takeDamage(shot.damage, shot);
        }
      });
    });
  }

  castSkill(skill, caster) {
    // 어떤 스킬이든 쓰는 순간 몸에 그 스킬 색이 한 번 돈다.
    // DP를 썼다는 게 화면에서도 보여야 한다.
    castGlow(this, caster, skill.color);
    groundRing(this, caster.x, caster.y, skill.color);

    if (skill.id === 'bug') this.castBug(caster);
    else if (skill.id === 'sound') this.castSound(caster);
    else if (skill.id === 'screen') this.castScreen();
  }

  // 1. 버그 소환: 벌레가 일직선으로 돌진하며 겹치는 적을 관통한다.
  castBug(caster) {
    const spec = SKILL_SPECS.bug;
    const dir = caster.facingVector;
    const shot = new Projectile(this, caster.x, caster.chestY, 'proj-bug', {
      damage: spec.damage,
      pierce: true,
      lifespan: spec.lifespan,
      hitSize: spec.hitSize,
      faceVelocity: true, // 벌레가 기어가는 쪽을 보게 한다
      velocity: {x: dir.x * spec.speed, y: dir.y * spec.speed},
    });
    // 벌레 도트가 32px이라 판정(hitSize 30)과 크기가 이미 맞는다. 더 키우지 않는다.
    this.playerShots.add(shot);
  }

  // 2. 키보드 소리어택: 바라보는 방향으로 부채꼴 범위를 때린다.
  castSound(caster) {
    const spec = SKILL_SPECS.sound;
    const dir = caster.facingVector;
    const facingAngle = Math.atan2(dir.y, dir.x);
    const originY = caster.chestY;

    this.damageTargets().forEach((enemy) => {
      if (!enemy.active) return;
      const dist = Phaser.Math.Distance.Between(caster.x, originY, enemy.x, enemy.chestY);
      if (dist > spec.radius) return;

      const toEnemy = Math.atan2(enemy.chestY - originY, enemy.x - caster.x);
      const diff = Math.abs(Phaser.Math.Angle.Wrap(toEnemy - facingAngle));
      if (diff <= spec.arc / 2) enemy.takeDamage(spec.damage, caster.x, originY);
    });

    keyboardRattle(this, caster);
    soundWave(this, caster.x, originY, facingAngle, spec);
  }

  // 3. 병풍코딩: 화면에 보이는 모든 적 뒤에 김개발이 나타나 훈수를 둔다.
  castScreen() {
    const spec = SKILL_SPECS.screen;
    const view = this.cameras.main.worldView;

    this.damageTargets().forEach((enemy) => {
      if (!enemy.active || !view.contains(enemy.x, enemy.y)) return;

      // 훈수가 끝날 때까지 붙잡아 둔다. 넉백으로 풀려나지 않도록
      // 때리는 것도 붙잡음이 풀리는 순간에 맞춘다.
      enemy.heldUntil = this.time.now + ADVISOR_MS;
      enemy.setVelocity(0, 0);

      advisorGhost(this, enemy.x + 20, enemy.chestY, enemy.y - 1, () => {
        if (enemy.active) enemy.takeDamage(spec.damage, enemy.x + 14, enemy.y);
      });
    });
  }

  spawnEnemyShot(enemy, target) {
    const stats = enemy.stats;
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.chestY, target.x, target.chestY);
    const shot = new Projectile(this, enemy.x, enemy.chestY, 'proj-css', {
      damage: stats.rangedDamage,
      pierce: false,
      lifespan: 2200,
      velocity: {
        x: Math.cos(angle) * stats.rangedSpeed,
        y: Math.sin(angle) * stats.rangedSpeed,
      },
    });
    this.enemyShots.add(shot);
  }

  onEnemyDefeated(x, y, exp) {
    const before = GameState.level;
    const knownBefore = SKILLS.filter((s) => GameState.hasSkill(s));

    const gained = GameState.gainExp(exp);
    this.showFloatingText(x, y - 30, `+${exp} EXP`, '#9fd4e8');

    if (gained > 0) {
      const suffix = GameState.level >= MAX_LEVEL ? ' (최대 레벨)' : '';
      this.ui.showHint(`레벨 업! Lv.${before} → Lv.${GameState.level}${suffix}`, 2600);

      // 이번 레벨업으로 새로 열린 스킬은 설명 창을 띄운다.
      const learned = SKILLS.filter(
        (s) => GameState.hasSkill(s) && !knownBefore.includes(s) && s.id !== 'basic'
      );
      learned.forEach((skill) => this.ui.queueSkillDialog(skill));

      // 병풍코딩은 '보이는 적을 한꺼번에' 때리는 스킬이라 한 마리씩 상대해서는
      // 뭐가 좋은지 알 수가 없다. 배우는 순간 사방을 둘러싸서 쓸 자리를 만들어 준다.
      // 설명 창이 게임을 멈춰 두므로 창을 닫는 순간 포위가 드러난다.
      if (learned.some((s) => s.id === 'screen')) this.surroundForScreenSkill();
    }

    // 한 마리 잡을 때마다 / 다 잡았을 때. 씬이 필요한 쪽만 받아 쓴다.
    this.onEnemyKilled?.();
    this.onEnemyCleared?.();
  }

  showSwing(attacker) {
    keyboardSwing(this, attacker);
  }

  flash(target, color) {
    if (!target.active) return;
    const original = target.tintTopLeft;
    target.setTint(color);
    this.time.delayedCall(110, () => {
      if (!target.active) return;
      if (target === this.player) target.clearTint();
      else target.setTint(original);
    });
  }

  // ★ 머리 위로 뜨는 글씨 색은 여기 세 곳이 전부다.
  //    데미지 = 노랑, 적의 외침 = 빨강, 경험치 = 하늘색(onEnemyDefeated 안에 있다).
  showDamage(target, amount) {
    this.showFloatingText(target.x, target.chestY - 26, `${amount}`, '#ffd479');
  }

  // ★ 적이 외치는 말. 색을 바꾸려면 이 값이다.
  showShout(target, word) {
    this.showFloatingText(target.x, target.chestY - 34, word, '#ff8a94', 900);
  }

  showFloatingText(x, y, text, color, duration = 700) {
    const label = this.add
      .text(x, y, text, {
        fontFamily: 'sans-serif',
        fontSize: '13px',
        color,
        // 글씨가 밝은 카펫 위에도, 검은 추종자 몸 위에도 뜬다.
        // 어느 쪽이든 읽히려면 색만으로는 부족하고 검은 테두리를 둘러야 한다.
        stroke: '#14161c',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.text);

    this.tweens.add({
      targets: label,
      y: y - 16,
      alpha: 0,
      duration,
      onComplete: () => label.destroy(),
    });
  }

  bindPotionKeys() {
    this.input.keyboard.on('keydown-ONE', () => this.consume('supplement'));
    this.input.keyboard.on('keydown-TWO', () => this.consume('americano'));
  }

  consume(id) {
    if (this.transitioning) return;
    const potion = POTIONS[id];
    const result = GameState.usePotion(id);

    if (result === 'none') {
      this.ui.showHint(`${potion.name}가 없다`, 1400);
      return;
    }
    if (result === 'full') {
      this.ui.showHint(`${potion.restores.toUpperCase()}가 이미 가득 찼다`, 1400);
      return;
    }

    this.ui.showHint(`${potion.name}를 마셨다`, 1400);
    potionBurst(this, this.player, potion.color);
    this.showFloatingText(
      this.player.x,
      this.player.chestY - 30,
      `+${potion.amount} ${potion.restores.toUpperCase()}`,
      Phaser.Display.Color.IntegerToColor(potion.color).rgba
    );
  }

  get ui() {
    return this.scene.get('UIScene');
  }

  tileUnderPlayer() {
    return this.layer.getTileAtWorldXY(this.player.x, this.player.y - 4);
  }

  // 계단이든 출입문이든 밟고 있으면 참
  onExitTile() {
    const tile = this.tileUnderPlayer();
    return !!tile && EXIT_TILES.includes(tile.index);
  }

  // 페이드 아웃 후 다음 씬으로. 전환 중 입력이 겹치지 않도록 잠근다.
  goTo(sceneKey) {
    if (this.transitioning) return;
    this.transitioning = true;
    this.player.setVelocity(0, 0);
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      // 어디서 왔는지 알려 준다. 되돌아왔을 때 왔던 문 앞에 세우기 위한 것.
      this.scene.start(sceneKey, {from: this.scene.key});
    });
  }

  update(time, delta) {
    if (this.transitioning) return;
    this.player.update(delta);
    this.resolveShots();
    this.onUpdate?.();
  }
}
