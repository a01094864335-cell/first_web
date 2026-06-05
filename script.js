const helloButton = document.querySelector("#helloButton");
const message = document.querySelector("#message");

helloButton.addEventListener("click", function () {
  message.textContent = "좋습니다. 이제 진짜 개발자 여정이 시작됐습니다.";
});