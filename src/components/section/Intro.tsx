export default function Intro() {
  return (
    <section>
      <h1 className="text-5xl font-bold">웹 워커란?</h1>
      <p>
        메인 스레드와 분리된 백그라운드 스레드에서 JS 코드를 돌려, UI 렌더링과
        입력 처리의 방해를 최소화하는 기능입니다.
      </p>

      <h2 className="text-2xl font-bold">웹 워커의 주요 특징</h2>
      <ul>
        <li>
          <dt>메인 스레드와 분리된 백그라운드 스레드:</dt>
          <dd>
            JavaScript는 기본적으로 싱글 스레드 언어이지만, 웹 워커를 통해 멀티
            스레딩과 유사한 효과를 낼 수 있습니다.
          </dd>
        </li>
        <li>
          <dt>성능 최적화:</dt>
          <dd>
            무거운 연산, 바이너리 파일 처리, 복잡한 데이터 핸들링 등을 웹
            워커에서 처리하여 메인 스레드가 UI 렌더링이나 사용자 반응에 집중할
            수 있도록 합니다.
          </dd>
        </li>
        <li></li>
        <li>
          <dt>메시지 기반 통신:</dt>
          <dd>
            메인 스레드와 웹 워커는 postMessage() 메서드를 사용하여 데이터를
            주고받고, onmessage 이벤트를 통해 메시지를 감지합니다.
          </dd>
        </li>
        <li>
          <dt>제한된 접근 권한:</dt>
          <dd>
            웹 워커 스레드는 DOM에 접근할 수 없고, window 객체나 다른 UI 관련
            API를 사용할 수 없습니다.
          </dd>
        </li>
      </ul>

      <h2 className="text-2xl font-bold">웹 워커가 유용한 경우</h2>
      <ul>
        <li>
          <dt>복잡한 계산:</dt>
          <dd>사용자가 UI를 조작하는 동안에도 데이터를 처리해야 하는 경우.</dd>
        </li>
        <li>
          <dt>지속적인 백그라운드 작업:</dt>
          <dd>실시간 통신이나 주기적인 업데이트가 필요한 작업. </dd>
        </li>
        <li>
          <dt>대용량 데이터 처리:</dt>
          <dd>
            이미지 처리나 바이너리 데이터 분석 등 리소스가 많이 소모되는 작업.
          </dd>
        </li>
      </ul>
    </section>
  );
}
