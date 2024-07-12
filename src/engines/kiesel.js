'use strict';

const assert = require('assert');
const execa = require('execa');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const Installer = require('../installer');
const { platform, ensureDirectory } = require('../common');

function getFilename() {
  switch (platform) {
    case 'darwin-x64':
      return 'macos-x86_64';
    case 'darwin-arm64':
      return 'macos-aarch64';
    case 'linux-ia32':
      return 'linux-x86';
    case 'linux-x64':
      return 'linux-x86_64';
    case 'linux-arm64':
      return 'linux-aarch64';
    case 'linux-riscv64':
      return 'linux-riscv64';
    case 'win32-ia32':
      return 'windows-x86';
    case 'win32-x64':
      return 'windows-x86_64';
    case 'win32-arm64':
      return 'windows-aarch64';
    default:
      throw new Error(`No Kiesel builds available for ${platform}`);
  }
}

class KieselInstaller extends Installer {
  constructor(...args) {
    super(...args);

    this.binPath = undefined;
  }

  static resolveVersion(version) {
    if (version === 'latest') {
      return fetch('https://files.kiesel.dev/version.txt')
        .then((r) => r.text())
        .then((t) => t.trim());
    }
    return version;
  }

  getDownloadURL(version) {
    return `https://files.kiesel.dev/kiesel-${getFilename()}`;
  }

  async extract() {
    // We downloaded an executable, only chmod and move it
    await fs.promises.chmod(this.downloadPath, '755');
    await ensureDirectory(this.extractedPath);
    await fs.promises.copyFile(this.downloadPath, path.join(this.extractedPath, 'kiesel'));
  }

  async install() {
    this.binPath = await this.registerBinary('kiesel');
  }

  async test() {
    const program = 'Kiesel.print("42");';
    const output = '42';

    assert.strictEqual(
      (await execa(this.binPath, ['-c', program])).stdout,
      output,
    );
  }
}

KieselInstaller.config = {
  name: 'Kiesel',
  id: 'kiesel',
  supported: [
    'linux-ia32',
    'linux-x64',
    'linux-arm64',
    'linux-riscv64',
    'win32-ia32',
    'win32-x64',
    'win32-arm64',
  ],
};

module.exports = KieselInstaller;
