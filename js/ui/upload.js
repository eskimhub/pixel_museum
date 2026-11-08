// 작품 올리기 폼 (상세 패널 안). 빈 자리 + 로그인한 내 미술관일 때만 "작품 올리기" 버튼이 나타난다.
// 폼 요소가 없는 페이지(일부 테스트)에서는 모든 함수가 아무것도 하지 않는다.
import { toPng } from '../data/imageResize.js';
import { uploadArtwork, describeError, validateArtwork } from '../data/museumApi.js';

const openBtn = document.getElementById('upload-open');
const form = document.getElementById('upload-form');
const fileEl = document.getElementById('upload-file');
const titleEl = document.getElementById('upload-title');
const descEl = document.getElementById('upload-desc');
const msg = document.getElementById('upload-msg');
const submitBtn = document.getElementById('upload-submit');
const cancelBtn = document.getElementById('upload-cancel');

let deps = null;     // { getConnection(): {client, museum, userId} | null, onUploaded(slotId, art) }
let slotNow = null;
let busy = false;

function say(text, ok = false) {
  msg.textContent = text;
  msg.className = ok ? 'auth-ok' : 'auth-error';
}

function collapse() {
  form.hidden = true;
  form.reset();
  say('');
  openBtn.hidden = slotNow === null;
}

/** 패널이 닫힐 때 호출한다 */
export function resetUpload() {
  slotNow = null;
  if (!form) return;
  form.hidden = true;
  openBtn.hidden = true;
  form.reset();
  say('');
  document.activeElement?.blur();
}

/** 패널을 열 때 호출한다. 빈 자리이고 올릴 수 있는 상태일 때만 버튼을 보여준다 */
export function prepareUpload(slot, art) {
  resetUpload();
  if (!form || art || !deps?.getConnection()) return;
  slotNow = slot.id;
  openBtn.hidden = false;
}

export function initUpload(d) {
  if (!form) return;
  deps = d;

  openBtn.addEventListener('click', () => {
    openBtn.hidden = true;
    form.hidden = false;
    titleEl.focus();
  });
  cancelBtn.addEventListener('click', () => { if (!busy) collapse(); });
  // 입력창에서는 게임 입력이 무시되므로, Esc로 폼만 접을 수 있게 한다
  form.addEventListener('keydown', (e) => {
    e.stopPropagation(); // 폼 안에서 누른 키는 게임(이동, E/Space/Esc 닫기)으로 전달하지 않는다
    if (e.key === 'Escape' && !busy) { e.preventDefault(); collapse(); }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy || slotNow === null) return;
    const slot = slotNow;
    const title = titleEl.value;
    const description = descEl.value;
    const problem = validateArtwork({ slot, title, description });
    if (problem) return say(problem);
    const conn = deps.getConnection();
    if (!conn) return say('로그인이 필요합니다.');

    busy = true;
    submitBtn.disabled = true;
    cancelBtn.disabled = true;
    say('올리는 중...', true);
    try {
      const blob = await toPng(fileEl.files[0]);
      const art = await uploadArtwork(conn.client, {
        museum: conn.museum, userId: conn.userId, slot, title, description, blob,
      });
      deps.onUploaded(slot, art);
    } catch (err) {
      say(describeError(err));
    } finally {
      busy = false;
      submitBtn.disabled = false;
      cancelBtn.disabled = false;
    }
  });
}
