// use this method in PAGE evaluations to get imgs from dom ONLY USE es5 JS HERE: NO LET, CONST
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

    var width = Math.min(Math.max(scaleDown(img.width), 50), 2200);
    var height = Math.min(Math.max(scaleDown(img.height), 50), 2200);

    canvas.width = width;
    canvas.height = height;

    try {
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      return {
        imageToBase64: canvas.toDataURL("image/jpeg"),
        width,
        height,
        url: img.src || "",
      };
    } catch (e) {
      console.error(e);
    }
  }
  return { imageToBase64: "", width: 0, height: 0 };
};

export { createCanvasPupet };
