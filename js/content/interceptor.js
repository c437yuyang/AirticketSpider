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
                  let data = this.response.data.flightItineraryList;
                  console.log(data)
                  if (data) {
                    let dataLen = data.length;
                    let splitNum = 10;
                    for (let i = 0; i < Math.ceil(dataLen / splitNum); ++i) {
                        let top = ((i+1) * splitNum > dataLen) ? (dataLen) : ((i+1) * splitNum);
                        let subData = data.slice(i * splitNum, top);
                        let dataDOMElement = document.createElement('div');
                        // dataDOMElement.id = '__interceptedData';
                        dataDOMElement.className = '__interceptedData';
                        dataDOMElement.innerText = JSON.stringify(subData);
                        dataDOMElement.style.height = 0;
                        dataDOMElement.style.overflow = 'hidden';
                        document.body.appendChild(dataDOMElement);
                    }
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
    var responseContainingEle = document.getElementsByClassName('__interceptedData');
    console.log('found spider data element:',responseContainingEle.length);
    if (responseContainingEle.length > 0) {
        let data = [];
        if (responseContainingEle && responseContainingEle.length > 1) {
            for (let i = 0; i < responseContainingEle.length; ++i) {
                let subData = JSON.parse(responseContainingEle[i].innerHTML);
                console.log('subDatalen',subData.length);
                for (let j = 0; j < subData.length; ++j) {
                    data.push(subData[j]);
                }
            }
        }
        console.log('data total size:', data.length);
        postResponse(data);
    } else {
        requestIdleCallback(scrapeData);
    }
}
requestIdleCallback(scrapeData);

requestIdleCallback(checkForDOM);

function postResponse(resp) {
    let depDate = getUrlParam('depDate');
    let data = {
        airInfos: resp,
        deptDate: depDate
    };
    sendMessageToBackground("postResponse", data);
}