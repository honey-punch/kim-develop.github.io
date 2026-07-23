import Phaser from 'phaser';
import {createTextures} from '../textures.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    createTextures(this);
    this.scene.start('OfficeScene');
  }
}
