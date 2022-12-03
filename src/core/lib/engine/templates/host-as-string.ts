// TODO: REPLACE FOR URL
export const getHostAsString = new String(
  `
      function getHostName(url) {
          if (url) {
              try {
                  let targetUrl = url;
                  if (!(url.indexOf("http://") === 0 || url.indexOf("https://") === 0)) {
                      targetUrl = "https://" + targetUrl;
                  }
                  return new URL(targetUrl).hostname;
              } catch (e) {
                  console.error(e);
                  return null;
              }
          }
      }
`
);
