import {defineConfig} from 'vite';

export default defineConfig({
  // GitHub Pages는 저장소 이름이 붙은 하위 경로에서 서비스된다.
  // (예: honey-punch.github.io/kim-develop.github.io/)
  //
  // base 기본값은 '/'라 빌드 결과가 /assets/... 를 가리킨다. 그러면 브라우저가
  // honey-punch.github.io/assets/... 를 찾다가 404를 맞고, 스크립트가 아예
  // 실행되지 않아 body 배경색만 남은 까만 화면이 된다.
  //
  // './'로 두면 index.html 위치를 기준으로 한 상대 경로가 되어
  // 저장소 이름이 무엇이든, 하위 경로든 루트든 그대로 동작한다.
  base: './',
});
