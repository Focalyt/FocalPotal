const menu = document.querySelector(".menu-block");
const menuMain = menu?.querySelector(".site-menu-main");
const submenuAll = menu?.querySelectorAll(".sub-menu");
const menuTrigger = document.querySelector(".mobile-menu-trigger");
const closeMenu = menu?.querySelector(".mobile-menu-close");
const body = document.querySelector("body");
const menuOverlay = document.querySelector(".menu-overlay");

let subMenu;
let subMenuArray = [];
let subMenuTextArray = [];

function last(array) {
  return array[array.length - 1];
}

function last2(array) {
  return array[array.length - 2];
}

menuMain?.addEventListener("click", (e) => {

  if (!menu.classList.contains("active")) {
    return;
  }
  if (e.target.closest(".nav-item-has-children")) {
    const hasChildren = e.target.closest(".nav-item-has-children");

    showSubMenu(hasChildren);
  }

});

function toggleMenu() {
  menu.classList.toggle("active");
  menuOverlay.classList.toggle("active");
  menu.classList.add("transition");
  menuOverlay.classList.add("transition");
}

menuTrigger?.addEventListener("click", () => {
  toggleMenu();
})

closeMenu?.addEventListener("click", () => {
  toggleMenu();
})

menuOverlay?.addEventListener("click", () => {
  toggleMenu();
})

window.addEventListener("resize", function () {
  if (menu.classList.contains("transition")) {
    menu.classList.remove("transition");
  }
  if (menuOverlay.classList.contains("transition")) {
    menuOverlay.classList.remove("transition");
  }
})

function showSubMenu(hasChildren) {
  subMenu = hasChildren.querySelector(".sub-menu");
  subMenu.classList.toggle("active");
}

window.onresize = function () {
  if (this.innerWidth > 991) {
    if (menu.classList.contains("active")) {
      toggleMenu();
    }
  }
}

window.onscroll = function () {
  scrollFunction();
};

function scrollFunction() {
  if (
    document.body.scrollTop > 50 ||
    document.documentElement.scrollTop > 50
  ) {
    $(".site-header--sticky").addClass("scrolling");
    $(".site-header--sticky").css("background-color", "#ffffff");
    $(".nav-link-item").css("color", "#000");
    $(".loginbtnn").css("background-color", "#FC2B5A");
    $(".nav-item .dropdown-container > span.active_menu").css("color" , "#fff");
  } else {
    $(".site-header--sticky").removeClass("scrolling");
    $(".site-header--sticky").css("background-color", "#121212");
    $(".nav-link-item").css("color", "#fff");
    $(".loginbtnn").css("background-color", "#fff", "color" , "#FC2B5A");
    $(".nav-item .dropdown-container > span.active_menu").css("color" , "#FC2B5A" , "background-color" , "#fff");

  }
  if (
    document.body.scrollTop > 700 ||
    document.documentElement.scrollTop > 700
  ) {
    $(".site-header--sticky.scrolling").addClass("reveal-header");
  } else {
    $(".site-header--sticky.scrolling").removeClass("reveal-header");
  }
}

$('.faq-tab__nav').find('li').hover(function(){
  $('.faq-tab__nav').find('.active').removeClass('active')
  $(this).addClass('active')
  $('.tab-content').find('.show').removeClass('show').removeClass('active')
  $('.tab-content').hide();
  var activeTab = $(this).find('button').attr('data-bs-target');
  $(activeTab).addClass('show active');
  $('.tab-content').show();
  return false;
});