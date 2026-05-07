$(document).ready(function () {
  var LOADING_SHOWN_KEY = "portfolio-loading-shown";

  // スクロールをイベントを防ぐための関数
  function disableScroll() {
    // 現在スクロール位置を保存
    var scrollTop = $(window).scrollTop();
    // スクロールイベントをキャプチャして、スクロール位置を固定
    $(window).on("scroll.disableScroll", function () {
      $(window).scrollTop(scrollTop);
    });
  }

  // ローディングが完了した後にコンテンツを表示する関数
  function showContentImmediately() {
    $(window).off("scroll.disableScroll");
    $("#loading-container").hide();
    $("#content").css({ display: "block", visibility: "visible" });
    $("#fp-nav").css("visibility", "visible");
    $("body").css("overflow", "auto");
  }

  // ローディングが既に表示されたかどうかをローカルストレージから確認
  var hasShownLoading = false;
  try {
    hasShownLoading = localStorage.getItem(LOADING_SHOWN_KEY) === "true";
  } catch (e) {
    hasShownLoading = false;
  }

  if (hasShownLoading) {
    showContentImmediately();
    return;
  }

  disableScroll();
  $("#content").css("visibility", "hidden");
  $("#fp-nav").css("visibility", "hidden");
  $("body").css("overflow", "hidden");

  // ローディングを5秒後にフェードアウトしてコンテンツを表示
  setTimeout(function () {
    $("#loading-container").fadeOut("slow", function () {
      showContentImmediately();
    });
    try {
      localStorage.setItem(LOADING_SHOWN_KEY, "true");
    } catch (e) {
      // ignore storage errors
    }
  }, 5000);
});