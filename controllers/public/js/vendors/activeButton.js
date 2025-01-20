var btnContainer = document.getElementsByClassName("main-menu-content")

var btns = btnContainer.getElementsByClassName("feather icon-home")

for(var i = 0; i <btns.length;i++){
    btns[i].addEventListener("click",function(){
        var current = document.getElementsByClassName("active")
        current[0].className=current[0].className.replace("active","")

        this.className+="active"
    })
}