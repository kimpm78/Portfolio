$(document).ready(function () {
  // スクロールをイベントを防ぐための関数
  function disableScroll() {
    // 現在スクロール位置を保存
    var scrollTop = $(window).scrollTop();
    // 스크롤 위치를 저장하고 있는 변수에 저장된 위치로 다시 이동시킴
    $(window).on("scroll.disableScroll", function () {
      $(window).scrollTop(scrollTop);
    });
  }

  // 페이지 로드 후 10초 뒤에 실행될 코드
  setTimeout(function () {
    // 스크롤 막기 해제
    $(window).off("scroll.disableScroll");
    // 로딩 스크롤 숨기기
    $("#loading-container").css("display", "none");
    $("#content").css("display", "block");
    $("#loading-container").fadeOut("slow");
    // 스크롤 활성화
    $("body").css("overflow", "auto");
  }, 10000);

  // 10초 동안 스크롤 막기
  disableScroll();
});

$(document).ready(function () {
  // 로그인 중에 실행되는 함수
  function hideContent() {
    $("#content").css("visibility", "hidden");
    $("#fp-nav").css("visibility", "hidden");
    // 10초 후에 다시 보이게 함
    setTimeout(function () {
      $("#content").css("visibility", "visible");
      $("#fp-nav").css("visibility", "visible");
    }, 10000);
  }

  // 로그인 중에 10초 동안 가시성 숨기기
  hideContent();
});
