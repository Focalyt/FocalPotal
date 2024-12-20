// Pricing table - mobile only slider
var init = false;
var pricingCardSwiper;
var pricingLoanSwiper
function swiperCard() {
  if (window.innerWidth <= 991) {
    if (!init) {
      init = true;
      pricingCardSwiper = new Swiper("#pricingTableSlider", {
        slidesPerView: "auto",
        spaceBetween: 5,
        grabCursor: true,
        keyboard: true,
        autoHeight: false,
        navigation: {
          nextEl: "#navBtnRight",
          prevEl: "#navBtnLeft",
        },
      });
    }
  } else if (init) {
    pricingCardSwiper.destroy();
    init = false;
  }
}
swiperCard();
window.addEventListener("resize", swiperCard);