// ==UserScript==
// @name         Enhanced Dialog Interaction Script
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Create an enhanced dialog interaction on the page
// @author       You
// @match        https://www.chinadiscovery.com/*
// @require      https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  let apiToken = '';
  let msgs = [{ role: 'system', content: `You are a helpful assistant.I need you to help me extract the following fields: 1. Arrival Date [field name is ArrivalDate, meaning the date the guest wants to arrive] \n2. Number of travelers in total [field name is TotalNumber, meaning there are a total of How many guests] \n3. email [field name is EmailAddress, meaning the guest's email address] \nIf the guest doesn't mention one of these three fields, please remind him as an assistant to tell us about them, and if they exist, please return me a json data that contains them.` },]

  function createButton(text, onClick, styles) {
      const button = document.createElement("button");
      button.textContent = text;
      button.addEventListener('click', onClick);
      if (styles) {
        for (const key in styles) {
          if (Object.hasOwnProperty.call(styles, key)) {
            const val = styles[key];
            button.style[key] = val
          }
        }
      } else {
        button.style.padding = '5px 10px';
        button.style.margin = '5px';
      }
      return button;
  }

  function openTokenDialog() {
      const tokenDialog = document.createElement("div");
      tokenDialog.style.position = 'fixed';
      tokenDialog.style.bottom = '20%';
      tokenDialog.style.right = '20%';
      tokenDialog.style.backgroundColor = 'white';
      tokenDialog.style.border = '1px solid black';
      tokenDialog.style.padding = '20px';
      tokenDialog.style.zIndex = '1000';
      tokenDialog.style.display = 'flex';
      tokenDialog.style.flexDirection = 'column';
      tokenDialog.style.alignItems = 'center';

      const label = document.createElement('label');
      label.setAttribute('for', 'apiTokenInput');
      label.textContent = 'Enter API Token:';
      tokenDialog.appendChild(label);

      const input = document.createElement('input');
      input.type = 'text';
      input.id = 'apiTokenInput';
      input.style.margin = '10px';
      tokenDialog.appendChild(input);

      const submitButton = createButton('Submit', submitToken);
      tokenDialog.appendChild(submitButton);

      document.body.appendChild(tokenDialog);
  }

  function submitToken() {
      apiToken = document.getElementById('apiTokenInput').value;
      console.log(apiToken);
      if (apiToken) {
          document.querySelector('div[style*="flex-direction: column;"]').remove();
          openChatDialog();
      }
  }

  function openChatDialog() {
      const chatDialog = document.createElement("div");
      chatDialog.id = 'chat'
      chatDialog.style.position = 'fixed';
      chatDialog.style.maxWidth = '50%';
      chatDialog.style.bottom = '20px';
      chatDialog.style.right = '20px';
      chatDialog.style.backgroundColor = 'white';
      chatDialog.style.border = '1px solid black';
      chatDialog.style.padding = '10px';
      chatDialog.style.zIndex = '1000';

      const chatContent = document.createElement("div");
      chatContent.id = "chatContent";
      chatContent.style.height = '300px';
      chatContent.style.overflowY = 'auto';
      chatContent.style.borderBottom = '1px solid black';
      chatContent.style.marginBottom = '10px';
      chatDialog.appendChild(chatContent);

      const userInput = document.createElement("textarea");
      userInput.id = "userInput";
      userInput.rows = '3';
      userInput.style.width = '100%';
      chatDialog.appendChild(userInput);

      const sendButton = createButton('Send', sendMessage);
      chatDialog.appendChild(sendButton);

      const closeButton = createButton('Close', closeChatDialog);
      chatDialog.appendChild(closeButton);

      document.body.appendChild(chatDialog);
  }

  function sendMessage() {
      const userInput = document.getElementById('userInput');
      const userText = userInput.value;
      userInput.value = '';
      const chatContent = document.getElementById('chatContent');
      const userMessageDiv = document.createElement('div');
      userMessageDiv.innerHTML = `<b>You:</b> ${userText}`;
      chatContent.appendChild(userMessageDiv);
      // 发送消息给API，并更新chatContent显示API的响应
      // 例如：axios.post(...)
      msgs.push({ role: 'user', content: userText})
      axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4',
        // presence_penalty: 0,
        // frequency_penalty: 0,
        // stream: true,
        // temperature: 0.5,
        // top_p: 1,
        messages: msgs,
      }, {
          headers: {
            'Authorization': 'Bearer ' + apiToken, // 用你的API密钥替换YOUR_API_KEY
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
      })
      .then(response => {
        const val = response.data.choices[0].message.content
        msgs.push({ role: 'assistant', content: val })
        const jsonMatch = val.replace(/\n/g, '').match(/\s*({.*?})\s*/);
        if (jsonMatch) {
            // 提取 JSON 字符串
            const jsonString = jsonMatch[1];

            try {
                // 将 JSON 字符串转换为 JavaScript 对象
                const jsonObj = JSON.parse(jsonString);
                console.log(jsonObj);
                closeChatDialog()
                document.getElementsByClassName('nav-makeEnquiry')[0].click()
                setTimeout(() => {
                  for (const key in jsonObj) {
                    if (Object.hasOwnProperty.call(jsonObj, key)) {
                      document.querySelectorAll(`input[name="${key}"]`)[0].value = jsonObj[key]
                    }
                  }
                }, 500)

                // 使用 jsonObj 对象...
            } catch (e) {
                console.error('JSON parsing error:', e);
            }
        } else {
            const chatContent = document.getElementById('chatContent');
            const userMessageDiv = document.createElement('div');
            userMessageDiv.innerHTML = `<b>Assistant:</b> ${val}`;
            chatContent.appendChild(userMessageDiv);
        }

      })
      .catch(error => {
          console.log(error);
      });
  }

  function closeChatDialog() {
      document.getElementById('chat').remove();
  }

  // 创建并添加主按钮
  const button = createButton('Open Dialog', openTokenDialog, { position: 'fixed', bottom: "20px", right: '20px', zIndex: 1000 });
  document.body.appendChild(button);

})();
