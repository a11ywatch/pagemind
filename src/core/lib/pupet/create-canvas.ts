// use this method in PAGE evaluations to get imgs from dom ONLY USE PLAIN JS HERE: NO LET, CONST
const createCanvasPupet = (selector) => {
  var img = document.querySelector(selector);
  if (img) {
    var canvas = document.createElement("canvas");

    var scaleDown = function (value = 1) {
      var softScale = 1;
      if (value > 2000) {
        softScale = value > 3000 ? 2 : 1.6;
      } else if (value > 1500) {
        softScale = 1.4;
      } else if (value > 550) {
        softScale = 1.2;
      }
      return value / softScale;
    };

    var width = scaleDown(img.width) || 0;
    var height = scaleDown(img.height) || 0;

    canvas.width = width;
    canvas.height = height;

    try {
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      return { imageToBase64: canvas.toDataURL("image/jpg"), width, height };
    } catch (e) {
      console.error(e);
    }
  }
  return { imageToBase64: "", width: 0, height: 0 };
};

export { createCanvasPupet };
