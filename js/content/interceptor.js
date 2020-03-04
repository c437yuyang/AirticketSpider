function interceptData() {
    var xhrOverrideScript = document.createElement('script');
    xhrOverrideScript.type = 'text/javascript';
    xhrOverrideScript.innerHTML = `
    (function() {
      var XHR = XMLHttpRequest.prototype;
      var send = XHR.send;
      var open = XHR.open;
      XHR.open = function(method, url) {
          this.url = url; // the request url
          return open.apply(this, arguments);
      }
      XHR.send = function() {
          this.addEventListener('load', function() {
              if (this.url.includes('flights.ctrip.com/international/search/api/search/batchSearch') 
                  || this.url.includes('flights.ctrip.com/international/search/api/search/pull')) {
                  console.log(this.response);
                  if(this.response.data.context.finished === true) {
                    var dataDOMElement = document.createElement('div');
                    dataDOMElement.id = '__interceptedData';
                    dataDOMElement.innerText = JSON.stringify(this.response);
                    dataDOMElement.style.height = 0;
                    dataDOMElement.style.overflow = 'hidden';
                    document.body.appendChild(dataDOMElement);
                  }
              }
          });
          return send.apply(this, arguments);
      };
    })();
    `
    document.head.prepend(xhrOverrideScript);
}

function checkForDOM() {
    if (document.body && document.head) {
        interceptData();
    } else {
        requestIdleCallback(checkForDOM);
    }
}

function scrapeData() {
    var responseContainingEle = document.getElementById('__interceptedData');
    if (responseContainingEle) {
        postResponse(responseContainingEle.innerHTML)
    } else {
        requestIdleCallback(scrapeData);
    }
}
requestIdleCallback(scrapeData);

requestIdleCallback(checkForDOM);

function postResponse(resp) {
    let depDate = getUrlParam('depDate');
    let airInfos = JSON.parse(resp);
    let data = {
        airInfos: airInfos,
        deptDate: depDate
    };
    sendMessageToBackground("postResponse", data);
    // return;
    // let dept = $('span[class="depart"]').text();
    // let dest = $('span[class="arrive"]').text();

    // $.ajax({
    //     type: 'post',
    //     url: `${API_BASE}/spider/handle`,
    //     contentType: 'application/json;charset=utf-8',
    //     data: JSON.stringify({
    //         airInfos: JSON.parse(resp),
    //         dept: dept,
    //         dest: dest
    //     }),
    //     success: _ => {
    //     },
    // });
}