/**
 * Roche 悬浮球插件 v3.0.0
 * 
 * 功能：
 * 1. 悬浮球全局可用（不随插件页面切换消失）
 * 2. 注入用户消息 / 角色消息 / 系统消息
 * 3. 触发AI原生回复（DOM自动发送，需在聊天页）
 * 4. AI对话备选模式（roche.ai.chat + persona注入）
 * 5. 定时提醒（char主动发消息）
 * 6. 消息历史查看
 * 7. 记忆读写
 * 
 * 基于 RocheToolkit 逆向的 IndexedDB 结构
 */

window.RochePlugin.register({
  id: "floating-ball",
  name: "悬浮球",
  version: "3.0.0",
  apps: [
    {
      id: "floating-ball-main",
      name: "悬浮球",
      icon: "bubble_chart",
      iconImage: "",
      async mount(container, roche) {
        var style = document.createElement('style');
        style.id = 'roche-plugin-floating-ball-style';
        style.textContent = `
          .roche-plugin-floating-ball {
            --bg: #0a0a0f; --card: #141420; --accent: #e94560; --blue: #0f3460;
            --text: #e0e0e0; --text2: #888; --radius: 12px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            color: var(--text); background: var(--bg); padding: 20px;
            height: 100%; overflow-y: auto; box-sizing: border-box;
          }
          .roche-plugin-floating-ball h2 { margin: 0 0 16px 0; font-size: 20px; color: var(--accent); }
          .roche-plugin-floating-ball .section { background: var(--card); border-radius: var(--radius); padding: 16px; margin-bottom: 12px; }
          .roche-plugin-floating-ball .section-title { font-size: 14px; color: var(--text2); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
          .roche-plugin-floating-ball label { display: block; font-size: 13px; color: var(--text2); margin-bottom: 4px; }
          .roche-plugin-floating-ball select, .roche-plugin-floating-ball input, .roche-plugin-floating-ball textarea {
            width: 100%; background: #1a1a2e; border: 1px solid #2a2a3e; border-radius: 8px;
            color: var(--text); padding: 8px 12px; font-size: 14px; margin-bottom: 10px; box-sizing: border-box;
          }
          .roche-plugin-floating-ball textarea { min-height: 60px; resize: vertical; }
          .roche-plugin-floating-ball .btn {
            display: inline-block; padding: 8px 16px; border-radius: 8px; border: none;
            font-size: 14px; cursor: pointer; margin-right: 6px; margin-bottom: 6px;
          }
          .roche-plugin-floating-ball .btn-primary { background: var(--accent); color: #fff; }
          .roche-plugin-floating-ball .btn-secondary { background: var(--blue); color: #fff; }
          .roche-plugin-floating-ball .btn-green { background: #1a6a3a; color: #fff; }
          .roche-plugin-floating-ball .btn-orange { background: #a85a1a; color: #fff; }
          .roche-plugin-floating-ball .btn-purple { background: #6a1a8a; color: #fff; }
          .roche-plugin-floating-ball .btn:disabled { opacity: 0.4; cursor: not-allowed; }
          .roche-plugin-floating-ball .status { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
          .roche-plugin-floating-ball .status-on { background: #1a4a2e; color: #4ade80; }
          .roche-plugin-floating-ball .status-off { background: #3a1a1a; color: #f87171; }
          .roche-plugin-floating-ball .char-list-item {
            display: flex; align-items: center; padding: 8px; border-radius: 8px; cursor: pointer; margin-bottom: 4px;
          }
          .roche-plugin-floating-ball .char-list-item:hover { background: #1a1a2e; }
          .roche-plugin-floating-ball .char-list-item.selected { background: var(--blue); }
          .roche-plugin-floating-ball .char-avatar { width: 32px; height: 32px; border-radius: 50%; margin-right: 10px; object-fit: cover; }
          .roche-plugin-floating-ball .char-name { font-size: 14px; }
          .roche-plugin-floating-ball .divider { border-top: 1px solid #2a2a3e; margin: 12px 0; }
          .roche-plugin-floating-ball .timer-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
          .roche-plugin-floating-ball .timer-row input { margin-bottom: 0; }
          .roche-plugin-floating-ball .timer-row select { margin-bottom: 0; width: auto; }
          /* 悬浮球 - 全局 */
          #fb-global-ball {
            position: fixed; width: 48px; height: 48px; border-radius: 50%;
            background: #e94560; color: #fff; display: flex; align-items: center; justify-content: center;
            font-size: 20px; cursor: pointer; z-index: 99999;
            box-shadow: 0 2px 12px rgba(233,69,96,0.4); user-select: none; transition: transform 0.2s;
          }
          #fb-global-ball:hover { transform: scale(1.1); }
          /* 聊天面板 - 全局 */
          #fb-global-chat {
            position: fixed; width: 320px; max-height: 440px; background: #141420;
            border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.6); z-index: 99998;
            display: flex; flex-direction: column; overflow: hidden;
          }
          #fb-global-chat .chat-header { padding: 10px 14px; background: #1a1a2e; display: flex; align-items: center; justify-content: space-between; }
          #fb-global-chat .chat-body { flex: 1; overflow-y: auto; padding: 10px; max-height: 300px; }
          #fb-global-chat .chat-footer { padding: 8px; display: flex; gap: 6px; background: #1a1a2e; flex-wrap: wrap; }
          #fb-global-chat .chat-footer input { flex: 1; min-width: 80px; margin: 0; background: #1a1a2e; border: 1px solid #2a2a3e; border-radius: 8px; color: #e0e0e0; padding: 8px 12px; font-size: 14px; }
          #fb-global-chat .chat-footer .fb-btn { padding: 6px 10px; border-radius: 8px; border: none; cursor: pointer; font-size: 12px; color: #fff; }
          #fb-global-chat .fb-btn-send { background: #e94560; }
          #fb-global-chat .fb-btn-native { background: #1a6a3a; }
          #fb-global-chat .fb-btn-aichat { background: #6a1a8a; }
          .fb-bubble { padding: 8px 12px; border-radius: 12px; margin-bottom: 6px; font-size: 13px; max-width: 85%; word-break: break-word; }
          .fb-bubble-char { background: #16213e; }
          .fb-bubble-user { background: #0f3460; margin-left: auto; }
          .fb-bubble-system { background: #2a1a3a; color: #c0a0e0; font-style: italic; margin: 0 auto; text-align: center; max-width: 95%; }
          .fb-bubble-waiting { background: #1a1a2e; color: #888; font-style: italic; margin: 0 auto; text-align: center; max-width: 95%; }
          .fb-bubble-ai { background: #2a1a4a; color: #d0b0ff; }
        `;
        document.head.appendChild(style);

        // ========== 全局状态（存在window上，不随unmount丢失） ==========
        if (!window.__fbState) {
          window.__fbState = {
            selectedCharId: null,
            selectedChar: null,
            conversationId: null,
            ballVisible: false,
            chatMessages: [],
            db: null,
            timers: [],
            personaCache: null,
            worldbookCache: null
          };
        }
        var state = window.__fbState;

        // ========== IndexedDB 操作 ==========
        var DB_NAME = 'Roche_db';

        function openDB() {
          return new Promise(function(resolve, reject) {
            if (state.db) { resolve(state.db); return; }
            var req = indexedDB.open(DB_NAME);
            req.onsuccess = function() { state.db = req.result; resolve(state.db); };
            req.onerror = function() { reject(req.error); };
          });
        }

        function addRecord(storeName, record) {
          return openDB().then(function(d) {
            return new Promise(function(resolve, reject) {
              var tx = d.transaction(storeName, 'readwrite');
              var store = tx.objectStore(storeName);
              var req = store.add(record);
              req.onsuccess = function() { resolve(req.result); };
              req.onerror = function() { reject(req.error); };
            });
          });
        }

        function getRecordsByIndex(storeName, indexName, value) {
          return openDB().then(function(d) {
            return new Promise(function(resolve, reject) {
              var tx = d.transaction(storeName, 'readonly');
              var store = tx.objectStore(storeName);
              var idx = store.index(indexName);
              var req = idx.getAll(value);
              req.onsuccess = function() { resolve(req.result || []); };
              req.onerror = function() { reject(req.error); };
            });
          });
        }

        function injectUserMessage(convId, text) {
          var now = Date.now();
          var msg = {
            id: now + Math.floor(Math.random() * 1000), isMe: true, text: text, type: 'text',
            timestamp: now, conversationId: convId, sendFailed: false, isGenerating: false, isStreaming: false
          };
          return addRecord('messages', msg).then(function(id) {
            window.dispatchEvent(new CustomEvent('roche-data-changed', { detail: { source: 'floating-ball' } }));
            return id;
          });
        }

        function injectCharMessage(convId, text, senderName, senderId) {
          var now = Date.now();
          var msg = {
            id: now + Math.floor(Math.random() * 1000), isMe: false, text: text, type: 'text',
            timestamp: now, conversationId: convId, senderId: senderId || '', senderName: senderName || 'Char',
            isGenerating: false, isStreaming: false, sendFailed: false
          };
          return addRecord('messages', msg).then(function(id) {
            window.dispatchEvent(new CustomEvent('roche-data-changed', { detail: { source: 'floating-ball' } }));
            return id;
          });
        }

        function injectSystemNotice(convId, text, kind) {
          var now = Date.now();
          var msg = {
            id: now + Math.floor(Math.random() * 1000), isMe: false, text: text, type: 'system_notice',
            timestamp: now, conversationId: convId, systemNoticeKind: kind || 'info',
            senderName: 'System', senderId: '__system__',
            isGenerating: false, isStreaming: false, sendFailed: false
          };
          return addRecord('messages', msg).then(function(id) {
            window.dispatchEvent(new CustomEvent('roche-data-changed', { detail: { source: 'floating-ball' } }));
            return id;
          });
        }

        // ========== 消息历史读取 ==========
        function getRecentMessages(convId, limit) {
          limit = limit || 20;
          return getRecordsByIndex('messages', 'conversationId', convId).then(function(msgs) {
            msgs.sort(function(a, b) { return (a.timestamp || 0) - (b.timestamp || 0); });
            return msgs.slice(-limit);
          });
        }

        // ========== Persona & 世界书读取 ==========
        function getPersona(convId) {
          try {
            if (typeof roche !== 'undefined' && roche.persona && roche.persona.get) {
              return roche.persona.get({ conversationId: convId }).then(function(p) {
                return p ? (p.description || p.content || p.text || '') : null;
              }).catch(function() { return null; });
            }
          } catch(e) {}
          return Promise.resolve(null);
        }

        function getWorldBooks(convId) {
          try {
            if (typeof roche !== 'undefined' && roche.worldbook && roche.worldbook.list) {
              return roche.worldbook.list({ conversationId: convId }).catch(function() { return []; });
            }
          } catch(e) {}
          return Promise.resolve([]);
        }

        // ========== AI对话（增强版） ==========
        function aiChatEnhanced(message, convId, charId) {
          return Promise.all([
            getPersona(convId),
            getWorldBooks(convId)
          ]).then(function(results) {
            var persona = results[0];
            var worldbooks = results[1];
            var systemParts = [];
            if (persona) systemParts.push('\u3010\u89d2\u8272\u4eba\u8bbe\u3011\n' + persona);
            if (worldbooks && worldbooks.length > 0) {
              systemParts.push('\u3010\u4e16\u754c\u4e66\u3011\n' + worldbooks.map(function(wb) {
                return (wb.title || wb.name || '') + ': ' + (wb.content || wb.description || '');
              }).join('\n'));
            }
            var systemPrompt = systemParts.join('\n\n');
            var params = { message: message };
            if (convId) params.conversationId = convId;
            if (charId) params.characterId = charId;
            if (systemPrompt) params.systemPrompt = systemPrompt;
            return roche.ai.chat(params);
          });
        }

        // ========== 触发AI原生回复 ==========
        function triggerNativeReply(text) {
          return new Promise(function(resolve, reject) {
            var input = findChatInput();
            if (!input) {
              reject(new Error('\u627e\u4e0d\u5230\u804a\u5929\u8f93\u5165\u6846\uff0c\u8bf7\u5148\u624b\u52a8\u6253\u5f00\u4f1a\u8bdd'));
              return;
            }
            typeAndSend(input, text);
            resolve({ success: true, method: 'native' });
          });
        }

        function findChatInput() {
          var selectors = [
            '.chat-input-textarea', 'textarea.chat-input-textarea', '.chat-input-field textarea',
            'textarea[class*="input"]', 'textarea[class*="chat"]', 'textarea[class*="compose"]',
            'textarea[placeholder]', '[contenteditable="true"]', 'textarea',
            'input[type="text"][class*="chat"]', 'input[type="text"][class*="input"]'
          ];
          for (var i = 0; i < selectors.length; i++) {
            var el = document.querySelector(selectors[i]);
            if (el && el.offsetParent !== null) return el;
          }
          return null;
        }

        function findSendButton() {
          var selectors = [
            '.chat-input-send-button', '.chat-input-send', 'button.chat-input-send',
            'button.chat-input-send-button', '.chat-input-send-icon',
            'button[class*="send"]', 'button[class*="submit"]',
            '[class*="send-icon"]', '[class*="send-btn"]',
            'button[aria-label*="send"]', 'button[aria-label*="\u53d1\u9001"]'
          ];
          for (var i = 0; i < selectors.length; i++) {
            var el = document.querySelector(selectors[i]);
            if (el && el.offsetParent !== null) return el;
          }
          return null;
        }

        function typeAndSend(input, text) {
          input.focus();
          if (input.tagName === 'TEXTAREA' || input.type === 'text') {
            var setter = Object.getOwnPropertyDescriptor(
              window.HTMLTextAreaElement.prototype, 'value'
            ) || Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype, 'value'
            );
            if (setter) setter.call(input, text);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
          } else {
            input.innerText = text;
            input.dispatchEvent(new Event('input', { bubbles: true }));
          }
          setTimeout(function() {
            var sendBtn = findSendButton();
            if (sendBtn) { sendBtn.click(); }
            else {
              input.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true
              }));
            }
          }, 300);
        }

        // ========== 定时提醒 ==========
        function startTimer(timerId, intervalSec, text) {
          var existing = state.timers.find(function(t) { return t.id === timerId; });
          if (existing) stopTimer(timerId);
          var timerId2 = setInterval(function() {
            if (!state.conversationId || !state.selectedChar) return;
            var charName = state.selectedChar.handle || state.selectedChar.name || 'Char';
            injectCharMessage(state.conversationId, text, charName, state.selectedCharId).then(function() {
              roche.ui.toast(charName + ': ' + text);
            });
          }, intervalSec * 1000);
          state.timers.push({ id: timerId, interval: intervalSec, text: text, timerId: timerId2 });
        }

        function stopTimer(timerId) {
          var idx = state.timers.findIndex(function(t) { return t.id === timerId; });
          if (idx >= 0) { clearInterval(state.timers[idx].timerId); state.timers.splice(idx, 1); }
        }

        function stopAllTimers() {
          state.timers.forEach(function(t) { clearInterval(t.timerId); });
          state.timers = [];
        }

        // ========== 悬浮球 DOM ==========
        function ensureBall() {
          if (document.getElementById('fb-global-ball')) return;
          var ball = document.createElement('div');
          ball.id = 'fb-global-ball';
          ball.textContent = '\ud83d\udcac';
          var ballX = parseInt(localStorage.getItem('fb-ball-x')) || (window.innerWidth - 70);
          var ballY = parseInt(localStorage.getItem('fb-ball-y')) || Math.floor(window.innerHeight / 2);
          ball.style.left = ballX + 'px'; ball.style.top = ballY + 'px';
          var isDragging = false, startX, startY, startLeft, startTop;
          function onDown(x, y) { isDragging = false; startX = x; startY = y; startLeft = ballX; startTop = ballY; }
          function onMove(x, y) {
            var dx = x - startX, dy = y - startY;
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) isDragging = true;
            ballX = startLeft + dx; ballY = startTop + dy;
            ball.style.left = ballX + 'px'; ball.style.top = ballY + 'px';
          }
          function onUp() {
            if (ballX < window.innerWidth / 2) ballX = 10; else ballX = window.innerWidth - 58;
            ball.style.left = ballX + 'px';
            localStorage.setItem('fb-ball-x', ballX); localStorage.setItem('fb-ball-y', ballY);
            if (!isDragging) toggleChat();
          }
          ball.addEventListener('mousedown', function(e) {
            e.preventDefault(); onDown(e.clientX, e.clientY);
            function m(e2) { onMove(e2.clientX, e2.clientY); }
            function u() { document.removeEventListener('mousemove', m); document.removeEventListener('mouseup', u); onUp(); }
            document.addEventListener('mousemove', m); document.addEventListener('mouseup', u);
          });
          ball.addEventListener('touchstart', function(e) {
            var t = e.touches[0]; onDown(t.clientX, t.clientY);
            function m(e2) { var t2 = e2.touches[0]; onMove(t2.clientX, t2.clientY); }
            function u() { document.removeEventListener('touchmove', m); document.removeEventListener('touchend', u); onUp(); }
            document.addEventListener('touchmove', m); document.addEventListener('touchend', u);
          });
          document.body.appendChild(ball);
          state.ballVisible = true;
        }

        function removeBall() {
          var ball = document.getElementById('fb-global-ball');
          if (ball) ball.remove();
          removeChat(); state.ballVisible = false;
        }

        function toggleChat() {
          if (document.getElementById('fb-global-chat')) removeChat(); else showChat();
        }

        function showChat() {
          if (document.getElementById('fb-global-chat')) return;
          if (!state.selectedChar) { roche.ui.openApp('floating-ball-main'); return; }
          var panel = document.createElement('div');
          panel.id = 'fb-global-chat';
          panel.style.right = '10px'; panel.style.bottom = '70px';
          var cn = state.selectedChar.handle || state.selectedChar.name || 'Char';
          panel.innerHTML =
            '<div class="chat-header">' +
              '<span style="font-size:14px;font-weight:bold;color:#e0e0e0;">' + cn + '</span>' +
              '<span style="cursor:pointer;font-size:18px;color:#888;" id="fb-chat-close">\u2715</span>' +
            '</div>' +
            '<div class="chat-body" id="fb-chat-body"></div>' +
            '<div class="chat-footer">' +
              '<input type="text" id="fb-chat-input" placeholder="\u8f93\u5165\u6d88\u606f...">' +
              '<button class="fb-btn fb-btn-send" id="fb-chat-send">\u6ce8\u5165</button>' +
              '<button class="fb-btn fb-btn-native" id="fb-chat-native">DOM</button>' +
              '<button class="fb-btn fb-btn-aichat" id="fb-chat-aichat">AI</button>' +
            '</div>';
          document.body.appendChild(panel);
          panel.querySelector('#fb-chat-close').onclick = removeChat;
          panel.querySelector('#fb-chat-send').onclick = function() { sendChatMessage('inject'); };
          panel.querySelector('#fb-chat-native').onclick = function() { sendChatMessage('native'); };
          panel.querySelector('#fb-chat-aichat').onclick = function() { sendChatMessage('aichat'); };
          panel.querySelector('#fb-chat-input').onkeydown = function(e) {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage('aichat'); }
          };
          loadRecentToChat();
        }

        function loadRecentToChat() {
          if (!state.conversationId) return;
          getRecentMessages(state.conversationId, 15).then(function(msgs) {
            if (msgs.length === 0 || state.chatMessages.length > 0) return;
            msgs.forEach(function(m) {
              if (m.type === 'system_notice') state.chatMessages.push({ type: 'system', text: m.text });
              else state.chatMessages.push({ isMe: !!m.isMe, text: m.text });
            });
            renderChatMessages();
          });
        }

        function removeChat() { var p = document.getElementById('fb-global-chat'); if (p) p.remove(); }

        function renderChatMessages() {
          var body = document.getElementById('fb-chat-body');
          if (!body) return;
          body.innerHTML = '';
          state.chatMessages.forEach(function(m) {
            var b = document.createElement('div');
            if (m.type === 'system') b.className = 'fb-bubble fb-bubble-system';
            else if (m.type === 'waiting') b.className = 'fb-bubble fb-bubble-waiting';
            else if (m.type === 'ai') b.className = 'fb-bubble fb-bubble-ai';
            else b.className = 'fb-bubble ' + (m.isMe ? 'fb-bubble-user' : 'fb-bubble-char');
            b.textContent = m.text;
            body.appendChild(b);
          });
          body.scrollTop = body.scrollHeight;
        }

        function sendChatMessage(mode) {
          var input = document.getElementById('fb-chat-input');
          if (!input) return;
          var text = input.value.trim();
          if (!text || !state.conversationId) return;
          input.value = '';

          if (mode === 'native') {
            state.chatMessages.push({ isMe: true, text: text });
            state.chatMessages.push({ type: 'waiting', text: '\u23f3 \u5df2\u53d1\u9001...' });
            renderChatMessages();
            triggerNativeReply(text).then(function() {
              state.chatMessages = state.chatMessages.filter(function(m) { return m.type !== 'waiting'; });
              state.chatMessages.push({ isMe: false, text: '\u2705 \u5df2\u89e6\u53d1AI\u56de\u590d' });
              renderChatMessages();
            }).catch(function(err) {
              state.chatMessages = state.chatMessages.filter(function(m) { return m.type !== 'waiting'; });
              state.chatMessages.push({ type: 'system', text: '\u274c ' + err.message });
              renderChatMessages();
            });
          } else if (mode === 'aichat') {
            state.chatMessages.push({ isMe: true, text: text });
            state.chatMessages.push({ type: 'waiting', text: '\u23f3 AI\u601d\u8003\u4e2d...' });
            renderChatMessages();
            aiChatEnhanced(text, state.conversationId, state.selectedCharId).then(function(reply) {
              state.chatMessages = state.chatMessages.filter(function(m) { return m.type !== 'waiting'; });
              var replyText = (typeof reply === 'string') ? reply : (reply.text || reply.content || JSON.stringify(reply));
              state.chatMessages.push({ type: 'ai', text: replyText });
              var charName = state.selectedChar.handle || state.selectedChar.name || 'Char';
              injectCharMessage(state.conversationId, replyText, charName, state.selectedCharId);
              renderChatMessages();
            }).catch(function(err) {
              state.chatMessages = state.chatMessages.filter(function(m) { return m.type !== 'waiting'; });
              state.chatMessages.push({ type: 'system', text: '\u274c ' + err.message });
              renderChatMessages();
            });
          } else {
            state.chatMessages.push({ isMe: true, text: text });
            renderChatMessages();
            injectUserMessage(state.conversationId, text).then(function() { roche.ui.toast('\u7528\u6237\u6d88\u606f\u5df2\u6ce8\u5165'); });
          }
        }

        // ========== 渲染设置界面 ==========
        container.innerHTML = '<div class="roche-plugin-floating-ball"></div>';
        var root = container.querySelector('.roche-plugin-floating-ball');

        function render() {
          root.innerHTML = '';
          var h2 = document.createElement('h2'); h2.textContent = '\u60ac\u6d6e\u7403 v3.0'; root.appendChild(h2);

          var closeBtn = document.createElement('button');
          closeBtn.className = 'btn btn-secondary'; closeBtn.textContent = '\u2715 \u5173\u95ed\u63d2\u4ef6';
          closeBtn.style.cssText = 'margin-bottom:12px;width:100%;';
          closeBtn.onclick = function() { roche.ui.closeApp(); };
          root.appendChild(closeBtn);

          // --- 选择角色 ---
          var charSection = document.createElement('div'); charSection.className = 'section';
          charSection.innerHTML = '<div class="section-title">\u9009\u62e9\u89d2\u8272</div><div id="fb-char-list">\u52a0\u8f7d\u4e2d...</div>';
          root.appendChild(charSection);
          roche.character.list().then(function(chars) {
            var listEl = charSection.querySelector('#fb-char-list');
            if (!chars || chars.length === 0) { listEl.textContent = '\u6682\u65e0\u89d2\u8272'; return; }
            listEl.innerHTML = '';
            chars.forEach(function(c) {
              var item = document.createElement('div');
              item.className = 'char-list-item' + (state.selectedCharId === c.id ? ' selected' : '');
              var dn = c.handle || c.name || 'Unknown';
              item.innerHTML = (c.avatar ? '<img class="char-avatar" src="' + c.avatar + '">' :
                '<div class="char-avatar" style="background:#2a2a3e;display:flex;align-items:center;justify-content:center;font-size:14px;">' + dn.charAt(0) + '</div>') +
                '<span class="char-name">' + dn + '</span>';
              item.onclick = function() {
                state.selectedCharId = c.id; state.selectedChar = c; state.conversationId = c.conversationId;
                state.chatMessages = [];
                roche.storage.set('selectedCharId', c.id); render();
              };
              listEl.appendChild(item);
            });
          });

          // --- 悬浮球控制 ---
          var ballSection = document.createElement('div'); ballSection.className = 'section';
          var bs = state.ballVisible ? '<span class="status status-on">\u663e\u793a\u4e2d</span>' : '<span class="status status-off">\u9690\u85cf</span>';
          ballSection.innerHTML = '<div class="section-title">\u60ac\u6d6e\u7403 ' + bs + '</div>' +
            '<button class="btn btn-primary" id="fb-toggle-ball">' + (state.ballVisible ? '\u9690\u85cf' : '\u663e\u793a') + '</button>';
          root.appendChild(ballSection);
          ballSection.querySelector('#fb-toggle-ball').onclick = function() {
            if (state.ballVisible) removeBall(); else ensureBall(); render();
          };

          var dis = state.conversationId ? '' : ' disabled';

          // --- 消息注入 ---
          var msgSection = document.createElement('div'); msgSection.className = 'section';
          msgSection.innerHTML = '<div class="section-title">\u6d88\u606f\u6ce8\u5165</div>' +
            '<textarea id="fb-msg-text" placeholder="\u8f93\u5165\u8981\u6ce8\u5165\u7684\u6d88\u606f..."></textarea>' +
            '<button class="btn btn-primary" id="fb-inject-user"' + dis + '>\u7528\u6237</button>' +
            '<button class="btn btn-secondary" id="fb-inject-char"' + dis + '>\u89d2\u8272</button>' +
            '<button class="btn btn-orange" id="fb-inject-system"' + dis + '>\u7cfb\u7edf</button>' +
            '<select id="fb-sys-kind">' +
              '<option value="info">info</option><option value="friend_request">\u597d\u53cb\u8bf7\u6c42</option>' +
              '<option value="group_created">\u7fa4\u7ec4\u521b\u5efa</option><option value="call">\u7535\u8bdd</option></select>';
          root.appendChild(msgSection);
          msgSection.querySelector('#fb-inject-user').onclick = function() {
            var text = msgSection.querySelector('#fb-msg-text').value.trim();
            if (!text || !state.conversationId) return;
            injectUserMessage(state.conversationId, text).then(function() { roche.ui.toast('\u5df2\u6ce8\u5165'); msgSection.querySelector('#fb-msg-text').value = ''; });
          };
          msgSection.querySelector('#fb-inject-char').onclick = function() {
            var text = msgSection.querySelector('#fb-msg-text').value.trim();
            if (!text || !state.conversationId || !state.selectedChar) return;
            injectCharMessage(state.conversationId, text, state.selectedChar.handle || state.selectedChar.name, state.selectedCharId).then(function() { roche.ui.toast('\u5df2\u6ce8\u5165'); msgSection.querySelector('#fb-msg-text').value = ''; });
          };
          msgSection.querySelector('#fb-inject-system').onclick = function() {
            var text = msgSection.querySelector('#fb-msg-text').value.trim();
            var kind = msgSection.querySelector('#fb-sys-kind').value;
            if (!text || !state.conversationId) return;
            injectSystemNotice(state.conversationId, text, kind).then(function() { roche.ui.toast('\u5df2\u6ce8\u5165'); msgSection.querySelector('#fb-msg-text').value = ''; });
          };

          // --- AI对话 ---
          var aiSection = document.createElement('div'); aiSection.className = 'section';
          aiSection.innerHTML = '<div class="section-title">AI \u5bf9\u8bdd</div>' +
            '<p style="font-size:12px;color:var(--text2);margin:0 0 10px 0;">' +
              '<b style="color:#1a6a3a;">DOM</b>: \u5728\u804a\u5929\u9875\u81ea\u52a8\u53d1\u9001\uff0c\u8d70\u5b8c\u6574\u6d41\u7a0b<br>' +
              '<b style="color:#6a1a8a;">AI</b>: roche.ai.chat + \u81ea\u52a8\u6ce8\u5165persona/\u4e16\u754c\u4e66\uff0c\u65e0\u9700\u5728\u804a\u5929\u9875</p>' +
            '<textarea id="fb-ai-input" placeholder="\u8f93\u5165\u6d88\u606f..."></textarea>' +
            '<button class="btn btn-green" id="fb-ai-native"' + dis + '>DOM\u53d1\u9001</button>' +
            '<button class="btn btn-purple" id="fb-ai-aichat"' + dis + '>AI\u5bf9\u8bdd</button>' +
            '<div id="fb-ai-status" style="margin-top:8px;font-size:13px;"></div>';
          root.appendChild(aiSection);
          aiSection.querySelector('#fb-ai-native').onclick = function() {
            var text = aiSection.querySelector('#fb-ai-input').value.trim();
            if (!text || !state.conversationId) return;
            var s = aiSection.querySelector('#fb-ai-status'); s.textContent = '\u53d1\u9001\u4e2d...';
            triggerNativeReply(text).then(function() { s.textContent = '\u2705 \u5df2\u53d1\u9001'; aiSection.querySelector('#fb-ai-input').value = ''; })
            .catch(function(err) { s.textContent = '\u274c ' + err.message; });
          };
          aiSection.querySelector('#fb-ai-aichat').onclick = function() {
            var text = aiSection.querySelector('#fb-ai-input').value.trim();
            if (!text || !state.conversationId) return;
            var s = aiSection.querySelector('#fb-ai-status'); s.textContent = 'AI\u601d\u8003\u4e2d...';
            aiChatEnhanced(text, state.conversationId, state.selectedCharId).then(function(reply) {
              var rt = (typeof reply === 'string') ? reply : (reply.text || reply.content || JSON.stringify(reply));
              s.textContent = '\u2705 AI: ' + rt.substring(0, 100) + (rt.length > 100 ? '...' : '');
              aiSection.querySelector('#fb-ai-input').value = '';
              injectCharMessage(state.conversationId, rt, state.selectedChar.handle || state.selectedChar.name, state.selectedCharId);
            }).catch(function(err) { s.textContent = '\u274c ' + err.message; });
          };

          // --- 定时提醒 ---
          var timerSection = document.createElement('div'); timerSection.className = 'section';
          var tlh = state.timers.length > 0 ?
            state.timers.map(function(t) {
              return '<div class="timer-row"><span style="font-size:13px;color:var(--text);">' +
                t.text.substring(0, 20) + ' (' + t.interval + 's)</span>' +
                '<button class="btn btn-primary" data-stop-timer="' + t.id + '" style="padding:4px 8px;font-size:12px;">\u505c\u6b62</button></div>';
            }).join('') : '<span style="font-size:12px;color:var(--text2);">\u65e0\u5b9a\u65f6\u4efb\u52a1</span>';
          timerSection.innerHTML = '<div class="section-title">\u5b9a\u65f6\u63d0\u9192</div>' +
            '<p style="font-size:12px;color:var(--text2);margin:0 0 10px 0;">\u5b9a\u65f6\u8ba9char\u4e3b\u52a8\u53d1\u6d88\u606f</p>' +
            '<input type="text" id="fb-timer-text" placeholder="\u4f8b: \u8be5\u559d\u6c34\u4e86\u54e6~">' +
            '<div class="timer-row"><label style="margin:0;min-width:40px;">\u95f4\u9694</label>' +
            '<input type="number" id="fb-timer-interval" value="60" min="10" style="width:70px;">' +
            '<select id="fb-timer-unit"><option value="sec">\u79d2</option><option value="min">\u5206\u949f</option></select></div>' +
            '<button class="btn btn-primary" id="fb-timer-start"' + dis + '>\u5f00\u59cb</button>' +
            '<button class="btn btn-orange" id="fb-timer-stopall"' + (state.timers.length > 0 ? '' : ' disabled') + '>\u505c\u6b62\u5168\u90e8</button>' +
            '<div class="divider"></div><div id="fb-timer-list">' + tlh + '</div>';
          root.appendChild(timerSection);
          timerSection.querySelector('#fb-timer-start').onclick = function() {
            var text = timerSection.querySelector('#fb-timer-text').value.trim();
            var interval = parseInt(timerSection.querySelector('#fb-timer-interval').value) || 60;
            var unit = timerSection.querySelector('#fb-timer-unit').value;
            if (!text || !state.conversationId) return;
            if (unit === 'min') interval *= 60;
            if (interval < 10) interval = 10;
            startTimer('timer_' + Date.now(), interval, text);
            roche.ui.toast('\u5b9a\u65f6\u5df2\u5f00\u59cb'); render();
          };
          timerSection.querySelector('#fb-timer-stopall').onclick = function() { stopAllTimers(); roche.ui.toast('\u5df2\u505c\u6b62'); render(); };
          timerSection.querySelectorAll('[data-stop-timer]').forEach(function(btn) {
            btn.onclick = function() { stopTimer(btn.getAttribute('data-stop-timer')); render(); };
          });

          // --- 消息历史 ---
          var histSection = document.createElement('div'); histSection.className = 'section';
          histSection.innerHTML = '<div class="section-title">\u6d88\u606f\u5386\u53f2</div>' +
            '<button class="btn btn-secondary" id="fb-hist-load"' + dis + '>\u52a0\u8f7d\u6700\u8fd120\u6761</button>' +
            '<div id="fb-hist-result" style="margin-top:8px;font-size:13px;white-space:pre-wrap;max-height:200px;overflow-y:auto;"></div>';
          root.appendChild(histSection);
          histSection.querySelector('#fb-hist-load').onclick = function() {
            if (!state.conversationId) return;
            var r = histSection.querySelector('#fb-hist-result'); r.textContent = '\u52a0\u8f7d\u4e2d...';
            getRecentMessages(state.conversationId, 20).then(function(msgs) {
              if (msgs.length === 0) { r.textContent = '(\u65e0)'; return; }
              r.textContent = msgs.map(function(m) {
                var who = m.isMe ? '\u7528\u6237' : (m.senderName || 'Char');
                if (m.type === 'system_notice') who = '[\u7cfb\u7edf]';
                return who + ' ' + (m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : '') + ': ' + (m.text || '').substring(0, 80);
              }).join('\n');
            });
          };

          // --- 记忆操作 ---
          var memSection = document.createElement('div'); memSection.className = 'section';
          memSection.innerHTML = '<div class="section-title">\u8bb0\u5fc6\u64cd\u4f5c</div>' +
            '<textarea id="fb-mem-text" placeholder="\u5199\u5165\u4e8b\u5b9e\u8bb0\u5fc6..."></textarea>' +
            '<button class="btn btn-primary" id="fb-mem-write"' + dis + '>\u5199\u5165</button>' +
            '<button class="btn btn-secondary" id="fb-mem-read"' + dis + '>\u8bfb\u53d6</button>' +
            '<div id="fb-mem-result" style="margin-top:8px;font-size:13px;white-space:pre-wrap;"></div>';
          root.appendChild(memSection);
          memSection.querySelector('#fb-mem-write').onclick = function() {
            var text = memSection.querySelector('#fb-mem-text').value.trim();
            if (!text || !state.conversationId) return;
            roche.memory.write({ conversationId: state.conversationId, summaryText: text, who: ['\u7528\u6237'], action: text, when: '\u521a\u521a', where: '\u60ac\u6d6e\u7403', source: 'floating-ball' })
            .then(function() { roche.ui.toast('\u5df2\u5199\u5165'); memSection.querySelector('#fb-mem-text').value = ''; });
          };
          memSection.querySelector('#fb-mem-read').onclick = function() {
            if (!state.conversationId) return;
            memSection.querySelector('#fb-mem-result').textContent = '\u8bfb\u53d6\u4e2d...';
            roche.memory.getLongTerm({ conversationId: state.conversationId, limit: 20 }).then(function(lt) {
              var lines = [];
              if (lt.core && lt.core.summary) lines.push('[\u6838\u5fc3] ' + lt.core.summary);
              (lt.facts || []).forEach(function(f) { lines.push('[\u4e8b\u5b9e] ' + (f.summaryText || f.action || f.text || '')); });
              memSection.querySelector('#fb-mem-result').textContent = lines.length > 0 ? lines.join('\n') : '(\u65e0)';
            });
          };
        }

        // ========== 初始化 ==========
        roche.storage.get('selectedCharId').then(function(sid) {
          if (sid) {
            state.selectedCharId = sid;
            return roche.character.get(sid).then(function(c) {
              state.selectedChar = c; state.conversationId = c.conversationId;
            }).catch(function() {});
          }
        }).then(function() {
          render();
          if (state.ballVisible) ensureBall();
        });
      },

      async unmount(container, roche) {
        container.replaceChildren();
      }
    }
  ]
});
