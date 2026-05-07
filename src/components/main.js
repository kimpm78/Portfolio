history.replaceState({}, null, location.pathname);

const timeOutarray = [];
let vMove;

// Fullpage 옵션 및 애니메이션 적용
new fullpage("#fullpage", {
  // Options
  licenseKey: "",
  autoScrolling: false,

  fitToSection: false,
  scrollOverflow: true,
  scrollingSpeed: 600,
  easingcss3: "cubic-bezier(0.770, 0.000, 0.175, 1.000)",
  css3: false,
  dragAndMove: true,
  anchors: ["0", "1", "2", "3", "4"],
  responsiveWidth: 680,
  normalScrollElements: ".sizeUP, .past_wrap, #about1",
  // Navigation
  menu: "#menu",
  navigation: true,
  navigationTooltips: ["INTRO", "ABOUT", "STACKS", "WORKS", "CONTACT"],
  showActiveTooltip: false,
  slidesNavPosition: "bottom",
  slidesNavigation: false,
  controlArrows: false,
  loopHorizontal: false,
  bigSectionsDestination: top,
  animateAnchor: false,
  recordHistory: false,

  // Callback
  afterLoad: function (anchorLink, origin) {
    $(".slide").removeClass("active");

    let i = 0;
    switch (origin.index) {
      case 0:
        $("#Intro").addClass("visible");
        $("#menu0").addClass("visible");
        break;
      case 1:
        $("#About").addClass("visible");
        timeOutarray[i++] = setTimeout(
          () => $("#typo_3").addClass("visible"),
          400,
        );
        timeOutarray[i++] = setTimeout(
          () => $("#typo_3 .more").addClass("visible"),
          900,
        );
        break;
      case 2:
        $("#Stacks").addClass("visible");
        timeOutarray[i++] = setTimeout(
          () => $("#frontendStack").addClass("visible"),
          100,
        );
        timeOutarray[i++] = setTimeout(
          () => $("#backendStack").addClass("visible"),
          400,
        );
        timeOutarray[i++] = setTimeout(
          () => $("#databaseStack").addClass("visible"),
          700,
        );
        timeOutarray[i++] = setTimeout(
          () => $("#toolStack").addClass("visible"),
          1000,
        );
        break;
      case 3:
        $("#Works").addClass("visible");
        timeOutarray[i++] = setTimeout(
          () => $(".Item_nav_prev").addClass("visible"),
          500,
        );
        timeOutarray[i++] = setTimeout(
          () => $(".Item_nav_next").addClass("visible"),
          500,
        );
        timeOutarray[i++] = setTimeout(
          () => $(".Item_nav_button_wrap").addClass("visible"),
          500,
        );
        break;
      case 4:
        $("#Contact").addClass("visible");
        timeOutarray[i++] = setTimeout(
          () => $(".social_wrap").addClass("visible"),
          700,
        );
        break;
    }
  },
  onLeave: function (origin, index) {
    $(".ct").removeClass("visible");
    $("header .right li").removeClass("visible");
    $("#menu" + index.index).addClass("visible");
    $("#about1").removeClass("visible");
    timeOutarray.forEach((e) => {
      clearTimeout(e);
    });

    switch (origin.index) {
      case 1:
        $("#typo_3").removeClass("visible");
        $("#typo_3 .more").removeClass("visible");
        break;
      case 2:
        $("#Stacks").removeClass("visible");
        $("#frontendStack").removeClass("visible");
        $("#backendStack").removeClass("visible");
        $("#databaseStack").removeClass("visible");
        $("#toolStack").removeClass("visible");
        break;
      case 3:
        $(".Item_nav_prev").removeClass("visible");
        $(".Item_nav_next").removeClass("visible");
        $(".Item_nav_button_wrap").removeClass("visible");
        $(".wi .info_main .more_wrap").slideUp(0);
        $(".wi .info_main span").text("もっと見る");
        break;
      case 4:
        $(".social_wrap").removeClass("visible");
        break;
    }
  },
});

//** HEADER **//

let isOpen = false;

$(".burger").click(() => {
  if (isOpen) {
    $(".open_icon").css({ opacity: 1 });
    $(".close_icon").css({ opacity: 0 });
    $(".m_menu").animate({ left: "-100vw" }, 150);
    $("html").css({ overflow: "auto" });
  } else {
    $(".open_icon").css({ opacity: 0 });
    $(".close_icon").css({ opacity: 1 });
    $(".m_menu").animate({ left: "0" }, 150);
    $("html").css({ overflow: "hidden" });
  }
  isOpen = !isOpen;
});

$(".m_menu a, #logo").click(() => {
  $(".open_icon").css({ opacity: 1 });
  $(".close_icon").css({ opacity: 0 });
  $(".m_menu").animate({ left: "-100vw" }, 150);
  $("html").css({ overflow: "auto" });
  isOpen = false;
});

$("#logo").click(() => {
  fullpage_api.moveTo("0", 0);
  history.replaceState({}, null, location.pathname);
});

$("#menu a, #fp-nav a").click(() => {
  $(".fp-overflow").animate({
    scrollTop: 0,
  });
});

$("#more").click(() => {
  $("#about1").addClass("visible");
  $("#about1").scrollTop(0, 0);
  $("html").css({ overflow: "hidden" });
});

$("#about1 .back, #about1 .close").click(() => {
  $("#about1").removeClass("visible");
  $("html").css({ overflow: "auto" });
});

// MY_STORY horizontal drag scroll
const pastWrap = document.querySelector("#about1 .past_wrap");
if (pastWrap) {
  let isPointerDown = false;
  let activePointerId = null;
  let startX = 0;
  let startScrollLeft = 0;
  let didDrag = false;
  let pointerDownImg = null;
  let skipNextClick = false;

  pastWrap.querySelectorAll("img").forEach((img) => {
    img.setAttribute("draggable", "false");
  });

  pastWrap.addEventListener("dragstart", (e) => {
    e.preventDefault();
  });

  const endDrag = () => {
    isPointerDown = false;
    activePointerId = null;
    pointerDownImg = null;
    pastWrap.classList.remove("is-grabbing");
  };

  pastWrap.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;

    isPointerDown = true;
    activePointerId = e.pointerId;
    didDrag = false;
    pointerDownImg = e.target.closest("img");
    startX = e.clientX;
    startScrollLeft = pastWrap.scrollLeft;
    pastWrap.classList.add("is-grabbing");
    pastWrap.setPointerCapture(e.pointerId);
  });

  pastWrap.addEventListener("pointermove", (e) => {
    if (!isPointerDown || e.pointerId !== activePointerId) return;

    const deltaX = e.clientX - startX;
    if (Math.abs(deltaX) > 4) didDrag = true;
    pastWrap.scrollLeft = startScrollLeft - deltaX;
    e.preventDefault();
  });

  pastWrap.addEventListener("pointerup", (e) => {
    if (
      isPointerDown &&
      e.pointerId === activePointerId &&
      !didDrag &&
      pointerDownImg
    ) {
      const imgName = pointerDownImg.getAttribute("src").split("/").pop();
      pastImgClick(imgName);
      skipNextClick = true;
    }
    endDrag();
  });
  pastWrap.addEventListener("pointercancel", endDrag);
  pastWrap.addEventListener("lostpointercapture", endDrag);

  // Prevent image click when the user dragged instead of clicked.
  pastWrap.addEventListener(
    "click",
    (e) => {
      if (skipNextClick) {
        e.preventDefault();
        e.stopPropagation();
        skipNextClick = false;
        return;
      }
      if (!didDrag) return;
      e.preventDefault();
      e.stopPropagation();
      didDrag = false;
    },
    true,
  );
}

//** STACKS **//

// dot background //
function getDocumentWidth() {
  return Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
}

function getDocumentHeight() {
  return Math.max(
    document.querySelector("#Stacks").clientHeight,
    window.innerHeight || 0,
  );
}

var canvas = document.getElementById("dotCanvas");
var context = canvas.getContext("2d");

var vw = getDocumentWidth(),
  vh = getDocumentHeight();

window.addEventListener("resize", onResize, false);
function onResize() {
  vw = getDocumentWidth();
  vh = getDocumentHeight();
  resizeCanvas();
}

function resizeCanvas() {
  canvas.width = vw;
  canvas.height = vh;
  drawDots();
}
resizeCanvas();

// stack item toggle (desktop)
$(".Stacks .stack_container ul li").on("click", function () {
  if (window.matchMedia("(max-width: 920px)").matches) return;

  const isActive = $(this).hasClass("active");
  $(".Stacks .stack_container ul li").removeClass("active");
  if (!isActive) $(this).addClass("active");
});

// grid
function drawGrid() {
  var cellW = 10,
    cellH = 10;

  // vertical lines
  for (var x = 0; x <= vw; x += cellW) {
    context.moveTo(x, 0); // x, y
    context.lineTo(x, vh);
  }

  // horizontal lines
  for (var y = 0; y <= vh; y += cellH) {
    context.moveTo(0, y); // x, y
    context.lineTo(vw, y);
  }

  context.strokeStyle = "#cccccc";
  context.stroke();
}
// drawGrid();

// dots
function drawDots() {
  var r = 2.2,
    cw = 40,
    ch = 40;

  for (var x = 20; x < vw; x += cw) {
    for (var y = 20; y < vh; y += ch) {
      context.fillStyle = "rgba(255,255,255, 0.09)";
      context.fillRect(x - r / 2, y - r / 2, r, r);
    }
  }
}
drawDots();

//** WORKS 1 **//

let isClick = false;
let worksItem = 0;
const worksItemLast = 7;
let defaultSpeed = 1.3;
let leftValue = 0;
let speed = defaultSpeed;

const changeItemEvent = (prev, next) => {
  $("#nav" + prev).removeClass("active");
  $(".wi" + prev).fadeOut(150, "swing", () => {
    $(".wi" + next)
      .stop()
      .fadeIn(150, "swing", () => {
        worksItem = next;
        isClick = false;
      });
    $("#nav" + next).addClass("active");
  });
};

// 갤러리 함수

$(window).resize(function () {
  $(".wi .info_main .more_wrap").slideUp(0);
  $(".wi .info_main span").text("もっと見る");
});

let readmeOpen = false;

// 클릭 이벤트
const readmeClick = () => {
  if (readmeOpen) {
    $(".readme_container").removeClass("visible");
    $("html").css({ overflow: "auto" });
  } else {
    $(".readme_container").addClass("visible");
    $("html").css({ overflow: "hidden" });
    $(".readme_scroll").scrollTop(0, 0);
  }
  readmeOpen = !readmeOpen;
};
const moreButtonClick = (e) => {
  $(".wi" + e + " .info_main .more_wrap")
    .stop()
    .slideToggle(150);
  if ($(".wi" + e + " .info_main span").text() == "もっと見る")
    $(".wi" + e + " .info_main span").text("隠す");
  else $(".wi" + e + " .info_main span").text("もっと見る");
};

const subImgClick = (e, index, m = false) => {
  $(".wi" + e + " .IMG_sub").removeClass("active");
  $(".wi" + e + " .IMG_sub")
    .eq(index)
    .addClass("active");
  if (m) {
    //$('.wi' + e + ' .IMG_main').html(`<img class='mobileImg' src='./src/img/project_img/${e}_${index}.png' alt='プロジェクトイメージ' onclick="mainImgClick(${e}, ${index}, ${m})">`);
    document.querySelector(".wi" + e + " .IMG_main").outerHTML =
      `<div class="IMG_main" onclick="mainImgClick(${e}, ${index}, ${m})"><img class='mobileImg' src='./src/img/project_img/${e}_${index}.png' alt='プロジェクト画像'></div>`;
  } else {
    //$('.wi' + e + ' .IMG_main').html(`<img src='./src/img/project_img/${e}_${index}.png' alt='プロジェクトイメージ' onclick="mainImgClick(${e}, ${index}, ${m})">`);
    document.querySelector(".wi" + e + " .IMG_main").outerHTML =
      `<div class="IMG_main" onclick="mainImgClick(${e}, ${index}, ${m})"><img src='./src/img/project_img/${e}_${index}.png' alt='プロジェクトイメージ'></div>`;
  }
  $(".wi" + e + " .IMG_main img").css({ opacity: "0" });
  $(".wi" + e + " .IMG_main img").animate({ opacity: "1" }, 150);
};

const mainImgClick = (e, index, m = false) => {
  $(".sizeUP").removeClass("past-mode").addClass("visible");
  $(".sizeUP").focus();
  if (m) {
    $(".sizeUP .ct").html(
      `<img class='mobileImg' src='./src/img/project_img/${e}_${index}.png' alt='ロジェクトイメージ'>`,
    );
  } else {
    $(".sizeUP .ct").html(
      `<img src='./src/img/project_img/${e}_${index}.png' alt='ロジェクトイメージ'>`,
    );
  }
  $(".sizeUP .ct").scrollTop(0);
  $("html").css("overflow", "hidden");
};

const visualImgClick = (img, m = false) => {
  defaultSpeed = 0;
  $(".sizeUP").removeClass("past-mode").addClass("visible");
  $(".sizeUP").focus();
  if (m) {
    $(".sizeUP .ct").html(
      `<img class='mobileImg' src='./src/img/project_img/${img}' alt='デザインイメージ'>`,
    );
  } else {
    $(".sizeUP .ct").html(
      `<img class='visualImg' src='./src/img/project_img/${img}' alt='デザインイメージ'>`,
    );
  }
  $(".sizeUP .ct").scrollTop(0);
  $("html").css("overflow", "hidden");
};

const projectImgClick = (img, m = false) => {
  $(".sizeUP").removeClass("past-mode").addClass("visible");
  $(".sizeUP").focus();
  if (m) {
    $(".sizeUP .ct").html(
      `<img class='mobileImg' src='./src/img/project_img/${img}' alt='プロジェクトイメージ'>`,
    );
  } else {
    $(".sizeUP .ct").html(
      `<img src='./src/img/project_img/${img}' alt='プロジェクトイメージ'>`,
    );
  }
  $(".sizeUP .ct").scrollTop(0);
  $("html").css("overflow", "hidden");
};

const subProjectImgClick = (e, img, index, m = false) => {
  $(".wi" + e + " .IMG_sub").removeClass("active");
  $(".wi" + e + " .IMG_sub").eq(index).addClass("active");

  if (m) {
    document.querySelector(".wi" + e + " .IMG_main").outerHTML =
      `<div class="IMG_main" onclick="projectImgClick('${img}', ${m})"><img class='mobileImg' src='./src/img/project_img/${img}' alt='プロジェクト画像'></div>`;
  } else {
    document.querySelector(".wi" + e + " .IMG_main").outerHTML =
      `<div class="IMG_main" onclick="projectImgClick('${img}')"><img src='./src/img/project_img/${img}' alt='プロジェクトイメージ'></div>`;
  }
  $(".wi" + e + " .IMG_main img").css({ opacity: "0" });
  $(".wi" + e + " .IMG_main img").animate({ opacity: "1" }, 150);
};

const pastImages = Array.from(document.querySelectorAll("#about1 .past_wrap img")).map(
  (img) => img.getAttribute("src").split("/").pop(),
);
let pastImageIndex = 0;

const renderPastSizeUp = (m = false) => {
  const img = pastImages[pastImageIndex];
  if (!img) return;

  if (m) {
    $(".sizeUP .ct").html(
      `<img class='mobileImg' src='./src/img/past/${img}' alt='デザインイメージ'>`,
    );
  } else {
    $(".sizeUP .ct").html(
      `<img class='pastImg' src='./src/img/past/${img}' alt='デザインイメージ'>`,
    );
  }
  $(".sizeUP .ct").scrollTop(0);
};

const pastImgClick = (img, m = false) => {
  const targetIndex = pastImages.indexOf(img);
  pastImageIndex = targetIndex >= 0 ? targetIndex : 0;

  $(".sizeUP").addClass("visible past-mode");
  $(".sizeUP").focus();
  renderPastSizeUp(m);
  $("html").css("overflow", "hidden");
};

const movePastSizeUp = (direction) => {
  if (!$(".sizeUP").hasClass("past-mode") || !pastImages.length) return;

  pastImageIndex =
    (pastImageIndex + direction + pastImages.length) % pastImages.length;
  renderPastSizeUp();
};

$(".sizeUP .past_size_nav.prev").click((e) => {
  e.stopPropagation();
  movePastSizeUp(-1);
});

$(".sizeUP .past_size_nav.next").click((e) => {
  e.stopPropagation();
  movePastSizeUp(1);
});

$(".sizeUP .ct, .sizeUP .top .close").click(() => {
  $(".sizeUP").removeClass("visible");
  $("html").css("overflow", "auto");
  defaultSpeed = 1.3;
  speed = defaultSpeed;
});

$(".Item_nav_next, .m_nav_wrap .next").click(() => {
  $(".wi .info_main .more_wrap").slideUp(150);
  $(".wi .info_main span").text("もっと見る");
  if (!isClick) {
    isClick = true;
    if (worksItem == worksItemLast) {
      $("#nav" + worksItem).removeClass("active");
      $(".wi" + worksItem).fadeOut(250, "swing", () => {
        $(".wi" + 0)
          .stop()
          .fadeIn(250, "swing", () => {
            worksItem = 0;
            isClick = false;
          });
        $("#nav" + 0).addClass("active");
      });
    }
    if (worksItem < worksItemLast) {
      $("#nav" + worksItem).removeClass("active");
      $(".wi" + worksItem).fadeOut(250, "swing", () => {
        $(".wi" + (worksItem + 1))
          .stop()
          .fadeIn(250, "swing", () => {
            worksItem++;
            isClick = false;
          });
        $("#nav" + (worksItem + 1)).addClass("active");
      });
    }
  }
});

$(".Item_nav_prev, .m_nav_wrap .prev").click(() => {
  if (!isClick) {
    isClick = true;
    if (worksItem == 0) {
      $("#nav" + worksItem).removeClass("active");
      $(".wi" + worksItem).fadeOut(250, "swing", () => {
        $(".wi" + worksItemLast)
          .stop()
          .fadeIn(250, "swing", () => {
            worksItem = worksItemLast;
            isClick = false;
          });
        $("#nav" + worksItemLast).addClass("active");
      });
    }
    if (worksItem > 0) {
      $("#nav" + worksItem).removeClass("active");
      $(".wi" + worksItem).fadeOut(250, "swing", () => {
        $(".wi" + (worksItem - 1))
          .stop()
          .fadeIn(250, "swing", () => {
            worksItem--;
            isClick = false;
          });
        $("#nav" + (worksItem - 1)).addClass("active");
      });
    }
  }
});

for (let i = 0; i <= worksItemLast; i++) {
  $("#nav" + i).on("click", (event) => {
    if (!isClick) {
      isClick = true;
      changeItemEvent(worksItem, i);
    }
  });
}

//** WORKS 2 **//

// 갤러리 자동 이동
$(".Visual_wrap").append($(".Visual_wrap ul").clone());

const visualMove = () => {
  $(".Visual_wrap").css({ left: `${leftValue}px` });
  if (
    $(".Visual_wrap").offset().left <=
    -1 * $(".Visual_wrap ul").outerWidth()
  ) {
    leftValue = 0;
  }
  leftValue -= speed;
};

$(".Visual_wrap").hover(
  () => {
    if (defaultSpeed !== 0) speed = 0.3;
  },
  () => {
    speed = defaultSpeed;
  },
);

$(".Visual_wrap")
  .on("mousedown", function () {
    speed = 0;
  })
  .on("mouseup", function () {
    speed = 0.3;
  })
  .on("mouseleave", function () {
    speed = defaultSpeed;
  });

vMove = setInterval(() => visualMove(), 10);

console.clear();
