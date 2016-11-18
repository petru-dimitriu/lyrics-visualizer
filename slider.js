function Slider() {
  this.getSliderHtml = function () {
    return '<div class="slider-background"><div class="slider-inside"></div></div>';
  };

  this.init = function (name, total, clickAction) {
    this.divName = name;
    this.current = 0;
    this.total = total;
    this.clickAction = clickAction;
    $(name).html('<div class="slider-background"><div class="slider-inside"></div></div>');
    if (clickAction !== undefined) {
      $(`${name}.slider-inside`).click(function (e) { this.clickAction(e.pageX, e.pageY); });
    }
  };

  this.setValue = function (value, total) {
    this.current = value;
    this.total = total;
    this.redraw();
  };

  this.getWidth = function () {
    return $(`${name}.slider-background`).width();
  };

  this.redraw = function () {
    const dimension = Math.round(this.current / this.total * this.getWidth());
    $(`${name}.slider-inside`).css('width', `${dimension}px`);
  };
}
