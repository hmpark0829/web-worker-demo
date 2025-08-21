// 워커 내부 코드
let currentTime = new Date();
let logEnabled = false;

function sendTime() {
  postMessage(currentTime.toISOString());
  if (logEnabled) {
    console.log("워커 내부 tick:", currentTime.toLocaleTimeString());
  }
  currentTime = new Date(currentTime.getTime() + 1000);
}

setInterval(sendTime, 1000);

// 최초 실행 시 바로 한 번 보냄
sendTime();

self.onmessage = (event) => {
  if (event.data && event.data.type === "console") {
    logEnabled = !!event.data.enabled;
  }
};
