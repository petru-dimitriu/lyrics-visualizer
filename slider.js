function Slider() {

    this.getSliderHtml = function () {
        return '<div class="slider-background"><div class="slider-inside"></div></div>';
    };

    this.init = function (name, total) {
        this.divName = name;
        this.current = 0;
        this.total = total;
        $(name).html('<div class="slider-background"><div class="slider-inside"></div></div>');
    };

    this.setValue = function(value,total) {
        this.current = value;
        this.total = total;
        this.redraw();
    };

    this.redraw =  function () {
        var percentage = Math.round(this.current / this.total * 100);
        $(name + ".slider-inside").css('width',percentage + "%");
    }

}
