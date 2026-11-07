// 키보드 입력. 방향키와 WASD를 모두 지원하고, 창이 포커스를 잃으면 눌린 키를 초기화한다.

const KEYS = {
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
};

export class Input {
  constructor(target = window) {
    this.down = new Set();
    target.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      this.down.add(e.code);
      if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault(); // 스크롤 방지
    });
    target.addEventListener('keyup', (e) => this.down.delete(e.code));
    target.addEventListener('blur', () => this.down.clear());
  }

  held(action) {
    return KEYS[action].some((k) => this.down.has(k));
  }

  /** 화면 기준 이동 방향. x: 오른쪽 +, z: 아래(남쪽) +. 대각선도 속도가 같도록 정규화한다. */
  axis() {
    let x = (this.held('right') ? 1 : 0) - (this.held('left') ? 1 : 0);
    let z = (this.held('down') ? 1 : 0) - (this.held('up') ? 1 : 0);
    if (x !== 0 && z !== 0) {
      x *= Math.SQRT1_2;
      z *= Math.SQRT1_2;
    }
    return { x, z };
  }
}
